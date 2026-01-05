from fastapi import FastAPI, Header, Body, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import asyncio
from datetime import datetime, timezone

from scoring import (
    calculate_v_score, 
    calculate_d_score, 
    calculate_hybrid_score,
    calculate_rpm_from_timestamps,
    embedding_model
)
from security import get_clean_response, get_noisy_response
from database import get_user_state, update_user_state, log_query, init_database, get_db_connection
from time_manager import calculate_duration
from audit_bridge import trigger_blockchain_audit

app = FastAPI(title="MIRAGE Security System", version="2.0")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize SQLite database schema"""
    init_database()
    print("✅ Database initialized")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Models
# ============================================================================

class ChatRequest(BaseModel):
    prompt: str

class ChatResponse(BaseModel):
    response: str
    tier: int
    duration_mins: float
    hybrid_score: float

class UserSession(BaseModel):
    userId: str
    tier: int
    first_seen_at: Optional[str]
    last_active_at: str
    time_active: float
    request_count: int
    dynamic_mean_rpm: float

class QueryLog(BaseModel):
    timestamp: str
    userId: str
    prompt: str
    tier: int
    noisy_answer_served: bool

class BlockchainEvent(BaseModel):
    timestamp: str
    userId: str
    tier: int
    txHash: Optional[str]
    status: str

# ============================================================================
# MAIN CHAT ENDPOINT - 3-Tier Defense
# ============================================================================

@app.post("/api/chat", response_model=ChatResponse)
async def handle_query(
    request: ChatRequest = Body(...),
    user_id: str = Header(..., alias="X-User-ID")
):
    """
    Main chat endpoint with 3-Tier Time-Stateful Defense:
    - Tier 1 (Score < 0.8 OR < 2 mins): Clean responses
    - Tier 2 (Score ≥ 0.8 OR 2–10 mins): Noisy responses  
    - Tier 3 (Score ≥ 0.95 AND > 10 mins): Noisy + Blockchain audit
    """
    try:
        # Step 1: Fetch User State
        user_state = await get_user_state(user_id)
        
        now = datetime.now(timezone.utc)
        user_state["query_timestamps"].append(now)
        
        # Keep only last 50 timestamps
        if len(user_state["query_timestamps"]) > 50:
            user_state["query_timestamps"] = user_state["query_timestamps"][-50:]
        
        # Step 2: Calculate Threat Scores
        rpm = calculate_rpm_from_timestamps(user_state["query_timestamps"])
        v_score = calculate_v_score(rpm)
        d_score = calculate_d_score(request.prompt, user_state.get("last_query_embedding"))
        hybrid_score = calculate_hybrid_score(v_score, d_score, w1=0.4, w2=0.6)
        
        # Step 3: Start Tracking if Suspicious
        if hybrid_score >= 0.65 and user_state["first_seen_at"] is None:
            user_state["first_seen_at"] = now
            await update_user_state(user_id, {"first_seen_at": now})
        
        # Step 4: Calculate Duration
        duration_mins = 0.0
        if user_state["first_seen_at"]:
            duration_mins = calculate_duration(user_state["first_seen_at"], now)
        
        # Step 5: Determine Tier
        if hybrid_score >= 0.95 and duration_mins > 10:
            tier = 3
        elif hybrid_score >= 0.8 or (2 <= duration_mins <= 10):
            tier = 2
        else:
            tier = 1
        
        # Step 6: Generate Response
        if tier == 1:
            response_text = await get_clean_response(request.prompt)
            clean_response = response_text
            served_response = response_text
        else:
            clean_response, noisy_response = await get_noisy_response(request.prompt)
            response_text = noisy_response
            served_response = noisy_response
        
        # Step 7: Blockchain Audit for Tier 3
        if tier == 3:
            asyncio.create_task(
                trigger_blockchain_audit(user_id, hybrid_score, duration_mins)
            )
        
        # Step 8: Update User State
        current_embedding = embedding_model.encode(request.prompt, convert_to_numpy=True)
        
        await update_user_state(user_id, {
            "last_active_at": now,
            "dynamic_mean_rpm": rpm,
            "last_query_embedding": current_embedding,
            "total_queries": user_state["total_queries"] + 1,
            "query_timestamps": user_state["query_timestamps"]
        })
        
        # Step 9: Log Query
        await log_query(
            user_id=user_id,
            query=request.prompt,
            clean_response=clean_response,
            served_response=served_response,
            tier=tier,
            hybrid_score=hybrid_score,
            duration_mins=duration_mins
        )
        
        return ChatResponse(
            response=response_text,
            tier=tier,
            duration_mins=round(duration_mins, 2),
            hybrid_score=round(hybrid_score, 3)
        )
    
    except Exception as e:
        print(f"❌ Error in handle_query: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# ============================================================================
# ADMIN ENDPOINTS - Dashboard & Analytics
# ============================================================================

@app.get("/api/sessions")
async def get_all_sessions():
    """Get all active sessions with tier breakdown"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT user_id, first_seen_at, last_active_at, 
                       dynamic_mean_rpm, total_queries
                FROM users 
                ORDER BY last_active_at DESC
            """)
            rows = cursor.fetchall()
            
            result = []
            for row in rows:
                user_id = row[0]
                first_seen = row[1]
                last_active = row[2]
                rpm = row[3]
                total = row[4]
                
                # Calculate duration and tier
                duration_mins = 0.0
                if first_seen:
                    first_dt = datetime.fromisoformat(first_seen)
                    last_dt = datetime.fromisoformat(last_active)
                    duration_mins = (last_dt - first_dt).total_seconds() / 60.0
                
                # Estimate tier based on RPM and duration
                v_score = min(1.0, rpm / 30.0)
                hybrid_score = v_score * 0.5  # Simplified for display
                
                tier = 1
                if hybrid_score >= 0.95 and duration_mins > 10:
                    tier = 3
                elif hybrid_score >= 0.8 or (2 <= duration_mins <= 10):
                    tier = 2
                
                result.append({
                    "userId": user_id,
                    "tier": tier,
                    "first_seen_at": first_seen,
                    "last_active_at": last_active,
                    "time_active": round(duration_mins, 1),
                    "request_count": total,
                    "dynamic_mean_rpm": round(rpm, 2)
                })
            
            return result
    except Exception as e:
        print(f"Error in get_all_sessions: {e}")
        return []

@app.get("/api/logs")
async def get_query_logs():
    """Get all query logs for admin inspection"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT timestamp, user_id, query, tier, 
                       clean_response, served_response
                FROM query_logs 
                ORDER BY timestamp DESC 
                LIMIT 100
            """)
            rows = cursor.fetchall()
            
            result = []
            for row in rows:
                result.append({
                    "timestamp": row[0],
                    "userId": row[1],
                    "prompt": row[2],
                    "tier": row[3],
                    "noisy_answer_served": row[4] != row[5]  # clean != served
                })
            
            return result
    except Exception as e:
        print(f"Error in get_query_logs: {e}")
        return []

@app.get("/api/blockchain/status")
async def get_blockchain_audit():
    """Get blockchain audit trail for Tier 3 events"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT timestamp, user_id, tier
                FROM query_logs 
                WHERE tier = 3
                ORDER BY timestamp DESC 
                LIMIT 50
            """)
            rows = cursor.fetchall()
            
            result = []
            for row in rows:
                result.append({
                    "timestamp": row[0],
                    "userId": row[1],
                    "tier": 3,
                    "txHash": "0x" + str(hash(row[0] + row[1]))[-40:],  # Mock hash
                    "status": "confirmed"
                })
            
            return result
    except Exception as e:
        print(f"Error in get_blockchain_audit: {e}")
        return []

@app.get("/admin/stats")
async def get_dashboard_stats():
    """Global dashboard statistics"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get all users
            cursor.execute("SELECT COUNT(*) FROM users")
            total = cursor.fetchone()[0]
            
            # Count by tier (simplified)
            cursor.execute("""
                SELECT user_id, dynamic_mean_rpm, first_seen_at, last_active_at
                FROM users
            """)
            rows = cursor.fetchall()
            
            tier1 = 0
            tier2 = 0
            tier3 = 0
            
            for row in rows:
                rpm = row[1]
                first_seen = row[2]
                last_active = row[3]
                
                duration_mins = 0.0
                if first_seen:
                    first_dt = datetime.fromisoformat(first_seen)
                    last_dt = datetime.fromisoformat(last_active)
                    duration_mins = (last_dt - first_dt).total_seconds() / 60.0
                
                v_score = min(1.0, rpm / 30.0)
                hybrid = v_score * 0.5
                
                if hybrid >= 0.95 and duration_mins > 10:
                    tier3 += 1
                elif hybrid >= 0.8 or (2 <= duration_mins <= 10):
                    tier2 += 1
                else:
                    tier1 += 1
            
            return {
                "total_sessions": total,
                "tier1_clean": tier1,
                "tier2_suspicious": tier2,
                "tier3_malicious": tier3
            }
    except Exception as e:
        print(f"Error in get_dashboard_stats: {e}")
        return {
            "total_sessions": 0,
            "tier1_clean": 0,
            "tier2_suspicious": 0,
            "tier3_malicious": 0
        }

# ============================================================================
# Health Checks
# ============================================================================

@app.get("/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "service": "MIRAGE Security System",
        "version": "2.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
