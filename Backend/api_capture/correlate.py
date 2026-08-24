"""
api_capture/correlate.py
────────────────────────
After raw requests are captured, this module:

1. Detects dynamic values (tokens, IDs, session keys) in response bodies
2. Finds where those values are re-used in later request bodies / headers / URLs
3. Injects extractVariable + variableName into the scenario so the k6 script
   can chain them correctly (e.g. login → token → authenticated requests)

Common real-world chain this solves:
    POST /login      → response: { "access_token": "eyJ..." }
    GET  /profile    → Authorization: Bearer eyJ...   ← must use extracted token
    POST /orders     → body: { "userId": 42 }         ← must use extracted userId
"""

import json
import re
from typing import Optional


# ── Dynamic value patterns ────────────────────────────────────────────────────
# Each tuple: (regex_pattern, suggested_var_name | None)
# Pattern must have exactly 2 capture groups: (key, value)
# If suggested_var_name is None, var name is derived from the key.

DYNAMIC_PATTERNS = [
    # JWT / OAuth tokens
    (r'"(access_token|token|jwt|id_token|refresh_token)"\s*:\s*"([A-Za-z0-9\-_\.]{10,})"', "token"),

    # Generic auth / api key
    (r'"(auth|bearer|apiKey|api_key|authToken|sessionToken|session_token)"\s*:\s*"([^"]{6,})"', "auth_token"),

    # Numeric IDs — user, order, product, etc.
    (r'"(id|userId|user_id|orderId|order_id|productId|product_id|customerId|customer_id)"\s*:\s*(\d+)', None),

    # UUID / GUID strings
    (r'"(uuid|guid|requestId|request_id|correlationId|correlation_id|traceId|trace_id)"\s*:\s*"([0-9a-fA-F\-]{32,})"', None),

    # Session / CSRF
    (r'"(sessionId|session_id|csrfToken|csrf_token|xsrfToken|_csrf)"\s*:\s*"([^"]{8,})"', "session_id"),

    # Pagination cursors
    (r'"(cursor|nextCursor|next_cursor|pageToken|page_token)"\s*:\s*"([^"]{4,})"', "cursor"),
]

# Minimum value length — skip trivially short values like "1" or "ok"
MIN_VALUE_LENGTH = 4

# Headers where we look for token re-use downstream
AUTH_HEADER_KEYS = {"authorization", "x-auth-token", "x-api-key", "x-access-token", "cookie"}


# ── Internal helpers ──────────────────────────────────────────────────────────

def _body_to_str(body) -> str:
    """Safely convert a body (dict, list, str, None) to a string for scanning."""
    if body is None:
        return ""
    if isinstance(body, str):
        return body
    try:
        return json.dumps(body)
    except Exception:
        return str(body)


def _headers_to_str(headers) -> str:
    """Safely convert headers (dict or str) to a string for scanning."""
    if not headers:
        return ""
    if isinstance(headers, dict):
        try:
            return json.dumps(headers)
        except Exception:
            return str(headers)
    return str(headers)


def _step_to_str(step: dict) -> str:
    """Combine all searchable fields of a step into one string for scanning."""
    parts = [
        step.get("url", ""),
        _body_to_str(step.get("body")),
        _headers_to_str(step.get("headers")),
    ]
    return " ".join(parts)


def _extract_dynamic_values(body_text: str) -> list[dict]:
    """
    Scan a response body string for dynamic values worth extracting.

    Returns a list of dicts:
    {
        "json_path":  str,   # key name, e.g. "access_token"
        "var_name":   str,   # suggested k6 variable name
        "value":      str,   # the actual sampled value
    }
    """
    if not body_text:
        return []

    findings: list[dict] = []
    seen_keys: set = set()          # avoid duplicate extractions for same key

    for pattern, suggested_name in DYNAMIC_PATTERNS:
        for match in re.finditer(pattern, body_text, re.IGNORECASE):
            key   = match.group(1)
            value = str(match.group(2))

            # Skip trivially short values
            if len(value) < MIN_VALUE_LENGTH:
                continue

            # Deduplicate by key name
            key_lower = key.lower()
            if key_lower in seen_keys:
                continue
            seen_keys.add(key_lower)

            var_name = suggested_name or f"extracted_{_to_snake_case(key)}"

            findings.append({
                "json_path": key,
                "var_name":  var_name,
                "value":     value,
            })

    return findings


def _to_snake_case(name: str) -> str:
    """Convert camelCase / PascalCase to snake_case for clean variable names."""
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def _value_used_downstream(value: str, steps: list[dict], from_index: int) -> bool:
    """
    Return True if `value` appears in any step that comes after `from_index`.
    Checks URL, body, and headers.
    """
    for step in steps[from_index + 1:]:
        if value in _step_to_str(step):
            return True
    return False


def _replace_value_in_step(step: dict, old_value: str, new_placeholder: str) -> dict:
    """
    Replace `old_value` with `new_placeholder` inside a step's
    URL, body (str or dict), and headers (str or dict).
    Returns a new step dict (does not mutate the original).
    """
    step = dict(step)  # shallow copy

    # ── URL ───────────────────────────────────────────────────────────────────
    if old_value in step.get("url", ""):
        step["url"] = step["url"].replace(old_value, new_placeholder)

    # ── Body ──────────────────────────────────────────────────────────────────
    body = step.get("body")
    if body is not None:
        body_str = _body_to_str(body)
        if old_value in body_str:
            replaced = body_str.replace(old_value, new_placeholder)
            # Try to keep it as a dict if it was a dict
            try:
                step["body"] = json.loads(replaced)
            except Exception:
                step["body"] = replaced

    # ── Headers ───────────────────────────────────────────────────────────────
    headers = step.get("headers")
    if headers is not None:
        headers_str = _headers_to_str(headers)
        if old_value in headers_str:
            replaced = headers_str.replace(old_value, new_placeholder)
            try:
                step["headers"] = json.loads(replaced)
            except Exception:
                step["headers"] = replaced

    return step


