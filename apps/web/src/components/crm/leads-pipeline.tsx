"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/db/schema";
import { AddLeadForm } from "./record-forms";

type Props = { initialLeads: Lead[] };

const STATUSES: Lead["status"][] = [
  "new", "contacted", "qualified", "proposal_sent", "negotiating", "booked", "lost",
];

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  negotiating: "Negotiating",
  booked: "Booked ✓",
  lost: "Lost",
  unresponsive: "Unresponsive",
};

const STATUS_COLORS: Record<string, string> = {
  new: "border-stone-700 bg-stone-900",
  contacted: "border-blue-900 bg-blue-950/30",
  qualified: "border-purple-900 bg-purple-950/30",
  proposal_sent: "border-yellow-900 bg-yellow-950/20",
  negotiating: "border-orange-900 bg-orange-950/20",
  booked: "border-green-900 bg-green-950/20",
  lost: "border-red-900 bg-red-950/20",
  unresponsive: "border-stone-800 bg-stone-950",
};

export default function LeadsPipeline({ initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const totalValue = leads
    .filter((l) => l.status === "booked")
    .reduce((s, l) => s + (l.budget ?? 0) * (l.groupSize ?? 1), 0);

  const byStatus = STATUSES.reduce<Record<string, Lead[]>>((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <AddLeadForm onCreated={(lead) => setLeads((prev) => [lead, ...prev])} />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total Leads" value={String(leads.length)} />
        <StatCard label="Qualified" value={String((byStatus.qualified?.length ?? 0) + (byStatus.proposal_sent?.length ?? 0) + (byStatus.negotiating?.length ?? 0))} sub="in pipeline" />
        <StatCard label="Booked" value={String(byStatus.booked?.length ?? 0)} color="text-green-400" />
        <StatCard label="Booked Revenue" value={`₹${(totalValue / 100000).toFixed(1)}L`} color="text-green-400" sub="budget × group size" />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterTab label="All" value="all" active={filter} onClick={setFilter} count={leads.length} />
        {STATUSES.map((s) => (
          <FilterTab key={s} label={STATUS_LABELS[s]} value={s} active={filter} onClick={setFilter} count={byStatus[s]?.length ?? 0} />
        ))}
      </div>

      {/* Lead list + detail panel */}
      <div className="flex flex-col gap-4 xl:flex-row lg:gap-6">
        <div className="flex-1 space-y-2 min-w-0">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 text-center text-sm text-stone-500 sm:p-8">
              No leads in this stage
            </div>
          ) : (
            filtered.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                selected={selected?.id === lead.id}
                onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
              />
            ))
          )}
        </div>

        {selected && (
          <div className="w-full shrink-0 xl:w-80">
            <LeadDetail lead={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

function LeadRow({ lead, selected, onClick }: { lead: Lead; selected: boolean; onClick: () => void }) {
  const score = lead.score ?? 0;
  const scoreColor = score >= 70 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-red-400";

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        selected ? "border-blue-700 bg-blue-950/20" : `${STATUS_COLORS[lead.status]} hover:border-stone-600`
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{lead.name ?? "Unknown"}</span>
            <StatusPill status={lead.status} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            <span>{lead.whatsappNumber}</span>
            {lead.destinationInterest && <span>→ {lead.destinationInterest}</span>}
            {lead.travelMonth && <span>· {lead.travelMonth}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
            <span>{lead.source.replace(/_/g, " ")}</span>
            {lead.groupSize && <span>· {lead.groupSize} pax</span>}
            {lead.budget && <span>· ₹{lead.budget.toLocaleString("en-IN")}/person</span>}
          </div>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <div className={`text-lg font-bold ${scoreColor}`}>{score}</div>
          <div className="text-xs text-stone-600">score</div>
        </div>
      </div>
    </button>
  );
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const history = Array.isArray(lead.conversationHistory) ? lead.conversationHistory as Record<string, string>[] : [];

  return (
    <div className="rounded-lg border border-stone-700 bg-stone-900 p-5 xl:sticky xl:top-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-white">{lead.name ?? "Unknown"}</div>
          <div className="text-xs text-stone-500">{lead.whatsappNumber}</div>
        </div>
        <button onClick={onClose} className="text-stone-500 hover:text-white text-lg leading-none">×</button>
      </div>

      <div className="space-y-3 text-xs">
        <Row label="Status" value={STATUS_LABELS[lead.status]} />
        <Row label="Score" value={String(lead.score ?? 0)} />
        <Row label="Source" value={lead.source.replace(/_/g, " ")} />
        {lead.destinationInterest && <Row label="Destination" value={lead.destinationInterest} />}
        {lead.travelMonth && <Row label="Travel Month" value={lead.travelMonth} />}
        {lead.groupSize && <Row label="Group Size" value={`${lead.groupSize} pax`} />}
        {lead.budget && <Row label="Budget" value={`₹${lead.budget.toLocaleString("en-IN")}/person`} />}
        {lead.email && <Row label="Email" value={lead.email} />}
        {lead.notes && (
          <div>
            <div className="text-stone-500 mb-1">Notes</div>
            <div className="rounded bg-stone-950 p-2 text-stone-300">{lead.notes}</div>
          </div>
        )}
        <Row label="Created" value={new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
        {lead.lastContactedAt && (
          <Row label="Last Contact" value={new Date(lead.lastContactedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-stone-400">Conversation History</div>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`rounded p-2 text-xs ${
                  msg.role === "agent" ? "bg-blue-950/40 text-blue-200" : "bg-stone-800 text-stone-300"
                }`}
              >
                <div className="mb-0.5 font-medium text-stone-500">{msg.role ?? "user"}</div>
                {msg.content ?? msg.message ?? JSON.stringify(msg)}
              </div>
            ))}
          </div>
        </div>
      )}

      <a
        href={`https://wa.me/${lead.whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block w-full rounded bg-green-800 px-3 py-2 text-center text-xs font-medium text-green-100 hover:bg-green-700"
      >
        Open WhatsApp
      </a>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-stone-500">{label}</span>
      <span className="min-w-0 break-words text-right text-stone-300">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-stone-700 text-stone-300",
    contacted: "bg-blue-900 text-blue-300",
    qualified: "bg-purple-900 text-purple-300",
    proposal_sent: "bg-yellow-900 text-yellow-300",
    negotiating: "bg-orange-900 text-orange-300",
    booked: "bg-green-900 text-green-300",
    lost: "bg-red-900 text-red-400",
    unresponsive: "bg-stone-800 text-stone-500",
  };
  return (
    <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-stone-700 text-stone-300"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
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

function FilterTab({ label, value, active, onClick, count }: { label: string; value: string; active: string; onClick: (v: string) => void; count: number }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active === value ? "bg-stone-700 text-white" : "text-stone-400 hover:text-white"
      }`}
    >
      {label} <span className="ml-1 text-stone-500">{count}</span>
    </button>
  );
}
