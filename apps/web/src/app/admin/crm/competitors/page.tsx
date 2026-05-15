import { db } from "@/db";
import { competitorAds } from "@/db/schema";
import { desc } from "drizzle-orm";
import CompetitorRadar from "@/components/crm/competitor-radar";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const ads = await db
    .select()
    .from(competitorAds)
    .orderBy(desc(competitorAds.lastSeen))
    .limit(200)
    .catch((error) => {
      console.error("Competitor data unavailable:", error);
      return [];
    });

  return (
    <div className="min-h-dvh overflow-x-hidden bg-stone-950 px-4 py-5 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Competitor Radar</h1>
        <p className="mt-1 text-stone-400">Keyword rankings vs Wanderon, Thrillophilia, and IndiHikes</p>
      </div>
      <CompetitorRadar initialAds={ads} />
    </div>
  );
}
