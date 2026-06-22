import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
});
const navigate = useNavigate();
const handleChange = (e) => {
    setFormData({...formData,[e.target.name]: e.target.value,
    });
};

const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
    }

    const payload = {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword
    };

    try {
    const response = await API.post(
        "/register",
        payload
    );
    toast.success("Registration Successful!");
    sessionStorage.clear();
    sessionStorage.setItem("full_name", formData.fullName);
    console.log(response.data);
    navigate("/");
} catch (error) {

    console.log("Full Error:", error);

    toast.error(error.response?.data?.detail || "Registration Failed");
}
    // localStorage.setItem( "full_name",response.data.full_name);
};
return (
    <div className="register-container">
    <div className="register-card">

        <h1>K6 Performance Portal</h1>
        <p className="subtitle">Create Your Account</p>

        <form onSubmit={handleRegister}>

        <div className="input-group">
            <label>Full Name</label>
            <input type="text" name="fullName" placeholder="Enter Full Name" value={formData.fullName} onChange={handleChange} required
            />
        </div>

        <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="Enter Email" value={formData.email} onChange={handleChange} required
            />
        </div>

        <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Enter Password" value={formData.password} onChange={handleChange}
            required
            />
        </div>

        <div className="input-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required
            />
        </div>

        <button type="submit" className="register-btn">
            Register
        </button>

        <div className="login-link">
    <p>
    Already have an account?{" "}
    <Link to="/">
    Login
    </Link>
</p>
</div>

        </form>

    </div>
    </div>
);
}

export default Register;