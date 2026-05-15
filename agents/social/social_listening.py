"""
Agent #17 — Social Listening Agent
Monitors Instagram hashtags and mentions for brand sentiment.
Schedule: Every hour
"""
import sys, os, json
import httpx
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 17

IG_ACCOUNT_ID = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")
META_TOKEN = os.getenv("META_ACCESS_TOKEN")
GRAPH_URL = "https://graph.facebook.com/v19.0"

TRACKED_HASHTAGS = ["hasslefreetravels", "spitivalleytour", "ladakhgrouptrip", "kedarkanthatrek"]
BRAND_KEYWORDS = ["hassle free travels", "hasslefreetravels", "@hasslefreetravels"]

def fetch_hashtag_media(hashtag: str) -> list[dict]:
    try:
        # Get hashtag ID
        id_resp = httpx.get(f"{GRAPH_URL}/ig_hashtag_search", params={
            "user_id": IG_ACCOUNT_ID, "q": hashtag, "access_token": META_TOKEN,
        }, timeout=10)
        hashtag_id = id_resp.json().get("data", [{}])[0].get("id")
        if not hashtag_id:
            return []
        # Get recent media
        media_resp = httpx.get(f"{GRAPH_URL}/{hashtag_id}/recent_media", params={
            "user_id": IG_ACCOUNT_ID,
            "fields": "id,caption,like_count,comments_count,timestamp",
            "access_token": META_TOKEN,
        }, timeout=10)
        return media_resp.json().get("data", [])
    except Exception:
        return []

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        all_mentions = []
        for tag in TRACKED_HASHTAGS[:2]:  # Cap API calls
            media = fetch_hashtag_media(tag)
            for m in media[:5]:
                caption = (m.get("caption") or "").lower()
                is_brand_mention = any(kw in caption for kw in BRAND_KEYWORDS)
                all_mentions.append({
                    "hashtag": tag, "media_id": m.get("id"),
                    "likes": m.get("like_count", 0), "comments": m.get("comments_count", 0),
                    "is_brand_mention": is_brand_mention,
                    "timestamp": m.get("timestamp"),
                })

        brand_mentions = [m for m in all_mentions if m["is_brand_mention"]]
        high_engagement = [m for m in all_mentions if (m["likes"] or 0) > 100]

        if brand_mentions:
            supabase.table("notifications").insert({
                "type": "system", "priority": "medium",
                "title": f"Social: {len(brand_mentions)} brand mention(s) detected",
                "message": "\n".join(f"• #{m['hashtag']} — {m['likes']} likes" for m in brand_mentions[:5]),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"hashtags_checked": len(TRACKED_HASHTAGS[:2]), "mentions_found": len(all_mentions),
                  "brand_mentions": len(brand_mentions), "high_engagement": len(high_engagement),
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
