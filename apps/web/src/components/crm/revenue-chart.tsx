"use client";

import type { Package, Agent, Notification } from "@/db/schema";

type MonthData = {
  month: string;
  confirmed: number;
  projected: number;
  packages: number;
};

type Props = {
  packages: Package[];
  agents: Agent[];
  recentNotifications: Notification[];
};

export default function RevenueChart({ packages, agents, recentNotifications }: Props) {
  const forecast = buildForecast(packages);
  const maxVal = Math.max(...forecast.map((m) => m.projected), 1);

  const totalConfirmed = forecast.reduce((s, m) => s + m.confirmed, 0);
  const totalProjected = forecast.reduce((s, m) => s + m.projected, 0);

  const pricingAgent = agents.find((a) => a.agentNumber === 25);
  const forecastAgent = agents.find((a) => a.agentNumber === 26);
  const fillAgent = agents.find((a) => a.agentNumber === 27);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard label="Confirmed Revenue" value={`₹${(totalConfirmed / 100000).toFixed(1)}L`} sub="from filled seats" color="text-green-400" />
        <StatCard label="Projected Revenue" value={`₹${(totalProjected / 100000).toFixed(1)}L`} sub="incl. projected fills" color="text-blue-400" />
        <StatCard
          label="Upside Potential"
          value={`₹${((totalProjected - totalConfirmed) / 100000).toFixed(1)}L`}
          sub="if fill targets hit"
          color="text-yellow-400"
        />
      </div>

      {/* Bar chart */}
      <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 sm:p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Monthly Revenue Forecast</h2>
        {forecast.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">No upcoming packages found</p>
        ) : (
          <div className="overflow-hidden">
            <div className="flex w-full items-end gap-2 sm:gap-4">
              {forecast.map((m) => (
                <MonthBar key={m.month} data={m} maxVal={maxVal} />
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-500">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded bg-green-600" /> Confirmed</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded bg-blue-800" /> Projected</span>
        </div>
      </div>

      {/* Agent status + recent alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Pricing Agents</h2>
          <div className="space-y-3">
            {[fillAgent, pricingAgent, forecastAgent].filter(Boolean).map((a) => (
              <AgentStatusRow key={a!.id} agent={a!} />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Alerts</h2>
          {recentNotifications.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">No recent alerts</p>
          ) : (
            <div className="space-y-2">
              {recentNotifications.slice(0, 6).map((n) => (
                <div key={n.id} className="rounded border border-stone-800 bg-stone-950 p-3">
                  <div className="flex items-center gap-2">
                    <PriorityDot priority={n.priority} />
                    <span className="text-xs font-medium text-white">{n.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">
                    {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildForecast(packages: Package[]): MonthData[] {
  const now = Date.now();
  const cutoff = now + 90 * 24 * 60 * 60 * 1000; // 3 months
  const map = new Map<string, MonthData>();

  for (const pkg of packages) {
    const dep = new Date(pkg.departureDate).getTime();
    if (dep < now || dep > cutoff) continue;
    if (!["active", "filling_fast", "sold_out"].includes(pkg.status)) continue;

    const month = new Date(pkg.departureDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    const avg = Math.round((pkg.priceMin + pkg.priceMax) / 2);
    const confirmed = pkg.seatsFilled * avg;
    const fillRate = pkg.seatsTotal > 0 ? pkg.seatsFilled / pkg.seatsTotal : 0;
    const projectedExtra = Math.round((pkg.seatsTotal - pkg.seatsFilled) * Math.min(fillRate * 1.2, 1));
    const projected = confirmed + projectedExtra * avg;

    const existing = map.get(month) ?? { month, confirmed: 0, projected: 0, packages: 0 };
    map.set(month, {
      month,
      confirmed: existing.confirmed + confirmed,
      projected: existing.projected + projected,
      packages: existing.packages + 1,
    });
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function MonthBar({ data, maxVal }: { data: MonthData; maxVal: number }) {
  const projH = Math.round((data.projected / maxVal) * 180);
  const confH = Math.round((data.confirmed / maxVal) * 180);

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="text-xs text-stone-400">₹{(data.projected / 100000).toFixed(1)}L</div>
      <div className="relative flex w-full items-end justify-center" style={{ height: 180 }}>
        {/* Projected bar (background) */}
        <div
          className="absolute bottom-0 w-full rounded-t bg-blue-900/60"
          style={{ height: projH }}
        />
        {/* Confirmed bar (foreground) */}
        <div
          className="absolute bottom-0 w-full rounded-t bg-green-600"
          style={{ height: confH }}
        />
      </div>
      <div className="text-center">
        <div className="text-xs font-medium text-stone-300">{data.month}</div>
        <div className="text-xs text-stone-600">{data.packages} pkg</div>
      </div>
    </div>
  );
}

function AgentStatusRow({ agent }: { agent: Agent }) {
  const colors: Record<string, string> = {
    idle: "text-stone-400",
    running: "text-green-400",
    completed: "text-blue-400",
    failed: "text-red-400",
    retrying: "text-yellow-400",
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-stone-800 bg-stone-950 px-3 py-2">
      <div className="min-w-0">
        <div className="text-xs font-medium text-white">#{agent.agentNumber} {agent.name}</div>
        {agent.lastRunAt && (
          <div className="text-xs text-stone-600">
            Last run: {new Date(agent.lastRunAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
      <span className={`shrink-0 text-xs font-medium ${colors[agent.status] ?? "text-stone-400"}`}>
        {agent.status}
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-stone-800 bg-stone-900 p-4">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`mt-1 break-words text-xl font-bold sm:text-2xl ${color ?? "text-white"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-stone-500">{sub}</div>}
    </div>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "bg-stone-500",
    medium: "bg-blue-500",
    high: "bg-yellow-500",
    critical: "bg-red-500",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[priority] ?? "bg-stone-500"}`} />;
}
