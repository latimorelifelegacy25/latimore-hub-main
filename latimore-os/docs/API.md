# Latimore OS — API Reference

**Base URL (Production):** `https://hub.latimorelifelegacy.com`  
**Worker URL:** `https://latimore-os-worker.[account].workers.dev`

---

## Authentication

### Internal Routes
Internal routes require the `X-Worker-Secret` header:
```
X-Worker-Secret: [WORKER_SECRET env var]
```

### Public Routes
No authentication required. Rate-limited by Cloudflare.

---

## Cloudflare Worker Endpoints

### QR Code Tracking
```
GET /api/track/qr/:codeId
```
Tracks a QR code scan and redirects to the destination URL.

**Response:** `302 Redirect` to destination URL with UTM params appended.

**Example:**
```
GET /api/track/qr/pahs
→ 302 https://card.latimorelifelegacy.com/pahs?utm_source=print&utm_medium=qr&utm_campaign=pahs-2026
```

---

### Lead Intake
```
POST /api/lead
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "Marcus",
  "last_name": "Johnson",
  "email": "marcus@example.com",
  "phone": "5705551234",
  "interest": "life_insurance",
  "coverage_amount": 500000,
  "message": "Looking for term life coverage",
  "utm_source": "facebook",
  "utm_medium": "paid",
  "utm_campaign": "july-launch",
  "landing_page": "https://latimorelifelegacy.com/quote"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you! We will be in touch within 24 hours."
}
```

**Side Effects:**
- Writes lead to `leads` table
- Creates/updates contact in `contacts` table
- Sends confirmation email to lead (via Resend)
- Sends confirmation SMS to lead (via Twilio)
- Notifies Jackson via email + SMS
- Queues `lead-follow-up` workflow

---

### Fillout Webhook
```
POST /api/webhooks/fillout
Content-Type: application/json
```

Processes form submissions from Fillout.com. Accepts Fillout's native webhook format.

**Response:**
```json
{
  "success": true,
  "submissionId": "sub_abc123"
}
```

---

### Booking Webhook
```
POST /api/webhooks/booking
Content-Type: application/json
```

Processes appointment bookings from Cal.com, Calendly, or Google Calendar.

**Request Body (generic format):**
```json
{
  "event_type": "booking.created",
  "booking_id": "booking_123",
  "appointment_type": "discovery_call",
  "attendee_name": "Marcus Johnson",
  "attendee_email": "marcus@example.com",
  "attendee_phone": "5705551234",
  "start_time": "2026-07-15T14:00:00-04:00",
  "end_time": "2026-07-15T14:30:00-04:00",
  "timezone": "America/New_York",
  "duration_minutes": 30,
  "meeting_url": "https://meet.google.com/abc-def-ghi"
}
```

**Response:**
```json
{
  "success": true,
  "event_type": "booking.created"
}
```

---

### Content Click Tracking
```
POST /api/events/content-click
Content-Type: application/json
```

**Request Body:**
```json
{
  "post_id": "uuid",
  "platform": "facebook",
  "click_type": "cta"
}
```

