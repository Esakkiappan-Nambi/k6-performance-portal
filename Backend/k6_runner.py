import os
import json
from urllib.parse import urlparse, urlencode

SCRIPT_FOLDER = "generated_scripts"
os.makedirs(SCRIPT_FOLDER, exist_ok=True)


def generate_k6_script(
    test_name,
    users,
    duration,
    ramp_up,
    loop_count,
    scenario,
    assertions=None,
    csv_enabled=False,
    csv_path=None,
    csv_variables=None,
    cookie_enabled=False,
    cookie_clear_each_iteration=False,
    cache_enabled=False,
    cache_clear_each_iteration=False,
    cache_max_size=75,
    ramp_down=5,
):
    filename = f"{test_name}.js"
    filepath = os.path.join(SCRIPT_FOLDER, filename)

    if assertions and isinstance(assertions, str):
        assertions = json.loads(assertions)

    # ── CSV block ─────────────────────────────────────────────────────────────
    csv_block = ""
    csv_data_access = ""

    if csv_enabled and csv_path:
        csv_path = os.path.abspath(csv_path).replace("\\", "/")
        variables = [v.strip() for v in csv_variables.split(",")] if csv_variables else []
        csv_mapping = ", ".join([f"{var}: cols[{i}]" for i, var in enumerate(variables)])

        csv_block = f"""import {{ SharedArray }} from "k6/data";

const csvData = new SharedArray("csvData", function () {{
    return open("{csv_path}")
        .split("\\n")
        .slice(1)
        .filter(line => line.trim() !== "")
        .map(line => {{
            const cols = line.split(",");
            return {{ {csv_mapping} }};
        }});
}});
"""
        csv_data_access = """const data = csvData[(__VU - 1) % csvData.length];
    console.log("VU:", __VU, "User:", JSON.stringify(data));"""

    # ── Cookie block ──────────────────────────────────────────────────────────
    cookie_jar_init = ""
    cookie_iteration_clear = ""

    if cookie_enabled:
        base_urls = []
        seen = set()
        for step in scenario:
            if step.get("enabled") and step.get("url"):
                try:
                    p = urlparse(step["url"])
                    base = f"{p.scheme}://{p.netloc}"
                    if base not in seen:
                        seen.add(base)
                        base_urls.append(base)
                except Exception:
                    pass

        cookie_jar_init = "const jar = http.cookieJar(); // HTTP Cookie Manager"

        if cookie_clear_each_iteration and base_urls:
            clears = "\n        ".join([f'jar.clear("{u}");' for u in base_urls])
            cookie_iteration_clear = f"// Clear cookies (JMeter: clear each iteration)\n        {clears}"
        elif cookie_clear_each_iteration:
            cookie_iteration_clear = "// jar.clear('<base_url>'); // add your base URL"
