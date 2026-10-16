import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";
import { Mail, Lock, User, Zap, Activity } from "lucide-react";
import "./Login.css";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await API.post("/register", {
        full_name: form.fullName,
        email: form.email,
        password: form.password,
        confirm_password: form.confirmPassword,
      });
      toast.success("Account created — please sign in");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={20} color="#fff" /></div>
          <span className="auth-logo-name">K6 <span>Portal</span></span>
        </div>
        <div className="auth-hero">
          <div className="auth-eyebrow"><Activity size={11} /> Performance Suite</div>
          <h1>Start testing<br /><em>in minutes</em></h1>
          <p>Create your account and immediately build JMeter-style load tests with HTTP recording, Grafana dashboards and smart assertions.</p>
        </div>
        <div className="auth-features">
          {["No setup required","HTTP proxy recorder included","Import Swagger / OpenAPI specs","Scheduled test execution","PDF + Grafana reports"].map((f) => (
            <div className="auth-feat" key={f}><span className="auth-feat-dot" />{f}</div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Create account</h2>
          <p className="auth-card-sub">Get started with enterprise performance testing</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-row">
                <User size={14} className="auth-input-ico" />
                <input className="auth-inp" type="text" name="fullName" placeholder="Jane Smith"
                  value={form.fullName} onChange={handleChange} required autoComplete="name" />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Work Email</label>
              <div className="auth-input-row">
                <Mail size={14} className="auth-input-ico" />
                <input className="auth-inp" type="email" name="email" placeholder="you@company.com"
                  value={form.email} onChange={handleChange} required autoComplete="email" />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-row">
                <Lock size={14} className="auth-input-ico" />
                <input className="auth-inp" type="password" name="password" placeholder="Min 8 characters"
                  value={form.password} onChange={handleChange} required minLength={8} />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-row">
                <Lock size={14} className="auth-input-ico" />
                <input className="auth-inp" type="password" name="confirmPassword" placeholder="Repeat password"
                  value={form.confirmPassword} onChange={handleChange} required />
              </div>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block"}} /> Creating…</>
                : <><User size={14} /> Create Account</>}
            </button>
          </form>
          <p className="auth-foot">Already have an account? <Link to="/">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
