import sys
import os
import time
import json
from datetime import datetime, timezone

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from tools.agent_logger import log_agent_start, log_agent_complete, log_agent_error
from tools.supabase_db_tool import get_active_packages, create_notification

AGENT_NUMBER = 27


def calculate_fill_rate_and_alert():
    """Main logic for Agent #27 — Group Fill Rate monitoring."""
    start_time = log_agent_start(AGENT_NUMBER)
    
    try:
        # Get all active packages
        packages = get_active_packages()
        
        if not packages:
            output = {"packages_analyzed": 0, "notifications_created": 0, "alerts": []}
            log_agent_complete(AGENT_NUMBER, start_time, output)
            return output
        
        alerts = []
        notifications_created = 0
        
        for pkg in packages:
            seats_filled = pkg.get("seats_filled", 0)
            seats_total = pkg.get("seats_total", 0)
            
            if seats_total == 0:
                continue
            
            fill_rate = (seats_filled / seats_total) * 100
            seats_remaining = seats_total - seats_filled
            
            alert_type = None
            priority = None
            
            # Determine alert type based on business rules
            if seats_remaining <= 3 and fill_rate < 80:
                alert_type = "CRITICAL"
                priority = "high"
            elif seats_remaining <= 5 and fill_rate < 70:
                alert_type = "WARNING"
                priority = "medium"
            elif fill_rate >= 80:
                alert_type = "FILLING_FAST"
                priority = "medium"
            
            if alert_type:
                # Create notification
                title = f"{alert_type}: {pkg['destination']} — {seats_remaining} seats left"
                message = f"""Package: {pkg['title']}
Seats Filled: {seats_filled}/{seats_total} ({fill_rate:.1f}%)
Seats Remaining: {seats_remaining}
Departure: {pkg['departure_date']}

Action Required: {"Launch urgency campaign immediately" if alert_type == "CRITICAL" else "Monitor closely and prepare marketing push"}"""
                
                notification = create_notification(
                    title=title,
                    message=message,
                    priority=priority,
                    notification_type="fill_rate_alert",
                    related_entity_id=pkg["id"]
                )
                
                notifications_created += 1
                
                alerts.append({
                    "package_id": pkg["id"],
                    "destination": pkg["destination"],
                    "seats_filled": seats_filled,
                    "seats_total": seats_total,
                    "seats_remaining": seats_remaining,
                    "fill_rate": round(fill_rate, 1),
                    "alert_type": alert_type,
                    "notification_id": notification.get("id")
                })
        
        output = {
            "packages_analyzed": len(packages),
            "notifications_created": notifications_created,
            "alerts": alerts,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        log_agent_complete(AGENT_NUMBER, start_time, output)
        return output
    
    except Exception as e:
        log_agent_error(AGENT_NUMBER, str(e), 0)
        raise


if __name__ == "__main__":
    print(f"[Agent #{AGENT_NUMBER}] Group Fill Rate Monitor — Starting...")
    result = calculate_fill_rate_and_alert()
    print(f"[Agent #{AGENT_NUMBER}] Complete. Result:")
    print(json.dumps(result, indent=2))
