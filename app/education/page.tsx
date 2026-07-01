import Link from 'next/link'
import Image from 'next/image'
import { COLORS, BRAND } from '@/lib/brand'
import { trackLeadConversion } from '@/lib/tracking/client-conversions'
import { SiteHeader, SiteFooter, DEFAULT_NAV_LINKS } from '@/app/_components/site-shell'

export const metadata = {
  title: 'Education Center | Latimore Life & Legacy',
  description:
    'Plain-language guides to life insurance, annuities, retirement income, and estate planning. Education First. Pressure Never.',
}

const navy    = COLORS.navy
const gold    = COLORS.gold
const goldPale = COLORS.goldPale
const cream   = COLORS.goldCream
const muted   = COLORS.textMuted

// ─── DATA ──────────────────────────────────────────────────────────────────

const STATS = [
  { num: '1 in 4',  label: 'Americans will become disabled before reaching retirement age' },
  { num: '70%',     label: 'of families with children would face financial hardship within months if the breadwinner passed away' },
  { num: '$9K+',    label: 'average funeral cost — a burden that falls on surviving family without final expense coverage' },
  { num: '10–12×',  label: 'your annual income is the coverage amount most financial experts recommend' },
]

const COVERAGE_ROWS = [
  { type: 'Term Life',             does: 'Affordable coverage for a defined period (10–30 years). Pays a death benefit if you pass away during the term.',    best: 'Young families, income replacement, mortgage payoff' },
  { type: 'Mortgage Protection',   does: 'Keeps your family in their home if you pass away, become disabled, or face a critical illness.',                    best: 'Homeowners, new buyers, families with young children' },
  { type: 'Final Expense',         does: "Covers funeral costs, burial, and end-of-life bills so your family isn't left with an unexpected burden.",         best: 'Seniors, those without existing life coverage' },
  { type: 'Living Benefits',       does: 'Access a portion of your death benefit while still alive if diagnosed with a critical, chronic, or terminal illness.', best: 'Anyone wanting protection they can use during their lifetime' },
  { type: 'Whole Life / Permanent', does: 'Lifelong coverage that never expires, builds cash value, and serves as a savings and legacy vehicle.',             best: 'Long-term legacy planning, estate, juvenile policies' },
  { type: 'Fixed Index Annuity',   does: 'Protects retirement savings from market loss while building a guaranteed income stream you cannot outlive.',        best: 'Pre-retirees and retirees seeking income certainty' },
  { type: 'Key Person Insurance',  does: 'Protects a business from financial loss if a critical owner, partner, or key employee unexpectedly dies or is disabled.', best: 'Business owners, partnerships, school districts' },
  { type: 'Juvenile Coverage',     does: 'Locks in low rates while your child is young and healthy. Builds cash value and guarantees future insurability.',   best: 'Parents and grandparents planning ahead' },
]

const MYTHS = [
  { myth: '"Life insurance is too expensive."',                   fact: 'A healthy 35-year-old can get $500,000 in term coverage for as little as $25–$35/month. Many final expense policies start under $50/month. We work across multiple carriers to find what fits your budget.' },
  { myth: '"I\'m young and healthy — I don\'t need it yet."',      fact: 'Youth and health are exactly why you should act now. Rates are lowest when you\'re young. Waiting costs more — or disqualifies you if health changes.' },
  { myth: '"My employer\'s coverage is enough."',                  fact: 'Employer coverage is typically 1–2× salary and disappears when you leave. Most experts recommend 10–12× your income in personal coverage.' },
  { myth: '"Life insurance is only for the breadwinner."',         fact: 'Stay-at-home parents provide enormous economic value. Their loss would require significant resources to replace — childcare alone can run $30K+/year.' },
  { myth: '"The process is complicated and takes forever."',       fact: 'Many policies are approved in 24–48 hours. Some term policies offer same-day decisions with no medical exam required. We handle the paperwork — start to finish.' },
  { myth: '"Annuities are risky and complicated."',                fact: 'Fixed index annuities are insurance products — not stock market investments. Your principal is protected from market loss by design.' },
]

