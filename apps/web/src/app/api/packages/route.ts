import { db } from "@/db";
import { packages } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const dateSchema = z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), {
  message: "Enter a valid date",
});

const createPackageSchema = z
  .object({
    slug: z.string().trim().min(1, "Slug is required"),
    destination: z.string().trim().min(1, "Destination is required"),
    title: z.string().trim().min(1, "Title is required"),
    priceMin: z.coerce.number().int().positive("Minimum price must be positive"),
    priceMax: z.coerce.number().int().positive("Maximum price must be positive"),
    seatsTotal: z.coerce.number().int().positive("Seats must be positive"),
    departureDate: dateSchema,
    returnDate: dateSchema,
  })
  .refine((data) => data.priceMax >= data.priceMin, {
    message: "Maximum price must be greater than or equal to minimum price",
    path: ["priceMax"],
  })
  .refine((data) => data.returnDate >= data.departureDate, {
    message: "Return date must be after departure date",
    path: ["returnDate"],
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createPackageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid package details", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const [pkg] = await db
      .insert(packages)
      .values({
        slug: parsed.data.slug,
        destination: parsed.data.destination,
        title: parsed.data.title,
        priceMin: parsed.data.priceMin,
        priceMax: parsed.data.priceMax,
        seatsTotal: parsed.data.seatsTotal,
        seatsFilled: 0,
        departureDate: parsed.data.departureDate,
        returnDate: parsed.data.returnDate,
        status: "draft",
        highlights: [],
        inclusions: [],
        exclusions: [],
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, package: pkg }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create package";
    const isUniqueError = message.includes("duplicate key") || message.includes("unique");

    return NextResponse.json(
      { error: isUniqueError ? "A package with this slug already exists" : message },
      { status: isUniqueError ? 409 : 500 }
    );
  }
}
