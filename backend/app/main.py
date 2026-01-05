from fastapi import FastAPI, Header, Body, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from datetime import datetime, timezone

# Import all modules
from .scoring import (
    calculate_v_score, 
    calculate_d_score, 
    calculate_hybrid_score,
    calculate_rpm_from_timestamps,
    embedding_model
)
from .security import get_clean_response, get_noisy_response
from .database import get_user_state, update_user_state, log_query, init_database
from .time_manager import calculate_duration
from .audit_bridge import trigger_blockchain_audit

app = FastAPI(title="Mirage")

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
# Request/Response Models
# ============================================================================

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    response: str
    tier: int
    duration_mins: float
    hybrid_score: float


# ============================================================================
# Dependency: Extract User ID from Header
# ============================================================================

async def get_user_id(user_id: str = Header(..., alias="X-User-ID")):
    """Extract user_id from HTTP header"""
    if not user_id:
        raise HTTPException(status_code=400, detail="X-User-ID header required")
    return user_id


# ============================================================================
# MAIN ENDPOINT: /chat - 3-Tier Time-Stateful Defense
# ============================================================================

@app.post("/chat", response_model=QueryResponse)
async def handle_query(
    request: QueryRequest = Body(...),
    user_id: str = Depends(get_user_id)
):
    """
    Main chat endpoint with 3-Tier Defense:
    Tier 1 (0-2 mins): Clean responses
    Tier 2 (2-10 mins): Noisy responses
    Tier 3 (10+ mins): Noisy responses + Blockchain audit
    """
    try:
        # Step 1: Fetch User State
        user_state = await get_user_state(user_id)
        
        now = datetime.now(timezone.utc)
        user_state["query_timestamps"].append(now)
        
        if len(user_state["query_timestamps"]) > 50:
            user_state["query_timestamps"] = user_state["query_timestamps"][-50:]
        
        # Step 2: Calculate Threat Scores
        rpm = calculate_rpm_from_timestamps(user_state["query_timestamps"])
        v_score = calculate_v_score(rpm)
        d_score = calculate_d_score(request.query, user_state.get("last_query_embedding"))
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
            response_text = await get_clean_response(request.query)
            clean_response = response_text
            served_response = response_text
        else:
            clean_response, noisy_response = await get_noisy_response(request.query)
            response_text = noisy_response
            served_response = noisy_response
        
        # Step 7: Blockchain Audit for Tier 3
        if tier == 3:
            asyncio.create_task(
                trigger_blockchain_audit(user_id, hybrid_score, duration_mins)
            )
        
        # Step 8: Update User State
        current_embedding = embedding_model.encode(request.query, convert_to_numpy=True)
        
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
            query=request.query,
            clean_response=clean_response,
            served_response=served_response,
            tier=tier,
            hybrid_score=hybrid_score,
            duration_mins=duration_mins
        )
        
        # Step 10: Return Response
        return QueryResponse(
            response=response_text,
            tier=tier,
            duration_mins=duration_mins,
            hybrid_score=round(hybrid_score, 3)
        )
    
    except Exception as e:
        print(f"❌ Error in handle_query: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "service": "Sentinel MLaaS Security",
        "version": "2.0",
        "database": "SQLite"
    }


@app.get("/admin/user/{user_id}")
async def get_user_analytics(user_id: str):
    """Get detailed analytics for a specific user"""
    user_state = await get_user_state(user_id)
    
    duration_mins = 0.0
    if user_state["first_seen_at"]:
        duration_mins = calculate_duration(
            user_state["first_seen_at"],
            user_state["last_active_at"]
        )
    
    rpm = calculate_rpm_from_timestamps(user_state["query_timestamps"])
    v_score = calculate_v_score(rpm)
    
    return {
        "user_id": user_id,
        "total_queries": user_state["total_queries"],
        "duration_minutes": round(duration_mins, 2),
        "current_rpm": round(rpm, 2),
        "v_score": round(v_score, 3),
        "first_seen_at": user_state["first_seen_at"],
        "last_active_at": user_state["last_active_at"]
    }
