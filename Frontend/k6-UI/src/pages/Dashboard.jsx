import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FileText, Activity, CheckCircle, Clock,
  Plus, TrendingUp, ChevronRight, Pencil,
  PlayCircle, BarChart3, ExternalLink,
} from "lucide-react";
import API from "../services/api";
import Layout from "../components/Layout";
import ExecutionChart from "./ExecutionChart";

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

export default function Dashboard() {
  const navigate  = useNavigate();
  const fullName  = localStorage.getItem("full_name") || "User";

  const [stats,     setStats]     = useState({ total_tests: 0, total_runs: 0, success_rate: 0, running_runs: 0 });
  const [recent,    setRecent]    = useState([]);
  const [telemetry, setTelemetry] = useState({
    grafana_online: false, influxdb_online: false,
    grafana_base_url: "http://localhost:3000",
    grafana_dashboard_path: "/d/adfqsh7/k6-load-testing-results",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, r, t] = await Promise.all([
        API.get("/dashboard-stats"),
        API.get("/recent-tests"),
        API.get("/telemetry-status").catch(() => ({ data: {} })),
      ]);
      setStats(s.data   || {});
      setRecent(r.data  || []);
      if (t.data) setTelemetry(t.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const successRate = parseFloat(stats.success_rate || 0);

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════
          PAGE HEADER  (matches screenshot 1)
          ═══════════════════════════════════════════════════ */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Dashboard Overview</div>
          <div className="page-header-sub">Real-time health, execution trends, and active workloads</div>
        </div>
        {/* no right-side buttons on the header itself — they're in the hero */}
      </div>

      {/* ═══════════════════════════════════════════════════
          HERO WELCOME SECTION
          ═══════════════════════════════════════════════════ */}
      <div className="dash-hero">
        <div className="dash-hero-top">
          <div className="dash-hero-greeting">
            <h1>Welcome back, {fullName} 👋</h1>
            <p>
              Monitor <span style={{ color: "var(--brand-l)" }}>live</span> k6 test suites,
              track latency trends, and trigger load scenarios with{" "}
              <span style={{ color: "var(--brand-l)" }}>high concurrency</span>.
            </p>
          </div>
          <div className="dash-hero-actions">
            <button className="btn btn-primary" onClick={() => navigate("/createtest")}>
              <Plus size={14} /> Create Test Scenario
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          STAT CARDS  (matches screenshot 1 — dark cards)
          ═══════════════════════════════════════════════════ */}
      <div className="dash-stat-row">
        {/* Configured Tests */}
        <div className="dash-stat">
          <div className="dash-stat-top">
            <div>
              <div className="dash-stat-label">Configured Tests</div>
              <div className="dash-stat-value">{stats.total_tests || 0}</div>
            </div>
            <div className="dash-stat-icon ds-blue">
              <FileText size={20} />
            </div>
          </div>
          <div className="dash-stat-sub">Defined scenarios in catalog</div>
        </div>

        {/* Total Executions */}
        <div className="dash-stat">
          <div className="dash-stat-top">
            <div>
              <div className="dash-stat-label">Total Executions</div>
              <div className="dash-stat-value">{stats.total_runs || 0}</div>
            </div>
            <div className="dash-stat-icon ds-cyan">
              <Activity size={20} />
            </div>
          </div>
          <div className="dash-stat-sub">All-time triggered k6 runs</div>
        </div>

        {/* Overall Success Rate */}
        <div className="dash-stat">
          <div className="dash-stat-top">
            <div>
              <div className="dash-stat-label">Overall Success Rate</div>
              <div className="dash-stat-value">{successRate.toFixed(2)}%</div>
            </div>
            <div className="dash-stat-icon ds-green">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="dash-stat-progress">
            <div className="dash-stat-progress-fill" style={{ width: `${Math.min(successRate, 100)}%` }} />
          </div>
        </div>

        {/* Active Executions */}
        <div className="dash-stat">
          <div className="dash-stat-top">
            <div>
              <div className="dash-stat-label">Active Executions</div>
              <div className="dash-stat-value">{stats.running_runs || 0}</div>
            </div>
            <div className="dash-stat-icon ds-amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="dash-stat-sub">Tests currently executing</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          BODY: Chart + Recent Table
          ═══════════════════════════════════════════════════ */}
      <div className="dash-body">

        {/* Execution Trend Chart */}
        <div className="dash-chart-card">
          <div className="dash-chart-hdr">
            <div className="dash-chart-hdr-left">
              <h3><TrendingUp size={16} /> Execution Performance Trend</h3>
              <p>Cumulative test executions</p>
            </div>
            <div className="dash-chart-legend">
              <div className="dash-chart-legend-item">
                <span className="legend-dot" style={{ background: "#ef4444" }} />
                Failed Runs
              </div>
              <div className="dash-chart-legend-item">
                <span className="legend-dot" style={{ background: "#22c55e" }} />
                Passed Runs
              </div>
            </div>
          </div>
          <ExecutionChart />
        </div>

        {/* Recent Test Scenarios */}
        <div className="dash-table-card">
          <div className="dash-table-hdr">
            <div>
              <h3>Recent Test Scenarios</h3>
              <p>Quick access to your latest performance test configurations</p>
            </div>
            <button className="dash-view-all" onClick={() => navigate("/run-test")}>
              View All Tests <ChevronRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="loading-box" style={{ padding: "40px" }}>
              <div className="spinner" style={{ width: 22, height: 22, border: "2px solid var(--border)", borderTopColor: "var(--brand)", borderRadius: "50%", display: "inline-block" }} />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Scenario Name</th>
                  <th>Workload</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.length > 0 ? recent.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: "var(--tx3)", fontSize: 12 }}>#{t.id}</td>
                    <td style={{ fontWeight: 600 }}>{t.test_name}</td>
                    <td><span className="vu-chip">{t.users} VUs</span></td>
                    <td style={{ color: "var(--tx2)" }}>{t.duration}s</td>
                    <td><span className={statusBadge(t.status)}>{t.status}</span></td>
                    <td style={{ color: "var(--tx3)", fontSize: 12 }}>
                      {new Date(t.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          className="btn-run-now"
                          onClick={() => navigate("/run-test")}
                        >
                          <PlayCircle size={13} /> Run Now
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Edit"
                          onClick={() => navigate(`/createtest/${t.id}`)}
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state" style={{ padding: "40px" }}>
                        <FileText size={32} />
                        <h3>No test scenarios yet</h3>
                        <p>Click "Create Test Scenario" to build your first k6 test.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}
