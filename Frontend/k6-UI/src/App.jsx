import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login        from "./pages/Login";
import Register     from "./pages/Register";
import Dashboard    from "./pages/Dashboard";
import CreateTest   from "./pages/CreateTest";
import RunTest      from "./pages/RunTest";
import History      from "./pages/History";
import Report       from "./pages/Report";
import Recorder     from "./pages/Recorder";
import ProtectedRoute from "./pages/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        toastStyle={{
          background: "#1c2333",
          color: "#e2e8f0",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          fontSize: 13,
        }}
        progressStyle={{ background: "#6366f1" }}
      />
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/createtest"      element={<ProtectedRoute><CreateTest /></ProtectedRoute>} />
        <Route path="/createtest/:id"  element={<ProtectedRoute><CreateTest /></ProtectedRoute>} />
        <Route path="/run-test"        element={<ProtectedRoute><RunTest /></ProtectedRoute>} />
        <Route path="/history"         element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/reports"         element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/report/:id"      element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="/recorder"        element={<ProtectedRoute><Recorder /></ProtectedRoute>} />
        {/* Legacy AutoCapture redirect */}
        <Route path="/AutoCapture"     element={<ProtectedRoute><Recorder /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
