"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ContentQueue, SocialPost } from "@/db/schema";

type Props = {
  initialQueue: ContentQueue[];
  initialPosts: SocialPost[];
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-900 text-pink-300",
  whatsapp: "bg-green-900 text-green-300",
  linkedin: "bg-blue-900 text-blue-300",
  website: "bg-stone-700 text-stone-300",
  email: "bg-yellow-900 text-yellow-300",
  meta_ads: "bg-blue-800 text-blue-200",
};

const TYPE_LABELS: Record<string, string> = {
  instagram_caption: "Caption",
  instagram_reel_script: "Reel Script",
  instagram_story: "Story",
  whatsapp_message: "WhatsApp",
  linkedin_post: "LinkedIn",
  email: "Email",
  pr_pitch: "PR Pitch",
  schema_markup: "Schema",
  blog_post: "Blog",
  newsletter: "Newsletter",
};

type Tab = "queue" | "scheduled" | "published";

export default function SocialControl({ initialQueue, initialPosts }: Props) {
  const [queue, setQueue] = useState(initialQueue);
  const [posts, setPosts] = useState(initialPosts);
  const [tab, setTab] = useState<Tab>("queue");
  const [expanded, setExpanded] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const ch = supabase.channel("social-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_queue" }, (p) => {
        if (p.eventType === "INSERT") setQueue((prev) => [p.new as ContentQueue, ...prev]);
        if (p.eventType === "UPDATE") setQueue((prev) => prev.map((c) => c.id === p.new.id ? p.new as ContentQueue : c));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_posts" }, (p) => {
        setPosts((prev) => [p.new as SocialPost, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase]);

  async function approve(id: string) {
    await fetch("/api/content/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }
  async function reject(id: string) {
    await fetch("/api/content/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, reason: "Rejected from Social page" }) });
  }

  const pending = queue.filter((c) => c.status === "pending_review");
  const scheduled = posts.filter((p) => p.scheduledAt && !p.postedAt);
  const published = posts.filter((p) => p.postedAt);

  // Stats
  const totalReach = published.reduce((s, p) => s + (p.reach ?? 0), 0);
  const totalLikes = published.reduce((s, p) => s + (p.likes ?? 0), 0);
  const avgEngagement = published.length
    ? Math.round(published.reduce((s, p) => s + (p.engagementScore ?? 0), 0) / published.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Pending Review" value={String(pending.length)} color="text-yellow-400" />
        <StatCard label="Scheduled" value={String(scheduled.length)} color="text-blue-400" />
        <StatCard label="Total Reach" value={totalReach > 0 ? `${(totalReach / 1000).toFixed(1)}K` : "—"} />
        <StatCard label="Total Likes" value={totalLikes > 0 ? String(totalLikes) : "—"} />
      </div>

      {/* Tabs */}
      <div className="flex w-full gap-1 overflow-x-auto rounded-lg border border-stone-800 bg-stone-900 p-1 sm:w-fit">
        {(["queue", "scheduled", "published"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${tab === t ? "bg-stone-700 text-white" : "text-stone-400 hover:text-white"}`}>
            {t === "queue" ? `Queue (${pending.length})` : t === "scheduled" ? `Scheduled (${scheduled.length})` : `Published (${published.length})`}
          </button>
        ))}
      </div>

      {/* Queue tab */}
      {tab === "queue" && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <Empty text="No content pending review" />
          ) : pending.map((item) => (
            <ContentCard key={item.id} item={item} expanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onApprove={() => approve(item.id)} onReject={() => reject(item.id)} />
          ))}
        </div>
      )}

      {/* Scheduled tab */}
      {tab === "scheduled" && (
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 sm:p-6">
          {scheduled.length === 0 ? <Empty text="No scheduled posts" /> : (
            <div className="space-y-2">
              {scheduled.sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                .map((post) => <ScheduledRow key={post.id} post={post} />)}
            </div>
          )}
        </div>
      )}

      {/* Published tab */}
      {tab === "published" && (
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-4 sm:p-6">
          {published.length === 0 ? <Empty text="No published posts yet" /> : (
            <div className="space-y-2">
              {published.sort((a, b) => new Date(b.postedAt!).getTime() - new Date(a.postedAt!).getTime())
                .map((post) => <PublishedRow key={post.id} post={post} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContentCard({ item, expanded, onToggle, onApprove, onReject }: {
  item: ContentQueue; expanded: boolean;
  onToggle: () => void; onApprove: () => void; onReject: () => void;
}) {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900">
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${PLATFORM_COLORS[item.platform] ?? "bg-stone-700 text-stone-300"}`}>
              {item.platform}
            </span>
            <span className="rounded bg-stone-800 px-1.5 py-0.5 text-xs text-stone-400">
              {TYPE_LABELS[item.type] ?? item.type}
            </span>
            <span className="min-w-0 max-w-full truncate text-sm text-stone-300">{item.content.slice(0, 80)}…</span>
          </div>
          <span className="shrink-0 text-xs text-stone-600">
            {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-800 p-4">
          <pre className="mb-4 whitespace-pre-wrap rounded bg-stone-950 p-3 text-sm text-stone-300 font-sans">
            {item.content}
          </pre>
          {meta.intent != null && (
            <div className="mb-3 text-xs text-stone-500">Intent: <span className="text-stone-300">{String(meta.intent)}</span></div>
          )}
          {meta.keyword != null && (
            <div className="mb-3 text-xs text-stone-500">Keyword: <span className="text-stone-300">{String(meta.keyword)}</span></div>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={onApprove} className="rounded bg-green-900 px-4 py-2 text-sm font-medium text-green-100 hover:bg-green-800">
              Approve
            </button>
            <button onClick={onReject} className="rounded bg-stone-800 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700">
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduledRow({ post }: { post: SocialPost }) {
  const scheduledAt = new Date(post.scheduledAt!);
  const isToday = scheduledAt.toDateString() === new Date().toDateString();
  return (
    <div className="flex flex-col gap-3 rounded border border-stone-800 bg-stone-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${PLATFORM_COLORS[post.platform] ?? "bg-stone-700 text-stone-300"}`}>
          {post.platform}
        </span>
        <span className="min-w-0 max-w-md truncate text-sm text-stone-300">{(post.caption ?? "").slice(0, 80)}…</span>
      </div>
      <div className="shrink-0 text-left text-xs sm:text-right">
        <div className={isToday ? "text-yellow-400 font-medium" : "text-stone-400"}>
          {isToday ? "Today" : scheduledAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </div>
        <div className="text-stone-600">{scheduledAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
    </div>
  );
}

function PublishedRow({ post }: { post: SocialPost }) {
  return (
    <div className="flex flex-col gap-3 rounded border border-stone-800 bg-stone-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${PLATFORM_COLORS[post.platform] ?? "bg-stone-700 text-stone-300"}`}>
          {post.platform}
        </span>
        <span className="min-w-0 max-w-sm truncate text-sm text-stone-300">{(post.caption ?? "").slice(0, 70)}…</span>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
        {(post.likes ?? 0) > 0 && <span>❤️ {post.likes}</span>}
        {(post.reach ?? 0) > 0 && <span>👁 {post.reach}</span>}
        {(post.comments ?? 0) > 0 && <span>💬 {post.comments}</span>}
        <span className="text-stone-600">{new Date(post.postedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
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

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-stone-500">{text}</p>;
}
