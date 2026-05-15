"""
Agent #5 — AEO Specialist (Answer Engine Optimisation)
Generates FAQ schema + direct-answer content for featured snippet capture.
Schedule: Daily 8AM IST
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 5

def generate_faq(keyword: str, page_url: str) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=600,
        messages=[{"role": "user", "content":
            f"Generate FAQ schema markup (JSON-LD) for a travel page.\n"
            f"Target keyword: {keyword}\nPage: {page_url}\nBrand: Hassle Free Travels\n"
            f"Create 4 Q&A pairs that directly answer what travellers search for.\n"
            f"Return only the JSON-LD script tag content."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Target keywords on page 1 (pos 1–10) with high impressions — defend with AEO
        rows = supabase.table("seo_reports") \
            .select("keyword, page_url, position, impressions") \
            .lte("position", 10).gt("impressions", 200) \
            .eq("is_target_keyword", True).limit(3).execute().data

        queued = []
        for r in rows:
            faq_schema = generate_faq(r["keyword"], r["page_url"])
            supabase.table("content_queue").insert({
                "type": "schema_markup", "platform": "website",
                "content": faq_schema,
                "metadata": {"keyword": r["keyword"], "url": r["page_url"], "type": "faq_schema"},
                "status": "pending_review",
            }).execute()
            queued.append(r["keyword"])

        output = {"schemas_queued": len(queued), "keywords": queued,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
