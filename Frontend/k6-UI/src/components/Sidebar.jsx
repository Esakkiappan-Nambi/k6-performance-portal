import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FilePlus2, PlayCircle,
  BarChart3, LogOut, Zap, Radio,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "../services/api";

/* NAV definition matching screenshots exactly */
const NAV_SECTIONS = [
  {
    label: "MAIN NAVIGATION",
    items: [
      { text: "Dashboard",        icon: LayoutDashboard, path: "/dashboard"  },
      { text: "Scenario Studio",  icon: FilePlus2,       path: "/createtest", badge: "BUILDER" },
      { text: "HTTP Recorder",    icon: Radio,           path: "/recorder",   badge: "NEW" },
      { text: "Run & Monitor",    icon: PlayCircle,      path: "/run-test"   },
      { text: "Reports & History",icon: BarChart3,       path: "/history"    },
    ],
  },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const fullName  = localStorage.getItem("full_name") || "User";
  const initials  = fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const [k6Info, setK6Info] = useState({
    version: "k6.exe v2.2.0",
    commit:  "commit/00a9a1b7f5",
    go:      "go 1.26.5, windows/amd64",
    path:    "C:\\Program Files\\k6\\k6.exe",
  });

  useEffect(() => {
    API.get("/telemetry-status").catch(() => {});
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    toast.success("Signed out");
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/createtest") return location.pathname.startsWith("/createtest");
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
      {/* ── Brand ── */}
      <div className="sb-brand" onClick={() => navigate("/dashboard")}>
        <div className="sb-brand-icon">
          <Zap size={17} color="#fff" />
        </div>
        <div className="sb-brand-text">
          <div className="sb-brand-name">K6 <span>Portal</span></div>
          <div className="sb-brand-sub">Performance Suite</div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="sb-nav">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label}>
            <div className="sb-section-label">{label}</div>
            {items.map(({ text, icon: Icon, path, badge }) => (
              <div
                key={path}
                className={`sb-item${isActive(path) ? " active" : ""}`}
                onClick={() => navigate(path)}
              >
                <span className="sb-item-ico"><Icon size={15} /></span>
                <span style={{ flex: 1 }}>{text}</span>
                {badge && <span className="sb-badge">{badge}</span>}
              </div>
            ))}
          </div>
        ))}

        <div className="sb-divider" style={{ margin: "12px 12px 10px" }} />

        {/* ── k6 Engine Status Card ── */}
        <div className="sb-engine-card">
          <div className="sb-engine-header">
            <span className="sb-engine-dot" />
            <span className="sb-engine-title">k6 Engine Ready</span>
          </div>
          <div className="sb-engine-meta">
            {k6Info.version} ({k6Info.commit}, go<br />
            {k6Info.go})<br />
            {k6Info.path}
          </div>
        </div>
      </nav>

      {/* ── User footer ── */}
      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">{initials}</div>
          <div className="sb-user-info">
            <div className="sb-user-name">{fullName}</div>
            <div className="sb-user-role">Performance Tester</div>
          </div>
          <button className="sb-logout" title="Sign out" onClick={handleLogout}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
