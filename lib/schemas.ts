import { z } from 'zod'

const stageEnum = z.enum(['New', 'Attempted_Contact', 'Qualified', 'Booked', 'Sold', 'Follow_Up', 'Lost'])
const productEnum = z.enum([
  'Mortgage_Protection',
  'Final_Expense',
  'Term_Life',
  'Whole_Life',
  'Child_Whole_Life',
  'Accident',
  'Critical_Illness',
  'IUL',
  'Annuity',
  'Retirement',
  'Business',
  'General',
])
const eventEnum = z.enum([
  'page_view',
  'cta_click',
  'call_click',
  'text_click',
  'email_click',
  'book_click',
  'form_submit',
  'lead_created',
  'appointment_booked',
  'stage_changed',
  'county_selected',
  'product_selected',
  'lead_magnet_download',
  'post_viewed',
  'post_created',
  'post_published',
  'reaction_added',
  'legacy_checkup_started',
  'legacy_checkup_step_completed',
  'legacy_checkup_completed',
  'lead_submitted',
  'book_consultation_clicked',
  'instant_quote_clicked',
  'service_card_clicked',
  'gbp_service_visit',
  'session_exit',
])

export const FilloutSchema = z.object({
  email: z.string().email('Invalid email').optional().nullable(),
  first_name: z.string().max(100).optional().nullable(),
  firstName: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  product_interest: z.string().max(100).optional().nullable(),
  productInterest: z.string().max(100).optional().nullable(),
  interest_type: z.string().max(100).optional().nullable(),
  interestType: z.string().max(100).optional().nullable(),
  lead_session_id: z.string().max(191).optional().nullable(),
  page_url: z.string().max(500).optional().nullable(),
  landing_page: z.string().max(500).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(150).optional().nullable(),
  utm_term: z.string().max(100).optional().nullable(),
  utmTerm: z.string().max(100).optional().nullable(),
  utm_content: z.string().max(100).optional().nullable(),
  utmContent: z.string().max(100).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
}).passthrough()

export const EventIngestSchema = z.object({
  eventType: eventEnum,
  occurredAt: z.string().datetime({ offset: true }).optional().nullable(),
  leadSessionId: z.string().trim().min(1).max(191).optional().nullable(),
  contactId: z.string().trim().min(1).max(191).optional().nullable(),
  inquiryId: z.string().trim().min(1).max(191).optional().nullable(),
  pageUrl: z.string().trim().max(500).optional().nullable(),
  landingPage: z.string().trim().max(500).optional().nullable(),
  referrer: z.string().trim().max(500).optional().nullable(),
  source: z.string().trim().max(100).optional().nullable(),
  medium: z.string().trim().max(100).optional().nullable(),
  campaign: z.string().trim().max(150).optional().nullable(),
  term: z.string().trim().max(100).optional().nullable(),
  content: z.string().trim().max(100).optional().nullable(),
  // Free text from forms — any county is accepted; the route canonicalizes
  // service-area spellings so an unfamiliar value never drops the event.
  county: z.string().trim().max(100).optional().nullable(),
  productInterest: productEnum.optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
}).strict()

export const LeadSchema = z.object({
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  // Mobile autofill often appends a trailing space; trim before validating so
  // a real address isn't rejected, and treat a blank field as absent.
  email: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() || null : value),
    z.string().email().optional().nullable(),
  ),
  phone: z.string().max(40).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  productInterest: z.string().max(100).optional().nullable(),
  leadSessionId: z.string().max(191).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  medium: z.string().max(100).optional().nullable(),
  campaign: z.string().max(150).optional().nullable(),
  term: z.string().max(100).optional().nullable(),
  content: z.string().max(100).optional().nullable(),
  utmTerm: z.string().max(100).optional().nullable(),
  utmContent: z.string().max(100).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  landingPage: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
}).refine((value) => !!(value.email || value.phone), {
  message: 'Lead must include at least an email or phone number',
  path: ['email'],
})

export const LegacyCheckupSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().max(150).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  sourceContent: z.string().max(500).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  medium: z.string().max(100).optional().nullable(),
  campaign: z.string().max(150).optional().nullable(),
  utmTerm: z.string().max(100).optional().nullable(),
  utmContent: z.string().max(100).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  page: z.string().max(500).optional().nullable(),
  hasLifeInsurance: z.boolean().optional().nullable(),
  hasMortgageProtection: z.boolean().optional().nullable(),
  hasFinalExpense: z.boolean().optional().nullable(),
  hasRetirementPlan: z.boolean().optional().nullable(),
  hasLegacyPlan: z.boolean().optional().nullable(),
  interestedIn: z.array(z.string().max(100)).max(20).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
}).refine((value) => !!(value.email || value.phone), {
  message: 'Either email or phone is required',
  path: ['email'],
})

