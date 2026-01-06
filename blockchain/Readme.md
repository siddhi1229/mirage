# ThreatChain Blockchain - How to Run

## 🚀 Running the Blockchain System

### Step 1: Install Dependencies
```powershell
cd "c:\vs code\Mirage-blockchain"
npm install
```

### Step 2: Start Blockchain Node
```powershell
# Terminal 1 - Keep this running
npm run node
```

### Step 3: Deploy Smart Contract
```powershell
# Terminal 2 - Run once
npm run deploy
```

### Step 4: Start Blockchain Service
```powershell
# Terminal 3 - Keep this running
npm run service
```

**If you get "EADDRINUSE" error (port already in use):**
```powershell
# Stop the existing service first
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Then start again
npm run service
```

The blockchain service will be available at: **http://localhost:3001**

---

## ✅ Verify It's Working

```powershell
# Check service health
curl.exe http://localhost:3001/health

# Run test
.\test-service.ps1
```

---

## 🐍 Python Backend Setup

Add to your Python backend's `.env` file:
```env
BLOCKCHAIN_SERVICE_URL=http://localhost:3001
```

You Get 3 Different Hashes:
Threat ID: threat_user_123_1767643933329 (unique identifier)
Threat Hash: 0xc5198675... (cryptographic hash of threat data)
Transaction Hash: 0x28d8d145... (blockchain transaction receipt)