"use client";

import { useState } from "react";
import type { MetaAdPerformance } from "@/db/schema";

type Props = { initialAds: MetaAdPerformance[] };

export default function AdsHub({ initialAds }: Props) {
  const [ads] = useState(initialAds);
  const [sort, setSort] = useState<"spend" | "cpl" | "leads" | "ctr">("spend");

  // Aggregate totals
  const totalSpend = ads.reduce((s, a) => s + parseFloat(String(a.spend ?? 0)), 0);
  const totalLeads = ads.reduce((s, a) => s + (a.leads ?? 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks ?? 0), 0);
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions ?? 0), 0);
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Group by campaign
  const byCampaign = ads.reduce<Record<string, { spend: number; leads: number; clicks: number; impressions: number }>>((acc, a) => {
    const key = a.campaignName ?? "Unknown";
    if (!acc[key]) acc[key] = { spend: 0, leads: 0, clicks: 0, impressions: 0 };
    acc[key].spend += parseFloat(String(a.spend ?? 0));
    acc[key].leads += a.leads ?? 0;
    acc[key].clicks += a.clicks ?? 0;
    acc[key].impressions += a.impressions ?? 0;
    return acc;
  }, {});

  const sorted = [...ads].sort((a, b) => {
    if (sort === "spend") return parseFloat(String(b.spend ?? 0)) - parseFloat(String(a.spend ?? 0));
    if (sort === "cpl") {
      const cplA = (a.leads ?? 0) > 0 ? parseFloat(String(a.spend ?? 0)) / a.leads! : 9999;
      const cplB = (b.leads ?? 0) > 0 ? parseFloat(String(b.spend ?? 0)) / b.leads! : 9999;
      return cplA - cplB;
    }
    if (sort === "leads") return (b.leads ?? 0) - (a.leads ?? 0);
    if (sort === "ctr") return parseFloat(String(b.ctr ?? 0)) - parseFloat(String(a.ctr ?? 0));
    return 0;
  });

  const maxSpend = Math.max(...Object.values(byCampaign).map((c) => c.spend), 1);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 lg:gap-4">
        <StatCard label="Total Spend" value={`₹${totalSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
        <StatCard label="Total Leads" value={String(totalLeads)} color="text-green-400" />
        <StatCard label="Avg CPL" value={avgCPL > 0 ? `₹${avgCPL.toFixed(0)}` : "—"}
          color={avgCPL > 800 ? "text-red-400" : avgCPL > 400 ? "text-yellow-400" : "text-green-400"} />
        <StatCard label="Avg CTR" value={`${avgCTR.toFixed(2)}%`}
          color={avgCTR < 1 ? "text-red-400" : avgCTR < 2 ? "text-yellow-400" : "text-green-400"} />
        <StatCard label="Impressions" value={totalImpressions > 0 ? `${(totalImpressions / 1000).toFixed(1)}K` : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 lg:gap-6">
        {/* Campaign breakdown */}
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Spend by Campaign</h3>
          {Object.keys(byCampaign).length === 0 ? (
            <p className="py-4 text-center text-xs text-stone-500">No campaign data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byCampaign)
                .sort(([, a], [, b]) => b.spend - a.spend)
                .map(([name, data]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="min-w-0 max-w-[160px] truncate text-stone-300">{name}</span>
                      <span className="text-stone-400">₹{data.spend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-stone-800">
                      <div className="h-full rounded-full bg-blue-600"
                        style={{ width: `${(data.spend / maxSpend) * 100}%` }} />
                    </div>
                    <div className="mt-0.5 flex gap-3 text-xs text-stone-600">
                      <span>{data.leads} leads</span>
                      <span>{data.clicks} clicks</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Ad performance table */}
        <div className="rounded-lg border border-stone-800 bg-stone-900 xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-stone-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-white">Ad Performance</h3>
            <div className="flex flex-wrap gap-1">
              {(["spend", "leads", "cpl", "ctr"] as const).map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  className={`rounded px-2 py-1 text-xs font-medium uppercase transition-colors ${sort === s ? "bg-stone-700 text-white" : "text-stone-500 hover:text-white"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {sorted.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No ad data yet — run Agent #24 to sync</p>
          ) : (
            <div className="overflow-hidden">
              <div className="w-full divide-y divide-stone-800/40">
                <div className="grid grid-cols-12 px-2 py-2 text-[11px] font-medium text-stone-500 sm:px-4 sm:text-xs">
                  <span className="col-span-4">Ad</span>
                  <span className="col-span-2 text-right">Spend</span>
                  <span className="col-span-2 text-right">Leads</span>
                  <span className="col-span-2 text-right">CPL</span>
                  <span className="col-span-2 text-right">CTR</span>
                </div>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-stone-800/20">
                  {sorted.map((ad) => <AdRow key={ad.id} ad={ad} />)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdRow({ ad }: { ad: MetaAdPerformance }) {
  const spend = parseFloat(String(ad.spend ?? 0));
  const cpl = (ad.leads ?? 0) > 0 ? spend / ad.leads! : null;
  const ctr = parseFloat(String(ad.ctr ?? 0)) * 100;
  const cplColor = !cpl ? "text-stone-500" : cpl > 800 ? "text-red-400" : cpl > 400 ? "text-yellow-400" : "text-green-400";
  const ctrColor = ctr < 1 ? "text-red-400" : ctr < 2 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="grid grid-cols-12 items-center px-2 py-2.5 transition-colors hover:bg-stone-800/30 sm:px-4">
      <div className="col-span-4 min-w-0">
        <div className="truncate text-sm text-stone-200">{ad.adName ?? "Unnamed Ad"}</div>
        <div className="truncate text-xs text-stone-600">{ad.campaignName ?? ""}</div>
      </div>
      <div className="col-span-2 text-right text-xs text-stone-300 sm:text-sm">
        ₹{spend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
      </div>
      <div className="col-span-2 text-right text-xs text-green-400 sm:text-sm">{ad.leads ?? 0}</div>
      <div className={`col-span-2 text-right text-xs sm:text-sm ${cplColor}`}>
        {cpl ? `₹${cpl.toFixed(0)}` : "—"}
      </div>
      <div className={`col-span-2 text-right text-xs sm:text-sm ${ctrColor}`}>
        {ctr > 0 ? `${ctr.toFixed(2)}%` : "—"}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-stone-800 bg-stone-900 p-4">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`mt-1 break-words text-xl font-bold sm:text-2xl ${color ?? "text-white"}`}>{value}</div>
    </div>
  );
}
