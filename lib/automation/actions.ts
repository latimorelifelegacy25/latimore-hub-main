import type { LeadRow, TaskCandidate } from "./types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function asDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function leadDisplayName(lead: LeadRow): string {
  const full = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  return lead.name || full || lead.email || lead.phone || "Lead";
}

function ageMs(date?: string | null): number {
  const d = asDate(date);
  return d ? Date.now() - d.getTime() : Number.POSITIVE_INFINITY;
}

function dueIn(hours: number): string {
  return new Date(Date.now() + hours * HOUR).toISOString();
}

function isStatus(lead: LeadRow, status: string): boolean {
  return (lead.status || "").toLowerCase().trim() === status.toLowerCase();
}

export function buildTaskCandidates(leads: LeadRow[]): TaskCandidate[] {
  const tasks: TaskCandidate[] = [];

  for (const lead of leads) {
    const name = leadDisplayName(lead);
    const createdAge = ageMs(lead.created_at);
    const updatedAge = ageMs(lead.updated_at);
    const lastContactAge = ageMs(lead.last_contacted_at);
    const bookedAt = asDate(lead.booked_at || lead.appointment_at);
    const status = (lead.status || "").toLowerCase().trim();

    if (isStatus(lead, "new") && createdAge <= DAY && lastContactAge === Number.POSITIVE_INFINITY) {
      tasks.push({
        leadId: String(lead.id),
        title: `Immediate contact: ${name}`,
        description:
          "Send immediate text and email. Qualify pain point: family protection, retirement, business owner, final expense, or income protection.",
        taskType: "new_lead_contact",
        priority: "urgent",
        dueAt: dueIn(0),
        automationKey: `new-lead-contact-${lead.id}`,
        payload: {
          lead,
          suggestedText:
            "Hi {{name}}, this is Jackson with Latimore Life & Legacy. I saw your request come through and wanted to personally reach out. Are you mainly looking at family protection, retirement income, business protection, or final expense planning?",
        },
      });
    }

    if (["new", "qualified"].includes(status) && createdAge >= 3 * DAY && createdAge <= 7 * DAY && lastContactAge >= 2 * DAY) {
      tasks.push({
        leadId: String(lead.id),
        title: `Reactivation follow-up: ${name}`,
        description:
          "Use a different value hook than first touch. Keep it educational and low pressure.",
        taskType: "reactivation",
        priority: "high",
        dueAt: dueIn(2),
        automationKey: `no-response-3-7-${lead.id}`,
        payload: {
          lead,
          suggestedText:
            "Hi {{name}}, quick follow-up. A lot of people wait until rates, health, or timing force the decision. I can help you compare simple options now so you know what protection actually fits.",
        },
      });
    }

    if (isStatus(lead, "booked") && bookedAt) {
      const untilAppt = bookedAt.getTime() - Date.now();
      if (untilAppt > 0 && untilAppt <= 48 * HOUR) {
        tasks.push({
          leadId: String(lead.id),
          title: `Confirm booked consultation: ${name}`,
          description:
            "Send confirmation, reminder, and prep checklist so the client comes ready.",
          taskType: "consult_confirmation",
          priority: "high",
          dueAt: dueIn(1),
          automationKey: `booked-confirmation-${lead.id}-${bookedAt.toISOString().slice(0, 10)}`,
          payload: {
            lead,
            appointmentAt: bookedAt.toISOString(),
            checklist: [
              "Current life insurance policy details, if any",
              "Retirement account estimates",
              "Monthly income and major expenses",
              "Mortgage or debt balance",
              "Main protection goal",
            ],
          },
        });
      }
    }

    const dormantAge = Math.min(updatedAge, lastContactAge);
    for (const days of [30, 60, 90]) {
      const lower = days * DAY;
      const upper = (days + 3) * DAY;
      if (["new", "qualified", "nurture", "no response"].includes(status) && dormantAge >= lower && dormantAge <= upper) {
        tasks.push({
          leadId: String(lead.id),
          title: `${days}-day nurture: ${name}`,
          description:
            "Send a soft reengagement message with an education-first angle and local trust tie-in.",
          taskType: "dormant_nurture",
          priority: days === 30 ? "normal" : "low",
          dueAt: dueIn(6),
          automationKey: `dormant-${days}-${lead.id}`,
          payload: {
            lead,
            daysDormant: days,
            suggestedText:
              "Hi {{name}}, checking in with a quick education-first note. Your protection plan should match your family, income, and future goals — not a generic one-size-fits-all policy.",
          },
        });
      }
    }
  }

  return tasks;
}
