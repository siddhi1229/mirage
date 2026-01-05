import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Sessions({ backendUrl }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/sessions`);
        setSessions(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  return (
    <div>
      <h1>Active Sessions</h1>

      <div className="panel">
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No active sessions</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Tier</th>
                <th>First Seen</th>
                <th>Last Active</th>
                <th>Time Active (min)</th>
                <th>Requests/Min</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, idx) => (
                <tr key={idx}>
                  <td>{session.userId}</td>
                  <td>
                    <span className={`badge tier-${session.tier}`}>
                      {session.tier === 1 ? 'Clean' : session.tier === 2 ? 'Suspicious' : 'Malicious'}
                    </span>
                  </td>
                  <td>{session.first_seen_at ? new Date(session.first_seen_at).toLocaleString() : '-'}</td>
                  <td>{session.last_active_at ? new Date(session.last_active_at).toLocaleTimeString() : '-'}</td>
                  <td>{session.time_active || 0}</td>
                  <td>{(session.dynamic_mean_rpm || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
