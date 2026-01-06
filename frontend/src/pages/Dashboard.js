import { useEffect, useState } from "react";
import API from "../services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";

const COLORS = ["#00E676", "#FF5F1F", "#FF4545"]; // green, orange, red

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    total_sessions: 0,
    tier1_clean: 0,
    tier2_suspicious: 0,
    tier3_malicious: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchData() {
    try {
      const res = await API.get("/api/sessions");
      const data = res.data || [];

      setSessions(data);

      // Calculate stats
      const stat = {
        total_sessions: data.length,
        tier1_clean: data.filter((s) => s.tier === 1).length,
        tier2_suspicious: data.filter((s) => s.tier === 2).length,
        tier3_malicious: data.filter((s) => s.tier === 3).length
      };

      setStats(stat);
      setError("");
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      setError(`Backend Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // Auto-refresh every 2 seconds to see live attack bot data
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const tierData = [
    { name: "Tier 1 (Clean)", value: stats.tier1_clean },
    { name: "Tier 2 (Suspicious)", value: stats.tier2_suspicious },
    { name: "Tier 3 (Malicious)", value: stats.tier3_malicious }
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 MIRAGE Security Dashboard</h1>

      {error && (
        <div
          style={{
            background: "rgba(255, 69, 69, 0.15)",
            border: "1px solid rgba(255, 69, 69, 0.3)",
            color: "#FF4545",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px"
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading && <p style={{ color: "#94A3B8" }}>Loading dashboard...</p>}

      {!loading && (
        <>
          {/* Key Metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              marginBottom: "30px"
            }}
          >
            <MetricCard
              title="Total Sessions"
              value={stats.total_sessions}
              color="#64B5F6"
              icon="👥"
            />
            <MetricCard
              title="Tier 1 (Clean)"
              value={stats.tier1_clean}
              color="#00E676"
              icon="🟢"
            />
            <MetricCard
              title="Tier 2 (Suspicious)"
              value={stats.tier2_suspicious}
              color="#FF5F1F"
              icon="🟡"
            />
            <MetricCard
              title="Tier 3 (Malicious)"
              value={stats.tier3_malicious}
              color="#FF4545"
              icon="🔴"
            />
          </div>

          {/* Pie Chart */}
          <div
            style={{
              background: "rgba(15, 15, 20, 0.75)",
              border: "1px solid rgba(224, 228, 232, 0.15)",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              marginBottom: "30px"
            }}
          >
            <h2 style={{ color: "#FF5F1F", marginBottom: "20px" }}>Tier Distribution</h2>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
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

          {/* Info Box */}
          <div
            style={{
              background: "rgba(255, 95, 31, 0.1)",
              border: "1px solid rgba(255, 95, 31, 0.3)",
              padding: "16px",
              borderRadius: "8px",
              color: "#E0E4E8",
              lineHeight: "1.6"
            }}
          >
            <h3 style={{ color: "#FF5F1F", margin: "0 0 12px 0" }}>⚡ How MIRAGE Works</h3>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li>
                <strong style={{ color: "#00E676" }}>Tier 1 (Green):</strong> Normal users with clean responses
              </li>
              <li>
                <strong style={{ color: "#FF5F1F" }}>Tier 2 (Orange):</strong> Suspicious behavior detected, noisy responses applied
              </li>
              <li>
                <strong style={{ color: "#FF4545" }}>Tier 3 (Red):</strong> Confirmed attack, maximum noise + blockchain audit
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, color, icon }) {
  return (
    <div
      style={{
        background: "rgba(15, 15, 20, 0.75)",
        border: `1px solid rgba(224, 228, 232, 0.15)`,
        borderLeft: `4px solid ${color}`,
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
      }}
    >
      <p style={{ margin: "0 0 10px 0", color: "#94A3B8", fontSize: "12px" }}>
        {icon} {title}
      </p>
      <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color }}>
        {value}
      </p>
    </div>
  );
}
