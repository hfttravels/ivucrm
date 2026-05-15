"use client";

import { useState } from "react";
import type { SeoReport, Agent } from "@/db/schema";

type Props = {
  initialReports: SeoReport[];
  agents: Agent[];
};

type Filter = "all" | "quick_wins" | "top10" | "declining";

export default function SeoIntelligence({ initialReports, agents }: Props) {
  const [reports] = useState(initialReports);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const seoAgents = agents.filter((a) => [1, 2, 3, 4, 5, 8, 9].includes(a.agentNumber));

  const filtered = reports.filter((r) => {
    const pos = parseFloat(String(r.position ?? 99));
    const prev = parseFloat(String(r.previousPosition ?? pos));
    const matchesSearch = !search || r.keyword.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "quick_wins") return pos >= 4 && pos <= 20;
    if (filter === "top10") return pos <= 10;
    if (filter === "declining") return pos > prev + 2;
    return true;
  });

  const avgPosition = reports.length
    ? (reports.reduce((s, r) => s + parseFloat(String(r.position ?? 0)), 0) / reports.length).toFixed(1)
    : "—";
  const top10Count = reports.filter((r) => parseFloat(String(r.position ?? 99)) <= 10).length;
  const quickWins = reports.filter((r) => { const p = parseFloat(String(r.position ?? 99)); return p >= 4 && p <= 20; }).length;
  const totalClicks = reports.reduce((s, r) => s + (r.clicks ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Keywords Tracked" value={String(reports.length)} />
        <StatCard label="Avg Position" value={String(avgPosition)} />
        <StatCard label="Top 10 Rankings" value={String(top10Count)} color="text-green-400" />
        <StatCard label="Quick Wins" value={String(quickWins)} color="text-yellow-400" sub="pos 4–20" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 lg:gap-6">
        {/* Rankings table */}
        <div className="rounded-lg border border-stone-800 bg-stone-900 xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-stone-800 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
              {(["all", "quick_wins", "top10", "declining"] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`whitespace-nowrap rounded px-3 py-1 text-xs font-medium transition-colors ${filter === f ? "bg-stone-700 text-white" : "text-stone-400 hover:text-white"}`}>
                  {f === "quick_wins" ? "Quick Wins" : f === "top10" ? "Top 10" : f === "declining" ? "Declining" : "All"}
                </button>
              ))}
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keywords…"
              className="w-full rounded border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-white placeholder-stone-600 sm:w-48 sm:py-1" />
          </div>

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No keywords match this filter</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[640px] divide-y divide-stone-800/50">
                <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-stone-500">
                  <span className="col-span-5">Keyword</span>
                  <span className="col-span-2 text-right">Position</span>
                  <span className="col-span-2 text-right">Change</span>
                  <span className="col-span-2 text-right">Clicks</span>
                  <span className="col-span-1 text-right">CTR</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto divide-y divide-stone-800/30">
                  {filtered.map((r) => <KeywordRow key={r.id} report={r} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SEO Agents sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-stone-800 bg-stone-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">SEO Agents</h3>
            <div className="space-y-2">
              {seoAgents.map((a) => <AgentRow key={a.id} agent={a} />)}
            </div>
          </div>

          <div className="rounded-lg border border-stone-800 bg-stone-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Traffic Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Total Clicks</span>
                <span className="text-white">{totalClicks.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Keywords tracked</span>
                <span className="text-white">{reports.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Page 1 rankings</span>
                <span className="text-green-400">{top10Count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Quick wins</span>
                <span className="text-yellow-400">{quickWins}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeywordRow({ report }: { report: SeoReport }) {
  const pos = parseFloat(String(report.position ?? 0));
  const prev = parseFloat(String(report.previousPosition ?? pos));
  const change = prev ? prev - pos : 0; // positive = improved
  const posColor = pos <= 3 ? "text-green-400" : pos <= 10 ? "text-blue-400" : pos <= 20 ? "text-yellow-400" : "text-stone-400";

  return (
    <div className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-stone-800/30 transition-colors">
      <div className="col-span-5 min-w-0">
        <div className="truncate text-sm text-stone-200">{report.keyword}</div>
        <div className="truncate text-xs text-stone-600">{report.pageUrl}</div>
      </div>
      <div className={`col-span-2 text-right text-sm font-medium ${posColor}`}>
        {pos > 0 ? pos.toFixed(0) : "—"}
      </div>
      <div className="col-span-2 text-right text-xs">
        {change !== 0 ? (
          <span className={change > 0 ? "text-green-400" : "text-red-400"}>
            {change > 0 ? "↑" : "↓"}{Math.abs(change).toFixed(0)}
          </span>
        ) : <span className="text-stone-600">—</span>}
      </div>
      <div className="col-span-2 text-right text-xs text-stone-400">
        {report.clicks?.toLocaleString("en-IN") ?? "—"}
      </div>
      <div className="col-span-1 text-right text-xs text-stone-500">
        {report.ctr ? `${(parseFloat(String(report.ctr)) * 100).toFixed(1)}%` : "—"}
      </div>
    </div>
  );
}

function AgentRow({ agent }: { agent: Agent }) {
  const colors: Record<string, string> = {
    idle: "text-stone-500", running: "text-green-400 animate-pulse",
    completed: "text-blue-400", failed: "text-red-400", retrying: "text-yellow-400",
  };
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate text-xs text-stone-400">#{agent.agentNumber} {agent.name}</span>
      <span className={`text-xs font-medium ${colors[agent.status] ?? "text-stone-500"}`}>{agent.status}</span>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-stone-800 bg-stone-900 p-4">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`mt-1 break-words text-xl font-bold sm:text-2xl ${color ?? "text-white"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-stone-600">{sub}</div>}
    </div>
  );
}
