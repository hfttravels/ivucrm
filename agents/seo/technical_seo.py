"""
Agent #4 — Technical SEO Agent
Audits seo_reports for technical issues: missing meta, low CTR pages, position drops.
Schedule: Every 12 hours
"""
import sys, os, json
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 4

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        rows = supabase.table("seo_reports") \
            .select("keyword, page_url, position, previous_position, ctr, impressions, clicks") \
            .execute().data

        issues = []
        for r in rows:
            pos = float(r["position"] or 0)
            prev = float(r["previous_position"] or pos)
            ctr = float(r["ctr"] or 0)
            impressions = r["impressions"] or 0

            # Position drop > 5 spots
            if prev and pos - prev > 5:
                issues.append({"type": "position_drop", "keyword": r["keyword"], "url": r["page_url"],
                                "detail": f"Dropped {pos - prev:.0f} spots (was {prev:.0f}, now {pos:.0f})"})
            # High impressions, very low CTR (< 1%) — title/meta issue
            if impressions > 500 and ctr < 0.01:
                issues.append({"type": "low_ctr", "keyword": r["keyword"], "url": r["page_url"],
                                "detail": f"{impressions} impressions, {ctr*100:.2f}% CTR — fix title/meta"})

        if issues:
            priority = "high" if len(issues) >= 5 else "medium"
            supabase.table("notifications").insert({
                "type": "system", "priority": priority,
                "title": f"Technical SEO: {len(issues)} issue(s) detected",
                "message": "\n".join(f"• [{i['type']}] {i['keyword']}: {i['detail']}" for i in issues[:6]),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"pages_audited": len(rows), "issues": len(issues), "details": issues[:10],
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
