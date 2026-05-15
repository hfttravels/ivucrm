"""
Agent #39 — Regulatory & Tax Compliance Agent
Checks GST applicability on packages, flags pricing compliance issues.
Schedule: Weekly Sunday
"""
import sys, os, json
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 39

# India GST on tour packages
GST_RATE_WITH_ITC = 0.05   # 5% GST (no ITC)
GST_RATE_WITHOUT_ITC = 0.18  # 18% GST (with ITC) — rarely used for group tours
MIN_PRICE_FOR_GST = 7500   # Packages above ₹7,500/person attract GST

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        pkgs = supabase.table("packages").select("id, title, price_min, price_max, seats_total") \
            .in_("status", ["active", "filling_fast"]).execute().data

        issues = []
        for pkg in pkgs:
            price = pkg["price_min"]
            gst_applicable = price >= MIN_PRICE_FOR_GST
            gst_amount = round(price * GST_RATE_WITH_ITC) if gst_applicable else 0
            price_incl_gst = price + gst_amount

            # Flag if displayed price doesn't account for GST (heuristic: check if price is round number)
            if gst_applicable and price % 100 == 0:
                issues.append({
                    "package": pkg["title"],
                    "price_excl_gst": price,
                    "gst": gst_amount,
                    "price_incl_gst": price_incl_gst,
                    "note": "Price appears to exclude GST — verify display price includes 5% GST",
                })

        if issues:
            supabase.table("notifications").insert({
                "type": "system", "priority": "medium",
                "title": f"Compliance: {len(issues)} package(s) may need GST review",
                "message": "\n".join(f"• {i['package']}: ₹{i['price_excl_gst']} + ₹{i['gst']} GST = ₹{i['price_incl_gst']}" for i in issues),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"packages_checked": len(pkgs), "issues_found": len(issues), "issues": issues, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
