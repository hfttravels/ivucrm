"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Agent } from "@/db/schema";

type Props = {
  initialAgents: Agent[];
};

export default function AgentFeed({ initialAgents }: Props) {
  const [agents, setAgents] = useState(initialAgents);
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [running, setRunning] = useState<Record<number, boolean>>({});
  const router = useRouter();

  async function runAgent(agent: Agent) {
    setRunning((prev) => ({ ...prev, [agent.agentNumber]: true }));
    setFeedback((prev) => ({ ...prev, [agent.agentNumber]: "Running..." }));
    setAgents((prev) =>
      prev.map((item) =>
        item.id === agent.id ? { ...item, status: "running", lastRunAt: new Date() } : item
      )
    );

    try {
      const response = await fetch(`/api/agents/${agent.agentNumber}/run`, { method: "POST" });
      const payload = (await response.json()) as { error?: string; output?: string };

      if (!response.ok) {
        setFeedback((prev) => ({
          ...prev,
          [agent.agentNumber]: payload.error ?? "Agent run failed",
        }));
        setAgents((prev) =>
          prev.map((item) => (item.id === agent.id ? { ...item, status: "failed" } : item))
        );
        return;
      }

      setFeedback((prev) => ({
        ...prev,
        [agent.agentNumber]: payload.output ? payload.output.slice(0, 160) : "Completed",
      }));
      setAgents((prev) =>
        prev.map((item) => (item.id === agent.id ? { ...item, status: "completed" } : item))
      );
      router.refresh();
    } catch (error) {
      setFeedback((prev) => ({
        ...prev,
        [agent.agentNumber]: error instanceof Error ? error.message : "Could not run agent",
      }));
      setAgents((prev) =>
        prev.map((item) => (item.id === agent.id ? { ...item, status: "failed" } : item))
      );
    } finally {
      setRunning((prev) => ({ ...prev, [agent.agentNumber]: false }));
    }
  }

  const runningAgents = agents.filter((a) => a.status === "running");
  const failedAgents = agents.filter((a) => a.status === "failed");

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">Agent Status</h2>
        <div className="flex gap-4 text-sm">
          <span className="text-green-400">{runningAgents.length} running</span>
          <span className="text-red-400">{failedAgents.length} failed</span>
        </div>
      </div>

      <div className="max-h-[600px] space-y-2 overflow-y-auto">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-md border border-stone-800 bg-stone-950 p-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <StatusBadge status={agent.status} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    #{agent.agentNumber} {agent.name}
                  </div>
                  <div className="text-xs text-stone-500">{agent.category}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <div className="text-left text-xs text-stone-500 sm:text-right">
                  {agent.lastRunAt && (
                    <div>
                      Last run: {new Date(agent.lastRunAt).toLocaleTimeString("en-IN")}
                    </div>
                  )}
                  {agent.lastRunDurationMs && <div>{agent.lastRunDurationMs}ms</div>}
                </div>
                <button
                  type="button"
                  disabled={running[agent.agentNumber]}
                  onClick={() => runAgent(agent)}
                  className="rounded-md bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-200 hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {running[agent.agentNumber] ? "Running" : "Run"}
                </button>
              </div>
            </div>
            {feedback[agent.agentNumber] ? (
              <div className="mt-2 line-clamp-2 text-xs text-stone-500">
                {feedback[agent.agentNumber]}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Agent["status"] }) {
  const colors = {
    idle: "bg-stone-700 text-stone-300",
    running: "bg-green-900 text-green-300 animate-pulse",
    completed: "bg-blue-900 text-blue-300",
    failed: "bg-red-900 text-red-300",
    retrying: "bg-yellow-900 text-yellow-300",
  };

  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${colors[status]}`}
    >
      {status}
    </span>
  );
}
