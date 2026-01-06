import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Deploy ThreatChain smart contract
 * Saves deployment details to deployments.json for backend integration
 */
async function main() {
  console.log("🚀 Starting ThreatChain deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString(), "\n");

  // Deploy contract
  console.log("⏳ Deploying ThreatChain contract...");
  const ThreatChain = await ethers.getContractFactory("ThreatChain");
  const threatChain = await ThreatChain.deploy();

  // Wait for deployment to complete
  await threatChain.waitForDeployment();
  
  const contractAddress = await threatChain.getAddress();
  console.log("✅ ThreatChain deployed to:", contractAddress);

  // Get deployment transaction
  const deploymentTx = threatChain.deploymentTransaction();
  if (deploymentTx) {
    console.log("📋 Deployment transaction hash:", deploymentTx.hash);
    console.log("⛽ Gas used:", deploymentTx.gasLimit.toString());
  }

  // Verify contract is working
  console.log("\n🔍 Verifying contract...");
  const owner = await threatChain.owner();
  const threatCount = await threatChain.getThreatCount();
  console.log("✓ Contract owner:", owner);
  console.log("✓ Initial threat count:", threatCount.toString());

  // Save deployment info to file for backend integration
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTimestamp: new Date().toISOString(),
    transactionHash: deploymentTx ? deploymentTx.hash : null,
    blockNumber: deploymentTx ? deploymentTx.blockNumber : null
  };

  const deploymentsDir = path.join(__dirname, "..");
  const deploymentsFile = path.join(deploymentsDir, "deployments.json");

  // Read existing deployments or create new
  let allDeployments = {};
  if (fs.existsSync(deploymentsFile)) {
    const existingData = fs.readFileSync(deploymentsFile, "utf8");
    allDeployments = JSON.parse(existingData);
  }

  // Add new deployment
  allDeployments[network.name] = deploymentInfo;

  // Write to file
  fs.writeFileSync(deploymentsFile, JSON.stringify(allDeployments, null, 2));
  console.log("\n💾 Deployment info saved to deployments.json");

  // Save ABI for backend
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ThreatChain.sol", "ThreatChain.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiFile = path.join(deploymentsDir, "ThreatChain.abi.json");
    fs.writeFileSync(abiFile, JSON.stringify(artifact.abi, null, 2));
    console.log("💾 Contract ABI saved to ThreatChain.abi.json");
  }

  console.log("\n✨ Deployment complete!\n");
  console.log("📋 Summary:");
  console.log("├─ Contract Address:", contractAddress);
  console.log("├─ Network:", network.name);
  console.log("├─ Chain ID:", network.chainId.toString());
  console.log("└─ Owner:", deployer.address);
  console.log("\n🔧 Next steps:");
  console.log("1. Copy the contract address to your backend .env file");
  console.log("2. Update BLOCKCHAIN_CONTRACT_ADDRESS in your backend");
  console.log("3. Start your backend server");
  console.log("4. Test threat logging via API\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });