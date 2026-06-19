# Latimore OS — Deployment Guide

**Protecting Today. Securing Tomorrow. #TheBeatGoesOn**

---

## Prerequisites

- Node.js 20+
- Supabase account (supabase.com)
- Cloudflare account with Workers paid plan
- Vercel account (for Next.js)
- Resend account (resend.com)
- Twilio account (twilio.com)
- OpenAI API key (platform.openai.com)

---

## Step 1: Supabase Setup

### 1.1 Create Project
1. Go to supabase.com → New Project
2. Name: `latimore-os`
3. Region: `us-east-1` (closest to Schuylkill County, PA)
4. Save your project URL and API keys

### 1.2 Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref [YOUR_PROJECT_REF]

# Run migrations
supabase db push

# Or run manually in Supabase SQL editor:
# Copy contents of supabase/migrations/001_initial_schema.sql
# Paste and run in SQL editor
```

### 1.3 Run Seed Data
```bash
# In Supabase SQL editor, run:
# supabase/seed/001_seed_data.sql
```

### 1.4 Verify Setup
In Supabase SQL editor, run:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check views exist
SELECT viewname FROM pg_views WHERE schemaname = 'public';

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';
```

Expected tables: `contacts`, `agents`, `leads`, `policies`, `appointments`,
`communications`, `tasks`, `campaigns`, `qr_codes`, `qr_scans`,
`content_posts`, `workflow_runs`, `kpi_snapshots`, `audit_log`

---

## Step 2: Cloudflare Worker Setup

### 2.1 Install Dependencies
```bash
cd latimore-os/cloudflare-worker
npm install
```

### 2.2 Create Queues
```bash
# Create lead intake queue
wrangler queues create lead-intake

# Create workflow trigger queue
wrangler queues create workflow-trigger
```

### 2.3 Set Secrets
```bash
wrangler secret put SUPABASE_URL
# Enter: https://[your-project-ref].supabase.co

wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Enter: [your service role key]

wrangler secret put RESEND_API_KEY
# Enter: re_[your resend key]

wrangler secret put TWILIO_ACCOUNT_SID
# Enter: AC[your twilio sid]

wrangler secret put TWILIO_AUTH_TOKEN
# Enter: [your twilio auth token]

wrangler secret put TWILIO_PHONE_NUMBER
# Enter: +17176152613

wrangler secret put WORKER_SECRET
# Enter: [generate a random 32-char secret]

wrangler secret put OPENAI_API_KEY
# Enter: sk-[your openai key]
```

### 2.4 Deploy Worker
```bash
# Development
npm run dev

# Production
npm run deploy
```

### 2.5 Verify Worker
```bash
# Test health endpoint
curl https://latimore-os-worker.[account].workers.dev/api/health

# Expected:
# {"status":"ok","timestamp":"...","env":"production"}
```

### 2.6 Set Up Custom Domain (Optional)
In Cloudflare dashboard:
1. Workers & Pages → latimore-os-worker → Settings → Triggers
2. Add Custom Domain: `api.latimorelifelegacy.com`

---

## Step 3: Next.js (Vercel) Setup

### 3.1 Install Dependencies
```bash
cd latimore-os/nextjs
npm install
```

### 3.2 Environment Variables
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key]

# Cloudflare Worker
WORKER_SECRET=[same secret as worker]

# AI
OPENAI_API_KEY=sk-[your key]
ANTHROPIC_API_KEY=sk-ant-[your key]  # optional

# Communications
RESEND_API_KEY=re_[your key]
TWILIO_ACCOUNT_SID=AC[your sid]
TWILIO_AUTH_TOKEN=[your token]
TWILIO_PHONE_NUMBER=+17176152613

# Analytics
NEXT_PUBLIC_GA4_ID=G-S0Q3E4DEBJ
NEXT_PUBLIC_GA4_CARD_ID=G-91DT7W1KRP

# Feature Flags
AGENT_HARNESS_ENABLED=false
AGENT_HARNESS_WORKFLOWS=lead-follow-up,weekly-kpi-report

# App
HUB_URL=https://hub.latimorelifelegacy.com
NEXT_PUBLIC_APP_URL=https://latimorelifelegacy.com
```

### 3.3 Local Development
```bash
npm run dev
# Opens at http://localhost:3000
# Admin dashboard: http://localhost:3000/admin
```

### 3.4 Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → add all from .env.local
```

### 3.5 Configure Vercel Project
In Vercel dashboard:
1. Project Settings → Domains
2. Add: `hub.latimorelifelegacy.com`
3. Configure DNS in Cloudflare:
   - CNAME `hub` → `cname.vercel-dns.com`

---

## Step 4: QR Code Setup

### 4.1 Create QR Codes in Database
The seed data creates 5 QR codes. To add more:
```sql
INSERT INTO qr_codes (code_id, label, destination_url, utm_source, utm_medium, utm_campaign, placement)
VALUES ('pahs-2', 'PAHS Game 2', 'https://card.latimorelifelegacy.com/pahs', 'print', 'qr', 'pahs-2026', 'pahs_program');
```

### 4.2 QR Code URLs
Format: `https://api.latimorelifelegacy.com/api/track/qr/[code_id]`

Examples:
- PAHS: `https://api.latimorelifelegacy.com/api/track/qr/pahs`
- Business Card: `https://api.latimorelifelegacy.com/api/track/qr/biz-card`

