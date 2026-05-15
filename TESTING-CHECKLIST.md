# Complete System Test Checklist

Follow this checklist to verify the entire Hassle Free Travels CRM + Agent system works end-to-end.

---

## ✅ Phase 1: Supabase Setup

- [ ] Created Supabase project at supabase.com
- [ ] Copied DATABASE_URL from Project Settings → Database
- [ ] Copied NEXT_PUBLIC_SUPABASE_URL from Project Settings → API
- [ ] Copied NEXT_PUBLIC_SUPABASE_ANON_KEY from Project Settings → API
- [ ] Copied SUPABASE_SERVICE_ROLE_KEY from Project Settings → API
- [ ] Updated `apps/web/.env` with all 4 Supabase values
- [ ] Updated `agents/.env` with Supabase URL and service role key

---

## ✅ Phase 2: Database Schema

- [ ] Ran `cd apps/web`
- [ ] Ran `pnpm db:generate` (generates migration files)
- [ ] Ran `pnpm db:migrate` (pushes schema to Supabase)
- [ ] Verified 9 tables exist in Supabase Dashboard → Table Editor:
  - agents
  - leads
  - packages
  - content_queue
  - seo_reports
  - competitor_ads
  - meta_ad_performance
  - social_posts
  - notifications

---

## ✅ Phase 3: Seed Data

- [ ] Opened Supabase Dashboard → SQL Editor
- [ ] Copied contents of `apps/web/src/db/seeds/agents.sql`
- [ ] Pasted and ran SQL
- [ ] Verified 39 agents in `agents` table
- [ ] Copied contents of `apps/web/src/db/seeds/packages.sql`
- [ ] Pasted and ran SQL
- [ ] Verified 3 packages in `packages` table

---

## ✅ Phase 4: Enable Real-Time

- [ ] Opened Supabase Dashboard → Database → Replication
- [ ] Enabled real-time for `agents` table
- [ ] Enabled real-time for `content_queue` table
- [ ] Enabled real-time for `notifications` table

---

## ✅ Phase 5: Create Admin User

- [ ] Opened Supabase Dashboard → Authentication → Users
- [ ] Clicked "Add user" → "Create new user"
- [ ] Entered email address
- [ ] Clicked "Create user"
- [ ] Checked "Auto Confirm User" if available

---

## ✅ Phase 6: Test Next.js CRM

- [ ] Ran `pnpm dev` from project root
- [ ] Opened `http://localhost:3001/admin/crm` in browser
- [ ] Redirected to `/login` page
- [ ] Entered admin email
- [ ] Clicked "Send Magic Link"
- [ ] Checked email inbox
- [ ] Clicked magic link in email
- [ ] Landed on Command Center dashboard
- [ ] Verified Agent Feed shows 39 agents (all status: idle)
- [ ] Verified Notifications Panel is empty
- [ ] Verified Approval Queue is empty
- [ ] Clicked through all 8 sidebar sections (all show "Coming in Phase 2")

---

## ✅ Phase 7: Test Python Agent

- [ ] Opened new terminal
- [ ] Ran `cd agents`
- [ ] Ran `python -m venv .venv`
- [ ] Ran `.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Mac/Linux)
- [ ] Ran `pip install -r requirements.txt`
- [ ] Waited for all packages to install (~2 minutes)
- [ ] Ran `cd ..` (back to project root)
- [ ] Ran `run-agent-27.bat` (Windows) or `python agents/main.py` (Mac/Linux)

---

## ✅ Phase 8: Verify Real-Time Updates

While Agent #27 is running, watch your CRM dashboard:

- [ ] Agent Feed: Agent #27 status changed from `idle` → `running`
- [ ] Agent Feed: Agent #27 status changed to `completed` after ~5 seconds
- [ ] Agent Feed: Last run time updated
- [ ] Agent Feed: Duration (ms) displayed
- [ ] Notifications Panel: 3 new notifications appeared
- [ ] Notifications Panel: Notifications show package names and seat counts
- [ ] Notifications Panel: Priority badges visible (high/medium)
- [ ] Clicked "Mark read" on a notification → badge changed color
- [ ] No page refresh was needed for any of these updates

---

## ✅ Phase 9: Verify Database Changes

- [ ] Opened Supabase Dashboard → Table Editor → `agents`
- [ ] Found Agent #27 (agent_number = 27)
- [ ] Verified `status` = "completed"
- [ ] Verified `last_run_at` has recent timestamp
- [ ] Verified `last_run_duration_ms` has a value
- [ ] Verified `output_log` contains JSON with packages_analyzed, notifications_created, alerts
- [ ] Opened Table Editor → `notifications`
- [ ] Verified 3 new rows exist
- [ ] Verified each has `type` = "fill_rate_alert"
- [ ] Verified each has `related_entity_id` pointing to a package

---

## ✅ Phase 10: Test Manual Notification

Create a test notification manually to verify the real-time subscription:

- [ ] Opened Supabase Dashboard → SQL Editor
- [ ] Ran this SQL:
```sql
INSERT INTO notifications (type, priority, title, message, is_read, is_actioned)
VALUES ('system', 'high', 'Test Notification', 'This is a manual test', false, false);
```
- [ ] Watched CRM dashboard
- [ ] New notification appeared instantly in Notifications Panel
- [ ] No page refresh needed

---

## 🎉 Success Criteria

If all checkboxes above are checked, you have:

1. ✅ A fully functional Next.js 15 CRM with Supabase Auth
2. ✅ Real-time WebSocket subscriptions working
3. ✅ A Python agent that reads/writes to Supabase
4. ✅ Live status updates in the dashboard
5. ✅ Automated notification system
6. ✅ End-to-end data flow: Python → Supabase → Next.js → Browser

---

## 🚀 What's Next?

You're now ready to:

- **Build more agents**: Use Agent #27 as a template
- **Add WhatsApp integration**: Send critical alerts to your phone
- **Deploy to production**: Vercel (Next.js) + Hetzner VPS (agents)
- **Set up n8n**: Automate agent scheduling
- **Build out CRM sections**: SEO Intelligence, Lead Pipeline, etc.

---

## 🐛 Troubleshooting

If any step failed, check:

1. **Environment variables**: Both `apps/web/.env` and `agents/.env` must have correct Supabase credentials
2. **Python version**: Must be Python 3.10 or higher
3. **Node version**: Must be Node 20 or higher
4. **Supabase real-time**: Must be enabled for agents, content_queue, notifications tables
5. **Browser console**: Check for WebSocket connection errors
6. **Supabase logs**: Check for database errors in Supabase Dashboard → Logs

---

**Need help?** Check the detailed READMEs:
- Main setup: `README.md`
- Agent #27 details: `agents/AGENT-27-README.md`
