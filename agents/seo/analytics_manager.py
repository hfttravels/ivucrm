"""
Agent #8 — Analytics Manager
Pulls Google Search Console performance data, upserts into seo_reports.
Schedule: Daily 8AM IST
"""
import sys, os, json
from datetime import datetime, timezone, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_client import get_supabase

AGENT_NUMBER = 8
SITE_URL = os.getenv("GOOGLE_SEARCH_CONSOLE_SITE_URL", "https://hasslefreetravels.in")
SA_EMAIL = os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "")
SA_KEY = os.getenv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "").replace("\\n", "\n")

def get_gsc_client():
    creds = service_account.Credentials.from_service_account_info(
        {"type": "service_account", "client_email": SA_EMAIL, "private_key": SA_KEY,
         "token_uri": "https://oauth2.googleapis.com/token"},
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    return build("searchconsole", "v1", credentials=creds)

def run():
    start_time = log_agent_start(AGENT_NUMBER)
    supabase = get_supabase()
    try:
        svc = get_gsc_client()
        end = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
        start = (datetime.now() - timedelta(days=33)).strftime("%Y-%m-%d")

        resp = svc.searchanalytics().query(siteUrl=SITE_URL, body={
            "startDate": start, "endDate": end,
            "dimensions": ["query", "page"], "rowLimit": 100,
        }).execute()

        rows = resp.get("rows", [])
        upserted = 0
        for row in rows:
            keyword = row["keys"][0]
            page_url = row["keys"][1]
            supabase.table("seo_reports").upsert({
                "keyword": keyword, "page_url": page_url,
                "clicks": int(row.get("clicks", 0)),
                "impressions": int(row.get("impressions", 0)),
                "ctr": round(row.get("ctr", 0), 4),
                "position": round(row.get("position", 0), 1),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }, on_conflict="keyword,page_url").execute()
            upserted += 1

        output = {"rows_synced": upserted, "date_range": f"{start} → {end}", "timestamp": datetime.now(timezone.utc).isoformat()}
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0); raise

if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
