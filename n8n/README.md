# n8n Workflow Setup

## Prerequisites
- n8n running on your Hetzner VPS
- Agents deployed to `/opt/hft-agents/` on the VPS
- Python venv at `/opt/hft-agents/.venv/`

## Deploy Agents to VPS

```bash
# From your local machine
rsync -av agents/ root@your-vps-ip:/opt/hft-agents/
ssh root@your-vps-ip "cd /opt/hft-agents && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
ssh root@your-vps-ip "mkdir -p /opt/hft-agents/logs"

# Copy .env
scp agents/.env root@your-vps-ip:/opt/hft-agents/.env
```

## Import Workflows into n8n

1. Open your n8n instance (`https://n8n.your-hetzner-vps.com`)
2. Go to **Workflows → Import from file**
3. Import each file in this order:

| File | Agents | Schedule |
|---|---|---|
| `workflow-hourly.json` | #9, #27, #22 | Every hour |
| `workflow-6h.json` | #25, #2, #30 | Every 6 hours |
| `workflow-daily.json` | #26, #1, #3, #8, #35, #29 | Daily 8AM IST |
| `workflow-weekly.json` | #33, #32, #36, #37, #39, #6 | Sunday 6:30AM IST |
| `workflow-on-trigger.json` | #20, #21, #28 | Webhook POST |

4. **Activate** each workflow after import (toggle in top-right)

## On-Trigger Webhook URL

After importing `workflow-on-trigger.json`, copy the webhook URL from n8n.
It will look like: `https://n8n.your-hetzner-vps.com/webhook/hft-trigger`

Trigger agents from your app or manually:
```bash
# Trigger Instagram DM agent
curl -X POST https://n8n.your-hetzner-vps.com/webhook/hft-trigger \
  -H "Content-Type: application/json" \
  -d '{"agent": "instagram_dm"}'

# Trigger lead scoring
curl -X POST https://n8n.your-hetzner-vps.com/webhook/hft-trigger \
  -H "Content-Type: application/json" \
  -d '{"agent": "lead_scoring"}'
```

## Add Webhook Secret (recommended)

In n8n, add a **Header Auth** credential to the webhook node:
- Header name: `x-webhook-secret`
- Value: your `N8N_WEBHOOK_SECRET` from `.env`

## Logs

All agent logs are written to `/opt/hft-agents/logs/agent-{number}.log`

```bash
# Watch Agent #27 live
ssh root@your-vps-ip "tail -f /opt/hft-agents/logs/agent-27.log"
```
