import httpx
import os
from datetime import datetime, timezone

BLOCKCHAIN_SERVICE_URL = os.getenv("BLOCKCHAIN_SERVICE_URL", "http://localhost:3001")


async def trigger_blockchain_audit(user_id: str, hybrid_score: float, duration_mins: float) -> bool:
    """
    Send audit trigger to Node.js blockchain service.
    Creates immutable record on blockchain for Tier 3 threats.
    """
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
                timeout=5.0
            )
            
            if response.status_code == 200:
                print(f" Blockchain audit logged for user: {user_id}")
                return True
            else:
                print(f" Blockchain service returned {response.status_code}")
                return False
    
    except Exception as e:
        print(f" Failed to trigger blockchain audit: {e}")
        return False