# ── Public API ────────────────────────────────────────────────────────────────

def correlate(
    scenario:  list[dict],
    responses: Optional[list[Optional[str]]] = None,
) -> list[dict]:
    """
    Enhance scenario steps with variable extraction + downstream injection.

    Parameters
    ----------
    scenario  : list of request dicts (output of capture.py / deduplicate)
    responses : optional list of response body strings, same length as scenario.
                When provided, dynamic values found in each response are
                extracted and their occurrences in later steps are replaced
                with k6-style ``{{var_name}}`` placeholders.
                When omitted (common at capture time), the scenario is returned
                unchanged — correlation can be re-run after a pre-flight pass
                that collects actual response bodies.

    Returns
    -------
    Enhanced scenario list.  Steps that produce a value get:
        extractVariable = True
        variableName    = "token"          (or whatever was detected)
        jsonPath        = "$.access_token"

    Steps that consume the value get their raw value replaced with:
        "{{token}}"     in body / headers / URL
    """
    if not responses:
        # Nothing to correlate without response data — return as-is
        return scenario

    if len(responses) != len(scenario):
        # Mismatched lengths are a programming error; return safely
        print(
            f"[correlate] Warning: responses length ({len(responses)}) "
            f"!= scenario length ({len(scenario)}). Skipping correlation."
        )
        return scenario

    enhanced = [dict(s) for s in scenario]   # shallow-copy each step

    for i, resp_body in enumerate(responses):
        if not resp_body:
            continue

        body_str = _body_to_str(resp_body)
        findings = _extract_dynamic_values(body_str)

        for f in findings:
            value    = f["value"]
            var_name = f["var_name"]
            path     = f["json_path"]

            # Only bother extracting if the value actually appears downstream
            if not _value_used_downstream(value, enhanced, i):
                continue

            # Mark this step as the extraction point
            # (don't overwrite if a previous finding already claimed it)
            if not enhanced[i].get("extractVariable"):
                enhanced[i]["extractVariable"] = True
                enhanced[i]["variableName"]    = var_name
                enhanced[i]["jsonPath"]        = f"$.{path}"
            else:
                # Multiple extractable values in one response — append suffix
                existing = enhanced[i]["variableName"]
                if existing != var_name:
                    # Only the first extraction is wired per step for now.
                    # Multi-extract per step requires k6 script changes too.
                    pass

            # Replace raw value with {{var_name}} in all downstream steps
            placeholder = f"{{{{{var_name}}}}}"
            for j in range(i + 1, len(enhanced)):
                if value in _step_to_str(enhanced[j]):
                    enhanced[j] = _replace_value_in_step(enhanced[j], value, placeholder)

    return enhanced


# ── Auth header injector ──────────────────────────────────────────────────────

def inject_auth_header( scenario:  list[dict],token_var: str = "token",) -> list[dict]:
    """
    For every step that does NOT already have an Authorization header,
    add:   "Authorization": "Bearer {{token_var}}"

    Call this after correlate() when your app uses token-based auth and
    the token hasn't been injected automatically via correlation.

    Parameters
    ----------
    scenario  : list of request step dicts
    token_var : name of the k6 variable holding the bearer token

    Returns
    -------
    New list with Authorization headers injected where missing.
    """
    enhanced = []

    for step in scenario:
        step = dict(step)   # don't mutate caller's list

        # Normalise headers to a dict
        headers = step.get("headers") or {}
        if isinstance(headers, str):
            try:
                headers = json.loads(headers)
            except Exception:
                headers = {}

        # Only inject if no auth header exists at all
        has_auth = any(k.lower() in AUTH_HEADER_KEYS for k in headers)
        if not has_auth:
            headers["Authorization"] = f"Bearer {{{{{token_var}}}}}"

        step["headers"] = headers
        enhanced.append(step)

    return enhanced


# ── Quick smoke-test ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Simulate: POST /login returns a token, GET /profile uses it
    scenario = [
        {
            "name": "POST login", "method": "POST",
            "url": "https://api.example.com/login",
            "headers": {"Content-Type": "application/json"},
            "body": {"email": "user@example.com", "password": "secret"},
            "enabled": True, "extractVariable": False,
            "variableName": "", "jsonPath": "",
        },
        {
            "name": "GET profile", "method": "GET",
            "url": "https://api.example.com/profile",
            "headers": {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"},
            "body": None,
            "enabled": True, "extractVariable": False,
            "variableName": "", "jsonPath": "",
        },
    ]

    responses = [
        '{"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test", "user_id": 42}',
        None,
    ]

    result = correlate(scenario, responses)

    print("Step 0 — extraction point:")
    print(f"  extractVariable : {result[0]['extractVariable']}")
    print(f"  variableName    : {result[0]['variableName']}")
    print(f"  jsonPath        : {result[0]['jsonPath']}")

    print("\nStep 1 — token replaced in header:")
    print(f"  headers : {result[1]['headers']}")