-- ============================================================
-- LATIMORE OS — SUPABASE SCHEMA MIGRATION 001
-- Full CRM Data Model for Latimore Life & Legacy LLC
-- Protecting Today. Securing Tomorrow. #TheBeatGoesOn
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy search

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'assessment_scheduled',
  'proposal_sent',
  'closed_won',
  'closed_lost',
  'nurture',
  'do_not_contact'
);

CREATE TYPE lead_source AS ENUM (
  'facebook',
  'instagram',
  'linkedin',
  'google',
  'print',
  'qr_scan',
  'referral',
  'pahs_game',
  'chamber_event',
  'direct',
  'website',
  'other'
);

CREATE TYPE contact_type AS ENUM (
  'prospect',
  'client',
  'agent',
  'referral_partner',
  'community_partner'
);

CREATE TYPE policy_status AS ENUM (
  'quoted',
  'applied',
  'pending_underwriting',
  'approved',
  'issued',
  'declined',
  'lapsed',
  'cancelled'
);

CREATE TYPE policy_type AS ENUM (
  'term_life',
  'whole_life',
  'iul',
  'ul',
  'fia',
  'myga',
  'final_expense',
  'key_person',
  'other'
);

CREATE TYPE carrier_name AS ENUM (
  'north_american',
  'ethos',
  'american_equity',
  'fng',
  'corebridge',
  'foresters'
);

CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'held',
  'no_show',
  'cancelled',
  'rescheduled'
);

CREATE TYPE appointment_type AS ENUM (
  'discovery_call',
  'life_insurance_consultation',
  'annuity_consultation',
  'final_expense_consultation',
  'iul_strategy_session',
  'annual_review',
  'recruiting_discovery',
  'agent_coaching'
);

CREATE TYPE communication_channel AS ENUM (
  'email',
  'sms',
  'phone_call',
  'in_person',
  'video_call',
  'dm_facebook',
  'dm_instagram',
  'dm_linkedin'
);

CREATE TYPE agent_status AS ENUM (
  'recruited',
  'contracting',
  'licensing',
  'licensed',
  'active',
  'inactive',
  'terminated'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'overdue'
);

CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE workflow_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
);

-- ============================================================
-- CONTACTS TABLE (core CRM entity)
-- ============================================================

CREATE TABLE contacts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  date_of_birth     DATE,
  gender            TEXT,

  -- Address
  address_line1     TEXT,
  address_line2     TEXT,
  city              TEXT,
  state             TEXT DEFAULT 'PA',
  zip               TEXT,
  county            TEXT, -- Schuylkill, Luzerne, Northumberland

  -- Classification
  contact_type      contact_type NOT NULL DEFAULT 'prospect',
  lead_status       lead_status NOT NULL DEFAULT 'new',
  lead_source       lead_source,
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,

  -- Financial profile (for suitability)
  annual_income     NUMERIC(12,2),
  net_worth         NUMERIC(12,2),
  liquid_assets     NUMERIC(12,2),
  existing_coverage NUMERIC(12,2),
  retirement_savings NUMERIC(12,2),
  risk_tolerance    TEXT CHECK (risk_tolerance IN ('conservative','moderate','aggressive')),

  -- Insurance profile
  has_life_insurance    BOOLEAN DEFAULT FALSE,
  has_annuity           BOOLEAN DEFAULT FALSE,
  employer_coverage     BOOLEAN DEFAULT FALSE,
  smoker                BOOLEAN DEFAULT FALSE,
  health_rating         TEXT CHECK (health_rating IN ('preferred_plus','preferred','standard_plus','standard','substandard')),

  -- Relationships
  referred_by       UUID REFERENCES contacts(id),
  assigned_agent_id UUID, -- FK to agents table (added after)

  -- Engagement
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  do_not_contact    BOOLEAN DEFAULT FALSE,
  email_opt_in      BOOLEAN DEFAULT TRUE,
  sms_opt_in        BOOLEAN DEFAULT TRUE,

  -- Notes
  notes             TEXT,
  tags              TEXT[] DEFAULT '{}',

  -- Metadata
  is_deleted        BOOLEAN DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ
);

