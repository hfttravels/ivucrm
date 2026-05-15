"""
Agent #11 — Schema Markup Engineer
Generates TourPackage + Event JSON-LD schema for active packages.
Schedule: Every 2 days
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 11

def generate_schema(pkg: dict) -> str:
    schema = {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "name": pkg["title"],
        "description": f"Group tour to {pkg['destination']} with Hassle Free Travels",
        "touristType": "Group",
        "itinerary": {"@type": "ItemList", "name": f"{pkg['destination']} Itinerary"},
        "offers": {
            "@type": "Offer",
            "price": pkg["price_min"],
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock" if pkg["status"] != "sold_out" else "https://schema.org/SoldOut",
            "validFrom": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        },
        "provider": {
            "@type": "TravelAgency",
            "name": "Hassle Free Travels",
            "url": "https://hasslefreetravels.in",
        },
        "startDate": pkg["departure_date"][:10] if pkg.get("departure_date") else "",
        "endDate": pkg["return_date"][:10] if pkg.get("return_date") else "",
    }
    return f'<script type="application/ld+json">\n{json.dumps(schema, indent=2)}\n</script>'

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        pkgs = supabase.table("packages").select("*") \
            .in_("status", ["active", "filling_fast"]).execute().data

        queued = []
        for pkg in pkgs:
            schema_markup = generate_schema(pkg)
            supabase.table("content_queue").insert({
                "type": "schema_markup", "platform": "website",
                "content": schema_markup,
                "metadata": {"package_id": pkg["id"], "destination": pkg["destination"], "schema_type": "TouristTrip"},
                "status": "pending_review",
                "package_id": pkg["id"],
            }).execute()
            queued.append(pkg["title"])

        output = {"schemas_generated": len(queued), "packages": queued,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
