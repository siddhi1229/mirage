import numpy as np
from sentence_transformers import SentenceTransformer
from datetime import datetime, timezone, timedelta

# Load embedding model once at startup (lightweight, ~80MB)
embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')


def calculate_rpm_from_timestamps(timestamps: list) -> float:
    """
    Calculate requests per minute from recent query timestamps.
    Uses last 5 minutes of data.
    """
    if not timestamps or len(timestamps) < 2:
        return 0.0
    
    now = datetime.now(timezone.utc)
    five_minutes_ago = now - timedelta(minutes=5)
    
    # Filter to last 5 minutes
    recent_timestamps = [ts for ts in timestamps if ts >= five_minutes_ago]
    
    if len(recent_timestamps) < 2:
        return 0.0
    
    # Calculate time span in minutes
    time_span_seconds = (recent_timestamps[-1] - recent_timestamps[0]).total_seconds()
    time_span_minutes = max(time_span_seconds / 60.0, 1.0)
    
    rpm = len(recent_timestamps) / time_span_minutes
    
    return rpm


def calculate_v_score(rpm: float) -> float:
    """
    Calculate Velocity Score (V-Score).
    Normalized between 0-1 based on RPM.
    """
    max_rpm_threshold = 30.0
    v_score = min(1.0, rpm / max_rpm_threshold)
    return v_score


def calculate_d_score(query: str, last_query_embedding: np.ndarray | None) -> float:
    """
    Calculate Diversity Score (D-Score).
    Measures cosine similarity between current and last query.
    """
    if last_query_embedding is None:
        return 0.0
    
    current_embedding = embedding_model.encode(query, convert_to_numpy=True)
    
    dot_product = np.dot(current_embedding, last_query_embedding)
    norm_current = np.linalg.norm(current_embedding)
    norm_last = np.linalg.norm(last_query_embedding)
    
    if norm_current * norm_last == 0:
        return 0.0
    
    similarity = dot_product / (norm_current * norm_last)
    similarity = max(0.0, min(1.0, similarity))
    
    return similarity


def calculate_hybrid_score(v_score: float, d_score: float, w1: float = 0.4, w2: float = 0.6) -> float:
    """
    Calculate Hybrid Threat Score.
    Weighted combination of velocity and diversity scores.
    """
    hybrid = (w1 * v_score) + (w2 * d_score)
    return min(1.0, hybrid)
