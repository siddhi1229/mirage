
import sqlite3
import json
import os
from datetime import datetime, timezone
from typing import Dict, Optional
import numpy as np
from contextlib import contextmanager

# Database file path
DB_PATH = os.getenv("SQLITE_DB_PATH", "sentinel.db")


# ============================================================================
# Database Connection Context Manager
# ============================================================================

@contextmanager
def get_db_connection():
    """Context manager for SQLite connections"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


# ============================================================================
# Initialize Database Schema
# ============================================================================

def init_database():
    """
    Create tables if they don't exist.
    Run this once at startup.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                first_seen_at TEXT,
                last_active_at TEXT NOT NULL,
                dynamic_mean_rpm REAL DEFAULT 0.0,
                last_query_embedding TEXT,
                total_queries INTEGER DEFAULT 0,
                query_timestamps TEXT DEFAULT '[]'
            )
        """)
        
        # Query logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS query_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                query TEXT NOT NULL,
                clean_response TEXT NOT NULL,
                served_response TEXT NOT NULL,
                tier INTEGER NOT NULL,
                hybrid_score REAL NOT NULL,
                duration_mins REAL NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        
        # Create index for faster queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_timestamp 
            ON query_logs(user_id, timestamp)
        """)
        
        conn.commit()


# ============================================================================
# User State Management
# ============================================================================

async def get_user_state(user_id: str) -> Dict:
    """
    Fetch user state from SQLite.
    Creates new user record if doesn't exist.
    
    Returns:
        {
            "user_id": str,
            "first_seen_at": datetime | None,
            "last_active_at": datetime,
            "dynamic_mean_rpm": float,
            "last_query_embedding": np.ndarray | None,
            "total_queries": int,
            "query_timestamps": List[datetime]
        }
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        
        if not row:
            # Create new user
            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
                INSERT INTO users (user_id, last_active_at, query_timestamps)
                VALUES (?, ?, ?)
            """, (user_id, now, '[]'))
            conn.commit()
            
            return {
                "user_id": user_id,
                "first_seen_at": None,
                "last_active_at": datetime.now(timezone.utc),
                "dynamic_mean_rpm": 0.0,
                "last_query_embedding": None,
                "total_queries": 0,
                "query_timestamps": []
            }
        
        # Parse stored data
        user_state = {
            "user_id": row["user_id"],
            "first_seen_at": datetime.fromisoformat(row["first_seen_at"]) if row["first_seen_at"] else None,
            "last_active_at": datetime.fromisoformat(row["last_active_at"]),
            "dynamic_mean_rpm": row["dynamic_mean_rpm"],
            "last_query_embedding": np.array(json.loads(row["last_query_embedding"])) if row["last_query_embedding"] else None,
            "total_queries": row["total_queries"],
            "query_timestamps": [datetime.fromisoformat(ts) for ts in json.loads(row["query_timestamps"])]
        }
        
        return user_state


async def update_user_state(user_id: str, updates: Dict) -> Dict:
    """
    Update user state in SQLite.
    
    Args:
        user_id: User identifier
        updates: Dict of fields to update
    
    Returns:
        Updated user state
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Build UPDATE query dynamically
        set_clauses = []
        values = []
        
        for key, value in updates.items():
            if key == "last_query_embedding" and isinstance(value, np.ndarray):
                # Convert numpy array to JSON
                set_clauses.append(f"{key} = ?")
                values.append(json.dumps(value.tolist()))
            elif key == "query_timestamps" and isinstance(value, list):
                # Convert datetime list to JSON
                set_clauses.append(f"{key} = ?")
                values.append(json.dumps([ts.isoformat() for ts in value]))
            elif isinstance(value, datetime):
                set_clauses.append(f"{key} = ?")
                values.append(value.isoformat())
            else:
                set_clauses.append(f"{key} = ?")
                values.append(value)
        
        values.append(user_id)
        
        query = f"UPDATE users SET {', '.join(set_clauses)} WHERE user_id = ?"
        cursor.execute(query, values)
        conn.commit()
    
    # Return updated state
    return await get_user_state(user_id)


async def log_query(
    user_id: str, 
    query: str, 
    clean_response: str, 
    served_response: str, 
    tier: int,
    hybrid_score: float,
    duration_mins: float
):
    """
    Log query details for forensic analysis in SQLite.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO query_logs 
            (user_id, timestamp, query, clean_response, served_response, tier, hybrid_score, duration_mins)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            datetime.now(timezone.utc).isoformat(),
            query,
            clean_response,
            served_response,
            tier,
            hybrid_score,
            duration_mins
        ))
        conn.commit()
