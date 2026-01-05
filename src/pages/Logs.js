import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Logs({ backendUrl }) {
  const [logs, setLogs] = useState([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterTier, setFilterTier] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/logs`);
        setLogs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };

    fetchData();
  }, [backendUrl]);

  const filtered = logs.filter(log => {
    if (filterUser && !log.userId.includes(filterUser)) return false;
    if (filterTier && log.tier !== parseInt(filterTier)) return false;
    return true;
  });

  return (
    <div>
      <h1>Query Logs</h1>

      <div className="panel">
        <h2>Filters</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>Filter by User ID</label>
            <input
              type="text"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Search user..."
            />
          </div>
          <div className="form-group">
            <label>Filter by Tier</label>
            <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
              <option value="">All Tiers</option>
              <option value="1">Tier 1 (Clean)</option>
              <option value="2">Tier 2 (Suspicious)</option>
              <option value="3">Tier 3 (Malicious)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No logs found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User ID</th>
                <th>Query</th>
                <th>Tier</th>
                <th>Noisy Response</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => (
                <tr key={idx}>
                  <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                  <td>{log.userId}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.prompt}
                  </td>
                  <td>
                    <span className={`badge tier-${log.tier}`}>
                      {log.tier === 1 ? 'Clean' : log.tier === 2 ? 'Suspicious' : 'Malicious'}
                    </span>
                  </td>
                  <td>{log.noisy_answer_served ? '✓ Yes' : '✗ No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}