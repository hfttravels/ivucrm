"""
Agent #34 — PR Outreach Agent
Drafts press pitches to travel media for brand coverage.
Schedule: Every 2 days
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 34

MEDIA_TARGETS = [
    {"outlet": "Condé Nast Traveller India", "editor": "travel editor", "angle": "best group tour operators India 2025"},
    {"outlet": "Times of India Travel", "editor": "travel desk", "angle": "affordable Himalayan group tours"},
    {"outlet": "Outlook Traveller", "editor": "features editor", "angle": "sustainable group travel in India"},
    {"outlet": "National Geographic Traveller India", "editor": "editor", "angle": "off-beat group destinations"},
]

def draft_press_pitch(target: dict, hook: str) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=350,
        messages=[{"role": "user", "content":
            f"Write a press pitch email to {target['outlet']}.\n"
            f"Addressed to: {target['editor']}\nAngle: {target['angle']}\n"
            f"Hook/news peg: {hook}\nBrand: Hassle Free Travels (hasslefreetravels.in)\n"
            f"Keep under 150 words. Newsworthy, not promotional. Include 1 data point."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Use a sold-out or filling-fast package as the news hook
        hot = supabase.table("packages").select("title, destination, seats_filled, seats_total") \
            .in_("status", ["filling_fast", "sold_out"]).limit(1).execute().data
        hook = f"{hot[0]['destination']} group tour sold {hot[0]['seats_filled']}/{hot[0]['seats_total']} seats" if hot else \
               "Hassle Free Travels launches new Himalayan group tour packages for 2025"

        drafted = []
        for target in MEDIA_TARGETS[:2]:
            pitch = draft_press_pitch(target, hook)
            supabase.table("content_queue").insert({
                "type": "pr_pitch", "platform": "email",
                "content": pitch,
                "metadata": {"outlet": target["outlet"], "angle": target["angle"], "hook": hook},
                "status": "pending_review",
            }).execute()
            drafted.append(target["outlet"])

        output = {"pitches_drafted": len(drafted), "outlets": drafted, "hook": hook,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
