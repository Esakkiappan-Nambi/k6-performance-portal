import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio, Plus, RefreshCw, Upload, PlayCircle, Square,
  Info, X, Globe, Clock, Filter, ChevronRight,
  FileCode, Wifi, Settings, Trash2, ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Recorder.css";

/* ── helpers ── */
const statusClass = (code) => {
  if (!code) return "";
  if (code < 300) return "rec-status-2xx";
  if (code < 400) return "rec-status-3xx";
  return "rec-status-4xx";
};

const fmt = (ms) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;

const DEFAULT_SESSION = (n) => ({
  id: Date.now(),
  name: n || "New Session",
  proxyPort: 8888,
  filter: "",
  status: "idle",   // idle | recording | stopped
  requests: [],
  createdAt: new Date().toISOString(),
});

/* ── HAR parser ── */
function parseHAR(harText) {
  try {
    const har = JSON.parse(harText);
    const entries = har?.log?.entries || [];
    return entries.map((e, i) => {
      const req = e.request || {};
      const res = e.response || {};
      const url = req.url || "";
      let body = "";
      try { body = req.postData?.text || ""; } catch { body = ""; }
      const headers = {};
      (req.headers || []).forEach((h) => { headers[h.name] = h.value; });
      return {
        id: Date.now() + i,
        method: req.method || "GET",
        url,
        status: res.status || 0,
        duration: Math.round(e.time || 0),
        size: res.content?.size || 0,
        body,
        headers,
        responseBody: res.content?.text || "",
        contentType: res.content?.mimeType || "",
        timestamp: e.startedDateTime || new Date().toISOString(),
      };
    }).filter((r) => r.url && (r.url.startsWith("http://") || r.url.startsWith("https://")));
  } catch {
    return [];
  }
}

