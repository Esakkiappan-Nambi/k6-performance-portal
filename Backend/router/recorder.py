"""
HTTP(S) Script Recorder router
Manages mitmproxy-based proxy sessions for JMeter-style recording with
full persistent session history on disk and SQLite/JSON storage.

Endpoints:
  GET    /recorder/sessions           — list all recorded sessions
  GET    /recorder/session/{id}/requests — return captured requests for a session
  POST   /recorder/start              — start mitmproxy on given port
  POST   /recorder/stop               — stop mitmproxy
  POST   /recorder/session/save       — create or update session metadata
  DELETE /recorder/session/{id}       — delete a session and its captured data
  DELETE /recorder/session/{id}/clear — clear requests in a session
"""

import os
import sys
import json
import time
import importlib.util
import threading
import subprocess
from typing import Annotated, Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from models import User

router = APIRouter(prefix="/recorder", tags=["recorder"])
CurrentUser = Annotated[User, Depends(get_current_user)]

# ── Paths & Persistent Store ──────────────────────────────────────────────────
BASE_DIR = os.path.abspath(os.getenv(
    "RECORDER_DATA_DIR",
    os.path.join(os.path.dirname(__file__), "..", "recorder_sessions"),
))
os.makedirs(BASE_DIR, exist_ok=True)
INDEX_FILE = os.path.join(BASE_DIR, "sessions_meta.json")
LEGACY_INDEX_FILE = os.path.join(BASE_DIR, "sessions_meta.legacy.json")

# In-memory session process store: { session_id: { "process": Popen, "port": int } }
_active_processes: Dict[int, Any] = {}
_lock = threading.Lock()


def _load_index() -> List[Dict[str, Any]]:
    if not os.path.exists(INDEX_FILE):
        return []
    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            items = json.load(f)
        if not isinstance(items, list):
            raise ValueError("Recorder session index must be a list.")
        return items
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        raise RuntimeError("Could not read the recorder session index.") from exc


def _save_index(items: List[Dict[str, Any]]) -> None:
    temp_path = f"{INDEX_FILE}.tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)
    os.replace(temp_path, INDEX_FILE)


def _load_legacy_index() -> List[Dict[str, Any]]:
    if not os.path.exists(LEGACY_INDEX_FILE):
        return []
    with open(LEGACY_INDEX_FILE, "r", encoding="utf-8") as f:
        items = json.load(f)
    if not isinstance(items, list):
        raise ValueError("Legacy recorder session index must be a list.")
    return items


def _migrate_unowned_sessions() -> None:
    """Keep legacy recordings on disk but remove them from all user-visible sessions."""
    if not os.path.exists(INDEX_FILE):
        return

    with _lock:
        items = _load_index()
        owned = []
        unowned = []
        for session in items:
            owner_id = session.get("user_id")
            if isinstance(owner_id, int) and not isinstance(owner_id, bool):
                owned.append(session)
            else:
                unowned.append(session)
        if not unowned:
            return

        legacy = _load_legacy_index()
        legacy_ids = {session.get("id") for session in legacy}
        legacy.extend(session for session in unowned if session.get("id") not in legacy_ids)

        temp_path = f"{LEGACY_INDEX_FILE}.tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(legacy, f, indent=2)
        os.replace(temp_path, LEGACY_INDEX_FILE)
        _save_index(owned)


def _find_owned_session(
    index: List[Dict[str, Any]], session_id: int, user_id: int
) -> Dict[str, Any]:
    session = next((item for item in index if item.get("id") == session_id), None)
    if session is None or session.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Recording session not found.")
    return session


def _ensure_session_id_available(
    index: List[Dict[str, Any]], session_id: int
) -> None:
    if any(item.get("id") == session_id for item in index) or os.path.exists(_capture_file(session_id)):
        raise HTTPException(status_code=409, detail="Recording session ID is already in use.")
    if any(item.get("id") == session_id for item in _load_legacy_index()):
        raise HTTPException(status_code=409, detail="Recording session ID is unavailable.")


def _stop_proxy_process(active: Optional[Dict[str, Any]]) -> None:
    proc = active.get("process") if active else None
    if not proc or proc.poll() is not None:
        return
    try:
        if sys.platform == "win32":
            result = subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                capture_output=True,
                timeout=10,
            )
            if result.returncode and proc.poll() is None:
                raise RuntimeError(result.stderr.decode("utf-8", errors="replace"))
        else:
            proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)
    except (OSError, RuntimeError, subprocess.SubprocessError) as exc:
        raise HTTPException(status_code=500, detail="Could not stop the proxy process.") from exc


