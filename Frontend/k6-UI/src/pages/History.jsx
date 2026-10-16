import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import {
  Trash2, Search, ExternalLink, FileText,
  BarChart3, Plus, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

/* ── helpers ─────────────────────────────────────────────────── */
function statusBadge(s) {
  const map = {
    completed: "badge-completed", failed: "badge-failed",
    running:   "badge-running",   stopping: "badge-stopping",
    stopped:   "badge-stopped",   created:  "badge-created",
  };
  return `badge ${map[s?.toLowerCase()] || "badge-stopped"}`;
}

const PAGE_SIZE = 15;

function Pagination({ total, page, setPage }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total === 0) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
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
        <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
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
          disabled={page === Math.ceil(total / PAGE_SIZE)}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function History() {
  const navigate  = useNavigate();
  const [runs,    setRuns]    = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const r = await API.get("/test-runs");
      setRuns(r.data || []);
    } catch {
      toast.error("Failed to load execution history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search]);

  const deleteRun = async (id) => {
    if (!window.confirm("Delete this execution run record?")) return;
    try {
      await API.delete(`/delete-run/${id}`);
      setRuns((p) => p.filter((r) => r.id !== id));
      toast.success("Run record deleted.");
    } catch {
      toast.error("Delete failed");
    }
  };

  const filtered   = runs.filter((r) =>
    (r.test_name || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════
          PAGE HEADER  (matches screenshot 4)
          ═══════════════════════════════════════════════════ */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Execution History &amp; Reports</div>
          <div className="page-header-sub">
            Audited records of past k6 runs, latency breakdowns, and diagnostics
          </div>
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

      <div className="hist-body">

        {/* ── Title + Search row (matches screenshot 4) ── */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 14, marginBottom: 20, flexWrap: "wrap",
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--tx)", marginBottom: 4 }}>
              Execution History &amp; Diagnostics
            </h2>
            <p style={{ fontSize: 13, color: "var(--tx2)" }}>
              Browse past performance runs, view reports, or open Grafana dashboards
            </p>
          </div>
          <div className="search-box">
            <Search size={14} className="search-ico" />
            <input
              placeholder="Search by scenario name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="hist-table-wrap">
          <div className="hist-table-top">
            <div className="hist-table-top-left">
              <span className="hist-table-title">Execution Runs</span>
              <span className="hist-total-chip">{filtered.length}</span>
            </div>
            <div className="hist-page-info">
              Page {safePage} of {totalPages} · {filtered.length} total
            </div>
          </div>

          {loading ? (
            <div className="loading-box">
              <Loader2 size={28} className="spinner" />
              <p>Loading execution history…</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Scenario Name</th>
                    <th>Status</th>
                    <th>Executed At</th>
                    <th style={{ textAlign: "center" }}>Diagnostics</th>
                    <th style={{ textAlign: "center" }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map((r) => (
                    <tr key={r.id}>
                      <td style={{ color: "var(--tx3)", fontSize: 12, fontWeight: 600 }}>
                        #{r.id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.test_name}</td>
                      <td>
                        <span className={statusBadge(r.status)}>{r.status}</span>
                      </td>
                      <td style={{ color: "var(--tx2)", fontSize: 12 }}>
                        {new Date(r.started_at || Date.now()).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/report/${r.id}`)}
                          >
                            <BarChart3 size={12} /> Report
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              window.open(
                                `http://localhost:3000/d/adfqsh7/k6-load-testing-results?var-run_id=${r.id}&from=now-1h&to=now`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink size={12} /> Grafana
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          title="Delete run"
                          onClick={() => deleteRun(r.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <FileText size={28} />
                          <h3>No execution runs found</h3>
                          <p>
                            {search
                              ? "No runs match your search."
                              : "Run a test scenario to see execution history here."}
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

      </div>
    </Layout>
  );
}
