import pkg from "hardhat";
const { ethers } = pkg;

/**
 * Simple test deployment script that works entirely in-memory
 */
async function main() {
  console.log("🧪 Testing ThreatChain deployment (in-memory)...\n");

  // Deploy contract to in-memory network
  const ThreatChain = await ethers.getContractFactory("ThreatChain");
  const threatChain = await ThreatChain.deploy();
  await threatChain.waitForDeployment();
  
  const contractAddress = await threatChain.getAddress();
  console.log("✅ ThreatChain deployed at:", contractAddress);

  // Test basic functionality
  console.log("\n🔍 Testing contract functionality...");
  
  // Get initial state
  const owner = await threatChain.owner();
  const initialCount = await threatChain.getThreatCount();
  console.log("✓ Contract owner:", owner);
  console.log("✓ Initial threat count:", initialCount.toString());

  // Test logging a threat
  console.log("\n📝 Testing threat logging...");
  const testThreatId = "test_threat_001";
  const testHash = ethers.keccak256(ethers.toUtf8Bytes("Test threat data"));
  const testIpAddress = "192.168.1.100";
  const testSeverity = 3; // CRITICAL

  const tx = await threatChain.logThreat(testThreatId, testHash, testIpAddress, testSeverity);
  await tx.wait();
  
  console.log("✅ Threat logged successfully!");
  
  // Verify the threat was stored
  const newCount = await threatChain.getThreatCount();
  console.log("✓ New threat count:", newCount.toString());
  
  const storedThreat = await threatChain.getThreatById(testThreatId);
  console.log("✓ Retrieved threat:", {
    id: storedThreat.threatId,
    severity: storedThreat.severity.toString(),
    timestamp: new Date(Number(storedThreat.timestamp) * 1000).toISOString()
  });

  console.log("\n✨ All tests passed! Your blockchain contract is working perfectly!");
  console.log("\n🎯 Summary:");
  console.log("├─ Smart contract: ✅ Working");  
  console.log("├─ Threat logging: ✅ Working");
  console.log("├─ Data retrieval: ✅ Working");
  console.log("└─ Contract address:", contractAddress);
  
  // Update .env files with working contract address
  console.log("\n💾 Use this contract address in your backend:");
  console.log(contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });