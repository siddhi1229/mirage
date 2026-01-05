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
      const res = await API.get("/logs");
      setLogs(res.data || []);
      setError("");
    } catch (e) {
      setError("Could not load logs (backend offline?).");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => {
    return (
      (!filterUser || l.userId?.includes(filterUser)) &&
      (!filterTier || String(l.tier) === filterTier)
    );
  });

  return (
    <div>
      <h2>Query Logs</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, margin: "10px 0" }}>
        <input
          placeholder="Filter by User ID"
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
          style={{ padding: 8 }}
        />

        <select
          value={filterTier}
          onChange={e => setFilterTier(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="">All Tiers</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>
      </div>

      {!loading && filtered.length === 0 && !error && (
        <p>No logs found.</p>
      )}

      {!loading && filtered.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 10,
            background: "white"
          }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={th}>Time</th>
              <th style={th}>User</th>
              <th style={th}>Prompt</th>
              <th style={th}>Tier</th>
              <th style={th}>Noisy?</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((l, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={td}>{new Date(l.timestamp).toLocaleString()}</td>
                <td style={td}>{mask(l.userId)}</td>
                <td style={td}>{l.prompt}</td>
                <td style={td}>{l.tier}</td>
                <td style={td}>{l.noisy_answer_served ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = { padding: 10, textAlign: "left", fontWeight: 600 };
const td = { padding: 10, textAlign: "left" };

function mask(id = "") {
  if (id.length <= 4) return "****";
  return id.slice(0, 3) + "***" + id.slice(-2);
}
