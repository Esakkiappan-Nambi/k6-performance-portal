import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../services/api";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking"); // checking | ok | fail

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) { setStatus("fail"); return; }
    API.get("/verify-token")
      .then(() => setStatus("ok"))
      .catch(() => setStatus("fail"));
  }, []);

  if (status === "checking") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-primary)", color:"var(--text-secondary)", fontSize:13 }}>
      Verifying session…
    </div>
  );

  if (status === "fail") return <Navigate to="/" replace />;
  return children;
}
