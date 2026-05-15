"""
Agent #3 — Content Optimiser
Finds pages with declining CTR or position, queues optimised content via Claude.
Schedule: Daily 8AM IST
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 3

def optimise_meta(keyword: str, current_url: str, position: float) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=300,
        messages=[{"role": "user", "content":
            f"Write an optimised SEO title tag and meta description for a travel page.\n"
            f"Keyword: {keyword}\nURL: {current_url}\nCurrent position: {position}\n"
            f"Brand: Hassle Free Travels (India group tours)\n"
            f"Format: Title: ...\nMeta: ..."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Pages with position > 10 and impressions > 100 (visible but not clicking)
        rows = supabase.table("seo_reports") \
            .select("keyword, page_url, position, ctr, impressions") \
            .gt("position", 10).gt("impressions", 100) \
            .order("impressions", desc=True).limit(5).execute().data

        optimised = []
        for r in rows:
            try:
                content = optimise_meta(r["keyword"], r["page_url"], float(r["position"] or 15))
                supabase.table("content_queue").insert({
                    "type": "schema_markup", "platform": "website",
                    "content": content,
                    "metadata": {"keyword": r["keyword"], "url": r["page_url"], "current_position": r["position"]},
                    "status": "pending_review",
                }).execute()
                optimised.append(r["keyword"])
            except Exception:
                continue

        output = {"pages_analysed": len(rows), "optimisations_queued": len(optimised), "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
