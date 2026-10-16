import React, { useEffect, useState } from "react";
import API from "../services/api";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1c2333",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 12,
    }}>
      <p style={{ color: "#8b9ab4", marginBottom: 6 }}>Run #{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong style={{ color: "#e2e8f0" }}>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function ExecutionChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/execution-chart")
      .then((r) => setData(r.data || []))
      .catch(() => {});
  }, []);

  if (!data.length) {
    return (
      <div style={{
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#4a5568",
        fontSize: 13,
      }}>
        No execution data yet — run a test to see trends.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="run_id"
          tick={{ fill: "#4a5568", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#4a5568", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#8b9ab4", paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Line
          type="monotone"
          dataKey="failed"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#ef4444" }}
          name="Failed Runs"
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#22c55e" }}
          name="Passed Runs"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
