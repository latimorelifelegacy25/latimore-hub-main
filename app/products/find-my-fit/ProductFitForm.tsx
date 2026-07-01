'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { BRAND, COLORS } from '@/lib/brand'
import { getCurrentPageUrl, getEventContext, hydrateLeadContext } from '@/lib/lead'
import { getProductInterestLabel, type ProductInterestValue } from '@/lib/products/catalog'

type Props = {
  selectedProductSlug: string
  selectedProductName: string
  selectedProductInterest: ProductInterestValue
}

type LifeStage = 'young_family' | 'pre_retiree' | 'retiree' | 'business_owner' | 'high_income' | 'other' | ''
type Timeline = 'now' | '30_days' | '90_days' | 'researching' | ''
type BooleanField = 'hasMortgage' | 'hasDependents' | 'ownsBusiness' | 'hasEmployees' | 'wantsRetirementIncome' | 'wantsLegacyPlanning'

type FormState = {
  fullName: string
  email: string
  phone: string
  state: string
  county: string
  lifeStage: LifeStage
  hasMortgage: boolean
  hasDependents: boolean
  ownsBusiness: boolean
  hasEmployees: boolean
  wantsRetirementIncome: boolean
  wantsLegacyPlanning: boolean
  timeline: Timeline
  bestContactTime: string
  notes: string
  hp_company: string
}

type FitResult = {
  ok: boolean
  contactId?: string
  inquiryId?: string
  recommendation?: {
    primary: ProductInterestValue
    secondary: ProductInterestValue | null
    score: number
    reasons: string[]
  }
  error?: unknown
}

const initialState: FormState = {
  fullName: '',
  email: '',
  phone: '',
  state: 'PA',
  county: '',
  lifeStage: '',
  hasMortgage: false,
  hasDependents: false,
  ownsBusiness: false,
  hasEmployees: false,
  wantsRetirementIncome: false,
  wantsLegacyPlanning: false,
  timeline: '',
  bestContactTime: '',
  notes: '',
  hp_company: '',
}

const steps = ['Profile', 'Protection', 'Timeline', 'Contact']

const lifeStageOptions: Array<[Exclude<LifeStage, ''>, string]> = [
  ['young_family', 'Young family / income protection'],
  ['pre_retiree', 'Approaching retirement'],
  ['retiree', 'Retired / preserving assets'],
  ['business_owner', 'Business owner'],
  ['high_income', 'High-income planning'],
  ['other', 'Not sure / other'],
]

const protectionOptions: Array<[BooleanField, string]> = [
  ['hasDependents', 'Family / dependents'],
  ['hasMortgage', 'Mortgage or housing obligation'],
  ['ownsBusiness', 'Business ownership'],
  ['hasEmployees', 'Employees or key people'],
  ['wantsRetirementIncome', 'Retirement income'],
  ['wantsLegacyPlanning', 'Legacy / final expense planning'],
]

const timelineOptions: Array<[Exclude<Timeline, ''>, string]> = [
  ['now', 'Now / urgent'],
  ['30_days', 'Next 30 days'],
  ['90_days', 'Next 90 days'],
  ['researching', 'Researching'],
]

function fieldStyle() {
  return {
    width: '100%',
    border: `1px solid ${COLORS.gray200}`,
    borderRadius: 12,
    padding: '0.9rem 1rem',
    fontSize: '1rem',
    color: COLORS.navy,
    background: COLORS.white,
  } as const
}

function labelStyle() {
  return {
    display: 'block',
    color: COLORS.navy,
    fontWeight: 800,
    fontSize: '0.92rem',
    marginBottom: '0.4rem',
  } as const
}

function optionStyle(active: boolean) {
  return {
    border: `1px solid ${active ? COLORS.gold : COLORS.gray200}`,
    background: active ? COLORS.goldPale : COLORS.white,
    color: COLORS.navy,
    borderRadius: 14,
    padding: '0.9rem 1rem',
    textAlign: 'left' as const,
    fontWeight: 800,
    cursor: 'pointer',
  }
}

