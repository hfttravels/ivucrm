import { db } from "@/db";
import { packages, agents, notifications } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import RevenueChart from "@/components/crm/revenue-chart";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [allPackages, pricingAgents, recentAlerts] = await Promise.all([
    db.select().from(packages),
    db
      .select()
      .from(agents)
      .where(inArray(agents.agentNumber, [25, 26, 27])),
    db
      .select()
      .from(notifications)
      .where(
        inArray(notifications.type, ["fill_rate_alert", "price_change", "system"])
      )
      .orderBy(desc(notifications.createdAt))
      .limit(10),
  ]);

  return (
    <div className="h-screen overflow-y-auto bg-stone-950 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Reports & Forecasts</h1>
        <p className="mt-1 text-stone-400">Revenue forecast, pricing agent activity, and alerts</p>
      </div>
      <RevenueChart
        packages={allPackages}
        agents={pricingAgents}
        recentNotifications={recentAlerts}
      />
    </div>
  );
}
