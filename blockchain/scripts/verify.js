import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verify ThreatChain smart contract deployment and functionality
 */
async function main() {
  console.log("🔍 Starting ThreatChain verification...\n");

  // Load deployment info
  const deploymentsFile = path.join(__dirname, "..", "deployments.json");
  
  if (!fs.existsSync(deploymentsFile)) {
    console.error("❌ deployments.json not found. Please deploy the contract first.");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsFile, "utf8"));
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  
  const deployment = deployments[networkName] || deployments["localhost"];
  
  if (!deployment) {
    console.error(`❌ No deployment found for network: ${networkName}`);
    console.log("Available deployments:", Object.keys(deployments));
    process.exit(1);
  }

  const contractAddress = deployment.contractAddress;
  console.log("📋 Contract Address:", contractAddress);
  console.log("🌐 Network:", networkName);
  console.log("🔗 Chain ID:", network.chainId.toString(), "\n");

  // Get contract instance
  const ThreatChain = await ethers.getContractAt("ThreatChain", contractAddress);

  // Basic contract verification
  console.log("🔍 Verifying contract basic functionality...");
  
  try {
    const owner = await ThreatChain.owner();
    const threatCount = await ThreatChain.getThreatCount();
    
    console.log("✓ Contract owner:", owner);
    console.log("✓ Current threat count:", threatCount.toString());
    
    // Get all threats if any exist
    if (threatCount > 0) {
      console.log("\n📊 Existing threats:");
      const threats = await ThreatChain.getAllThreats();
      
      threats.forEach((threat, index) => {
        console.log(`\n  Threat #${index}:`);
        console.log(`  ├─ ID: ${threat.threatId}`);
        console.log(`  ├─ Hash: ${threat.threatHash}`);
        console.log(`  ├─ Timestamp: ${new Date(Number(threat.timestamp) * 1000).toISOString()}`);
        console.log(`  ├─ Severity: ${threat.severity}`);
        console.log(`  └─ Block: ${threat.blockNumber.toString()}`);
      });
    } else {
      console.log("\n📊 No threats logged yet");
    }

    // Test logging a sample threat (if requested)
    if (process.argv.includes('--test-log')) {
      console.log("\n🧪 Testing threat logging...");
      
      const testThreatId = `test_threat_${Date.now()}`;
      const testHash = ethers.keccak256(ethers.toUtf8Bytes("Sample threat data"));
      const testIpAddress = "192.168.1.100";
      const testSeverity = 2; // HIGH
      
      console.log("⏳ Logging test threat...");
      const tx = await ThreatChain.logThreat(testThreatId, testHash, testIpAddress, testSeverity);
      
      console.log("📋 Transaction hash:", tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("✓ Transaction confirmed in block:", receipt.blockNumber);
      
      // Verify the threat was logged
      const newCount = await ThreatChain.getThreatCount();
      console.log("✓ New threat count:", newCount.toString());
      
      // Get the logged threat
      const loggedThreat = await ThreatChain.getThreatById(testThreatId);
      console.log("\n📋 Logged threat details:");
      console.log("├─ ID:", loggedThreat.threatId);
      console.log("├─ Hash:", loggedThreat.threatHash);
      console.log("├─ Timestamp:", new Date(Number(loggedThreat.timestamp) * 1000).toISOString());
      console.log("├─ Severity:", loggedThreat.severity);
      console.log("└─ Block:", loggedThreat.blockNumber.toString());
    }
    
    console.log("\n✅ Contract verification completed successfully!");
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });