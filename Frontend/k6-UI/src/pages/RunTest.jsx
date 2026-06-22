import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PlayCircle, Loader2, Trash2, Pencil } from "lucide-react";
import API from "../services/api";
import { toast } from "react-toastify";
import "./RunTest.css";

function RunTest() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningTestId, setRunningTestId] = useState(null);
  const [deletingTestId, setDeletingTestId] = useState(null);
  const [output, setOutput] = useState("");
  const [grafanaUrl, setGrafanaUrl] = useState("");

  // ✅ store active polling interval so we can clear it on unmount
  const pollRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadTests();

    // ✅ clean up polling if user navigates away
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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

  // ✅ Poll /report/{runId} every 5s until status leaves "running"
  const pollForResult = (testId, runId) => {
    // clear any existing poll first
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const { data: report } = await API.get(`/report/${runId}`);

        if (report.status !== "running") {
          // test finished — stop polling
          clearInterval(pollRef.current);
          pollRef.current = null;

          // update the row status in the table
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
          } else {
            toast.error("Test Execution Failed");
            setGrafanaUrl("");
          }

          // refresh full list so Created At / status is in sync
          await loadTests();
        }
        // if still "running" — do nothing, next tick will check again
      } catch (pollErr) {
        console.error("Polling error:", pollErr);
        clearInterval(pollRef.current);
        pollRef.current = null;
        setRunningTestId(null);

        setTests((prev) =>
          prev.map((t) =>
            t.id === testId ? { ...t, status: "failed" } : t
          )
        );

        toast.error("Error fetching test result");
      }
    }, 5000); // poll every 5 seconds
  };

  const runTest = async (testId) => {
    try {
      setRunningTestId(testId);
      setOutput("");
      setGrafanaUrl("");

      // optimistically show "running" in the table
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId ? { ...t, status: "running" } : t
        )
      );

      // ✅ POST returns immediately now — just gives us run_id
      const res = await API.post(`/run-test/${testId}`);
      const runId = res.data.run_id;

      toast.info("Test started — waiting for results…");

      // ✅ Start polling until k6 finishes
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

  const deleteTest = async (testId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this test?"
    );
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
                <th>Run</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>

            <tbody>
              {tests.length > 0 ? (
                tests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.id}</td>
                    <td>{test.test_name}</td>
                    <td>{test.users}</td>
                    <td>{test.duration}s</td>

                    <td>
                      <span className={`status ${test.status}`}>
                        {/* ✅ show spinner next to "running" label */}
                        {test.status === "running" && runningTestId === test.id ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Loader2 size={13} className="spinner" />
                            running
                          </span>
                        ) : (
                          test.status
                        )}
                      </span>
                    </td>

                    <td>{new Date(test.created_at).toLocaleString()}</td>

                    {/* Run */}
                    <td>
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
                    </td>

                    {/* Edit */}
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => editTest(test.id)}
                        disabled={runningTestId === test.id}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>

                    {/* Delete */}
                    <td>
                      <button
                        className="delete-btn"
                        disabled={deletingTestId === test.id || runningTestId === test.id}
                        onClick={() => deleteTest(test.id)}
                      >
                        {deletingTestId === test.id ? (
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
                    No Tests Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Output */}
      {output && (
        <div className="output-card">
          <h3>Execution Output</h3>
          <pre>{output}</pre>
        </div>
      )}

      {/* Grafana */}
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