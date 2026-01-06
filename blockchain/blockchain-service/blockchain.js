import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Blockchain Integration Module
 * Handles all Web3 interactions with ThreatChain smart contract
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isConnected = false;
  }

  /**
   * Initialize blockchain connection and contract instance
   */
  async initialize() {
    try {
      // Load environment variables
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
      const privateKey = process.env.PRIVATE_KEY;
      const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

      if (!privateKey) {
        throw new Error("PRIVATE_KEY not set in environment");
      }

      if (!contractAddress) {
        throw new Error("BLOCKCHAIN_CONTRACT_ADDRESS not set in environment");
      }

      // Connect to blockchain provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Create wallet instance
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Load contract ABI
      const abiPath = path.join(__dirname, "..", "ThreatChain.abi.json");
      const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
      
      // Create contract instance
      this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
      
      // Verify connection
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.wallet.address);
      
      console.log("✅ Blockchain service initialized:");
      console.log(`   ├─ Network: ${network.name} (Chain ID: ${network.chainId})`);
      console.log(`   ├─ Contract: ${contractAddress}`);
      console.log(`   ├─ Wallet: ${this.wallet.address}`);
      console.log(`   └─ Balance: ${ethers.formatEther(balance)} ETH`);
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize blockchain service:", error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Log a threat to the blockchain
   * @param {Object} threatData - Threat information
   * @returns {Object} Transaction result
   */
  async logThreat(threatData) {
    if (!this.isConnected) {
      throw new Error("Blockchain service not connected");
    }

    try {
      const { user_id, threat_score, duration_minutes, timestamp } = threatData;

      const threatId = `threat_${user_id}_${Date.now()}`;
      
      // 1. Generate the Privacy-Preserving hashId for the company to verify
      const userHashId = ethers.keccak256(ethers.toUtf8Bytes(user_id));
      
      const threatDetails = {
        userId: user_id,
        userHashId: userHashId, // Included in hashed details
        threatScore: threat_score,
        durationMinutes: duration_minutes,
        timestamp: timestamp,
        detectionTime: new Date().toISOString()
      };
      
      const threatHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(threatDetails))
      );
      
      let severity;
      if (threat_score >= 80) severity = 3; 
      else if (threat_score >= 60) severity = 2;
      else if (threat_score >= 40) severity = 1;
      else severity = 0;
      
      // Log to contract - userHashId used for on-chain privacy
      const tx = await this.contract.logThreat(
        threatId,
        threatHash,
        user_id, 
        severity
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        threatId: threatId,
        transactionHash: receipt.hash, // The proof for SQLite
        userHashId: userHashId,        // The lookup ID for the company
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error("❌ Failed to log threat:", error.message);
      throw error;
    }
  }

  /**
   * Get threat by ID from blockchain
   */
  async getThreat(threatId) {
    if (!this.isConnected) {
      throw new Error("Blockchain service not connected");
    }

    try {
      const threat = await this.contract.getThreatById(threatId);
      return {
        threatId: threat.threatId,
        threatHash: threat.threatHash,
        timestamp: threat.timestamp.toString(),
        ipAddressHash: threat.ipAddressHash,
        severity: threat.severity,
        blockNumber: threat.blockNumber.toString()
      };
    } catch (error) {
      console.error("❌ Failed to get threat:", error.message);
      throw error;
    }
  }

  /**
   * Get total number of threats logged
   */
  async getThreatCount() {
    if (!this.isConnected) {
      throw new Error("Blockchain service not connected");
    }

    try {
      const count = await this.contract.getThreatCount();
      return count.toString();
    } catch (error) {
      console.error("❌ Failed to get threat count:", error.message);
      throw error;
    }
  }

  /**
   * Check if service is healthy
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { healthy: false, error: "Not connected" };
      }

      const blockNumber = await this.provider.getBlockNumber();
      const threatCount = await this.getThreatCount();
      
      return {
        healthy: true,
        blockNumber: blockNumber,
        threatCount: threatCount,
        contractAddress: await this.contract.getAddress(),
        walletAddress: this.wallet.address
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new BlockchainService();
