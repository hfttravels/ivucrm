# Hassle Free Travels — AI-Powered CRM System

**Status:** Foundation + CRM Dashboard + First Agent Complete ✅

---

## What's Built

### Phase 1: Foundation Architecture
- ✅ pnpm monorepo (Next.js 15 + Python agents)
- ✅ Drizzle ORM schema (9 tables, full relations, typed)
- ✅ Environment validation (Zod, fail-fast on boot)
- ✅ Supabase integration (PostgreSQL + real-time subscriptions)
- ✅ Python agent workspace (shared Supabase client, logger)

### Phase 2: CRM Command Center
- ✅ Supabase Auth (email OTP, protected routes)
- ✅ Real-time Agent Feed (live status updates via Supabase subscriptions)
- ✅ Approval Queue (content review with approve/reject actions)
- ✅ Notifications Panel (live alerts, mark as read)
- ✅ Dashboard sidebar navigation (8 sections)
- ✅ API routes for content approval and notifications

### Phase 3: First Agent End-to-End
- ✅ Agent #27 — Group Fill Rate Monitor (Python + CrewAI)
- ✅ Real-time status updates in CRM dashboard
- ✅ Automated notification creation
- ✅ Business logic: CRITICAL/WARNING/FILLING_FAST alerts

---

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to provision (~2 minutes)
3. Go to **Project Settings → Database** and copy the **Connection string (URI mode)**
4. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 3. Configure Environment Variables

Edit `apps/web/.env` and fill in your real values:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# AI Models (get from respective providers)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
OPENAI_API_KEY=sk-...

# Meta / Instagram (get from Meta for Developers)
META_APP_ID=...
META_APP_SECRET=...
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=act_...
INSTAGRAM_BUSINESS_ACCOUNT_ID=...

# WhatsApp Business API
WHATSAPP_API_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
FOUNDER_WHATSAPP_NUMBER=91XXXXXXXXXX

# Google (get from Google Cloud Console)
GOOGLE_ANALYTICS_PROPERTY_ID=properties/XXXXXXXXX
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://hasslefreetravels.in
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Sanity CMS (get from sanity.io/manage)
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# n8n (your Hetzner VPS URL)
N8N_WEBHOOK_SECRET=...
N8N_BASE_URL=https://n8n.your-hetzner-vps.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Also update `agents/.env` with the same Supabase and API keys.

### 4. Push Database Schema to Supabase

```bash
cd apps/web
pnpm db:generate
pnpm db:migrate
```

This creates all 9 tables in your Supabase database.

### 5. Seed the Agents Table

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `apps/web/src/db/seeds/agents.sql`
3. Paste and run the SQL
4. Verify: You should see 39 agents in the `agents` table

### 6. Enable Supabase Realtime

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Enable realtime for these tables:
   - `agents`
   - `content_queue`
   - `notifications`

### 7. Create Your Admin User

In Supabase Dashboard:
1. Go to **Authentication → Users**
2. Click **Add user** → **Create new user**
3. Enter your email (e.g., `founder@hasslefreetravels.in`)
4. Click **Create user**

### 8. Start the Dev Server

```bash
pnpm dev
```

The app will boot at `http://localhost:3000`.

### 9. Login to CRM

1. Go to `http://localhost:3000/admin/crm`
2. You'll be redirected to `/login`
3. Enter your email
4. Check your inbox for the magic link
5. Click the link → you'll be redirected to the Command Center

---

## CRM Dashboard Structure

| Route | Purpose |
|---|---|
| `/admin/crm` | Command Center — agent feed, approval queue, notifications |
| `/admin/crm/seo` | SEO Intelligence (Phase 3) |
| `/admin/crm/ads` | Meta Ads Hub (Phase 3) |
| `/admin/crm/social` | Social Media Control (Phase 3) |
| `/admin/crm/leads` | Lead Pipeline (Phase 3) |
| `/admin/crm/packages` | Package Manager (Phase 3) |
| `/admin/crm/competitors` | Competitor Radar (Phase 3) |
| `/admin/crm/reports` | Reports & Forecasts (Phase 3) |

---

## Database Schema

### Core Tables

