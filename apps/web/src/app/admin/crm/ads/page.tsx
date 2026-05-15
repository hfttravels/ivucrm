import { db } from "@/db";
import { metaAdPerformance } from "@/db/schema";
import { desc } from "drizzle-orm";
import AdsHub from "@/components/crm/ads-hub";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const ads = await db.select().from(metaAdPerformance)
    .orderBy(desc(metaAdPerformance.recordedAt))
    .limit(100);

  return (
    <div className="h-screen overflow-y-auto bg-stone-950 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Meta Ads Hub</h1>
        <p className="mt-1 text-stone-400">Ad performance, CPL tracking, and spend breakdown</p>
      </div>
      <AdsHub initialAds={ads} />
    </div>
  );
}
