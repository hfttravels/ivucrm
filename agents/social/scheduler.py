"""
Agent #16 — Scheduler & Distributor
Moves approved content into social_posts with optimal IST posting times.
Schedule: on_trigger
"""
import sys, os, json
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 16

# Best posting times in IST (converted to UTC offset +5:30)
OPTIMAL_TIMES_UTC = {
    "instagram": [{"hour": 2, "minute": 30}, {"hour": 13, "minute": 0}, {"hour": 16, "minute": 30}],  # 8AM, 6:30PM, 10PM IST
    "whatsapp":  [{"hour": 3, "minute": 30}, {"hour": 14, "minute": 0}],   # 9AM, 7:30PM IST
    "linkedin":  [{"hour": 3, "minute": 0},  {"hour": 7, "minute": 30}],   # 8:30AM, 1PM IST
}

def next_slot(platform: str) -> datetime:
    now = datetime.now(timezone.utc)
    slots = OPTIMAL_TIMES_UTC.get(platform, OPTIMAL_TIMES_UTC["instagram"])
    for slot in slots:
        candidate = now.replace(hour=slot["hour"], minute=slot["minute"], second=0, microsecond=0)
        if candidate > now + timedelta(minutes=30):
            return candidate
    # All today's slots passed — use first slot tomorrow
    tomorrow = now + timedelta(days=1)
    s = slots[0]
    return tomorrow.replace(hour=s["hour"], minute=s["minute"], second=0, microsecond=0)

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        approved = supabase.table("content_queue") \
            .select("id, type, platform, content, metadata, package_id") \
            .eq("status", "approved").is_("scheduled_at", "null").limit(10).execute().data

        scheduled = []
        for item in approved:
            platform = item["platform"]
            post_time = next_slot(platform)

            supabase.table("social_posts").insert({
                "platform": platform,
                "caption": item["content"],
                "hashtags": (item.get("metadata") or {}).get("hashtags", []),
                "content_queue_id": item["id"],
                "package_id": item.get("package_id"),
                "scheduled_at": post_time.isoformat(),
            }).execute()

            # Mark content as scheduled
            supabase.table("content_queue").update({
                "status": "scheduled",
                "scheduled_at": post_time.isoformat(),
            }).eq("id", item["id"]).execute()

            scheduled.append({"platform": platform, "scheduled_at": post_time.isoformat()})

        output = {"items_scheduled": len(scheduled), "schedule": scheduled,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
