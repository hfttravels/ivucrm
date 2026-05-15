import { db } from "@/db";
import { metaAdPerformance } from "@/db/schema";
import { desc } from "drizzle-orm";
import AdsHub from "@/components/crm/ads-hub";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const ads = await db
    .select()
    .from(metaAdPerformance)
    .orderBy(desc(metaAdPerformance.recordedAt))
    .limit(100)
    .catch((error) => {
      console.error("Meta ads data unavailable:", error);
      return [];
    });

  return (
    <div className="min-h-dvh overflow-x-hidden bg-stone-950 px-4 py-5 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Meta Ads Hub</h1>
        <p className="mt-1 text-stone-400">Ad performance, CPL tracking, and spend breakdown</p>
      </div>
      <AdsHub initialAds={ads} />
    </div>
  );
}
