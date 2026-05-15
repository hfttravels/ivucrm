"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AddLeadForm, AddPackageForm, QueueContentForm } from "./record-forms";

type Action = "lead" | "package" | "content" | "agent";

export default function QuickActions() {
  const [active, setActive] = useState<Action>("lead");
  const router = useRouter();

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <ActionButton label="Add Lead" value="lead" active={active} onClick={setActive} />
          <ActionButton label="Add Package" value="package" active={active} onClick={setActive} />
          <ActionButton label="Queue Content" value="content" active={active} onClick={setActive} />
          <ActionButton label="Run Agent" value="agent" active={active} onClick={setActive} />
        </div>
      </div>

      {active === "lead" ? (
        <AddLeadForm title="" onCreated={() => router.refresh()} />
      ) : null}
      {active === "package" ? (
        <AddPackageForm title="" onCreated={() => router.refresh()} />
      ) : null}
      {active === "content" ? (
        <QueueContentForm title="" onCreated={() => router.refresh()} />
      ) : null}
      {active === "agent" ? <RunAgentAction /> : null}
    </div>
  );
}

function RunAgentAction() {
  const [agentNumber, setAgentNumber] = useState("27");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/agents/${agentNumber}/run`, { method: "POST" });
      const payload = (await response.json()) as { error?: string; output?: string };

      if (!response.ok) {
        setError(payload.error ?? "Agent run failed");
        return;
      }

      setMessage(payload.output ? payload.output.slice(0, 240) : `Agent #${agentNumber} completed`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run agent");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="space-y-1 text-xs text-stone-400">
        Agent Number
        <input
          type="number"
          min="1"
          max="39"
          value={agentNumber}
          onChange={(event) => setAgentNumber(event.target.value)}
          className="mt-1 w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-stone-400 sm:w-36"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-stone-950 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Running..." : "Run Agent"}
      </button>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
      {message ? <span className="max-w-xl break-words text-xs text-green-300">{message}</span> : null}
    </form>
  );
}

function ActionButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: Action;
  active: Action;
  onClick: (value: Action) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active === value ? "bg-white text-stone-950" : "bg-stone-800 text-stone-300 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
