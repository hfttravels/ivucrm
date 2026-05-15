from crewai import Task
from crew.agents.group_fill_rate_agent import create_group_fill_rate_agent


def create_analyze_fill_rate_task() -> Task:
    agent = create_group_fill_rate_agent()
    
    return Task(
        description="""Analyze the fill rate of all active travel packages and create notifications for packages that need attention.

        Your analysis should:
        1. Query all packages with status 'active' or 'filling_fast'
        2. Calculate fill rate percentage: (seats_filled / seats_total) * 100
        3. Calculate seats remaining: seats_total - seats_filled
        4. Identify packages that need alerts based on these rules:
           - CRITICAL (priority: high): Seats remaining <= 3 AND fill rate < 80%
           - WARNING (priority: medium): Seats remaining <= 5 AND fill rate < 70%
           - FILLING_FAST (priority: medium): Fill rate >= 80%
        
        5. For each package needing attention, create a notification with:
           - Clear title indicating the package and urgency level
           - Message with specific numbers (seats filled, seats remaining, fill rate %)
           - Appropriate priority level
           - Related entity ID (package ID)
        
        6. Return a summary of all packages analyzed and notifications created.
        
        Use the Supabase Database Query Tool to:
        - Read packages: action='select', table='packages', filters={'status': 'active'}
        - Create notifications: Use the create_notification helper function
        """,
        expected_output="""A JSON summary containing:
        {
            "packages_analyzed": 5,
            "notifications_created": 2,
            "alerts": [
                {
                    "package_id": "uuid",
                    "destination": "Thailand Full Moon Party",
                    "seats_filled": 9,
                    "seats_total": 12,
                    "seats_remaining": 3,
                    "fill_rate": 75.0,
                    "alert_type": "CRITICAL",
                    "notification_id": "uuid"
                }
            ]
        }""",
        agent=agent,
    )
