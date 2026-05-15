import { db } from "@/db";
import { contentQueue } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { id, reason } = await request.json();

  await db
    .update(contentQueue)
    .set({
      status: "rejected",
      reviewedBy: "founder",
      reviewedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(contentQueue.id, id));

  return NextResponse.json({ success: true });
}
