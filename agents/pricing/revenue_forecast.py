"""
Agent #26 — Revenue Forecasting
Predicts monthly revenue from current bookings + fill rate trends.
Schedule: Daily at 8 AM
"""
import sys, os, json
from datetime import datetime, timezone, timedelta
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 26
FORECAST_MONTHS = 3


def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()

    try:
        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(days=FORECAST_MONTHS * 30)

        packages = supabase.table("packages") \
            .select("id, title, destination, price_min, price_max, seats_total, seats_filled, departure_date, status") \
            .in_("status", ["active", "filling_fast", "sold_out"]) \
            .lte("departure_date", cutoff.isoformat()) \
            .execute().data

        monthly: dict = defaultdict(lambda: {"confirmed": 0, "projected": 0, "packages": []})

        for pkg in packages:
            dep = datetime.fromisoformat(pkg["departure_date"].replace("Z", "+00:00"))
            month_key = dep.strftime("%Y-%m")
            avg_price = (pkg["price_min"] + pkg["price_max"]) // 2
            seats_total = pkg["seats_total"] or 1
            fill_rate = pkg["seats_filled"] / seats_total

            confirmed_rev = pkg["seats_filled"] * avg_price

            # Project remaining seats using current fill velocity
            days_to_dep = max(1, (dep - now).days)
            daily_fill_rate = fill_rate / max(1, (seats_total - (seats_total - pkg["seats_filled"])))
            projected_additional = min(
                pkg["seats_total"] - pkg["seats_filled"],
                int((pkg["seats_total"] - pkg["seats_filled"]) * min(fill_rate * 1.2, 1.0))
            )
            projected_rev = confirmed_rev + (projected_additional * avg_price)

            monthly[month_key]["confirmed"] += confirmed_rev
            monthly[month_key]["projected"] += projected_rev
            monthly[month_key]["packages"].append({
                "title": pkg["title"],
                "fill_rate": round(fill_rate * 100, 1),
                "confirmed_rev": confirmed_rev,
                "projected_rev": projected_rev,
            })

        total_confirmed = sum(m["confirmed"] for m in monthly.values())
        total_projected = sum(m["projected"] for m in monthly.values())

        # Alert if any month looks weak (< ₹5L projected)
        LOW_THRESHOLD = 500_000
        weak_months = [k for k, v in monthly.items() if v["projected"] < LOW_THRESHOLD]

        priority = "high" if weak_months else "medium"
        alert_suffix = f"\n⚠️ Weak months: {', '.join(weak_months)}" if weak_months else ""

        monthly_summary = {k: {
            "confirmed": v["confirmed"],
            "projected": v["projected"],
            "package_count": len(v["packages"]),
        } for k, v in sorted(monthly.items())}

        supabase.table("notifications").insert({
            "type": "system",
            "priority": priority,
            "title": f"Revenue Forecast: ₹{total_projected:,.0f} projected ({FORECAST_MONTHS}mo)",
            "message": (
                f"Confirmed: ₹{total_confirmed:,.0f}\n"
                f"Projected: ₹{total_projected:,.0f}\n\n"
                + "\n".join(f"{k}: ₹{v['projected']:,.0f}" for k, v in monthly_summary.items())
                + alert_suffix
            ),
            "is_read": False,
            "is_actioned": False,
        }).execute()

        output = {
            "forecast_months": FORECAST_MONTHS,
            "packages_analyzed": len(packages),
            "total_confirmed_revenue": total_confirmed,
            "total_projected_revenue": total_projected,
            "monthly_breakdown": monthly_summary,
            "weak_months": weak_months,
            "timestamp": now.isoformat(),
        }
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output

    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0)
        raise


if __name__ == "__main__":
    print(f"[Agent #{AGENT_NUMBER}] Revenue Forecasting — Starting...")
    result = run()
    print(json.dumps(result, indent=2))
