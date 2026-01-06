import { useState, useEffect } from "react";
import API from "../services/api";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await API.get("/api/sessions");
        setSessions(res.data || []);
        setError("");
      } catch (e) {
        setError("Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="sessions-container loading-state">Loading...</div>;
  if (error) return <div className="sessions-container error-state">{error}</div>;

  return (
    <div className="sessions-container">
      <h1>Active Sessions</h1>
      <div className="sessions-table-wrapper">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Tier</th>
              <th>First Seen</th>
              <th>Last Active</th>
              <th>Duration (min)</th>
              <th>Requests</th>
              <th>Avg RPM</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data-message">
                  No active sessions
                </td>
              </tr>
            ) : (
              sessions.map((session, idx) => (
                <tr key={idx}>
                  <td>{session.userId}</td>
                  <td>
                    <span className={`tier-badge tier${session.tier}`}>
                      Tier {session.tier}
                    </span>
                  </td>
                  <td className="timestamp-cell">
                    {new Date(session.first_seen_at).toLocaleString()}
                  </td>
                  <td className="timestamp-cell">
                    {new Date(session.last_active_at).toLocaleString()}
                  </td>
                  <td>{session.time_active}</td>
                  <td>{session.request_count}</td>
                  <td>{session.dynamic_mean_rpm}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
