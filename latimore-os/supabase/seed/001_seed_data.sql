-- ============================================================
-- LATIMORE OS — SEED DATA
-- Development & Testing Data
-- ============================================================

-- Insert agency owner agent record (Jackson)
INSERT INTO contacts (
  id, first_name, last_name, email, phone,
  contact_type, lead_status, city, state, county
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Jackson', 'Latimore',
  'Jackson1989@latimorelegacy.com',
  '7176152613',
  'agent', 'closed_won',
  'Pottsville', 'PA', 'Schuylkill'
);

INSERT INTO agents (
  id, contact_id, license_number, nipr_number,
  license_state, status, start_date,
  carriers, commission_level
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '1268820', '21638507',
  'PA', 'active', '2026-07-01',
  ARRAY['north_american','ethos','american_equity','fng','corebridge','foresters']::carrier_name[],
  '100%'
);

-- Sample QR codes for PAHS campaign
INSERT INTO qr_codes (code_id, label, destination_url, utm_source, utm_medium, utm_campaign, placement)
VALUES
  ('pahs', 'PAHS Game Day Primary', 'https://card.latimorelifelegacy.com/pahs', 'print', 'qr', 'pahs-2026', 'pahs_program'),
  ('pahs-fb', 'PAHS Facebook', 'https://card.latimorelifelegacy.com/pahs?utm_source=facebook', 'facebook', 'social', 'pahs-2026', 'facebook'),
  ('pahs-ig', 'PAHS Instagram', 'https://card.latimorelifelegacy.com/pahs?utm_source=instagram', 'instagram', 'social', 'pahs-2026', 'instagram'),
  ('biz-card', 'Business Card', 'https://latimorelifelegacy.com?utm_source=print&utm_medium=business_card', 'print', 'business_card', 'brand', 'business_card'),
  ('flyer-1', 'Barbershop Flyer', 'https://latimorelifelegacy.com?utm_source=print&utm_medium=flyer', 'print', 'flyer', 'local-outreach', 'barbershop');

-- Sample campaigns
INSERT INTO campaigns (name, description, campaign_type, status, target_audience, start_date, end_date, budget)
VALUES
  ('July Launch Campaign', 'Agency launch — free quote push', 'facebook_ad', 'active', 'all', '2026-07-01', '2026-07-31', 500.00),
  ('PAHS Sponsorship 2026', 'PAHS Crimson Tide Football sponsorship campaign', 'pahs_event', 'active', 'all', '2026-08-01', '2026-11-30', 1000.00),
  ('Back to School Protection', 'August family protection push', 'facebook_ad', 'draft', 'protector', '2026-08-01', '2026-08-31', 500.00),
  ('Retirement Income September', '401k rollover and annuity campaign', 'facebook_ad', 'draft', 'planner', '2026-09-01', '2026-09-30', 750.00),
  ('Final Expense October', 'Senior outreach — final expense month', 'facebook_ad', 'draft', 'senior', '2026-10-01', '2026-10-31', 500.00);

-- Sample content posts (first 2 weeks)
INSERT INTO content_posts (title, platform, post_type, content_pillar, scheduled_at, status, week_number, hashtags)
VALUES
  ('Launch Announcement', 'facebook', 'educational', 'behind_scenes', '2026-07-01 09:00:00-04', 'scheduled', 1, ARRAY['#LatimoreLifeAndLegacy','#ProtectingTodaySecuringTomorrow','#TheBeatGoesOn','#SchuylkillCounty']),
  ('Launch Reel', 'instagram', 'reel', 'behind_scenes', '2026-07-01 10:00:00-04', 'scheduled', 1, ARRAY['#LatimoreLifeAndLegacy','#LifeInsurance','#TheBeatGoesOn']),
  ('LinkedIn Launch Post', 'linkedin', 'educational', 'behind_scenes', '2026-07-01 08:00:00-04', 'scheduled', 1, ARRAY['#LifeInsurance','#FinancialProtection','#TheBeatGoesOn']),
  ('Monday Money Tip - Employer Coverage', 'facebook', 'educational', 'education', '2026-07-06 09:00:00-04', 'scheduled', 2, ARRAY['#LifeInsurance','#FamilyProtection','#LatimoreLifeAndLegacy']),
  ('Employer Coverage Carousel', 'instagram', 'carousel', 'education', '2026-07-07 10:00:00-04', 'scheduled', 2, ARRAY['#LifeInsurance','#FamilyFirst','#TheBeatGoesOn']),
  ('Free Quote Friday Week 2', 'facebook', 'promotion', 'promotion', '2026-07-10 09:00:00-04', 'scheduled', 2, ARRAY['#FreeQuoteFriday','#LifeInsurance','#LatimoreLifeAndLegacy']);