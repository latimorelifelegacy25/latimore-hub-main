import { createClient } from "@supabase/supabase-js";
import type { AutomationSummary, LeadRow, TaskCandidate } from "./types";
import { buildTaskCandidates } from "./actions";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createRun(runKey: string, source: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("automation_runs")
    .insert({
      run_key: runKey,
      source,
      status: "started",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function finishRun(runId: string, status: "completed" | "failed", result: unknown, error?: string) {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("automation_runs")
    .update({
      status,
      result: result ?? {},
      error: error ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

async function fetchLeads(): Promise<LeadRow[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Lead query failed. Confirm the public.leads table exists and includes created_at. ${error.message}`);
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: (row.name || row.full_name || row.fullName || null) as string | null,
    first_name: (row.first_name || row.firstName || null) as string | null,
    last_name: (row.last_name || row.lastName || null) as string | null,
    email: (row.email || null) as string | null,
    phone: (row.phone || row.phone_number || row.phoneNumber || null) as string | null,
    status: (row.status || row.stage || null) as string | null,
    source: (row.source || null) as string | null,
    lead_source: (row.lead_source || row.leadSource || null) as string | null,
    created_at: (row.created_at || row.createdAt || null) as string | null,
    updated_at: (row.updated_at || row.updatedAt || null) as string | null,
    last_contacted_at: (row.last_contacted_at || row.lastContactedAt || null) as string | null,
    next_follow_up_at: (row.next_follow_up_at || row.nextFollowUpAt || null) as string | null,
    booked_at: (row.booked_at || row.bookedAt || null) as string | null,
    appointment_at: (row.appointment_at || row.appointmentAt || row.consultation_at || row.consultationAt || null) as string | null,
    score_tier: (row.score_tier || row.scoreTier || null) as string | null,
  })) as LeadRow[];
}

async function insertTask(task: TaskCandidate): Promise<"created" | "skipped"> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.rpc("create_crm_task_once", {
    p_lead_id: task.leadId,
    p_title: task.title,
    p_description: task.description,
    p_task_type: task.taskType,
    p_priority: task.priority,
    p_due_at: task.dueAt,
    p_automation_key: task.automationKey,
    p_payload: task.payload ?? {},
  });

  if (error) {
    throw error;
  }

  return "created";
}

export async function runDueAutomations(source = "manual"): Promise<AutomationSummary> {
  const runKey = `automation-${new Date().toISOString()}`;
  const runId = await createRun(runKey, source);

  const summary: AutomationSummary = {
    createdTasks: 0,
    skippedTasks: 0,
    errors: [],
    categories: {},
  };

  try {
    const leads = await fetchLeads();
    const candidates = buildTaskCandidates(leads);

    for (const task of candidates) {
      try {
        await insertTask(task);
        summary.createdTasks += 1;
        summary.categories[task.taskType] = (summary.categories[task.taskType] || 0) + 1;
      } catch (err) {
        summary.errors.push(
          `${task.automationKey}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    await finishRun(runId, summary.errors.length ? "failed" : "completed", summary, summary.errors.join("; "));
    return summary;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    summary.errors.push(message);
    await finishRun(runId, "failed", summary, message);
    throw err;
  }
}
