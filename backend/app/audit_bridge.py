import httpx
import os
from datetime import datetime, timezone

BLOCKCHAIN_SERVICE_URL = os.getenv("BLOCKCHAIN_SERVICE_URL", "http://localhost:3001")


async def trigger_blockchain_audit(user_id: str, hybrid_score: float, duration_mins: float) -> dict:
    try:
        payload = {
            "user_id": user_id,
            "threat_score": hybrid_score,
            "duration_minutes": duration_mins,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BLOCKCHAIN_SERVICE_URL}/log-threat",
                json=payload,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Blockchain proof generated for: {user_id}")
                return {
                    "tx_hash": data.get("txHash"),
                    "hash_id": data.get("userHashId")
                }
            return None
    except Exception as e:
        print(f"❌ Blockchain Bridge Error: {e}")
        return None