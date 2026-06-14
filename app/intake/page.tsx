'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND, COLORS } from '@/lib/brand'

const PRIORITIES = [
  ['tax_advantage', 'Tax Advantage Strategies'],
  ['asset_protection', 'Asset Protection'],
  ['college_funding', 'College Funding'],
  ['debt_management', 'Debt Management'],
  ['infinite_banking', 'Infinite Banking'],
  ['life_insurance', 'Life Insurance'],
  ['estate_planning', 'Estate Planning'],
  ['indexed_growth', 'Indexed Growth Strategies'],
  ['mortgage_protection', 'Mortgage Protection'],
  ['business_owner_strategies', 'Business Owner Strategies'],
]

const STATES = ['PA', 'NJ', 'NY', 'DE', 'MD', 'OH', 'WV', 'VA', 'Other']
const YES_NO = [{ label: 'Yes', value: true }, { label: 'No', value: false }]

const initialData: Record<string, any> = {
  journey: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  state: 'PA',
  familyNotes: '',
  occupation: '',
  recreationNotes: '',
  motivationNotes: '',
  hasChildren: null,
  childrenAges: '',
  hasEmployerRetirement: null,
  hasOutsideRetirement: null,
  hasLifeInsurance: null,
  hasLivingBenefits: null,
  hasLtc: null,
  savingForChildren: null,
  additionalIncomeInterest: null,
  selectedPriorities: [],
  topPriorityWhy: '',
  monthlyIncome: '',
  monthlyExpenses: '',
  minMonthlySavings: '',
  maxMonthlySavings: '',
  hasEmergencyFund: null,
  emergencyFundMonths: '',
  emergencyFund: '',
  marketAssets: '',
  debt: '',
  mortgageBalance: '',
  educationGoal: '',
  coverageAmount: '',
  premiumAmount: '',
}

export default function IntakePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState(initialData)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const progress = useMemo(() => Math.round((step / 5) * 100), [step])

  function update(key: string, value: any) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  function togglePriority(value: string) {
    const current = data.selectedPriorities as string[]
    if (current.includes(value)) update('selectedPriorities', current.filter(v => v !== value))
    else if (current.length < 3) update('selectedPriorities', [...current, value])
  }

  function validateCurrentStep() {
    if (step === 1 && !data.journey) return 'Choose a path so Jackson knows how to prepare.'
    if (step === 2 && (!data.firstName || !data.lastName || !data.email)) return 'First name, last name, and email are required.'
    return ''
  }

  async function next() {
    const issue = validateCurrentStep()
    if (issue) { setError(issue); return }
    setError('')
    setStep(s => Math.min(s + 1, 5))
  }

  async function submit() {
    const issue = validateCurrentStep()
    if (issue) { setError(issue); return }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await response.json()
      if (!response.ok || !json.ok) throw new Error(json.error || 'Submission failed.')
      router.push(`/intake/results/${json.leadId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyHero} 100%)`, color: '#fff', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <p style={{ color: COLORS.goldLight, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '.08em', margin: 0 }}>{BRAND.tagline}</p>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', lineHeight: 1.05, margin: '0.75rem 0 1rem' }}>Protection & Legacy Intake</h1>
          <p style={{ maxWidth: 720, color: 'rgba(255,255,255,.86)', fontSize: '1.1rem', lineHeight: 1.7, margin: 0 }}>Answer once. Jackson gets the context before the conversation. Your CRM gets the lead, score, protection gap, priorities, and booking trail.</p>
        </div>
      </section>

      <section style={{ maxWidth: 920, margin: '-2rem auto 0', padding: '0 1rem 4rem' }}>
        <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 24, boxShadow: '0 18px 45px rgba(15,23,42,.12)', overflow: 'hidden' }}>
          <div style={{ background: '#fff', padding: '1.2rem 1.35rem', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ color: COLORS.navy }}>Step {step} of 5</strong>
              <span style={{ color: COLORS.gray500, fontSize: '.9rem' }}>{progress}% complete</span>
            </div>
            <div style={{ background: COLORS.gray100, borderRadius: 999, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, background: COLORS.gold, height: '100%' }} />
            </div>
          </div>

          <div style={{ padding: '1.35rem' }}>
            {step === 1 && <JourneyStep data={data} update={update} />}
            {step === 2 && <ContactStep data={data} update={update} />}
            {step === 3 && <FormStep data={data} update={update} />}
            {step === 4 && <DiscoveryStep data={data} update={update} togglePriority={togglePriority} />}
            {step === 5 && <NumbersStep data={data} update={update} />}

            {error && <p style={{ background: '#fef2f2', color: '#991b1b', padding: '0.85rem 1rem', borderRadius: 14, marginTop: '1rem', fontWeight: 700 }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: '1.5rem' }}>
              {step > 1 ? <button type="button" onClick={() => setStep(s => Math.max(s - 1, 1))} style={secondaryBtn}>Back</button> : <span />}
              {step < 5 ? <button type="button" onClick={next} style={primaryBtn}>Continue</button> : <button type="button" disabled={submitting} onClick={submit} style={primaryBtn}>{submitting ? 'Submitting...' : 'See My Results'}</button>}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function JourneyStep({ data, update }: any) {
  return <Panel title="Which path fits you today?" subtitle="This sets the context for your review.">
    <Choice selected={data.journey === 'client'} onClick={() => update('journey', 'client')} title="Client" body="Family protection, life insurance, retirement, savings, and legacy planning." />
    <Choice selected={data.journey === 'business_partner'} onClick={() => update('journey', 'business_partner')} title="Business Partner" body="Explore building with Jackson professionally." />
    <Choice selected={data.journey === 'both'} onClick={() => update('journey', 'both')} title="Both" body="Review my own plan and learn about the business opportunity." />
  </Panel>
}

