"""
Agent #7 — Link Building Manager
Identifies backlink opportunities, generates outreach email drafts.
Schedule: Every 2 days
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 7

LINK_TARGETS = [
    {"site": "thrillophilia.com", "type": "guest_post", "topic": "Spiti Valley group tour guide"},
    {"site": "holidify.com", "type": "resource_link", "topic": "Best group tour operators India"},
    {"site": "lonelyplanet.com", "type": "mention", "topic": "Ladakh group travel tips"},
    {"site": "traveltriangle.com", "type": "listing", "topic": "Hassle Free Travels operator profile"},
    {"site": "reddit.com/r/india", "type": "community", "topic": "Group trek recommendations"},
]

def draft_outreach(target: dict) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=300,
        messages=[{"role": "user", "content":
            f"Write a short link-building outreach email.\n"
            f"Target site: {target['site']}\nType: {target['type']}\nTopic: {target['topic']}\n"
            f"From: Hassle Free Travels (India group tours, hasslefreetravels.in)\n"
            f"Keep it under 100 words. Personalised, value-first, no spam language."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        drafted = []
        for target in LINK_TARGETS[:3]:  # 3 per run
            pitch = draft_outreach(target)
            supabase.table("content_queue").insert({
                "type": "pr_pitch", "platform": "email",
                "content": pitch,
                "metadata": {"target_site": target["site"], "link_type": target["type"], "topic": target["topic"]},
                "status": "pending_review",
            }).execute()
            drafted.append(target["site"])

        output = {"pitches_drafted": len(drafted), "targets": drafted,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