_migrate_unowned_sessions()


def _capture_file(session_id: int) -> str:
    return os.path.join(BASE_DIR, f"{session_id}_captures.json")


def _addon_file(session_id: int) -> str:
    return os.path.join(BASE_DIR, f"{session_id}_addon.py")


def _read_captures(session_id: int) -> List[Dict[str, Any]]:
    path = _capture_file(session_id)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _write_captures(session_id: int, requests: List[Dict[str, Any]]) -> None:
    path = _capture_file(session_id)
    temp_path = f"{path}.tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(requests, f, indent=2)
    os.replace(temp_path, path)


# ── mitmproxy inline addon template ───────────────────────────────────────────
ADDON_TEMPLATE = '''# Autogenerated K6 Recorder Addon
import json, os, time, threading

CAPTURE_FILE = {capture_file!r}
URL_FILTER   = {url_filter!r}

class K6Recorder:
    def __init__(self):
        self._lock = threading.Lock()
        self.requests = []
        if os.path.exists(CAPTURE_FILE):
            try:
                with open(CAPTURE_FILE, "r", encoding="utf-8") as f:
                    self.requests = json.load(f)
            except Exception:
                self.requests = []

    def response(self, flow):
        url = flow.request.pretty_url
        if URL_FILTER and URL_FILTER.lower() not in url.lower():
            return

        # Skip noise assets
        skip_ext = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
                    ".woff", ".woff2", ".ttf", ".eot", ".css", ".map")
        if any(url.lower().endswith(e) for e in skip_ext):
            return

        skip_hosts = ("google-analytics", "analytics", "facebook",
                      "gtm.", "hotjar", "clarity.ms", "fonts.googleapis",
                      "browser-intake", "datadoghq")
        if any(h in url.lower() for h in skip_hosts):
            return

        try:
            headers = dict(flow.request.headers)
            body = ""
            try:
                body = flow.request.content.decode("utf-8", errors="replace")
            except Exception:
                pass

            resp_body = ""
            try:
                resp_body = flow.response.content.decode("utf-8", errors="replace")[:4096]
            except Exception:
                pass

            duration = 0
            if flow.response.timestamp_end and flow.request.timestamp_start:
                duration = int((flow.response.timestamp_end - flow.request.timestamp_start) * 1000)

            entry = {{
                "id": int(time.time() * 1000) + len(self.requests),
                "method": flow.request.method.upper(),
                "url": url,
                "status": flow.response.status_code,
                "duration": duration,
                "size": len(flow.response.content or b""),
                "body": body,
                "headers": headers,
                "responseBody": resp_body,
                "contentType": flow.response.headers.get("content-type", ""),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }}

            with self._lock:
                self.requests.append(entry)
                with open(CAPTURE_FILE, "w", encoding="utf-8") as f:
                    json.dump(self.requests, f)

        except Exception as e:
            pass

addons = [K6Recorder()]
'''


# ── Schemas ───────────────────────────────────────────────────────────────────

class SessionMeta(BaseModel):
    id: int
    name: str
    port: int = 8888
    filter: Optional[str] = ""
    status: str = "idle"   # idle | recording | stopped
    request_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class StartRequest(BaseModel):
    session_id: int
    name: Optional[str] = "Recording Session"
    port: int = 8888
    filter: Optional[str] = ""
    append: bool = True


class StopRequest(BaseModel):
    session_id: int


class SaveSessionRequest(BaseModel):
    session_id: Optional[int] = None
    name: str
    filter: Optional[str] = ""
    port: Optional[int] = 8888
    requests: Optional[List[Dict[str, Any]]] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/sessions")
def list_sessions(current_user: CurrentUser):
    """List only the authenticated user's saved recording sessions."""
    with _lock:
        index = [
            session for session in _load_index()
            if session.get("user_id") == current_user.id
        ]
        # Update live status
        for s in index:
            sid = s.get("id")
            proc = _active_processes.get(sid, {}).get("process")
            if proc and proc.poll() is None:
                s["status"] = "recording"
            elif s.get("status") == "recording":
                s["status"] = "stopped"
            # Refresh count
            c_file = _capture_file(sid)
            if os.path.exists(c_file):
                try:
                    with open(c_file, "r", encoding="utf-8") as f:
                        s["request_count"] = len(json.load(f))
                except Exception:
                    pass
        return {
            "sessions": [
                {
                    "id": session.get("id"),
                    "name": session.get("name"),
                    "port": session.get("port"),
                    "filter": session.get("filter"),
                    "status": session.get("status"),
                    "request_count": session.get("request_count", 0),
                    "created_at": session.get("created_at"),
                    "updated_at": session.get("updated_at"),
                }
                for session in index
            ]
        }


