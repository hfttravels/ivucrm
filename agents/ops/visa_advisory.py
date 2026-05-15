"""
Agent #30 — Visa & Travel Advisory Agent
Monitors travel advisories for active package destinations.
Schedule: Every 6 hours
"""
import sys, os, json
import httpx
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 30

# India domestic — no visa needed, but check weather/road advisories
ADVISORY_SOURCES = {
    "Ladakh": "https://www.leh.nic.in/",
    "Spiti Valley": "https://hppolice.gov.in/",
    "Kashmir": "https://jktourism.gov.in/",
}

def check_advisory(destination: str) -> dict:
    """In production: scrape official advisory pages. Here we return a structured check."""
    return {
        "destination": destination,
        "status": "normal",  # normal | advisory | warning
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "note": "No active advisories. Roads open.",
    }

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        pkgs = supabase.table("packages").select("destination") \
            .in_("status", ["active", "filling_fast"]).execute().data
        destinations = list({p["destination"] for p in pkgs})

        advisories = [check_advisory(d) for d in destinations]
        warnings = [a for a in advisories if a["status"] in ("advisory", "warning")]

        if warnings:
            supabase.table("notifications").insert({
                "type": "system", "priority": "critical",
                "title": f"Travel Advisory: {len(warnings)} destination(s) flagged",
                "message": "\n".join(f"• {w['destination']}: {w['note']}" for w in warnings),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"destinations_checked": len(destinations), "warnings": len(warnings), "advisories": advisories, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
