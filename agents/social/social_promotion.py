"""
Agent #14 — Social Media Promotion Agent
Generates Instagram captions and reel scripts for active packages.
Schedule: on_trigger
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 14

def generate_caption(pkg: dict) -> tuple[str, str]:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    fill_rate = int((pkg["seats_filled"] / max(pkg["seats_total"], 1)) * 100)
    urgency = f"Only {pkg['seats_total'] - pkg['seats_filled']} seats left!" if fill_rate >= 60 else ""

    caption_msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=300,
        messages=[{"role": "user", "content":
            f"Write an Instagram caption for a group tour.\n"
            f"Destination: {pkg['destination']}\nPackage: {pkg['title']}\n"
            f"Price: ₹{pkg['price_min']:,}/person\nDeparture: {pkg['departure_date'][:10]}\n"
            f"Urgency: {urgency}\nBrand: Hassle Free Travels\n"
            f"Style: exciting, FOMO, 3-4 sentences + 5 relevant hashtags. End with WhatsApp CTA."}],
    )

    reel_msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=400,
        messages=[{"role": "user", "content":
            f"Write a 30-second Instagram Reel script for {pkg['destination']} group tour.\n"
            f"Brand: Hassle Free Travels. Format: [0-5s hook], [5-20s highlights], [20-30s CTA].\n"
            f"Energetic, visual, trending audio suggestion included."}],
    )
    return caption_msg.content[0].text, reel_msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        pkgs = supabase.table("packages").select("*") \
            .in_("status", ["active", "filling_fast"]).limit(2).execute().data

        created = []
        for pkg in pkgs:
            caption, reel_script = generate_caption(pkg)
            for content_type, content, ctype in [
                ("instagram_caption", caption, "instagram_caption"),
                ("instagram_reel_script", reel_script, "instagram_reel_script"),
            ]:
                supabase.table("content_queue").insert({
                    "type": ctype, "platform": "instagram",
                    "content": content,
                    "metadata": {"package_id": pkg["id"], "destination": pkg["destination"]},
                    "status": "pending_review",
                    "package_id": pkg["id"],
                }).execute()
            created.append(pkg["destination"])

        output = {"packages_promoted": len(created), "destinations": created,
                  "content_items": len(created) * 2, "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
