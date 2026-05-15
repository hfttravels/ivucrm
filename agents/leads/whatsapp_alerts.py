"""
Agent #22 — WhatsApp Automation
Sends unread CRITICAL/HIGH notifications to founder's WhatsApp.
Schedule: Every 30 minutes
"""
import sys, os, json
import httpx
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 22

WA_TOKEN = os.getenv("WHATSAPP_API_TOKEN")
WA_PHONE_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
FOUNDER_NUMBER = os.getenv("FOUNDER_WHATSAPP_NUMBER")
WA_API_URL = f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/messages"

PRIORITY_EMOJI = {"critical": "🚨", "high": "⚠️", "medium": "📌"}


def send_whatsapp(to: str, text: str) -> dict:
    resp = httpx.post(
        WA_API_URL,
        headers={"Authorization": f"Bearer {WA_TOKEN}", "Content-Type": "application/json"},
        json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text},
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()

    try:
        # Fetch unread high/critical notifications not yet actioned
        notifications = supabase.table("notifications") \
            .select("id, type, priority, title, message, created_at") \
            .in_("priority", ["critical", "high"]) \
            .eq("is_read", False) \
            .eq("is_actioned", False) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute().data

        sent = []
        failed = []

        for notif in notifications:
            emoji = PRIORITY_EMOJI.get(notif["priority"], "📌")
            text = (
                f"{emoji} *{notif['priority'].upper()}* — Hassle Free Travels CRM\n\n"
                f"*{notif['title']}*\n\n"
                f"{notif['message'][:500]}"  # WhatsApp text limit safety
            )

            try:
                send_whatsapp(FOUNDER_NUMBER, text)
                # Mark as actioned so we don't resend
                supabase.table("notifications").update({
                    "is_actioned": True,
                    "is_read": True,
                }).eq("id", notif["id"]).execute()
                sent.append(notif["id"])
            except Exception as e:
                failed.append({"id": notif["id"], "error": str(e)})

        output = {
            "notifications_found": len(notifications),
            "sent": len(sent),
            "failed": len(failed),
            "failed_details": failed,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output

    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0)
        raise


if __name__ == "__main__":
    print(f"[Agent #{AGENT_NUMBER}] WhatsApp Alerts — Starting...")
    result = run()
    print(json.dumps(result, indent=2))
