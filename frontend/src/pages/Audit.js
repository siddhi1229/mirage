import { useEffect, useState } from "react";
import API from "../services/api";

export default function Audit() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAudit() {
    try {
      // ✅ CORRECT: /api/blockchain/status endpoint
      const res = await API.get("/api/blockchain/status");
      setRecords(res.data || []);
      setError("");
    } catch (e) {
      console.error("Audit fetch error:", e);
      setError(`Could not load blockchain records: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 10000); // Refresh every 10 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>⛓️ Blockchain Audit Trail</h2>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px"
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading && <p>Loading blockchain records...</p>}

      {!loading && records.length === 0 && !error && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            padding: "16px",
            borderRadius: "8px"
          }}
        >
          ✅ No Tier 3 events recorded yet. Run attack bot to trigger audits.
        </div>
      )}

      {!loading && records.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f3f4f6",
                  borderBottom: "2px solid #e5e7eb"
                }}
              >
                <th style={{ ...th, color: "#374151" }}>Timestamp</th>
                <th style={{ ...th, color: "#374151" }}>User</th>
                <th style={{ ...th, color: "#374151" }}>Tier</th>
                <th style={{ ...th, color: "#374151" }}>Transaction Hash</th>
                <th style={{ ...th, color: "#374151" }}>Status</th>
              </tr>
            </thead>

            <tbody>
              {records.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={td}>
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  <td style={td}>
                    <code style={{ background: "#f3f4f6", padding: "4px 8px" }}>
                      {maskId(r.userId)}
                    </code>
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background: "#ef4444",
                        color: "white",
                        fontWeight: "500",
                        fontSize: "12px"
                      }}
                    >
                      Tier {r.tier}
                    </span>
                  </td>
                  <td style={{
                    ...td,
                    fontFamily: "monospace",
                    fontSize: "11px",
                    wordBreak: "break-all",
                    maxWidth: "300px"
                  }}>
                    {r.txHash || "—"}
                  </td>
                  <td style={td}>
                    <span style={{ color: "#22c55e", fontWeight: "500" }}>
                      ✓ {r.status}
                    </span>
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
  fontSize: "14px"
};

function maskId(id = "") {
  if (!id) return "—";
  if (id.length <= 4) return "****";
  return id.slice(0, 3) + "***" + id.slice(-2);
}
