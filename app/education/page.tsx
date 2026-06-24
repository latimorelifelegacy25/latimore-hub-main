'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { COLORS, BRAND } from '@/lib/brand'
import { SiteHeader, SiteFooter, DEFAULT_NAV_LINKS } from '@/app/_components/site-shell'

const navy = COLORS.navy
const gold = COLORS.gold

type Contact = {
  firstName: string
  lastName: string
  email: string
  phone: string
  county: string
}

type Rule72State = {
  startingAmount: string
  estimatedRate: string
  currentAge: string
}

type FunnelData = {
  contact: Contact
  priorityPath: string
  familyDependents: string[]
  incomeStability: string
  mortgageOrDebt: string[]
  retirementStatus: string
  lifeInsuranceStatus: string
  dimeCoverage: string
  livingBenefitsInterest: string
  estatePlanningInterest: string
  rule72: Rule72State
}

type Step =
  | 'welcome'
  | 'contact'
  | 'priority'
  | 'family'
  | 'income'
  | 'debt'
  | 'retirement'
  | 'lifeInsurance'
  | 'problem'
  | 'rule72'
  | 'xcurve'
  | 'dime'
  | 'livingBenefits'
  | 'retirementIncome'
  | 'taxBuckets'
  | 'retirementTools'
  | 'estatePlanning'
  | 'results'

const steps: Step[] = [
  'welcome',
  'contact',
  'priority',
  'family',
  'income',
  'debt',
  'retirement',
  'lifeInsurance',
  'problem',
  'rule72',
  'xcurve',
  'dime',
  'livingBenefits',
  'retirementIncome',
  'taxBuckets',
  'retirementTools',
  'estatePlanning',
  'results',
]

const priorities = [
  'Protect My Family',
  'Cover My Mortgage',
  'Plan Final Expenses',
  'Build Retirement Income',
  'Protect My Business',
  'Plan for My Children',
  'Add Estate Planning',
]

// Maps the funnel's priority selection to the CRM's ProductInterest enum values.
const PRIORITY_PRODUCT_MAP: Record<string, string> = {
  'Protect My Family': 'Term_Life',
  'Cover My Mortgage': 'Mortgage_Protection',
  'Plan Final Expenses': 'Final_Expense',
  'Build Retirement Income': 'Retirement',
  'Protect My Business': 'Business',
  'Plan for My Children': 'Child_Whole_Life',
  'Add Estate Planning': 'Whole_Life',
}

const guideTitles: Record<string, string> = {
  'Protect My Family': 'Family Protection Starter Guide',
  'Cover My Mortgage': 'Mortgage Protection Guide',
  'Plan Final Expenses': 'Final Expense Planning Guide',
  'Build Retirement Income': 'Retirement Income Guide',
  'Protect My Business': 'Business Owner Protection Guide',
  'Plan for My Children': "Children's Future Planning Guide",
  'Add Estate Planning': 'Estate Planning Checklist',
}

const dependentOptions = [
  'Spouse',
  'Children',
  'Parent or relative',
  'Business partner',
  'No one currently',
  'Other',
]

const incomeOptions = [
  'Less than 1 month',
  '1–3 months',
  '3–6 months',
  '6–12 months',
  'More than 12 months',
]

const debtOptions = ['Mortgage', 'Rent', 'Auto loan', 'Credit cards', 'Business debt', 'None']

const retirementOptions = [
  '401(k), 403(b), or pension',
  'IRA or Roth IRA',
  'Annuity',
  'Personal savings only',
  'Not currently saving',
  'Not sure',
]

const lifeInsuranceOptions = ['Yes', 'No', 'Through work only', 'Not sure']

const yesNoOptions = ['Yes', 'No', 'Somewhat', 'Not sure']

