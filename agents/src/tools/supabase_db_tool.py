from typing import List, Dict, Any
from crewai_tools import BaseTool
from tools.supabase_client import get_supabase


class SupabaseDBTool(BaseTool):
    name: str = "Supabase Database Query Tool"
    description: str = "Query and write to Supabase database tables. Use this to read packages data and create notifications."

    def _run(self, action: str, table: str, data: Dict[str, Any] | None = None, filters: Dict[str, Any] | None = None) -> Any:
        supabase = get_supabase()

        if action == "select":
            query = supabase.table(table).select("*")
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            response = query.execute()
            return response.data

        elif action == "insert":
            if not data:
                return {"error": "No data provided for insert"}
            response = supabase.table(table).insert(data).execute()
            return response.data

        elif action == "update":
            if not data or not filters:
                return {"error": "Both data and filters required for update"}
            query = supabase.table(table).update(data)
            for key, value in filters.items():
                query = query.eq(key, value)
            response = query.execute()
            return response.data

        else:
            return {"error": f"Unknown action: {action}"}


def get_active_packages() -> List[Dict[str, Any]]:
    """Get all active packages with departure dates in the future."""
    supabase = get_supabase()
    response = supabase.table("packages").select("*").in_("status", ["active", "filling_fast"]).execute()
    return response.data


def create_notification(title: str, message: str, priority: str, notification_type: str, related_entity_id: str | None = None) -> Dict[str, Any]:
    """Create a notification in the CRM."""
    supabase = get_supabase()
    notification_data = {
        "agent_id": None,  # Will be set by the agent runner
        "type": notification_type,
        "priority": priority,
        "title": title,
        "message": message,
        "related_entity_id": related_entity_id,
        "related_entity_type": "package" if related_entity_id else None,
        "is_read": False,
        "is_actioned": False,
    }
    response = supabase.table("notifications").insert(notification_data).execute()
    return response.data[0] if response.data else {}