export default function Recorder() {
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [sessions, setSessions]         = useState([DEFAULT_SESSION("test")]);
  const [activeId, setActiveId]         = useState(sessions[0].id);
  const [showModal, setShowModal]       = useState(false);
  const [newName, setNewName]           = useState("");
  const [newPort, setNewPort]           = useState(8888);
  const [newFilter, setNewFilter]       = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [selectedReq, setSelectedReq]  = useState(null);
  const [converting, setConverting]     = useState(false);
  const pollRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeId) || sessions[0];

  /* ── polling for live proxy captures ── */
  const startPoll = (sessionId) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const res = await API.get(`/recorder/session/${sessionId}/requests`);
        if (res.data?.requests) {
          setSessions((prev) => prev.map((s) =>
            s.id === sessionId ? { ...s, requests: res.data.requests } : s
          ));
        }
      } catch { /* proxy not running – silent */ }
    }, 1500);
  };

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  useEffect(() => () => stopPoll(), []);

  /* ── start recording (launches backend proxy) ── */
  const startRecording = async (session) => {
    try {
      await API.post("/recorder/start", {
        session_id: session.id,
        port: session.proxyPort,
        filter: session.filter,
      });
      setSessions((prev) => prev.map((s) =>
        s.id === session.id ? { ...s, status: "recording", requests: [] } : s
      ));
      setActiveId(session.id);
      startPoll(session.id);
      toast.success(`Proxy started on port ${session.proxyPort} — set your browser to use 127.0.0.1:${session.proxyPort}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to start proxy. Is mitmproxy installed?");
    }
  };

  /* ── stop recording ── */
  const stopRecording = async (session) => {
    stopPoll();
    try {
      await API.post("/recorder/stop", { session_id: session.id });
    } catch { /* ignore */ }
    setSessions((prev) => prev.map((s) =>
      s.id === session.id ? { ...s, status: "stopped" } : s
    ));
    toast.info(`Recording stopped — ${session.requests.length} request(s) captured`);
  };

  /* ── HAR import ── */
  const handleHARImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseHAR(ev.target.result);
      if (!parsed.length) { toast.error("No valid HTTP entries found in HAR file"); return; }
      setSessions((prev) => prev.map((s) =>
        s.id === activeId
          ? { ...s, requests: [...s.requests, ...parsed], status: "stopped" }
          : s
      ));
      toast.success(`Imported ${parsed.length} request(s) from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ── convert to k6 / import into scenario builder ── */
  const convertToScenario = async () => {
    if (!activeSession.requests.length) { toast.error("No requests to convert"); return; }
    setConverting(true);
    try {
      const steps = activeSession.requests
        .filter((r) => methodFilter === "ALL" || r.method === methodFilter)
        .map((r, i) => ({
          id: Date.now() + i,
          name: `Request ${i + 1} — ${new URL(r.url).pathname}`,
          method: r.method,
          url: r.url,
          headers: JSON.stringify(r.headers || {}),
          body: r.body || "",
          enabled: true,
          thinkTime: 1000,
          extractVariable: false,
          variableName: "",
          jsonPath: "",
          params: [],
          assertions: { enabled: true, status_code: r.status || 200, max_response_time: 2000, text_assertions: [] },
          retry: { enabled: false, maxRetries: 3, retryDelay: 1000, retryOn: [500,502,503], retryOnTimeout: true },
        }));

      // Store in sessionStorage for CreateTest to pick up
      sessionStorage.setItem("recorder_import", JSON.stringify(steps));
      toast.success(`${steps.length} request(s) ready — opening Scenario Studio`);
      setTimeout(() => navigate("/createtest"), 800);
    } catch (err) {
      toast.error("Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  /* ── new session ── */
  const createSession = () => {
    if (!newName.trim()) { toast.error("Enter a session name"); return; }
    const s = DEFAULT_SESSION(newName.trim());
    s.proxyPort = newPort;
    s.filter    = newFilter;
    setSessions((prev) => [...prev, s]);
    setActiveId(s.id);
    setShowModal(false);
    setNewName(""); setNewPort(8888); setNewFilter("");
  };

  /* ── delete session ── */
  const deleteSession = (id) => {
    if (sessions.length === 1) { toast.error("Keep at least one session"); return; }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(sessions.find((s) => s.id !== id)?.id);
    toast.success("Session deleted");
  };

  /* ── filtered requests ── */
  const filtered = activeSession.requests.filter(
    (r) => methodFilter === "ALL" || r.method === methodFilter
  );

  const METHODS = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"];

  return (
    <Layout>
      <div className="rec-page">
        {/* ── White topbar ── */}
        <div className="rec-topbar">
          <div className="rec-topbar-left">
            <h2>HTTP(S) Test Script Recorder</h2>
            <p>Capture real browser traffic through the proxy and convert it to a k6 scenario</p>
          </div>
          <div className="rec-topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => { stopPoll(); setSessions((p) => p.map((s) => s.id === activeId ? { ...s, requests: [] } : s)); toast.info("Refreshed"); }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <input ref={fileRef} type="file" accept=".har,application/json" style={{ display:"none" }} onChange={handleHARImport} />
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
              <Upload size={13} /> Import HAR
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={13} /> New Session
            </button>
          </div>
        </div>

        {/* ── Quick-start bar ── */}
        <div className="rec-quickstart">
          <Info size={14} style={{ flexShrink:0, marginTop:1 }} />
          <span>
            <strong>Quick start:</strong> Create a session
            <span className="rec-qs-arrow">→</span> Start Recording
            <span className="rec-qs-arrow">→</span> Set your browser proxy to <code>127.0.0.1:&lt;port&gt;</code>
            <span className="rec-qs-arrow">→</span> Browse your app
            <span className="rec-qs-arrow">→</span> Stop Recording
            <span className="rec-qs-arrow">→</span> Review &amp; Convert to k6 Test.
            &nbsp;Or <strong>import a .har file</strong> exported from Chrome / Firefox DevTools.
          </span>
        </div>

        {/* ── Body split ── */}
        <div className="rec-body">
          {/* Sessions panel */}
          <div className="rec-sessions-panel">
            <div className="rec-sessions-header">
              <span className="rec-sessions-title">
                <Radio size={12} /> Sessions
              </span>
              <span className="rec-session-count">{sessions.length}</span>
            </div>
            <div className="rec-sessions-list">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`rec-session-item${s.id === activeId ? " active" : ""}`}
                  onClick={() => setActiveId(s.id)}
                >
                  <div className="rec-session-name">{s.name}</div>
                  <div className="rec-session-meta">
                    <span className={`rec-session-status ${s.status === "recording" ? "rec-status-recording" : s.status === "stopped" ? "rec-status-stopped" : "rec-status-idle"}`}>
                      {s.status === "recording" && <span className="rec-blink" style={{ width:5,height:5,borderRadius:"50%",background:"currentColor",display:"inline-block",marginRight:3 }} />}
                      {s.status.toUpperCase()}
                    </span>
                    <Globe size={10} /> :{s.proxyPort}
                    <span>{s.requests.length} req</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="rec-right">
            {/* Session detail header */}
            <div className="rec-detail-header">
              <div className="rec-detail-name">
                {activeSession.name}
                <span className={`rec-session-status ${activeSession.status === "recording" ? "rec-status-recording" : activeSession.status === "stopped" ? "rec-status-stopped" : "rec-status-idle"}`}>
                  {activeSession.status === "recording" && <span className="rec-blink" style={{ width:5,height:5,borderRadius:"50%",background:"currentColor",display:"inline-block",marginRight:3 }} />}
                  {activeSession.status.toUpperCase()}
                </span>
              </div>
              <div className="rec-detail-meta">
                <span><Globe size={11} /> Proxy: <code style={{ fontFamily:"monospace",fontSize:11 }}>127.0.0.1:{activeSession.proxyPort}</code></span>
                {activeSession.filter && <span><Filter size={11} /> Filter: <code style={{ fontFamily:"monospace",fontSize:11 }}>{activeSession.filter}</code></span>}
              </div>
              <div className="rec-detail-actions">
                <input ref={fileRef} type="file" accept=".har,application/json" style={{ display:"none" }} onChange={handleHARImport} />
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
                  <Upload size={12} /> Import HAR
                </button>
                {activeSession.status === "recording" ? (
                  <button className="btn btn-danger btn-sm" onClick={() => stopRecording(activeSession)}>
                    <Square size={12} /> Stop Recording
                  </button>
                ) : (
                  <button className="btn btn-rec btn-sm" onClick={() => startRecording(activeSession)}>
                    <Radio size={12} className={activeSession.status === "recording" ? "rec-blink" : ""} />
                    Start Recording
                  </button>
                )}
                <button className="btn btn-ghost btn-sm btn-icon" title="Delete session" onClick={() => deleteSession(activeSession.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Method filter toolbar */}
            {activeSession.requests.length > 0 && (
              <div className="rec-requests-toolbar">
                {METHODS.map((m) => (
                  <button key={m} className={`rec-filter-pill${methodFilter === m ? " active" : ""}`} onClick={() => setMethodFilter(m)}>
                    {m}
                  </button>
                ))}
                <span className="rec-req-count">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            )}

            {/* Requests table or empty */}
            <div className="rec-requests-area" style={{ display:"flex", flex:1, overflow:"hidden" }}>
              <div style={{ flex:1, overflowY:"auto" }}>
                {filtered.length > 0 ? (
                  <table className="rec-req-table">
                    <thead>
                      <tr>
                        <th style={{ width:32 }}>#</th>
                        <th style={{ width:60 }}>Method</th>
                        <th>URL</th>
                        <th style={{ width:60 }}>Status</th>
                        <th style={{ width:80 }}>Duration</th>
                        <th style={{ width:80 }}>Size</th>
                        <th style={{ width:60 }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr
                          key={r.id}
                          className={selectedReq?.id === r.id ? "selected" : ""}
                          onClick={() => setSelectedReq(selectedReq?.id === r.id ? null : r)}
                        >
                          <td style={{ color:"var(--text-muted)", fontSize:11 }}>{i + 1}</td>
                          <td><span className={`m-badge m-${r.method}`}>{r.method}</span></td>
                          <td className="rec-url-cell" title={r.url}>{r.url}</td>
                          <td className={`rec-status-code ${statusClass(r.status)}`}>{r.status || "—"}</td>
                          <td style={{ color:"var(--text-secondary)", fontSize:11 }}>{fmt(r.duration)}</td>
                          <td style={{ color:"var(--text-muted)", fontSize:11 }}>{r.size ? `${(r.size/1024).toFixed(1)}KB` : "—"}</td>
                          <td style={{ color:"var(--text-muted)", fontSize:11 }}>
                            {new Date(r.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="rec-empty">
                    <div className="rec-empty-icon"><Wifi size={22} /></div>
                    <h3>No captured requests</h3>
                    <p>
                      Start recording or <a onClick={() => fileRef.current?.click()}>import a .har file</a> to populate this table.
                    </p>
                  </div>
                )}
              </div>

              {/* Request detail drawer */}
              {selectedReq && (
                <div className="rec-drawer fade-in">
                  <div className="rec-drawer-header">
                    <span className="rec-drawer-title">Request Detail</span>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedReq(null)}><X size={13} /></button>
                  </div>
                  <div className="rec-drawer-body">
                    <div className="rec-drawer-section">
                      <div className="rec-drawer-section-title">Request</div>
                      <div className="rec-drawer-kv">
                        {selectedReq.method} {selectedReq.url}{"\n\n"}
                        {Object.entries(selectedReq.headers || {}).map(([k,v]) => `${k}: ${v}`).join("\n")}
                        {selectedReq.body ? `\n\n${selectedReq.body}` : ""}
                      </div>
                    </div>
                    <div className="rec-drawer-section">
                      <div className="rec-drawer-section-title">Response</div>
                      <div className="rec-drawer-kv">
                        Status: {selectedReq.status}{"\n"}
                        Content-Type: {selectedReq.contentType}{"\n"}
                        Duration: {fmt(selectedReq.duration)}{"\n"}
                        {selectedReq.responseBody ? `\n${selectedReq.responseBody.slice(0, 1200)}` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Convert to k6 banner */}
            {activeSession.requests.length > 0 && (
              <div className="rec-convert-banner">
                <FileCode size={18} style={{ color:"var(--brand-light)", flexShrink:0 }} />
                <div className="rec-convert-info">
                  <strong>{activeSession.requests.length} request(s) captured.</strong>{" "}
                  Convert them into a k6 scenario and open Scenario Studio to configure load, assertions and thresholds.
                </div>
                <button className="btn btn-primary" onClick={convertToScenario} disabled={converting}>
                  {converting ? "Converting…" : <><ArrowRight size={14} /> Convert to k6 Scenario</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── New Session Modal ── */}
      {showModal && (
        <div className="rec-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="rec-modal fade-in">
            <h3>New Recording Session</h3>
            <p>Configure the proxy port and optional URL filter for this session.</p>
            <div className="rec-modal-fields">
              <div className="form-group">
                <label className="form-label">Session Name</label>
                <input className="form-input" placeholder="e.g. checkout-flow"
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createSession()} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Proxy Port</label>
                <input className="form-input" type="number" min={1024} max={65535}
                  value={newPort} onChange={(e) => setNewPort(Number(e.target.value))} />
                <span style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>
                  Set your browser HTTP proxy to <code style={{ fontFamily:"monospace" }}>127.0.0.1:{newPort}</code>
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">URL Filter <span style={{ fontWeight:400,color:"var(--text-muted)" }}>(optional)</span></label>
                <input className="form-input" placeholder="e.g. api.myapp.com"
                  value={newFilter} onChange={(e) => setNewFilter(e.target.value)} />
                <span style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>
                  Only capture requests matching this domain/path substring
                </span>
              </div>
            </div>
            <div className="rec-modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createSession}>
                <Plus size={13} /> Create Session
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
