import React, { useState } from 'react';

export default function Settings({ backendUrl, setBackendUrl }) {
  const [localUrl, setLocalUrl] = useState(backendUrl);
  const [interval, setInterval] = useState(localStorage.getItem('refreshInterval') || '5');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('backendUrl', localUrl);
    localStorage.setItem('refreshInterval', interval);
    setBackendUrl(localUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1>Settings</h1>

      <div className="panel" style={{ maxWidth: '600px' }}>
        <div className="form-group">
          <label>Backend URL</label>
          <input
            type="text"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            placeholder="http://localhost:8000"
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '6px', display: 'block' }}>
            Enter your FastAPI backend URL
          </small>
        </div>

        <div className="form-group">
          <label>Auto-refresh Interval (seconds)</label>
          <input
            type="number"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            min="1"
            max="60"
          />
          <small style={{ color: 'var(--text-secondary)', marginTop: '6px', display: 'block' }}>
            Dashboard refresh interval (1-60 seconds)
          </small>
        </div>

        <button onClick={handleSave}>
          💾 Save Settings
        </button>

        {saved && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981',
            borderRadius: '4px',
            color: '#10b981',
            fontSize: '13px'
          }}>
            ✓ Settings saved successfully!
          </div>
        )}
      </div>

      <div className="panel" style={{ marginTop: '20px', maxWidth: '600px' }}>
        <h2>API Information</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
          The following endpoints are expected from your backend:
        </p>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '10px' }}>
          <li><code style={{ color: 'var(--tier1-green)' }}>GET /api/sessions</code> - List active sessions</li>
          <li><code style={{ color: 'var(--tier1-green)' }}>GET /api/logs</code> - Get query logs</li>
          <li><code style={{ color: 'var(--tier1-green)' }}>GET /api/blockchain/status</code> - Get audit trail</li>
          <li><code style={{ color: 'var(--tier1-green)' }}>POST /api/chat</code> - Send a chat message</li>
        </ul>
      </div>
    </div>
  );
}