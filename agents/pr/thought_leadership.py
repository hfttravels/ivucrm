"""
Agent #36 — Thought Leadership Agent
Generates LinkedIn posts and blog ideas for founder's personal brand.
Schedule: Weekly Sunday
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 36

TOPICS = [
    "Why group travel is better than solo travel for first-timers",
    "The real cost of a Ladakh trip — what no one tells you",
    "How we plan a 15-person Spiti Valley trip in 48 hours",
    "5 mistakes people make when booking group tours in India",
    "Why October is the best month for Kedarkantha trek",
]

def generate_post(topic: str) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=500,
        messages=[{"role": "user", "content":
            f"Write a LinkedIn post for a travel entrepreneur.\nTopic: {topic}\n"
            f"Brand: Hassle Free Travels (India group tours)\n"
            f"Style: personal story, 1 insight, 1 CTA. 150-200 words. No hashtag spam (max 3 hashtags)."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Pick topic based on week number to avoid repeats
        week = datetime.now().isocalendar()[1]
        topic = TOPICS[week % len(TOPICS)]
        content = generate_post(topic)

        supabase.table("content_queue").insert({
            "type": "linkedin_post", "platform": "linkedin",
            "content": content,
            "metadata": {"topic": topic, "week": week},
            "status": "pending_review",
        }).execute()

        output = {"topic": topic, "post_queued": True, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
