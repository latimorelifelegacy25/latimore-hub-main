export type AutomationSummary = {
  createdTasks: number;
  skippedTasks: number;
  errors: string[];
  categories: Record<string, number>;
};

export type LeadRow = {
  id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  source?: string | null;
  lead_source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
  booked_at?: string | null;
  appointment_at?: string | null;
  score_tier?: string | null;
};

export type TaskCandidate = {
  leadId: string;
  title: string;
  description: string;
  taskType: string;
  priority: "low" | "normal" | "high" | "urgent";
  dueAt: string;
  automationKey: string;
  payload?: Record<string, unknown>;
};
