"""
Agent #1 — SEO Strategist
Analyses keyword rankings, identifies quick-win opportunities, queues content briefs.
Schedule: Daily 8AM IST
"""
import sys, os, json
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 1

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Keywords ranked 4–20 are quick-win opportunities (just off page 1)
        rows = supabase.table("seo_reports") \
            .select("keyword, page_url, position, previous_position, impressions, clicks, ctr, search_volume") \
            .gte("position", 4).lte("position", 20) \
            .order("impressions", desc=True).limit(20).execute().data

        opportunities = []
        for r in rows:
            pos = float(r["position"] or 99)
            prev = float(r["previous_position"] or pos)
            trend = "improving" if pos < prev else "declining" if pos > prev else "stable"
            opportunities.append({**r, "trend": trend, "position": pos})

        # Queue a content brief for top 3 opportunities
        queued = 0
        for opp in opportunities[:3]:
            supabase.table("content_queue").insert({
                "type": "blog_post",
                "platform": "website",
                "content": f"SEO Brief: Optimise page for '{opp['keyword']}'\nCurrent position: {opp['position']}\nTarget: Top 3\nURL: {opp['page_url']}\nSearch volume: {opp.get('search_volume', 'N/A')}",
                "metadata": {"keyword": opp["keyword"], "position": opp["position"], "trend": opp["trend"]},
                "status": "pending_review",
            }).execute()
            queued += 1

        if opportunities:
            supabase.table("notifications").insert({
                "type": "system", "priority": "medium",
                "title": f"SEO: {len(opportunities)} quick-win keywords identified",
                "message": "\n".join(f"• '{o['keyword']}' — pos {o['position']:.0f} ({o['trend']})" for o in opportunities[:5]),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"opportunities": len(opportunities), "briefs_queued": queued, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
