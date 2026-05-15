import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-white">
      <div className="max-w-md">
        <p className="text-sm font-medium text-stone-500">404</p>
        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm text-stone-400">
          This route is not available in the CRM.
        </p>
        <Link
          href="/admin/crm"
          className="mt-6 inline-flex rounded bg-white px-4 py-2 text-sm font-medium text-stone-950 hover:bg-stone-200"
        >
          Command Center
        </Link>
      </div>
    </main>
  );
}
