import { useEffect, useState } from "react";
import API from "../services/api";

export default function Audit() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAudit() {
    try {
      const res = await API.get("/blockchain/status");
      setRecords(res.data || []);
      setError("");
    } catch (e) {
      setError("Could not load blockchain records (backend offline?).");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div>
      <h2>Blockchain Audit Log</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && records.length === 0 && !error && (
        <p>No blockchain audit entries yet.</p>
      )}

      {!loading && records.length > 0 && (
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
              <th style={th}>User</th>
              <th style={th}>Tier</th>
              <th style={th}>Transaction Hash</th>
              <th style={th}>Status</th>
              <th style={th}>Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {records.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={td}>{mask(r.userId)}</td>
                <td style={td}>{r.tier || 3}</td>
                <td style={td} style={{ wordBreak: "break-all" }}>
                  {r.txHash || "—"}
                </td>
                <td style={td}>
                  {r.status === "confirmed" ? "Confirmed" : "Pending"}
                </td>
                <td style={td}>
                  {r.timestamp
                    ? new Date(r.timestamp).toLocaleString()
                    : "—"}
                </td>
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
  if (!id) return "—";
  if (id.length <= 4) return "****";
  return id.slice(0, 3) + "***" + id.slice(-2);
}