const initialData: FunnelData = {
  contact: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    county: '',
  },
  priorityPath: '',
  familyDependents: [],
  incomeStability: '',
  mortgageOrDebt: [],
  retirementStatus: '',
  lifeInsuranceStatus: '',
  dimeCoverage: '',
  livingBenefitsInterest: '',
  estatePlanningInterest: '',
  rule72: {
    startingAmount: '10000',
    estimatedRate: '6',
    currentAge: '35',
  },
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function calculateScore(data: FunnelData) {
  let score = 0

  if (data.priorityPath) score += 10
  if (data.familyDependents.length > 0) score += 10

  const incomePoints: Record<string, number> = {
    'Less than 1 month': 5,
    '1–3 months': 8,
    '3–6 months': 11,
    '6–12 months': 14,
    'More than 12 months': 18,
  }

  const retirementPoints: Record<string, number> = {
    '401(k), 403(b), or pension': 12,
    'IRA or Roth IRA': 12,
    Annuity: 12,
    'Personal savings only': 8,
    'Not currently saving': 4,
    'Not sure': 5,
  }

  score += incomePoints[data.incomeStability] ?? 0
  score += data.mortgageOrDebt.includes('None') ? 12 : 8
  score += retirementPoints[data.retirementStatus] ?? 0

  if (data.lifeInsuranceStatus === 'Yes') score += 15
  if (data.lifeInsuranceStatus === 'Through work only') score += 8
  if (data.lifeInsuranceStatus === 'No' || data.lifeInsuranceStatus === 'Not sure') score += 4

  if (data.dimeCoverage === 'Yes') score += 12
  if (data.dimeCoverage === 'Somewhat') score += 8
  if (data.dimeCoverage === 'No' || data.dimeCoverage === 'Not sure') score += 4

  if (data.livingBenefitsInterest === 'Yes') score += 7
  if (data.livingBenefitsInterest === 'Somewhat' || data.livingBenefitsInterest === 'Not sure') score += 4

  if (data.estatePlanningInterest === 'Yes') score += 10
  if (data.estatePlanningInterest === 'Somewhat' || data.estatePlanningInterest === 'Not sure') score += 5

  return Math.min(100, score)
}

function getStatus(score: number, type: 'family' | 'income' | 'retirement' | 'estate') {
  if (type === 'family') {
    if (score >= 80) return 'Prepared'
    if (score >= 60) return 'Moderate Gap'
    return 'Needs Review'
  }

  if (type === 'income') {
    if (score >= 80) return 'Stable'
    if (score >= 60) return 'Moderate Gap'
    return 'Needs Review'
  }

  if (type === 'retirement') {
    if (score >= 80) return 'On Track'
    if (score >= 60) return 'Needs Strategy'
    return 'Needs Review'
  }

  if (score >= 80) return 'Included'
  if (score >= 60) return 'Missing or Unknown'
  return 'Needs Review'
}

