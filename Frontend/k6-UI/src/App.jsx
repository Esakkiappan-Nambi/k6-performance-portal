import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateTest from "./pages/CreateTest.jsx";
import RunTest from "./pages/RunTest";
import History from "./pages/History";
import ReportList from "./pages/ReportList";
import Report from "./pages/Report";
import ProtectedRoute from "./pages/ProtectedRoute";
import AutoCapture from "./pages/AutoCapture.jsx";

function App() {
  return (
    <BrowserRouter>
    
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />}/>

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/createtest" element={<ProtectedRoute><CreateTest /></ProtectedRoute>} />
        <Route path="/run-test"  element={<ProtectedRoute><RunTest /></ProtectedRoute>}/>
      <Route  path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

      <Route path="/reports" element={<ProtectedRoute> <History /> </ProtectedRoute>} />

      <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>}/>

  {/* <Route path="/reports" element={<ReportList />} /> */}

      <Route path="/createtest/:id?" element={<ProtectedRoute><CreateTest /></ProtectedRoute>} />
      {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
      <Route path="/AutoCapture" element={<ProtectedRoute><AutoCapture/></ProtectedRoute>} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;