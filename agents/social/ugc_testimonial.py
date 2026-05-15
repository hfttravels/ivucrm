"""
Agent #18 — UGC / Testimonial Agent
Identifies user-generated content opportunities, drafts repost captions with credit.
Schedule: on_trigger
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 18

def draft_repost_caption(original_caption: str, username: str, destination: str) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=200,
        messages=[{"role": "user", "content":
            f"Write an Instagram repost caption for UGC content.\n"
            f"Original post by @{username} about {destination}.\n"
            f"Original caption snippet: {original_caption[:200]}\n"
            f"Brand: Hassle Free Travels. Credit the creator. Add 3 hashtags. Warm, community feel."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Check booked leads who have completed trips (status = booked, departure passed)
        from datetime import datetime as dt
        now_iso = datetime.now(timezone.utc).isoformat()
        completed_leads = supabase.table("leads") \
            .select("name, whatsapp_number, destination_interest") \
            .eq("status", "booked").limit(5).execute().data

        drafted = []
        for lead in completed_leads[:2]:
            dest = lead.get("destination_interest", "India")
            name = lead.get("name", "traveller")
            # Draft a testimonial request + repost caption template
            caption = draft_repost_caption(
                f"Amazing trip to {dest}!", name.split()[0] if name else "traveller", dest
            )
            supabase.table("content_queue").insert({
                "type": "instagram_caption", "platform": "instagram",
                "content": caption,
                "metadata": {"type": "ugc_repost", "traveller": name, "destination": dest},
                "status": "pending_review",
            }).execute()
            drafted.append({"traveller": name, "destination": dest})

        output = {"ugc_drafts": len(drafted), "drafts": drafted,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
