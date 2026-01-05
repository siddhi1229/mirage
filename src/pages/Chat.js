import { useState } from "react";
import API from "../services/api";

/* helper function (outside component) */
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

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input;
    setInput("");

    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await API.post("/chat", {
        userId,
        prompt: text
      });

      setMessages(prev => [
        ...prev,
        { role: "bot", text: res.data.response || "No response received." }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "⚠ Could not reach backend." }
      ]);
    }

    setLoading(false); // ✅ IMPORTANT
  }

  /* ✅ THIS WAS MISSING */
  return (
    <div>
      <h2>Chat Interface</h2>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          height: "60vh",
          overflowY: "auto",
          background: "white",
          marginBottom: 16
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 10,
              textAlign: m.role === "user" ? "right" : "left"
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 12,
                background: m.role === "user" ? "#2563eb" : "#e5e7eb",
                color: m.role === "user" ? "white" : "black"
              }}
            >
              {m.text}
            </span>
          </div>
        ))}

        {loading && (
          <p style={{ fontStyle: "italic", color: "#6b7280" }}>
            Assistant is typing…
          </p>
        )}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask something…"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc"
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "#111827",
            color: "white",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