-- Indexes for contacts
CREATE INDEX idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_phone ON contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_contacts_lead_status ON contacts(lead_status);
CREATE INDEX idx_contacts_lead_source ON contacts(lead_source);
CREATE INDEX idx_contacts_assigned_agent ON contacts(assigned_agent_id);
CREATE INDEX idx_contacts_next_follow_up ON contacts(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX idx_contacts_name_search ON contacts USING gin((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_contacts_tags ON contacts USING gin(tags);

-- ============================================================
-- AGENTS TABLE
-- ============================================================

CREATE TABLE agents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity (links to contacts)
  contact_id        UUID REFERENCES contacts(id),
  user_id           UUID, -- Supabase auth user ID

  -- Professional
  license_number    TEXT,
  nipr_number       TEXT,
  license_state     TEXT DEFAULT 'PA',
  license_expiry    DATE,
  e_and_o_expiry    DATE,

  -- Status
  status            agent_status NOT NULL DEFAULT 'recruited',
  start_date        DATE,
  termination_date  DATE,

  -- Hierarchy
  upline_agent_id   UUID REFERENCES agents(id),
  agency_owner_id   UUID REFERENCES agents(id),

  -- Compensation
  commission_level  TEXT, -- e.g., '80%', '90%', '100%'
  override_level    TEXT,

  -- Carriers contracted
  carriers          carrier_name[] DEFAULT '{}',

  -- Performance
  ytd_premium       NUMERIC(12,2) DEFAULT 0,
  ytd_policies      INTEGER DEFAULT 0,
  ytd_annuity       NUMERIC(12,2) DEFAULT 0,

  -- Notes
  notes             TEXT,
  is_deleted        BOOLEAN DEFAULT FALSE
);

-- Add FK from contacts to agents
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_agent
  FOREIGN KEY (assigned_agent_id) REFERENCES agents(id);

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_upline ON agents(upline_agent_id);
CREATE INDEX idx_agents_license ON agents(license_number) WHERE license_number IS NOT NULL;

-- ============================================================
-- LEADS TABLE (intake events — separate from contacts)
-- ============================================================

CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contact linkage (may be null until matched/created)
  contact_id        UUID REFERENCES contacts(id),

  -- Raw intake data
  first_name        TEXT,
  last_name         TEXT,
  email             TEXT,
  phone             TEXT,

  -- Attribution
  source            lead_source NOT NULL DEFAULT 'direct',
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  utm_content       TEXT,
  utm_term          TEXT,
  referrer_url      TEXT,
  landing_page      TEXT,

  -- Interest
  interest          TEXT, -- 'life_insurance', 'annuity', 'final_expense', 'iul', 'agency_opportunity'
  coverage_amount   NUMERIC(12,2),
  message           TEXT,

  -- QR / PAHS specific
  qr_code_id        TEXT,
  scan_location     TEXT,
  game_date         DATE,

  -- Processing
  is_processed      BOOLEAN DEFAULT FALSE,
  processed_at      TIMESTAMPTZ,
  duplicate_of      UUID REFERENCES leads(id),

  -- Raw payload
  raw_payload       JSONB DEFAULT '{}'
);

CREATE INDEX idx_leads_contact ON leads(contact_id);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_unprocessed ON leads(is_processed) WHERE is_processed = FALSE;
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;

-- ============================================================
-- POLICIES TABLE
-- ============================================================

CREATE TABLE policies (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Relationships
  contact_id        UUID NOT NULL REFERENCES contacts(id),
  agent_id          UUID REFERENCES agents(id),

  -- Policy details
  policy_number     TEXT,
  carrier           carrier_name NOT NULL,
  policy_type       policy_type NOT NULL,
  product_name      TEXT,
  status            policy_status NOT NULL DEFAULT 'quoted',

  -- Coverage
  face_amount       NUMERIC(12,2), -- death benefit / coverage amount
  premium_monthly   NUMERIC(10,2),
  premium_annual    NUMERIC(10,2),
  premium_mode      TEXT CHECK (premium_mode IN ('monthly','quarterly','semi_annual','annual')),

  -- Annuity specific
  deposit_amount    NUMERIC(12,2), -- for annuities
  surrender_period  INTEGER, -- years
  income_rider      BOOLEAN DEFAULT FALSE,
  guaranteed_income NUMERIC(10,2), -- monthly guaranteed income

  -- Dates
  application_date  DATE,
  approval_date     DATE,
  issue_date        DATE,
  effective_date    DATE,
  expiry_date       DATE, -- for term policies
  lapse_date        DATE,

  -- Underwriting
  health_class      TEXT,
  uw_notes          TEXT,

  -- Commission
  commission_amount NUMERIC(10,2),
  commission_paid   BOOLEAN DEFAULT FALSE,
  commission_paid_at TIMESTAMPTZ,

  -- Beneficiaries (stored as JSONB for flexibility)
  beneficiaries     JSONB DEFAULT '[]',
  -- Example: [{"name": "Jane Doe", "relationship": "spouse", "percentage": 100}]

  -- Notes
  notes             TEXT,
  is_deleted        BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_policies_contact ON policies(contact_id);
CREATE INDEX idx_policies_agent ON policies(agent_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_carrier ON policies(carrier);
CREATE INDEX idx_policies_issue_date ON policies(issue_date);
CREATE INDEX idx_policies_policy_number ON policies(policy_number) WHERE policy_number IS NOT NULL;

-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Relationships
  contact_id        UUID NOT NULL REFERENCES contacts(id),
  agent_id          UUID REFERENCES agents(id),

  -- Appointment details
  appointment_type  appointment_type NOT NULL DEFAULT 'discovery_call',
  status            appointment_status NOT NULL DEFAULT 'scheduled',
  channel           communication_channel DEFAULT 'phone_call',

  -- Scheduling
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER DEFAULT 30,
  timezone          TEXT DEFAULT 'America/New_York',

  -- Location / link
  location          TEXT, -- address or video link
  google_event_id   TEXT, -- Google Calendar event ID

  -- Outcome
  held_at           TIMESTAMPTZ,
  outcome           TEXT, -- 'application_submitted', 'follow_up_needed', 'not_interested', etc.
  outcome_notes     TEXT,
  next_step         TEXT,

  -- Reminders sent
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent  BOOLEAN DEFAULT FALSE,

  -- Notes
  notes             TEXT
);

CREATE INDEX idx_appointments_contact ON appointments(contact_id);
CREATE INDEX idx_appointments_agent ON appointments(agent_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================================
-- COMMUNICATIONS TABLE (full interaction log)
-- ============================================================

CREATE TABLE communications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Relationships
  contact_id        UUID NOT NULL REFERENCES contacts(id),
  agent_id          UUID REFERENCES agents(id),
  appointment_id    UUID REFERENCES appointments(id),

  -- Communication details
  channel           communication_channel NOT NULL,
  direction         TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),

  -- Content (masked for PII compliance)
  subject           TEXT,
  body_preview      TEXT, -- first 200 chars only, no PII
  template_id       TEXT, -- reference to email/SMS template used
  template_vars     JSONB DEFAULT '{}', -- non-PII vars used

  -- Status
  status            TEXT CHECK (status IN ('sent','delivered','opened','clicked','replied','bounced','failed')),
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  opened_at         TIMESTAMPTZ,

  -- External IDs
  resend_id         TEXT, -- Resend email ID
  twilio_sid        TEXT, -- Twilio message SID

  -- Metadata
  metadata          JSONB DEFAULT '{}'
);

CREATE INDEX idx_communications_contact ON communications(contact_id);
CREATE INDEX idx_communications_agent ON communications(agent_id);
CREATE INDEX idx_communications_created ON communications(created_at DESC);
CREATE INDEX idx_communications_channel ON communications(channel);

-- ============================================================
-- TASKS TABLE
-- ============================================================

CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Relationships
  contact_id        UUID REFERENCES contacts(id),
  agent_id          UUID REFERENCES agents(id),
  appointment_id    UUID REFERENCES appointments(id),
  policy_id         UUID REFERENCES policies(id),

  -- Task details
  title             TEXT NOT NULL,
  description       TEXT,
  task_type         TEXT, -- 'follow_up', 'application', 'document', 'call', 'email', 'recruiting'
  status            task_status NOT NULL DEFAULT 'pending',
  priority          task_priority NOT NULL DEFAULT 'medium',

  -- Scheduling
  due_at            TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  completed_by      UUID REFERENCES agents(id),

  -- Assignment
  assigned_to       UUID REFERENCES agents(id),
  created_by        UUID REFERENCES agents(id),

  -- Automation
  is_automated      BOOLEAN DEFAULT FALSE,
  workflow_run_id   UUID, -- FK to workflow_runs (added after)

  -- Notes
  notes             TEXT
);

CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_agent ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- ============================================================
-- CAMPAIGNS TABLE
-- ============================================================

CREATE TABLE campaigns (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Campaign details
  name              TEXT NOT NULL,
  description       TEXT,
  campaign_type     TEXT, -- 'email_sequence', 'sms_sequence', 'facebook_ad', 'content_calendar', 'pahs_event'
  status            TEXT CHECK (status IN ('draft','active','paused','completed','archived')) DEFAULT 'draft',

  -- Targeting
  target_audience   TEXT, -- 'protector', 'planner', 'legacy_builder', 'senior', 'entrepreneur', 'all'
  lead_source_filter lead_source[],
  tag_filter        TEXT[],

  -- Schedule
  start_date        DATE,
  end_date          DATE,

  -- Budget
  budget            NUMERIC(10,2),
  spend_to_date     NUMERIC(10,2) DEFAULT 0,

  -- Performance
  leads_generated   INTEGER DEFAULT 0,
  appointments_set  INTEGER DEFAULT 0,
  policies_issued   INTEGER DEFAULT 0,
  premium_written   NUMERIC(12,2) DEFAULT 0,
  cost_per_lead     NUMERIC(10,2),
  roi               NUMERIC(10,4),

  -- Metadata
  metadata          JSONB DEFAULT '{}'
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);

