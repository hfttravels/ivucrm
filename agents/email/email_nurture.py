"""
Agent #32 — Email Nurture Agent
Drafts follow-up emails for leads in proposal_sent / negotiating stage.
Schedule: Weekly Sunday
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 32

def draft_email(lead: dict) -> tuple[str, str]:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=400,
        messages=[{"role": "user", "content":
            f"Write a follow-up email for a travel lead.\n"
            f"Name: {lead.get('name', 'there')}\n"
            f"Destination: {lead.get('destination_interest', 'their dream destination')}\n"
            f"Status: {lead.get('status')}\nBudget: ₹{lead.get('budget', 'N/A')}/person\n"
            f"Group: {lead.get('group_size', 'N/A')} people\n"
            f"Brand: Hassle Free Travels\n\n"
            f"Return JSON: {{\"subject\": \"...\", \"body\": \"...\"}}"}],
    )
    data = json.loads(msg.content[0].text)
    return data.get("subject", "Following up on your trip"), data.get("body", "")

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Leads in warm stages not contacted in 3+ days
        cutoff = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        leads = supabase.table("leads").select("*") \
            .in_("status", ["proposal_sent", "negotiating"]) \
            .or_(f"last_contacted_at.lt.{cutoff},last_contacted_at.is.null") \
            .not_.is_("email", "null").limit(10).execute().data

        drafted = []
        for lead in leads:
            try:
                subject, body = draft_email(lead)
                supabase.table("content_queue").insert({
                    "type": "email", "platform": "email",
                    "content": f"Subject: {subject}\n\n{body}",
                    "metadata": {"lead_id": lead["id"], "lead_email": lead.get("email"), "lead_name": lead.get("name")},
                    "status": "pending_review",
                }).execute()
                drafted.append(lead.get("name") or lead["id"])
            except Exception:
                continue

        output = {"leads_checked": len(leads), "emails_drafted": len(drafted), "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
