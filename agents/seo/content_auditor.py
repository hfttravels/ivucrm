"""
Agent #10 — AI Content Auditor
Audits recently published content for quality, brand voice, and SEO alignment.
Schedule: Daily 8AM IST
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 10

BRAND_VOICE = "adventurous, warm, trustworthy, India-focused group travel expert"

def audit_content(content: str, content_type: str) -> dict:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=300,
        messages=[{"role": "user", "content":
            f"Audit this {content_type} for Hassle Free Travels.\n"
            f"Brand voice: {BRAND_VOICE}\n\nContent:\n{content[:800]}\n\n"
            f"Score 1-10 and flag issues. Return JSON:\n"
            f"{{\"score\": 8, \"issues\": [\"...\"], \"suggestion\": \"...\"}}"}],
    )
    return json.loads(msg.content[0].text)

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        items = supabase.table("content_queue") \
            .select("id, type, content, platform") \
            .eq("status", "approved") \
            .gte("updated_at", cutoff).limit(10).execute().data

        low_quality = []
        for item in items:
            try:
                result = audit_content(item["content"], item["type"])
                score = result.get("score", 10)
                if score < 6:
                    low_quality.append({
                        "id": item["id"], "type": item["type"],
                        "score": score, "issues": result.get("issues", []),
                        "suggestion": result.get("suggestion", ""),
                    })
            except Exception:
                continue

        if low_quality:
            supabase.table("notifications").insert({
                "type": "approval_required", "priority": "medium",
                "title": f"Content Audit: {len(low_quality)} item(s) scored below 6/10",
                "message": "\n".join(f"• {i['type']} (score {i['score']}): {', '.join(i['issues'][:2])}" for i in low_quality),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"items_audited": len(items), "low_quality": len(low_quality), "flagged": low_quality,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
