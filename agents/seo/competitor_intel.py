"""
Agent #9 — Competitor Intel
Tracks Wanderon / Thrillophilia Google rankings vs Hassle Free Travels.
Stores results in competitor_ads table, alerts on ranking changes.
Schedule: Daily at 6 AM
"""
import sys, os, json
import httpx
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 9

SERP_API_KEY = os.getenv("SERP_API_KEY", "")  # Add SERP_API_KEY to .env
SERP_URL = "https://serpapi.com/search"

OUR_DOMAIN = "hasslefreetravels.in"
COMPETITORS = ["wanderon.in", "thrillophilia.com", "indiahikes.com"]

TARGET_KEYWORDS = [
    "spiti valley group tour",
    "ladakh group tour package",
    "kedarkantha trek group",
    "manali group tour",
    "chopta chandrashila trek",
    "valley of flowers trek group",
    "Kashmir group tour package",
    "Rajasthan group tour",
]


def fetch_serp(keyword: str) -> list[dict]:
    """Fetch top 20 organic results for a keyword via SerpAPI."""
    try:
        resp = httpx.get(SERP_URL, params={
            "q": keyword,
            "api_key": SERP_API_KEY,
            "num": 20,
            "gl": "in",
            "hl": "en",
        }, timeout=15)
        resp.raise_for_status()
        return resp.json().get("organic_results", [])
    except Exception:
        return []


def find_position(results: list[dict], domain: str) -> int | None:
    for r in results:
        if domain in r.get("link", ""):
            return r.get("position")
    return None


def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()

    try:
        intel = []
        alerts = []

        for keyword in TARGET_KEYWORDS:
            results = fetch_serp(keyword)
            if not results:
                continue

            our_pos = find_position(results, OUR_DOMAIN)

            for competitor in COMPETITORS:
                comp_pos = find_position(results, competitor)
                if comp_pos is None:
                    continue

                # Check previous position from DB
                prev = supabase.table("competitor_ads") \
                    .select("raw_data") \
                    .eq("brand", competitor) \
                    .eq("destination_tagged", keyword) \
                    .order("created_at", desc=True) \
                    .limit(1) \
                    .execute().data

                prev_pos = prev[0]["raw_data"].get("position") if prev else None

                # Store in competitor_ads
                now_iso = datetime.now(timezone.utc).isoformat()
                supabase.table("competitor_ads").insert({
                    "brand": competitor,
                    "platform": "website",
                    "destination_tagged": keyword,
                    "headline": results[comp_pos - 1].get("title", "") if comp_pos <= len(results) else "",
                    "first_seen": now_iso,
                    "last_seen": now_iso,
                    "duration_days": 0,
                    "is_active": True,
                    "raw_data": {
                        "keyword": keyword,
                        "position": comp_pos,
                        "previous_position": prev_pos,
                        "our_position": our_pos,
                        "url": results[comp_pos - 1].get("link", "") if comp_pos <= len(results) else "",
                    },
                }).execute()

                entry = {
                    "keyword": keyword,
                    "competitor": competitor,
                    "their_position": comp_pos,
                    "our_position": our_pos,
                    "prev_position": prev_pos,
                }
                intel.append(entry)

                # Alert if competitor outranks us or improved significantly
                if our_pos and comp_pos < our_pos:
                    alerts.append(entry)
                elif prev_pos and comp_pos < prev_pos - 2:  # Competitor jumped 3+ spots
                    alerts.append(entry)

        # Create alert notification if competitors are outranking us
        if alerts:
            alert_lines = [
                f"• \"{a['keyword']}\": {a['competitor']} #{a['their_position']} vs us #{a['our_position'] or 'N/A'}"
                for a in alerts[:5]
            ]
            supabase.table("notifications").insert({
                "type": "competitor_alert",
                "priority": "high" if len(alerts) >= 3 else "medium",
                "title": f"Competitor Intel: {len(alerts)} keywords where rivals outrank us",
                "message": "\n".join(alert_lines),
                "is_read": False,
                "is_actioned": False,
            }).execute()

        output = {
            "keywords_checked": len(TARGET_KEYWORDS),
            "competitor_entries_logged": len(intel),
            "alerts_triggered": len(alerts),
            "alerts": alerts,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output

    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0)
        raise


if __name__ == "__main__":
    print(f"[Agent #{AGENT_NUMBER}] Competitor Intel — Starting...")
    result = run()
    print(json.dumps(result, indent=2))
