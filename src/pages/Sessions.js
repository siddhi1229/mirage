import { useEffect, useState } from "react";
import API from "../services/api";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchSessions() {
    try {
      const res = await API.get("/sessions");
      setSessions(res.data || []);
      setError("");
    } catch (e) {
      setError("Could not load sessions (backend offline?).");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSessions();

    // auto-refresh every 5 seconds
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Active Sessions</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && sessions.length === 0 && !error && (
        <p>No active sessions.</p>
      )}

      {!loading && sessions.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 16,
            background: "white"
          }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={th}>User ID</th>
              <th style={th}>Current Tier</th>
              <th style={th}>First Seen</th>
              <th style={th}>Last Active</th>
              <th style={th}>Requests / Min</th>
            </tr>
          </thead>

          <tbody>
            {sessions.map((s, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={td}>{mask(s.userId)}</td>
                <td style={td}>{formatTier(s.tier)}</td>
                <td style={td}>{formatTime(s.first_seen_at)}</td>
                <td style={td}>{formatTime(s.last_active_at)}</td>
                <td style={td}>{s.dynamic_mean_rpm ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = {
  padding: 10,
  textAlign: "left",
  fontWeight: 600
};

const td = {
  padding: 10,
  textAlign: "left"
};

// helper formatting
function formatTime(t) {
  if (!t) return "-";
  return new Date(t).toLocaleString();
}

function formatTier(t) {
  if (t === 1) return "Tier 1 — Clean";
  if (t === 2) return "Tier 2 — Noise";
  if (t === 3) return "Tier 3 — Audit";
  return "-";
}

function mask(id = "") {
  if (id.length <= 4) return "****";
  return id.slice(0, 3) + "***" + id.slice(-2);
}

