# 15-Minute Quick Start

Get the entire Hassle Free Travels CRM + Agent system running in 15 minutes.

---

## Prerequisites

- Node.js 20+
- Python 3.10+
- pnpm installed (`npm install -g pnpm`)
- A Supabase account (free tier works)

---

## Step 1: Clone & Install (2 min)

```bash
cd e:\Ivucrm
pnpm install
```

---

## Step 2: Create Supabase Project (3 min)

1. Go to https://supabase.com → New Project
2. Name: `hassle-free-travels-crm`
3. Generate strong password → SAVE IT
4. Region: `ap-south-1` (Mumbai)
5. Wait for provisioning (~2 min)

---

## Step 3: Get Credentials (1 min)

**Database URL:**
- Project Settings → Database → Connection string (URI mode)
- Replace `[YOUR-PASSWORD]` with your actual password

**API Keys:**
- Project Settings → API
- Copy: Project URL, anon key, service_role key

---

## Step 4: Configure .env Files (2 min)

**Edit `apps/web/.env`:**
```env
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Edit `agents/.env`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## Step 5: Push Schema (1 min)

```bash
cd apps/web
pnpm db:generate
pnpm db:migrate
```

---

## Step 6: Seed Data (2 min)

**In Supabase Dashboard → SQL Editor:**

1. Copy `apps/web/src/db/seeds/agents.sql` → Run
2. Copy `apps/web/src/db/seeds/packages.sql` → Run

---

## Step 7: Enable Real-Time (1 min)

**In Supabase Dashboard → Database → Replication:**

Toggle ON for:
- `agents`
- `content_queue`
- `notifications`

---

## Step 8: Create Admin User (1 min)

**In Supabase Dashboard → Authentication → Users:**

1. Add user → Create new user
2. Enter your email
3. Check "Auto Confirm User"
4. Create

---

## Step 9: Start Next.js (1 min)

```bash
cd e:\Ivucrm
pnpm dev
```

Open http://localhost:3001/admin/crm → Login with your email

---

## Step 10: Run Agent #27 (1 min)

**New terminal:**

```bash
cd e:\Ivucrm\agents
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..
run-agent-27.bat
```

**Watch your CRM dashboard update in real-time!**

---

## ✅ Success

You should see:
- Agent #27 status: idle → running → completed
- 3 new notifications appear
- No page refresh needed

---

## 🚀 Next Steps

- Read `TESTING-CHECKLIST.md` for detailed verification
- Read `agents/AGENT-27-README.md` for agent details
- Build more agents using Agent #27 as template
- Deploy to production (Vercel + Hetzner VPS)

---

**Total time:** ~15 minutes (excluding Python package install time)
