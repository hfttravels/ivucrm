"use client";

import { useState } from "react";
import type { CompetitorAd } from "@/db/schema";

type Props = { initialAds: CompetitorAd[] };

const COMPETITORS = ["wanderon.in", "thrillophilia.com", "indiahikes.com"];
const COMPETITOR_COLORS: Record<string, string> = {
  "wanderon.in": "text-orange-400",
  "thrillophilia.com": "text-purple-400",
  "indiahikes.com": "text-blue-400",
};

export default function CompetitorRadar({ initialAds }: Props) {
  const [ads] = useState(initialAds);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  const activeAds = ads.filter((a) => a.isActive);
  const filtered = selectedBrand === "all" ? ads : ads.filter((a) => a.brand === selectedBrand);

  // Keyword ranking comparison
  const keywordMap = new Map<string, Record<string, number>>();
  for (const ad of ads) {
    const raw = ad.rawData as Record<string, unknown> | null;
    const keyword = raw?.keyword as string | undefined;
    const position = raw?.position as number | undefined;
    const ourPos = raw?.our_position as number | undefined;
    if (!keyword || !position) continue;
    if (!keywordMap.has(keyword)) keywordMap.set(keyword, { our: ourPos ?? 99 });
    keywordMap.get(keyword)![ad.brand] = position;
  }

  const keywords = Array.from(keywordMap.entries())
    .sort(([, a], [, b]) => (a.our ?? 99) - (b.our ?? 99))
    .slice(0, 15);

  // Brand activity counts
  const brandCounts = ads.reduce<Record<string, number>>((acc, a) => {
    acc[a.brand] = (acc[a.brand] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Competitors Tracked" value={String(new Set(ads.map((a) => a.brand)).size)} />
        <StatCard label="Active Competitor Ads" value={String(activeAds.length)} color="text-red-400" />
        <StatCard label="Keywords Monitored" value={String(keywordMap.size)} />
        <StatCard label="Data Points" value={String(ads.length)} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Keyword ranking table */}
        <div className="col-span-2 rounded-lg border border-stone-800 bg-stone-900">
          <div className="border-b border-stone-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Keyword Rankings vs Competitors</h3>
            <p className="mt-0.5 text-xs text-stone-500">Lower number = better ranking. — means not in top 20.</p>
          </div>
          {keywords.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No ranking data yet — run Agent #9 to sync</p>
          ) : (
            <div className="divide-y divide-stone-800/40">
              <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-stone-500">
                <span className="col-span-4">Keyword</span>
                <span className="col-span-2 text-center text-green-400">Us</span>
                {COMPETITORS.map((c) => (
                  <span key={c} className={`col-span-2 text-center ${COMPETITOR_COLORS[c] ?? "text-stone-400"}`}>
                    {c.split(".")[0]}
                  </span>
                ))}
              </div>
              <div className="max-h-[440px] overflow-y-auto divide-y divide-stone-800/20">
                {keywords.map(([keyword, positions]) => (
                  <div key={keyword} className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-stone-800/30">
                    <span className="col-span-4 truncate text-sm text-stone-300">{keyword}</span>
                    <span className={`col-span-2 text-center text-sm font-medium ${
                      (positions.our ?? 99) <= 3 ? "text-green-400" :
                      (positions.our ?? 99) <= 10 ? "text-blue-400" : "text-stone-400"
                    }`}>
                      {positions.our !== 99 ? positions.our : "—"}
                    </span>
                    {COMPETITORS.map((c) => {
                      const theirPos = positions[c];
                      const weWin = theirPos && positions.our && positions.our < theirPos;
                      return (
                        <span key={c} className={`col-span-2 text-center text-sm ${
                          !theirPos ? "text-stone-700" :
                          weWin ? "text-stone-500" : "text-red-400 font-medium"
                        }`}>
                          {theirPos ?? "—"}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Brand filter */}
          <div className="rounded-lg border border-stone-800 bg-stone-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Competitor Activity</h3>
            <div className="space-y-2">
              {[...new Set(ads.map((a) => a.brand))].map((brand) => (
                <button key={brand} onClick={() => setSelectedBrand(selectedBrand === brand ? "all" : brand)}
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-xs transition-colors ${
                    selectedBrand === brand ? "bg-stone-700" : "hover:bg-stone-800"
                  }`}>
                  <span className={COMPETITOR_COLORS[brand] ?? "text-stone-300"}>{brand}</span>
                  <span className="text-stone-500">{brandCounts[brand] ?? 0} entries</span>
                </button>
              ))}
              {ads.length === 0 && <p className="text-xs text-stone-600">No data yet</p>}
            </div>
          </div>

          {/* Recent competitor ads */}
          <div className="rounded-lg border border-stone-800 bg-stone-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Recent Intel</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filtered.slice(0, 8).map((ad) => (
                <div key={ad.id} className="rounded border border-stone-800 bg-stone-950 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${COMPETITOR_COLORS[ad.brand] ?? "text-stone-400"}`}>
                      {ad.brand.split(".")[0]}
                    </span>
                    <span className="text-xs text-stone-600">
                      {new Date(ad.lastSeen).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {ad.headline && (
                    <div className="text-xs text-stone-300 truncate">{ad.headline}</div>
                  )}
                  {ad.destinationTagged && (
                    <div className="text-xs text-stone-600 mt-0.5">{ad.destinationTagged}</div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && <p className="text-xs text-stone-600">No entries for this filter</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-4">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color ?? "text-white"}`}>{value}</div>
    </div>
  );
}