-- ============================================================
-- QR CODES TABLE (PAHS & print tracking)
-- ============================================================

CREATE TABLE qr_codes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- QR details
  code_id           TEXT UNIQUE NOT NULL, -- short ID used in URL
  label             TEXT NOT NULL, -- human-readable label
  destination_url   TEXT NOT NULL,
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,

  -- Context
  placement         TEXT, -- 'pahs_program', 'barbershop', 'diner', 'flyer', 'business_card'
  event_name        TEXT, -- 'PAHS vs Blue Mountain 2026-09-06'
  campaign_id       UUID REFERENCES campaigns(id),

  -- Stats
  total_scans       INTEGER DEFAULT 0,
  unique_scans      INTEGER DEFAULT 0,
  last_scanned_at   TIMESTAMPTZ,

  -- Status
  is_active         BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_qr_codes_code_id ON qr_codes(code_id);
CREATE INDEX idx_qr_codes_campaign ON qr_codes(campaign_id);

-- ============================================================
-- QR SCANS TABLE (individual scan events)
-- ============================================================

CREATE TABLE qr_scans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Relationships
  qr_code_id        UUID NOT NULL REFERENCES qr_codes(id),
  lead_id           UUID REFERENCES leads(id),
  contact_id        UUID REFERENCES contacts(id),

  -- Scan context
  ip_address        TEXT, -- hashed for privacy
  user_agent        TEXT,
  device_type       TEXT, -- 'mobile', 'tablet', 'desktop'
  referrer          TEXT,

  -- Location (if available)
  scan_lat          NUMERIC(10,7),
  scan_lng          NUMERIC(10,7),

  -- Conversion tracking
  converted_to_lead BOOLEAN DEFAULT FALSE,
  converted_at      TIMESTAMPTZ
);

CREATE INDEX idx_qr_scans_qr_code ON qr_scans(qr_code_id);
CREATE INDEX idx_qr_scans_created ON qr_scans(created_at DESC);
CREATE INDEX idx_qr_scans_lead ON qr_scans(lead_id);

-- ============================================================
-- CONTENT CALENDAR TABLE
-- ============================================================

