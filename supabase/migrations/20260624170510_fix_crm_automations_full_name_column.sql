
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
    l.id::text,
    'Immediate contact: ' || coalesce(nullif(trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')), ''), nullif(l.email, ''), nullif(l.phone, ''), 'Lead'),
    'Send immediate text and email. Qualify pain point: family protection, retirement, business owner, final expense, or income protection.',
    'new_lead_contact',
    'urgent',
    now(),
    'new-lead-contact-' || l.id::text,
    jsonb_build_object(
      'lead_id', l.id,
      'name', trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')),
      'email', l.email,
      'phone', l.phone,
      'product_interest', l.product_interest,
      'suggested_text', 'Hi ' || coalesce(nullif(l.first_name, ''), 'there') || ', this is Jackson with Latimore Life & Legacy. I saw your request come through and wanted to personally reach out. Are you mainly looking at family protection, retirement income, business protection, or final expense planning?'
    )
  from public.leads l
  where lower(coalesce(l.status, 'new')) = 'new'
    and l.created_at >= now() - interval '24 hours'
    and l.last_contacted_at is null
  on conflict (lead_id, automation_key) where automation_key is not null do nothing;
  get diagnostics v_created_new = row_count;

  -- REACTIVATION: 3-7 day no response
  insert into public.crm_tasks (
    lead_id, title, description, task_type, priority, due_at, automation_key, payload
  )
  select
    l.id::text,
    'Reactivation follow-up: ' || coalesce(nullif(trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')), ''), nullif(l.email, ''), nullif(l.phone, ''), 'Lead'),
    'Use a different value hook than first touch. Keep it educational and low pressure.',
    'reactivation',
    'high',
    now() + interval '2 hours',
    'no-response-3-7-' || l.id::text,
    jsonb_build_object(
      'lead_id', l.id,
      'name', trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')),
      'email', l.email,
      'phone', l.phone,
      'product_interest', l.product_interest,
      'suggested_text', 'Hi ' || coalesce(nullif(l.first_name, ''), 'there') || ', quick follow-up. A lot of people wait until rates, health, or timing force the decision. I can help you compare simple options now so you know what protection actually fits.'
    )
  from public.leads l
  where lower(coalesce(l.status, 'new')) in ('new', 'qualified')
    and l.created_at <= now() - interval '3 days'
    and l.created_at >= now() - interval '7 days'
    and (l.last_contacted_at is null or l.last_contacted_at <= now() - interval '2 days')
  on conflict (lead_id, automation_key) where automation_key is not null do nothing;
  get diagnostics v_created_reactivation = row_count;

  -- BOOKED: consultation confirmation
  insert into public.crm_tasks (
    lead_id, title, description, task_type, priority, due_at, automation_key, payload
  )
  select
    l.id::text,
    'Confirm booked consultation: ' || coalesce(nullif(trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')), ''), nullif(l.email, ''), nullif(l.phone, ''), 'Lead'),
    'Send confirmation, reminder, and prep checklist so the client comes ready.',
    'consult_confirmation',
    'high',
    now() + interval '1 hour',
    'booked-confirmation-' || l.id::text || '-' || to_char(l.booked_at, 'YYYY-MM-DD'),
    jsonb_build_object(
      'lead_id', l.id,
      'name', trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')),
      'email', l.email,
      'phone', l.phone,
      'booked_at', l.booked_at,
      'checklist', jsonb_build_array('Current life insurance policy details, if any', 'Retirement account estimates', 'Monthly income and major expenses', 'Mortgage or debt balance', 'Main protection goal')
    )
  from public.leads l
  where lower(coalesce(l.status, '')) = 'booked'
    and l.booked_at is not null
    and l.booked_at > now()
    and l.booked_at <= now() + interval '48 hours'
  on conflict (lead_id, automation_key) where automation_key is not null do nothing;
  get diagnostics v_created_booked = row_count;

  -- DORMANT: 30-day nurture
  insert into public.crm_tasks (
    lead_id, title, description, task_type, priority, due_at, automation_key, payload
  )
  select
    l.id::text,
    'Dormant lead nurture: ' || coalesce(nullif(trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')), ''), nullif(l.email, ''), nullif(l.phone, ''), 'Lead'),
    'Send a soft reengagement message with an education-first angle and local trust tie-in.',
    'dormant_nurture',
    'normal',
    now() + interval '6 hours',
    'dormant-30-' || l.id::text,
    jsonb_build_object(
      'lead_id', l.id,
      'name', trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')),
      'email', l.email,
      'phone', l.phone,
      'suggested_text', 'Hi ' || coalesce(nullif(l.first_name, ''), 'there') || ', checking in with a quick education-first note. Your protection plan should match your family, income, and future goals — not a generic one-size-fits-all policy.'
    )
  from public.leads l
  where lower(coalesce(l.status, 'new')) in ('new', 'qualified', 'nurture', 'no response')
    and coalesce(l.last_contacted_at, l.created_at) <= now() - interval '30 days'
    and coalesce(l.last_contacted_at, l.created_at) >= now() - interval '33 days'
  on conflict (lead_id, automation_key) where automation_key is not null do nothing;
  get diagnostics v_created_dormant = row_count;

  update public.leads
  set last_automation_at = now()
  where id in (
    select lead_id::uuid
    from public.crm_tasks
    where created_at >= now() - interval '5 minutes'
      and lead_id ~* '^[0-9a-f-]{36}$'
  );

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
