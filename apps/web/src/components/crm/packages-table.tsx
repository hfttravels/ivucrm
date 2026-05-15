"use client";

import { useEffect, useState } from "react";
import type { Package } from "@/db/schema";
import { AddPackageForm } from "./record-forms";

type Props = { initialPackages: Package[] };

export default function PackagesTable({ initialPackages }: Props) {
  const [packages, setPackages] = useState(initialPackages);

  useEffect(() => {
    setPackages(initialPackages);
  }, [initialPackages]);

  const active = packages.filter((p) => ["active", "filling_fast"].includes(p.status));
  const other = packages.filter((p) => !["active", "filling_fast"].includes(p.status));
  const totalRevenue = active.reduce(
    (sum, p) => sum + p.seatsFilled * Math.round((p.priceMin + p.priceMax) / 2),
    0
  );
  const totalSeats = active.reduce((sum, p) => sum + p.seatsTotal, 0);
  const totalFilled = active.reduce((sum, p) => sum + p.seatsFilled, 0);

  return (
    <div className="space-y-6">
      <AddPackageForm onCreated={(pkg) => setPackages((prev) => [pkg, ...prev])} />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Packages" value={String(active.length)} />
        <StatCard
          label="Overall Fill Rate"
          value={totalSeats ? `${Math.round((totalFilled / totalSeats) * 100)}%` : "—"}
          sub={`${totalFilled} / ${totalSeats} seats`}
        />
        <StatCard
          label="Confirmed Revenue"
          value={`₹${(totalRevenue / 100000).toFixed(1)}L`}
          sub="from filled seats"
        />
      </div>

      {/* Active packages */}
      <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Active Packages</h2>
        {active.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">No active packages</p>
        ) : (
          <div className="space-y-3">
            {active.map((pkg) => (
              <PackageRow key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </div>

      {/* Other packages */}
      {other.length > 0 && (
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Other Packages</h2>
          <div className="space-y-3">
            {other.map((pkg) => (
              <PackageRow key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PackageRow({ pkg }: { pkg: Package }) {
  const fillRate = pkg.seatsTotal > 0 ? (pkg.seatsFilled / pkg.seatsTotal) * 100 : 0;
  const seatsLeft = pkg.seatsTotal - pkg.seatsFilled;
  const avgPrice = Math.round((pkg.priceMin + pkg.priceMax) / 2);
  const confirmedRev = pkg.seatsFilled * avgPrice;
  const daysUntil = Math.ceil(
    (new Date(pkg.departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const barColor =
    fillRate >= 80 ? "bg-green-500" : fillRate >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="rounded-md border border-stone-800 bg-stone-950 p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{pkg.title}</span>
            <StatusBadge status={pkg.status} />
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            {pkg.destination} · Departs {new Date(pkg.departureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {daysUntil > 0 && <span className="ml-1 text-stone-600">({daysUntil}d away)</span>}
          </div>
        </div>
        <div className="text-right text-xs text-stone-400">
          <div className="font-medium text-white">₹{pkg.priceMin.toLocaleString("en-IN")}–{pkg.priceMax.toLocaleString("en-IN")}</div>
          <div className="text-stone-500">₹{(confirmedRev / 100000).toFixed(1)}L confirmed</div>
        </div>
      </div>

      {/* Fill rate bar */}
      <div className="mb-1 flex items-center justify-between text-xs text-stone-400">
        <span>{pkg.seatsFilled} / {pkg.seatsTotal} seats filled</span>
        <span className={fillRate >= 80 ? "text-green-400" : fillRate >= 50 ? "text-yellow-400" : "text-red-400"}>
          {fillRate.toFixed(0)}% · {seatsLeft} left
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(fillRate, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-4">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-stone-500">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: Package["status"] }) {
  const styles: Record<string, string> = {
    draft: "bg-stone-800 text-stone-400",
    active: "bg-blue-900 text-blue-300",
    filling_fast: "bg-orange-900 text-orange-300",
    sold_out: "bg-green-900 text-green-300",
    completed: "bg-stone-700 text-stone-400",
    cancelled: "bg-red-900 text-red-400",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.draft}`}>
      {status.replace("_", " ")}
    </span>
  );
}