1. **agents** — 39 agent registry with status, schedule, last run logs
2. **leads** — WhatsApp leads with scoring, conversation history, status
3. **packages** — Travel packages with pricing, seats, itineraries
4. **content_queue** — Agent-generated content awaiting approval
5. **seo_reports** — Keyword rankings, position tracking, CTR
6. **competitor_ads** — Competitor ad monitoring (Wanderon, Thrillophilia, etc.)
7. **meta_ad_performance** — Your Meta ad metrics (hourly snapshots)
8. **social_posts** — Published social media content with engagement
9. **notifications** — System alerts, agent errors, approval requests

All tables have full TypeScript types exported from `apps/web/src/db/schema.ts`.

---

## Real-Time Features

The CRM uses Supabase real-time subscriptions for:

- **Agent Feed**: Updates instantly when any agent changes status
- **Notifications**: New alerts appear without refresh
- **Approval Queue**: New content items appear as agents generate them

No polling. Zero latency. Pure WebSocket magic.

---

## Python Agents Workspace

Located in `/agents/`:

- **Shared tools**: `tools/supabase_client.py`, `tools/agent_logger.py`
- **Category folders**: `seo/`, `social/`, `leads/`, `ops/`, `pricing/`, `email/`, `pr/`, `research/`
- **Requirements**: `requirements.txt` (CrewAI, LangChain, Supabase SDK)

Every agent must:
1. Call `log_agent_start(agent_number)` at the beginning
2. Call `log_agent_complete(agent_number, start_time, output)` on success
3. Call `log_agent_error(agent_number, error, retry_count)` on failure

This ensures the CRM dashboard always reflects accurate agent status.

---

## Testing Agent #27 (Group Fill Rate Monitor)

Once you've completed the setup above, test the first agent:

### 1. Install Python Dependencies

```bash
cd agents
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Seed Sample Packages

In Supabase SQL Editor, run the contents of `apps/web/src/db/seeds/packages.sql`

This creates 3 test packages with different fill rates.

### 3. Run Agent #27

```bash
# From project root
run-agent-27.bat
```

### 4. Watch Real-Time Updates

Keep your CRM dashboard open at `http://localhost:3001/admin/crm`:

- **Agent Feed**: Watch Agent #27 status change from `idle` → `running` → `completed`
- **Notifications Panel**: New alerts appear instantly with package details
- **No refresh needed**: WebSocket magic

See `agents/AGENT-27-README.md` for detailed documentation.

---

## Next Steps

### Option C: Build Your First Agent End-to-End

Pick one high-value agent and build it fully:

**Recommended: Agent #27 — Group Fill Rate Agent**

Why this one first?
- Directly protects revenue (alerts when packages are underselling)
- Simple logic (query `packages` table, calculate fill %, trigger alert)
- Demonstrates the full flow: Python agent → Supabase log → CRM notification → WhatsApp alert

**What we'll build:**
1. Python CrewAI agent in `agents/pricing/group_fill_rate.py`
2. n8n workflow to trigger it every hour
3. Notification creation when fill rate drops below threshold
4. WhatsApp message to founder via WhatsApp Business API

---

## Tech Stack Reference

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (email OTP) |
| Real-time | Supabase Realtime (WebSocket subscriptions) |
| Agents | CrewAI (Python) |
| Orchestration | n8n (self-hosted on Hetzner VPS) |
| AI Models | Claude (primary), Gemini Pro, GPT-4o |
| Hosting | Vercel (Next.js), Hetzner VPS (agents + n8n) |

---

## Troubleshooting

### "Invalid environment variables" error on boot

Run `pnpm --filter web exec tsx src/lib/env.ts` to see which vars are missing.

### TypeScript errors after schema changes

```bash
pnpm --filter web exec tsc --noEmit
```

### Database migration failed

Check your `DATABASE_URL` is correct and the Supabase project is running.

### Real-time not working

Verify you enabled replication for `agents`, `content_queue`, and `notifications` in Supabase Dashboard → Database → Replication.

### Can't login

Check that:
1. You created a user in Supabase Auth
2. `NEXT_PUBLIC_APP_URL` matches your dev server URL
3. Email delivery is working (check Supabase logs)

---

**What's next?** Tell me which agent you want to build first, or if you want to continue with another CRM section.
