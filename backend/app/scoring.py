import numpy as np
from datetime import datetime, timezone, timedelta
from typing import Optional
import hashlib

# Simple hash-based embedding (no external model needed)
def simple_embedding(text: str) -> np.ndarray:
    """
    Create a simple embedding using hash-based approach.
    Fast, lightweight, no downloads needed.
    """
    text = text.lower().strip()
    embeddings = []
    for i in range(128):
        hash_input = f"{text}_{i}".encode('utf-8')
        hash_val = int(hashlib.md5(hash_input).hexdigest(), 16)
        embeddings.append((hash_val % 1000) / 1000.0)
    return np.array(embeddings, dtype=np.float32)

class SimpleEmbedder:
    def encode(self, text, convert_to_numpy=True):
        return simple_embedding(text)

embedding_model = SimpleEmbedder()

def calculate_rpm_from_timestamps(timestamps: list) -> float:
    if not timestamps or len(timestamps) < 2:
        return 0.0
    
    now = datetime.now(timezone.utc)
    five_minutes_ago = now - timedelta(minutes=5)
    recent_timestamps = [ts for ts in timestamps if ts >= five_minutes_ago]
    
    if len(recent_timestamps) < 2:
        return 0.0
    
    time_span_seconds = (recent_timestamps[-1] - recent_timestamps[0]).total_seconds()
    time_span_minutes = max(time_span_seconds / 60.0, 1.0)
    return len(recent_timestamps) / time_span_minutes

def calculate_v_score(rpm: float) -> float:
    max_rpm_threshold = 30.0
    return min(1.0, rpm / max_rpm_threshold)

def calculate_d_score(query: str, last_query_embedding: Optional[np.ndarray]) -> float:
    if last_query_embedding is None:
        return 0.0
    
    current_embedding = embedding_model.encode(query, convert_to_numpy=True)
    dot_product = np.dot(current_embedding, last_query_embedding)
    norm_current = np.linalg.norm(current_embedding)
    norm_last = np.linalg.norm(last_query_embedding)
    
    if norm_current * norm_last == 0:
        return 0.0
    
    similarity = dot_product / (norm_current * norm_last)
    return max(0.0, min(1.0, similarity))

def calculate_hybrid_score(v_score: float, d_score: float, w1: float = 0.4, w2: float = 0.6) -> float:
    return min(1.0, (w1 * v_score) + (w2 * d_score))

