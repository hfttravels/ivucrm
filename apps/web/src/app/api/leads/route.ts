import { db } from "@/db";
import { leadSourceEnum, leads, type Lead } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email("Enter a valid email address").optional()
);

const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().positive().optional()
);

const createLeadSchema = z.object({
  whatsappNumber: z.string().trim().min(1, "WhatsApp number is required"),
  source: z.enum(leadSourceEnum.enumValues as [Lead["source"], ...Lead["source"][]]),
  name: optionalText,
  email: optionalEmail,
  destination: optionalText,
  budget: optionalPositiveInt,
  groupSize: optionalPositiveInt,
  travelMonth: optionalText,
  notes: optionalText,
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid lead details", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [lead] = await db
    .insert(leads)
    .values({
      whatsappNumber: parsed.data.whatsappNumber,
      source: parsed.data.source,
      name: parsed.data.name,
      email: parsed.data.email,
      destinationInterest: parsed.data.destination,
      budget: parsed.data.budget,
      groupSize: parsed.data.groupSize,
      travelMonth: parsed.data.travelMonth,
      notes: parsed.data.notes,
      status: "new",
      score: 0,
      conversationHistory: [],
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ success: true, lead }, { status: 201 });
}
