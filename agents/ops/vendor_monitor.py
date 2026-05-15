"""
Agent #29 — Vendor & Hotel Rate Monitor
Tracks hotel/transport cost changes for active package destinations.
Schedule: Daily 8AM IST
"""
import sys, os, json
import httpx
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 29

# In production: replace with actual vendor API calls or scraping
# This agent logs rate checks and alerts on anomalies stored in output_log
VENDOR_ENDPOINTS = {
    "Spiti Valley": {"hotels": 3200, "transport": 1800},
    "Ladakh": {"hotels": 4500, "transport": 2200},
    "Kashmir": {"hotels": 3800, "transport": 1600},
    "Manali": {"hotels": 2800, "transport": 1400},
}
SPIKE_THRESHOLD_PCT = 15

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        pkgs = supabase.table("packages").select("id, destination, price_min") \
            .in_("status", ["active", "filling_fast"]).execute().data

        alerts = []
        for pkg in pkgs:
            dest = pkg["destination"]
            baseline = VENDOR_ENDPOINTS.get(dest)
            if not baseline:
                continue
            # Simulate: in production fetch real rates from vendor APIs
            total_cost = baseline["hotels"] + baseline["transport"]
            margin = pkg["price_min"] - total_cost
            margin_pct = (margin / pkg["price_min"]) * 100 if pkg["price_min"] else 0

            if margin_pct < 20:  # Alert if margin drops below 20%
                alerts.append({"destination": dest, "margin_pct": round(margin_pct, 1), "price_min": pkg["price_min"], "cost": total_cost})

        if alerts:
            supabase.table("notifications").insert({
                "type": "system", "priority": "high",
                "title": f"Margin Alert: {len(alerts)} packages below 20% margin",
                "message": "\n".join(f"• {a['destination']}: {a['margin_pct']}% margin (₹{a['price_min']} price, ₹{a['cost']} cost)" for a in alerts),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"packages_checked": len(pkgs), "margin_alerts": len(alerts), "alerts": alerts, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
