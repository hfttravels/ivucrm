"""
Agent #6 — GEO Specialist
Generates geo-optimised content snippets for AI search (Perplexity, SGE, ChatGPT).
Schedule: Weekly Sunday
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 6

DESTINATIONS = ["Spiti Valley", "Ladakh", "Kashmir", "Manali", "Kedarkantha", "Chopta", "Valley of Flowers"]

def generate_geo_snippet(destination: str) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=400,
        messages=[{"role": "user", "content":
            f"Write a concise, factual 150-word description of {destination} group tours "
            f"optimised for AI search engines (Perplexity, Google SGE). "
            f"Include: best season, group size, duration, price range (₹), unique selling point. "
            f"Brand: Hassle Free Travels. Tone: authoritative, helpful. No fluff."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        queued = []
        for dest in DESTINATIONS[:3]:  # 3 per weekly run
            content = generate_geo_snippet(dest)
            supabase.table("content_queue").insert({
                "type": "schema_markup", "platform": "website",
                "content": content,
                "metadata": {"destination": dest, "type": "geo_snippet"},
                "status": "pending_review",
            }).execute()
            queued.append(dest)

        output = {"snippets_queued": len(queued), "destinations": queued, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