@router.get("/session/{session_id}/requests")
def get_requests(session_id: int, current_user: CurrentUser):
    """Return all captured requests for a specific recording session."""
    with _lock:
        _find_owned_session(_load_index(), session_id, current_user.id)
        reqs = _read_captures(session_id)
    return {"requests": reqs, "count": len(reqs), "session_id": session_id}


@router.delete("/session/{session_id}/requests/{request_id}")
def delete_request(session_id: int, request_id: int, current_user: CurrentUser):
    """Delete one captured request and persist the updated session."""
    with _lock:
        index = _load_index()
        _find_owned_session(index, session_id, current_user.id)
        active = _active_processes.get(session_id)
        process = active.get("process") if active else None
        if process and process.poll() is None:
            raise HTTPException(
                status_code=409,
                detail="Stop recording before deleting a captured request.",
            )

        requests = _read_captures(session_id)
        remaining = [request for request in requests if str(request.get("id")) != str(request_id)]
        if len(remaining) == len(requests):
            raise HTTPException(status_code=404, detail="Captured request not found.")

        try:
            _write_captures(session_id, remaining)
        except OSError as exc:
            raise HTTPException(status_code=500, detail="Could not save the updated recording.") from exc

        for session in index:
            if session.get("id") == session_id:
                session["request_count"] = len(remaining)
                session["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                break
        _save_index(index)

    return {
        "message": "Captured request deleted.",
        "session_id": session_id,
        "request_id": request_id,
        "request_count": len(remaining),
    }


@router.post("/start")
def start_recording(req: StartRequest, current_user: CurrentUser):
    """
    Start mitmproxy for this session.
    Runs via Python module to bypass Windows Application Control policy.
    """
    with _lock:
        index = _load_index()
        session = _find_owned_session(index, req.session_id, current_user.id)
        existing = _active_processes.get(req.session_id)
        if existing and existing.get("process") and existing["process"].poll() is None:
            raise HTTPException(status_code=400, detail="Session is already actively recording")
        for session_id, active in _active_processes.items():
            process = active.get("process")
            if (
                session_id != req.session_id
                and active.get("port") == req.port
                and process
                and process.poll() is None
            ):
                raise HTTPException(
                    status_code=409,
                    detail=f"Port {req.port} is already in use by another recording session.",
                )

        if importlib.util.find_spec("mitmproxy") is None:
            raise HTTPException(
                status_code=500,
                detail="mitmproxy is not installed. Rebuild the backend image with the updated requirements.",
            )

        capture_file = _capture_file(req.session_id)
        addon_file = _addon_file(req.session_id)
        if not req.append:
            try:
                _write_captures(req.session_id, [])
            except OSError as exc:
                raise HTTPException(status_code=500, detail="Could not clear previous captures.") from exc

        addon_code = ADDON_TEMPLATE.format(
            capture_file=capture_file,
            url_filter=req.filter or "",
        )
        with open(addon_file, "w", encoding="utf-8") as f:
            f.write(addon_code)

        cmd = [
            sys.executable,
            "-c",
            "from mitmproxy.tools.main import mitmdump; mitmdump()",
            "--mode", "regular",
            "--listen-host", os.getenv("RECORDER_LISTEN_HOST", "127.0.0.1"),
            "--listen-port", str(req.port),
            "--script", addon_file,
            "--quiet",
        ]

        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
        except OSError as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to start mitmproxy recorder: {exc}",
            ) from exc

        for _ in range(15):
            if proc.poll() is not None:
                _, stderr = proc.communicate()
                error = stderr.decode("utf-8", errors="replace").strip() if stderr else ""
                detail = f"mitmproxy exited during startup: {error[:1000]}" if error else (
                    "mitmproxy exited during startup."
                )
                raise HTTPException(status_code=500, detail=detail)
            time.sleep(0.1)

        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        _active_processes[req.session_id] = {
            "process": proc,
            "port": req.port,
            "filter": req.filter or "",
            "capture_file": capture_file,
        }
        session["status"] = "recording"
        session["port"] = req.port
        session["filter"] = req.filter or ""
        session["updated_at"] = now_iso
        if not req.append:
            session["request_count"] = 0
        try:
            _save_index(index)
        except OSError as exc:
            _active_processes.pop(req.session_id, None)
            session["status"] = "stopped"
            _stop_proxy_process({"process": proc})
            raise HTTPException(status_code=500, detail="Could not save recorder session state.") from exc

    return {
        "message": f"Proxy started on port {req.port}",
        "session_id": req.session_id,
        "port": req.port
    }


