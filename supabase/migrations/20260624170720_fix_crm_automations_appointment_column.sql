
CREATE OR REPLACE FUNCTION public.run_due_crm_automations_sql()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_run_id uuid;
  v_created_new int := 0;
  v_created_reactivation int := 0;
  v_created_booked int := 0;
  v_created_dormant int := 0;
  v_result jsonb;
begin
  insert into public.automation_runs (run_key, source, status)
  values ('sql-cron-' || now()::text, 'supabase_sql_cron', 'started')
  returning id into v_run_id;

  -- NEW LEAD: immediate contact
  insert into public.crm_tasks (
    lead_id, title, description, task_type, priority, due_at, automation_key, payload
  )
  select
    c.id,
    'Immediate contact: ' || coalesce(nullif(c."fullName", ''), nullif(c.email, ''), nullif(c.phone, ''), 'Lead'),
    'Send immediate text and email. Qualify pain point: family protection, retirement, business owner, final expense, or income protection.',
    'new_lead_contact', 'urgent', now(),
    'new-lead-contact-' || i.id,
    jsonb_build_object(
      'contact_id', c.id, 'inquiry_id', i.id,
      'name', coalesce(c."fullName", ''),
      'email', coalesce(c.email, ''),
      'phone', coalesce(c.phone, ''),
      'product_interest', i."productInterest",
      'suggested_text', 'Hi ' || coalesce(nullif(c."firstName", ''), 'there') || ', this is Jackson with Latimore Life & Legacy. I saw your request come through and wanted to personally reach out. Are you mainly looking at family protection, retirement income, business protection, or final expense planning?'
    )
  from "Inquiry" i
  join "Contact" c on c.id = i."contactId"
  where i."createdAt" >= now() - interval '24 hours'
    and i.stage::text = 'NEW'
    and c."lastActivityAt" is null
  on conflict (lead_id, automation_key) where automation_key is not null do nothing;
  get diagnostics v_created_new = row_count;

  -- REACTIVATION: 3-7 day no response
  insert into public.crm_tasks (
    lead_id, title, description, task_type, priority, due_at, automation_key, payload
  )
  select
    c.id,
    'Reactivation follow-up: ' || coalesce(nullif(c."fullName", ''), nullif(c.email, ''), nullif(c.phone, ''), 'Lead'),
    'Use a different value hook than first touch. Keep it educational and low pressure.',
    'reactivation', 'high', now() + interval '2 hours',
    'no-response-3-7-' || i.id,
    jsonb_build_object(
      'contact_id', c.id, 'inquiry_id', i.id,
      'name', coalesce(c."fullName", ''),
      'email', coalesce(c.email, ''),
      'phone', coalesce(c.phone, ''),
      'product_interest', i."productInterest",
      'suggested_text', 'Hi ' || coalesce(nullif(c."firstName", ''), 'there') || ', quick follow-up. A lot of people wait until rates, health, or timing force the decision. I can help you compare simple options now so you know what protection actually fits.'
    )
  from "Inquiry" i
  join "Contact" c on c.id = i."contactId"
  where i.stage::text in ('NEW', 'QUALIFIED')
    and i."createdAt" <= now() - interval '3 days'
    and i."createdAt" >= now() - interval '7 days'
    and (c."lastActivityAt" is null or c."lastActivityAt" <= now() - interval '2 days')
  on conflict (lead_id, automation_key) where automation_key is not null do nothing;
  get diagnostics v_created_reactivation = row_count;

  -- BOOKED: consultation confirmation
  insert into public.crm_tasks (
    lead_id, title, description, task_type, priority, due_at, automation_key, payload
  )
  select
    c.id,
    'Confirm booked consultation: ' || coalesce(nullif(c."fullName", ''), nullif(c.email, ''), nullif(c.phone, ''), 'Lead'),
    'Send confirmation, reminder, and prep checklist so the client comes ready.',
    'consult_confirmation', 'high', now() + interval '1 hour',
    'booked-confirmation-' || a.id,
    jsonb_build_object(
      'contact_id', c.id, 'appointment_id', a.id,
      'name', coalesce(c."fullName", ''),
      'email', coalesce(c.email, ''),
      'phone', coalesce(c.phone, ''),
      'booked_at', a."scheduledFor",
      'checklist', jsonb_build_array(
        'Current life insurance policy details, if any',
        'Retirement account estimates',
        'Monthly income and major expenses',
        'Mortgage or debt balance',
        'Main protection goal'
      )
    )
  from "Appointment" a
  join "Contact" c on c.id = a."contactId"
  where lower(a.status) = 'confirmed'
    and a."scheduledFor" > now()
    and a."scheduledFor" <= now() + interval '48 hours'
  on conflict (lead_id, automation_key) where automation_key is not null do nothing;
  get diagnostics v_created_booked = row_count;

  -- DORMANT: 30-day nurture
  insert into public.crm_tasks (
    lead_id, title, description, task_type, priority, due_at, automation_key, payload
  )
  select
    c.id,
    'Dormant lead nurture: ' || coalesce(nullif(c."fullName", ''), nullif(c.email, ''), nullif(c.phone, ''), 'Lead'),
    'Send a soft reengagement message with an education-first angle and local trust tie-in.',
    'dormant_nurture', 'normal', now() + interval '6 hours',
    'dormant-30-' || i.id,
    jsonb_build_object(
      'contact_id', c.id, 'inquiry_id', i.id,
      'name', coalesce(c."fullName", ''),
      'email', coalesce(c.email, ''),
      'phone', coalesce(c.phone, ''),
      'suggested_text', 'Hi ' || coalesce(nullif(c."firstName", ''), 'there') || ', checking in with a quick education-first note. Your protection plan should match your family, income, and future goals — not a generic one-size-fits-all policy.'
    )
  from "Inquiry" i
  join "Contact" c on c.id = i."contactId"
  where i.stage::text in ('NEW', 'QUALIFIED', 'NURTURE')
    and coalesce(c."lastActivityAt", i."createdAt") <= now() - interval '30 days'
    and coalesce(c."lastActivityAt", i."createdAt") >= now() - interval '33 days'
  on conflict (lead_id, automation_key) where automation_key is not null do nothing;
  get diagnostics v_created_dormant = row_count;

  v_result := jsonb_build_object(
    'created_new_lead_tasks', v_created_new,
    'created_reactivation_tasks', v_created_reactivation,
    'created_booked_confirmation_tasks', v_created_booked,
    'created_dormant_tasks', v_created_dormant,
    'created_total', v_created_new + v_created_reactivation + v_created_booked + v_created_dormant
  );

  update public.automation_runs
  set status = 'completed', finished_at = now(), result = v_result
  where id = v_run_id;

  return v_result;
exception when others then
  update public.automation_runs
  set status = 'failed', finished_at = now(), error = sqlerrm
  where id = v_run_id;
  raise;
end;
$$;