---

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-01T12:00:00.000Z",
  "env": "production"
}
```

---

## Next.js API Routes

### Dashboard
```
GET /api/dashboard
```

Returns all data for the admin command center.

**Response:**
```json
{
  "stats": {
    "total_pipeline": 47,
    "new_leads_7d": 12,
    "todays_appointments": 3,
    "pending_tasks": 8,
    "ytd_premium": 125000,
    "ytd_policies": 18,
    "active_agents": 3
  },
  "pipeline_summary": [...],
  "todays_appointments": [...],
  "todays_tasks": [...],
  "new_leads": [...],
  "agent_leaderboard": [...],
  "kpi_snapshots": [...],
  "workflow_runs": [...]
}
```

---

### Contacts

#### List Contacts
```
GET /api/contacts?status=new&source=facebook&limit=50&offset=0
```

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by lead_status |
| `source` | string | Filter by lead_source |
| `search` | string | Search by first name |
| `agent_id` | uuid | Filter by assigned agent |
| `limit` | integer | Max 200, default 50 |
| `offset` | integer | Pagination offset |

**Response:**
```json
{
  "contacts": [...],
  "total": 142,
  "limit": 50,
  "offset": 0
}
```

#### Create Contact
```
POST /api/contacts
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "Marcus",
  "last_name": "Johnson",
  "email": "marcus@example.com",
  "phone": "5705551234",
  "contact_type": "prospect",
  "lead_status": "new",
  "lead_source": "facebook",
  "notes": "Interested in term life"
}
```

#### Get Contact (Full Profile)
```
GET /api/contacts/:id
```

Returns contact + policies + appointments + tasks + communications + workflow runs.

#### Update Contact
```
PATCH /api/contacts/:id
Content-Type: application/json
```

#### Delete Contact (Soft)
```
DELETE /api/contacts/:id
```

---

### Policies

#### List Policies
```
GET /api/policies?status=issued&carrier=north_american&limit=50
```

#### Create Policy
```
POST /api/policies
Content-Type: application/json
```

**Request Body:**
```json
{
  "contact_id": "uuid",
  "agent_id": "uuid",
  "carrier": "north_american",
  "policy_type": "term_life",
  "product_name": "ADDvantage Term 20",
  "status": "applied",
  "face_amount": 500000,
  "premium_monthly": 28.50,
  "premium_annual": 342.00,
  "application_date": "2026-07-15"
}
```

---

### Appointments

#### List Appointments
```
GET /api/appointments?status=scheduled&date_from=2026-07-01&date_to=2026-07-31
```

#### Create Appointment
```
POST /api/appointments
Content-Type: application/json
```

**Request Body:**
```json
{
  "contact_id": "uuid",
  "agent_id": "uuid",
  "appointment_type": "life_insurance_consultation",
  "scheduled_at": "2026-07-15T14:00:00-04:00",
  "duration_minutes": 30,
  "channel": "phone_call",
  "notes": "Client interested in $500K term"
}
```

---

### KPI Snapshots

#### Get KPI Data
```
GET /api/kpi?period=weekly&limit=12
```

**Response:**
```json
{
  "snapshots": [...],
  "current_month": {
    "policies_issued": 5,
    "premium_written": 18500,
    "annuity_premium": 75000,
    "apps_submitted": 8,
    "commission_earned": 4200
  },
  "pipeline_summary": [...],
  "trends": {
    "new_leads": { "value": 24, "change": 6, "change_pct": "33.3%", "direction": "up" },
    "premium_written": { "value": 18500, "change": 3500, "change_pct": "23.3%", "direction": "up" }
  }
}
```

#### Write KPI Snapshot
```
POST /api/kpi
Content-Type: application/json
```

---

### Agent Harness

> **Not yet implemented.** `cloudflare-worker/src/queues/workflow-queue.ts` forwards
> to this route when `AGENT_HARNESS_ENABLED=true`, but no `/api/agent/run` route
> exists in the Next.js app yet, and nothing in `agent-harness/src/workflows/`
> is wired into a registry the orchestrator can resolve workflow names against.
> The flag defaults to disabled, so the queue consumer currently just logs the
> trigger to `workflow_runs` and acks the message — this spec describes the
> intended contract once the route is built.

#### Trigger Workflow
```
POST /api/agent/run
X-Worker-Secret: [secret]
Content-Type: application/json
```

**Request Body:**
```json
{
  "workflow": "lead-follow-up",
  "trigger": "lead_created",
  "payload": {
    "lead_id": "uuid",
    "contact_id": "uuid",
    "first_name": "Marcus",
    "last_name": "Johnson",
    "email": "marcus@example.com",
    "phone": "5705551234",
    "source": "facebook",
    "interest": "life_insurance"
  }
}
```

**Response:**
```json
{
  "success": true,
  "run_id": "uuid",
  "workflow": "lead-follow-up",
  "status": "started"
}
```

**Available Workflows:**
| Workflow | Trigger | Description |
|---|---|---|
| `lead-follow-up` | `lead_created` | Research + draft + send follow-up |
| `no-show-recovery` | `no_show` | Empathetic recovery message |
| `weekly-kpi-report` | `scheduled` | Weekly analytics + AI insights |
| `gbp-post-draft` | `manual` | Draft social/GBP post with compliance review |

---

## Supabase Database Functions

### get_pipeline_summary
```sql
SELECT * FROM get_pipeline_summary(p_agent_id := NULL);
```

Returns pipeline count by status.

### get_monthly_production
```sql
SELECT * FROM get_monthly_production(
  p_year := 2026,
  p_month := 7,
  p_agent_id := NULL
);
```

Returns monthly production metrics.

---

## Error Responses

All endpoints return consistent error format:
```json
{
  "error": "Error message",
  "status": 400
}
```

**HTTP Status Codes:**
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 302 | Redirect (QR tracking) |
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing/invalid secret) |
| 403 | Forbidden (feature disabled) |
| 404 | Not found |
| 500 | Internal server error |
| 503 | Service unavailable (feature flag off) |