import React, { useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {

  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
      email: "",
      password: "",
  });

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("/login", loginData);

      console.log("Login Response:", response.data);
      
      localStorage.clear();
      sessionStorage.setItem("token", response.data.access_token);

      if (response.data.full_name) {
        localStorage.setItem("full_name", response.data.full_name);
      }

      toast.success("Login Successful");
      navigate("/dashboard");

    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.detail ||
        "Login Failed"
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h1>Cogni k6 Portal</h1>
        <p className="subtitle">Login to continue</p>

        <form onSubmit={handleLogin}>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={loginData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={loginData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>

          <div className="signup-link">
            <p>
              New User?{" "}
              <Link to="/register">Create Account</Link>
            </p>
          </div>

        </form>

      </div>
    </div>
  );
}

export default Login;