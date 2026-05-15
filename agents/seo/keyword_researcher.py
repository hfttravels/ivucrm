"""
Agent #2 — Keyword Researcher
Discovers new keyword opportunities for target destinations via SerpAPI.
Schedule: Every 6 hours
"""
import sys, os, json
import httpx
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 2
SERP_API_KEY = os.getenv("SERP_API_KEY", "")

SEED_KEYWORDS = [
    "spiti valley tour", "ladakh group tour", "kedarkantha trek",
    "manali group package", "Kashmir tour package", "Rajasthan group tour",
    "chopta trek", "valley of flowers trek",
]

def fetch_related(keyword: str) -> list[str]:
    try:
        resp = httpx.get("https://serpapi.com/search", params={
            "q": keyword, "api_key": SERP_API_KEY, "gl": "in", "hl": "en",
        }, timeout=15)
        data = resp.json()
        related = [r.get("query", "") for r in data.get("related_searches", [])]
        suggestions = [s.get("value", "") for s in data.get("search_suggestions", [])]
        return [k for k in related + suggestions if k][:8]
    except Exception:
        return []

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        discovered = []
        for seed in SEED_KEYWORDS[:4]:  # Cap API calls per run
            related = fetch_related(seed)
            for kw in related:
                # Only insert if not already tracked
                existing = supabase.table("seo_reports").select("id").eq("keyword", kw).limit(1).execute().data
                if not existing:
                    supabase.table("seo_reports").insert({
                        "keyword": kw, "page_url": "/", "is_target_keyword": False,
                    }).execute()
                    discovered.append(kw)

        output = {"seeds_checked": 4, "new_keywords": len(discovered), "keywords": discovered, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
