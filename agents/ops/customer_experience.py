"""
Agent #31 — Customer Experience Agent
Sends pre-trip preparation messages to booked travellers 7 days before departure.
Schedule: on_trigger (daily check)
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 31

def draft_pretrip_message(lead: dict, pkg: dict, days_until: int) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=300,
        messages=[{"role": "user", "content":
            f"Write a pre-trip WhatsApp message for a booked traveller.\n"
            f"Name: {lead.get('name', 'there')}\nDestination: {pkg.get('destination', 'your destination')}\n"
            f"Days until departure: {days_until}\n"
            f"Include: packing essentials, what to expect, emergency contact reminder.\n"
            f"Brand: Hassle Free Travels. Warm, excited tone. Max 4 sentences."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        now = datetime.now(timezone.utc)
        window_start = (now + timedelta(days=6)).isoformat()
        window_end = (now + timedelta(days=8)).isoformat()

        # Leads booked on packages departing in ~7 days
        booked = supabase.table("leads").select("*, packages(title, destination, departure_date)") \
            .eq("status", "booked").not_.is_("package_id", "null").execute().data

        sent = []
        for lead in booked:
            pkg = lead.get("packages") or {}
            dep = pkg.get("departure_date", "")
            if not dep:
                continue
            dep_dt = datetime.fromisoformat(dep.replace("Z", "+00:00"))
            days_until = (dep_dt - now).days
            if not (6 <= days_until <= 8):
                continue

            msg = draft_pretrip_message(lead, pkg, days_until)
            supabase.table("content_queue").insert({
                "type": "whatsapp_message", "platform": "whatsapp",
                "content": msg,
                "metadata": {"lead_id": lead["id"], "whatsapp": lead["whatsapp_number"],
                             "days_until_departure": days_until, "destination": pkg.get("destination")},
                "status": "pending_review",
            }).execute()
            sent.append({"name": lead.get("name"), "destination": pkg.get("destination"), "days": days_until})

        output = {"leads_checked": len(booked), "messages_drafted": len(sent), "departures": sent,
                  "timestamp": now.isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
