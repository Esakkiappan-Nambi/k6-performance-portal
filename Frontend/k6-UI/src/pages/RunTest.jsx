import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PlayCircle, Loader2, Trash2, Pencil, Search, Square } from "lucide-react";
import API from "../services/api";
import { toast } from "react-toastify";
import "./RunTest.css";

function RunTest() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningTestId, setRunningTestId] = useState(null);
  const [stoppingTestId, setStoppingTestId] = useState(null);
  const [deletingTestId, setDeletingTestId] = useState(null);
  const [output, setOutput] = useState("");
  const [grafanaUrl, setGrafanaUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const pollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTests();

    const interval = setInterval(async () => {
      try {
        const res = await API.get("/tests");
        const updatedTests = res.data || [];

        setTests(updatedTests);

        const runningTest = updatedTests.find((t) => t.status === "running");

        if (runningTest && !runningTestId) {
          setRunningTestId(runningTest.id);
          const runRes = await API.get(`/latest-run/${runningTest.id}`);
          if (runRes.data?.run_id) {
            pollForResult(runningTest.id, runRes.data.run_id);
          }
        }
      } catch (err) {
        console.error("Auto refresh error:", err);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearInterval(interval);
    };
  }, [runningTestId]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const res = await API.get("/tests");
      setTests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter((test) =>
    test.test_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pollForResult = (testId, runId) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const { data: report } = await API.get(`/report/${runId}`);

        if (report.status !== "running") {
          clearInterval(pollRef.current);
          pollRef.current = null;

          setTests((prev) =>
            prev.map((t) =>
              t.id === testId ? { ...t, status: report.status } : t
            )
          );

          setRunningTestId(null);
          setOutput(report.output || "");

          if (report.status === "completed") {
            toast.success("Test Executed Successfully");
            setGrafanaUrl(
              `http://localhost:3000/d/adfqsh7/k6-load-testing-results?var-run_id=${runId}`
            );
          } else if (report.status === "stopped") {
            toast.info("Test Stopped");
          } else {
            toast.error("Test Execution Failed");
          }

          await loadTests();
        }
      } catch (pollErr) {
        console.error("Polling error:", pollErr);
        clearInterval(pollRef.current);
        pollRef.current = null;
        setRunningTestId(null);
        toast.error("Error fetching test result");
      }
    }, 5000);
  };

  const runTest = async (testId) => {
    try {
      setRunningTestId(testId);
      setOutput("");
      setGrafanaUrl("");

      setTests((prev) =>
        prev.map((t) =>
          t.id === testId ? { ...t, status: "running" } : t
        )
      );

      const res = await API.post(`/run-test/${testId}`);
      const runId = res.data.run_id;

      toast.info("Test started — waiting for results…");
      pollForResult(testId, runId);
    } catch (err) {
      console.error(err);
      setRunningTestId(null);
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId ? { ...t, status: "failed" } : t
        )
      );
      toast.error(err.response?.data?.detail || "Test Execution Failed");
    }
  };

  const stopTest = async (testId) => {
    const confirmStop = window.confirm("Are you sure you want to stop this test?");
    if (!confirmStop) return;


    try {
      setStoppingTestId(testId);
      await API.post(`/stop-test/${testId}`);

      setTests((prev) =>
        prev.map((t) =>
          t.id === testId ? { ...t, status: "stopping" } : t
        )
      );

      toast.info("Stopping test...");
    } catch (err) {
      console.error(err);
      toast.error("Failed to stop test");
    } finally {
      setStoppingTestId(null);
    }
  };

  const deleteTest = async (testId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this test?");
    if (!confirmDelete) return;

    try {
      setDeletingTestId(testId);
      await API.delete(`/delete-test/${testId}`);
      setTests((prev) => prev.filter((t) => t.id !== testId));
      toast.success("Test Deleted Successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete test");
    } finally {
      setDeletingTestId(null);
    }
  };

  const editTest = (testId) => {
    navigate(`/createtest/${testId}`);
  };

  return (
    <div className="run-container">
      <div className="run-header-container">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="run-header">
          <h2>
            <PlayCircle size={28} style={{ marginRight: "10px" }} />
            Run Performance Tests
          </h2>

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

      <div className="table-card">
        {loading ? (
          <div className="loading-box">
            <Loader2 size={35} className="spinner" />
            <h3>Loading Tests...</h3>
          </div>
        ) : (
          <table className="test-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Test Name</th>
                <th>Users</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>

            <tbody>
              {filteredTests.length > 0 ? (
                filteredTests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.id}</td>
                    <td>{test.test_name}</td>
                    <td>{test.users}</td>
                    <td>{test.duration}s</td>
                    <td>
                      <span className={`status ${test.status}`}>
                        {test.status === "running" || test.status === "stopping" ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Loader2 size={13} className="spinner" />
                            {test.status}
                          </span>
                        ) : (
                          test.status
                        )}
                      </span>
                    </td>
                    <td>{new Date(test.created_at).toLocaleString()}</td>

                    <td>
                      {test.status === "running" ? (
                        <button
                          className="stop-btn"
                          disabled={stoppingTestId === test.id}
                          onClick={() => stopTest(test.id)}
                        >
                          {stoppingTestId === test.id ? (
                            <>
                              <Loader2 size={16} className="spinner" />
                              Stopping...
                            </>
                          ) : (
                            <>
                              <Square size={16} /> Stop
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          className="run-btn"
                          disabled={runningTestId === test.id}
                          onClick={() => runTest(test.id)}
                        >
                          {runningTestId === test.id ? (
                            <>
                              <Loader2 size={16} className="spinner" />
                              Running...
                            </>
                          ) : (
                            "Run"
                          )}
                        </button>
                      )}
                    </td>

                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => editTest(test.id)}
                        disabled={runningTestId === test.id}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>

                    <td>
                      <button
                        className="delete-btn"
                        disabled={deletingTestId === test.id || runningTestId === test.id}
                        onClick={() => deleteTest(test.id)}
                      >
                        { deletingTestId === test.id ? (
                          <>
                            <Loader2 size={16} className="spinner" />
                            Deleting...
                          </>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                    {searchTerm ? "No matching tests found" : "No Tests Found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {output && (
        <div className="output-card">
          <h3>Execution Output</h3>
          <pre>{output}</pre>
        </div>
      )}

      {grafanaUrl && (
        <div className="grafana-card">
          <h3>Grafana Dashboard</h3>
          <button
            className="run-btn"
            onClick={() => window.open(grafanaUrl, "_blank")}
          >
            Open Grafana Dashboard
          </button>
          <iframe
            src={grafanaUrl}
            width="100%"
            height="600px"
            style={{ marginTop: "10px", border: "none" }}
            title="Grafana Dashboard"
          />
        </div>
      )}
    </div>
  );
}

export default RunTest;