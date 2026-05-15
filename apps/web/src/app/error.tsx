"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-white">
      <div className="max-w-md">
        <p className="text-sm font-medium text-red-300">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-bold">The CRM could not load this view.</h1>
        <p className="mt-3 text-sm text-stone-400">{error.message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded bg-white px-4 py-2 text-sm font-medium text-stone-950 hover:bg-stone-200"
          >
            Try again
          </button>
          <Link
            href="/admin/crm"
            className="rounded border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 hover:bg-stone-900"
          >
            Command Center
          </Link>
        </div>
      </div>
    </main>
  );
}
