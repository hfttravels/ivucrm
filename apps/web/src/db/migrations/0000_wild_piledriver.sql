DO $$ BEGIN
 CREATE TYPE "public"."agent_category" AS ENUM('seo_content', 'technical_conversion', 'social_media', 'lead_crm', 'ads_intelligence', 'pricing_revenue', 'operations', 'email_nurture', 'pr_brand', 'research_intelligence');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."agent_status" AS ENUM('idle', 'running', 'completed', 'failed', 'retrying');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."content_status" AS ENUM('pending_review', 'approved', 'rejected', 'published', 'scheduled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."content_type" AS ENUM('blog_post', 'instagram_caption', 'instagram_reel_script', 'instagram_story', 'whatsapp_message', 'email', 'meta_ad_copy', 'schema_markup', 'itinerary', 'newsletter', 'pr_pitch', 'linkedin_post');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."lead_source" AS ENUM('instagram_dm', 'instagram_bio_link', 'whatsapp', 'website', 'referral', 'google_organic', 'meta_ad', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'booked', 'lost', 'unresponsive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_priority" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('agent_error', 'approval_required', 'lead_alert', 'fill_rate_alert', 'competitor_alert', 'price_change', 'booking_confirmed', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."package_status" AS ENUM('draft', 'active', 'filling_fast', 'sold_out', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."platform" AS ENUM('website', 'instagram', 'whatsapp', 'email', 'meta_ads', 'linkedin', 'reddit', 'google_business');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_number" integer NOT NULL,
	"name" text NOT NULL,
	"category" "agent_category" NOT NULL,
	"status" "agent_status" DEFAULT 'idle' NOT NULL,
	"schedule_expression" text,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"last_run_duration_ms" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"output_log" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_agent_number_unique" UNIQUE("agent_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "competitor_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" text NOT NULL,
	"platform" "platform" NOT NULL,
	"creative_url" text,
	"copy" text,
	"headline" text,
	"call_to_action" text,
	"destination_tagged" text,
	"estimated_budget_tier" text,
	"first_seen" timestamp with time zone NOT NULL,
	"last_seen" timestamp with time zone NOT NULL,
	"duration_days" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"raw_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"type" "content_type" NOT NULL,
	"platform" "platform" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" "content_status" DEFAULT 'pending_review' NOT NULL,
	"package_id" uuid,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"whatsapp_number" text NOT NULL,
	"email" text,
	"source" "lead_source" NOT NULL,
	"destination_interest" text,
	"package_id" uuid,
	"budget" integer,
	"group_size" integer,
	"travel_month" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"conversation_history" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"assigned_at" timestamp with time zone,
	"last_contacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meta_ad_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" text NOT NULL,
	"ad_set_id" text,
	"campaign_id" text,
	"campaign_name" text,
	"ad_name" text,
	"impressions" integer DEFAULT 0 NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"ctr" numeric(6, 4),
	"cpc" numeric(8, 2),
	"cpl" numeric(8, 2),
	"spend" numeric(10, 2) DEFAULT '0' NOT NULL,
	"roas" numeric(6, 2),
	"frequency" numeric(5, 2),
	"hook_rate" numeric(5, 4),
	"hold_rate" numeric(5, 4),
	"leads" integer DEFAULT 0 NOT NULL,
	"package_id" uuid,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"date_start" timestamp with time zone,
	"date_stop" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"type" "notification_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"related_entity_id" uuid,
	"related_entity_type" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_actioned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"destination" text NOT NULL,
	"title" text NOT NULL,
	"price_min" integer NOT NULL,
	"price_max" integer NOT NULL,
	"seats_total" integer NOT NULL,
	"seats_filled" integer DEFAULT 0 NOT NULL,
	"departure_date" timestamp with time zone NOT NULL,
	"return_date" timestamp with time zone NOT NULL,
	"status" "package_status" DEFAULT 'draft' NOT NULL,
	"itinerary_json" jsonb,
	"highlights" jsonb DEFAULT '[]'::jsonb,
	"inclusions" jsonb DEFAULT '[]'::jsonb,
	"exclusions" jsonb DEFAULT '[]'::jsonb,
	"sanity_document_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seo_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"page_url" text NOT NULL,
	"position" numeric(5, 1),
	"previous_position" numeric(5, 1),
	"position_change" numeric(5, 1),
	"impressions" integer,
	"clicks" integer,
	"ctr" numeric(5, 4),
	"search_volume" integer,
	"difficulty" integer,
	"intent" text,
	"is_target_keyword" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"caption" text,
	"hashtags" jsonb DEFAULT '[]'::jsonb,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"content_queue_id" uuid,
	"package_id" uuid,
	"scheduled_at" timestamp with time zone,
	"posted_at" timestamp with time zone,
	"platform_post_id" text,
	"engagement_score" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_queue" ADD CONSTRAINT "content_queue_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_queue" ADD CONSTRAINT "content_queue_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meta_ad_performance" ADD CONSTRAINT "meta_ad_performance_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_content_queue_id_content_queue_id_fk" FOREIGN KEY ("content_queue_id") REFERENCES "public"."content_queue"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_status_idx" ON "agents" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_category_idx" ON "agents" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "competitor_ads_brand_idx" ON "competitor_ads" ("brand");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "competitor_ads_active_idx" ON "competitor_ads" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "competitor_ads_destination_idx" ON "competitor_ads" ("destination_tagged");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_queue_status_idx" ON "content_queue" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_queue_platform_idx" ON "content_queue" ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_queue_scheduled_idx" ON "content_queue" ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_score_idx" ON "leads" ("score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_whatsapp_idx" ON "leads" ("whatsapp_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_source_idx" ON "leads" ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meta_ad_perf_ad_id_idx" ON "meta_ad_performance" ("ad_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meta_ad_perf_campaign_idx" ON "meta_ad_performance" ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meta_ad_perf_recorded_idx" ON "meta_ad_performance" ("recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_priority_idx" ON "notifications" ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_idx" ON "notifications" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "packages_status_idx" ON "packages" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "packages_destination_idx" ON "packages" ("destination");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "packages_departure_idx" ON "packages" ("departure_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_reports_keyword_idx" ON "seo_reports" ("keyword");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_reports_position_idx" ON "seo_reports" ("position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_reports_url_idx" ON "seo_reports" ("page_url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_posts_platform_idx" ON "social_posts" ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_posts_scheduled_idx" ON "social_posts" ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_posts_posted_idx" ON "social_posts" ("posted_at");