const QUESTIONS = [
  { num: '01', q: 'Who depends on your income?',           body: 'Think about everyone who relies on your paycheck — spouse, children, aging parents, business partners. The more dependents, the more critical your coverage.' },
  { num: '02', q: 'What debts would your family inherit?', body: 'Mortgage, car loans, student debt, credit cards don\'t disappear when you do. Mortgage protection and term life ensure your family starts fresh, not in the red.' },
  { num: '03', q: 'How long do you need coverage?',        body: 'A 30-year-old with young children has different needs than a 60-year-old planning retirement. The right term depends on your life stage, not a formula.' },
  { num: '04', q: 'What is your budget?',                  body: 'Life insurance is more affordable than most people think. We work with multiple top-rated carriers to find the best rate for your health profile, age, and coverage goals — no single-carrier bias, ever.' },
  { num: '05', q: 'What legacy do you want to leave?',     body: 'Beyond protection, life insurance can be a wealth-building tool. Annuities create guaranteed retirement income. Estate planning ensures assets transfer on your terms.' },
]

const GLOSSARY = [
  { term: 'Death Benefit',                   def: 'The amount paid to your beneficiaries when you pass away. This is the primary purpose of a life insurance policy.' },
  { term: 'Living Benefits',                  def: 'A rider allowing you to access a portion of your death benefit while still alive — triggered by critical, chronic, or terminal illness.' },
  { term: 'Term Life Insurance',              def: 'Coverage for a specific period (10, 20, or 30 years). No cash value. If you pass away during the term, your beneficiaries receive the death benefit.' },
  { term: 'Whole Life Insurance',             def: 'Permanent coverage that never expires. Builds cash value over time. Premiums remain level for life.' },
  { term: 'Fixed Index Annuity (FIA)',        def: 'An insurance product that ties interest credits to a market index without directly investing in it. Principal is protected from market loss.' },
  { term: 'Lifetime Income Benefit Rider',    def: 'An optional rider on an annuity that guarantees a growing income account and converts it to lifetime income payments when you\'re ready.' },
  { term: 'Income Account Value (IAV)',        def: 'A separate measuring tool within an annuity used solely to calculate guaranteed lifetime income. Not the same as your account balance; cannot be withdrawn as a lump sum.' },
  { term: 'Surrender Charge',                 def: 'A fee on withdrawals exceeding the free withdrawal amount during early annuity years. Declines over time and eventually reaches zero.' },
  { term: 'Free Withdrawal',                  def: 'The amount you can withdraw from an annuity each year without a surrender charge — typically up to 10% of contract value annually.' },
  { term: 'Key Person Insurance',             def: 'Life insurance owned by a business on a critical employee or owner. The business is the beneficiary and uses proceeds to survive the loss.' },
  { term: 'Buy-Sell Agreement',               def: 'A legal agreement between business partners defining what happens to an owner\'s share if they die, become disabled, or exit — often funded with life insurance.' },
  { term: 'Beneficiary',                      def: 'The person or entity designated to receive the death benefit. You can name primary and contingent (backup) beneficiaries.' },
  { term: 'Rider',                            def: 'An optional add-on to a policy providing additional benefits or modifications — often for an additional premium.' },
  { term: 'Final Expense Insurance',          def: 'Smaller whole life policies covering funeral costs and end-of-life bills. Typically easier to qualify for than traditional life insurance.' },
  { term: 'Tax-Deferred Growth',              def: 'Earnings in an annuity or permanent life policy grow without being taxed until withdrawn, allowing more of your money to compound.' },
  { term: 'DIME Method',                      def: 'A coverage calculation framework: Debt + Income replacement + Mortgage + Education. Helps estimate how much protection your family may need.' },
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

    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      throw new Error(result?.error ? JSON.stringify(result.error) : 'Unable to save your information.')
    }

    trackLeadConversion({ eventId: result.conversionEventId, source: 'Education Funnel', campaign: 'legacy_checkup', formName: 'education_funnel' })
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
        await logOnce('page_view', { activity: 'Started Education Funnel' })
      }

      if (currentStep === 'contact') {
        setIsSubmitting(true)
        await submitLead()
        await logEvent('form_submit', { activity: 'Completed Contact Capture' })
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
    await logEvent('book_click', { activity: 'Clicked Book With Jackson' })
    window.location.href = BRAND.bookingUrl
  }

  useEffect(() => {
    const eventsByStep: Partial<Record<Step, [string, Record<string, unknown>]>> = {
      rule72: ['cta_click', { activity: 'Viewed Rule of 72', detail: 'Interactive compound interest education' }],
      taxBuckets: ['cta_click', { activity: 'Viewed Tax Buckets', detail: 'Tax now, tax later, tax advantage' }],
      retirementTools: ['cta_click', { activity: 'Viewed 401k vs IUL Education', detail: 'Different tools, different rules' }],
      retirementIncome: ['cta_click', { activity: 'Viewed GRIPP Module', detail: 'Retirement income and market volatility education' }],
    }

    const event = eventsByStep[currentStep]

    if (event) {
      logOnce(`${event[0]}:${currentStep}`, event[1]).catch(() => null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  useEffect(() => {
    if (currentStep !== 'results' || completedRef.current) return

    completedRef.current = true

    logEvent('form_submit', { activity: 'Completed Legacy Checkup', legacyScore: score }).catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, score])

export default function EducationHubPage() {
  return (
    <>
      <SiteHeader currentPath="/education" navLinks={DEFAULT_NAV_LINKS} />

      <main>
        {/* ── HERO ── */}
        <section style={{ background: navy, padding: '72px 20px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: gold, marginBottom: 14 }}>
            Education First. Pressure Never.
          </p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: '#fff', lineHeight: 1.15, maxWidth: 720, margin: '0 auto 18px' }}>
            Know <em style={{ color: gold, fontStyle: 'italic' }}>exactly</em> how to protect your family &amp; build your legacy
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.65 }}>
            Plain-language guides on life insurance, retirement income, and estate planning — no jargon, no hidden agendas, no pressure.
          </p>

          {/* Quick-jump pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 0 }}>
            {[
              ['#coverage',    'Coverage Options'],
              ['#myths',       'Myth Busters'],
              ['#questions',   '5 Key Questions'],
              ['#retirement',  'Retirement Income'],
              ['#business',    'Business Protection'],
              ['#glossary',    'Glossary'],
              ['#checkup',     'Free Checkup ↓'],
            ].map(([href, label]) => (
              <a key={href} href={href} style={{
                background: 'rgba(201,162,95,0.15)',
                border: '1px solid rgba(201,162,95,0.4)',
                color: '#E5C882',
                padding: '6px 16px',
                borderRadius: 100,
                fontSize: '0.73rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textDecoration: 'none',
              }}>
                {label}
              </a>
            ))}
          </div>

          {/* ECG line */}
          <svg viewBox="0 0 1200 52" style={{ display: 'block', width: '100%', marginTop: 36, opacity: 0.55 }} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <polyline
              points="0,30 110,30 130,30 148,8 163,48 178,4 193,45 208,26 250,26 270,30 390,30 410,30 428,8 443,48 458,4 473,45 488,26 530,26 550,30 670,30 690,30 708,8 723,48 738,4 753,45 768,26 810,26 830,30 950,30 970,30 988,8 1003,48 1018,4 1033,45 1048,26 1090,26 1110,30 1200,30"
              stroke={gold} strokeWidth="1.6" fill="none"
            />
          </svg>
        </section>

        {/* ── STATS STRIP ── */}
        <div style={{ background: '#0B1523', padding: '44px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 28, textAlign: 'center' }}>
            {STATS.map(({ num, label }) => (
              <div key={num}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '2.6rem', color: gold, lineHeight: 1, marginBottom: 6 }}>{num}</div>
                <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: '0.8rem', lineHeight: 1.45, maxWidth: 175, margin: '0 auto' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COVERAGE OPTIONS ── */}
        <section id="coverage" style={{ padding: '68px 20px', maxWidth: 1100, margin: '0 auto' }}>
          <Eyebrow>Coverage Basics</Eyebrow>
          <SectionTitle>Your Coverage Options — Explained Simply</SectionTitle>
          <SectionSub>Every family&apos;s situation is different. Here&apos;s a plain-language breakdown of the protection options available through {BRAND.name}.</SectionSub>

          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e5e7eb', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: 600 }}>
              <thead>
                <tr>
                  {['Coverage Type', 'What It Does', 'Best For'].map((h) => (
                    <th key={h} style={{ background: navy, color: '#E5C882', padding: '13px 18px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COVERAGE_ROWS.map(({ type, does, best }, i) => (
                  <tr key={type} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '13px 18px', fontSize: '0.84rem', fontWeight: 700, color: navy, whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>{type}</td>
                    <td style={{ padding: '13px 18px', fontSize: '0.84rem', color: muted, borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', lineHeight: 1.5 }}>{does}</td>
                    <td style={{ padding: '13px 18px', fontSize: '0.84rem', color: muted, borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', lineHeight: 1.5 }}>{best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pullquote text={`"Life insurance is not about death — it's about life. It's about making sure the people you love can keep living the life you've built together, even if something happens to you."`} />
        </section>

        {/* ── 5 QUESTIONS ── */}
        <section id="questions" style={{ background: '#fff', padding: '68px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Eyebrow>Know Before You Buy</Eyebrow>
            <SectionTitle>5 Questions Every Family Must Answer</SectionTitle>
            <SectionSub>Before choosing any coverage, answer these five questions honestly. Your answers guide the right decision for your unique situation — not a one-size-fits-all formula.</SectionSub>

            <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column' }}>
              {QUESTIONS.map(({ num, q, body }) => (
                <div key={num} style={{ display: 'flex', gap: 22, padding: '26px 0', borderBottom: '1px solid #e5e7eb', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', color: gold, lineHeight: 1, minWidth: 44, fontWeight: 700 }}>{num}</div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: navy, marginBottom: 6 }}>{q}</h3>
                    <p style={{ color: muted, fontSize: '0.86rem', lineHeight: 1.6 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MYTH BUSTERS ── */}
        <section id="myths" style={{ background: '#0E1A2B', padding: '68px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Eyebrow light>Common Misconceptions</Eyebrow>
            <SectionTitle light>Myths That Keep Families Unprotected</SectionTitle>
            <SectionSub light>These misconceptions are the reason millions of families are underinsured. Let&apos;s set the record straight.</SectionSub>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
              {MYTHS.map(({ myth, fact }) => (
                <div key={myth} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,162,95,0.2)', borderRadius: 10, padding: 22 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#f87171', marginBottom: 8 }}>❌ Myth</div>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.92rem', fontWeight: 600, marginBottom: 14, lineHeight: 1.4 }}>{myth}</div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: gold, marginBottom: 8 }}>✓ Fact</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.83rem', lineHeight: 1.55 }}>{fact}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RETIREMENT INCOME ── */}
        <section id="retirement" style={{ background: cream, padding: '68px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Eyebrow>Retirement Planning</Eyebrow>
            <SectionTitle>The 3-Bucket Retirement Strategy</SectionTitle>
            <SectionSub>The most effective retirement plans organize savings into three distinct buckets — each with a specific job. Here&apos;s how it works and why it matters.</SectionSub>

            <Pullquote text={`"The goal isn't to beat the market. It's to create certainty in an uncertain world — a guaranteed paycheck that comes every month, no matter how long you live." — Jackson M. Latimore Sr., MBA`} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginTop: 32 }}>
              {[
                { pct: '30–40%', name: 'Income Bucket',  accent: gold,      desc: 'Your protected floor. Generates guaranteed lifetime income no matter what the market does. Creates certainty for essential expenses.', examples: 'Fixed index annuities, guaranteed income products, structured income strategies' },
                { pct: '40–50%', name: 'Growth Bucket',  accent: navy,      desc: 'Your long-term engine. Stays invested for growth and keeps pace with inflation over time. Accessed later in retirement.', examples: 'Stocks, mutual funds, index funds, tax-advantaged accumulation strategies' },
                { pct: '10–20%', name: 'Safety Bucket',  accent: '#4a7c59', desc: 'Your emergency reserve. Liquid and accessible for unexpected needs without touching your income or growth buckets.', examples: 'Cash, CDs, money market accounts' },
              ].map(({ pct, name, accent, desc, examples }) => (
                <div key={name} style={{ background: '#fff', borderRadius: 10, padding: 26, borderTop: `4px solid ${accent}`, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 700, color: accent, marginBottom: 4 }}>{pct}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, marginBottom: 12 }}>{name}</div>
                  <p style={{ fontSize: '0.84rem', color: '#374151', lineHeight: 1.5, marginBottom: 10 }}>{desc}</p>
                  <p style={{ fontSize: '0.76rem', color: muted, fontStyle: 'italic' }}>{examples}</p>
                </div>
              ))}
            </div>

            {/* Why guaranteed income matters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginTop: 28 }}>
              {[
                ['Longevity Protection',    'Once income begins, it\'s guaranteed for life — the check keeps coming regardless of how long you live.'],
                ['Market Loss Protection',  'Principal is never decreased due to index volatility. Savings and credited interest are locked in.'],
                ['Tax-Deferred Growth',     'Earnings grow tax-deferred, meaning you don\'t pay taxes until you start drawing income.'],
                ['Legacy at Death',         'Beneficiaries may receive the full contract value with no surrender charges at death.'],
              ].map(([title, body]) => (
                <div key={title as string} style={{ background: '#fff', borderRadius: 8, padding: 18, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 700, color: navy, fontSize: '0.88rem', marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: '0.81rem', color: muted, lineHeight: 1.5 }}>{body}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, background: '#fff', borderRadius: 10, padding: 22, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: gold, marginBottom: 8 }}>⚠ Important Note</div>
              <p style={{ fontSize: '0.8rem', color: muted, lineHeight: 1.65 }}>
                Fixed index annuities are insurance products — not investments. They do not directly participate in any stock market index. Surrender charges apply in early years. All income projections are for illustration purposes only. Always review an official product illustration before making any decision. Suitability documentation is required before recommending any annuity product.
              </p>
            </div>
          </div>
        </section>

        {/* ── BUSINESS / KEY PERSON ── */}
        <section id="business" style={{ background: navy, padding: '68px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Eyebrow light>Business Protection</Eyebrow>
            <SectionTitle light>What Happens to Your Business If You&apos;re Gone?</SectionTitle>
            <SectionSub light>Most business owners plan for growth. Few plan for the risk that can unravel everything overnight.</SectionSub>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 44, marginTop: 36, alignItems: 'start' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.94rem', lineHeight: 1.7, marginBottom: 20 }}>
                  Key person insurance protects a business from financial loss when a critical owner, partner, or employee unexpectedly passes away or becomes unable to work. The business owns and pays for the policy and is the beneficiary. When the unexpected happens, the proceeds can:
                </p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Cover lost revenue and operational disruption during the transition period',
                    'Fund recruiting and training costs to find a qualified replacement',
                    'Pay outstanding business debts the key person was servicing',
                    'Reassure lenders, investors, and clients that the business remains stable',
                    'Fund a buy-sell agreement, allowing surviving partners to purchase the departing owner\'s share',
                    'Protect employees whose jobs depend on the company\'s financial continuity',
                  ].map((item) => (
                    <li key={item} style={{ display: 'flex', gap: 10, color: 'rgba(255,255,255,0.75)', fontSize: '0.86rem', lineHeight: 1.5 }}>
                      <span style={{ width: 6, height: 6, background: gold, borderRadius: '50%', flexShrink: 0, marginTop: 7 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Small Business Owner', 'A family-run contracting company with 8 employees. The founder is the lead estimator, project manager, and primary client contact. Without key person coverage, the sudden loss could mean lost contracts, delayed projects, and potential closure — leaving employees without jobs.'],
                  ['Business Partnership', 'Two equal partners in a service business. Without a funded buy-sell agreement, the surviving partner may be forced to take on the deceased\'s spouse as an unplanned co-owner — or scramble to finance a buyout at the worst possible moment.'],
                  ['School District Leadership', 'The unexpected loss of a Superintendent or Business Manager can trigger operational chaos, financial disruption, and a community trust crisis. A proactive key person strategy funds continuity and demonstrates the district plans ahead — not reactively.'],
                ].map(([label, text]) => (
                  <div key={label as string} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,162,95,0.22)', borderRadius: 8, padding: 20 }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: gold, marginBottom: 6 }}>Scenario: {label}</div>
                    <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.83rem', lineHeight: 1.5, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── GLOSSARY ── */}
        <section id="glossary" style={{ background: '#f9fafb', padding: '68px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Eyebrow>Reference Guide</Eyebrow>
            <SectionTitle>Financial Protection Glossary</SectionTitle>
            <SectionSub>Insurance and financial terms don&apos;t have to be confusing. Every term you need — in plain English.</SectionSub>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
              {GLOSSARY.map(({ term, def }) => (
                <div key={term} style={{ background: '#fff', borderRadius: 8, padding: 18, borderLeft: `3px solid ${gold}` }}>
                  <div style={{ fontWeight: 700, color: navy, fontSize: '0.88rem', marginBottom: 6 }}>{term}</div>
                  <div style={{ color: muted, fontSize: '0.8rem', lineHeight: 1.55 }}>{def}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BLOG CTA BRIDGE ── */}
        <div style={{ background: '#fff', padding: '56px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, marginBottom: 12 }}>Go Deeper</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: navy, marginBottom: 10 }}>Read the Education Blog</h2>
          <p style={{ color: muted, fontSize: '0.94rem', marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
            28 articles covering life insurance basics, retirement strategies, living benefits, estate planning, and more.
          </p>
          <Link href="/education/blog" style={{ display: 'inline-block', background: navy, color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
            Browse All Articles →
          </Link>
        </div>

        {/* ── FREE CHECKUP FUNNEL ── */}
        <section id="checkup" style={{ background: '#0B1523', padding: '72px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
            {/* Left copy */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,162,95,0.14)', border: '1px solid rgba(201,162,95,0.3)', color: '#E5C882', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 100, marginBottom: 18 }}>
                Free — No Pressure — Education First
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
                Take the Free Legacy Protection Checkup
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.92rem', lineHeight: 1.65, marginBottom: 28 }}>
                A 5-minute interactive experience that walks you through your protection gaps, shows your Legacy Readiness Score, and gives you a personalized education guide — tailored to your situation.
              </p>
              {[
                'Personalized Legacy Readiness Score (0–100)',
                'Step-by-step education on the concepts relevant to you',
                'Rule of 72 compound interest calculator',
                'Downloadable needs assessment guide',
                'Free consultation offer at the end — zero pressure',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 7, height: 7, background: gold, borderRadius: '50%', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.86rem' }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Right CTA box */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 36 }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <Image src="/logo.jpg" alt="Latimore Life & Legacy" width={100} height={100} style={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
              </div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: navy, marginBottom: 8 }}>Ready to see where you stand?</h3>
              <p style={{ color: muted, fontSize: '0.84rem', lineHeight: 1.5, marginBottom: 24 }}>
                The checkup walks you through 15 short steps. Most people finish in under 5 minutes. Your results are personalized and private.
              </p>

              <Link
                href="/education/checkup"
                style={{
                  display: 'block',
                  background: gold,
                  color: navy,
                  padding: '14px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                Start My Free Legacy Checkup →
              </Link>

              <Link
                href={BRAND.bookingUrl}
                style={{
                  display: 'block',
                  background: 'transparent',
                  color: navy,
                  padding: '13px 20px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                  border: `2px solid ${navy}`,
                  marginBottom: 12,
                }}
              >
                Skip Ahead — Book a Free Consultation
              </Link>

              <p style={{ fontSize: '0.7rem', color: muted, textAlign: 'center', lineHeight: 1.5 }}>
                Or call / text Jackson directly: <strong>{BRAND.phone}</strong><br />
                No spam. No pressure. No obligation.
              </p>
            </div>
          </div>
        </section>

        {/* ── COMPLIANCE / FOOTER NOTE ── */}
        <div style={{ background: '#07101C', padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Georgia, serif', color: gold, fontSize: '0.88rem', marginBottom: 10 }}>#TheBeatGoesOn</p>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.63rem', lineHeight: 1.7, maxWidth: 780, margin: '0 auto' }}>
            {BRAND.fullName} &nbsp;|&nbsp; {BRAND.advisor} &nbsp;|&nbsp; {BRAND.affiliation}<br />
            PA DOI License #{BRAND.paLicense} &nbsp;|&nbsp; NIPR #{BRAND.nipr} &nbsp;|&nbsp; Serving Schuylkill, Luzerne &amp; Northumberland Counties, PA<br /><br />
            This page is for educational and informational purposes only and does not constitute legal, tax, investment, or financial advice. Life insurance and annuity products are subject to carrier underwriting and approval. Fixed index annuities are not investments and do not directly participate in any stock market index. All income projections are for educational purposes only; confirm current rates with the applicable carrier before any client presentation. Surrender charges apply during the surrender period. Always complete suitability documentation before recommending any annuity product. Guarantees are based on the financial strength and claims-paying ability of the issuing insurance company.
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}

// ─── SHARED MICRO-COMPONENTS ───────────────────────────────────────────────

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.gold, marginBottom: 10 }}>
      {children}
    </p>
  )
}

function SectionTitle({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem, 3vw, 2.3rem)', color: light ? '#fff' : COLORS.navy, marginBottom: 12, lineHeight: 1.2 }}>
      {children}
    </h2>
  )
}

function SectionSub({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p style={{ color: light ? 'rgba(255,255,255,0.62)' : COLORS.textMuted, fontSize: '0.93rem', lineHeight: 1.65, maxWidth: 600, marginBottom: 40 }}>
      {children}
    </p>
  )
}

function Pullquote({ text }: { text: string }) {
  return (
    <blockquote style={{ borderLeft: `4px solid ${COLORS.gold}`, padding: '14px 22px', margin: '32px 0', background: COLORS.goldPale, borderRadius: '0 8px 8px 0' }}>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: COLORS.navy, lineHeight: 1.55, fontStyle: 'italic', margin: 0 }}>{text}</p>
    </blockquote>
  )
}
