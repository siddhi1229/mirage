import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

function getUserId() {
  let id = localStorage.getItem("sentinel_user");
  if (!id) {
    id = "user-" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("sentinel_user", id);
  }
  return id;
}

export default function Chat() {
  const userId = getUserId();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState(null);
  const [score, setScore] = useState(null);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input;
    setInput("");
    
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await API.post("/api/chat", { prompt: text });
      const { response, tier: responseTier, hybrid_score } = res.data;
      
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response || "No response received.",
          tier: responseTier,
          score: hybrid_score
        }
      ]);

      setTier(responseTier);
      setScore(hybrid_score);

      if (responseTier === 1) toast.success("✅ Tier 1 Normal");
      if (responseTier === 2) toast("⚠️ Tier 2 Suspicious");
      if (responseTier === 3) toast.error("🔴 Tier 3 Malicious");
      
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `Error: ${err.message}` }
      ]);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Chat Interface</h2>

      <div
        style={{
          background: "#f3f4f6",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
          fontSize: "12px"
        }}
      >
        <p>
          <strong>User ID:</strong> <code>{userId}</code>
        </p>
        {tier && (
          <p>
            <strong>Current Tier:</strong>{" "}
            <span
              style={{
                display: "inline-block",
                padding: "4px 8px",
                borderRadius: "4px",
                background:
                  tier === 1 ? "#22c55e" : tier === 2 ? "#facc15" : "#ef4444",
                color: tier === 1 || tier === 3 ? "white" : "black"
              }}
            >
              Tier {tier}
            </span>
            {score && ` Score: ${score.toFixed(3)}`}
          </p>
        )}
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px",
          height: "400px",
          overflowY: "auto",
          background: "white",
          marginBottom: "16px"
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#9ca3af", textAlign: "center" }}>
            No messages yet. Start chatting!
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: "12px",
              textAlign: msg.role === "user" ? "right" : "left"
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "70%",
                padding: "12px",
                borderRadius: "8px",
                background:
                  msg.role === "user" ? "#3b82f6" : "#e5e7eb",
                color: msg.role === "user" ? "white" : "black",
                wordWrap: "break-word"
              }}
            >
              {msg.text}
              {msg.tier && (
                <div style={{ fontSize: "11px", marginTop: "6px" }}>
                  Tier {msg.tier} | Score: {msg.score?.toFixed(3)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={sendMessage}
        style={{ display: "flex", gap: "10px" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "14px"
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: loading ? "#ccc" : "#111827",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
