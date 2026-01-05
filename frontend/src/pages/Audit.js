import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Audit({ backendUrl }) {
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/blockchain/status`);
        setAudit(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch audit:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  return (
    <div>
      <h1>Blockchain Audit Trail</h1>

      <div className="panel">
        {audit.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No audit events recorded</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User ID</th>
                <th>Tier</th>
                <th>Action</th>
                <th>TX Hash</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((event, idx) => (
                <tr key={idx}>
                  <td>{event.timestamp ? new Date(event.timestamp).toLocaleString() : '-'}</td>
                  <td>{event.userId}</td>
                  <td>
                    <span className={`badge tier-${event.tier}`}>
                      {event.tier === 1 ? 'Clean' : event.tier === 2 ? 'Suspicious' : 'Malicious'}
                    </span>
                  </td>
                  <td>Blockchain Audit</td>
                  <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                    {event.txHash ? event.txHash.substring(0, 20) + '...' : 'pending'}
                  </td>
                  <td style={{ color: 'var(--tier2-orange)' }}>{event.status || 'pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}