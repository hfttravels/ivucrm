"""
Agent #38 — Customer Persona Agent
Analyses lead data to identify persona clusters and update targeting recommendations.
Schedule: Every 2 days
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone
from collections import Counter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 38

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        leads = supabase.table("leads") \
            .select("source, destination_interest, budget, group_size, travel_month, status, score") \
            .execute().data

        if not leads:
            output = {"leads_analysed": 0, "timestamp": datetime.now(timezone.utc).isoformat()}
            log_agent_complete(AGENT_NUMBER, start_time, output)
            return output

        # Aggregate stats
        booked = [l for l in leads if l["status"] == "booked"]
        sources = Counter(l["source"] for l in booked)
        destinations = Counter(l["destination_interest"] for l in booked if l.get("destination_interest"))
        budgets = [l["budget"] for l in booked if l.get("budget")]
        group_sizes = [l["group_size"] for l in booked if l.get("group_size")]
        months = Counter(l["travel_month"] for l in booked if l.get("travel_month"))

        avg_budget = round(sum(budgets) / len(budgets)) if budgets else 0
        avg_group = round(sum(group_sizes) / len(group_sizes), 1) if group_sizes else 0

        summary = {
            "total_leads": len(leads), "booked_leads": len(booked),
            "top_sources": dict(sources.most_common(3)),
            "top_destinations": dict(destinations.most_common(3)),
            "avg_budget": avg_budget, "avg_group_size": avg_group,
            "peak_months": dict(months.most_common(3)),
        }

        # Generate persona insight via Claude
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        msg = client.messages.create(
            model="claude-3-haiku-20240307", max_tokens=400,
            messages=[{"role": "user", "content":
                f"Based on this travel CRM data, describe the ideal customer persona:\n{json.dumps(summary)}\n\n"
                f"Brand: Hassle Free Travels (India group tours)\n"
                f"Output: persona name, demographics, motivations, best ad targeting parameters. Be specific."}],
        )
        persona = msg.content[0].text

        supabase.table("notifications").insert({
            "type": "system", "priority": "low",
            "title": "Customer Persona Report updated",
            "message": persona[:500],
            "is_read": False, "is_actioned": False,
        }).execute()

        output = {**summary, "persona_insight": persona, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
