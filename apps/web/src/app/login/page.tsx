import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;

  async function signIn(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect(params.redirect || "/admin/crm");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Hassle Free Travels</h1>
          <p className="mt-2 text-sm text-stone-400">CRM Command Center</p>
        </div>

        <form action={signIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-white placeholder-stone-500 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              placeholder="founder@hasslefreetravels.in"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-white placeholder-stone-500 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              placeholder="••••••••"
            />
          </div>

          {params.error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-center">
              <p className="text-sm text-red-400">{params.error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-stone-950"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}
