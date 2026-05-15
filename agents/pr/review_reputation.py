"""
Agent #35 — Review & Reputation Agent
Monitors new reviews, drafts responses, alerts on negative reviews.
Schedule: Daily 8AM IST
"""
import sys, os, json
import anthropic
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 35

def draft_response(review_text: str, rating: int) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    tone = "apologetic and solution-focused" if rating <= 3 else "warm and grateful"
    msg = client.messages.create(
        model="claude-3-haiku-20240307", max_tokens=200,
        messages=[{"role": "user", "content":
            f"Write a {tone} response to this travel review (rating: {rating}/5).\n"
            f"Review: \"{review_text}\"\nBrand: Hassle Free Travels\n"
            f"Keep it under 80 words. Personal, not corporate."}],
    )
    return msg.content[0].text

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        # In production: fetch from Google Business API / TripAdvisor API
        # For now: check output_log of previous run for any pending reviews
        agent_row = supabase.table("agents").select("output_log") \
            .eq("agent_number", AGENT_NUMBER).single().execute().data
        pending_reviews = (agent_row.get("output_log") or {}).get("pending_reviews", [])

        responses_drafted = []
        negative_count = 0

        for review in pending_reviews:
            rating = review.get("rating", 5)
            text = review.get("text", "")
            if not text:
                continue
            response = draft_response(text, rating)
            supabase.table("content_queue").insert({
                "type": "pr_pitch", "platform": "website",
                "content": f"Review Response (Rating: {rating}/5)\n\nOriginal: {text}\n\nDraft Response:\n{response}",
                "metadata": {"rating": rating, "platform": review.get("platform", "google")},
                "status": "pending_review",
            }).execute()
            responses_drafted.append(rating)
            if rating <= 3:
                negative_count += 1

        if negative_count:
            supabase.table("notifications").insert({
                "type": "system", "priority": "high",
                "title": f"{negative_count} negative review(s) need response",
                "message": "Check Approval Queue for drafted responses.",
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {
            "reviews_processed": len(pending_reviews),
            "responses_drafted": len(responses_drafted),
            "negative_reviews": negative_count,
            "pending_reviews": [],  # Clear after processing
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
