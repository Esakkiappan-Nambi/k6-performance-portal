import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlayCircle, Loader2, Trash2, Pencil, Search, Square,
  ExternalLink, FileText, Copy, Check, Terminal,
  AlertTriangle, RefreshCw, Plus, Activity,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import API from "../services/api";
import { toast } from "react-toastify";
import Layout from "../components/Layout";

/* ── helpers ─────────────────────────────────────────────────── */
function statusBadge(s) {
  const map = {
    completed: "badge-completed", failed: "badge-failed",
    running:   "badge-running",   stopping: "badge-stopping",
    created:   "badge-created",   stopped:  "badge-stopped",
    scheduled: "badge-scheduled",
  };
  return `badge ${map[s?.toLowerCase()] || "badge-stopped"}`;
}

const PAGE_SIZE = 8;

function Pagination({ total, page, setPage }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total === 0) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="pagination">
      <div className="pagination-info">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong> ·{" "}
        <strong>{total}</strong> total
      </div>
      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="page-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`page-btn${p === page ? " active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function RunTest() {
  const navigate = useNavigate();

  const [tests,          setTests]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [runningTestId,  setRunningTestId]  = useState(null);
  const [activeRunId,    setActiveRunId]    = useState(null);
  const [stoppingId,     setStoppingId]     = useState(null);
  const [deletingId,     setDeletingId]     = useState(null);
  const [output,         setOutput]         = useState("");
  const [grafanaUrl,     setGrafanaUrl]     = useState("");
  const [search,         setSearch]         = useState("");
  const [copied,         setCopied]         = useState(false);
  const [page,           setPage]           = useState(1);
  const [telemetry,      setTelemetry]      = useState({
    grafana_online: false, influxdb_online: false,
    grafana_base_url: "http://localhost:3000",
    grafana_dashboard_path: "/d/adfqsh7/k6-load-testing-results",
  });

  const pollRef   = useRef(null);
  const autoRef   = useRef(null);

  /* ── load ─────────────────────────────────────────────────── */
  const loadTests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await API.get("/tests");
      setTests(r.data || []);
    } catch { /* ignore */ }
    finally { if (!silent) setLoading(false); }
  }, []);

  const loadTelemetry = useCallback(() => {
    API.get("/telemetry-status").then((r) => setTelemetry(r.data || {})).catch(() => {});
  }, []);

  useEffect(() => {
    loadTests();
    loadTelemetry();

    // Auto-refresh every 4s — detect externally started runs
    autoRef.current = setInterval(async () => {
      try {
        const r   = await API.get("/tests");
        const all = r.data || [];
        setTests(all);
        const running = all.find((t) => t.status === "running");
        if (running && !runningTestId) {
          setRunningTestId(running.id);
          const rr = await API.get(`/latest-run/${running.id}`);
          if (rr.data?.run_id) {
            setActiveRunId(rr.data.run_id);
            buildGrafanaUrl(rr.data.run_id);
            pollForResult(running.id, rr.data.run_id);
          }
        }
      } catch { /* ignore */ }
    }, 4000);

    return () => {
      if (pollRef.current)  clearInterval(pollRef.current);
      if (autoRef.current)  clearInterval(autoRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── grafana URL ──────────────────────────────────────────── */
  const buildGrafanaUrl = (runId) => {
    const base = telemetry.grafana_base_url || "http://localhost:3000";
    const path = telemetry.grafana_dashboard_path || "/d/adfqsh7/k6-load-testing-results";
    setGrafanaUrl(`${base}${path}?var-run_id=${runId}&refresh=5s&from=now-5m&to=now&kiosk=tv`);
  };

  /* ── poll ─────────────────────────────────────────────────── */
  const pollForResult = (testId, runId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data: r } = await API.get(`/report/${runId}`);
        if (r.output) setOutput(r.output);
        if (r.status !== "running" && r.status !== "stopping") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setTests((p) => p.map((t) => t.id === testId ? { ...t, status: r.status } : t));
          setRunningTestId(null);
          if (r.status === "completed")     toast.success("✓ Test completed successfully!");
          else if (r.status === "stopped")  toast.info("Test stopped.");
          else                              toast.error("Test completed with failures.");
          loadTests(true);
        }
      } catch {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setRunningTestId(null);
      }
    }, 3000);
  };

  /* ── run ──────────────────────────────────────────────────── */
  const runTest = async (testId) => {
    setRunningTestId(testId);
    setOutput("");
    setTests((p) => p.map((t) => t.id === testId ? { ...t, status: "running" } : t));
    try {
      const res   = await API.post(`/run-test/${testId}`);
      const runId = res.data.run_id;
      setActiveRunId(runId);
      buildGrafanaUrl(runId);
      toast.info(`Test #${testId} started — Run #${runId}`);
      pollForResult(testId, runId);
    } catch (err) {
      setRunningTestId(null);
      setTests((p) => p.map((t) => t.id === testId ? { ...t, status: "failed" } : t));
      toast.error(err.response?.data?.detail || "Failed to start test");
    }
  };

  /* ── stop ─────────────────────────────────────────────────── */
  const stopTest = async (testId) => {
    if (!window.confirm("Stop this running test?")) return;
    setStoppingId(testId);
    try {
      await API.post(`/stop-test/${testId}`);
      setTests((p) => p.map((t) => t.id === testId ? { ...t, status: "stopping" } : t));
      toast.info("Stop signal sent.");
    } catch { toast.error("Failed to stop test"); }
    finally  { setStoppingId(null); }
  };

  /* ── delete ───────────────────────────────────────────────── */
  const deleteTest = async (testId) => {
    if (!window.confirm("Delete this test plan?")) return;
    setDeletingId(testId);
    try {
      await API.delete(`/delete-test/${testId}`);
      setTests((p) => p.filter((t) => t.id !== testId));
      toast.success("Test deleted.");
    } catch { toast.error("Delete failed"); }
    finally  { setDeletingId(null); }
  };

  /* ── copy output ──────────────────────────────────────────── */
  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  /* ── derived ──────────────────────────────────────────────── */
  const filtered    = tests.filter((t) =>
    t.test_name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search]);

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════
          PAGE HEADER  (matches screenshot 3)
          ═══════════════════════════════════════════════════ */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Run &amp; Live Monitoring</div>
          <div className="page-header-sub">Execute test scenarios and stream live terminal telemetry</div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => navigate("/createtest")}>
            <Plus size={14} /> New Test
          </button>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: "var(--r)", padding: "6px 14px",
            fontSize: 13, color: "var(--tx2)",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />
            {localStorage.getItem("full_name") || "User"}
          </div>
        </div>
      </div>

      <div className="rt-body">

        {/* ── Active run banner ── */}
        {runningTestId && (
          <div className="rt-run-banner">
            <div className="rt-run-banner-left">
              <Loader2 size={22} className="spinner" style={{ color: "var(--brand-l)" }} />
              <div>
                <h4>Test #{runningTestId} is currently executing…</h4>
                <p>
                  Run ID: <strong>#{activeRunId || "—"}</strong> ·
                  Streaming metrics live to InfluxDB &amp; Grafana
                </p>
              </div>
            </div>
            <div className="rt-run-banner-actions">
              {activeRunId && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => window.open(grafanaUrl.replace("&kiosk=tv", ""), "_blank")}
                >
                  <ExternalLink size={13} /> Grafana Live
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                disabled={stoppingId === runningTestId}
                onClick={() => stopTest(runningTestId)}
              >
                <Square size={13} />
                {stoppingId === runningTestId ? "Stopping…" : "Stop Execution"}
              </button>
            </div>
          </div>
        )}

        {/* ── "Run & Monitor Hub" card  (matches screenshot) ── */}
        <div className="rt-hub-card">
          <div className="rt-hub-left">
            <div className="rt-hub-icon">
              <Activity size={20} />
            </div>
            <div>
              <div className="rt-hub-title">Run &amp; Monitor Hub</div>
              <div className="rt-hub-sub">
                Execute load scenarios, monitor live execution, and view k6 output logs
              </div>
            </div>
          </div>
          <div className="rt-hub-right">
            <div className="search-box">
              <Search size={14} className="search-ico" />
              <input
                placeholder="Search scenarios…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => loadTests()}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate("/createtest")}>
              <Plus size={13} /> New Scenario
            </button>
          </div>
        </div>

        {/* ── Test scenarios table  (matches screenshot) ── */}
        <div className="rt-table-wrap">
          <div className="rt-table-top">
            <div className="rt-table-top-left">
              <span className="rt-table-top-title">Test Scenarios</span>
              <span className="rt-total-chip">{filtered.length}</span>
            </div>
            <div className="rt-page-info">
              Page {safePage} of {totalPages} · {filtered.length} total
            </div>
          </div>

          {loading ? (
            <div className="loading-box">
              <Loader2 size={28} className="spinner" />
              <p>Loading test scenarios…</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Scenario Name</th>
                    <th>Workload</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: "center" }}>Run</th>
                    <th style={{ textAlign: "center" }}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map((t) => (
                    <tr
                      key={t.id}
                      className={runningTestId === t.id ? "row-running" : ""}
                    >
                      <td style={{ color: "var(--tx3)", fontSize: 12, fontWeight: 600 }}>
                        #{t.id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{t.test_name}</td>
                      <td>
                        <span className="vu-chip">{t.users} VUs</span>
                      </td>
                      <td style={{ color: "var(--tx2)" }}>{t.duration}s</td>
                      <td>
                        <span className={statusBadge(t.status)}>
                          {(t.status === "running" || t.status === "stopping") && (
                            <Loader2 size={10} className="spinner" />
                          )}
                          {t.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--tx3)", fontSize: 12 }}>
                        {new Date(t.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>

                      {/* Run / Stop */}
                      <td style={{ textAlign: "center" }}>
                        {t.status === "running" ? (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={stoppingId === t.id}
                            onClick={() => stopTest(t.id)}
                          >
                            {stoppingId === t.id
                              ? <><Loader2 size={12} className="spinner" /> Stopping…</>
                              : <><Square size={12} /> Stop</>}
                          </button>
                        ) : (
                          <button
                            className="btn-run-now"
                            disabled={!!runningTestId}
                            onClick={() => runTest(t.id)}
                          >
                            <PlayCircle size={13} /> Run Now
                          </button>
                        )}
                      </td>

                      {/* Manage */}
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Edit scenario"
                            disabled={runningTestId === t.id}
                            onClick={() => navigate(`/createtest/${t.id}`)}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon btn-sm"
                            title="Delete scenario"
                            disabled={deletingId === t.id || runningTestId === t.id}
                            onClick={() => deleteTest(t.id)}
                          >
                            {deletingId === t.id
                              ? <Loader2 size={13} className="spinner" />
                              : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <FileText size={28} />
                          <h3>No test scenarios found</h3>
                          <p>
                            {search
                              ? "No results match your search."
                              : "Create a test scenario to get started."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ── Pagination ── */}
              {filtered.length > PAGE_SIZE && (
                <Pagination
                  total={filtered.length}
                  page={safePage}
                  setPage={setPage}
                />
              )}
            </>
          )}
        </div>

        {/* ── Grafana embed ── */}
        {grafanaUrl && (
          <div className="rt-grafana-card">
            <div className="rt-grafana-hdr">
              <div className="rt-grafana-hdr-left">
                <div
                  className="pulse-anim"
                  style={{ color: "var(--brand-l)", display: "flex", alignItems: "center" }}
                >
                  <Activity size={18} />
                </div>
                <div>
                  <h3>Grafana Live Telemetry</h3>
                  <p>Real-time metrics stream for Run #{activeRunId}</p>
                </div>
              </div>
              <div className="rt-grafana-hdr-right">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => window.open(grafanaUrl.replace("&kiosk=tv", ""), "_blank")}
                >
                  <ExternalLink size={13} /> Open in New Tab
                </button>
                {activeRunId && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/report/${activeRunId}`)}
                  >
                    <FileText size={13} /> View Report
                  </button>
                )}
              </div>
            </div>
            <div className="rt-grafana-body">
              <iframe
                src={grafanaUrl}
                width="100%"
                height="460px"
                style={{ border: "none", borderRadius: 8 }}
                title="Grafana Dashboard"
              />
              <div className="rt-grafana-note">
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  If the dashboard is blank, enable{" "}
                  <code style={{ fontFamily: "monospace", fontSize: 11 }}>allow_embedding = true</code>{" "}
                  in <code style={{ fontFamily: "monospace", fontSize: 11 }}>grafana.ini</code>, or
                  click "Open in New Tab".
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Terminal output ── */}
        {output && (
          <div className="rt-terminal-card">
            <div className="rt-terminal-hdr">
              <div className="rt-terminal-hdr-left">
                <Terminal size={15} />
                <span>Execution Output &amp; k6 Console</span>
              </div>
              <div className="rt-terminal-hdr-right">
                <button className="btn btn-ghost btn-sm" onClick={copyOutput}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy Log"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setOutput("")}>
                  Clear
                </button>
              </div>
            </div>
            <pre className="terminal" style={{ margin: 0, borderRadius: 0, border: "none" }}>
              {output}
            </pre>
          </div>
        )}

      </div>
    </Layout>
  );
}
