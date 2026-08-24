# ═══════════════════════════════════════════════════════════════════════════
# swagger_import.py — place this file next to main.py, models.py, auth.py etc.
# ═══════════════════════════════════════════════════════════════════════════
import json
import requests as _requests
from urllib.parse import urlparse as _urlparse


def discover_apis_from_swagger(swagger_url: str, timeout: int = 15):
    """
    Fetches a swagger.json / openapi.json URL and returns a flat list of
    discoverable API operations, supporting both Swagger 2.0 (host/basePath/
    schemes) and OpenAPI 3.x (servers[]) spec shapes.

    Returns (never raises):
        {"apis": [...], "base_url": "...", "count": N}
        or:
        {"error": "human readable message"}
    """
    try:
        resp = _requests.get(swagger_url, timeout=timeout)
        resp.raise_for_status()
        spec = resp.json()
    except _requests.exceptions.Timeout:
        return {"error": f"Request to the Swagger/OpenAPI URL timed out after {timeout}s."}
    except _requests.exceptions.ConnectionError as e:
        return {"error": f"Could not reach the Swagger/OpenAPI URL: {str(e)[:200]}"}
    except json.JSONDecodeError:
        return {"error": "That URL did not return valid JSON. Make sure it points to the raw swagger.json/openapi.json file, not the Swagger UI page."}
    except _requests.exceptions.HTTPError as e:
        return {"error": f"The Swagger/OpenAPI URL returned an error: {str(e)[:200]}"}
    except Exception as e:
        return {"error": f"Unexpected error fetching the spec: {str(e)[:200]}"}

    if not isinstance(spec, dict) or "paths" not in spec:
        return {"error": "This doesn't look like a valid Swagger/OpenAPI spec — no 'paths' field was found."}

    # ── Determine base URL: OpenAPI 3.x uses servers[], Swagger 2.0 uses
    #    host/basePath/schemes. Fall back to the spec URL's own origin if
    #    neither is present. ────────────────────────────────────────────────
    base_url = ""
    if isinstance(spec.get("servers"), list) and spec["servers"]:
        base_url = spec["servers"][0].get("url", "")
    elif "host" in spec:
        scheme = (spec.get("schemes") or ["https"])[0]
        host = spec.get("host", "")
        base_path = spec.get("basePath", "")
        base_url = f"{scheme}://{host}{base_path}"
    else:
        try:
            parsed = _urlparse(swagger_url)
            base_url = f"{parsed.scheme}://{parsed.netloc}"
        except Exception:
            base_url = ""

    base_url = base_url.rstrip("/")

    apis = []
    valid_methods = {"get", "post", "put", "patch", "delete"}

    for path, path_item in spec.get("paths", {}).items():
        if not isinstance(path_item, dict):
            continue
        for method, operation in path_item.items():
            if method.lower() not in valid_methods or not isinstance(operation, dict):
                continue

            apis.append({
                "method": method.upper(),
                "path": path,
                "summary": operation.get("summary") or operation.get("operationId") or "",
                "operationId": operation.get("operationId", ""),
                "base_url": base_url,
                "full_url": f"{base_url}{path}",
                "parameters": [
                    {
                        "name": p.get("name", ""),
                        "in": p.get("in", ""),
                        "required": p.get("required", False),
                    }
                    for p in operation.get("parameters", [])
                    if isinstance(p, dict)
                ],
            })

    if not apis:
        return {"error": "The spec was read successfully but contained no usable GET/POST/PUT/PATCH/DELETE operations."}

    return {"apis": apis, "base_url": base_url, "count": len(apis)}