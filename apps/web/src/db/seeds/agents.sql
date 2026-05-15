-- Seed: Register all 39 agents in the agents table
-- Run once after drizzle-kit migrate
-- Cron expressions in UTC (IST = UTC+5:30)

INSERT INTO agents (agent_number, name, category, status, schedule_expression, is_active) VALUES

-- SEO & Content Intelligence (1–10)
(1,  'SEO Strategist',               'seo_content',           'idle', '30 18 * * *',   true),
(2,  'Keyword Researcher',           'seo_content',           'idle', '0 */6 * * *',   true),
(3,  'Content Optimiser',            'seo_content',           'idle', '30 18 * * *',   true),
(4,  'Technical SEO Agent',          'seo_content',           'idle', '0 */12 * * *',  true),
(5,  'AEO Specialist',               'seo_content',           'idle', '30 18 * * *',   true),
(6,  'GEO Specialist',               'seo_content',           'idle', '30 18 * * 0',   true),
(7,  'Link Building Manager',        'seo_content',           'idle', '30 18 */2 * *', true),
(8,  'Analytics Manager',            'seo_content',           'idle', '0 */12 * * *',  true),
(9,  'Competitor Intel Agent',       'seo_content',           'idle', '0 * * * *',     true),
(10, 'AI Content Auditor',           'seo_content',           'idle', '30 18 * * *',   true),

-- Technical & Conversion (11–13)
(11, 'Schema Markup Engineer',       'technical_conversion',  'idle', '30 18 */2 * *', true),
(12, 'CRO Specialist',               'technical_conversion',  'idle', '30 18 * * *',   true),
(13, 'Booking Abandonment Agent',    'technical_conversion',  'idle', '30 18 * * 0',   true),

-- Social Media & Distribution (14–19)
(14, 'Social Media Promotion Agent', 'social_media',          'idle', 'on_trigger',    true),
(15, 'Social Copywriter Agent',      'social_media',          'idle', 'on_trigger',    true),
(16, 'Scheduler & Distributor',      'social_media',          'idle', 'on_trigger',    true),
(17, 'Social Listening Agent',       'social_media',          'idle', '0 * * * *',     true),
(18, 'UGC / Testimonial Agent',      'social_media',          'idle', 'on_trigger',    true),
(19, 'Influencer Outreach Agent',    'social_media',          'idle', '30 18 * * 0',   true),

-- Lead Generation & CRM (20–23)
(20, 'Community / DM Agent',         'lead_crm',              'idle', 'on_trigger',    true),
(21, 'Lead Scoring Agent',           'lead_crm',              'idle', 'on_trigger',    true),
(22, 'WhatsApp Automation Agent',    'lead_crm',              'idle', 'on_trigger',    true),
(23, 'Upsell & Cross-sell Agent',    'lead_crm',              'idle', 'on_trigger',    true),

-- Ads Intelligence (24)
(24, 'Meta Ads Intelligence Agent',  'ads_intelligence',      'idle', '0 * * * *',     true),

-- Pricing & Revenue (25–27)
(25, 'Dynamic Pricing Agent',        'pricing_revenue',       'idle', '0 */6 * * *',   true),
(26, 'Revenue Forecasting Agent',    'pricing_revenue',       'idle', '0 */12 * * *',  true),
(27, 'Group Fill Rate Agent',        'pricing_revenue',       'idle', '0 * * * *',     true),

-- Operations & Fulfillment (28–31)
(28, 'Itinerary Builder Agent',      'operations',            'idle', 'on_trigger',    true),
(29, 'Vendor & Hotel Rate Monitor',  'operations',            'idle', '30 18 * * *',   true),
(30, 'Visa & Travel Advisory Agent', 'operations',            'idle', '0 */6 * * *',   true),
(31, 'Customer Experience Agent',    'operations',            'idle', 'on_trigger',    true),

-- Email & Nurture (32–33)
(32, 'Email Nurture Agent',          'email_nurture',         'idle', '30 18 * * 0',   true),
(33, 'Newsletter Curator Agent',     'email_nurture',         'idle', '30 18 * * 0',   true),

-- PR & Brand Authority (34–36)
(34, 'PR Outreach Agent',            'pr_brand',              'idle', '30 18 */2 * *', true),
(35, 'Review & Reputation Agent',    'pr_brand',              'idle', '30 18 * * *',   true),
(36, 'Thought Leadership Agent',     'pr_brand',              'idle', '30 18 * * 0',   true),

-- Research & Intelligence (37–39)
(37, 'Travel Trend Forecaster',      'research_intelligence', 'idle', '30 18 * * 0',   true),
(38, 'Customer Persona Agent',       'research_intelligence', 'idle', '30 18 */2 * *', true),
(39, 'Regulatory & Tax Compliance',  'research_intelligence', 'idle', '30 18 * * 0',   true)

ON CONFLICT (agent_number) DO UPDATE SET
  name               = EXCLUDED.name,
  category           = EXCLUDED.category,
  schedule_expression = EXCLUDED.schedule_expression,
  is_active          = EXCLUDED.is_active;
