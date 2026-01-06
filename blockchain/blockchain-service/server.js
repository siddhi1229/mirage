import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import blockchainService from "./blockchain.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get("/health", async (req, res) => {
  try {
    const health = await blockchainService.healthCheck();
    res.json({
      status: health.healthy ? "healthy" : "unhealthy",
      service: "blockchain-bridge",
      timestamp: new Date().toISOString(),
      blockchain: health
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message
    });
  }
});

/**
 * Log threat to blockchain - Main endpoint for Python backend
 * POST /log-threat
 * Body: { user_id, threat_score, duration_minutes, timestamp }
 */
app.post("/log-threat", async (req, res) => {
  try {
    const { user_id, threat_score, duration_minutes, timestamp } = req.body;

    // Validate required fields
    if (!user_id || threat_score === undefined || !duration_minutes || !timestamp) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: user_id, threat_score, duration_minutes, timestamp"
      });
    }

    // Validate data types
    if (typeof threat_score !== "number" || typeof duration_minutes !== "number") {
      return res.status(400).json({
        success: false,
        error: "threat_score and duration_minutes must be numbers"
      });
    }

    console.log(`\n🚨 Received threat log request:`);
    console.log(`   User: ${user_id}`);
    console.log(`   Score: ${threat_score}`);
    console.log(`   Duration: ${duration_minutes} mins`);

    // Log to blockchain
    const result = await blockchainService.logThreat({
      user_id,
      threat_score,
      duration_minutes,
      timestamp
    });

    // Return forensic evidence to Python
    res.json({
      success: true,
      message: "Threat logged to blockchain successfully",
      txHash: result.transactionHash,
      userHashId: result.userHashId,
      threatId: result.threatId
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get threat by ID
 * GET /threat/:id
 */
app.get("/threat/:id", async (req, res) => {
  try {
    const threatId = req.params.id;
    const threat = await blockchainService.getThreat(threatId);
    
    res.json({
      success: true,
      data: threat
    });
  } catch (error) {
    console.error("❌ Error getting threat:", error);
    res.status(404).json({
      success: false,
      error: "Threat not found or error retrieving data"
    });
  }
});

/**
 * Get total threat count
 * GET /threat-count
 */
app.get("/threat-count", async (req, res) => {
  try {
    const count = await blockchainService.getThreatCount();
    
    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error("❌ Error getting threat count:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Root endpoint - API info
 */
app.get("/", (req, res) => {
  res.json({
    service: "ThreatChain Blockchain Bridge",
    version: "1.0.0",
    endpoints: {
      "POST /log-threat": "Log a threat to blockchain",
      "GET /threat/:id": "Get threat by ID",
      "GET /threat-count": "Get total threat count",
      "GET /health": "Health check"
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

/**
 * Start server
 */
async function startServer() {
  console.log("\n🚀 Starting Blockchain Bridge Service...\n");
  
  // Initialize blockchain connection
  const initialized = await blockchainService.initialize();
  
  if (!initialized) {
    console.error("\n❌ Failed to initialize blockchain service");
    console.error("   Please check your configuration and try again\n");
    process.exit(1);
  }

  // Start Express server
  app.listen(PORT, () => {
    console.log(`\n✅ Blockchain Bridge Service running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Log threat: POST http://localhost:${PORT}/log-threat\n`);
  });
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down Blockchain Bridge Service...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n👋 Shutting down Blockchain Bridge Service...");
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