### 4.3 Generate QR Code Images
Use any QR code generator (qr-code-generator.com, qrcode.js) with the tracking URL.

**Print specs:**
- Minimum size: 1.5" × 1.5"
- Resolution: 300 DPI minimum
- Test scan from 18 inches on both iPhone and Android

---

## Step 5: Webhook Configuration

### 5.1 Fillout Webhook
In Fillout dashboard:
1. Form Settings → Webhooks
2. Add webhook URL: `https://api.latimorelifelegacy.com/api/webhooks/fillout`
3. Events: Form Submitted

### 5.2 Cal.com Webhook
In Cal.com dashboard:
1. Settings → Developer → Webhooks
2. Add webhook URL: `https://api.latimorelifelegacy.com/api/webhooks/booking`
3. Events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED
4. Set provider field: `cal`

### 5.3 Google Calendar (via Zapier)
1. Zapier: Google Calendar → Webhook POST
2. URL: `https://api.latimorelifelegacy.com/api/webhooks/booking`
3. Map fields to generic booking format

---

## Step 6: Agent Harness Activation

The agent harness is disabled by default. Enable it gradually:

### Phase 1: Enable for testing
```env
AGENT_HARNESS_ENABLED=true
AGENT_HARNESS_WORKFLOWS=weekly-kpi-report
```

### Phase 2: Enable lead follow-up
```env
AGENT_HARNESS_ENABLED=true
AGENT_HARNESS_WORKFLOWS=lead-follow-up,weekly-kpi-report
```

### Phase 3: Full activation
```env
AGENT_HARNESS_ENABLED=true
AGENT_HARNESS_WORKFLOWS=lead-follow-up,no-show-recovery,weekly-kpi-report,gbp-post-draft
```

### Monitor workflow runs
```sql
-- Check recent workflow runs
SELECT workflow_name, status, duration_ms, tokens_used, compliance_passed, error
FROM workflow_runs
ORDER BY created_at DESC
LIMIT 20;

-- Check compliance failures
SELECT workflow_name, compliance_notes, error
FROM workflow_runs
WHERE compliance_passed = false
ORDER BY created_at DESC;
```

---

## Step 7: Monitoring & Alerts

### 7.1 Cloudflare Worker Monitoring
```bash
# Tail live logs
wrangler tail

# View analytics in Cloudflare dashboard:
# Workers & Pages → latimore-os-worker → Analytics
```

### 7.2 Supabase Monitoring
- Dashboard → Database → Query Performance
- Dashboard → Auth → Users
- Dashboard → Storage → Buckets

### 7.3 Vercel Monitoring
- Vercel Dashboard → Project → Analytics
- Vercel Dashboard → Project → Functions (API route logs)

### 7.4 Set Up Uptime Monitoring
Use UptimeRobot (free) or Better Uptime:
- Monitor: `https://api.latimorelifelegacy.com/api/health`
- Alert: Jackson's phone + email on downtime

---

## Step 8: Pre-Launch Checklist

```
☐ Supabase migrations run successfully
☐ Seed data inserted (QR codes, campaigns, agent record)
☐ Cloudflare Worker deployed and health check passes
☐ All Worker secrets set (8 secrets)
☐ Next.js deployed to Vercel
☐ All environment variables set in Vercel
☐ Custom domains configured (hub.latimorelifelegacy.com, api.latimorelifelegacy.com)
☐ SSL certificates active on all domains
☐ QR codes tested (scan from 18" on iPhone + Android)
☐ Lead intake form tested (submit → check Supabase leads table)
☐ Confirmation email received within 60 seconds
☐ Confirmation SMS received within 60 seconds
☐ Agent notification email received
☐ Booking webhook tested
☐ Admin dashboard loads at hub.latimorelifelegacy.com/admin
☐ Google Analytics tracking confirmed (GA4 real-time)
☐ Facebook Pixel confirmed (Events Manager)
☐ Uptime monitoring configured
☐ Agent harness tested in staging (AGENT_HARNESS_ENABLED=false in prod)
```

---

## Troubleshooting

### Worker not receiving webhooks
1. Check Cloudflare Worker logs: `wrangler tail`
2. Verify webhook URL is correct
3. Check Cloudflare firewall rules aren't blocking

### Supabase connection errors
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
2. Check Supabase project is not paused (free tier pauses after 1 week inactivity)
3. Verify RLS policies allow service role access

### Emails not sending
1. Check Resend API key is valid
2. Verify sender domain is verified in Resend
3. Check Resend logs at resend.com/emails

### SMS not sending
1. Check Twilio credentials
2. Verify phone number is formatted correctly (+1XXXXXXXXXX)
3. Check Twilio logs at console.twilio.com

### Agent harness workflow failures
1. Check `workflow_runs` table for error messages
2. Verify OpenAI API key is valid and has credits
3. Check compliance violations in `compliance_notes` field
4. Review worker logs for stack traces

---

## Support

**Jackson M. Latimore Sr., MBA**  
📞 (717) 615-2613  
📧 Jackson1989@latimorelegacy.com  
🌐 latimorelifelegacy.com  
PA DOI #1268820 | NIPR #21638507  

**Protecting Today. Securing Tomorrow. #TheBeatGoesOn**