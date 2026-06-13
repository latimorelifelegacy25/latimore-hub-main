import { createClient } from '@supabase/supabase-js'

export type Journey = 'client' | 'business_partner' | 'both'
export type VirtualIntakeInput = Record<string, any> & { journey?: Journey }

const PRIORITY_LABELS: Record<string, string> = {
  tax_advantage: 'Tax Advantage Strategies',
  asset_protection: 'Asset Protection',
  college_funding: 'College Funding',
  debt_management: 'Debt Management',
  infinite_banking: 'Infinite Banking',
  life_insurance: 'Life Insurance',
  estate_planning: 'Estate Planning',
  indexed_growth: 'Indexed Growth Strategies',
  mortgage_protection: 'Mortgage Protection',
  business_owner_strategies: 'Business Owner Strategies',
}

const TRACK_LABELS: Record<string, string> = {
  life_insurance: 'Life Insurance Review',
  living_benefits_ltc: 'Living Benefits & Long-Term Care Review',
  dime_gap_review: 'Protection Gap (DIME) Review',
  college_legacy_planning: 'College & Legacy Planning',
  savings_strategy: 'Savings Strategy Review',
  tax_advantage_education: 'Tax-Advantaged Strategy Education',
  business_owner_strategy: 'Business Owner Strategy Review',
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase server configuration')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function n(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function journeyLabel(value?: Journey) {
  if (value === 'business_partner') return 'Business Partner'
  if (value === 'both') return 'Client + Business Partner'
  return 'Client'
}

function tier(urgency: 'low' | 'medium' | 'high') {
  return urgency === 'high' ? 'hot' : urgency === 'medium' ? 'warm' : 'cold'
}

