import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {FileText,BarChart3,Download,ArrowLeft,} from "lucide-react";
import "./Report.css";
import { toast } from "react-toastify";

function Report() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

const fetchReport = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/report/${id}`
      );
      setReport(response.data);
    } catch (error) {
      console.log("Error fetching report:", error);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/download-report/${id}`,
        {
          responseType: "blob",
        }
      );

      const fileURL = window.URL.createObjectURL(
        new Blob([response.data],{ type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute(
        "download",
        `${report.test_name}_report.pdf`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Download failed");
    }
  };

  if (!report) {
    return (
      <div className="loading">
        Loading Report...
      </div>
    );
  }

  return (
    <div className="report-container">

      {/* Header */}
      <div className="report-header">
        <button
          className="back-btn"
          onClick={() => navigate("/history")}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1>
          <FileText size={28} />
          Performance Test Aggregate Report
        </h1>

        <button
          className="download-btn"
          onClick={downloadReport}
        >
          <Download size={18} />
          Download
        </button>
      </div>

      {/* Summary */}
      <div className="report-card">
        <div className="report-row">
          <div>
            <h2>{report.test_name}</h2>

            <p>
              <strong>Status:</strong>{" "}
              {report.status}
            </p>

            <p>
              <strong>Started At:</strong>{" "}
              {new Date(
                report.started_at
              ).toLocaleString()}
            </p>
          </div>

          <span
            className={`status ${
              report.status?.toLowerCase() || "completed"
            }`}
          >
            {report.status}
          </span>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="report-card">
        <h3>
          <BarChart3 size={20} />
          Aggregate Metrics
        </h3>

        <table className="aggregate-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Total Requests</td>
              <td>{report.total_requests || 0}</td>
            </tr>

            <tr>
              <td>Failed Requests</td>
              <td>{report.failed_requests || 0}</td>
            </tr>

            <tr>
              <td>Passed Checks</td>
              <td>{report.passed_checks || 0}</td>
            </tr>

            <tr>
              <td>Throughput</td>
              <td>{report.throughput} req/s</td>
            </tr>

            <tr>
              <td>Average Response Time</td>
              <td>{report.avg_response_time} ms</td>
            </tr>

            <tr>
              <td>Minimum Response Time</td>
              <td>{report.min_response_time} ms</td>
            </tr>

            <tr>
              <td>Maximum Response Time</td>
              <td>{report.max_response_time} ms</td>
            </tr>

            <tr>
              <td>P90</td>
              <td>{report.p90} ms</td>
            </tr>

            <tr>
              <td>P95</td>
              <td>{report.p95} ms</td>
            </tr>

            <tr>
              <td>Error Rate</td>
              <td>{report.error_rate}%</td>
            </tr>
        </tbody>
        </table>
    </div>

      {/* Raw Output */}
    <div className="output-card">
        <h3>Execution Output</h3>
        <pre>{report.output}</pre>
    </div>
    </div>
);
}

export default Report;