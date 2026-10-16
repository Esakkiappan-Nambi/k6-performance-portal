import React, { useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Zap, Activity } from "lucide-react";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/login", form);
      localStorage.clear();
      sessionStorage.setItem("token", res.data.access_token);
      if (res.data.full_name) localStorage.setItem("full_name", res.data.full_name);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      {/* ── Branding panel ── */}
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={20} color="#fff" /></div>
          <span className="auth-logo-name">K6 <span>Portal</span></span>
        </div>

        <div className="auth-hero">
          <div className="auth-eyebrow"><Activity size={11} /> Performance Suite</div>
          <h1>Load test at<br /><em>enterprise scale</em></h1>
          <p>
            JMeter-style HTTP recording, Grafana real-time telemetry,
            intelligent k6 script generation and SLA reporting — all in one platform.
          </p>
        </div>

        <div className="auth-features">
          {[
            "HTTP(S) Script Recorder — proxy-based",
            "Grafana + InfluxDB live dashboards",
            "Swagger / OpenAPI import",
            "CSV data-driven testing",
            "PDF reports with assertions",
          ].map((f) => (
            <div className="auth-feat" key={f}>
              <span className="auth-feat-dot" />{f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Sign in</h2>
          <p className="auth-card-sub">Enter your credentials to access the portal</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <div className="auth-input-row">
                <Mail size={14} className="auth-input-ico" />
                <input className="auth-inp" type="email" name="email"
                  placeholder="you@company.com"
                  value={form.email} onChange={handleChange}
                  required autoComplete="email" />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-row">
                <Lock size={14} className="auth-input-ico" />
                <input className="auth-inp" type="password" name="password"
                  placeholder="Your password"
                  value={form.password} onChange={handleChange}
                  required autoComplete="current-password" />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block" }} /> Signing in…</>
                : <><Zap size={14} /> Sign In</>}
            </button>
          </form>

          <p className="auth-foot">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
