"""
Agent #33 — Newsletter Curator Agent
Compiles weekly travel newsletter from packages, trends, and top content.
Schedule: Weekly Sunday
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 33

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Get filling-fast packages for urgency section
        hot_pkgs = supabase.table("packages").select("title, destination, seats_filled, seats_total, price_min, departure_date") \
            .eq("status", "filling_fast").limit(3).execute().data

        # Get recently published social posts for content recap
        recent_posts = supabase.table("social_posts").select("caption, platform, likes, reach") \
            .not_.is_("posted_at", "null").order("posted_at", desc=True).limit(3).execute().data

        pkg_lines = "\n".join(
            f"- {p['title']}: {p['seats_filled']}/{p['seats_total']} seats, ₹{p['price_min']:,}, departs {p['departure_date'][:10]}"
            for p in hot_pkgs
        ) or "No filling-fast packages this week."

        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        msg = client.messages.create(
            model="claude-3-haiku-20240307", max_tokens=800,
            messages=[{"role": "user", "content":
                f"Write a weekly travel newsletter for Hassle Free Travels subscribers.\n\n"
                f"Filling Fast Packages:\n{pkg_lines}\n\n"
                f"Tone: exciting, warm, FOMO-inducing. Include: intro, package highlights, CTA to WhatsApp.\n"
                f"Length: ~300 words. Subject line included at top."}],
        )
        newsletter = msg.content[0].text

        supabase.table("content_queue").insert({
            "type": "newsletter", "platform": "email",
            "content": newsletter,
            "metadata": {"week": datetime.now(timezone.utc).strftime("%Y-W%W"), "packages_featured": len(hot_pkgs)},
            "status": "pending_review",
        }).execute()

        output = {"packages_featured": len(hot_pkgs), "newsletter_queued": True, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
