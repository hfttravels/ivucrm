import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().default("postgresql://placeholder"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().default("https://placeholder.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default("placeholder"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default("placeholder"),

  // AI Models
  ANTHROPIC_API_KEY: z.string().default("placeholder"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().default("placeholder"),
  OPENAI_API_KEY: z.string().default("placeholder"),

  // Meta / Instagram
  META_APP_ID: z.string().default("placeholder"),
  META_APP_SECRET: z.string().default("placeholder"),
  META_ACCESS_TOKEN: z.string().default("placeholder"),
  META_AD_ACCOUNT_ID: z.string().default("placeholder"),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().default("placeholder"),

  // WhatsApp Business API
  WHATSAPP_API_TOKEN: z.string().default("placeholder"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default("placeholder"),
  FOUNDER_WHATSAPP_NUMBER: z.string().default("placeholder"),

  // Google
  GOOGLE_ANALYTICS_PROPERTY_ID: z.string().default("placeholder"),
  GOOGLE_SEARCH_CONSOLE_SITE_URL: z.string().default("https://placeholder.com"),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().default("placeholder@placeholder.com"),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().default("placeholder"),

  // Sanity CMS
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().default("placeholder"),
  NEXT_PUBLIC_SANITY_DATASET: z.string().default("production"),
  SANITY_API_TOKEN: z.string().default("placeholder"),

  // n8n
  N8N_WEBHOOK_SECRET: z.string().default("placeholder"),
  N8N_BASE_URL: z.string().default("https://placeholder.com"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. Check your .env file.");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
