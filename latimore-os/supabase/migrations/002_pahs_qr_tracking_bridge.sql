-- PAHS QR tracking bridge for the active Supabase production schema.
-- This migration is intentionally isolated from the legacy all-in-one schema.

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  code_id text UNIQUE NOT NULL,
  label text NOT NULL,
  destination_url text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  placement text,
  event_name text,
  campaign_id uuid,
  total_scans integer NOT NULL DEFAULT 0,
  unique_scans integer NOT NULL DEFAULT 0,
  last_scanned_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  qr_code_id uuid NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  lead_id uuid,
  contact_id uuid,
  ip_address text,
  user_agent text,
  device_type text,
  referrer text,
  scan_lat numeric(10,7),
  scan_lng numeric(10,7),
  converted_to_lead boolean NOT NULL DEFAULT false,
  converted_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_code_id ON public.qr_codes(code_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_campaign ON public.qr_codes(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_code ON public.qr_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_created ON public.qr_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scans_ip ON public.qr_scans(ip_address) WHERE ip_address IS NOT NULL;

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_qr_scan_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.qr_codes
  SET total_scans = total_scans + 1,
      last_scanned_at = now()
  WHERE id = NEW.qr_code_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_qr_scan_count ON public.qr_scans;
CREATE TRIGGER trg_qr_scan_count
AFTER INSERT ON public.qr_scans
FOR EACH ROW EXECUTE FUNCTION public.increment_qr_scan_count();

INSERT INTO public.qr_codes
  (code_id, label, destination_url, utm_source, utm_medium, utm_campaign, placement, is_active)
VALUES
  ('pahs', 'PAHS Game Day Primary', 'https://www.latimorelifelegacy.com/pahs/v2', 'print', 'qr', 'pahs-2026', 'pahs_program', true),
  ('pahs-fb', 'PAHS Facebook', 'https://www.latimorelifelegacy.com/pahs/v2', 'facebook', 'social', 'pahs-2026', 'facebook', true),
  ('pahs-ig', 'PAHS Instagram', 'https://www.latimorelifelegacy.com/pahs/v2', 'instagram', 'social', 'pahs-2026', 'instagram', true),
  ('biz-card', 'Business Card', 'https://www.latimorelifelegacy.com', 'print', 'business_card', 'brand', 'business_card', true),
  ('flyer-1', 'Community Flyer', 'https://www.latimorelifelegacy.com', 'print', 'flyer', 'local-outreach', 'community_flyer', true)
ON CONFLICT (code_id) DO UPDATE SET
  label = EXCLUDED.label,
  destination_url = EXCLUDED.destination_url,
  utm_source = EXCLUDED.utm_source,
  utm_medium = EXCLUDED.utm_medium,
  utm_campaign = EXCLUDED.utm_campaign,
  placement = EXCLUDED.placement,
  is_active = EXCLUDED.is_active;
