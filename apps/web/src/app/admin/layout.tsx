import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-stone-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-stone-800 bg-stone-900">
        <div className="flex h-16 items-center border-b border-stone-800 px-6">
          <h1 className="text-lg font-bold text-white">HFT CRM</h1>
        </div>

        <nav className="space-y-1 p-4">
          <NavLink href="/admin/crm" label="Command Center" />
          <NavLink href="/admin/crm/seo" label="SEO Intelligence" />
          <NavLink href="/admin/crm/ads" label="Meta Ads Hub" />
          <NavLink href="/admin/crm/social" label="Social Media" />
          <NavLink href="/admin/crm/leads" label="Lead Pipeline" />
          <NavLink href="/admin/crm/packages" label="Packages" />
          <NavLink href="/admin/crm/competitors" label="Competitor Radar" />
          <NavLink href="/admin/crm/reports" label="Reports" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white"
    >
      {label}
    </Link>
  );
}
