import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ExecutionChart from "./ExecutionChart";

import {LayoutDashboard,PlusSquare,PlayCircle,BarChart3,History,LogOut,Activity,CheckCircle,Clock,FileText,} from "lucide-react";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const fullName =
    localStorage.getItem("full_name") || "User";

  const [stats, setStats] = useState({
    total_tests: 0,
    total_runs: 0,
    success_rate: 0,
    running_runs: 0,
  });

  const [recentTests, setRecentTests] =
    useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const statsResponse = await axios.get(
        "http://127.0.0.1:8000/dashboard-stats",
      {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
      );

      setStats(statsResponse.data);

      const testsResponse = await axios.get(
              "http://127.0.0.1:8000/recent-tests",
              {
        headers: {
          Authorization: `Bearer ${token}`,
        },}
      );

      setRecentTests(testsResponse.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("full_name");
    toast.success("Logout");
    navigate("/");
  };

  return (
    <div className="dashboard">

      {/* Sidebar */}

      <aside className="sidebar">

        <h2>
          <LayoutDashboard size={22} />
          K6 Portal
        </h2>

        <ul>

          <li>
            <LayoutDashboard size={18} />
            Dashboard
          </li>

          <li
            onClick={() =>
              navigate("/createtest")
            }
          >
            <PlusSquare size={18} />
            Create Test
          </li>

          <li
            onClick={() =>
              navigate("/run-test")
            }
          >
            <PlayCircle size={18} />
            Run Test
          </li>

          <li
            onClick={() =>
              navigate("/reports")
            }
          >
            <BarChart3 size={18} />
            Reports
          </li>

          <li
            onClick={() =>
              navigate("/history")
            }
          >
            <History size={18} />
            History
          </li>

          <li
            className="logout-menu"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </li>

        </ul>

      </aside>

      {/* Main */}

      <main className="main-content">

        {/* Header */}

        <div className="topbar">

          <div>
            <h1>
              Welcome, {fullName} 👋
            </h1>

            <p>
              Manage and Monitor K6
              Performance Tests
            </p>
          </div>

        </div>

        {/* Stats */}

        <div className="stats">

          <div className="stat-card">

            <div className="stat-icon">
              <FileText size={22} />
            </div>

            <div>
              <h2>
                {stats.total_tests}
              </h2>

              <p>Total Tests</p>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              <Activity size={22} />
            </div>

            <div>
              <h2>
                {stats.total_runs}
              </h2>

              <p>Total Executions</p>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              <CheckCircle size={22} />
            </div>

            <div>
              <h2>
                {stats.success_rate}%
              </h2>

              <p>Success Rate</p>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              <Clock size={22} />
            </div>

            <div>
              <h2>
                {stats.running_runs}
              </h2>

              <p>Running Tests</p>
            </div>

          </div>

        </div>

        {/* Recent Tests */}

        <div className="table-section">

          <div className="section-header">

            <h2>
              Recent Tests
            </h2>

          </div>

          <table>

            <thead>

              <tr>

                <th>ID</th>

                <th>Test Name</th>

                <th>Status</th>

                <th>Created At</th>

                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {recentTests.length > 0 ? (

                recentTests.map(
                  (test) => (
                    <tr key={test.id}>

                      <td>
                        {test.id}
                      </td>

                      <td>
                        {test.test_name}
                      </td>

                      <td>

                        <span
                          className={`status-badge ${test.status}`}
                        >
                          {test.status}
                        </span>

                      </td>

                      <td>

                        {new Date(
                          test.created_at
                        ).toLocaleDateString()}

                      </td>

                      <td>

                        <button
                          className="run-btn"
                          onClick={() =>
                            navigate(
                              "/run-test"
                            )
                          }
                        >
                          Run
                        </button>

                      </td>

                    </tr>
                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="empty"
                  >
                    No Tests Available
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>
  
      </main>

    </div>
  );
}

export default Dashboard;