export default function ProductFitForm({ selectedProductSlug, selectedProductName, selectedProductInterest }: Props) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>({ ...initialState })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<FitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedLabel = useMemo(() => getProductInterestLabel(selectedProductInterest), [selectedProductInterest])

  const sendEvent = useCallback(
    async (eventType: string, metadata: Record<string, unknown> = {}) => {
      try {
        const context = getEventContext({
          pageUrl: getCurrentPageUrl(),
          productInterest: selectedProductInterest,
        })

        await fetch('/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...context,
            eventType,
            productInterest: selectedProductInterest,
            metadata: {
              selectedProductSlug: selectedProductSlug || null,
              selectedProductName: selectedProductName || null,
              ...metadata,
            },
          }),
          keepalive: true,
          cache: 'no-store',
        })
      } catch {
        // Tracking must never block lead intake.
      }
    },
    [selectedProductInterest, selectedProductName, selectedProductSlug],
  )

  useEffect(() => {
    hydrateLeadContext()
    void sendEvent('legacy_checkup_started', { step: steps[0] })
  }, [sendEvent])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleProtection(key: BooleanField) {
    setForm((current) => ({ ...current, [key]: !current[key] }))
  }

  function goNext() {
    void sendEvent('legacy_checkup_step_completed', { step: steps[step], stepIndex: step })
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
  }

  function validateCurrentStep() {
    if (step === 0 && !form.lifeStage) return 'Choose the life stage that best fits.'
    if (step === 2 && !form.timeline) return 'Choose your timeline.'
    if (step === 3) {
      if (form.fullName.trim().length < 2) return 'Full name is required.'
      if (form.phone.trim().length < 7) return 'Phone number is required.'
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email or leave it blank.'
    }
    return null
  }

  async function handleNext() {
    const validation = validateCurrentStep()
    if (validation) {
      setError(validation)
      return
    }
    setError(null)
    goNext()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateCurrentStep()
    if (validation) {
      setError(validation)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const context = getEventContext({
        pageUrl: getCurrentPageUrl(),
        productInterest: selectedProductInterest,
      })

      const response = await fetch('/api/product-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          selectedProductSlug: selectedProductSlug || undefined,
          productInterest: selectedProductInterest,
          leadSessionId: context.leadSessionId,
          pageUrl: context.pageUrl,
          referrer: context.referrer,
          source: context.source,
          medium: context.medium,
          campaign: context.campaign,
          term: context.term,
          content: context.content,
        }),
        cache: 'no-store',
      })

      const payload = (await response.json().catch(() => null)) as FitResult | null
      if (!response.ok || !payload?.ok) {
        throw new Error('Find My Fit submission failed')
      }

      setResult(payload)
      void sendEvent('lead_submitted', {
        step: 'submitted',
        contactId: payload.contactId ?? null,
        inquiryId: payload.inquiryId ?? null,
        recommendation: payload.recommendation ?? null,
      })
      void sendEvent('legacy_checkup_completed', {
        contactId: payload.contactId ?? null,
        inquiryId: payload.inquiryId ?? null,
        recommendation: payload.recommendation ?? null,
      })
    } catch {
      setError('Submission failed. Please call or book directly while we fix the form path.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result?.ok && result.recommendation) {
    const primary = getProductInterestLabel(result.recommendation.primary)
    const secondary = result.recommendation.secondary ? getProductInterestLabel(result.recommendation.secondary) : null

    return (
      <div style={{ background: COLORS.white, borderRadius: 22, border: `1px solid ${COLORS.goldBorder}`, boxShadow: '0 16px 44px rgba(14,26,43,0.10)', padding: '1.5rem' }}>
        <p style={{ color: COLORS.gold, fontWeight: 850, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: '0.78rem', margin: '0 0 0.6rem' }}>
          Match Complete
        </p>
        <h2 style={{ color: COLORS.navy, margin: '0 0 1rem', fontSize: 'clamp(1.6rem,4vw,2.2rem)' }}>
          Based on your answers, a good starting point may be {primary}.
        </h2>
        {secondary ? <p style={{ color: COLORS.gray700, lineHeight: 1.7 }}>Secondary match: <strong>{secondary}</strong>.</p> : null}
        <div style={{ background: COLORS.goldPale, borderRadius: 16, padding: '1rem', margin: '1rem 0' }}>
          <p style={{ color: COLORS.navy, margin: '0 0 0.5rem', fontWeight: 850 }}>Why this showed up:</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: COLORS.gray700, lineHeight: 1.7 }}>
            {result.recommendation.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        <p style={{ color: COLORS.gray700, lineHeight: 1.7 }}>
          Next step: book a free consultation so we can confirm your goals, budget, eligibility, and available options.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.2rem' }}>
          <a
            href={`${BRAND.bookingUrl}?product=${encodeURIComponent(result.recommendation.primary)}`}
            data-track="true"
            data-track-event="book_consultation_clicked"
            data-track-cta="true"
            data-product-interest={result.recommendation.primary}
            style={{ background: COLORS.gold, color: COLORS.navy, borderRadius: 999, padding: '0.9rem 1.2rem', fontWeight: 900, textDecoration: 'none' }}
          >
            Book Free Consultation
          </a>
          <a
            href={`tel:${BRAND.phoneRaw}`}
            data-track="true"
            data-track-event="call_click"
            data-track-cta="true"
            data-product-interest={result.recommendation.primary}
            style={{ background: COLORS.navy, color: COLORS.white, borderRadius: 999, padding: '0.9rem 1.2rem', fontWeight: 850, textDecoration: 'none' }}
          >
            Call Now
          </a>
          <a href="/products" style={{ color: COLORS.navy, border: `1px solid ${COLORS.gray200}`, borderRadius: 999, padding: '0.9rem 1.2rem', fontWeight: 850, textDecoration: 'none' }}>
            Back to Products
          </a>
        </div>
        <p style={{ color: COLORS.gray600, fontSize: '0.84rem', lineHeight: 1.7, marginTop: '1.2rem' }}>
          This is an educational starting point, not a quote, legal advice, tax advice, investment advice, or a guarantee of eligibility.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: COLORS.white, borderRadius: 22, border: `1px solid ${COLORS.goldBorder}`, boxShadow: '0 16px 44px rgba(14,26,43,0.10)', padding: '1.25rem' }}>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={form.hp_company}
        onChange={(event) => update('hp_company', event.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        aria-hidden="true"
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        {steps.map((label, index) => (
          <span key={label} style={{ background: index === step ? COLORS.navy : COLORS.gray100, color: index === step ? COLORS.white : COLORS.gray600, borderRadius: 999, padding: '0.45rem 0.75rem', fontWeight: 850, fontSize: '0.8rem' }}>
            {index + 1}. {label}
          </span>
        ))}
      </div>

      {selectedProductName ? (
        <div style={{ background: COLORS.goldPale, borderRadius: 14, padding: '0.9rem 1rem', marginBottom: '1.2rem', color: COLORS.navy, fontWeight: 750 }}>
          Selected product context: {selectedProductName} → {selectedLabel}
        </div>
      ) : null}

      {step === 0 ? (
        <div>
          <h2 style={{ color: COLORS.navy, margin: '0 0 0.4rem' }}>Who are we helping?</h2>
          <p style={{ color: COLORS.gray600, margin: '0 0 1rem', lineHeight: 1.7 }}>Pick the closest match. This controls the first recommendation pass.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {lifeStageOptions.map(([value, label]) => (
              <button key={value} type="button" onClick={() => update('lifeStage', value)} style={optionStyle(form.lifeStage === value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div>
          <h2 style={{ color: COLORS.navy, margin: '0 0 0.4rem' }}>What are you protecting?</h2>
          <p style={{ color: COLORS.gray600, margin: '0 0 1rem', lineHeight: 1.7 }}>Select every item that applies.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {protectionOptions.map(([key, label]) => (
              <button key={key} type="button" onClick={() => toggleProtection(key)} style={optionStyle(form[key])}>
                {form[key] ? '✓ ' : ''}{label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <h2 style={{ color: COLORS.navy, margin: '0 0 0.4rem' }}>What timeline are you on?</h2>
          <p style={{ color: COLORS.gray600, margin: '0 0 1rem', lineHeight: 1.7 }}>This helps prioritize follow-up inside the CRM.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {timelineOptions.map(([value, label]) => (
              <button key={value} type="button" onClick={() => update('timeline', value)} style={optionStyle(form.timeline === value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <h2 style={{ color: COLORS.navy, margin: '0 0 0.4rem' }}>Contact details</h2>
          <p style={{ color: COLORS.gray600, margin: '0 0 1rem', lineHeight: 1.7 }}>This creates the CRM inquiry with product context and source attribution.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <label>
              <span style={labelStyle()}>Full name</span>
              <input style={fieldStyle()} value={form.fullName} onChange={(event) => update('fullName', event.target.value)} autoComplete="name" />
            </label>
            <label>
              <span style={labelStyle()}>Phone</span>
              <input style={fieldStyle()} value={form.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" inputMode="tel" />
            </label>
            <label>
              <span style={labelStyle()}>Email</span>
              <input style={fieldStyle()} value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" inputMode="email" />
            </label>
            <label>
              <span style={labelStyle()}>County</span>
              <input style={fieldStyle()} value={form.county} onChange={(event) => update('county', event.target.value)} placeholder="Schuylkill, Luzerne, Northumberland..." />
            </label>
            <label>
              <span style={labelStyle()}>State</span>
              <input style={fieldStyle()} value={form.state} onChange={(event) => update('state', event.target.value)} maxLength={100} />
            </label>
            <label>
              <span style={labelStyle()}>Best contact time</span>
              <input style={fieldStyle()} value={form.bestContactTime} onChange={(event) => update('bestContactTime', event.target.value)} placeholder="Morning, afternoon, evening..." />
            </label>
          </div>
          <label style={{ display: 'block', marginTop: '1rem' }}>
            <span style={labelStyle()}>Notes</span>
            <textarea style={{ ...fieldStyle(), minHeight: 110, resize: 'vertical' }} value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Anything you want me to know before follow-up?" />
          </label>
        </div>
      ) : null}

      {error ? <p style={{ color: '#b42318', fontWeight: 800, margin: '1rem 0 0' }}>{error}</p> : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.4rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={goBack} disabled={step === 0} style={{ border: `1px solid ${COLORS.gray200}`, background: COLORS.white, color: step === 0 ? COLORS.gray500 : COLORS.navy, borderRadius: 999, padding: '0.85rem 1rem', fontWeight: 850, cursor: step === 0 ? 'not-allowed' : 'pointer' }}>
          Back
        </button>
        {step < steps.length - 1 ? (
          <button type="button" onClick={handleNext} style={{ border: 0, background: COLORS.gold, color: COLORS.navy, borderRadius: 999, padding: '0.85rem 1.15rem', fontWeight: 900, cursor: 'pointer' }}>
            Continue
          </button>
        ) : (
          <button type="submit" disabled={submitting} style={{ border: 0, background: COLORS.gold, color: COLORS.navy, borderRadius: 999, padding: '0.85rem 1.15rem', fontWeight: 900, cursor: submitting ? 'wait' : 'pointer' }}>
            {submitting ? 'Submitting…' : 'Get My Recommendation'}
          </button>
        )}
      </div>
    </form>
  )
}
