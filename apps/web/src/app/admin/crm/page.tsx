import { db } from "@/db";
import {
  agents,
  notifications,
  contentQueue,
  type Agent,
  type ContentQueue,
  type Notification,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import AgentFeed from "@/components/crm/agent-feed";
import ApprovalQueue from "@/components/crm/approval-queue";
import NotificationsPanel from "@/components/crm/notifications";
import QuickActions from "@/components/crm/quick-actions";

export const dynamic = "force-dynamic";

type DashboardData = {
  agentsList: Agent[];
  notificationsList: Notification[];
  pendingContent: ContentQueue[];
};

async function loadDashboardData(): Promise<DashboardData> {
  try {
    const [agentsList, notificationsList, pendingContent] = await Promise.all([
      db.select().from(agents).orderBy(agents.agentNumber),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.isRead, false))
        .orderBy(desc(notifications.createdAt))
        .limit(20),
      db
        .select()
        .from(contentQueue)
        .where(eq(contentQueue.status, "pending_review"))
        .orderBy(desc(contentQueue.createdAt))
        .limit(10),
    ]);

    return { agentsList, notificationsList, pendingContent };
  } catch (error) {
    console.error("CRM dashboard data unavailable:", error);
    return { agentsList: [], notificationsList: [], pendingContent: [] };
  }
}

export default async function CommandCenterPage() {
  const { agentsList, notificationsList, pendingContent } = await loadDashboardData();

  return (
    <div className="min-h-dvh overflow-x-hidden bg-stone-950 px-4 py-5 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Command Center</h1>
        <p className="mt-1 text-stone-400">Real-time agent monitoring and approval queue</p>
      </div>

      <div className="mb-6">
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Agent Status Feed */}
        <div className="lg:col-span-2">
          <AgentFeed initialAgents={agentsList} />
        </div>

        {/* Notifications */}
        <div>
          <NotificationsPanel initialNotifications={notificationsList} />
        </div>
      </div>

      {/* Approval Queue */}
      <div className="mt-6">
        <ApprovalQueue initialContent={pendingContent} />
      </div>
    </div>
  );
}
