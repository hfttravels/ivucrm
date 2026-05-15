import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Prevent multiple instances in development (Next.js hot reload)
const globalForDb = globalThis as unknown as { _pgClient: postgres.Sql | undefined };

const client = globalForDb._pgClient ?? postgres(env.DATABASE_URL, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb._pgClient = client;
}

export const db = drizzle(client, { schema });
export type DB = typeof db;