# ── ✅ NEW: Cache Manager block ───────────────────────────────────────────
    # Simulates JMeter HTTP Cache Manager:
    #   - Stores ETag / Last-Modified per URL per VU
    #   - Sends If-None-Match / If-Modified-Since on repeat requests
    #   - Honours 304 Not Modified (no body re-downloaded)
    #   - Optional clear-each-iteration to reset cache between loops
    cache_init = ""
    cache_helpers = ""
    cache_iteration_clear = ""
 
    if cache_enabled:
        cache_init = f"""
    // ── HTTP Cache Manager (JMeter equivalent) ────────────────────────────
    // Per-VU in-memory cache: url → {{ etag, lastModified }}
    // Max entries: {cache_max_size}
    const __cache = {{}};
    let __cacheSize = 0;
    const __cacheMaxSize = {cache_max_size};
"""
 
        cache_helpers = """
    // Returns conditional headers for a URL if cached
    function getCacheHeaders(url) {
        const entry = __cache[url];
        if (!entry) return {};
        const h = {};
        if (entry.etag)         h["If-None-Match"]     = entry.etag;
        if (entry.lastModified) h["If-Modified-Since"] = entry.lastModified;
        return h;
    }
 
    // Store cache entry from a response
    function storeCacheEntry(url, res) {
        const etag         = res.headers["Etag"] || res.headers["ETag"] || null;
        const lastModified = res.headers["Last-Modified"] || null;
        if (etag || lastModified) {
            if (!__cache[url] && __cacheSize >= __cacheMaxSize) {
                // evict oldest entry when full
                const oldest = Object.keys(__cache)[0];
                delete __cache[oldest];
                __cacheSize--;
            }
            if (!__cache[url]) __cacheSize++;
            __cache[url] = { etag, lastModified };
        }
    }
"""
        if cache_clear_each_iteration:
            cache_iteration_clear = """// Clear cache each iteration (JMeter: clear each iteration)
        Object.keys(__cache).forEach(k => delete __cache[k]);
        __cacheSize = 0;"""

    # ── Variable extraction registry ──────────────────────────────────────────
    extracted_vars = []
    for step in scenario:
        if step.get("extractVariable") and step.get("variableName"):
            extracted_vars.append(step["variableName"])

    def replace_vars(text):
        """Replace {{varName}} → ${variables.varName} for JS template literals."""
        if not text:
            return text
        for var in extracted_vars:
            text = text.replace(f"{{{{{var}}}}}", f"${{variables.{var}}}")
        return text

    # ── Build per-step request code ───────────────────────────────────────────
    requests = ""

    for index, step in enumerate(scenario):
        if not step.get("enabled"):
            continue

        response_var = f"res_{index}"
        method = step.get("method", "GET").upper()
        raw_url = step.get("url", "")
        name = step.get("name", f"Request {index + 1}")
        headers = step.get("headers", "")
        body = step.get("body", "")

        # ── ✅ NEW: Build GET params query string ─────────────────────────────
        # Collect only enabled params with non-empty names
        params_list = step.get("params") or []
        enabled_params = [
            p for p in params_list
            if p.get("enabled", True) and p.get("name", "").strip()
        ]

        if method == "GET" and enabled_params:
            # Build JS template-literal query string so variable refs work
            qs_parts = []
            for p in enabled_params:
                p_name = p.get("name", "").strip()
                p_value = replace_vars(p.get("value", ""))
                # encode the name (static), value may contain JS variable refs
                encoded_name = p_name.replace(" ", "+")
                qs_parts.append(f"{encoded_name}=${{encodeURIComponent(`{p_value}`)}}")

            query_string = "&".join(qs_parts)

            # Append to URL — handle existing ? in base URL
            if "?" in raw_url:
                full_url = f"`{replace_vars(raw_url)}&{query_string}`"
            else:
                full_url = f"`{replace_vars(raw_url)}?{query_string}`"
        else:
            full_url = f"`{replace_vars(raw_url)}`"

        # --- Parse & merge headers ---
        headers_obj = {}
        if headers:
            try:
                headers_obj = json.loads(headers)
                headers_obj = {
                    k: replace_vars(v) if isinstance(v, str) else v
                    for k, v in headers_obj.items()
                }
            except Exception as e:
                print("Header parse error:", e)

        # For non-GET: merge Content-Type
        if method != "GET":
            merged = {"Content-Type": "application/json"}
            merged.update(headers_obj)
            headers_obj = merged

        # --- Parse body ---
        body_obj = None
        if body:
            try:
                body_obj = json.loads(body)
                body_obj = {
                    k: replace_vars(v) if isinstance(v, str) else v
                    for k, v in body_obj.items()
                }
            except Exception as e:
                print("Body parse error:", e)

        # --- Build JS expressions ---
        # Headers literal
        header_parts = []
        for k, v in headers_obj.items():
            if isinstance(v, str):
                if any(f"${{variables.{var}}}" in v for var in extracted_vars):
                    header_parts.append(f'  "{k}": `{v}`')
                else:
                    header_parts.append(f'  "{k}": "{v}"')
            else:
                header_parts.append(f'  "{k}": {json.dumps(v)}')
        headers_literal = "{\n" + ",\n".join(header_parts) + "\n}" if header_parts else "{}"

        # Body literal
        if body_obj is not None:
            body_parts = []
            for k, v in body_obj.items():
                if isinstance(v, str):
                    if any(f"${{variables.{var}}}" in v for var in extracted_vars):
                        body_parts.append(f'  "{k}": `{v}`')
                    else:
                        body_parts.append(f'  "{k}": "{v}"')
                else:
                    body_parts.append(f'  "{k}": {json.dumps(v)}')
            body_literal = "JSON.stringify({\n" + ",\n".join(body_parts) + "\n})"
        else:
            body_literal = "null"

        # --- Emit HTTP call ---
        if method == "GET":
            requests += f"""
        // ── {name} ──
        let {response_var} = http.get({full_url}, {{
            headers: {headers_literal}
        }});
"""
        else:
            requests += f"""
        // ── {name} ──
        let {response_var} = http.request(
            "{method}",
            {full_url},
            {body_literal},
            {{ headers: {headers_literal} }}
        );
"""

        requests += f"""
        console.log("Request: {name}");
        console.log("Status:", {response_var}.status);
        console.log("Body:", {response_var}.body);

        aggregateResponseTime.add({response_var}.timings.duration);

        if ({response_var}.status >= 400) {{
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        }} else {{
            aggregateFailureRate.add(false);
        }}
"""

        # --- Think time ---
        think_time = step.get("thinkTime") if step.get("thinkTime") is not None else step.get("think_time")
        if think_time:
            try:
                t_ms = int(think_time)
                if t_ms > 0:
                    requests += f"        sleep({t_ms} / 1000);\n"
            except Exception:
                pass

        # --- Variable extraction ---
        if step.get("extractVariable"):
            var_name = step.get("variableName")
            json_path = step.get("jsonPath", "")
            if json_path.startswith("$."):
                json_path = json_path[2:]

            requests += f"""
        try {{
            variables.{var_name} = {response_var}.json("{json_path}");
            console.log("Extracted {var_name}:", variables.{var_name});
        }} catch (err) {{
            console.log("Extraction failed for {var_name}:", err);
        }}
"""

        # --- Per-step assertions ---
        # --- Per-step assertions (numeric) ---
        step_assertions = step.get("assertions", {})
        if step_assertions and step_assertions.get("enabled"):
            status_code = step_assertions.get("status_code", 200)
            max_rt      = step_assertions.get("max_response_time", 500)
 
            if status_code or max_rt:
                requests += f"""
        check({response_var}, {{
            "{name} status {status_code}": (r) => r.status === {status_code},
            "{name} response time < {max_rt}ms": (r) => r.timings.duration <= {max_rt}
        }});
"""
 
            # ✅ NEW: Text / Response assertions (JMeter Response Assertion equivalent)
            text_assertions = step_assertions.get("text_assertions", [])
            if text_assertions:
                check_lines = []
                for ta in text_assertions:
                    field     = ta.get("field", "body")       # body | status_text | headers
                    condition = ta.get("condition", "contains")
                    value     = ta.get("value", "").replace('"', '\\"')
                    label     = f"{name} — {field} {condition} '{value}'"
 
                    # Map field to k6 response property
                    if field == "body":
                        field_expr = "r.body"
                    elif field == "status_text":
                        field_expr = "r.status_text"
                    elif field == "headers":
                        # headers is an object — stringify for text matching
                        field_expr = "JSON.stringify(r.headers)"
                    else:
                        field_expr = "r.body"
 
                    # Map condition to JS expression
                    if condition == "contains":
                        expr = f'({field_expr} || "").includes("{value}")'
                    elif condition == "not_contains":
                        expr = f'!({field_expr} || "").includes("{value}")'
                    elif condition == "equals":
                        expr = f'({field_expr} || "") === "{value}"'
                    elif condition == "starts_with":
                        expr = f'({field_expr} || "").startsWith("{value}")'
                    elif condition == "ends_with":
                        expr = f'({field_expr} || "").endsWith("{value}")'
                    elif condition == "matches_regex":
                        # value is a regex pattern — don't wrap in quotes
                        expr = f'new RegExp("{value}").test({field_expr} || "")'
                    else:
                        expr = f'({field_expr} || "").includes("{value}")'
 
                    check_lines.append(f'            "{label}": (r) => {expr}')
 
                checks_block = ",\n".join(check_lines)
                requests += f"""
        check({response_var}, {{
{checks_block}
        }});
"""
 
        # --- Global assertions fallback (if no per-step) ---
        elif assertions:
            status_code = assertions.get("status_code", 200)
            max_rt      = assertions.get("max_response_time", 500)
            requests += f"""
        check({response_var}, {{
            "status {status_code}": (r) => r.status === {status_code},
            "response time < {max_rt}ms": (r) => r.timings.duration <= {max_rt}
        }});
"""


    # ── Assemble final script ─────────────────────────────────────────────────
    script = f"""{csv_block}

import http from "k6/http";
import {{ sleep, check }} from "k6";
import {{ Trend, Counter, Rate }} from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time");
const aggregateErrors = new Counter("aggregate_errors");
const aggregateFailureRate = new Rate("aggregate_failure_rate");

export const options = {{
    stages: [
        {{ duration: "{ramp_up}s", target: {users} }},   // ramp-up
        {{ duration: "{duration}s", target: {users} }},  // hold load
        {{ duration: "{ramp_down}s", target: 0 }}        // ramp-down
    ]
}};

export default function () {{
    let variables = {{}};   // shared variable bag (JWT tokens, etc.)
    {cookie_jar_init}
    {csv_data_access}

    for (let i = 0; i < {loop_count}; i++) {{
{requests}
        {cookie_iteration_clear}
    }}
}}

export function handleSummary(data) {{
    return {{
        "summary.json": JSON.stringify(data, null, 2),
    }};
}}
"""

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(script)

    return filepath


