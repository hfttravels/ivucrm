import Link from "next/link";

const navItems = [
  { href: "/admin/crm", label: "Command Center" },
  { href: "/admin/crm/seo", label: "SEO Intelligence" },
  { href: "/admin/crm/ads", label: "Meta Ads Hub" },
  { href: "/admin/crm/social", label: "Social Media" },
  { href: "/admin/crm/leads", label: "Lead Pipeline" },
  { href: "/admin/crm/packages", label: "Packages" },
  { href: "/admin/crm/competitors", label: "Competitor Radar" },
  { href: "/admin/crm/reports", label: "Reports" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-950 lg:flex-row">
      <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-base font-bold text-white">HFT CRM</h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} mobile />
          ))}
        </nav>
      </header>

      <aside className="hidden w-64 shrink-0 border-r border-stone-800 bg-stone-900 lg:block">
        <div className="flex h-16 items-center border-b border-stone-800 px-6">
          <h1 className="text-lg font-bold text-white">HFT CRM</h1>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

function NavLink({ href, label, mobile = false }: { href: string; label: string; mobile?: boolean }) {
  return (
    <Link
      href={href}
      className={
        mobile
          ? "whitespace-nowrap rounded-md bg-stone-900 px-3 py-2 text-xs font-medium text-stone-300 hover:bg-stone-800 hover:text-white"
          : "block rounded-md px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white"
      }
    >
      {label}
    </Link>
  );
}
