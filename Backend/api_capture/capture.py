"""
api_capture/capture.py
──────────────────────
Generic, site-agnostic API capture via same-origin BFS crawling.
No hardcoded selectors tied to any specific application.
"""

import asyncio
import json
import re
from typing import Optional
from urllib.parse import urlparse

# ── Constants ─────────────────────────────────────────────────────────────────

CAPTURE_RESOURCE_TYPES = {"xhr", "fetch"}
NAVIGATION_METHODS_ALWAYS_CAPTURED = {"POST", "PUT", "PATCH", "DELETE"}

SKIP_URL_PATTERNS = [
    r"\.(css|js|mjs|woff2?|ttf|otf|eot|svg|png|jpe?g|gif|ico|webp|avif|mp4|webm|map)(\?|$)",
    r"google-analytics\.com|googletagmanager\.com|doubleclick\.net|gtm\.js",
    r"cdn-cgi/|stripe\.com|braintree|facebook\.net|hotjar|segment|mixpanel|amplitude",
    r"sentry\.io|bugsnag|rollbar|datadog|clarity\.ms|telemetry|analytics|beacon",
    r"/collect\?|/rum\?|/ping\?",
]

SKIP_HEADERS = {
    "accept-encoding", "accept-language", "cache-control", "connection", "host",
    "pragma", "referer", "sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform",
    "sec-fetch-dest", "sec-fetch-mode", "sec-fetch-site", "sec-fetch-user",
    "upgrade-insecure-requests", "user-agent",
}

# Generic, framework-agnostic signals that a link is an action we should NOT
# follow automatically (logout, account deletion, etc.) — based on common
# words, not any specific site's markup.
SKIP_LINK_WORDS = re.compile(r"logout|signout|sign-out|delete|remove|unsubscribe", re.IGNORECASE)

# ── Optional demo-site fallback (only used if a real site returns nothing) ────

KNOWN_API_SEEDS = {
    "reqres.in": [
        {"method": "GET", "path": "/api/users?page=1", "body": None},
        {"method": "GET", "path": "/api/users?page=2", "body": None},
        {"method": "GET", "path": "/api/users/2", "body": None},
        {"method": "POST", "path": "/api/users", "body": {"name": "morpheus", "job": "leader"}},
        {"method": "PUT", "path": "/api/users/2", "body": {"name": "morpheus", "job": "zion resident"}},
    ],
    "jsonplaceholder.typicode.com": [
        {"method": "GET", "path": "/posts", "body": None},
        {"method": "POST", "path": "/posts", "body": {"title": "foo", "body": "bar", "userId": 1}},
    ],
}


def _get_seed_domain(url: str) -> Optional[str]:
    try:
        host = urlparse(url).netloc.lower().lstrip("www.")
        for domain in KNOWN_API_SEEDS:
            if domain in host:
                return domain
    except Exception:
        pass
    return None


def _build_seed_scenario(base_url: str, domain: str) -> list[dict]:
    origin = _base_origin(base_url)
    seeds = KNOWN_API_SEEDS[domain]
    result = []
    for i, s in enumerate(seeds):
        full_url = origin + s["path"]
        result.append({
            "name": _readable_name(s["method"], full_url, i),
            "method": s["method"],
            "url": full_url,
            "headers": {"Content-Type": "application/json"},
            "body": s["body"],
            "sequence": i,
            "enabled": True,
            "extractVariable": False,
            "variableName": "",
            "jsonPath": "",
            "assertions": {"enabled": False, "status_code": 200, "max_response_time": 2000},
        })
    return result


def _base_origin(url: str) -> str:
    p = urlparse(url)
    return f"{p.scheme}://{p.netloc}"


