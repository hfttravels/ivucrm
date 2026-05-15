"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/db/schema";

type Props = {
  initialNotifications: Notification[];
};

export default function NotificationsPanel({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function markAsRead(id: string) {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Notifications</h2>

      <div className="max-h-[600px] space-y-2 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-sm text-stone-500 py-8">No new notifications</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-md border p-3 ${
                notif.isRead
                  ? "border-stone-800 bg-stone-950"
                  : "border-yellow-900/50 bg-yellow-950/10"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={notif.priority} />
                    <span className="text-xs text-stone-500">{notif.type}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-white">{notif.title}</div>
                  <div className="mt-1 text-xs text-stone-400">{notif.message}</div>
                  <div className="mt-2 text-xs text-stone-600">
                    {new Date(notif.createdAt).toLocaleString("en-IN")}
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="self-start text-xs text-stone-500 hover:text-white sm:self-auto"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Notification["priority"] }) {
  const colors = {
    low: "bg-stone-700 text-stone-300",
    medium: "bg-blue-900 text-blue-300",
    high: "bg-yellow-900 text-yellow-300",
    critical: "bg-red-900 text-red-300",
  };

  return (
    <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${colors[priority]}`}>
      {priority}
    </span>
  );
}
