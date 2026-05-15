"""
Agent #13 — Booking Abandonment Agent
Re-engages leads stuck in proposal_sent / negotiating for 5+ days.
Schedule: Weekly Sunday
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 13

def draft_reengagement(lead: dict, days_stuck: int) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    urgency = "high" if days_stuck > 10 else "medium"
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=200,
        messages=[{"role": "user", "content":
            f"Write a re-engagement WhatsApp message for a travel lead.\n"
            f"Name: {lead.get('name', 'there')}, interested in {lead.get('destination_interest', 'a group tour')}\n"
            f"Days since last contact: {days_stuck}\nUrgency: {urgency}\n"
            f"Brand: Hassle Free Travels. Warm, not pushy. Mention limited seats if urgency is high. Max 3 sentences."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        stuck = supabase.table("leads").select("*") \
            .in_("status", ["proposal_sent", "negotiating"]) \
            .lt("last_contacted_at", cutoff).limit(15).execute().data

        drafted = []
        for lead in stuck:
            last = lead.get("last_contacted_at") or lead["created_at"]
            days = (datetime.now(timezone.utc) - datetime.fromisoformat(last.replace("Z", "+00:00"))).days
            try:
                msg = draft_reengagement(lead, days)
                supabase.table("content_queue").insert({
                    "type": "whatsapp_message", "platform": "whatsapp",
                    "content": msg,
                    "metadata": {"lead_id": lead["id"], "lead_name": lead.get("name"),
                                 "whatsapp": lead["whatsapp_number"], "days_stuck": days},
                    "status": "pending_review",
                }).execute()
                drafted.append({"name": lead.get("name"), "days_stuck": days})
            except Exception:
                continue

        if drafted:
            supabase.table("notifications").insert({
                "type": "lead_alert", "priority": "medium",
                "title": f"Abandonment: {len(drafted)} re-engagement message(s) ready",
                "message": "\n".join(f"• {d['name'] or 'Unknown'} — {d['days_stuck']}d since contact" for d in drafted),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"stuck_leads": len(stuck), "messages_drafted": len(drafted), "leads": drafted,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
