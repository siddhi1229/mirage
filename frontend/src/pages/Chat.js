import React, { useState } from 'react';
import axios from 'axios';

export default function Chat({ backendUrl }) {
  const [userId, setUserId] = useState(localStorage.getItem('chatUserId') || 'user-001');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const [tier, setTier] = useState(null);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', text: message, tier: null };
    setMessages([...messages, userMsg]);
    setMessage('');
    setLoading(true);
    setResponseTime(null);

    const startTime = Date.now();

    try {
      const response = await axios.post(`${backendUrl}/api/chat`, 
        { prompt: message },
        {
          headers: { 
            'X-User-ID': userId,
            'Content-Type': 'application/json'
          }
        }
      );

      const time = Date.now() - startTime;
      setResponseTime(time);
      setTier(response.data.tier);

      const botMsg = {
        role: 'bot',
        text: response.data.response || 'No response received',
        tier: response.data.tier
      };
      setMessages(m => [...m, botMsg]);
      localStorage.setItem('chatUserId', userId);

    } catch (error) {
      const errMsg = { 
        role: 'system', 
        text: `Error: ${error.response?.data?.detail || error.message}`,
        tier: null
      };
      setMessages(m => [...m, errMsg]);
      console.error('Chat error:', error);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Chat Interface</h1>

      <div className="panel-split">
        {/* INPUT PANEL */}
        <div className="panel">
          <h2>Send Query</h2>

          <div className="form-group">
            <label>User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., attacker-001"
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your query..."
              rows="6"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <button onClick={handleSend} disabled={loading || !message.trim()}>
            {loading ? '⏳ Processing...' : '⚡ Send'}
          </button>

          {responseTime && (
            <div style={{ marginTop: '12px', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Response time: <strong style={{ color: 'var(--tier1-green)' }}>{responseTime}ms</strong>
              </div>
              {tier && (
                <div style={{ marginBottom: '6px' }}>
                  Tier: <span className={`badge tier-${tier}`}>
                    {tier === 1 ? 'Clean' : tier === 2 ? 'Suspicious' : 'Malicious'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MESSAGES PANEL */}
        <div className="panel">
          <h2>Messages</h2>
          <div style={{ height: '400px', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                No messages yet. Send one to start.
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  {msg.text}
                  {msg.tier && (
                    <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      Tier {msg.tier}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
