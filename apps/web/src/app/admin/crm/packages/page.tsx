import { db } from "@/db";
import { packages } from "@/db/schema";
import { asc } from "drizzle-orm";
import PackagesTable from "@/components/crm/packages-table";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const allPackages = await db
    .select()
    .from(packages)
    .orderBy(asc(packages.departureDate));

  return (
    <div className="h-screen overflow-y-auto bg-stone-950 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Package Manager</h1>
        <p className="mt-1 text-stone-400">Fill rates, pricing, and seat availability — live</p>
      </div>

      <PackagesTable initialPackages={allPackages} />
    </div>
  );
}
