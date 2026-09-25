'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BRAND, COLORS } from '@/lib/brand'
import { getCurrentPageUrl, getEventContext, hydrateLeadContext } from '@/lib/lead'
import { trackLatimoreEvent } from '@/lib/tracking/client-events'
import CountyOptions from '@/components/forms/CountyOptions'

type Variant = 'family' | 'retirement' | 'legacy'

type Props = { variant: Variant }

type LeadState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  county: string
}

type VariantConfig = {
  tool: string
  category: string
  eyebrow: string
  headline: string
  intro: string
  resultTitle: string
  resultBody: string
  magnetTitle: string
  magnetBody: string
  bookingTitle: string
  campaign: string
  faqs: Array<[string, string]>
}

const CONFIG: Record<Variant, VariantConfig> = {
  family: {
    tool: 'family_protection_snapshot',
    category: 'Life Protection',
    eyebrow: 'Family Protection Snapshot',
    headline: 'Your family does not need a policy. It needs a number that holds.',
    intro:
      'Start with the obligations your household would still have if an income disappeared: housing, everyday expenses, debt, childcare, and the years your family would need time to adjust.',
    resultTitle: 'Estimated protection gap',
    resultBody:
      'This is an educational estimate—not a quote or application. The purpose is to give you a number to discuss instead of guessing at a coverage amount.',
    magnetTitle: 'Family Protection Worksheet',
    magnetBody:
      'A practical follow-up that helps you write down the income years, housing obligation, current protection, and immediate family priorities behind your number.',
    bookingTitle: 'Review the number with Latimore',
    campaign: 'family_protection_snapshot',
    faqs: [
      ['Is this an insurance quote?', 'No. It is an educational needs snapshot. Actual eligibility, cost, benefits, and availability depend on underwriting and the coverage selected.'],
      ['Should coverage through work count?', 'It can be included in the amount you already have, but it is worth separately confirming portability, benefit amount, and what happens if employment changes.'],
      ['Do I have to buy anything after the review?', 'No. The review is designed to help you understand the gap and the available protection approaches.'],
    ],
  },
  retirement: {
    tool: 'retirement_income_snapshot',
    category: 'Retirement Income',
    eyebrow: 'Retirement Income Snapshot',
    headline: 'Your savings has a balance. Your retirement needs a paycheck.',
    intro:
      'A retirement balance is useful, but the planning question is monthly: how much income do you want, how much is already predictable, and what gap must your remaining assets support?',
    resultTitle: 'Estimated monthly retirement income gap',
    resultBody:
      'This snapshot compares your desired monthly income with the predictable income sources you entered. It does not project investment performance or recommend a specific financial product.',
    magnetTitle: 'Retirement Income Gap Worksheet',
    magnetBody:
      'Use it to list your desired monthly income, predictable sources, housing obligations, and the questions you want answered before retirement.',
    bookingTitle: 'Review your income gap with Latimore',
    campaign: 'retirement_income_snapshot',
    faqs: [
      ['What counts as predictable income?', 'Examples can include Social Security, pensions, and other contractual or guaranteed income sources. The exact treatment depends on the source and its terms.'],
      ['Does this tool tell me what to buy?', 'No. It identifies an income gap for education and planning. Any later recommendation requires a separate suitability and needs discussion.'],
      ['What if the gap is zero?', 'That is still useful. The next review is whether those income sources continue as expected for a surviving spouse and whether other obligations are covered.'],
    ],
  },
  legacy: {
    tool: 'legacy_cost_snapshot',
    category: 'Final Expense',
    eyebrow: 'Legacy Cost Snapshot',
    headline: 'Leave instructions, not a bill.',
    intro:
      'Write down the immediate costs you would want handled without forcing family members to improvise: final arrangements, remaining debts, medical or estate costs, and other near-term obligations.',
    resultTitle: 'Estimated immediate legacy funding gap',
    resultBody:
      'This is an educational estimate. It helps identify the amount your family may need available for immediate obligations and does not constitute an insurance quote.',
    magnetTitle: 'Legacy Cost Checklist',
    magnetBody:
      'A simple checklist for final arrangements, outstanding obligations, beneficiary information, important contacts, and the documents your family should be able to find.',
    bookingTitle: 'Review the gap with Latimore',
    campaign: 'legacy_cost_snapshot',
    faqs: [
      ['Is this only about funeral costs?', 'No. The snapshot can include other immediate obligations such as remaining debt, medical costs, legal or estate expenses, and any amount you intentionally want available to family.'],
      ['Can I count savings I already set aside?', 'Yes. Enter the amount already earmarked for these obligations so the snapshot focuses on the remaining gap.'],
      ['Do I need a medical exam to discuss options?', 'No. An educational review comes first. Any later underwriting requirements depend on the coverage approach and the applicant.'],
    ],
  },
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function NumberField({ label, value, onChange, prefix = '$' }: { label: string; value: number; onChange: (value: number) => void; prefix?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold" style={{ color: COLORS.navy }}>{label}</span>
      <div className="flex items-center rounded-xl border bg-white px-3" style={{ borderColor: COLORS.gray200 }}>
        <span className="text-sm font-bold" style={{ color: COLORS.gray500 }}>{prefix}</span>
        <input
          type="number"
          min="0"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          className="w-full bg-transparent px-2 py-3.5 text-base outline-none"
          style={{ color: COLORS.navy }}
        />
      </div>
    </label>
  )
}

function LeadCapture({ config }: { config: VariantConfig }) {
  const [lead, setLead] = useState<LeadState>({ firstName: '', lastName: '', email: '', phone: '', county: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!lead.email && !lead.phone) return
    setStatus('sending')
    try {
      hydrateLeadContext()
      const context = getEventContext({ pageUrl: getCurrentPageUrl() })
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: lead.firstName || null,
          lastName: lead.lastName || null,
          email: lead.email || null,
          phone: lead.phone || null,
          county: lead.county || null,
          leadSessionId: context.leadSessionId,
          source: context.source,
          medium: context.medium,
          campaign: context.campaign || config.campaign,
          term: context.term,
          content: context.content,
          referrer: context.referrer,
          landingPage: context.pageUrl,
          notes: `${config.eyebrow} follow-up request`,
          metadata: {
            latimoreTool: config.tool,
            solutionCategory: config.category,
            requestedResource: config.magnetTitle,
          },
        }),
      })
      if (!response.ok) throw new Error('lead submission failed')
      setStatus('done')
      void trackLatimoreEvent({ action: 'lead_submitted', tool: config.tool, category: config.category, metadata: { resource: config.magnetTitle } })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border p-6" style={{ borderColor: COLORS.goldBorder, background: COLORS.goldPale }}>
        <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.gold }}>Request received</p>
        <h3 className="mt-2 text-2xl font-black" style={{ color: COLORS.navy }}>You are on the follow-up list.</h3>
        <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textMuted }}>
          Your request has been recorded. You can also schedule the review now if you want to put a time on the calendar.
        </p>
        <Link
          href={`/book?utm_source=latimore_site&utm_medium=solution_funnel&utm_campaign=${config.campaign}&utm_content=post_lead_booking`}
          onClick={() => void trackLatimoreEvent({ action: 'booking_clicked', tool: config.tool, category: config.category, metadata: { placement: 'post_lead' } })}
          className="mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-black no-underline"
          style={{ background: COLORS.gold, color: COLORS.navyDeep }}
        >
          Schedule Complimentary Consultation
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: COLORS.gray200 }}>
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.gold }}>Free follow-up resource</p>
      <h3 className="mt-2 text-2xl font-black" style={{ color: COLORS.navy }}>{config.magnetTitle}</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textMuted }}>{config.magnetBody}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input value={lead.firstName} onChange={(e) => setLead({ ...lead, firstName: e.target.value })} placeholder="First name" className="rounded-xl border px-4 py-3 outline-none" style={{ borderColor: COLORS.gray200 }} />
        <input value={lead.lastName} onChange={(e) => setLead({ ...lead, lastName: e.target.value })} placeholder="Last name" className="rounded-xl border px-4 py-3 outline-none" style={{ borderColor: COLORS.gray200 }} />
        <input type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} placeholder="Email" className="rounded-xl border px-4 py-3 outline-none sm:col-span-2" style={{ borderColor: COLORS.gray200 }} />
        <input value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} placeholder="Phone (optional)" className="rounded-xl border px-4 py-3 outline-none" style={{ borderColor: COLORS.gray200 }} />
        <select value={lead.county} onChange={(e) => setLead({ ...lead, county: e.target.value })} className="rounded-xl border px-4 py-3 outline-none" style={{ borderColor: COLORS.gray200 }}>
          <option value="">County (optional)</option>
          <CountyOptions />
        </select>
      </div>

      <button disabled={status === 'sending' || (!lead.email && !lead.phone)} className="mt-4 w-full rounded-xl px-5 py-3.5 text-sm font-black disabled:opacity-50" style={{ background: COLORS.navy, color: COLORS.white }}>
        {status === 'sending' ? 'Saving…' : `Send My ${config.magnetTitle}`}
      </button>
      {status === 'error' ? <p className="mt-3 text-sm text-red-700">The request could not be saved. Please try again or use the booking link below.</p> : null}
      <p className="mt-3 text-xs leading-5" style={{ color: COLORS.gray500 }}>
        Educational follow-up only. This form is not an application for insurance. We do not sell your information.
      </p>
    </form>
  )
}