export const ProductFitSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email().max(191).optional().or(z.literal('')),
  phone: z.string().min(7).max(50),
  state: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  lifeStage: z.enum(['young_family', 'pre_retiree', 'retiree', 'business_owner', 'high_income', 'other']).optional().nullable(),
  hasMortgage: z.boolean().optional().nullable(),
  hasDependents: z.boolean().optional().nullable(),
  ownsBusiness: z.boolean().optional().nullable(),
  hasEmployees: z.boolean().optional().nullable(),
  wantsRetirementIncome: z.boolean().optional().nullable(),
  wantsLegacyPlanning: z.boolean().optional().nullable(),
  timeline: z.enum(['now', '30_days', '90_days', 'researching']).optional().nullable(),
  bestContactTime: z.string().max(80).optional().nullable(),
  productInterest: z.string().max(100).optional().nullable(),
  selectedProductSlug: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  leadSessionId: z.string().max(191).optional().nullable(),
  pageUrl: z.string().max(500).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  medium: z.string().max(100).optional().nullable(),
  campaign: z.string().max(150).optional().nullable(),
  term: z.string().max(100).optional().nullable(),
  content: z.string().max(100).optional().nullable(),
  hp_company: z.string().max(200).optional().nullable(),
})

export const LeadIngestSchema = LeadSchema

// `actor` is intentionally not accepted from the client: the route derives it
// from the authenticated session. `force` is honoured only for ADMIN role.
export const InquiryPatchSchema = z.object({
  stage: stageEnum,
  notes: z.string().max(2000).optional().nullable(),
  force: z.boolean().optional(),
})

const isoDateString = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Invalid date' })

const optionalDateString = z.preprocess(
  (value) => (value === '' ? null : value),
  isoDateString.optional().nullable(),
)

const optionalId = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().trim().min(1).max(191).optional().nullable(),
)

export const EmailSendSchema = z
  .object({
    to: z.string().trim().email().max(254),
    subject: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(20000).optional(),
    text: z.string().trim().min(1).max(20000).optional(),
  })
  .refine((value) => !!(value.body || value.text), { message: 'Body is required', path: ['body'] })

export const MessageSendSchema = z.object({
  contactId: z.string().trim().min(1).max(191),
  inquiryId: optionalId,
  channel: z.enum(['email', 'sms']),
  subject: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(1).max(10000),
})

const socialProviderEnum = z.enum(['linkedin', 'facebook', 'instagram', 'twitter'])

export const SocialPublishSchema = z.object({
  providers: z.array(socialProviderEnum).min(1).max(4),
  content: z.string().trim().min(1).max(5000),
  imageUrl: z.string().trim().url().max(2000).optional().nullable(),
  linkUrl: z.string().trim().url().max(2000).optional().nullable(),
})

export const FacebookPublishSchema = z.object({
  content: z.string().trim().min(1).max(5000),
})

export const CalendarBookSchema = z
  .object({
    contactId: z.string().trim().min(1).max(191),
    inquiryId: optionalId,
    title: z.string().trim().min(1).max(250),
    startAt: isoDateString,
    endAt: optionalDateString,
    meetingUrl: z.string().trim().max(500).optional().nullable(),
    timezone: z.string().trim().max(100).optional().nullable(),
    location: z.string().trim().max(250).optional().nullable(),
  })
  .refine((value) => !value.endAt || new Date(value.endAt) >= new Date(value.startAt), {
    message: 'endAt must not be before startAt',
    path: ['endAt'],
  })

const taskStatusInput = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.enum(['open', 'completed']),
)

export const TaskCreateSchema = z.object({
  title: z.string().trim().min(1).max(250),
  description: z.string().trim().max(5000).optional().nullable(),
  dueAt: optionalDateString,
})

export const TaskPatchSchema = z.object({
  id: z.string().trim().min(1).max(191),
  status: taskStatusInput.optional(),
  title: z.string().trim().max(250).optional(),
  description: z.string().max(5000).optional().nullable(),
  dueAt: optionalDateString,
})

const leadStatusEnum = z.enum([
  'NEW',
  'ATTEMPTED_CONTACT',
  'CONTACTED',
  'QUALIFIED',
  'BOOKED',
  'IN_CONSULT',
  'REFERRED_TO_ETHOS',
  'ETHOS_APPLIED',
  'ETHOS_APPROVED',
  'JOIN_EXPLORING',
  'JOIN_ONBOARDING',
  'JOIN_ACTIVE',
  'CLOSED_WON',
  'CLOSED_LOST',
  'NURTURE',
  'ON_HOLD',
  'DORMANT',
])

// Whitelist of fields the contact PATCH endpoint may change.
export const ContactPatchSchema = z
  .object({
    status: leadStatusEnum.optional(),
    notes: z.string().max(5000).optional(),
  })
  .refine((value) => !!(value.status || value.notes), {
    message: 'At least one field (status or notes) must be provided',
  })

export const SocialConnectionUpsertSchema = z.object({
  provider: socialProviderEnum,
  accountName: z.string().max(200).optional().nullable(),
  externalId: z.string().max(200).optional().nullable(),
  accessToken: z.string().max(4000).optional().nullable(),
  refreshToken: z.string().max(4000).optional().nullable(),
  tokenExpiresAt: z.string().max(64).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
})

