import { db } from "@/db";
import { seoReports, agents } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import SeoIntelligence from "@/components/crm/seo-intelligence";

export const dynamic = "force-dynamic";

export default async function SEOPage() {
  const [reports, seoAgents] = await Promise.all([
    db.select().from(seoReports)
      .orderBy(desc(seoReports.impressions))
      .limit(200),
    db.select().from(agents)
      .where(inArray(agents.agentNumber, [1, 2, 3, 4, 5, 8, 9])),
  ]);

  return (
    <div className="h-screen overflow-y-auto bg-stone-950 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">SEO Intelligence</h1>
        <p className="mt-1 text-stone-400">Keyword rankings, quick wins, and technical audit status</p>
      </div>
      <SeoIntelligence initialReports={reports} agents={seoAgents} />
    </div>
  );
}
