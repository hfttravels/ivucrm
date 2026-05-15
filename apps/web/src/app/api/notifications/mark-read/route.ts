import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { id } = await request.json();

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));

  return NextResponse.json({ success: true });
}
