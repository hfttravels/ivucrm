"""
Agent #23 — Upsell & Cross-sell Agent
Identifies booked leads for upsell opportunities, drafts WhatsApp messages.
Schedule: on_trigger
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 23

def draft_upsell(lead: dict, package_title: str) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=200,
        messages=[{"role": "user", "content":
            f"Write a short, friendly WhatsApp upsell message (2-3 sentences) for a travel customer.\n"
            f"Customer: {lead.get('name', 'there')}, booked {package_title}.\n"
            f"Upsell: travel insurance, airport transfers, or a pre-trip hotel night.\n"
            f"Tone: warm, not pushy. End with a question."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Booked leads not yet actioned for upsell
        booked = supabase.table("leads").select("*, packages(title)") \
            .eq("status", "booked").is_("notes", "null").limit(10).execute().data

        drafted = []
        for lead in booked:
            pkg_title = (lead.get("packages") or {}).get("title", "your upcoming trip")
            try:
                msg = draft_upsell(lead, pkg_title)
                supabase.table("content_queue").insert({
                    "type": "whatsapp_message", "platform": "whatsapp",
                    "content": msg,
                    "metadata": {"lead_id": lead["id"], "lead_name": lead.get("name"), "whatsapp": lead["whatsapp_number"]},
                    "status": "pending_review",
                }).execute()
                # Mark lead so we don't re-draft
                supabase.table("leads").update({"notes": "upsell_drafted"}).eq("id", lead["id"]).execute()
                drafted.append(lead.get("name") or lead["id"])
            except Exception:
                continue

        output = {"booked_leads_checked": len(booked), "upsells_drafted": len(drafted), "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