@router.post("/stop")
def stop_recording(req: StopRequest, current_user: CurrentUser):
    """Stop the mitmproxy process for this session."""
    with _lock:
        index = _load_index()
        session = _find_owned_session(index, req.session_id, current_user.id)
        active = _active_processes.get(req.session_id)
        _stop_proxy_process(active)
        _active_processes.pop(req.session_id, None)

        captures = _read_captures(req.session_id)
        session["status"] = "stopped"
        session["request_count"] = len(captures)
        session["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        _save_index(index)

    return {
        "message": "Proxy stopped",
        "session_id": req.session_id,
        "request_count": len(captures)
    }


@router.post("/session/save")
def save_session(req: SaveSessionRequest, current_user: CurrentUser):
    """Create or update a session owned by the authenticated user."""
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with _lock:
        index = _load_index()
        session_id = req.session_id
        if session_id is None:
            session_id = int(time.time() * 1000)
            while (
                any(item.get("id") == session_id for item in index)
                or os.path.exists(_capture_file(session_id))
                or any(item.get("id") == session_id for item in _load_legacy_index())
            ):
                session_id += 1
            session = None
        else:
            session = next((item for item in index if item.get("id") == session_id), None)
            if session is None:
                _ensure_session_id_available(index, session_id)
            else:
                _find_owned_session(index, session_id, current_user.id)
                active = _active_processes.get(session_id)
                process = active.get("process") if active else None
                if process and process.poll() is None and req.requests is not None:
                    raise HTTPException(
                        status_code=409,
                        detail="Stop recording before replacing captured requests.",
                    )

        if session is None:
            session = {
                "id": session_id,
                "user_id": current_user.id,
                "name": req.name,
                "port": req.port or 8888,
                "filter": req.filter or "",
                "status": "stopped",
                "request_count": 0,
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            index.insert(0, session)
        else:
            session["name"] = req.name
            session["filter"] = req.filter or ""
            session["port"] = req.port or session.get("port") or 8888
            session["updated_at"] = now_iso

        if req.requests is not None:
            try:
                _write_captures(session_id, req.requests)
            except OSError as exc:
                raise HTTPException(status_code=500, detail="Could not save captured requests.") from exc

        count = len(req.requests) if req.requests is not None else len(_read_captures(session_id))
        session["request_count"] = count
        _save_index(index)

    return {"message": "Session saved", "session_id": session_id, "request_count": count}


@router.delete("/session/{session_id}/clear")
def clear_session_requests(session_id: int, current_user: CurrentUser):
    """Clear all captured requests for a session without deleting the session itself."""
    with _lock:
        index = _load_index()
        session = _find_owned_session(index, session_id, current_user.id)
        active = _active_processes.get(session_id)
        process = active.get("process") if active else None
        if process and process.poll() is None:
            raise HTTPException(
                status_code=409,
                detail="Stop recording before clearing captured requests.",
            )
        try:
            _write_captures(session_id, [])
        except OSError as exc:
            raise HTTPException(status_code=500, detail="Could not clear the saved recording.") from exc

        session["request_count"] = 0
        session["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        _save_index(index)

    return {"message": "Session requests cleared", "session_id": session_id}


@router.delete("/session/{session_id}")
def delete_session(session_id: int, current_user: CurrentUser):
    """Permanently delete a recording session and its captured files."""
    with _lock:
        index = _load_index()
        session = _find_owned_session(index, session_id, current_user.id)
        active = _active_processes.get(session_id)
        _stop_proxy_process(active)
        _active_processes.pop(session_id, None)
        index.remove(session)
        _save_index(index)

    for path in (_capture_file(session_id), _addon_file(session_id)):
        try:
            os.remove(path)
        except FileNotFoundError:
            pass
        except OSError as exc:
            raise HTTPException(status_code=500, detail="Session was deleted, but its files could not be removed.") from exc

    return {"message": "Session deleted successfully", "session_id": session_id}
