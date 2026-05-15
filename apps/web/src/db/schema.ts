import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const agentStatusEnum = pgEnum("agent_status", [
  "idle",
  "running",
  "completed",
  "failed",
  "retrying",
]);

export const agentCategoryEnum = pgEnum("agent_category", [
  "seo_content",
  "technical_conversion",
  "social_media",
  "lead_crm",
  "ads_intelligence",
  "pricing_revenue",
  "operations",
  "email_nurture",
  "pr_brand",
  "research_intelligence",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "booked",
  "lost",
  "unresponsive",
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "instagram_dm",
  "instagram_bio_link",
  "whatsapp",
  "website",
  "referral",
  "google_organic",
  "meta_ad",
  "other",
]);

export const packageStatusEnum = pgEnum("package_status", [
  "draft",
  "active",
  "filling_fast",
  "sold_out",
  "completed",
  "cancelled",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "pending_review",
  "approved",
  "rejected",
  "published",
  "scheduled",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "blog_post",
  "instagram_caption",
  "instagram_reel_script",
  "instagram_story",
  "whatsapp_message",
  "email",
  "meta_ad_copy",
  "schema_markup",
  "itinerary",
  "newsletter",
  "pr_pitch",
  "linkedin_post",
]);

export const platformEnum = pgEnum("platform", [
  "website",
  "instagram",
  "whatsapp",
  "email",
  "meta_ads",
  "linkedin",
  "reddit",
  "google_business",
]);

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "agent_error",
  "approval_required",
  "lead_alert",
  "fill_rate_alert",
  "competitor_alert",
  "price_change",
  "booking_confirmed",
  "system",
]);

// ─── Table 1: agents ──────────────────────────────────────────────────────────

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentNumber: integer("agent_number").notNull().unique(),
    name: text("name").notNull(),
    category: agentCategoryEnum("category").notNull(),
    status: agentStatusEnum("status").notNull().default("idle"),
    scheduleExpression: text("schedule_expression"),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    lastRunDurationMs: integer("last_run_duration_ms"),
    retryCount: integer("retry_count").notNull().default(0),
    outputLog: jsonb("output_log"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("agents_status_idx").on(t.status),
    categoryIdx: index("agents_category_idx").on(t.category),
  })
);

// ─── Table 2: leads ───────────────────────────────────────────────────────────

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    whatsappNumber: text("whatsapp_number").notNull(),
    email: text("email"),
    source: leadSourceEnum("source").notNull(),
    destinationInterest: text("destination_interest"),
    packageId: uuid("package_id").references(() => packages.id, { onDelete: "set null" }),
    budget: integer("budget"),
    groupSize: integer("group_size"),
    travelMonth: text("travel_month"),
    status: leadStatusEnum("status").notNull().default("new"),
    score: integer("score").notNull().default(0),
    conversationHistory: jsonb("conversation_history").default([]),
    notes: text("notes"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("leads_status_idx").on(t.status),
    scoreIdx: index("leads_score_idx").on(t.score),
    whatsappIdx: index("leads_whatsapp_idx").on(t.whatsappNumber),
    sourceIdx: index("leads_source_idx").on(t.source),
  })
);

// ─── Table 3: packages ────────────────────────────────────────────────────────

export const packages = pgTable(
  "packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    destination: text("destination").notNull(),
    title: text("title").notNull(),
    priceMin: integer("price_min").notNull(),
    priceMax: integer("price_max").notNull(),
    seatsTotal: integer("seats_total").notNull(),
    seatsFilled: integer("seats_filled").notNull().default(0),
    departureDate: timestamp("departure_date", { withTimezone: true }).notNull(),
    returnDate: timestamp("return_date", { withTimezone: true }).notNull(),
    status: packageStatusEnum("status").notNull().default("draft"),
    itineraryJson: jsonb("itinerary_json"),
    highlights: jsonb("highlights").default([]),
    inclusions: jsonb("inclusions").default([]),
    exclusions: jsonb("exclusions").default([]),
    sanityDocumentId: text("sanity_document_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("packages_status_idx").on(t.status),
    destinationIdx: index("packages_destination_idx").on(t.destination),
    departureIdx: index("packages_departure_idx").on(t.departureDate),
  })
);

