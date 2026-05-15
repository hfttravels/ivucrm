"""
Agent #37 — Travel Trend Forecaster
Analyses seasonal demand signals, recommends new destinations/packages.
Schedule: Weekly Sunday
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 37

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Get current package destinations and fill rates for context
        pkgs = supabase.table("packages").select("destination, seats_filled, seats_total, departure_date") \
            .in_("status", ["active", "filling_fast", "sold_out"]).execute().data

        pkg_summary = "\n".join(
            f"- {p['destination']}: {p['seats_filled']}/{p['seats_total']} seats, departs {p['departure_date'][:10]}"
            for p in pkgs
        ) or "No active packages."

        month = datetime.now().strftime("%B")
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        msg = client.messages.create(
            model="claude-3-haiku-20240307", max_tokens=600,
            messages=[{"role": "user", "content":
                f"You are a travel market analyst for India group tours.\n"
                f"Current month: {month}\nCurrent packages:\n{pkg_summary}\n\n"
                f"Provide:\n1. Top 3 trending destinations for next 3 months (with reasoning)\n"
                f"2. One underserved niche opportunity\n3. Pricing recommendation (raise/hold/discount)\n"
                f"Return JSON: {{\"trending\": [...], \"niche\": \"...\", \"pricing_rec\": \"...\"}}"}],
        )
        insights = json.loads(msg.content[0].text)

        supabase.table("notifications").insert({
            "type": "system", "priority": "medium",
            "title": f"Trend Forecast: {month} insights ready",
            "message": f"Trending: {', '.join(insights.get('trending', []))}\nNiche: {insights.get('niche', '')}\nPricing: {insights.get('pricing_rec', '')}",
            "is_read": False, "is_actioned": False,
        }).execute()

        output = {**insights, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
