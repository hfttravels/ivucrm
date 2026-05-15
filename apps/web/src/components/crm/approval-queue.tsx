"use client";

import { useState } from "react";
import type { ContentQueue } from "@/db/schema";
import { QueueContentForm } from "./record-forms";

type Props = {
  initialContent: ContentQueue[];
};

export default function ApprovalQueue({ initialContent }: Props) {
  const [queue, setQueue] = useState(initialContent);

  async function handleApprove(id: string) {
    const response = await fetch("/api/content/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setQueue((prev) => prev.filter((item) => item.id !== id));
    }
  }

  async function handleReject(id: string, reason: string) {
    const response = await fetch("/api/content/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reason }),
    });

    if (response.ok) {
      setQueue((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">Approval Queue</h2>
        <span className="text-sm text-stone-400">{queue.length} pending</span>
      </div>

      {queue.length === 0 ? (
        <div className="space-y-4">
          <p className="text-center text-sm text-stone-500 py-4">No items pending approval</p>
          <QueueContentForm
            title=""
            onCreated={(item) => setQueue((prev) => [item, ...prev])}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <QueueContentForm
            title=""
            onCreated={(item) => setQueue((prev) => [item, ...prev])}
          />
          {queue.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onApprove={() => handleApprove(item.id)}
              onReject={(reason) => handleReject(item.id, reason)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentCard({
  item,
  onApprove,
  onReject,
}: {
  item: ContentQueue;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <div className="rounded-md border border-stone-800 bg-stone-950 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-stone-800 px-2 py-1 text-xs font-medium text-stone-300">
              {item.type}
            </span>
            <span className="text-xs text-stone-500">{item.platform}</span>
          </div>
          <div className="mt-1 text-xs text-stone-600">
            {new Date(item.createdAt).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="mb-4 rounded bg-stone-900 p-3 text-sm text-stone-300 whitespace-pre-wrap">
        {item.content}
      </div>

      {item.metadata && typeof item.metadata === "object" && Object.keys(item.metadata as Record<string, unknown>).length > 0 ? (
        <div className="mb-4 text-xs text-stone-500">
          <strong>Metadata:</strong> {JSON.stringify(item.metadata, null, 2)}
        </div>
      ) : null}

      {showRejectInput ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white placeholder-stone-500"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (rejectReason.trim()) {
                  onReject(rejectReason);
                  setShowRejectInput(false);
                  setRejectReason("");
                }
              }}
              className="rounded bg-red-900 px-3 py-1.5 text-sm text-red-100 hover:bg-red-800"
            >
              Confirm Reject
            </button>
            <button
              onClick={() => setShowRejectInput(false)}
              className="rounded bg-stone-800 px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onApprove}
            className="rounded bg-green-900 px-4 py-2 text-sm font-medium text-green-100 hover:bg-green-800"
          >
            Approve
          </button>
          <button
            onClick={() => setShowRejectInput(true)}
            className="rounded bg-stone-800 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