// ─── Table 4: content_queue ───────────────────────────────────────────────────

export const contentQueue = pgTable(
  "content_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    type: contentTypeEnum("type").notNull(),
    platform: platformEnum("platform").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").default({}),
    status: contentStatusEnum("status").notNull().default("pending_review"),
    packageId: uuid("package_id").references(() => packages.id, { onDelete: "set null" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("content_queue_status_idx").on(t.status),
    platformIdx: index("content_queue_platform_idx").on(t.platform),
    scheduledIdx: index("content_queue_scheduled_idx").on(t.scheduledAt),
  })
);

// ─── Table 5: seo_reports ─────────────────────────────────────────────────────

export const seoReports = pgTable(
  "seo_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    keyword: text("keyword").notNull(),
    pageUrl: text("page_url").notNull(),
    position: numeric("position", { precision: 5, scale: 1 }),
    previousPosition: numeric("previous_position", { precision: 5, scale: 1 }),
    positionChange: numeric("position_change", { precision: 5, scale: 1 }),
    impressions: integer("impressions"),
    clicks: integer("clicks"),
    ctr: numeric("ctr", { precision: 5, scale: 4 }),
    searchVolume: integer("search_volume"),
    difficulty: integer("difficulty"),
    intent: text("intent"),
    isTargetKeyword: boolean("is_target_keyword").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    keywordIdx: index("seo_reports_keyword_idx").on(t.keyword),
    positionIdx: index("seo_reports_position_idx").on(t.position),
    urlIdx: index("seo_reports_url_idx").on(t.pageUrl),
  })
);

// ─── Table 6: competitor_ads ──────────────────────────────────────────────────

export const competitorAds = pgTable(
  "competitor_ads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brand: text("brand").notNull(),
    platform: platformEnum("platform").notNull(),
    creativeUrl: text("creative_url"),
    copy: text("copy"),
    headline: text("headline"),
    callToAction: text("call_to_action"),
    destinationTagged: text("destination_tagged"),
    estimatedBudgetTier: text("estimated_budget_tier"),
    firstSeen: timestamp("first_seen", { withTimezone: true }).notNull(),
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull(),
    durationDays: integer("duration_days").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    rawData: jsonb("raw_data").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    brandIdx: index("competitor_ads_brand_idx").on(t.brand),
    activeIdx: index("competitor_ads_active_idx").on(t.isActive),
    destinationIdx: index("competitor_ads_destination_idx").on(t.destinationTagged),
  })
);

// ─── Table 7: meta_ad_performance ─────────────────────────────────────────────

