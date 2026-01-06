import { useState, useEffect } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

export default function Settings() {
  const [backendURL, setBackendURL] = useState("");
  const [userId, setUserId] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setBackendURL(localStorage.getItem("backend_url") || "http://localhost:8000");
    setUserId(localStorage.getItem("sentinel_user") || "");
  }, []);

  const handleSaveBackend = async () => {
    if (!backendURL.includes("http")) {
      toast.error("URL must start with http:// or https://");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch(`${backendURL}/health`);
      if (res.ok) {
        localStorage.setItem("backend_url", backendURL);
        toast.success("Backend configured and tested!");
      } else {
        toast.error("Backend not responding");
      }
    } catch (e) {
      toast.error(`Cannot connect: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleChangeUserId = () => {
    const newId = `user-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("sentinel_user", newId);
    setUserId(newId);
    toast.success("User ID changed!");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>⚙️ Settings</h2>

      {/* Backend Configuration */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}
      >
        <h3>🔗 Backend Configuration</h3>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            Backend URL
          </label>
          <input
            value={backendURL}
            onChange={(e) => setBackendURL(e.target.value)}
            placeholder="http://localhost:8000"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
          <small style={{ color: "#6b7280" }}>
            e.g., http://localhost:8000 or https://api.example.com
          </small>
        </div>

        <button
          onClick={handleSaveBackend}
          disabled={testing}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            background: testing ? "#ccc" : "#111827",
            color: "white",
            cursor: testing ? "not-allowed" : "pointer",
            fontWeight: "500"
          }}
        >
          {testing ? "Testing..." : "Test & Save"}
        </button>
      </div>

      {/* User Configuration */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}
      >
        <h3>👤 User Configuration</h3>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            Your User ID
          </label>
          <code
            style={{
              display: "block",
              padding: "10px",
              background: "#f3f4f6",
              borderRadius: "6px",
              marginBottom: "10px",
              wordBreak: "break-all"
            }}
          >
            {userId}
          </code>
          <button
            onClick={handleChangeUserId}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "white",
              cursor: "pointer"
            }}
          >
            Generate New ID
          </button>
        </div>
      </div>

      {/* Current Configuration */}
      <div
        style={{
          background: "#f0f9ff",
          border: "1px solid #bfdbfe",
          padding: "16px",
          borderRadius: "8px"
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>📋 Current Configuration</h4>
        <p style={{ margin: "6px 0" }}>
          <strong>Backend:</strong> <code>{backendURL}</code>
        </p>
        <p style={{ margin: "6px 0" }}>
          <strong>User ID:</strong> <code>{userId || "not set"}</code>
        </p>
      </div>
    </div>
  );
}
