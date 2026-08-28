import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { Trash2, History as HistoryIcon, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./History.css";

function History() {
    
    const [runs, setRuns] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {fetchRuns();}, []);

    const fetchRuns = async () => {
        try { 
            const response = await API.get("/test-runs");
            setRuns(response.data);
        } catch (error) {  
            console.log("Error Fetching History:", error);
        }
    };

    

    const filteredRuns = runs.filter((run) =>
        run.test_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const viewReport = (id) => {navigate(`/report/${id}`);};

    const openGrafana = (runId) => {
        const url = `http://localhost:3000/d/k6-dashboard?var-run_id=${runId}`;
        window.open(url, "_blank");
    };

    const deleteRun = async (runId) => {
<<<<<<< HEAD
        const confirmDelete = window.confirm("Are you sure you want to delete this run?");
=======
        const confirmDelete = win.confirm("Are you sure you want to delete this run?");
>>>>>>> 12661e306beed1a3faafbec5438b9bfcf1c0d603
        if (!confirmDelete) return;

        try {
            await API.delete(`/delete-run/${runId}`);
            setRuns((prevRuns) => prevRuns.filter((run) => run.id !== runId));
            toast.success("Run deleted successfully");
        } catch (error) {
            console.log("Delete error:", error);
            toast.error("Failed to delete run");
        }
    };

    return (
        <div className="history-container">
            <div className="history-header-container">
                <button className="back-btn" onClick={() => navigate("/dashboard")}> 
                    Back 
                </button>

                <div className="history-main">
                    <h1 className="history-title">
                        <HistoryIcon size={30} /> Execution History
                    </h1>

                    {/* Search Box - Centered Below Title */}
                    <div className="search-container">
                        <div className="search-box">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by test name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="history-table-card">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Run ID</th>
                            <th>Test Name</th>
                            <th>Status</th>
                            <th>Started At</th>
                            <th>Action</th>
                            <th>Delete</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredRuns.length > 0 ? (
                            filteredRuns.map((run) => (
                                <tr key={run.id}>
                                    <td>{run.id}</td>
                                    <td>{run.test_name}</td>
                                    <td>
                                        <span className={
                                            run.status === "Completed" ? "completed" :
                                            run.status === "Failed" ? "failed" : "running"
                                        }>
                                            {run.status}
                                        </span>
                                    </td>
                                    <td>{run.started_at}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button className="view-btn" onClick={() => viewReport(run.id)}>
                                                View Report
                                            </button>
                                            <button className="view-btn" onClick={() => openGrafana(run.id)}>
                                                Grafana
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="delete-btn" onClick={() => deleteRun(run.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    {searchTerm ? "No matching runs found" : "No Test Runs Found"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default History;