export const NotionWorkerSchema = z.object({
  action: z.enum(['create_page', 'append_page']).optional(),
  title: z.string().max(300).optional(),
  pageId: z.string().max(100).optional(),
  content: z.string().max(20000).optional(),
  sections: z
    .array(
      z.object({
        heading: z.string().max(300).optional(),
        body: z.string().max(10000).optional(),
        items: z.array(z.string().max(2000)).max(100).optional(),
      }),
    )
    .max(50)
    .optional(),
})

export const BookingNotifySchema = z.object({
  inquiryId: z.string().max(191).optional().nullable(),
  lead_session_id: z.string().min(1).max(191).optional().nullable(),
  gcal_id: z.string().max(200).optional().nullable(),
  scheduled_for: z.string().optional().nullable(),
  start_at: z.string().optional().nullable(),
  end_at: z.string().optional().nullable(),
  booking_source: z.string().max(100).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  medium: z.string().max(100).optional().nullable(),
  campaign: z.string().max(150).optional().nullable(),
  location: z.string().max(250).optional().nullable(),
  meeting_url: z.string().max(500).optional().nullable(),
  timezone: z.string().max(100).optional().nullable(),
  title: z.string().max(250).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  first_name: z.string().max(100).optional().nullable(),
  firstName: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  full_name: z.string().max(150).optional().nullable(),
  fullName: z.string().max(150).optional().nullable(),
  name: z.string().max(150).optional().nullable(),
  email: z.string().email().optional().nullable(),
  attendee_email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  product_interest: z.string().max(100).optional().nullable(),
  productInterest: z.string().max(100).optional().nullable(),
  page_url: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
}).refine((value) => !!(value.inquiryId || value.lead_session_id || value.email || value.attendee_email || value.phone), {
  message: 'Booking webhook must include an inquiry/session id or contact email/phone',
  path: ['email'],
})

export const CardEventSchema = z.object({
  event: z.string().min(1).max(100),
  label: z.string().max(200).optional().nullable(),
  pageUrl: z.string().max(500).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  userAgent: z.string().max(300).optional().nullable(),
  timestamp: z.string().optional().nullable(),
  leadSessionId: z.string().max(191).optional().nullable(),
  productInterest: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
})

const optionalIntakeNumber = z.preprocess(
  value => value === '' || value === undefined ? null : typeof value === 'string' ? Number(value) : value,
  z.number().finite().optional().nullable(),
)

export const VirtualIntakeSchema = z.object({
  journey: z.enum(['client', 'business_partner', 'both']),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  selectedPriorities: z.array(z.string().max(100)).max(10).optional(),
  topPriorityWhy: z.string().max(1000).optional().nullable(),

  maritalStatus: z.string().max(50).optional().nullable(),
  spouseName: z.string().max(150).optional().nullable(),
  ageRange: z.string().max(50).optional().nullable(),
  smoker: z.boolean().optional().nullable(),
  hasChildren: z.boolean().optional().nullable(),
  childrenAges: z.string().max(200).optional().nullable(),
  occupation: z.string().max(150).optional().nullable(),
  familyNotes: z.string().max(2000).optional().nullable(),
  recreationNotes: z.string().max(2000).optional().nullable(),
  motivationNotes: z.string().max(2000).optional().nullable(),

  monthlyIncome: optionalIntakeNumber,
  monthlyExpenses: optionalIntakeNumber,
  emergencyFund: optionalIntakeNumber,
  marketAssets: optionalIntakeNumber,
  hasEmergencyFund: z.boolean().optional().nullable(),
  emergencyFundMonths: optionalIntakeNumber,

  hasEmployerRetirement: z.boolean().optional().nullable(),
  retirementPlanTypes: z.array(z.string().max(100)).max(10).optional(),
  retirementBalance: optionalIntakeNumber,
  retirementContribution: optionalIntakeNumber,
  contributionFrequency: z.string().max(50).optional().nullable(),
  hasCompanyMatch: z.boolean().optional().nullable(),
  companyMatchDetails: z.string().max(500).optional().nullable(),
  hasOutsideRetirement: z.boolean().optional().nullable(),

  hasLifeInsurance: z.boolean().optional().nullable(),
  lifeInsuranceSource: z.string().max(150).optional().nullable(),
  coverageAmount: optionalIntakeNumber,
  premiumAmount: optionalIntakeNumber,
  premiumFrequency: z.string().max(50).optional().nullable(),
  policyType: z.string().max(100).optional().nullable(),
  hasLivingBenefits: z.boolean().optional().nullable(),
  hasLtc: z.boolean().optional().nullable(),

  taxStatus: z.string().max(100).optional().nullable(),
  taxAmount: optionalIntakeNumber,
  minMonthlySavings: optionalIntakeNumber,
  maxMonthlySavings: optionalIntakeNumber,
  savingForChildren: z.boolean().optional().nullable(),
  additionalIncomeInterest: z.boolean().optional().nullable(),

  debt: optionalIntakeNumber,
  mortgageBalance: optionalIntakeNumber,
  educationGoal: optionalIntakeNumber,
})

export { stageEnum as PipelineStageSchema, productEnum as ProductInterestSchema, eventEnum as EventTypeSchema }
