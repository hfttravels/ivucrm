import { db } from "@/db";
import {
  contentQueue,
  contentTypeEnum,
  platformEnum,
  type ContentQueue,
} from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const queueContentSchema = z.object({
  type: z.enum(contentTypeEnum.enumValues as [ContentQueue["type"], ...ContentQueue["type"][]]),
  platform: z.enum(platformEnum.enumValues as [ContentQueue["platform"], ...ContentQueue["platform"][]]),
  content: z.string().trim().min(1, "Content is required"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = queueContentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid content details", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [item] = await db
    .insert(contentQueue)
    .values({
      type: parsed.data.type,
      platform: parsed.data.platform,
      content: parsed.data.content,
      metadata: {},
      status: "pending_review",
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ success: true, content: item }, { status: 201 });
}