CREATE TABLE content_posts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Post details
  title             TEXT NOT NULL,
  body              TEXT,
  platform          TEXT NOT NULL CHECK (platform IN ('facebook','instagram','linkedin','all')),
  post_type         TEXT, -- 'educational','inspiration','social_proof','promotion','behind_scenes','reel','carousel','live'
  content_pillar    TEXT, -- 'education','inspiration','social_proof','promotion','behind_scenes'

  -- Scheduling
  scheduled_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  status            TEXT CHECK (status IN ('draft','scheduled','published','failed','archived')) DEFAULT 'draft',

  -- Campaign linkage
  campaign_id       UUID REFERENCES campaigns(id),
  week_number       INTEGER, -- 1–52

  -- Performance (populated after publishing)
  reach             INTEGER,
  impressions       INTEGER,
  engagements       INTEGER,
  clicks            INTEGER,
  leads_generated   INTEGER DEFAULT 0,

  -- Media
  media_urls        TEXT[] DEFAULT '{}',
  hashtags          TEXT[] DEFAULT '{}',

  -- External IDs
  platform_post_id  TEXT,

  -- AI generation
  ai_generated      BOOLEAN DEFAULT FALSE,
  ai_prompt         TEXT,
  reviewed_by       UUID REFERENCES agents(id)
);

CREATE INDEX idx_content_posts_platform ON content_posts(platform);
CREATE INDEX idx_content_posts_scheduled ON content_posts(scheduled_at);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_week ON content_posts(week_number);

-- ============================================================
-- WORKFLOW RUNS TABLE (agent harness execution log)
-- ============================================================

CREATE TABLE workflow_runs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Workflow identity
  workflow_name     TEXT NOT NULL, -- 'lead-follow-up', 'weekly-kpi-report', etc.
  workflow_version  TEXT DEFAULT '1.0.0',
  trigger_type      TEXT, -- 'lead_created', 'scheduled', 'manual', 'webhook'
  trigger_payload   JSONB DEFAULT '{}',

  -- Relationships
  contact_id        UUID REFERENCES contacts(id),
  agent_id          UUID REFERENCES agents(id),

  -- Execution
  status            workflow_status NOT NULL DEFAULT 'pending',
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  duration_ms       INTEGER,

  -- Steps (stored as JSONB array)
  steps             JSONB DEFAULT '[]',
  -- Example: [{"step": "research", "status": "completed", "duration_ms": 1200, "output": {...}}]

  -- Results
  output            JSONB DEFAULT '{}',
  error             TEXT,

  -- Compliance
  compliance_passed BOOLEAN,
  compliance_notes  TEXT,

  -- Cost tracking
  tokens_used       INTEGER DEFAULT 0,
  estimated_cost    NUMERIC(8,6) DEFAULT 0
);

-- Add FK from tasks to workflow_runs
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_workflow
  FOREIGN KEY (workflow_run_id) REFERENCES workflow_runs(id);

CREATE INDEX idx_workflow_runs_name ON workflow_runs(workflow_name);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_contact ON workflow_runs(contact_id);
CREATE INDEX idx_workflow_runs_created ON workflow_runs(created_at DESC);

-- ============================================================
-- KPI SNAPSHOTS TABLE (daily/weekly metrics)
-- ============================================================

CREATE TABLE kpi_snapshots (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Period
  snapshot_date     DATE NOT NULL,
  period_type       TEXT NOT NULL CHECK (period_type IN ('daily','weekly','monthly')),
  agent_id          UUID REFERENCES agents(id), -- NULL = agency total

  -- Personal production
  new_leads         INTEGER DEFAULT 0,
  appointments_set  INTEGER DEFAULT 0,
  appointments_held INTEGER DEFAULT 0,
  apps_submitted    INTEGER DEFAULT 0,
  policies_issued   INTEGER DEFAULT 0,
  premium_written   NUMERIC(12,2) DEFAULT 0,
  annuity_premium   NUMERIC(12,2) DEFAULT 0,
  commission_earned NUMERIC(12,2) DEFAULT 0,

  -- Digital
  fb_followers      INTEGER DEFAULT 0,
  ig_followers      INTEGER DEFAULT 0,
  li_connections    INTEGER DEFAULT 0,
  email_list_size   INTEGER DEFAULT 0,
  website_visitors  INTEGER DEFAULT 0,
  landing_page_leads INTEGER DEFAULT 0,
  ad_spend          NUMERIC(10,2) DEFAULT 0,
  cost_per_lead     NUMERIC(10,2) DEFAULT 0,

  -- Agency
  recruiting_convos INTEGER DEFAULT 0,
  discovery_calls   INTEGER DEFAULT 0,
  agents_contracted INTEGER DEFAULT 0,
  agents_licensed   INTEGER DEFAULT 0,
  active_agents     INTEGER DEFAULT 0,
  agency_premium    NUMERIC(12,2) DEFAULT 0,

  UNIQUE(snapshot_date, period_type, agent_id)
);

