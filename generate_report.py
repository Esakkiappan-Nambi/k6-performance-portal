import json
import sys
from datetime import datetime
from pathlib import Path


def load_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"Loaded {path}")
            return data
    except Exception as e:
        print(f"Failed to load {path}: {e}")
        return None


def generate_dashboard(report_dir):
    print("Generating Security Dashboard...")

    report_path = Path(report_dir)

    semgrep = load_json(report_path / "semgrep-report.json")
    trivy = load_json(report_path / "trivy-report.json")
    sonar_raw = load_json(report_path / "sonarqube-report.json")

    # SonarQube's /api/issues/search returns {"total": N, "issues": [...]},
    # not a bare list -- pull the "issues" array out of it.
    sonar = sonar_raw.get("issues", []) if isinstance(sonar_raw, dict) else []

    # Accurate Counts
    semgrep_count = len(semgrep.get("results", [])) if semgrep else 0
    trivy_count = sum(len(r.get("Packages", [])) for r in trivy.get("Results", [])) if trivy else 0
    sonar_count = len(sonar)
    total = semgrep_count + trivy_count + sonar_count

    print(f"Semgrep: {semgrep_count} | Trivy: {trivy_count} | SonarQube: {sonar_count}")

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body {{ font-family: 'Inter', system-ui, sans-serif; }}
        .card {{ transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }}
        .card:hover {{ transform: translateY(-6px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }}
        table {{ border-collapse: collapse; }}
        th {{ background: #f8fafc; position: sticky; top: 0; z-index: 10; }}
        .tab-content.hidden {{ display: none; }}
        .tab-btn.active {{ border-bottom: 3px solid #2563eb; color: #2563eb; }}
    </style>
</head>
<body class="bg-slate-50">
    <div class="max-w-7xl mx-auto p-8">
        <div class="flex justify-between items-start mb-10">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div>
                    <h1 class="text-4xl font-bold text-slate-900">Security Dashboard</h1>
                    <p class="text-slate-600">Comprehensive Scan Report</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-sm text-slate-500">Generated: {datetime.now().strftime("%B %d, %Y %H:%M")}</p>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div class="bg-white rounded-3xl p-8 card shadow-xl">
                <div class="text-6xl font-bold text-slate-900">{total}</div>
                <div class="text-lg text-slate-600 mt-1">Total Issues</div>
            </div>
            <div class="bg-white rounded-3xl p-8 card shadow-xl">
                <div class="text-6xl font-bold text-amber-600">{semgrep_count}</div>
                <div class="text-slate-600">Semgrep</div>
            </div>
            <div class="bg-white rounded-3xl p-8 card shadow-xl">
                <div class="text-6xl font-bold text-orange-600">{trivy_count}</div>
                <div class="text-slate-600">Trivy</div>
            </div>
            <div class="bg-white rounded-3xl p-8 card shadow-xl border-t-4 border-blue-600">
                <div class="text-6xl font-bold text-blue-600">{sonar_count}</div>
                <div class="text-slate-600">SonarQube</div>
            </div>
        </div>

        <!-- Navigation -->
        <div class="flex border-b mb-8 bg-white rounded-t-3xl">
            <button onclick="showTab(0)" class="tab-btn active flex-1 py-5 text-center font-semibold" id="t0">Overview</button>
            <button onclick="showTab(1)" class="tab-btn flex-1 py-5 text-center font-semibold" id="t1">Semgrep</button>
            <button onclick="showTab(2)" class="tab-btn flex-1 py-5 text-center font-semibold" id="t2">Trivy</button>
            <button onclick="showTab(3)" class="tab-btn flex-1 py-5 text-center font-semibold" id="t3">SonarQube ({sonar_count})</button>
        </div>

        <!-- Tabs Content -->
        <div id="content0" class="tab-content">
            <h2 class="text-3xl font-semibold mb-8">Executive Summary</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-3xl shadow">
                    <h3 class="font-semibold text-xl mb-3">Semgrep Findings</h3>
                    <p class="text-slate-600">{semgrep_count} static analysis findings detected across the codebase.</p>
                </div>
                <div class="bg-white p-8 rounded-3xl shadow">
                    <h3 class="font-semibold text-xl mb-3">Code Quality &amp; Dependencies</h3>
                    <p class="text-slate-600">{trivy_count} package findings from Trivy and {sonar_count} SonarQube issues identified.</p>
                </div>
            </div>
        </div>

        <!-- Semgrep Tab -->
        <div id="content1" class="tab-content hidden">
            <h2 class="text-2xl font-semibold mb-6">Semgrep Security Findings</h2>
            <div class="bg-white rounded-3xl shadow overflow-hidden">
                <table class="w-full">
                    <thead><tr class="bg-slate-100"><th class="p-5 text-left">File</th><th class="p-5 text-left">Severity</th><th class="p-5 text-left">Issue</th></tr></thead>
                    <tbody>
'''

    if semgrep:
        for r in semgrep.get("results", []):
            html += f'''
                <tr class="border-t hover:bg-slate-50">
                    <td class="p-5 font-mono text-sm">{r.get("path")}</td>
                    <td class="p-5"><span class="px-4 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">WARNING</span></td>
                    <td class="p-5 text-sm">{r.get("extra", {}).get("message", "")[:140]}...</td>
                </tr>
            '''

    html += '''
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Trivy Tab -->
        <div id="content2" class="tab-content hidden">
            <h2 class="text-2xl font-semibold mb-6">Trivy Dependency Analysis</h2>
            <div class="bg-white rounded-3xl p-8 shadow space-y-6">
'''

    if trivy:
        for res in trivy.get("Results", []):
            html += f"<h3 class='font-semibold mb-4'>{res.get('Target')}</h3>"
            for pkg in res.get("Packages", []):
                html += f'''
                    <div class="flex justify-between items-center py-3 border-b last:border-none">
                        <div><strong>{pkg.get("Name")}</strong> <span class="text-slate-500">v{pkg.get("Version")}</span></div>
                        <span class="text-emerald-600 text-sm font-medium">Analyzed</span>
                    </div>
                '''

    html += f'''
            </div>
        </div>

        <!-- SonarQube Tab -->
        <div id="content3" class="tab-content hidden">
            <h2 class="text-2xl font-semibold mb-6">SonarQube Issues ({sonar_count})</h2>
            <div class="bg-white rounded-3xl shadow overflow-auto max-h-[75vh]">
                <table class="w-full">
                    <thead class="bg-slate-100 sticky top-0">
                        <tr>
                            <th class="p-5 text-left">Severity</th>
                            <th class="p-5 text-left">Rule</th>
                            <th class="p-5 text-left">File</th>
                            <th class="p-5 text-left">Message</th>
                        </tr>
                    </thead>
                    <tbody>
'''

    for issue in sonar:
        sev = issue.get("severity", "MINOR")
        color = "red" if sev in ["CRITICAL", "BLOCKER"] else "amber"
        html += f'''
                <tr class="border-t hover:bg-slate-50">
                    <td class="p-5"><span class="px-4 py-1 text-xs font-medium rounded-full bg-{color}-100 text-{color}-700">{sev}</span></td>
                    <td class="p-5 font-mono text-sm">{issue.get("rule")}</td>
                    <td class="p-5 text-sm break-all">{issue.get("component", "").split(":")[-1]}</td>
                    <td class="p-5 text-sm">{issue.get("message", "")[:130]}...</td>
                </tr>
            '''

    html += '''
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        function showTab(n) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.getElementById('content' + n).classList.remove('hidden');
            document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === n));
        }
        showTab(0);
    </script>
</body>
</html>
'''

    output_file = report_path / "security_dashboard.html"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Dashboard generated: {output_file}")


if __name__ == "__main__":
    report_dir = sys.argv[1] if len(sys.argv) > 1 else "security-reports"
    generate_dashboard(report_dir)
