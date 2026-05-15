"""
Agent #21 — Lead Scoring Agent
Scores new leads 0–100 based on budget, group size, source, and destination match.
Schedule: on_trigger (fires when new lead created via webhook)
"""
import sys, os, json
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 21

SOURCE_SCORES = {
    "whatsapp": 30, "instagram_dm": 25, "meta_ad": 20,
    "website": 20, "referral": 35, "google_organic": 25,
    "instagram_bio_link": 15, "other": 10,
}
HIGH_VALUE_DESTINATIONS = ["ladakh", "spiti", "kashmir", "kedarkantha", "valley of flowers"]

def score_lead(lead: dict) -> int:
    score = 0
    # Source quality (max 35)
    score += SOURCE_SCORES.get(lead.get("source", "other"), 10)
    # Budget (max 25)
    budget = lead.get("budget") or 0
    if budget >= 25000: score += 25
    elif budget >= 15000: score += 18
    elif budget >= 8000: score += 10
    elif budget > 0: score += 5
    # Group size (max 20)
    group = lead.get("group_size") or 0
    if group >= 6: score += 20
    elif group >= 4: score += 15
    elif group >= 2: score += 8
    # Destination match (max 10)
    dest = (lead.get("destination_interest") or "").lower()
    if any(d in dest for d in HIGH_VALUE_DESTINATIONS): score += 10
    elif dest: score += 5
    # Has email (max 5)
    if lead.get("email"): score += 5
    # Has travel month (max 5)
    if lead.get("travel_month"): score += 5
    return min(score, 100)

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Score all leads with score = 0 (unscored)
        unscored = supabase.table("leads").select("*").eq("score", 0).execute().data
        updated = []
        for lead in unscored:
            new_score = score_lead(lead)
            supabase.table("leads").update({
                "score": new_score,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", lead["id"]).execute()
            updated.append({"id": lead["id"], "name": lead.get("name"), "score": new_score})

        # Alert on hot leads (score >= 70)
        hot = [l for l in updated if l["score"] >= 70]
        if hot:
            supabase.table("notifications").insert({
                "type": "lead_alert", "priority": "high",
                "title": f"{len(hot)} hot lead(s) scored ≥70",
                "message": "\n".join(f"• {l['name'] or 'Unknown'} — score {l['score']}" for l in hot),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"leads_scored": len(updated), "hot_leads": len(hot), "scores": updated, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
