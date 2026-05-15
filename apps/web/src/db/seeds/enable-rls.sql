-- Enable Row Level Security on CRM tables exposed through Supabase APIs.
-- Server-side Drizzle queries and service-role agent jobs continue to use
-- privileged connections; anon/authenticated API clients get no table access
-- unless explicit policies are added later.

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ad_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'agents', 'leads', 'packages', 'content_queue',
  'seo_reports', 'competitor_ads', 'meta_ad_performance',
  'social_posts', 'notifications'
);
