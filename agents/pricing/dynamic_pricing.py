"""
Agent #25 — Dynamic Pricing
Adjusts package prices based on fill rate + competitor pricing signals.
Schedule: Every 6 hours
"""
import sys, os, json
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 25

# Pricing rules
FILL_RATE_THRESHOLDS = {
    "surge":    {"min_fill": 80, "price_change_pct": +10},  # High demand → raise price
    "discount": {"max_fill": 30, "price_change_pct": -8},   # Low demand → lower price
}
MAX_PRICE_CHANGE_PCT = 15  # Never move price more than 15% in one run


def get_competitor_avg_price(destination: str) -> int | None:
    """Get average competitor price for a destination from competitor_ads table."""
    supabase = get_supabase()
    resp = supabase.table("competitor_ads") \
        .select("raw_data") \
        .eq("destination_tagged", destination) \
        .eq("is_active", True) \
        .execute()
    prices = [
        r["raw_data"].get("price")
        for r in resp.data
        if r.get("raw_data") and r["raw_data"].get("price")
    ]
    return int(sum(prices) / len(prices)) if prices else None


def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()

    try:
        packages = supabase.table("packages") \
            .select("id, title, destination, price_min, price_max, seats_total, seats_filled, status") \
            .in_("status", ["active", "filling_fast"]) \
            .execute().data

        adjustments = []

        for pkg in packages:
            seats_total = pkg["seats_total"] or 1
            fill_rate = (pkg["seats_filled"] / seats_total) * 100
            current_min = pkg["price_min"]
            current_max = pkg["price_max"]

            change_pct = 0
            reason = ""

            if fill_rate >= FILL_RATE_THRESHOLDS["surge"]["min_fill"]:
                change_pct = FILL_RATE_THRESHOLDS["surge"]["price_change_pct"]
                reason = f"High fill rate ({fill_rate:.0f}%) — surge pricing"
            elif fill_rate <= FILL_RATE_THRESHOLDS["discount"]["max_fill"]:
                change_pct = FILL_RATE_THRESHOLDS["discount"]["price_change_pct"]
                reason = f"Low fill rate ({fill_rate:.0f}%) — discount to drive bookings"

            # Competitor price check: don't go above competitor avg
            comp_avg = get_competitor_avg_price(pkg["destination"])
            if comp_avg and change_pct > 0:
                projected_min = int(current_min * (1 + change_pct / 100))
                if projected_min > comp_avg * 1.05:  # Allow 5% premium max
                    change_pct = max(0, ((comp_avg * 1.05) / current_min - 1) * 100)
                    reason += f" (capped vs competitor avg ₹{comp_avg:,})"

            if change_pct == 0:
                continue

            # Clamp to max allowed change
            change_pct = max(-MAX_PRICE_CHANGE_PCT, min(MAX_PRICE_CHANGE_PCT, change_pct))

            new_min = int(current_min * (1 + change_pct / 100))
            new_max = int(current_max * (1 + change_pct / 100))

            supabase.table("packages").update({
                "price_min": new_min,
                "price_max": new_max,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", pkg["id"]).execute()

            direction = "↑" if change_pct > 0 else "↓"
            supabase.table("notifications").insert({
                "type": "price_change",
                "priority": "medium",
                "title": f"Price {direction} {abs(change_pct):.0f}%: {pkg['destination']}",
                "message": (
                    f"{pkg['title']}\n"
                    f"Old: ₹{current_min:,}–₹{current_max:,} → New: ₹{new_min:,}–₹{new_max:,}\n"
                    f"Reason: {reason}"
                ),
                "related_entity_id": pkg["id"],
                "related_entity_type": "package",
                "is_read": False,
                "is_actioned": False,
            }).execute()

            adjustments.append({
                "package_id": pkg["id"],
                "destination": pkg["destination"],
                "fill_rate": round(fill_rate, 1),
                "change_pct": round(change_pct, 1),
                "old_price_min": current_min,
                "new_price_min": new_min,
                "reason": reason,
            })

        output = {
            "packages_analyzed": len(packages),
            "prices_adjusted": len(adjustments),
            "adjustments": adjustments,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output

    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0)
        raise


if __name__ == "__main__":
    print(f"[Agent #{AGENT_NUMBER}] Dynamic Pricing — Starting...")
    result = run()
    print(json.dumps(result, indent=2))
