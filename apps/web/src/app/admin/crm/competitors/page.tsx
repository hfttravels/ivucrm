import { db } from "@/db";
import { competitorAds } from "@/db/schema";
import { desc } from "drizzle-orm";
import CompetitorRadar from "@/components/crm/competitor-radar";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const ads = await db.select().from(competitorAds)
    .orderBy(desc(competitorAds.lastSeen))
    .limit(200);

  return (
    <div className="h-screen overflow-y-auto bg-stone-950 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Competitor Radar</h1>
        <p className="mt-1 text-stone-400">Keyword rankings vs Wanderon, Thrillophilia, and IndiHikes</p>
      </div>
      <CompetitorRadar initialAds={ads} />
    </div>
  );
}