export default function SolutionFunnel({ variant }: Props) {
  const config = CONFIG[variant]
  const tracked = useRef(false)
  const started = useRef(false)
  const [calculated, setCalculated] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const [family, setFamily] = useState({ annualIncome: 60000, years: 10, mortgage: 150000, other: 25000, existing: 0 })
  const [retirement, setRetirement] = useState({ desired: 5000, socialSecurity: 2600, pension: 0, otherGuaranteed: 0 })
  const [legacy, setLegacy] = useState({ arrangements: 15000, debt: 5000, medicalEstate: 5000, other: 0, setAside: 0 })

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    void trackLatimoreEvent({ action: 'tool_opened', tool: config.tool, category: config.category })
  }, [config])

  const result = useMemo(() => {
    if (variant === 'family') {
      const totalNeed = family.annualIncome * family.years + family.mortgage + family.other
      return Math.max(0, totalNeed - family.existing)
    }
    if (variant === 'retirement') {
      return Math.max(0, retirement.desired - retirement.socialSecurity - retirement.pension - retirement.otherGuaranteed)
    }
    return Math.max(0, legacy.arrangements + legacy.debt + legacy.medicalEstate + legacy.other - legacy.setAside)
  }, [family, legacy, retirement, variant])

  const resultBand = result === 0 ? 'no_current_gap' : result < (variant === 'retirement' ? 1500 : 50000) ? 'moderate_gap' : 'material_gap'

  function startSnapshot() {
    if (started.current) return
    started.current = true
    void trackLatimoreEvent({ action: 'tool_started', tool: config.tool, category: config.category })
  }

  function calculate() {
    startSnapshot()
    setCalculated(true)
    void trackLatimoreEvent({ action: 'tool_completed', tool: config.tool, category: config.category, resultBand })
  }

  return (
    <div style={{ background: COLORS.goldCream }}>
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.navyDeep}, ${COLORS.navyHero})` }}>
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: COLORS.goldLight }}>{config.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.05] text-white md:text-6xl">{config.headline}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8" style={{ color: 'rgba(255,255,255,.76)' }}>{config.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#snapshot" className="rounded-xl px-6 py-3.5 text-sm font-black no-underline" style={{ background: COLORS.gold, color: COLORS.navyDeep }}>
              Calculate My Snapshot
            </a>
            <Link href={`/book?utm_source=latimore_site&utm_medium=solution_funnel&utm_campaign=${config.campaign}&utm_content=hero_booking`} onClick={() => void trackLatimoreEvent({ action: 'booking_clicked', tool: config.tool, category: config.category, metadata: { placement: 'hero' } })} className="rounded-xl border border-white/25 px-6 py-3.5 text-sm font-black text-white no-underline">
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>

      <section id="snapshot" className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <div onChangeCapture={startSnapshot} className="rounded-3xl border bg-white p-6 shadow-sm md:p-8" style={{ borderColor: COLORS.gray200 }}>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.gold }}>Your numbers</p>
            <h2 className="mt-2 text-3xl font-black" style={{ color: COLORS.navy }}>Build the snapshot</h2>
            <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textMuted }}>Nothing entered here is sent to advertising platforms. The calculation runs in your browser.</p>

            {variant === 'family' ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NumberField label="Annual household income to replace" value={family.annualIncome} onChange={(v) => setFamily({ ...family, annualIncome: v })} />
                <NumberField label="Years to replace" value={family.years} onChange={(v) => setFamily({ ...family, years: Math.min(40, v) })} prefix="" />
                <NumberField label="Mortgage / housing obligation" value={family.mortgage} onChange={(v) => setFamily({ ...family, mortgage: v })} />
                <NumberField label="Debt, childcare, education & other" value={family.other} onChange={(v) => setFamily({ ...family, other: v })} />
                <div className="sm:col-span-2"><NumberField label="Existing individual / employer coverage" value={family.existing} onChange={(v) => setFamily({ ...family, existing: v })} /></div>
              </div>
            ) : variant === 'retirement' ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NumberField label="Desired monthly retirement income" value={retirement.desired} onChange={(v) => setRetirement({ ...retirement, desired: v })} />
                <NumberField label="Estimated Social Security" value={retirement.socialSecurity} onChange={(v) => setRetirement({ ...retirement, socialSecurity: v })} />
                <NumberField label="Pension income" value={retirement.pension} onChange={(v) => setRetirement({ ...retirement, pension: v })} />
                <NumberField label="Other predictable monthly income" value={retirement.otherGuaranteed} onChange={(v) => setRetirement({ ...retirement, otherGuaranteed: v })} />
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NumberField label="Final arrangements" value={legacy.arrangements} onChange={(v) => setLegacy({ ...legacy, arrangements: v })} />
                <NumberField label="Outstanding debts" value={legacy.debt} onChange={(v) => setLegacy({ ...legacy, debt: v })} />
                <NumberField label="Medical / estate costs" value={legacy.medicalEstate} onChange={(v) => setLegacy({ ...legacy, medicalEstate: v })} />
                <NumberField label="Other immediate obligations" value={legacy.other} onChange={(v) => setLegacy({ ...legacy, other: v })} />
                <div className="sm:col-span-2"><NumberField label="Savings or coverage already earmarked" value={legacy.setAside} onChange={(v) => setLegacy({ ...legacy, setAside: v })} /></div>
              </div>
            )}

            <button onClick={calculate} className="mt-6 w-full rounded-xl px-6 py-4 text-sm font-black" style={{ background: COLORS.navy, color: COLORS.white }}>
              Show My Snapshot
            </button>
          </div>

          <div className="rounded-3xl p-7 md:p-8" style={{ background: COLORS.navy, color: COLORS.white }}>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.goldLight }}>{config.resultTitle}</p>
            <div className="mt-4 text-5xl font-black" style={{ color: COLORS.goldLight }}>{calculated ? money.format(result) : '—'}</div>
            {variant === 'retirement' && calculated ? <p className="mt-2 text-sm text-white/65">About {money.format(result * 12 * 25)} over 25 years before inflation, taxes, or investment returns.</p> : null}
            <p className="mt-6 text-sm leading-7 text-white/75">{config.resultBody}</p>
            {calculated ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-black" style={{ color: COLORS.goldLight }}>Next planning question</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  {result === 0
                    ? 'The snapshot does not show a current gap from the numbers entered. A review can still test assumptions, beneficiaries, survivor needs, and whether the amounts remain appropriate.'
                    : 'Now that the gap is visible, the next step is deciding which obligations matter most, how long they need protection, and what monthly commitment fits comfortably.'}
                </p>
              </div>
            ) : null}
            <Link href={`/book?utm_source=latimore_site&utm_medium=solution_funnel&utm_campaign=${config.campaign}&utm_content=result_booking`} onClick={() => void trackLatimoreEvent({ action: 'booking_clicked', tool: config.tool, category: config.category, resultBand, metadata: { placement: 'result' } })} className="mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-black no-underline" style={{ background: COLORS.gold, color: COLORS.navyDeep }}>
              {config.bookingTitle}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y bg-white" style={{ borderColor: COLORS.gray200 }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[.9fr_1.1fr] md:py-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.gold }}>Education first</p>
            <h2 className="mt-2 text-3xl font-black" style={{ color: COLORS.navy }}>Preparation is the whole point.</h2>
            <p className="mt-4 max-w-xl text-base leading-7" style={{ color: COLORS.textMuted }}>
              Latimore Life & Legacy starts with the numbers and the purpose behind them. The consultation is designed to explain available approaches in plain language, compare tradeoffs, and leave the decision with you.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
              {['Education-First', 'Community-Focused', 'Legacy-Driven'].map((item) => <span key={item} className="rounded-full px-4 py-2" style={{ background: COLORS.goldPale, color: COLORS.navy }}>{item}</span>)}
            </div>
          </div>
          <LeadCapture config={config} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <p className="text-center text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.gold }}>Common questions</p>
        <h2 className="mt-2 text-center text-3xl font-black" style={{ color: COLORS.navy }}>Know what the tool does—and what it does not do.</h2>
        <div className="mt-8 space-y-3">
          {config.faqs.map(([question, answer], index) => (
            <button key={question} onClick={() => { setOpenFaq(openFaq === index ? null : index); void trackLatimoreEvent({ action: 'tool_step_completed', tool: config.tool, category: config.category, step: `faq_${index + 1}` }) }} className="w-full rounded-2xl border bg-white p-5 text-left shadow-sm" style={{ borderColor: COLORS.gray200 }}>
              <div className="flex items-center justify-between gap-4">
                <span className="font-black" style={{ color: COLORS.navy }}>{question}</span>
                <span className="text-xl font-black" style={{ color: COLORS.gold }}>{openFaq === index ? '−' : '+'}</span>
              </div>
              {openFaq === index ? <p className="mt-3 text-sm leading-6" style={{ color: COLORS.textMuted }}>{answer}</p> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto max-w-5xl rounded-3xl px-6 py-10 text-center md:px-10" style={{ background: COLORS.navyDeep }}>
          <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.goldLight }}>{BRAND.hashtag}</p>
          <h2 className="mt-3 text-3xl font-black text-white">Protecting Today. Securing Tomorrow.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70">Proudly serving Schuylkill, Luzerne, and Northumberland Counties with education-first protection and retirement conversations.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/book?utm_source=latimore_site&utm_medium=solution_funnel&utm_campaign=${config.campaign}&utm_content=footer_booking`} onClick={() => void trackLatimoreEvent({ action: 'booking_clicked', tool: config.tool, category: config.category, metadata: { placement: 'footer' } })} className="rounded-xl px-6 py-3.5 text-sm font-black no-underline" style={{ background: COLORS.gold, color: COLORS.navyDeep }}>Schedule Complimentary Consultation</Link>
            <a href={BRAND.phoneHref} onClick={() => void trackLatimoreEvent({ action: 'tool_cta_clicked', tool: config.tool, category: config.category, metadata: { placement: 'footer', channel: 'phone' } })} className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-black text-white no-underline">{BRAND.phone}</a>
          </div>
        </div>
        <p className="mx-auto mt-5 max-w-5xl text-center text-xs leading-5" style={{ color: COLORS.gray500 }}>
          For educational purposes only. Not legal, tax, or investment advice. Insurance availability, benefits, underwriting, and cost vary by coverage type, applicant, state, and issuing insurer.
        </p>
      </section>
    </div>
  )
}
