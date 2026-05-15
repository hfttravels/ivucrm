# Agent #27 — Group Fill Rate Monitor

**Purpose:** Monitors all active travel packages and alerts when seat availability drops below critical thresholds.

---

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd agents
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Make sure `agents/.env` has your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Seed Sample Packages (Optional for Testing)

In Supabase SQL Editor, run:
```sql
-- Copy contents of apps/web/src/db/seeds/packages.sql
```

This creates 3 test packages:
- **Spiti Valley**: 9/12 seats (75% full) → Will trigger CRITICAL alert
- **Thailand**: 13/15 seats (87% full) → Will trigger FILLING_FAST alert  
- **Manali-Kasol**: 4/12 seats (33% full) → Will trigger WARNING alert

---

## How to Run

### Manual Execution (Testing)

```bash
# From project root
run-agent-27.bat
```

Or manually:
```bash
cd agents
python main.py
```

### Expected Output

```json
{
  "packages_analyzed": 3,
  "notifications_created": 3,
  "alerts": [
    {
      "package_id": "uuid",
      "destination": "Spiti Valley",
      "seats_filled": 9,
      "seats_total": 12,
      "seats_remaining": 3,
      "fill_rate": 75.0,
      "alert_type": "CRITICAL",
      "notification_id": "uuid"
    }
  ],
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## What Happens When It Runs

1. **Agent Status Update**: `agents` table → status changes to `running` (triggers pulse animation in CRM)
2. **Package Analysis**: Reads all `active` and `filling_fast` packages from database
3. **Alert Logic**:
   - **CRITICAL** (high priority): ≤3 seats left AND <80% full
   - **WARNING** (medium priority): ≤5 seats left AND <70% full
   - **FILLING_FAST** (medium priority): ≥80% full
4. **Notification Creation**: Writes to `notifications` table (triggers real-time alert in CRM)
5. **Agent Completion**: Updates `agents` table with output log and duration

---

## Real-Time CRM Updates

Open your CRM dashboard at `http://localhost:3001/admin/crm` while the agent runs:

- **Agent Feed**: Watch Agent #27 status change from `idle` → `running` → `completed`
- **Notifications Panel**: New alerts appear instantly with package details
- **No refresh needed**: Supabase real-time subscriptions push updates to your browser

---

## Alert Types Explained

### CRITICAL (High Priority)
**Trigger**: ≤3 seats remaining AND fill rate <80%

**Example**: Spiti package has 9/12 seats (75% full, 3 seats left)

**Action Required**: Launch urgency campaign immediately
- Instagram story: "ONLY 3 SEATS LEFT"
- WhatsApp broadcast to warm leads
- Consider early bird discount for next batch

### WARNING (Medium Priority)
**Trigger**: ≤5 seats remaining AND fill rate <70%

**Example**: Manali package has 4/12 seats (33% full, 8 seats left)

**Action Required**: Increase marketing push
- Review ad targeting
- Boost top-performing posts
- Reach out to past customers

### FILLING_FAST (Medium Priority)
**Trigger**: Fill rate ≥80%

**Example**: Thailand package has 13/15 seats (87% full)

**Action Required**: Prepare for sold-out status
- Update website to show "Filling Fast" badge
- Start waitlist for next departure
- Consider opening a second batch

---

## Scheduling with n8n (Production)

Once you have n8n running on your Hetzner VPS:

1. Import `n8n/workflows/agent-27-trigger.json`
2. Set cron schedule: `0 * * * *` (every hour)
3. Configure Execute Command node:
   ```bash
   cd /path/to/agents && /path/to/.venv/bin/python main.py
   ```
4. Add error handling webhook to Supabase notifications

---

## Troubleshooting

### "No module named 'crewai'"
```bash
cd agents
pip install -r requirements.txt
```

### "NEXT_PUBLIC_SUPABASE_URL is not set"
Check `agents/.env` has correct Supabase credentials

### "No packages found"
Run the packages seed SQL in Supabase SQL Editor

### Agent runs but no notifications appear
1. Check Supabase Dashboard → Table Editor → `notifications` table
2. Verify real-time is enabled for `notifications` table
3. Check browser console for WebSocket errors

---

## Next Steps

Once Agent #27 is working:

1. **Add WhatsApp Integration**: Send critical alerts to founder's WhatsApp
2. **Build Agent #25**: Dynamic Pricing (adjusts prices based on fill rate)
3. **Build Agent #26**: Revenue Forecasting (predicts monthly revenue)
4. **Deploy to Hetzner VPS**: Run agents 24/7 with n8n orchestration

---

**Test it now:** Run `run-agent-27.bat` and watch your CRM dashboard update in real-time.
