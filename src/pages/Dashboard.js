import { useEffect, useState } from "react";
import API from "../services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#22c55e", "#facc15", "#ef4444"]; // green, yellow, red

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");

  async function fetchData() {
    try {
      const res = await API.get("/sessions");
      setSessions(res.data || []);
      setError("");
    } catch (e) {
      setError("Backend not reachable");
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tier counts
  const tierData = [
    { name: "Tier 1", value: sessions.filter(s => s.tier === 1).length },
    { name: "Tier 2", value: sessions.filter(s => s.tier === 2).length },
    { name: "Tier 3", value: sessions.filter(s => s.tier === 3).length }
  ];

  return (
    <div>
      <h2>System Overview</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Top Stats */}
      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <StatCard title="Active Sessions" value={sessions.length} />
        <StatCard title="Tier 2 Users" value={tierData[1].value} />
        <StatCard title="Tier 3 Users" value={tierData[2].value} />
      </div>

      {/* Charts */}
      <div
        style={{
          marginTop: 30,
          background: "white",
          padding: 20,
          borderRadius: 12
        }}
      >
        <h3>Tier Distribution</h3>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={tierData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                label
              >
                {tierData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* Small stat card component */
function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "white",
        padding: 20,
        borderRadius: 12,
        minWidth: 180,
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
      }}
    >
      <h4 style={{ margin: 0, color: "#6b7280" }}>{title}</h4>
      <p style={{ fontSize: 28, margin: "10px 0 0" }}>{value}</p>
    </div>
  );
}

