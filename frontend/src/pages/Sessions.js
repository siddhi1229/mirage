import { useEffect, useState } from "react";
import API from "../services/api";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchSessions() {
    try {
      const res = await API.get("/api/sessions");
      setSessions(res.data || []);
      setError("");
    } catch (e) {
      console.error("Sessions fetch error:", e);
      setError(`Could not load sessions: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
    // Auto-refresh every 2 seconds to see attack bot in real-time
    const interval = setInterval(fetchSessions, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>👥 Active Sessions</h1>

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

      {loading && <p style={{ color: "#94A3B8" }}>Loading sessions...</p>}

      {!loading && sessions.length === 0 && !error && (
        <p style={{ color: "#94A3B8" }}>No active sessions yet. Run attack bot to see sessions appear here.</p>
      )}

      {!loading && sessions.length > 0 && (
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
                <th style={{ ...th, color: "#FF5F1F" }}>User ID</th>
                <th style={{ ...th, color: "#FF5F1F" }}>Tier</th>
                <th style={{ ...th, color: "#FF5F1F" }}>Status</th>
                <th style={{ ...th, color: "#FF5F1F" }}>First Seen</th>
                <th style={{ ...th, color: "#FF5F1F" }}>Last Active</th>
                <th style={{ ...th, color: "#FF5F1F" }}>Requests/Min</th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((s, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid rgba(224, 228, 232, 0.1)",
                    background: s.tier === 3 ? "rgba(255, 69, 69, 0.08)" : s.tier === 2 ? "rgba(255, 95, 31, 0.08)" : "transparent"
                  }}
                >
                  <td style={td}>
                    <code style={{ background: "rgba(0, 0, 0, 0.3)", padding: "4px 8px", borderRadius: "4px" }}>
                      {maskId(s.userId)}
                    </code>
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background:
                          s.tier === 1 ? "rgba(0, 230, 118, 0.15)" : 
                          s.tier === 2 ? "rgba(255, 95, 31, 0.15)" : 
                          "rgba(255, 69, 69, 0.15)",
                        color:
                          s.tier === 1 ? "#00E676" :
                          s.tier === 2 ? "#FF5F1F" :
                          "#FF4545",
                        fontWeight: "500",
                        fontSize: "12px",
                        border:
                          s.tier === 1 ? "1px solid rgba(0, 230, 118, 0.3)" :
                          s.tier === 2 ? "1px solid rgba(255, 95, 31, 0.3)" :
                          "1px solid rgba(255, 69, 69, 0.3)"
                      }}
                    >
                      Tier {s.tier}
                    </span>
                  </td>
                  <td style={td}>
                    {s.tier === 1 ? "🟢 Clean" : s.tier === 2 ? "🟡 Suspicious" : "🔴 Malicious"}
                  </td>
                  <td style={td}>
                    {s.first_seen_at
                      ? new Date(s.first_seen_at).toLocaleString()
                      : "—"}
                  </td>
                  <td style={td}>
                    {new Date(s.last_active_at).toLocaleString()}
                  </td>
                  <td style={td}>{(s.dynamic_mean_rpm || 0).toFixed(2)}</td>
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
