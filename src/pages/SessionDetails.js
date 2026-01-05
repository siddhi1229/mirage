import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";

export default function SessionDetails() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const resSession = await API.get(`/sessions/${id}`);
      const resLogs = await API.get(`/logs?userId=${id}`);

      setSession(resSession.data);
      setLogs(resLogs.data || []);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!session) return <p>No data found.</p>;

  return (
    <div>
      <h2>Session Details</h2>
      <p><strong>User:</strong> {id}</p>
      <p><strong>Tier:</strong> {session.tier}</p>
      <p><strong>First Seen:</strong> {new Date(session.first_seen_at).toLocaleString()}</p>
      <p><strong>Last Active:</strong> {new Date(session.last_active_at).toLocaleString()}</p>

      <h3 style={{ marginTop: 20 }}>Recent Queries</h3>

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
            <th style={th}>Prompt</th>
            <th style={th}>Tier</th>
            <th style={th}>Noisy?</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((l, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={td}>{new Date(l.timestamp).toLocaleString()}</td>
              <td style={td}>{l.prompt}</td>
              <td style={td}>{l.tier}</td>
              <td style={td}>{l.noisy_answer_served ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: 10, textAlign: "left", fontWeight: 600 };
const td = { padding: 10, textAlign: "left" };
