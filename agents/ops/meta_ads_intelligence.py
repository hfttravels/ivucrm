"""
Agent #24 — Meta Ads Intelligence Agent
Pulls Meta ad performance metrics, stores snapshots, alerts on anomalies.
Schedule: Every hour
"""
import sys, os, json
import httpx
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 24

META_TOKEN = os.getenv("META_ACCESS_TOKEN")
AD_ACCOUNT_ID = os.getenv("META_AD_ACCOUNT_ID")
GRAPH_URL = "https://graph.facebook.com/v19.0"

# Alert thresholds
CPL_ALERT_THRESHOLD = 800   # Alert if CPL > ₹800
CTR_ALERT_THRESHOLD = 0.01  # Alert if CTR < 1%
ROAS_ALERT_THRESHOLD = 2.0  # Alert if ROAS < 2x

def fetch_ad_insights() -> list[dict]:
    try:
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        resp = httpx.get(
            f"{GRAPH_URL}/{AD_ACCOUNT_ID}/insights",
            params={
                "fields": "ad_id,ad_name,campaign_name,impressions,reach,clicks,ctr,cpc,spend,actions",
                "date_preset": "yesterday",
                "level": "ad",
                "access_token": META_TOKEN,
                "limit": 20,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json().get("data", [])
    except Exception:
        return []

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        ads = fetch_ad_insights()
        alerts = []
        stored = 0

        for ad in ads:
            spend = float(ad.get("spend", 0))
            clicks = int(ad.get("clicks", 0))
            impressions = int(ad.get("impressions", 0))
            ctr = float(ad.get("ctr", 0))
            cpc = float(ad.get("cpc", 0))

            # Extract leads from actions
            actions = ad.get("actions", [])
            leads = next((int(a["value"]) for a in actions if a["action_type"] == "lead"), 0)
            cpl = round(spend / leads, 2) if leads > 0 else 0

            supabase.table("meta_ad_performance").insert({
                "ad_id": ad.get("ad_id", "unknown"),
                "campaign_name": ad.get("campaign_name"),
                "ad_name": ad.get("ad_name"),
                "impressions": impressions,
                "clicks": clicks,
                "ctr": round(ctr, 4),
                "cpc": round(cpc, 2),
                "cpl": cpl,
                "spend": round(spend, 2),
                "leads": leads,
                "recorded_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            stored += 1

            # Check thresholds
            if cpl > CPL_ALERT_THRESHOLD and leads > 0:
                alerts.append(f"High CPL: {ad.get('ad_name')} — ₹{cpl:.0f}/lead")
            if impressions > 1000 and ctr < CTR_ALERT_THRESHOLD:
                alerts.append(f"Low CTR: {ad.get('ad_name')} — {ctr*100:.2f}%")

        if alerts:
            supabase.table("notifications").insert({
                "type": "system", "priority": "high",
                "title": f"Meta Ads: {len(alerts)} performance alert(s)",
                "message": "\n".join(f"• {a}" for a in alerts[:5]),
                "is_read": False, "is_actioned": False,
            }).execute()

        output = {"ads_processed": len(ads), "snapshots_stored": stored, "alerts": len(alerts),
                  "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
