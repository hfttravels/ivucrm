"""
Agent #28 — Itinerary Builder Agent
Generates structured itinerary JSON for packages missing one.
Schedule: on_trigger
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 28

def build_itinerary(pkg: dict) -> dict:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    dep = pkg.get("departure_date", "")[:10]
    ret = pkg.get("return_date", "")[:10]
    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022", max_tokens=1500,
        messages=[{"role": "user", "content":
            f"Create a detailed day-by-day itinerary for this group tour.\n"
            f"Destination: {pkg['destination']}\nTitle: {pkg['title']}\n"
            f"Departure: {dep}, Return: {ret}\nPrice: ₹{pkg['price_min']}–₹{pkg['price_max']}\n\n"
            f"Return ONLY valid JSON: {{\"days\": [{{\"day\": 1, \"title\": \"...\", \"description\": \"...\", \"highlights\": [\"...\"]}}]}}\n"
            f"Include meals, accommodation type, and key activities per day."}],
    )
    return json.loads(msg.content[0].text)

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Packages with no itinerary
        pkgs = supabase.table("packages").select("*") \
            .in_("status", ["active", "draft"]).is_("itinerary_json", "null").limit(3).execute().data

        built = []
        for pkg in pkgs:
            try:
                itinerary = build_itinerary(pkg)
                supabase.table("packages").update({
                    "itinerary_json": itinerary,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", pkg["id"]).execute()
                built.append(pkg["title"])
            except Exception:
                continue

        output = {"packages_checked": len(pkgs), "itineraries_built": len(built), "packages": built, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
