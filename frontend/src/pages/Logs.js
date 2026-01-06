import { useEffect, useState } from "react";
import API from "../services/api";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterTier, setFilterTier] = useState("");

  async function fetchLogs() {
    try {
      const res = await API.get("/api/logs");
      setLogs(res.data || []);
      setError("");
    } catch (e) {
      console.error("Logs fetch error:", e);
      setError(`Could not load logs: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // Auto-refresh every 2 seconds to see new queries
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const filtered = logs.filter((l) => {
    return (
      (!filterUser || l.userId?.includes(filterUser)) &&
      (!filterTier || String(l.tier) === filterTier)
    );
  });

  const getTierColor = (tier) => {
    if (tier === 1) return "#00E676";
    if (tier === 2) return "#FF5F1F";
    if (tier === 3) return "#FF4545";
    return "#94A3B8";
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📋 Query Logs</h1>

      {error && (
        <div
          style={{
            background: "rgba(255, 69, 69, 0.15)",
            border: "1px solid rgba(255, 69, 69, 0.3)",
            color: "#FF4545",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "13px"
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading && <p style={{ color: "#94A3B8" }}>Loading logs...</p>}

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <input
          placeholder="Filter by User ID"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid rgba(224, 228, 232, 0.15)",
            background: "rgba(0, 0, 0, 0.3)",
            color: "#E0E4E8",
            flex: 1
          }}
        />

        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid rgba(224, 228, 232, 0.15)",
            background: "rgba(0, 0, 0, 0.3)",
            color: "#E0E4E8"
          }}
        >
          <option value="">All Tiers</option>
          <option value="1">Tier 1 (Clean)</option>
          <option value="2">Tier 2 (Suspicious)</option>
          <option value="3">Tier 3 (Malicious)</option>
        </select>
      </div>

      {!loading && filtered.length === 0 && !error && (
        <p style={{ color: "#94A3B8" }}>No logs found. Waiting for queries...</p>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "rgba(15, 15, 20, 0.75)",
              border: "1px solid rgba(224, 228, 232, 0.15)",
              borderRadius: "8px",
              overflow: "hidden"
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(255, 95, 31, 0.1)",
                  borderBottom: "2px solid rgba(255, 95, 31, 0.3)"
                }}
              >
                <th style={{ ...th, color: "#FF5F1F" }}>Time</th>
                <th style={{ ...th, color: "#FF5F1F" }}>User</th>
                <th style={{ ...th, color: "#FF5F1F" }}>Query</th>
                <th style={{ ...th, color: "#FF5F1F" }}>Tier</th>
                <th style={{ ...th, color: "#FF5F1F" }}>Type</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((l, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid rgba(224, 228, 232, 0.1)",
                    background: l.tier === 3 ? "rgba(255, 69, 69, 0.08)" : l.tier === 2 ? "rgba(255, 95, 31, 0.08)" : "transparent"
                  }}
                >
                  <td style={td}>
                    {new Date(l.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={td}>
                    <code style={{ background: "rgba(0, 0, 0, 0.3)", padding: "4px 8px", borderRadius: "4px" }}>
                      {maskId(l.userId)}
                    </code>
                  </td>
                  <td style={{ ...td, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {l.prompt}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background:
                          l.tier === 1 ? "rgba(0, 230, 118, 0.15)" : 
                          l.tier === 2 ? "rgba(255, 95, 31, 0.15)" : 
                          "rgba(255, 69, 69, 0.15)",
                        color: getTierColor(l.tier),
                        fontWeight: "500",
                        fontSize: "12px",
                        border:
                          l.tier === 1 ? "1px solid rgba(0, 230, 118, 0.3)" :
                          l.tier === 2 ? "1px solid rgba(255, 95, 31, 0.3)" :
                          "1px solid rgba(255, 69, 69, 0.3)"
                      }}
                    >
                      {l.tier}
                    </span>
                  </td>
                  <td style={td}>
                    {l.noisy_answer_served ? (
                      <span style={{ color: "#FF5F1F", fontWeight: "500" }}>🔊 Noisy</span>
                    ) : (
                      <span style={{ color: "#00E676", fontWeight: "500" }}>✓ Clean</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = {
  padding: "12px",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "12px"
};

const td = {
  padding: "12px",
  textAlign: "left",
  fontSize: "14px",
  color: "#E0E4E8"
};

function maskId(id = "") {
  if (!id) return "—";
  if (id.length <= 4) return "****";
  return id.slice(0, 3) + "***" + id.slice(-2);
}
