import { db } from "@/db";
import { packages } from "@/db/schema";
import { asc } from "drizzle-orm";
import PackagesTable from "@/components/crm/packages-table";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const allPackages = await db
    .select()
    .from(packages)
    .orderBy(asc(packages.departureDate))
    .catch((error) => {
      console.error("Package data unavailable:", error);
      return [];
    });

  return (
    <div className="min-h-dvh overflow-x-hidden bg-stone-950 px-4 py-5 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Package Manager</h1>
        <p className="mt-1 text-stone-400">Fill rates, pricing, and seat availability — live</p>
      </div>

      <PackagesTable initialPackages={allPackages} />
    </div>
  );
}
