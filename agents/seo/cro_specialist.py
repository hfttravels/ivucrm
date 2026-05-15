"""
Agent #12 — CRO Specialist
Analyses lead funnel drop-offs, queues conversion optimisation suggestions.
Schedule: Daily 8AM IST
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 12

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        leads = supabase.table("leads").select("status, source, score, created_at").execute().data

        # Funnel analysis
        total = len(leads)
        by_status = {}
        for l in leads:
            by_status[l["status"]] = by_status.get(l["status"], 0) + 1

        funnel = {
            "new": by_status.get("new", 0),
            "contacted": by_status.get("contacted", 0),
            "qualified": by_status.get("qualified", 0),
            "proposal_sent": by_status.get("proposal_sent", 0),
            "booked": by_status.get("booked", 0),
            "lost": by_status.get("lost", 0),
        }

        # Identify biggest drop-off
        stages = ["new", "contacted", "qualified", "proposal_sent", "booked"]
        worst_drop = {"stage": "", "drop_pct": 0}
        for i in range(len(stages) - 1):
            a, b = funnel.get(stages[i], 0), funnel.get(stages[i+1], 0)
            if a > 0:
                drop = ((a - b) / a) * 100
                if drop > worst_drop["drop_pct"]:
                    worst_drop = {"stage": f"{stages[i]} → {stages[i+1]}", "drop_pct": round(drop, 1)}

        # Source conversion rates
        source_conv = {}
        for l in leads:
            src = l["source"]
            if src not in source_conv:
                source_conv[src] = {"total": 0, "booked": 0}
            source_conv[src]["total"] += 1
            if l["status"] == "booked":
                source_conv[src]["booked"] += 1

        best_source = max(source_conv, key=lambda s: source_conv[s]["booked"] / max(source_conv[s]["total"], 1))

        # Generate CRO suggestion via Claude
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        msg = client.messages.create(
            model="claude-3-haiku-20240307", max_tokens=250,
            messages=[{"role": "user", "content":
                f"Travel CRM funnel data:\n{json.dumps(funnel)}\n"
                f"Biggest drop-off: {worst_drop['stage']} ({worst_drop['drop_pct']}%)\n"
                f"Best converting source: {best_source}\n\n"
                f"Give 2 specific, actionable CRO recommendations to improve conversion. Be concise."}],
        )
        suggestion = msg.content[0].text

        supabase.table("notifications").insert({
            "type": "system", "priority": "medium",
            "title": f"CRO: Biggest drop-off at {worst_drop['stage']} ({worst_drop['drop_pct']}%)",
            "message": suggestion,
            "is_read": False, "is_actioned": False,
        }).execute()

        output = {"total_leads": total, "funnel": funnel, "worst_drop": worst_drop,
                  "best_source": best_source, "suggestion": suggestion,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
