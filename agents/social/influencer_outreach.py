"""
Agent #19 — Influencer Outreach Agent
Drafts collaboration pitches for travel influencers aligned with active packages.
Schedule: Weekly Sunday
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 19

# Curated list — in production, pull from influencer DB or social listening results
INFLUENCER_TARGETS = [
    {"handle": "travelwithme_india", "niche": "budget group travel", "followers": "85K"},
    {"handle": "himalayan_wanderer", "niche": "trek & adventure", "followers": "120K"},
    {"handle": "desi_backpacker", "niche": "India travel", "followers": "200K"},
    {"handle": "grouptravel_india", "niche": "group tours", "followers": "45K"},
]

def draft_pitch(influencer: dict, destination: str) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=300,
        messages=[{"role": "user", "content":
            f"Write an Instagram DM collaboration pitch.\n"
            f"To: @{influencer['handle']} ({influencer['followers']} followers, {influencer['niche']})\n"
            f"From: Hassle Free Travels — offering a complimentary spot on {destination} group tour\n"
            f"in exchange for 2 Reels + 3 Stories. Keep it under 100 words. Genuine, not templated."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Get a filling-fast package to pitch
        pkg = supabase.table("packages").select("destination, title") \
            .eq("status", "filling_fast").limit(1).execute().data
        destination = pkg[0]["destination"] if pkg else "Spiti Valley"

        drafted = []
        for influencer in INFLUENCER_TARGETS[:2]:  # 2 pitches per weekly run
            pitch = draft_pitch(influencer, destination)
            supabase.table("content_queue").insert({
                "type": "instagram_caption", "platform": "instagram",
                "content": pitch,
                "metadata": {"type": "influencer_pitch", "handle": influencer["handle"],
                             "followers": influencer["followers"], "destination": destination},
                "status": "pending_review",
            }).execute()
            drafted.append(influencer["handle"])

        output = {"pitches_drafted": len(drafted), "influencers": drafted, "destination": destination,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