CREATE INDEX idx_kpi_snapshots_date ON kpi_snapshots(snapshot_date DESC);
CREATE INDEX idx_kpi_snapshots_agent ON kpi_snapshots(agent_id);
CREATE INDEX idx_kpi_snapshots_period ON kpi_snapshots(period_type);

-- ============================================================
-- AUDIT LOG TABLE (immutable event log)
-- ============================================================

CREATE TABLE audit_log (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor
  actor_id          UUID, -- agent or system
  actor_type        TEXT CHECK (actor_type IN ('agent','system','workflow','webhook')),
  actor_label       TEXT, -- masked display name

  -- Action
  action            TEXT NOT NULL, -- 'contact.created', 'policy.issued', 'lead.converted', etc.
  entity_type       TEXT NOT NULL, -- 'contact', 'policy', 'appointment', etc.
  entity_id         UUID NOT NULL,

  -- Change data (PII-safe diff)
  before_state      JSONB, -- masked
  after_state       JSONB, -- masked

  -- Context
  ip_address        TEXT, -- hashed
  user_agent        TEXT,
  request_id        TEXT,

  -- Compliance flag
  is_pii_event      BOOLEAN DEFAULT FALSE,
  retention_days    INTEGER DEFAULT 2555 -- 7 years for insurance compliance
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Agency owner sees everything
CREATE POLICY "agency_owner_full_access" ON contacts
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM agents WHERE status = 'active'
    )
  );