function splitName(fullName?: string | null) {
  const clean = (fullName || '').trim()
  if (!clean) return { firstName: 'Client', lastName: '' }
  const [firstName, ...rest] = clean.split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

function dimeGap(input: { debt: number; annualIncome: number; mortgageBalance: number; educationGoal: number; currentCoverage: number }) {
  const incomeMultiplier = 10
  const calculatedNeed = input.debt + input.annualIncome * incomeMultiplier + input.mortgageBalance + input.educationGoal
  return { incomeMultiplier, calculatedNeed, coverageGap: Math.max(calculatedNeed - input.currentCoverage, 0) }
}

function score(input: any) {
  let clientScore = 0
  let advisorScore = 0
  const tracks: string[] = []
  const priorities = input.selectedPriorities || []

  if (input.hasLifeInsurance) clientScore += 12
  else { advisorScore += 20; tracks.push('life_insurance') }

  if (input.hasLivingBenefits) clientScore += 8
  if (input.hasLtc) clientScore += 5
  if (!input.hasLivingBenefits && !input.hasLtc) { advisorScore += 15; tracks.push('living_benefits_ltc') }

  if (input.coverageGap <= 0) clientScore += 5
  if (input.coverageGap > 0) { advisorScore += 20; tracks.push('dime_gap_review') }

  if (input.hasEmergencyFund) clientScore += 7
  if (input.emergencyFundMonths >= 3) clientScore += 8
  if (input.hasRetirementPlan) clientScore += 8
  if (input.hasOutsideRetirement) clientScore += 6
  if (input.monthlySavingsCapacity >= 250) { clientScore += 6; advisorScore += 15; tracks.push('savings_strategy') }
  if (input.hasChildren && input.savingForChildren) clientScore += 8
  if (input.hasChildren && !input.savingForChildren) { advisorScore += 10; tracks.push('college_legacy_planning') }
  if (priorities.includes('estate_planning')) clientScore += 6
  if (priorities.includes('college_funding')) clientScore += 6
  if (priorities.length >= 2) clientScore += 8
  if (priorities.includes('life_insurance')) clientScore += 4
  if (priorities.includes('tax_advantage')) { clientScore += 3; advisorScore += 10; tracks.push('tax_advantage_education') }
  if (priorities.includes('business_owner_strategies')) { advisorScore += 10; tracks.push('business_owner_strategy') }

  advisorScore = Math.min(advisorScore, 100)
  return {
    clientScore: Math.min(clientScore, 100),
    advisorScore,
    urgency: advisorScore >= 70 ? 'high' : advisorScore >= 40 ? 'medium' : 'low',
    tracks: [...new Set(tracks)],
  }
}

async function insert(table: string, payload: any) {
  const { error } = await supabaseAdmin().from(table).insert(payload)
  if (error) throw new Error(`${table}: ${error.message}`)
}

export async function submitVirtualIntake(input: VirtualIntakeInput) {
  if (!input.journey) throw new Error('Please choose a journey.')
  if (!input.firstName || !input.lastName || !input.email) throw new Error('First name, last name, and email are required.')

  const supabase = supabaseAdmin()
  const priorities = (input.selectedPriorities || []).filter((p: string) => PRIORITY_LABELS[p]).slice(0, 3)
  const fullName = `${input.firstName} ${input.lastName}`.trim()
  const topPriority = priorities[0]
  const productInterest = topPriority ? PRIORITY_LABELS[topPriority] : journeyLabel(input.journey)
  const notes = ['Latimore virtual interactive intake', `Journey: ${journeyLabel(input.journey)}`, input.state ? `State: ${input.state}` : null, input.topPriorityWhy ? `Top priority why: ${input.topPriorityWhy}` : null].filter(Boolean).join('\n')

  const { data: lead, error } = await supabase.from('leads').insert({
    full_name: fullName,
    email: input.email,
    phone: input.phone || null,
    state: input.state || null,
    journey: input.journey,
    product_interest: productInterest,
    lead_source: 'latimore_virtual_intake',
    page_source: '/intake',
    status: 'New',
    utm_source: 'latimore_os',
    utm_medium: 'intake',
    utm_campaign: 'virtual_interactive_intake',
    notes,
  }).select('id').single()

  if (error || !lead) throw new Error(error?.message || 'Could not create lead.')
  const leadId = String(lead.id)

  await insert('intake_profiles', {
    lead_id: leadId,
    marital_status: input.maritalStatus || null,
    spouse_name: input.spouseName || null,
    age_range: input.ageRange || null,
    smoker: input.smoker ?? null,
    has_children: input.hasChildren ?? null,
    children_ages: input.childrenAges || null,
    occupation: input.occupation || null,
    family_notes: input.familyNotes || null,
    recreation_notes: input.recreationNotes || null,
    motivation_notes: input.motivationNotes || null,
  })

  const monthlyIncome = n(input.monthlyIncome)
  const coverageAmount = n(input.coverageAmount)
  const minMonthlySavings = n(input.minMonthlySavings)
  const maxMonthlySavings = n(input.maxMonthlySavings)
  const emergencyFundMonths = n(input.emergencyFundMonths)

  await insert('financial_intake', {
    lead_id: leadId,
    monthly_income: monthlyIncome || null,
    monthly_expenses: n(input.monthlyExpenses) || null,
    emergency_fund: n(input.emergencyFund) || null,
    market_assets: n(input.marketAssets) || null,
    has_employer_retirement: input.hasEmployerRetirement ?? null,
    retirement_plan_types: input.retirementPlanTypes || [],
    retirement_balance: n(input.retirementBalance) || null,
    retirement_contribution: n(input.retirementContribution) || null,
    contribution_frequency: input.contributionFrequency || null,
    has_company_match: input.hasCompanyMatch ?? null,
    company_match_details: input.companyMatchDetails || null,
    has_outside_retirement: input.hasOutsideRetirement ?? null,
    has_life_insurance: input.hasLifeInsurance ?? null,
    life_insurance_source: input.lifeInsuranceSource || null,
    coverage_amount: coverageAmount || null,
    premium_amount: n(input.premiumAmount) || null,
    premium_frequency: input.premiumFrequency || null,
    policy_type: input.policyType || null,
    has_living_benefits: input.hasLivingBenefits ?? null,
    has_ltc: input.hasLtc ?? null,
    tax_status: input.taxStatus || null,
    tax_amount: n(input.taxAmount) || null,
    min_monthly_savings: minMonthlySavings || null,
    max_monthly_savings: maxMonthlySavings || null,
    has_children: input.hasChildren ?? null,
    children_ages: input.childrenAges || null,
    saving_for_children: input.savingForChildren ?? null,
    additional_income_interest: input.additionalIncomeInterest ?? null,
  })

  if (priorities.length) await insert('client_priorities', priorities.map((priority: string, index: number) => ({ lead_id: leadId, priority, importance_rank: index + 1, why_important: index === 0 ? input.topPriorityWhy || null : null })))

  const dime = dimeGap({ debt: n(input.debt), annualIncome: monthlyIncome * 12, mortgageBalance: n(input.mortgageBalance), educationGoal: n(input.educationGoal), currentCoverage: coverageAmount })
  await insert('dime_calculations', { lead_id: leadId, debt: n(input.debt), annual_income: monthlyIncome * 12, income_multiplier: dime.incomeMultiplier, mortgage_balance: n(input.mortgageBalance), education_goal: n(input.educationGoal), current_coverage: coverageAmount })

  const scored = score({
    hasLifeInsurance: !!input.hasLifeInsurance,
    hasLivingBenefits: !!input.hasLivingBenefits,
    hasLtc: !!input.hasLtc,
    hasChildren: !!input.hasChildren,
    savingForChildren: !!input.savingForChildren,
    hasEmergencyFund: !!input.hasEmergencyFund,
    emergencyFundMonths,
    hasRetirementPlan: !!input.hasEmployerRetirement,
    hasOutsideRetirement: !!input.hasOutsideRetirement,
    monthlySavingsCapacity: maxMonthlySavings || minMonthlySavings,
    coverageGap: dime.coverageGap,
    selectedPriorities: priorities,
  })

  await insert('intake_scores', { lead_id: leadId, client_score: scored.clientScore, advisor_score: scored.advisorScore, urgency: scored.urgency, recommended_tracks: scored.tracks })
  await supabase.from('leads').update({ score_tier: tier(scored.urgency as any) }).eq('id', leadId)
  await insert('booking_events', { lead_id: leadId, booking_url: process.env.BOOK_WITH_JACKSON_URL || 'https://latimorelifelegacy.fillout.com/latimorelifelegacy' })

  return { leadId }
}

export async function getVirtualIntakeResult(leadId: string) {
  const supabase = supabaseAdmin()
  const [{ data: lead }, { data: result }, { data: priorities }, { data: dime }] = await Promise.all([
    supabase.from('leads').select('id, full_name, journey').eq('id', leadId).single(),
    supabase.from('intake_scores').select('client_score, advisor_score, urgency, recommended_tracks').eq('lead_id', leadId).single(),
    supabase.from('client_priorities').select('priority, importance_rank').eq('lead_id', leadId).order('importance_rank', { ascending: true }),
    supabase.from('dime_calculations').select('calculated_need, coverage_gap').eq('lead_id', leadId).maybeSingle(),
  ])
  if (!lead || !result) return null
  const name = splitName(lead.full_name)
  return {
    ...name,
    journey: lead.journey || 'client',
    clientScore: Number(result.client_score),
    advisorScore: Number(result.advisor_score),
    urgency: result.urgency as string,
    recommendedTracks: ((result.recommended_tracks || []) as string[]).map(id => ({ id, label: TRACK_LABELS[id] || id })),
    priorities: ((priorities || []) as any[]).map(p => ({ id: p.priority, label: PRIORITY_LABELS[p.priority] || p.priority })),
    calculatedNeed: dime?.calculated_need ? Number(dime.calculated_need) : 0,
    coverageGap: dime?.coverage_gap ? Number(dime.coverage_gap) : 0,
  }
}

export async function trackVirtualBookingClick(leadId: string) {
  await supabaseAdmin().from('booking_events').update({ clicked_at: new Date().toISOString() }).eq('lead_id', leadId).is('clicked_at', null)
}

export const VIRTUAL_INTAKE_PRIORITIES = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))
