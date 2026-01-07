import React, { useState } from 'react';
import API from '../services/api';

function getUserId() {
    let userId = localStorage.getItem('sentineluser');
    if (!userId) {
        userId = `user-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('sentineluser', userId);
    }
    return userId;
}

export default function Chat() {
    const userId = getUserId();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [tier, setTier] = useState(null);
    const [score, setScore] = useState(null);

    async function sendMessage(e) {
        e.preventDefault();
        if (!input.trim()) return;

        const text = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text }]);
        setLoading(true);

        try {
            const res = await API.post('/api/chat', { prompt: text });
            const { response, tier: responseTier, hybrid_score } = res.data;

            setMessages(prev => [...prev, {
                role: 'bot',
                text: response || 'No response received.',
                tier: responseTier,
                score: hybrid_score
            }]);

            setTier(responseTier);
            setScore(hybrid_score);

            // Show tier notification
            if (responseTier === 1) {
                // Tier 1 - no notification
            } else if (responseTier === 2) {
                // Tier 2 - subtle notification
            } else if (responseTier === 3) {
                // Tier 3 - alert notification
            }
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, { role: 'bot', text: `Error: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    }

    const getTierColor = (tierNum) => {
        if (tierNum === 1) return 'var(--color-success)';
        if (tierNum === 2) return 'var(--color-warning)';
        if (tierNum === 3) return 'var(--color-error)';
        return 'var(--color-info)';
    };

    const getTierBg = (tierNum) => {
        if (tierNum === 1) return 'rgba(var(--color-success-rgb), 0.15)';
        if (tierNum === 2) return 'rgba(var(--color-warning-rgb), 0.15)';
        if (tierNum === 3) return 'rgba(var(--color-error-rgb), 0.15)';
        return 'rgba(var(--color-info-rgb), 0.15)';
    };

    return (
        <div style={{ padding: 'var(--space-20)', maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ 
                color: 'var(--color-text)', 
                marginBottom: 'var(--space-20)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)'
            }}>
                💬 Chat Interface
            </h2>

            {/* User Info Card */}
            <div className="card" style={{ marginBottom: 'var(--space-16)' }}>
                <div className="card__body" style={{ padding: 'var(--space-16)' }}>
                    <div style={{ 
                        fontSize: 'var(--font-size-sm)', 
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--space-8)'
                    }}>
                        <strong style={{ color: 'var(--color-text)' }}>User ID:</strong> <code style={{ 
                            background: 'var(--color-secondary)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)'
                        }}>{userId}</code>
                    </div>
                    {tier && (
                        <div style={{ marginTop: 'var(--space-12)' }}>
                            <strong style={{ color: 'var(--color-text)' }}>Current Status:</strong>
                            <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-8)' }}>
                                <span className="status" style={{
                                    backgroundColor: getTierBg(tier),
                                    color: getTierColor(tier),
                                    border: `1px solid ${getTierColor(tier)}`,
                                    padding: 'var(--space-6) var(--space-12)',
                                    borderRadius: 'var(--radius-base)',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 'var(--font-weight-medium)'
                                }}>
                                    {tier === 1 ? '✅ Tier 1 - Normal' : tier === 2 ? '⚠️ Tier 2 - Suspicious' : '🚨 Tier 3 - Malicious'}
                                </span>
                                <span style={{
                                    padding: 'var(--space-6) var(--space-12)',
                                    borderRadius: 'var(--radius-base)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-text-secondary)',
                                    background: 'var(--color-secondary)'
                                }}>
                                    Score: <code>{score?.toFixed(3)}</code>
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-16)',
                height: 'calc(100vh - 340px)',
                overflowY: 'auto',
                marginBottom: 'var(--space-16)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-12)'
            }}>
                {messages.length === 0 ? (
                    <p style={{ 
                        color: 'var(--color-text-secondary)', 
                        textAlign: 'center', 
                        marginTop: '50px',
                        fontSize: 'var(--font-size-base)'
                    }}>
                        Start chatting! Messages appear here.
                    </p>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i}>
                            {/* Message Bubble */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: 'var(--space-8)'
                                }}
                            >
                                <div style={{
                                    display: 'inline-block',
                                    maxWidth: '70%',
                                    padding: 'var(--space-12)',
                                    borderRadius: 'var(--radius-base)',
                                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-secondary)',
                                    color: msg.role === 'user' ? 'var(--color-btn-primary-text)' : 'var(--color-text)',
                                    wordWrap: 'break-word',
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-normal)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    {msg.text}
                                    {msg.tier && (
                                        <div style={{
                                            fontSize: 'var(--font-size-xs)',
                                            marginTop: 'var(--space-8)',
                                            opacity: 0.8,
                                            borderTop: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                                            paddingTop: 'var(--space-4)'
                                        }}>
                                            Tier {msg.tier} | {msg.score?.toFixed(3)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Noisy Response Notification for Tier 2 & 3 */}
                            {msg.role === 'bot' && msg.tier && msg.tier > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    marginBottom: 'var(--space-16)',
                                    paddingLeft: 'var(--space-8)'
                                }}>
                                    <div style={{
                                        fontSize: 'var(--font-size-sm)',
                                        padding: 'var(--space-12)',
                                        borderRadius: 'var(--radius-base)',
                                        background: getTierBg(msg.tier),
                                        color: getTierColor(msg.tier),
                                        borderLeft: `3px solid ${getTierColor(msg.tier)}`,
                                        maxWidth: '70%',
                                        boxShadow: 'var(--shadow-xs)'
                                    }}>
                                        <strong>🔀 Noisy Response Generated</strong>
                                        <div style={{ 
                                            fontSize: 'var(--font-size-xs)', 
                                            marginTop: 'var(--space-8)', 
                                            lineHeight: 'var(--line-height-normal)',
                                            opacity: 0.9
                                        }}>
                                            {msg.tier === 2 
                                                ? '⚠️ Suspicious activity detected. Response has been modified with synonyms, restructured sentences, and added context to disrupt potential gradient-based attacks.'
                                                : '🚨 Malicious activity detected. Response has been heavily noised and logged on blockchain for audit trail. Synonyms replaced, structure altered, and prefixes/suffixes added.'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 'var(--space-12)' }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask something..."
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: 'var(--space-12)',
                        borderRadius: 'var(--radius-base)',
                        border: `1px solid var(--color-border)`,
                        fontSize: 'var(--font-size-base)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-family-base)'
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="btn btn--primary"
                    style={{
                        padding: 'var(--space-12) var(--space-20)',
                        borderRadius: 'var(--radius-base)',
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-medium)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    {loading ? 'Sending...' : 'Send'}
                </button>
            </form>

            <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-16)',
                textAlign: 'center'
            }}>
                💡 Tip: Go to <strong>Logs</strong> page to see detailed clean vs noisy response comparison
            </p>
        </div>
    );
}