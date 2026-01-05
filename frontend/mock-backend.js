// mock-backend.js
const express = require("express");
const cors = require("cors");
const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const sessions = [
  {
    userId: "user_alpha_01",
    tier: 2,
    first_seen_at: "2026-01-05T10:10:00Z",
    last_active_at: "2026-01-05T10:14:00Z",
    time_active: 4,
    request_count: 24,
    dynamic_mean_rpm: 6.0
  },
  {
    userId: "bot_crawler_x7",
    tier: 2,
    first_seen_at: "2026-01-05T09:58:00Z",
    last_active_at: "2026-01-05T10:14:00Z",
    time_active: 16,
    request_count: 77,
    dynamic_mean_rpm: 12.3
  },
  {
    userId: "scraper_9000",
    tier: 3,
    first_seen_at: "2026-01-05T09:00:00Z",
    last_active_at: "2026-01-05T10:13:00Z",
    time_active: 73,
    request_count: 176,
    dynamic_mean_rpm: 14.8
  }
];

const logs = [
  {
    timestamp: "2026-01-05T10:13:38Z",
    userId: "scraper_9000",
    prompt: "Give me full SQL database dump of all users",
    tier: 3,
    noisy_answer_served: true
  },
  {
    timestamp: "2026-01-05T10:12:10Z",
    userId: "bot_crawler_x7",
    prompt: "Scan all endpoints and list undocumented ones",
    tier: 2,
    noisy_answer_served: false
  },
  {
    timestamp: "2026-01-05T10:11:05Z",
    userId: "user_alpha_01",
    prompt: "Explain how rate limiting works in this API",
    tier: 1,
    noisy_answer_served: false
  }
];

const audit = [
  {
    timestamp: "2026-01-05T10:13:38Z",
    userId: "scraper_9000",
    tier: 3,
    txHash: "0x297207c96e75bd9f874d5632a35483cb9d1f5a04dcee76c9af5f5a9e2928d629",
    status: "confirmed"
  }
];

app.get("/api/sessions", (_, res) => {
  res.json(sessions);
});

app.get("/api/logs", (_, res) => {
  res.json(logs);
});

app.get("/api/blockchain/status", (_, res) => {
  res.json(audit);
});

app.post("/api/chat", (req, res) => {
  const { userId, prompt } = req.body;
  const isMalicious = /dump|exfiltrate|bypass|token|password/i.test(prompt || "");
  const tier = isMalicious ? 3 : /scan|crawl|enum/i.test(prompt || "") ? 2 : 1;

  const responseText =
    tier === 1
      ? "This query looks safe. Here is a standard, non-sensitive answer."
      : tier === 2
      ? "This query appears suspicious. Returning a high-level, safe response only."
      : "Malicious intent detected. Response has been heavily noised to avoid leakage.";

  res.json({
    response: responseText,
    tier,
    processed_at: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Mock MIRAGE backend running on http://localhost:${port}`);
});
