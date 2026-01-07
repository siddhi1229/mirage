from datetime import datetime, timezone


def calculate_duration(first_seen_at: datetime, last_active_at: datetime) -> float:
    """
    Calculate session duration in minutes.
    
    Args:
        first_seen_at: When user first started interacting
        last_active_at: Most recent query timestamp
    
    Returns:
        Duration in minutes (float)
    """
    if not first_seen_at or not last_active_at:
        return 0.0
    
    # Ensure timezone-aware datetimes
    if first_seen_at.tzinfo is None:
        first_seen_at = first_seen_at.replace(tzinfo=timezone.utc)
    if last_active_at.tzinfo is None:
        last_active_at = last_active_at.replace(tzinfo=timezone.utc)
    
    duration_seconds = (last_active_at - first_seen_at).total_seconds()
    duration_minutes = duration_seconds / 60.0
    
    return max(0.0, duration_minutes)  # Prevent negative durations

