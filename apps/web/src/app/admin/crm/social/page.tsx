import { db } from "@/db";
import { contentQueue, socialPosts } from "@/db/schema";
import { desc, eq, or } from "drizzle-orm";
import SocialControl from "@/components/crm/social-control";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const [queue, posts] = await Promise.all([
    db.select().from(contentQueue)
      .where(
        or(
          eq(contentQueue.status, "pending_review"),
          eq(contentQueue.status, "approved"),
          eq(contentQueue.status, "scheduled"),
        )
      )
      .orderBy(desc(contentQueue.createdAt))
      .limit(50),
    db.select().from(socialPosts)
      .orderBy(desc(socialPosts.createdAt))
      .limit(50),
  ]).catch((error) => {
    console.error("Social data unavailable:", error);
    return [[], []];
  });

  return (
    <div className="min-h-dvh overflow-x-hidden bg-stone-950 px-4 py-5 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Social Media Control</h1>
        <p className="mt-1 text-stone-400">Content queue, scheduled posts, and engagement analytics</p>
      </div>
      <SocialControl initialQueue={queue} initialPosts={posts} />
    </div>
  );
}