function ContactStep({ data, update }: any) {
  return <Panel title="Contact details" subtitle="Used only so Jackson can follow up with context.">
    <Grid><Input label="First name" value={data.firstName} onChange={(v: string) => update('firstName', v)} /><Input label="Last name" value={data.lastName} onChange={(v: string) => update('lastName', v)} /></Grid>
    <Grid><Input label="Email" type="email" value={data.email} onChange={(v: string) => update('email', v)} /><Input label="Phone" type="tel" value={data.phone} onChange={(v: string) => update('phone', v)} /></Grid>
    <Field label="State"><select value={data.state} onChange={e => update('state', e.target.value)} style={inputStyle}>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
  </Panel>
}

function FormStep({ data, update }: any) {
  return <Panel title="F.O.R.M. trust builder" subtitle="Family, occupation, recreation, motivation.">
    <TextArea label="Family" value={data.familyNotes} onChange={(v: string) => update('familyNotes', v)} />
    <Grid><Input label="Occupation" value={data.occupation} onChange={(v: string) => update('occupation', v)} /><Input label="Children ages" value={data.childrenAges} onChange={(v: string) => update('childrenAges', v)} /></Grid>
    <TextArea label="Recreation" value={data.recreationNotes} onChange={(v: string) => update('recreationNotes', v)} />
    <TextArea label="Motivation" value={data.motivationNotes} onChange={(v: string) => update('motivationNotes', v)} />
  </Panel>
}

function DiscoveryStep({ data, update, togglePriority }: any) {
  return <Panel title="Protection discovery" subtitle="Select what applies. No wrong answers.">
    <Bool label="Have children?" value={data.hasChildren} onChange={(v: boolean) => update('hasChildren', v)} />
    <Bool label="Employer retirement plan?" value={data.hasEmployerRetirement} onChange={(v: boolean) => update('hasEmployerRetirement', v)} />
    <Bool label="Outside retirement accounts?" value={data.hasOutsideRetirement} onChange={(v: boolean) => update('hasOutsideRetirement', v)} />
    <Bool label="Current life insurance?" value={data.hasLifeInsurance} onChange={(v: boolean) => update('hasLifeInsurance', v)} />
    <Bool label="Living benefits riders?" value={data.hasLivingBenefits} onChange={(v: boolean) => update('hasLivingBenefits', v)} />
    <Bool label="Long-term care coverage?" value={data.hasLtc} onChange={(v: boolean) => update('hasLtc', v)} />
    <Bool label="Saving for children’s future?" value={data.savingForChildren} onChange={(v: boolean) => update('savingForChildren', v)} />
    <Bool label="Interested in additional income strategies?" value={data.additionalIncomeInterest} onChange={(v: boolean) => update('additionalIncomeInterest', v)} />
    <h3 style={{ color: COLORS.navy, marginTop: '1.2rem' }}>Top priorities — choose up to 3</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 }}>{PRIORITIES.map(([value, label]) => <button key={value} type="button" onClick={() => togglePriority(value)} style={data.selectedPriorities.includes(value) ? activeChip : chip}>{label}</button>)}</div>
    {data.selectedPriorities.length > 0 && <TextArea label="Why is your top priority important?" value={data.topPriorityWhy} onChange={(v: string) => update('topPriorityWhy', v)} />}
  </Panel>
}

