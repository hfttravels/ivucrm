import { db } from "@/db";
import { leads } from "@/db/schema";
import { desc } from "drizzle-orm";
import LeadsPipeline from "@/components/crm/leads-pipeline";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const allLeads = await db
    .select()
    .from(leads)
    .orderBy(desc(leads.score))
    .catch((error) => {
      console.error("Lead data unavailable:", error);
      return [];
    });

  return (
    <div className="min-h-dvh overflow-x-hidden bg-stone-950 px-4 py-5 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Lead Pipeline</h1>
        <p className="mt-1 text-stone-400">Lead scoring, status tracking, and WhatsApp history</p>
      </div>

      <LeadsPipeline initialLeads={allLeads} />
    </div>
  );
}
