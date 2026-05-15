import time
from datetime import datetime, timezone
from typing import Any
from .supabase_client import get_supabase


def log_agent_start(agent_number: int) -> float:
    """Mark agent as running in Supabase. Returns start timestamp."""
    start = time.time()
    get_supabase().table("agents").update(
        {"status": "running", "last_run_at": datetime.now(timezone.utc).isoformat()}
    ).eq("agent_number", agent_number).execute()
    return start


def log_agent_complete(agent_number: int, start_time: float, output: Any) -> None:
    duration_ms = int((time.time() - start_time) * 1000)
    get_supabase().table("agents").update(
        {
            "status": "completed",
            "last_run_duration_ms": duration_ms,
            "output_log": output,
            "retry_count": 0,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("agent_number", agent_number).execute()


def log_agent_error(agent_number: int, error: str, retry_count: int) -> None:
    status = "retrying" if retry_count < 3 else "failed"
    payload: dict = {
        "status": status,
        "retry_count": retry_count,
        "output_log": {"error": error},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    get_supabase().table("agents").update(payload).eq("agent_number", agent_number).execute()

    if status == "failed":
        get_supabase().table("notifications").insert(
            {
                "type": "agent_error",
                "priority": "high",
                "title": f"Agent #{agent_number} failed after 3 retries",
                "message": error,
                "related_entity_type": "agent",
            }
        ).execute()
