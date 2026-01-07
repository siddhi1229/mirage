import { useState, useEffect } from "react";
import API from "../services/api";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get("/api/logs");
        setLogs(res.data || []);
        setError("");
      } catch (e) {
        setError("Failed to load logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="logs-container loading-state">Loading...</div>;
  if (error) return <div className="logs-container error-state">{error}</div>;

  return (
    <div className="logs-container">
      <h1>Query Logs</h1>
      <p className="log-count">Total: {logs.length} queries</p>
      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User ID</th>
              <th>Query</th>
              <th>Tier</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data-message">
                  No query logs available
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx}>
                  <td className="timestamp-cell">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td>{log.userId}</td>
                  <td className="query-preview">{log.prompt}</td>
                  <td>
                    <span className={`tier-badge tier${log.tier}`}>
                      Tier {log.tier}
                    </span>
                  </td>
                  <td>
                    <span className={`response-badge ${log.noisy_answer_served ? 'noisy' : 'clean'}`}>
                      {log.noisy_answer_served ? 'Noisy' : 'Clean'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
