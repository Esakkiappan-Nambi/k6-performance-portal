import React, { useEffect, useState } from "react";
import axios from "axios";

import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,} from "recharts";

function ExecutionChart() {

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadChart();
  }, []);

  const loadChart = async () => {
    try {

      const res = await axios.get(
        "http://127.0.0.1:8000/execution-chart"
      );

      setChartData(res.data);

    } catch (error) {
      console.error(
        "Chart Load Error:",
        error
      );
    }
  };

  return (
    <div className="chart-card">

      <h2>
        Test Execution Trend
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <LineChart data={chartData}>

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis dataKey="run_id" />

          <YAxis />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="completed"
            stroke="#22c55e"
            strokeWidth={3}
            name="Completed"
          />

          <Line
            type="monotone"
            dataKey="failed"
            stroke="#ef4444"
            strokeWidth={3}
            name="Failed"
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}

export default ExecutionChart;