function toggleValue(values: string[], value: string) {
  if (value === 'None' || value === 'No one currently') {
    return values.includes(value) ? [] : [value]
  }

  const cleaned = values.filter((item) => item !== 'None' && item !== 'No one currently')

  return cleaned.includes(value) ? cleaned.filter((item) => item !== value) : [...cleaned, value]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function getRule72Result(rule72: Rule72State) {
  const amount = Number(rule72.startingAmount)
  const rate = Number(rule72.estimatedRate)
  const age = Number(rule72.currentAge)

  if (!Number.isFinite(amount) || !Number.isFinite(rate) || !Number.isFinite(age) || amount <= 0 || rate <= 0) {
    return null
  }

  const yearsToDouble = 72 / rate
  const doubledAmount = amount * 2
  const estimatedAge = age + yearsToDouble

  return { yearsToDouble, doubledAmount, estimatedAge }
}

function buildGuideContent(priorityPath: string, score: number) {
  const title = guideTitles[priorityPath] || 'Family Protection Starter Guide'

  return `
${title}
${BRAND.fullName}
${BRAND.tagline}
${BRAND.hashtag}

Educational Use Only
This guide is for educational purposes only. It is not tax, legal, investment, or insurance advice. Products and strategies vary by state, carrier, underwriting, policy design, and client eligibility.

Your selected priority:
${priorityPath || 'Protect My Family'}

Legacy Readiness Score: ${score} / 100

Recommended review checklist:
1. Identify who depends on your income or support.
2. Review whether your current plan addresses Debt, Income, Mortgage, and Education needs.
3. Confirm whether coverage is personal, employer-based, temporary, permanent, or unknown.
4. Ask whether living benefits may be appropriate for your situation.
5. Review retirement savings separately from retirement income planning.
6. Consider whether estate planning documents should support the financial plan.
7. Schedule a free consultation with ${BRAND.advisor}.

Booking link:
${BRAND.bookingUrl}

Call us:
${BRAND.phone}
`.trim()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function EducationPage() {
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [data, setData] = useState<FunnelData>(initialData)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const viewedEventsRef = useRef<Set<string>>(new Set())
  const completedRef = useRef(false)
  const leadSessionIdRef = useRef<string>('')

  if (!leadSessionIdRef.current && typeof crypto !== 'undefined' && crypto.randomUUID) {
    leadSessionIdRef.current = crypto.randomUUID()
  }

  const stepIndex = steps.indexOf(currentStep)
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100)
  const score = useMemo(() => calculateScore(data), [data])
  const rule72Result = useMemo(() => getRule72Result(data.rule72), [data.rule72])

  async function logEvent(eventType: string, metadata?: Record<string, unknown>, productInterest?: string) {
    await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventType,
        leadSessionId: leadSessionIdRef.current || undefined,
        landingPage: '/education',
        county: data.contact.county || undefined,
        productInterest,
        metadata: { funnelStep: currentStep, ...metadata },
      }),
    }).catch(() => null)
  }

  async function logOnce(eventType: string, metadata?: Record<string, unknown>) {
    if (viewedEventsRef.current.has(eventType)) return
    viewedEventsRef.current.add(eventType)
    await logEvent(eventType, metadata)
  }

  async function submitLead() {
    const productInterest = PRIORITY_PRODUCT_MAP[data.priorityPath]

    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: data.contact.firstName.trim(),
        lastName: data.contact.lastName.trim(),
        email: data.contact.email.trim().toLowerCase(),
        phone: data.contact.phone.trim(),
        county: data.contact.county.trim() || undefined,
        productInterest,
        leadSessionId: leadSessionIdRef.current || undefined,
        landingPage: '/education',
        source: 'Education Funnel',
        medium: 'organic',
        notes: 'Submitted via Latimore Legacy Checkup education funnel.',
        metadata: {
          form: 'education-funnel',
          priorityPath: data.priorityPath,
          familyDependents: data.familyDependents,
          incomeStability: data.incomeStability,
          mortgageOrDebt: data.mortgageOrDebt,
          retirementStatus: data.retirementStatus,
          lifeInsuranceStatus: data.lifeInsuranceStatus,
          dimeCoverage: data.dimeCoverage,
          livingBenefitsInterest: data.livingBenefitsInterest,
          estatePlanningInterest: data.estatePlanningInterest,
          legacyScore: score,
        },
      }),
    })

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      throw new Error(result?.error ? JSON.stringify(result.error) : 'Unable to save your information.')
    }
  }

  function validateStep(step: Step) {
    if (step === 'contact') {
      const contact = data.contact

      if (!contact.firstName.trim() || !contact.lastName.trim() || !contact.email.trim() || !contact.phone.trim() || !contact.county.trim()) {
        return 'Please complete all contact fields.'
      }

      if (!isValidEmail(contact.email)) {
        return 'Please enter a valid email address.'
      }
    }

    if (step === 'priority' && !data.priorityPath) return 'Please choose your main priority.'
    if (step === 'family' && data.familyDependents.length === 0) return 'Please choose at least one option.'
    if (step === 'income' && !data.incomeStability) return 'Please choose one option.'
    if (step === 'debt' && data.mortgageOrDebt.length === 0) return 'Please choose at least one option.'
    if (step === 'retirement' && !data.retirementStatus) return 'Please choose one option.'
    if (step === 'lifeInsurance' && !data.lifeInsuranceStatus) return 'Please choose one option.'
    if (step === 'dime' && !data.dimeCoverage) return 'Please choose one option.'
    if (step === 'livingBenefits' && !data.livingBenefitsInterest) return 'Please choose one option.'
    if (step === 'estatePlanning' && !data.estatePlanningInterest) return 'Please choose one option.'

    return ''
  }

  async function next() {
    setError('')

    const validationError = validateStep(currentStep)

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      if (currentStep === 'welcome') {
        await logOnce('legacy_checkup_started', { activity: 'Started Education Funnel' })
      }

      if (currentStep === 'contact') {
        setIsSubmitting(true)
        await submitLead()
        await logEvent('lead_submitted', { activity: 'Completed Contact Capture' })
      }

      if (currentStep === 'priority') {
        await logEvent('product_selected', { activity: 'Selected Service Priority', detail: data.priorityPath }, PRIORITY_PRODUCT_MAP[data.priorityPath])
      }

      if (currentStep === 'retirement') {
        await logEvent('cta_click', { activity: 'Answered Retirement Question', detail: data.retirementStatus })
      }

      if (currentStep === 'lifeInsurance') {
        await logEvent('cta_click', { activity: 'Answered Life Insurance Question', detail: data.lifeInsuranceStatus })
      }

      if (currentStep === 'dime') {
        await logEvent('cta_click', { activity: 'Answered DIME Question', detail: data.dimeCoverage })
      }

      const nextStep = steps[stepIndex + 1]

      if (nextStep) {
        setCurrentStep(nextStep)
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function back() {
    setError('')
    const previousStep = steps[stepIndex - 1]

    if (previousStep) {
      setCurrentStep(previousStep)
    }
  }

  async function downloadGuide() {
    await logEvent('lead_magnet_download', { activity: 'Downloaded Education Guide', detail: data.priorityPath })

    const title = guideTitles[data.priorityPath] || 'Family Protection Starter Guide'
    const content = buildGuideContent(data.priorityPath, score)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `${slugify(title)}.txt`
    anchor.click()

    URL.revokeObjectURL(url)
  }

  async function bookCall() {
    await logEvent('book_consultation_clicked', { activity: 'Clicked Book With Jackson' })
    window.location.href = BRAND.bookingUrl
  }

  useEffect(() => {
    const stepLabels: Partial<Record<Step, string>> = {
      rule72: 'Rule of 72 — compound interest education',
      taxBuckets: 'Tax Buckets — tax now, tax later, tax advantage',
      retirementTools: '401k vs IUL — different tools, different rules',
      retirementIncome: 'GRIPP Module — retirement income and market volatility',
    }

    const stepLabel = stepLabels[currentStep]

    if (stepLabel) {
      logOnce('legacy_checkup_step_completed', { step: currentStep, detail: stepLabel }).catch(() => null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  useEffect(() => {
    if (currentStep !== 'results' || completedRef.current) return

    completedRef.current = true

    logEvent('legacy_checkup_completed', { activity: 'Completed Legacy Checkup', legacyScore: score }).catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, score])

  return (
    <>
      <SiteHeader currentPath="/education" navLinks={DEFAULT_NAV_LINKS} />

      <main className="min-h-screen px-4 py-10" style={{ background: navy }}>
        <section className="mx-auto flex w-full max-w-4xl flex-col">
          <header className="mb-5 text-center text-white">
            <div className="mx-auto mb-4 flex justify-center">
              <div className="rounded-3xl bg-white p-3 shadow-xl">
                <Image
                  src="/logo.jpg"
                  alt={`${BRAND.fullName} logo`}
                  width={280}
                  height={280}
                  priority
                  className="h-auto w-48 rounded-2xl md:w-64"
                />
              </div>
            </div>

            <p className="text-sm font-semibold tracking-[0.25em]" style={{ color: gold }}>
              {BRAND.fullName.toUpperCase()}
            </p>

            <h1 className="mt-2 text-2xl font-bold md:text-4xl">Free Legacy Protection Checkup</h1>

            <p className="mt-2 text-sm text-white/80">
              {BRAND.tagline} <span style={{ color: gold }}>{BRAND.hashtag}</span>
            </p>
          </header>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              <span>Latimore Legacy Checkup</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: gold }} />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full rounded-3xl bg-white p-6 shadow-2xl transition-all duration-300 md:p-10" style={{ color: navy }}>
              {currentStep === 'welcome' && (
                <div className="grid items-center gap-6 md:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl">
                    <Image
                      src="/jackson-outdoor.jpg"
                      alt="Jackson M. Latimore Sr. — Independent Insurance Consultant"
                      width={800}
                      height={800}
                      priority
                      className="h-64 w-full object-cover md:h-full"
                    />
                  </div>
                  <Screen
                    eyebrow="Welcome"
                    title="Protect Your Family. Build Your Legacy."
                    body="Most people know they need a plan. The problem is knowing where to start. This quick education experience will help you see where you stand, what matters most, and what next step fits your family, business, or retirement goals."
                  />
                </div>
              )}

              {currentStep === 'contact' && (
                <div>
                  <Screen
                    eyebrow="Contact Capture"
                    title="Tell us where to send your checkup details."
                    body="Your information helps us personalize your education path and follow-up."
                  />
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Input label="First name" value={data.contact.firstName} onChange={(value) => setData({ ...data, contact: { ...data.contact, firstName: value } })} />
                    <Input label="Last name" value={data.contact.lastName} onChange={(value) => setData({ ...data, contact: { ...data.contact, lastName: value } })} />
                    <Input label="Email" type="email" value={data.contact.email} onChange={(value) => setData({ ...data, contact: { ...data.contact, email: value } })} />
                    <Input label="Phone" type="tel" value={data.contact.phone} onChange={(value) => setData({ ...data, contact: { ...data.contact, phone: value } })} />
                    <Input label="County" value={data.contact.county} onChange={(value) => setData({ ...data, contact: { ...data.contact, county: value } })} />
                  </div>
                </div>
              )}

              {currentStep === 'priority' && (
                <ChoiceScreen
                  eyebrow="Main Priority"
                  title="What matters most right now?"
                  body="Choose the path that best matches why you started this checkup."
                  options={priorities}
                  selected={data.priorityPath}
                  onSelect={(value) => setData({ ...data, priorityPath: value })}
                />
              )}

              {currentStep === 'family' && (
                <MultiChoiceScreen
                  eyebrow="Family"
                  title="Who depends on your income or support?"
                  body="Select all that apply."
                  options={dependentOptions}
                  selected={data.familyDependents}
                  onToggle={(value) => setData({ ...data, familyDependents: toggleValue(data.familyDependents, value) })}
                />
              )}

              {currentStep === 'income' && (
                <ChoiceScreen
                  eyebrow="Income"
                  title="If your income stopped tomorrow, how long could your household stay financially stable?"
                  options={incomeOptions}
                  selected={data.incomeStability}
                  onSelect={(value) => setData({ ...data, incomeStability: value })}
                />
              )}

              {currentStep === 'debt' && (
                <MultiChoiceScreen
                  eyebrow="Debt / Mortgage"
                  title="Do you currently have a mortgage, rent obligation, or major debt?"
                  body="Select all that apply."
                  options={debtOptions}
                  selected={data.mortgageOrDebt}
                  onToggle={(value) => setData({ ...data, mortgageOrDebt: toggleValue(data.mortgageOrDebt, value) })}
                />
              )}

              {currentStep === 'retirement' && (
                <ChoiceScreen
                  eyebrow="Retirement"
                  title="Are you currently saving for retirement?"
                  options={retirementOptions}
                  selected={data.retirementStatus}
                  onSelect={(value) => setData({ ...data, retirementStatus: value })}
                />
              )}

              {currentStep === 'lifeInsurance' && (
                <ChoiceScreen
                  eyebrow="Protection"
                  title="Do you currently have life insurance?"
                  options={lifeInsuranceOptions}
                  selected={data.lifeInsuranceStatus}
                  onSelect={(value) => setData({ ...data, lifeInsuranceStatus: value })}
                />
              )}

              {currentStep === 'problem' && (
                <Screen
                  eyebrow="The Problem"
                  title="Most families are one unexpected event away from financial pressure."
                  body="Life insurance is not just about death. It is about protecting income, choices, dignity, and the people who depend on you."
                />
              )}

              {currentStep === 'rule72' && (
                <div>
                  <Screen
                    eyebrow="The Rule of 72"
                    title="Money needs time. Protection needs planning."
                    body="The Rule of 72 helps show how long money may take to double based on a rate of return. The earlier you start, the more time can work in your favor."
                  />

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <Input
                      label="Starting amount"
                      type="number"
                      value={data.rule72.startingAmount}
                      onChange={(value) => setData({ ...data, rule72: { ...data.rule72, startingAmount: value } })}
                    />
                    <Input
                      label="Estimated rate %"
                      type="number"
                      value={data.rule72.estimatedRate}
                      onChange={(value) => setData({ ...data, rule72: { ...data.rule72, estimatedRate: value } })}
                    />
                    <Input
                      label="Current age"
                      type="number"
                      value={data.rule72.currentAge}
                      onChange={(value) => setData({ ...data, rule72: { ...data.rule72, currentAge: value } })}
                    />
                  </div>

                  <div className="mt-6 rounded-2xl p-5 text-white" style={{ background: navy }}>
                    {rule72Result ? (
                      <p className="text-lg font-bold">
                        At this rate, your money may double approximately every{' '}
                        <span style={{ color: gold }}>{rule72Result.yearsToDouble.toFixed(1)} years</span>, from{' '}
                        {formatCurrency(Number(data.rule72.startingAmount))} to {formatCurrency(rule72Result.doubledAmount)} around age{' '}
                        {rule72Result.estimatedAge.toFixed(1)}.
                      </p>
                    ) : (
                      <p className="text-lg font-bold">Enter a positive amount, rate, and age to see the estimate.</p>
                    )}
                    <p className="mt-3 text-sm text-white/70">Educational estimate only. Actual results are not guaranteed.</p>
                  </div>
                </div>
              )}

              {currentStep === 'xcurve' && (
                <Screen
                  eyebrow="The X-Curve"
                  title="Protection first. Wealth building second."
                  body="Early in life, people often have high responsibility and low assets. Over time, the goal is to grow assets while reducing the need for protection. A proper plan balances both."
                />
              )}

              {currentStep === 'dime' && (
                <ChoiceScreen
                  eyebrow="DIME Method"
                  title="Would your current plan cover Debt, Income, Mortgage, and Education?"
                  body="DIME helps estimate how much protection your family may need."
                  options={yesNoOptions}
                  selected={data.dimeCoverage}
                  onSelect={(value) => setData({ ...data, dimeCoverage: value })}
                />
              )}

              {currentStep === 'livingBenefits' && (
                <ChoiceScreen
                  eyebrow="Living Benefits"
                  title="Life insurance may help while you are still living."
                  body="Some policies may include living benefits that can help if a qualifying illness, injury, or chronic condition occurs. This is one reason the right policy design matters."
                  options={yesNoOptions}
                  selected={data.livingBenefitsInterest}
                  onSelect={(value) => setData({ ...data, livingBenefitsInterest: value })}
                />
              )}

              {currentStep === 'retirementIncome' && (
                <CardGridScreen
                  eyebrow="Retirement Income"
                  title="Can your retirement money handle market volatility?"
                  body="Accumulation is one phase. Distribution is another. A strong retirement strategy considers income, taxes, market risk, and longevity."
                  cards={[
                    ['Guarantees', 'Review what protections may be available.'],
                    ['Rate potential', 'Understand how growth opportunities may work.'],
                    ['Indexed strategy', 'Learn how some strategies may limit downside exposure.'],
                    ['Pension-like income', 'Explore income options designed for retirement.'],
                    ['Potential bonus', 'Review terms carefully before making decisions.'],
                  ]}
                />
              )}

              {currentStep === 'taxBuckets' && (
                <CardGridScreen
                  eyebrow="Tax Buckets"
                  title="Tax now. Tax later. Tax advantage."
                  body="Not all money is taxed the same way. A plan may include taxable, tax-deferred, and tax-advantaged strategies depending on the client's goals and situation."
                  cards={[
                    ['Tax now', 'Savings, CDs, and brokerage accounts.'],
                    ['Tax later', '401(k), 403(b), IRA, annuities, and pensions.'],
                    ['Tax advantage', 'Roth-style and properly structured insurance-based strategies.'],
                  ]}
                />
              )}

              {currentStep === 'retirementTools' && (
                <CardGridScreen
                  eyebrow="Different Tools. Different Rules."
                  title="Employer plans and properly structured life insurance solve different problems."
                  body="This is not an either-or decision. The right strategy depends on goals, income, taxes, protection needs, health, underwriting, and access rules."
                  cards={[
                    ['Tax treatment', 'Employer plans are often tax-deferred. Policy access may be tax-advantaged if structured correctly.'],
                    ['Market exposure', 'Employer plans are often variable. Some policies may use indexed crediting options.'],
                    ['Protection', 'Employer plans focus on retirement. Life insurance includes death benefit protection.'],
                    ['Access rules', 'Plan rules, policy rules, loans, withdrawals, and surrender terms all matter.'],
                    ['Qualification', 'Life insurance may require medical and financial underwriting.'],
                  ]}
                />
              )}

              {currentStep === 'estatePlanning' && (
                <ChoiceScreen
                  eyebrow="Estate Planning Add-On"
                  title="A policy protects the money. Estate planning protects the instructions."
                  body={`${BRAND.fullName} helps clients think beyond the policy by connecting protection planning with wills, trusts, powers of attorney, and health care directives.`}
                  options={yesNoOptions}
                  selected={data.estatePlanningInterest}
                  onSelect={(value) => setData({ ...data, estatePlanningInterest: value })}
                />
              )}

              {currentStep === 'results' && (
                <div>
                  <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                    <Image
                      src="/logo.jpg"
                      alt={`${BRAND.fullName} logo`}
                      width={120}
                      height={120}
                      className="h-auto w-24 rounded-2xl border border-slate-200"
                    />
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: gold }}>
                        Your Results
                      </p>
                      <h2 className="mt-2 text-3xl font-bold md:text-5xl">Your Legacy Readiness Score: {score} / 100</h2>
                    </div>
                  </div>

                  <p className="mt-6 text-lg text-slate-600">
                    Based on your answers, you may benefit from a free Legacy Protection Review with {BRAND.advisor}.
                  </p>

                  <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
                    <ResultRow label="Family Protection" value={getStatus(score, 'family')} />
                    <ResultRow label="Income Protection" value={getStatus(score, 'income')} />
                    <ResultRow label="Retirement Income" value={getStatus(score, 'retirement')} />
                    <ResultRow label="Estate Planning" value={getStatus(score, 'estate')} />
                    <ResultRow label="Booking Readiness" value={score >= 60 ? 'High' : 'Recommended'} />
                  </div>

                  <div className="mt-8 grid gap-3 md:grid-cols-2">
                    <button onClick={bookCall} className="rounded-2xl px-6 py-4 text-lg font-bold text-white transition hover:opacity-90" style={{ background: gold }}>
                      Book My Free Consultation
                    </button>
                    <button onClick={downloadGuide} className="rounded-2xl border-2 px-6 py-4 text-lg font-bold transition hover:bg-[#C9A25F]/10" style={{ borderColor: gold, color: navy }}>
                      Send My Education Guide
                    </button>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-500">
                    This education experience is not tax, legal, investment, or insurance advice. Product availability, benefits, guarantees, and eligibility vary by state, carrier, underwriting, policy design, and client situation.
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
              )}

              {currentStep !== 'results' && (
                <div className="mt-8 flex items-center justify-between gap-3">
                  <button
                    onClick={back}
                    disabled={stepIndex === 0 || isSubmitting}
                    className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Back
                  </button>
                  <button
                    onClick={next}
                    disabled={isSubmitting}
                    className="rounded-2xl px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: gold }}
                  >
                    {currentStep === 'welcome' ? 'Start My Checkup' : isSubmitting ? 'Saving...' : 'Continue'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}

function Screen({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: gold }}>
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">{title}</h2>
      {body && <p className="mt-5 text-lg leading-8 text-slate-600">{body}</p>}
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'number'
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#C9A25F] focus:ring-4 focus:ring-[#C9A25F]/20"
      />
    </label>
  )
}

function ChoiceScreen({
  eyebrow,
  title,
  body,
  options,
  selected,
  onSelect,
}: {
  eyebrow: string
  title: string
  body?: string
  options: string[]
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div>
      <Screen eyebrow={eyebrow} title={title} body={body ?? ''} />
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`rounded-2xl border-2 px-5 py-4 text-left text-base font-bold transition ${
              selected === option ? 'border-[#C9A25F] bg-[#C9A25F]/10' : 'border-slate-200 hover:border-[#C9A25F]'
            }`}
            style={{ color: navy }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function MultiChoiceScreen({
  eyebrow,
  title,
  body,
  options,
  selected,
  onToggle,
}: {
  eyebrow: string
  title: string
  body?: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div>
      <Screen eyebrow={eyebrow} title={title} body={body ?? ''} />
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`rounded-2xl border-2 px-5 py-4 text-left text-base font-bold transition ${
              selected.includes(option) ? 'border-[#C9A25F] bg-[#C9A25F]/10' : 'border-slate-200 hover:border-[#C9A25F]'
            }`}
            style={{ color: navy }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function CardGridScreen({
  eyebrow,
  title,
  body,
  cards,
}: {
  eyebrow: string
  title: string
  body: string
  cards: [string, string][]
}) {
  return (
    <div>
      <Screen eyebrow={eyebrow} title={title} body={body} />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {cards.map(([cardTitle, cardBody]) => (
          <div key={cardTitle} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-bold" style={{ color: navy }}>
              {cardTitle}
            </h3>
            <p className="mt-2 leading-7 text-slate-600">{cardBody}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-2 border-b border-slate-200 last:border-b-0">
      <div className="bg-slate-50 px-4 py-4 font-bold text-slate-700">{label}</div>
      <div className="px-4 py-4 font-bold" style={{ color: navy }}>
        {value}
      </div>
    </div>
  )
}
