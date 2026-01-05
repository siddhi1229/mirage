
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard({ backendUrl }) {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ total: 0, tier1: 0, tier2: 0, tier3: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/sessions`);
        const data = Array.isArray(response.data) ? response.data : [];
        setSessions(data);

        const tier1 = data.filter(s => s.tier === 1).length;
        const tier2 = data.filter(s => s.tier === 2).length;
        const tier3 = data.filter(s => s.tier === 3).length;

        setStats({ total: data.length, tier1, tier2, tier3 });
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
      <h1>    </h1>

      {/* STATS */}
      <div className="grid">
        <div className="stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🟢 Clean (Tier 1)</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{stats.tier1}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🟠 Suspicious (Tier 2)</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.tier2}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔴 Malicious (Tier 3)</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.tier3}</div>
        </div>
      </div>

      {/* SESSIONS TABLE */}
      <div className="panel">
        <h2>Active Sessions ({sessions.length})</h2>
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No active sessions</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Tier</th>
                <th>Time Active</th>
                <th>Requests</th>
                <th>Last Activity</th>
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
                  <td>{session.time_active || 0} min</td>
                  <td>{session.request_count || 0}</td>
                  <td>{session.last_active_at ? new Date(session.last_active_at).toLocaleTimeString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}