import subprocess
import json
import os


REPORT_FOLDER = "reports"
os.makedirs(REPORT_FOLDER, exist_ok=True)


def execute_k6(script_path, run_id):
    absolute_script_path = os.path.abspath(script_path)

    if not os.path.exists(absolute_script_path):
        raise FileNotFoundError(
            f"Script not found: {absolute_script_path}"
        )

    summary_path = os.path.abspath(
        f"{REPORT_FOLDER}/{run_id}_summary.json"
    )

    env = os.environ.copy()

    process = subprocess.run(
        [
            "k6",
            "run",
            "--tag",
            f"run_id={run_id}",
            "--out",
            "influxdb=http://localhost:8086/k6?pushInterval=5s",
            "--summary-export",
            summary_path,
            absolute_script_path
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        env=env
    )

    output = process.stdout + process.stderr
    summary_data = {}

    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            summary_data = json.load(f)

    return output, summary_data, summary_path


from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
import os


from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
import os
from datetime import datetime


def generate_pdf_report(run_id, test_name, metrics, output):
    os.makedirs("reports", exist_ok=True)
    report_path = f"reports/{run_id}_report.pdf"

    doc = SimpleDocTemplate(
        report_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # ── Custom styles ─────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=20,
        textColor=colors.HexColor("#111827"),
        spaceAfter=4,
        alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#6b7280"),
        spaceAfter=2,
        alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#374151"),
        spaceBefore=16,
        spaceAfter=8,
    )
    status_pass = ParagraphStyle(
        "StatusPass",
        parent=styles["Normal"],
        fontSize=13,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#16a34a"),
        alignment=TA_CENTER,
    )
    status_fail = ParagraphStyle(
        "StatusFail",
        parent=styles["Normal"],
        fontSize=13,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#dc2626"),
        alignment=TA_CENTER,
    )

    elements = []

    # ── HEADER ────────────────────────────────────────────────────────────────
    elements.append(Paragraph(f"{test_name}", title_style))
    elements.append(Paragraph("Load Test Report", subtitle_style))
    elements.append(Paragraph(
        f"Run ID: {run_id} &nbsp;&nbsp;|&nbsp;&nbsp; Generated: {datetime.now().strftime('%d %b %Y, %H:%M:%S')}",
        subtitle_style
    ))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
    elements.append(Spacer(1, 10))

    # ── OVERALL STATUS ────────────────────────────────────────────────────────
    error_rate = metrics.get("error_rate", 0)
    passed     = metrics.get("passed_checks", 0)
    failed_req = metrics.get("failed_requests", 0)

    overall_status = "✔  PASSED" if error_rate < 1 and failed_req == 0 else "✘  FAILED"
    status_style   = status_pass if "PASSED" in overall_status else status_fail

    status_data = [[Paragraph(overall_status, status_style)]]
    status_table = Table(status_data, colWidths=["100%"])
    status_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f9fafb")),
        ("BOX",        (0, 0), (-1, -1), 1, colors.HexColor("#e5e7eb")),
        ("ROUNDEDCORNERS", [6]),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(status_table)
    elements.append(Spacer(1, 14))

    # ── KEY METRICS — 3-column summary cards ─────────────────────────────────
    elements.append(Paragraph("Key Metrics", section_style))

    def card(label, value, color="#111827"):
        return Table(
        [
            [
                Paragraph(
                    f'<font size="18" color="{color}"><b>{value}</b></font>',
                    ParagraphStyle(
                        "cv",
                        alignment=TA_CENTER,
                        leading=22,
                    ),
                )
            ],
            [
                Paragraph(
                    f'<font size="9" color="#6b7280">{label}</font>',
                    ParagraphStyle(
                        "cl",
                        alignment=TA_CENTER,
                        leading=12,
                    ),
                )
            ],
        ],
        colWidths=["100%"],
    )

    avg_rt  = round(metrics.get("avg_response_time", 0), 1)
    p90     = round(metrics.get("p90", 0), 1)
    p95     = round(metrics.get("p95", 0), 1)
    tput    = round(metrics.get("throughput", 0), 2)
    total   = metrics.get("total_requests", 0)
    err_pct = round(error_rate, 2)

    # Row 1 — 3 cards
    row1 = [
        card("Total Requests", total),
        card("Throughput", f"{tput} req/s"),
        card(
            "Error Rate",
            f"{err_pct}%",
            "#dc2626" if err_pct > 0 else "#16a34a"
        ),]
    cards1 = Table([row1], colWidths=[doc.width / 3] * 3)
    cards1.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f9fafb")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ]))
    elements.append(cards1)
    elements.append(Spacer(1, 8))

    # Row 2 — 3 cards
    row2 = [
    card("Avg Response Time", f"{avg_rt} ms"),
    card("P90", f"{p90} ms"),
    card("P95", f"{p95} ms"),
    ]
    cards2 = Table([row2], colWidths=[doc.width / 3] * 3)
    row2 = [
    card("Avg Response Time", f"{avg_rt} ms"),
    card("P90", f"{p90} ms"),
    card("P95", f"{p95} ms"),
    ]
    elements.append(cards2)
    elements.append(Spacer(1, 14))

    # ── RESPONSE TIME BREAKDOWN ───────────────────────────────────────────────
    elements.append(Paragraph("Response Time Breakdown", section_style))

    rt_data = [
        ["Metric", "Value"],
        ["Minimum",  f'{round(metrics.get("min_response_time", 0), 2)} ms'],
        ["Average",  f'{avg_rt} ms'],
        ["P90",      f'{p90} ms'],
        ["P95",      f'{p95} ms'],
        ["Maximum",  f'{round(metrics.get("max_response_time", 0), 2)} ms'],
    ]

    rt_table = Table(rt_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
    rt_table.setStyle(TableStyle([
        # Header row
        ("BACKGROUND",    (0, 0), (-1, 0),  colors.HexColor("#111827")),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  10),
        ("ALIGN",         (0, 0), (-1, 0),  "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, 0),  8),
        ("BOTTOMPADDING", (0, 0), (-1, 0),  8),
        # Data rows
        ("FONTSIZE",      (0, 1), (-1, -1), 10),
        ("ALIGN",         (1, 1), (1, -1),  "CENTER"),
        ("TOPPADDING",    (0, 1), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 7),
        ("LEFTPADDING",   (0, 1), (0, -1),  14),
        # Alternating rows
        ("BACKGROUND",    (0, 1), (-1, 1),  colors.HexColor("#f9fafb")),
        ("BACKGROUND",    (0, 2), (-1, 2),  colors.white),
        ("BACKGROUND",    (0, 3), (-1, 3),  colors.HexColor("#f9fafb")),
        ("BACKGROUND",    (0, 4), (-1, 4),  colors.white),
        ("BACKGROUND",    (0, 5), (-1, 5),  colors.HexColor("#f9fafb")),
        # Grid
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
    ]))
    elements.append(rt_table)
    elements.append(Spacer(1, 14))

    # ── REQUEST SUMMARY ───────────────────────────────────────────────────────
    elements.append(Paragraph("Request Summary", section_style))

    req_data = [
        ["Metric", "Value"],
        ["Total Requests",  str(total)],
        ["Passed Checks",   str(passed)],
        ["Failed Requests", str(failed_req)],
        ["Error Rate",      f"{err_pct}%"],
    ]

    req_table = Table(req_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
    req_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  colors.HexColor("#111827")),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  10),
        ("ALIGN",         (0, 0), (-1, 0),  "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, 0),  8),
        ("BOTTOMPADDING", (0, 0), (-1, 0),  8),
        ("FONTSIZE",      (0, 1), (-1, -1), 10),
        ("ALIGN",         (1, 1), (1, -1),  "CENTER"),
        ("TOPPADDING",    (0, 1), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 7),
        ("LEFTPADDING",   (0, 1), (0, -1),  14),
        ("BACKGROUND",    (0, 1), (-1, 1),  colors.HexColor("#f9fafb")),
        ("BACKGROUND",    (0, 2), (-1, 2),  colors.white),
        ("BACKGROUND",    (0, 3), (-1, 3),  colors.HexColor("#f9fafb")),
        ("BACKGROUND",    (0, 4), (-1, 4),  colors.white),
        # Highlight failed row in red if failures exist
        *([("TEXTCOLOR", (1, 3), (1, 3), colors.HexColor("#dc2626")),
           ("FONTNAME",  (1, 3), (1, 3), "Helvetica-Bold")]
          if failed_req > 0 else []),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
    ]))
    elements.append(req_table)
    elements.append(Spacer(1, 14))

    # ── FOOTER ────────────────────────────────────────────────────────────────
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f'<font size="8" color="#9ca3af">Generated by K6 Load Testing Portal &nbsp;|&nbsp; Run ID: {run_id}</font>',
        ParagraphStyle("footer", alignment=TA_CENTER)
    ))

    doc.build(elements)
    return report_path