def _is_api_request(url: str, resource_type: str, method: str = "GET") -> bool:
    """
    Generic across any site:
      - xhr / fetch              → always captured
      - document GET             → captured (page navigations are real
<<<<<<< HEAD
                                user-journey steps on multi-page sites)
=======
                                    user-journey steps on multi-page sites)
>>>>>>> 12661e306beed1a3faafbec5438b9bfcf1c0d603
      - document POST/PUT/etc.   → always captured (form submits)
      - static assets            → skipped via SKIP_URL_PATTERNS
    """
    if any(re.search(p, url, re.IGNORECASE) for p in SKIP_URL_PATTERNS):
        return False

    if resource_type in CAPTURE_RESOURCE_TYPES:
        return True

    if resource_type == "document":
        return True

    return False


def _clean_headers(raw: dict) -> dict:
    return {k: v for k, v in raw.items() if k.lower() not in SKIP_HEADERS}


def _try_parse_json(text: Optional[str]):
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        return text


def _readable_name(method: str, url: str, index: int) -> str:
    try:
        path = urlparse(url).path.rstrip("/")
        parts = [p for p in path.split("/") if p]
        label = " / ".join(parts[-2:]) if len(parts) >= 2 else (parts[-1] if parts else "root")
        return f"{method.upper()} {label}"
    except Exception:
        return f"step_{index}"


# ── Generic same-origin link discovery ────────────────────────────────────────

async def _discover_same_origin_links(page, origin: str) -> list[str]:
    """
    Pull every <a href> on the current page that points to the same origin.
    Pure DOM semantics — no app-specific class names — so this works on
    any site, not just one.
    """
    try:
        hrefs = await page.eval_on_selector_all(
            "a[href]", "els => els.map(e => e.href)"
        )
    except Exception:
        return []

    found = []
    for href in hrefs:
        try:
            if not href or SKIP_LINK_WORDS.search(href):
                continue
            parsed = urlparse(href)
            if parsed.scheme not in ("http", "https"):
                continue
            if _base_origin(href) != origin:
                continue
            if any(re.search(p, href, re.IGNORECASE) for p in SKIP_URL_PATTERNS):
                continue
            clean = href.split("#")[0]
            found.append(clean)
        except Exception:
            continue
    return found


# ── Generic in-page action clicking (no site-specific selectors) ─────────────

async def _click_generic_actions(page, max_clicks: int = 8, debug: bool = False) -> int:
    """
    Click generic, standards-based interactive elements that exist on
    virtually any HTML page — covers every standard way a clickable
    control can be marked up, not tied to any one site's conventions.
    """
    selectors = [
        "button",
        "input[type=submit]",
        "input[type=button]",      # demowebshop's add-to-cart uses this
        "input[type=image]",
        "[role=button]",
        "[onclick]", 
        "a[href]"# elements with inline click handlers
    ]
    clicked = 0

    for sel in selectors:
        if clicked >= max_clicks:
            break
        try:
            elements = await page.query_selector_all(sel)
        except Exception:
            continue

        n = min(len(elements), max_clicks - clicked)
        for i in range(n):
            try:
                fresh = await page.query_selector_all(sel)
                if i >= len(fresh):
                    continue
                el = fresh[i]

                if not await el.is_visible():
                    continue

                # input[type=button]/[submit] use the "value" attribute for
                # their visible label, not inner_text — check both.
                text = ((await el.inner_text()) or "").strip().lower()
                value = (await el.get_attribute("value") or "").strip().lower()
                combined_text = f"{text} {value}"

                if SKIP_LINK_WORDS.search(combined_text):
                    continue

                await el.scroll_into_view_if_needed()

                try:
                    async with page.expect_navigation(timeout=1200):
                        await el.click(timeout=1500)
                    return clicked
                except Exception:
                    pass  # no navigation = AJAX action — what we want

                clicked += 1
                await page.wait_for_timeout(800)

            except Exception as e:
                if debug:
                    print(f"[capture-debug] click error on '{sel}': {e}")
                continue

    return clicked


