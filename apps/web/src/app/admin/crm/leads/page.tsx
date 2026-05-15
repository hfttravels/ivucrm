import { db } from "@/db";
import { leads } from "@/db/schema";
import { desc } from "drizzle-orm";
import LeadsPipeline from "@/components/crm/leads-pipeline";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const allLeads = await db.select().from(leads).orderBy(desc(leads.score));

  return (
    <div className="h-screen overflow-y-auto bg-stone-950 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Lead Pipeline</h1>
        <p className="mt-1 text-stone-400">Lead scoring, status tracking, and WhatsApp history</p>
      </div>

      <LeadsPipeline initialLeads={allLeads} />
    </div>
  );
}
