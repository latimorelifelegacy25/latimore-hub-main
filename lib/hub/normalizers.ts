type PipelineStage = 'New' | 'Attempted_Contact' | 'Qualified' | 'Booked' | 'Sold' | 'Follow_Up' | 'Lost'
type ProductInterest =
  | 'Mortgage_Protection'
  | 'Final_Expense'
  | 'Term_Life'
  | 'Whole_Life'
  | 'Child_Whole_Life'
  | 'Accident'
  | 'Critical_Illness'
  | 'IUL'
  | 'Annuity'
  | 'Retirement'
  | 'Business'
  | 'General'
type EventType =
  | 'page_view'
  | 'cta_click'
  | 'call_click'
  | 'text_click'
  | 'email_click'
  | 'book_click'
  | 'form_submit'
  | 'lead_created'
  | 'appointment_booked'
  | 'stage_changed'
  | 'county_selected'
  | 'product_selected'
  | 'lead_magnet_download'
  | 'post_viewed'
  | 'post_created'
  | 'post_published'
  | 'reaction_added'

const STAGE_MAP: Record<string, PipelineStage> = {
  new: 'New',
  new_inquiry: 'New',
  attempted_contact: 'Attempted_Contact',
  attemptedcontact: 'Attempted_Contact',
  qualified: 'Qualified',
  booked: 'Booked',
  sold: 'Sold',
  closed_won: 'Sold',
  won: 'Sold',
  follow_up: 'Follow_Up',
  followup: 'Follow_Up',
  closed_lost: 'Lost',
  lost: 'Lost',
}

const PRODUCT_MAP: Record<string, ProductInterest> = {
  mortgage_protection: 'Mortgage_Protection',
  mortgage: 'Mortgage_Protection',
  mortgageprotection: 'Mortgage_Protection',
  final_expense: 'Final_Expense',
  finalexpense: 'Final_Expense',
  burial: 'Final_Expense',
  funeral: 'Final_Expense',
  term: 'Term_Life',
  term_life: 'Term_Life',
  termlife: 'Term_Life',
  life_term: 'Term_Life',
  whole_life: 'Whole_Life',
  wholelife: 'Whole_Life',
  child_whole_life: 'Child_Whole_Life',
  childwholelife: 'Child_Whole_Life',
  accident: 'Accident',
  critical_illness: 'Critical_Illness',
  criticalillness: 'Critical_Illness',
  iul: 'IUL',
  indexed_universal_life: 'IUL',
  indexeduniversallife: 'IUL',
  indexed_ul: 'IUL',
  indexedul: 'IUL',
  builder_plus_iul: 'IUL',
  builderplusiul: 'IUL',
  annuity: 'Annuity',
  annuities: 'Annuity',
  retirement: 'Retirement',
  retirement_planning: 'Retirement',
  medicare: 'General',
  medicare_advantage: 'General',
  business: 'Business',
  velocity: 'General',
  depth: 'General',
  group: 'General',
  general: 'General',
}

const EVENT_MAP: Record<string, EventType> = {
  page_view: 'page_view',
  pageview: 'page_view',
  visit: 'page_view',
  cta_click: 'cta_click',
  click: 'cta_click',
  call_click: 'call_click',
  text_click: 'text_click',
  sms_click: 'text_click',
  email_click: 'email_click',
  book_click: 'book_click',
  form_submit: 'form_submit',
  submit: 'form_submit',
  lead_created: 'lead_created',
  appointment_booked: 'appointment_booked',
  booking_confirmed: 'appointment_booked',
  stage_changed: 'stage_changed',
  county_selected: 'county_selected',
  product_selected: 'product_selected',
  lead_magnet_download: 'lead_magnet_download',
  download: 'lead_magnet_download',
  post_viewed: 'post_viewed',
  post_created: 'post_created',
  post_published: 'post_published',
  reaction_added: 'reaction_added',
  // Spec-hardening §6 — named funnel + GBP events
  legacy_checkup_started: 'legacy_checkup_started',
  checkup_started: 'legacy_checkup_started',
  funnel_started: 'legacy_checkup_started',
  legacy_checkup_step_completed: 'legacy_checkup_step_completed',
  checkup_step: 'legacy_checkup_step_completed',
  funnel_step: 'legacy_checkup_step_completed',
  legacy_checkup_completed: 'legacy_checkup_completed',
  checkup_completed: 'legacy_checkup_completed',
  funnel_completed: 'legacy_checkup_completed',
  lead_submitted: 'lead_submitted',
  contact_submitted: 'lead_submitted',
  book_consultation_clicked: 'book_consultation_clicked',
  book_consultation: 'book_consultation_clicked',
  consultation_clicked: 'book_consultation_clicked',
  instant_quote_clicked: 'instant_quote_clicked',
  instant_quote: 'instant_quote_clicked',
  quote_clicked: 'instant_quote_clicked',
  service_card_clicked: 'service_card_clicked',
  service_click: 'service_card_clicked',
  gbp_service_visit: 'gbp_service_visit',
  gbp_visit: 'gbp_service_visit',
  business_profile_visit: 'gbp_service_visit',
}

function normalizeKey(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function normalizeStage(value?: string | null): PipelineStage {
  return STAGE_MAP[normalizeKey(value)] ?? 'New'
}

export function normalizeProductInterest(value?: string | null): ProductInterest {
  return PRODUCT_MAP[normalizeKey(value)] ?? 'General'
}

export function normalizeEventType(value?: string | null): EventType {
  return EVENT_MAP[normalizeKey(value)] ?? 'page_view'
}

const CAMPAIGN_MAP: Record<string, string> = {
  pahs: 'PAHS_2026',
  pahs_2026: 'PAHS_2026',
  pahs2026: 'PAHS_2026',
  pahs_football: 'PAHS_2026',
  pahsfootball: 'PAHS_2026',
  pahs_protect: 'PAHS_2026',
  pahsprotect: 'PAHS_2026',
  chamber: 'CHAMBER',
  chamber_of_commerce: 'CHAMBER',
  gbp: 'GBP_SERVICES',
  gbp_services: 'GBP_SERVICES',
  gbpservices: 'GBP_SERVICES',
  google_business_profile: 'GBP_SERVICES',
  website: 'WEBSITE_DIRECT',
  website_direct: 'WEBSITE_DIRECT',
  direct: 'WEBSITE_DIRECT',
  referral: 'REFERRAL',
  referrals: 'REFERRAL',
}

export function normalizeCampaign(value?: string | null): string {
  const key = normalizeKey(value)
  if (!key) return 'UNKNOWN'
  return CAMPAIGN_MAP[key] ?? key.toUpperCase()
}

export function normalizePhone(value?: string | null): string | null {
  if (typeof value !== 'string') return null
  const digits = value.replace(/\D/g, '')
  if (!digits) return null

  // Standardize US numbers for dedupe while allowing non-US numbers to remain searchable.
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return digits.slice(0, 20)
}

export function cleanString(value?: string | null, max = 255): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export function pickFirst(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const cleaned = cleanString(value)
    if (cleaned) return cleaned
  }
  return null
}

export type { PipelineStage, ProductInterest, EventType }
