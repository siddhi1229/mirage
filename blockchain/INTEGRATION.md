# Python Backend Integration Guide

## 🔗 Connecting Your Python Backend to the Blockchain

### ✅ Your `audit_bridge.py` is Already Perfect!

No changes needed to your Python code. It's correctly configured to communicate with the blockchain service.

### 📋 Required Setup Steps

#### 1. Add to Python Backend's `.env` file:
```env
BLOCKCHAIN_SERVICE_URL=http://localhost:3001
```

#### 2. Ensure Dependencies (already installed):
```bash
pip install httpx
```

#### 3. Integration Points

Your Python backend should call `trigger_blockchain_audit()` for **Tier 3 (Critical) threats only**:

```python
# Example integration in your threat detection logic
from audit_bridge import trigger_blockchain_audit

async def handle_threat_detection(user_id: str, threat_data: dict):
    hybrid_score = threat_data['hybrid_score']
    duration_mins = threat_data['duration_minutes']
    
    # Determine threat tier
    if hybrid_score >= 80:  # Tier 3 - Critical
        # Log to blockchain for immutable audit trail
        success = await trigger_blockchain_audit(
            user_id=user_id,
            hybrid_score=hybrid_score,
            duration_mins=duration_mins
        )
        
        if success:
            print(f"✅ Blockchain audit logged for critical threat: {user_id}")
        else:
            print(f"⚠️ Blockchain logging failed (non-critical error)")
            # Continue with normal threat handling
    
    # Continue with your existing threat handling logic
    # (database logging, alerts, etc.)
```

### 🎯 Complete Workflow

```
┌─────────────────┐
│  Python Backend │
│   (FastAPI)     │
└────────┬────────┘
         │
         │ 1. Detect Tier 3 threat
         │
         ▼
┌─────────────────────┐
│ audit_bridge.py     │
│ trigger_blockchain  │
│      _audit()       │
└────────┬────────────┘
         │
         │ 2. HTTP POST to localhost:3001/log-threat
         │
         ▼
┌─────────────────────┐
│  Node.js Service    │
│  (Express Server)   │
│   Port 3001         │
└────────┬────────────┘
         │
         │ 3. Convert to Web3 transaction
         │
         ▼
┌─────────────────────┐
│   Hardhat Node      │
│   Port 8545         │
└────────┬────────────┘
         │
         │ 4. Execute smart contract
         │
         ▼
┌─────────────────────┐
│  ThreatChain.sol    │
│  (Smart Contract)   │
│  Immutable Storage  │
└─────────────────────┘
```

### 🧪 Testing the Integration

#### From Python (async context):
```python
import asyncio
from audit_bridge import trigger_blockchain_audit

async def test():
    result = await trigger_blockchain_audit(
        user_id="test_user_789",
        hybrid_score=92.5,
        duration_mins=18.7
    )
    print(f"Result: {result}")

asyncio.run(test())
```

#### Expected Output:
```
✅ Blockchain audit logged for user: test_user_789
Result: True
```

### 📊 Response Handling

The `audit_bridge.py` function returns:
- **`True`** - Threat successfully logged to blockchain
- **`False`** - Failed to log (service unavailable, network error, etc.)

**Important:** Blockchain logging failures should NOT block threat detection. The function handles errors gracefully and logs them.

### 🔍 Verification

After logging a threat from Python, verify it on the blockchain:

```powershell
# Get total threat count
curl.exe http://localhost:3001/threat-count

# Check service health
curl.exe http://localhost:3001/health
```

### ⚡ Performance Considerations

- **Timeout:** 5 seconds (configured in `audit_bridge.py`)
- **Async:** Non-blocking (uses `httpx.AsyncClient`)
- **Gas Cost:** ~0.001 ETH per transaction (free on local network)
- **Block Time:** ~1-2 seconds on local Hardhat network

### 🚨 Error Handling

Your `audit_bridge.py` already handles:
- ✅ Network timeouts (5 sec)
- ✅ Service unavailability
- ✅ Invalid responses
- ✅ Exception catching

Errors are logged but **don't crash the application**.

### 🔒 Security Notes

1. **Local Development:**
   - Uses Hardhat test accounts (safe)
   - All data on local blockchain (private)

2. **Production:**
   - Use dedicated wallet with minimal funds
   - Consider encrypted connection (HTTPS)
   - Rate limiting on blockchain service
   - Monitor gas costs

### 📝 Environment Variables Summary

**Python Backend `.env`:**
```env
BLOCKCHAIN_SERVICE_URL=http://localhost:3001
```

**Blockchain Service `.env`:** (already configured)
```env
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
PORT=3001
```

### ✅ Integration Complete Checklist

- [x] `audit_bridge.py` created and configured
- [x] Blockchain service running on port 3001
- [x] Smart contract deployed
- [ ] Add `BLOCKCHAIN_SERVICE_URL` to Python backend `.env`
- [ ] Test integration with sample threat
- [ ] Monitor logs during threat detection

### 🎉 You're Ready!

Your Python backend can now create immutable blockchain records for critical threats!

---

**Questions?** Check the main [Readme.md](Readme.md) for troubleshooting.
