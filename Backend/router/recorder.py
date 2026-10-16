"""
HTTP(S) Script Recorder router
Manages mitmproxy-based proxy sessions for JMeter-style recording.

Endpoints:
  POST /recorder/start        — start a mitmproxy instance on the given port
  POST /recorder/stop         — stop the mitmproxy instance
  GET  /recorder/session/{id}/requests — return captured requests for a session
  DELETE /recorder/session/{id} — clear / delete a session
"""

import os
import sys
import json
import time
import threading
import subprocess
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/recorder", tags=["recorder"])

# ── In-memory session store ──────────────────────────────────────────────────
# { session_id: { "process": Popen|None, "requests": [...], "port": int, "filter": str } }
_sessions: dict = {}
_lock = threading.Lock()


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class StartRequest(BaseModel):
    session_id: int
    port: int = 8888
    filter: Optional[str] = ""


class StopRequest(BaseModel):
    session_id: int


# ── mitmproxy inline addon script (written to a temp file) ──────────────────

ADDON_TEMPLATE = '''
import json, os, time, threading

CAPTURE_FILE = {capture_file!r}
URL_FILTER    = {url_filter!r}

class K6Recorder:
    def __init__(self):
        self.requests = []
        self._lock = threading.Lock()

    def response(self, flow):
        url = flow.request.pretty_url
        if URL_FILTER and URL_FILTER not in url:
            return
        # Skip common noise
        skip_ext = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
                    ".woff", ".woff2", ".ttf", ".css", ".js")
        if any(url.lower().endswith(e) for e in skip_ext):
            return
        skip_hosts = ("google-analytics", "analytics", "facebook",
                      "gtm.", "hotjar", "cdn.", "fonts.googleapis")
        if any(h in url for h in skip_hosts):
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
                resp_body = flow.response.content.decode("utf-8", errors="replace")[:2048]
            except Exception:
                pass

            entry = {{
                "id": int(time.time() * 1000),
                "method": flow.request.method,
                "url": url,
                "status": flow.response.status_code,
                "duration": int(flow.response.timestamp_end * 1000 - flow.request.timestamp_start * 1000),
                "size": len(flow.response.content),
                "body": body,
                "headers": headers,
                "responseBody": resp_body,
                "contentType": flow.response.headers.get("content-type", ""),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }}

            with self._lock:
                self.requests.append(entry)

            # Persist to file so the FastAPI process can read it
            with self._lock:
                with open(CAPTURE_FILE, "w") as f:
                    json.dump(self.requests, f)

        except Exception as e:
            pass


addons = [K6Recorder()]
'''


def _capture_file(session_id: int) -> str:
    base = os.path.join(os.path.dirname(__file__), "..", "recorder_sessions")
    os.makedirs(base, exist_ok=True)
    return os.path.abspath(os.path.join(base, f"{session_id}_captures.json"))


def _addon_file(session_id: int) -> str:
    base = os.path.join(os.path.dirname(__file__), "..", "recorder_sessions")
    os.makedirs(base, exist_ok=True)
    return os.path.abspath(os.path.join(base, f"{session_id}_addon.py"))


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/start")
def start_recording(req: StartRequest):
    with _lock:
        existing = _sessions.get(req.session_id)
        if existing and existing.get("process") and existing["process"].poll() is None:
            raise HTTPException(status_code=400, detail="Session already recording")

    capture_file = _capture_file(req.session_id)
    addon_file   = _addon_file(req.session_id)

    # Write the mitmproxy addon script
    addon_code = ADDON_TEMPLATE.format(
        capture_file=capture_file,
        url_filter=req.filter or "",
    )
    with open(addon_file, "w") as f:
        f.write(addon_code)

    # Clear previous captures
    if os.path.exists(capture_file):
        os.remove(capture_file)

    # Launch mitmproxy (mitmdump — headless)
    cmd = [
        sys.executable, "-m", "mitmproxy.tools.main",
        "--mode", "regular",
        "--listen-port", str(req.port),
        "--script", addon_file,
        "--quiet",
    ]

    # Fallback: try mitmdump directly
    try:
        proc = subprocess.Popen(
            ["mitmdump", "--listen-port", str(req.port), "--script", addon_file, "--quiet"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="No module named 'mitmproxy' — install it with: pip install mitmproxy"
        )

    with _lock:
        _sessions[req.session_id] = {
            "process": proc,
            "port": req.port,
            "filter": req.filter or "",
            "capture_file": capture_file,
            "requests": [],
        }

    return {"message": f"Proxy started on port {req.port}", "session_id": req.session_id}


@router.post("/stop")
def stop_recording(req: StopRequest):
    with _lock:
        session = _sessions.get(req.session_id)

    if not session:
        return {"message": "Session not found (already stopped?)"}

    proc = session.get("process")
    if proc and proc.poll() is None:
        try:
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
            else:
                proc.terminate()
        except Exception as e:
            print(f"[recorder] Error stopping proxy: {e}")

    return {"message": "Proxy stopped", "session_id": req.session_id}


@router.get("/session/{session_id}/requests")
def get_requests(session_id: int):
    capture_file = _capture_file(session_id)
    if not os.path.exists(capture_file):
        return {"requests": [], "count": 0}

    try:
        with open(capture_file, "r") as f:
            requests = json.load(f)
        return {"requests": requests, "count": len(requests)}
    except Exception:
        return {"requests": [], "count": 0}


@router.delete("/session/{session_id}")
def clear_session(session_id: int):
    capture_file = _capture_file(session_id)
    if os.path.exists(capture_file):
        os.remove(capture_file)

    addon_file = _addon_file(session_id)
    if os.path.exists(addon_file):
        os.remove(addon_file)

    with _lock:
        _sessions.pop(session_id, None)

    return {"message": "Session cleared"}