function NumbersStep({ data, update }: any) {
  return <Panel title="Numbers snapshot" subtitle="Approximate is fine. This powers the DIME gap and advisor score.">
    <Grid><Input label="Monthly income" type="number" value={data.monthlyIncome} onChange={(v: string) => update('monthlyIncome', v)} /><Input label="Monthly expenses" type="number" value={data.monthlyExpenses} onChange={(v: string) => update('monthlyExpenses', v)} /></Grid>
    <Grid><Input label="Minimum monthly savings" type="number" value={data.minMonthlySavings} onChange={(v: string) => update('minMonthlySavings', v)} /><Input label="Maximum monthly savings" type="number" value={data.maxMonthlySavings} onChange={(v: string) => update('maxMonthlySavings', v)} /></Grid>
    <Bool label="Emergency fund?" value={data.hasEmergencyFund} onChange={(v: boolean) => update('hasEmergencyFund', v)} />
    <Grid><Input label="Emergency fund months" type="number" value={data.emergencyFundMonths} onChange={(v: string) => update('emergencyFundMonths', v)} /><Input label="Emergency fund amount" type="number" value={data.emergencyFund} onChange={(v: string) => update('emergencyFund', v)} /></Grid>
    <Grid><Input label="Market assets" type="number" value={data.marketAssets} onChange={(v: string) => update('marketAssets', v)} /><Input label="Current life coverage" type="number" value={data.coverageAmount} onChange={(v: string) => update('coverageAmount', v)} /></Grid>
    <Grid><Input label="Debt excluding mortgage" type="number" value={data.debt} onChange={(v: string) => update('debt', v)} /><Input label="Mortgage balance" type="number" value={data.mortgageBalance} onChange={(v: string) => update('mortgageBalance', v)} /></Grid>
    <Input label="Future education goal" type="number" value={data.educationGoal} onChange={(v: string) => update('educationGoal', v)} />
  </Panel>
}

function Panel({ title, subtitle, children }: any) { return <div><h2 style={{ color: COLORS.navy, fontSize: '1.45rem', margin: 0 }}>{title}</h2><p style={{ color: COLORS.gray600, lineHeight: 1.6, marginTop: 6 }}>{subtitle}</p><div style={{ display: 'grid', gap: 14 }}>{children}</div></div> }
function Grid({ children }: any) { return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>{children}</div> }
function Field({ label, children }: any) { return <label style={{ display: 'grid', gap: 6, color: COLORS.navy, fontWeight: 700 }}>{label}{children}</label> }
function Input({ label, value, onChange, type = 'text' }: any) { return <Field label={label}><input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} /></Field> }
function TextArea({ label, value, onChange }: any) { return <Field label={label}><textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></Field> }
function Bool({ label, value, onChange }: any) { return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '0.9rem 1rem' }}><strong style={{ color: COLORS.navy }}>{label}</strong><div style={{ display: 'flex', gap: 8 }}>{YES_NO.map(o => <button key={o.label} type="button" onClick={() => onChange(o.value)} style={value === o.value ? activeSmall : smallBtn}>{o.label}</button>)}</div></div> }
function Choice({ selected, onClick, title, body }: any) { return <button type="button" onClick={onClick} style={selected ? selectedChoice : choice}><strong>{title}</strong><span style={{ display: 'block', marginTop: 4, color: selected ? COLORS.navy : COLORS.gray600 }}>{body}</span></button> }

const inputStyle: React.CSSProperties = { width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '0.8rem .9rem', fontSize: '1rem', color: COLORS.navy, background: '#fff' }
const primaryBtn: React.CSSProperties = { background: COLORS.gold, color: COLORS.navy, border: 0, borderRadius: 999, padding: '0.85rem 1.25rem', fontWeight: 900, cursor: 'pointer' }
const secondaryBtn: React.CSSProperties = { background: '#fff', color: COLORS.navy, border: `1px solid ${COLORS.border}`, borderRadius: 999, padding: '0.85rem 1.25rem', fontWeight: 800, cursor: 'pointer' }
const choice: React.CSSProperties = { textAlign: 'left', border: `1px solid ${COLORS.border}`, background: '#fff', color: COLORS.navy, borderRadius: 16, padding: '1rem', cursor: 'pointer' }
const selectedChoice: React.CSSProperties = { ...choice, borderColor: COLORS.gold, background: COLORS.goldPale, boxShadow: '0 0 0 3px rgba(201,162,95,.16)' }
const chip: React.CSSProperties = { border: `1px solid ${COLORS.border}`, background: '#fff', color: COLORS.navy, borderRadius: 999, padding: '.7rem .85rem', cursor: 'pointer', fontWeight: 700 }
const activeChip: React.CSSProperties = { ...chip, borderColor: COLORS.gold, background: COLORS.goldPale }
const smallBtn: React.CSSProperties = { border: `1px solid ${COLORS.border}`, background: '#fff', color: COLORS.navy, borderRadius: 999, padding: '.4rem .7rem', cursor: 'pointer', fontWeight: 800 }
const activeSmall: React.CSSProperties = { ...smallBtn, background: COLORS.gold, borderColor: COLORS.gold }