export const metaAdPerformance = pgTable(
  "meta_ad_performance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adId: text("ad_id").notNull(),
    adSetId: text("ad_set_id"),
    campaignId: text("campaign_id"),
    campaignName: text("campaign_name"),
    adName: text("ad_name"),
    impressions: integer("impressions").notNull().default(0),
    reach: integer("reach").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    ctr: numeric("ctr", { precision: 6, scale: 4 }),
    cpc: numeric("cpc", { precision: 8, scale: 2 }),
    cpl: numeric("cpl", { precision: 8, scale: 2 }),
    spend: numeric("spend", { precision: 10, scale: 2 }).notNull().default("0"),
    roas: numeric("roas", { precision: 6, scale: 2 }),
    frequency: numeric("frequency", { precision: 5, scale: 2 }),
    hookRate: numeric("hook_rate", { precision: 5, scale: 4 }),
    holdRate: numeric("hold_rate", { precision: 5, scale: 4 }),
    leads: integer("leads").notNull().default(0),
    packageId: uuid("package_id").references(() => packages.id, { onDelete: "set null" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    dateStart: timestamp("date_start", { withTimezone: true }),
    dateStop: timestamp("date_stop", { withTimezone: true }),
  },
  (t) => ({
    adIdIdx: index("meta_ad_perf_ad_id_idx").on(t.adId),
    campaignIdx: index("meta_ad_perf_campaign_idx").on(t.campaignId),
    recordedIdx: index("meta_ad_perf_recorded_idx").on(t.recordedAt),
  })
);

// ─── Table 8: social_posts ────────────────────────────────────────────────────

export const socialPosts = pgTable(
  "social_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: platformEnum("platform").notNull(),
    caption: text("caption"),
    hashtags: jsonb("hashtags").default([]),
    mediaUrls: jsonb("media_urls").default([]),
    contentQueueId: uuid("content_queue_id").references(() => contentQueue.id, {
      onDelete: "set null",
    }),
    packageId: uuid("package_id").references(() => packages.id, { onDelete: "set null" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    platformPostId: text("platform_post_id"),
    engagementScore: integer("engagement_score").default(0),
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
    shares: integer("shares").default(0),
    reach: integer("reach").default(0),
    saves: integer("saves").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    platformIdx: index("social_posts_platform_idx").on(t.platform),
    scheduledIdx: index("social_posts_scheduled_idx").on(t.scheduledAt),
    postedIdx: index("social_posts_posted_idx").on(t.postedAt),
  })
);

// ─── Table 9: notifications ───────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    type: notificationTypeEnum("type").notNull(),
    priority: notificationPriorityEnum("priority").notNull().default("medium"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    actionUrl: text("action_url"),
    relatedEntityId: uuid("related_entity_id"),
    relatedEntityType: text("related_entity_type"),
    isRead: boolean("is_read").notNull().default(false),
    isActioned: boolean("is_actioned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    priorityIdx: index("notifications_priority_idx").on(t.priority),
    isReadIdx: index("notifications_is_read_idx").on(t.isRead),
    typeIdx: index("notifications_type_idx").on(t.type),
    createdIdx: index("notifications_created_idx").on(t.createdAt),
  })
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const agentsRelations = relations(agents, ({ many }) => ({
  contentQueue: many(contentQueue),
  notifications: many(notifications),
}));

export const packagesRelations = relations(packages, ({ many }) => ({
  leads: many(leads),
  contentQueue: many(contentQueue),
  metaAdPerformance: many(metaAdPerformance),
  socialPosts: many(socialPosts),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  package: one(packages, { fields: [leads.packageId], references: [packages.id] }),
}));

export const contentQueueRelations = relations(contentQueue, ({ one, many }) => ({
  agent: one(agents, { fields: [contentQueue.agentId], references: [agents.id] }),
  package: one(packages, { fields: [contentQueue.packageId], references: [packages.id] }),
  socialPost: many(socialPosts),
}));

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  contentQueue: one(contentQueue, {
    fields: [socialPosts.contentQueueId],
    references: [contentQueue.id],
  }),
  package: one(packages, { fields: [socialPosts.packageId], references: [packages.id] }),
}));

export const metaAdPerformanceRelations = relations(metaAdPerformance, ({ one }) => ({
  package: one(packages, { fields: [metaAdPerformance.packageId], references: [packages.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  agent: one(agents, { fields: [notifications.agentId], references: [agents.id] }),
}));

// ─── Exported Types ───────────────────────────────────────────────────────────

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;
export type ContentQueue = typeof contentQueue.$inferSelect;
export type NewContentQueue = typeof contentQueue.$inferInsert;
export type SeoReport = typeof seoReports.$inferSelect;
export type NewSeoReport = typeof seoReports.$inferInsert;
export type CompetitorAd = typeof competitorAds.$inferSelect;
export type NewCompetitorAd = typeof competitorAds.$inferInsert;
export type MetaAdPerformance = typeof metaAdPerformance.$inferSelect;
export type NewMetaAdPerformance = typeof metaAdPerformance.$inferInsert;
export type SocialPost = typeof socialPosts.$inferSelect;
export type NewSocialPost = typeof socialPosts.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
