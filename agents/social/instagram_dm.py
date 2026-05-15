"""
Agent #20 — Community/DM Agent
Fetches Instagram DMs, classifies intent, drafts replies → content_queue for approval.
Schedule: Every 2 hours
"""
import sys, os, json
import httpx
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 20

IG_ACCOUNT_ID = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")
META_TOKEN = os.getenv("META_ACCESS_TOKEN")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
GRAPH_URL = "https://graph.facebook.com/v19.0"

# Intent classification → reply template hints
INTENT_MAP = {
    "pricing":     "Share package pricing and invite them to WhatsApp for details.",
    "itinerary":   "Share itinerary highlights and link to the package page.",
    "availability":"Check seats and share current availability with urgency if filling fast.",
    "booking":     "Guide them to WhatsApp (+91XXXXXXXXXX) to complete booking.",
    "general":     "Warm, friendly reply. Invite them to DM or WhatsApp for more info.",
}


def classify_and_draft(dm_text: str) -> tuple[str, str]:
    """Use Claude to classify intent and draft a reply. Returns (intent, draft_reply)."""
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

    prompt = f"""You are a travel brand assistant for Hassle Free Travels (India).

Instagram DM received:
\"\"\"{dm_text}\"\"\"

1. Classify intent as ONE of: pricing, itinerary, availability, booking, general
2. Draft a short, warm Instagram reply (max 3 sentences, no hashtags, conversational tone).

Respond as JSON: {{"intent": "...", "reply": "..."}}"""

    msg = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(msg.content[0].text)
    return data.get("intent", "general"), data.get("reply", "")


def fetch_instagram_dms() -> list[dict]:
    """Fetch recent unread DMs from Instagram Graph API."""
    try:
        resp = httpx.get(
            f"{GRAPH_URL}/{IG_ACCOUNT_ID}/conversations",
            params={
                "fields": "messages{message,from,created_time}",
                "access_token": META_TOKEN,
                "limit": 20,
            },
            timeout=15,
        )
        resp.raise_for_status()
        convos = resp.json().get("data", [])
        dms = []
        for convo in convos:
            for msg in convo.get("messages", {}).get("data", []):
                if msg.get("from", {}).get("id") != IG_ACCOUNT_ID:  # Only incoming
                    dms.append(msg)
        return dms
    except Exception:
        return []  # Graceful degradation if API not configured


def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()

    try:
        dms = fetch_instagram_dms()
        processed = []

        for dm in dms[:10]:  # Cap at 10 per run
            dm_text = dm.get("message", "").strip()
            if not dm_text or len(dm_text) < 3:
                continue

            intent, draft_reply = classify_and_draft(dm_text)

            # Store draft in content_queue for founder approval
            supabase.table("content_queue").insert({
                "type": "instagram_caption",  # Closest type for DM reply
                "platform": "instagram",
                "content": draft_reply,
                "metadata": {
                    "dm_text": dm_text[:500],
                    "intent": intent,
                    "sender_id": dm.get("from", {}).get("id"),
                    "dm_created_at": dm.get("created_time"),
                    "hint": INTENT_MAP.get(intent, ""),
                },
                "status": "pending_review",
            }).execute()

            processed.append({"intent": intent, "dm_preview": dm_text[:80]})

        # Notify if DMs need review
        if processed:
            supabase.table("notifications").insert({
                "type": "approval_required",
                "priority": "medium",
                "title": f"{len(processed)} Instagram DM replies ready for review",
                "message": "\n".join(f"• [{p['intent']}] {p['dm_preview']}" for p in processed),
                "is_read": False,
                "is_actioned": False,
            }).execute()

        output = {
            "dms_fetched": len(dms),
            "dms_processed": len(processed),
            "processed": processed,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output

    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0)
        raise


if __name__ == "__main__":
    print(f"[Agent #{AGENT_NUMBER}] Instagram DM Agent — Starting...")
    result = run()
    print(json.dumps(result, indent=2))
