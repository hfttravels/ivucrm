"""
Agent #15 — Social Copywriter Agent
Adapts approved content into platform-specific copy (Stories, WhatsApp, LinkedIn).
Schedule: on_trigger
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 15

PLATFORM_INSTRUCTIONS = {
    "instagram_story": "Short, punchy, 1-2 lines. Use emojis. Add poll/question sticker suggestion.",
    "whatsapp_message": "Conversational, personal. No hashtags. End with a question. Max 3 sentences.",
    "linkedin_post": "Professional but warm. Data point or insight first. 100-150 words.",
}

def adapt_copy(original: str, platform: str, instructions: str) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=300,
        messages=[{"role": "user", "content":
            f"Adapt this travel content for {platform}.\nInstructions: {instructions}\n\n"
            f"Original:\n{original[:600]}\n\nBrand: Hassle Free Travels. Keep the core message."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # Take recently approved Instagram captions and adapt them
        items = supabase.table("content_queue") \
            .select("id, content, metadata, package_id") \
            .eq("type", "instagram_caption").eq("status", "approved") \
            .limit(3).execute().data

        adapted = []
        for item in items:
            for platform, instructions in PLATFORM_INSTRUCTIONS.items():
                copy = adapt_copy(item["content"], platform, instructions)
                supabase.table("content_queue").insert({
                    "type": platform if platform in ["instagram_story", "whatsapp_message"] else "linkedin_post",
                    "platform": "instagram" if "instagram" in platform else ("whatsapp" if "whatsapp" in platform else "linkedin"),
                    "content": copy,
                    "metadata": {**((item.get("metadata") or {})), "adapted_from": item["id"], "platform": platform},
                    "status": "pending_review",
                    "package_id": item.get("package_id"),
                }).execute()
            adapted.append(item["id"])

        output = {"source_items": len(items), "adaptations_created": len(adapted) * 3,
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