# ── BFS crawler — works for any site, not hardcoded to one ───────────────────
async def _crawl_and_capture(
    page,
    start_url: str,
    max_pages: int = 12,
    max_clicks_per_page: int = 30,
    page_wait_ms: int = 1500,
    debug: bool = False,
):
    origin = _base_origin(start_url)
    visited: set[str] = set()
    queue: list[str] = [start_url]

    while queue and len(visited) < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            try:
                await page.wait_for_load_state("networkidle", timeout=5000)
            except Exception:
                pass
        except Exception as e:
            if debug:
                print(f"[capture-debug] navigation failed for {url}: {e}")
            continue

        await page.wait_for_timeout(page_wait_ms)

        for _ in range(3):
            await page.evaluate("window.scrollBy(0, window.innerHeight * 0.8)")
            await page.wait_for_timeout(300)

        clicked = await _click_generic_actions(page, max_clicks_per_page, debug)
        if debug:
            print(f"[capture-debug] page={url} clicked={clicked}")
            
        if page.url not in visited and page.url not in queue:
            queue.append(page.url)

        new_links = await _discover_same_origin_links(page, origin)
        for link in new_links:
            if link not in visited and link not in queue:
                queue.append(link)

    if debug:
        print(f"[capture] Crawled {len(visited)} page(s), {len(queue)} still queued (limit reached)")


# ── capture_apis_async ─────────────────────────────────────────────────────────

async def capture_apis_async(
    url: str,
    wait_ms: int = 15000,
    interact: bool = True,
    headless: bool = True,
    debug: bool = False,
    max_pages: int = 12,
) -> list[dict]:
    
    import importlib

    playwright_async_api = importlib.import_module("playwright.async_api")
    async_playwright = playwright_async_api.async_playwright

    captured = []
    sequence = 0
    seen_types: dict[str, int] = {}

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)
        context = await browser.new_context(
            ignore_https_errors=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        page = await context.new_page()

        def on_request(request):
            nonlocal sequence
            seen_types[request.resource_type] = seen_types.get(request.resource_type, 0) + 1

            if debug:
                passed = _is_api_request(request.url, request.resource_type, request.method)
                print(f"[capture-debug] {'✓' if passed else '✗'}  [{request.resource_type:10s}]  {request.method:6s}  {request.url[:110]}")

            if not _is_api_request(request.url, request.resource_type, request.method):
                return

            body = None

            try:
                post_data = request.post_data
                if post_data:
                    body = _try_parse_json(post_data)
            except UnicodeDecodeError:
                body = "[Binary Data]"
            except Exception as e:
                body = f"[Unreadable Body: {str(e)}]"
            headers = _clean_headers(dict(request.headers))

            captured.append({
                "name": _readable_name(request.method, request.url, sequence),
                "method": request.method.upper(),
                "url": request.url,
                "headers": headers,
                "body": body,
                "sequence": sequence,
                "enabled": True,
                "extractVariable": False,
                "variableName": "",
                "jsonPath": "",
                "assertions": {"enabled": False, "status_code": 200, "max_response_time": 2000},
            })
            sequence += 1

        page.on("request", on_request)

        if interact:
            # BFS-crawls same-origin pages, clicking generic action elements
            # along the way. This replaces single-page goto + interact.
            await _crawl_and_capture(page, url, max_pages=max_pages, debug=debug)
        else:
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_load_state("networkidle", timeout=10000)
            except Exception as e:
                print(f"[capture] Navigation warning: {e}")

        await page.wait_for_timeout(wait_ms)
        await browser.close()

    print(f"[capture] Requests seen by resource_type: {seen_types}")
    print(f"[capture] Total raw requests captured (post-filter): {len(captured)}")
    return captured


def capture_apis(
    url: str,
    wait_ms: int = 10000,
    interact: bool = True,
    headless: bool = True,
    debug: bool = False,
    max_pages: int = 12,
) -> list[dict]:
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(
            asyncio.run,
            capture_apis_async(url, wait_ms, interact, headless, debug, max_pages)
        )
        return future.result(timeout=240)


def deduplicate(requests: list[dict]) -> list[dict]:
    seen = set()
    unique = []
    for r in requests:
        key = (r["method"], r["url"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return unique