-- Agents see only their assigned contacts
CREATE POLICY "agent_own_contacts" ON contacts
  FOR SELECT USING (
    assigned_agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Service role bypasses RLS (for Cloudflare Worker + Agent Harness)
-- This is handled by using SUPABASE_SERVICE_ROLE_KEY in server-side code

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_content_posts_updated_at BEFORE UPDATE ON content_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_workflow_runs_updated_at BEFORE UPDATE ON workflow_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-write audit log on contact changes
CREATE OR REPLACE FUNCTION audit_contact_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    actor_type, action, entity_type, entity_id,
    before_state, after_state, is_pii_event
  ) VALUES (
    'system',
    CASE TG_OP
      WHEN 'INSERT' THEN 'contact.created'
      WHEN 'UPDATE' THEN 'contact.updated'
      WHEN 'DELETE' THEN 'contact.deleted'
    END,
    'contact',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN
      jsonb_build_object(
        'lead_status', OLD.lead_status,
        'assigned_agent_id', OLD.assigned_agent_id,
        'do_not_contact', OLD.do_not_contact
      )
    END,
    CASE WHEN TG_OP != 'DELETE' THEN
      jsonb_build_object(
        'lead_status', NEW.lead_status,
        'assigned_agent_id', NEW.assigned_agent_id,
        'do_not_contact', NEW.do_not_contact
      )
    END,
    TRUE -- contacts contain PII
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION audit_contact_changes();

-- Function to increment QR scan count
CREATE OR REPLACE FUNCTION increment_qr_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE qr_codes
  SET
    total_scans = total_scans + 1,
    last_scanned_at = NOW()
  WHERE id = NEW.qr_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_qr_scan_count
  AFTER INSERT ON qr_scans
  FOR EACH ROW EXECUTE FUNCTION increment_qr_scan_count();

-- Function to get pipeline summary
CREATE OR REPLACE FUNCTION get_pipeline_summary(p_agent_id UUID DEFAULT NULL)
RETURNS TABLE (
  status lead_status,
  count BIGINT,
  total_coverage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.lead_status,
    COUNT(*)::BIGINT,
    COALESCE(SUM(c.existing_coverage), 0)
  FROM contacts c
  WHERE
    (p_agent_id IS NULL OR c.assigned_agent_id = p_agent_id)
    AND c.is_deleted = FALSE
  GROUP BY c.lead_status
  ORDER BY c.lead_status;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly production summary
CREATE OR REPLACE FUNCTION get_monthly_production(
  p_year INTEGER,
  p_month INTEGER,
  p_agent_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'policies_issued', COUNT(*) FILTER (WHERE p.status = 'issued'),
    'premium_written', COALESCE(SUM(p.premium_annual) FILTER (WHERE p.status = 'issued'), 0),
    'annuity_premium', COALESCE(SUM(p.deposit_amount) FILTER (WHERE p.policy_type IN ('fia','myga') AND p.status = 'issued'), 0),
    'apps_submitted', COUNT(*) FILTER (WHERE p.status IN ('applied','pending_underwriting','approved','issued')),
    'commission_earned', COALESCE(SUM(p.commission_amount) FILTER (WHERE p.commission_paid = TRUE), 0)
  )
  INTO result
  FROM policies p
  WHERE
    EXTRACT(YEAR FROM p.issue_date) = p_year
    AND EXTRACT(MONTH FROM p.issue_date) = p_month
    AND (p_agent_id IS NULL OR p.agent_id = p_agent_id)
    AND p.is_deleted = FALSE;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VIEWS
-- ============================================================

-- Active pipeline view
CREATE VIEW v_active_pipeline AS
SELECT
  c.id,
  c.first_name || ' ' || c.last_name AS full_name,
  c.email,
  c.phone,
  c.lead_status,
  c.lead_source,
  c.next_follow_up_at,
  c.last_contacted_at,
  c.created_at AS lead_created_at,
  a.id AS agent_id,
  ac.first_name || ' ' || ac.last_name AS agent_name,
  COUNT(DISTINCT p.id) AS policy_count,
  COALESCE(SUM(p.premium_annual) FILTER (WHERE p.status = 'issued'), 0) AS total_premium
FROM contacts c
LEFT JOIN agents a ON c.assigned_agent_id = a.id
LEFT JOIN contacts ac ON a.contact_id = ac.id
LEFT JOIN policies p ON p.contact_id = c.id
WHERE
  c.is_deleted = FALSE
  AND c.lead_status NOT IN ('closed_won', 'closed_lost', 'do_not_contact')
GROUP BY c.id, a.id, ac.first_name, ac.last_name;

-- Agent leaderboard view
CREATE VIEW v_agent_leaderboard AS
SELECT
  a.id AS agent_id,
  ac.first_name || ' ' || ac.last_name AS agent_name,
  a.status,
  a.ytd_premium,
  a.ytd_policies,
  a.ytd_annuity,
  COUNT(DISTINCT c.id) AS total_contacts,
  COUNT(DISTINCT c.id) FILTER (WHERE c.lead_status = 'closed_won') AS closed_clients
FROM agents a
LEFT JOIN contacts ac ON a.contact_id = ac.id
LEFT JOIN contacts c ON c.assigned_agent_id = a.id
WHERE a.is_deleted = FALSE AND a.status = 'active'
GROUP BY a.id, ac.first_name, ac.last_name
ORDER BY a.ytd_premium DESC;

-- Today's tasks view
CREATE VIEW v_todays_tasks AS
SELECT
  t.*,
  c.first_name || ' ' || c.last_name AS contact_name,
  c.phone AS contact_phone,
  c.email AS contact_email
FROM tasks t
LEFT JOIN contacts c ON t.contact_id = c.id
WHERE
  t.status IN ('pending', 'in_progress')
  AND (t.due_at IS NULL OR t.due_at::DATE <= CURRENT_DATE)
ORDER BY t.priority DESC, t.due_at ASC;