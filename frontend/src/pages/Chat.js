import React, { useState } from 'react';
import axios from 'axios';

export default function Chat({ backendUrl }) {
  const [userId, setUserId] = useState(localStorage.getItem('chatUserId') || 'user-demo');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(null);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', text: message };
    setMessages([...messages, userMsg]);
    setMessage('');
    setLoading(true);

    const startTime = Date.now();

    try {
      const response = await axios.post(`${backendUrl}/api/chat`, {
        userId,
        prompt: message
      });

      const time = Date.now() - startTime;
      setResponseTime(time);

      const botMsg = {
        role: 'bot',
        text: response.data.response || 'No response received'
      };
      setMessages(m => [...m, botMsg]);

      localStorage.setItem('chatUserId', userId);
    } catch (error) {
      const errMsg = { role: 'system', text: `Error: ${error.message}` };
      setMessages(m => [...m, errMsg]);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Chat Interface</h1>

      <div className="panel-split">
        {/* CLIENT */}
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
              placeholder="Type your message..."
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
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Response time: <strong style={{ color: 'var(--tier1-green)' }}>{responseTime}ms</strong>
            </div>
          )}
        </div>

        {/* MESSAGES */}
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
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}