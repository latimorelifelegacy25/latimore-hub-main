'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Save } from 'lucide-react'
import { COLORS } from '@/lib/brand'
import { trackLatimoreEvent } from '@/lib/tracking/client-events'

type PfrState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  state: string
  maritalStatus: string
  spouseName: string
  ageRange: string
  occupation: string
  hasChildren: boolean
  childrenAges: string
  monthlyIncome: string
  monthlyExpenses: string
  emergencyFund: string
  emergencyFundMonths: string
  marketAssets: string
  debt: string
  mortgageBalance: string
  educationGoal: string
  hasLifeInsurance: boolean
  lifeInsuranceSource: string
  coverageAmount: string
  premiumAmount: string
  premiumFrequency: string
  policyType: string
  hasLivingBenefits: boolean
  hasLtc: boolean
  hasEmployerRetirement: boolean
  retirementPlanTypes: string[]
  retirementBalance: string
  retirementContribution: string
  contributionFrequency: string
  hasCompanyMatch: boolean
  companyMatchDetails: string
  hasOutsideRetirement: boolean
  taxStatus: string
  minMonthlySavings: string
  maxMonthlySavings: string
  savingForChildren: boolean
  additionalIncomeInterest: boolean
  selectedPriorities: string[]
  topPriorityWhy: string
}

const initial: PfrState = {
  firstName: '', lastName: '', email: '', phone: '', state: 'PA', maritalStatus: '', spouseName: '', ageRange: '', occupation: '',
  hasChildren: false, childrenAges: '', monthlyIncome: '', monthlyExpenses: '', emergencyFund: '', emergencyFundMonths: '', marketAssets: '', debt: '', mortgageBalance: '', educationGoal: '',
  hasLifeInsurance: false, lifeInsuranceSource: '', coverageAmount: '', premiumAmount: '', premiumFrequency: '', policyType: '', hasLivingBenefits: false, hasLtc: false,
  hasEmployerRetirement: false, retirementPlanTypes: [], retirementBalance: '', retirementContribution: '', contributionFrequency: '', hasCompanyMatch: false, companyMatchDetails: '', hasOutsideRetirement: false,
  taxStatus: '', minMonthlySavings: '', maxMonthlySavings: '', savingForChildren: false, additionalIncomeInterest: false,
  selectedPriorities: [], topPriorityWhy: '',
}

const sections = ['Client', 'Family', 'Cash Flow', 'Protection', 'Retirement', 'Priorities'] as const

const priorities = [
  ['life_insurance', 'Life Protection'],
  ['mortgage_protection', 'Mortgage Protection'],
  ['asset_protection', 'Asset Protection'],
  ['debt_management', 'Debt Management'],
  ['college_funding', 'College Funding'],
  ['estate_planning', 'Estate & Legacy Planning'],
  ['tax_advantage', 'Tax-Efficient Planning Education'],
  ['business_owner_strategies', 'Business Owner Strategies'],
] as const

function n(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.inkMuted }}>{label}</span>{children}</label>
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#C9A25F]'

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between rounded-xl border p-4 text-left" style={{ borderColor: checked ? COLORS.gold : 'rgba(255,255,255,.10)', background: checked ? 'rgba(201,162,95,.10)' : 'rgba(0,0,0,.12)' }}>
      <span className="text-sm font-bold text-white/80">{label}</span>
      <span className="rounded-full px-2.5 py-1 text-xs font-black" style={{ background: checked ? COLORS.gold : 'rgba(255,255,255,.08)', color: checked ? COLORS.navyDeep : COLORS.inkMuted }}>{checked ? 'YES' : 'NO'}</span>
    </button>
  )
}

export default function PfrPage() {
  const [form, setForm] = useState<PfrState>(initial)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void trackLatimoreEvent({ action: 'tool_started', tool: 'personal_financial_review', category: 'Client Discovery' })
  }, [])

  const monthlyIncome = Number(form.monthlyIncome || 0)
  const monthlyExpenses = Number(form.monthlyExpenses || 0)
  const savingsCapacity = Math.max(0, monthlyIncome - monthlyExpenses)
  const protectionNeed = Math.max(0, Number(form.debt || 0) + monthlyIncome * 12 * 10 + Number(form.mortgageBalance || 0) + Number(form.educationGoal || 0) - Number(form.coverageAmount || 0))

  const canFinish = useMemo(() => Boolean(form.firstName && form.lastName && form.email), [form.firstName, form.lastName, form.email])

  function update<K extends keyof PfrState>(key: K, value: PfrState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function togglePriority(value: string) {
    setForm((current) => {
      const has = current.selectedPriorities.includes(value)
      const next = has ? current.selectedPriorities.filter((item) => item !== value) : [...current.selectedPriorities, value].slice(0, 3)
      return { ...current, selectedPriorities: next }
    })
  }

  function next() {
    const currentSection = sections[step]
    void trackLatimoreEvent({ action: 'tool_step_completed', tool: 'personal_financial_review', category: 'Client Discovery', step: currentSection })
    setStep((current) => Math.min(sections.length - 1, current + 1))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canFinish) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey: 'client',
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          state: form.state || null,
          selectedPriorities: form.selectedPriorities,
          topPriorityWhy: form.topPriorityWhy || null,
          maritalStatus: form.maritalStatus || null,
          spouseName: form.spouseName || null,
          ageRange: form.ageRange || null,
          hasChildren: form.hasChildren,
          childrenAges: form.childrenAges || null,
          occupation: form.occupation || null,
          monthlyIncome: n(form.monthlyIncome),
          monthlyExpenses: n(form.monthlyExpenses),
          emergencyFund: n(form.emergencyFund),
          marketAssets: n(form.marketAssets),
          hasEmergencyFund: Number(form.emergencyFund || 0) > 0,
          emergencyFundMonths: n(form.emergencyFundMonths),
          debt: n(form.debt),
          mortgageBalance: n(form.mortgageBalance),
          educationGoal: n(form.educationGoal),
          hasLifeInsurance: form.hasLifeInsurance,
          lifeInsuranceSource: form.lifeInsuranceSource || null,
          coverageAmount: n(form.coverageAmount),
          premiumAmount: n(form.premiumAmount),
          premiumFrequency: form.premiumFrequency || null,
          policyType: form.policyType || null,
          hasLivingBenefits: form.hasLivingBenefits,
          hasLtc: form.hasLtc,
          hasEmployerRetirement: form.hasEmployerRetirement,
          retirementPlanTypes: form.retirementPlanTypes,
          retirementBalance: n(form.retirementBalance),
          retirementContribution: n(form.retirementContribution),
          contributionFrequency: form.contributionFrequency || null,
          hasCompanyMatch: form.hasCompanyMatch,
          companyMatchDetails: form.companyMatchDetails || null,
          hasOutsideRetirement: form.hasOutsideRetirement,
          taxStatus: form.taxStatus || null,
          minMonthlySavings: n(form.minMonthlySavings),
          maxMonthlySavings: n(form.maxMonthlySavings),
          savingForChildren: form.savingForChildren,
          additionalIncomeInterest: form.additionalIncomeInterest,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok || !payload?.leadId) throw new Error(payload?.error?.message || 'PFR could not be saved')
      setSavedLeadId(String(payload.leadId))
      void trackLatimoreEvent({
        action: 'tool_completed',
        tool: 'personal_financial_review',
        category: 'Client Discovery',
        resultBand: form.selectedPriorities.length >= 2 ? 'multiple_priorities' : form.selectedPriorities.length === 1 ? 'single_priority' : 'general_review',
        metadata: { priorityCount: form.selectedPriorities.length },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PFR could not be saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: COLORS.gold }}>Latimore Advisor OS</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Personal Financial Review</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: COLORS.inkMuted }}>Structured discovery, protection gap, retirement context, priorities, and persistent Supabase intake records in one workspace.</p>
        </div>
        <Link href="/admin/advisor" className="text-sm font-bold no-underline" style={{ color: COLORS.goldLight }}>← Advisor Workspace</Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-6">
        {sections.map((section, index) => (
          <button key={section} type="button" onClick={() => setStep(index)} className="rounded-xl border px-3 py-3 text-xs font-black" style={{ borderColor: step === index ? COLORS.gold : 'rgba(255,255,255,.10)', background: step === index ? 'rgba(201,162,95,.10)' : 'rgba(255,255,255,.025)', color: step === index ? COLORS.goldLight : COLORS.inkMuted }}>
            {index + 1}. {section}
          </button>
        ))}
      </div>

      {savedLeadId ? (
        <div className="rounded-2xl border p-6" style={{ borderColor: 'rgba(34,197,94,.35)', background: 'rgba(34,197,94,.07)' }}>
          <div className="flex items-center gap-3 text-emerald-300"><CheckCircle2 size={22} /><h2 className="text-xl font-black">PFR saved</h2></div>
          <p className="mt-2 text-sm text-white/70">The intake has been written to the Latimore data system. Lead ID: <span className="font-mono text-white">{savedLeadId}</span></p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/admin/crm/hub" className="rounded-xl px-5 py-3 text-sm font-black no-underline" style={{ background: COLORS.gold, color: COLORS.navyDeep }}>Open Life Hub CRM</Link>
            <button onClick={() => { setSavedLeadId(null); setForm(initial); setStep(0) }} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/75">Start Another Review</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl p-2.5" style={{ background: 'rgba(201,162,95,.12)', color: COLORS.goldLight }}><ClipboardList size={20} /></div>
              <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.inkMuted }}>Section {step + 1} of {sections.length}</p><h2 className="text-xl font-black text-white">{sections[step]}</h2></div>
            </div>

            {step === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="First name"><input required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className={inputClass} /></Field>
                <Field label="Last name"><input required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className={inputClass} /></Field>
                <Field label="Email"><input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} /></Field>
                <Field label="Phone"><input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} /></Field>
                <Field label="State"><input value={form.state} onChange={(e) => update('state', e.target.value)} className={inputClass} /></Field>
                <Field label="Occupation"><input value={form.occupation} onChange={(e) => update('occupation', e.target.value)} className={inputClass} /></Field>
                <Field label="Age range"><select value={form.ageRange} onChange={(e) => update('ageRange', e.target.value)} className={inputClass}><option value="">Select</option><option>18-29</option><option>30-39</option><option>40-49</option><option>50-59</option><option>60-69</option><option>70+</option></select></Field>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Marital status"><select value={form.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value)} className={inputClass}><option value="">Select</option><option>Single</option><option>Married</option><option>Partnered</option><option>Divorced</option><option>Widowed</option></select></Field>
                <Field label="Spouse / partner name"><input value={form.spouseName} onChange={(e) => update('spouseName', e.target.value)} className={inputClass} /></Field>
                <Toggle label="Children / dependents" checked={form.hasChildren} onChange={(v) => update('hasChildren', v)} />
                <Toggle label="Saving for children" checked={form.savingForChildren} onChange={(v) => update('savingForChildren', v)} />
                <div className="md:col-span-2"><Field label="Children / dependent ages"><input value={form.childrenAges} onChange={(e) => update('childrenAges', e.target.value)} className={inputClass} placeholder="Example: 4, 8, 12" /></Field></div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Monthly household income"><input type="number" min="0" value={form.monthlyIncome} onChange={(e) => update('monthlyIncome', e.target.value)} className={inputClass} /></Field>
                <Field label="Monthly household expenses"><input type="number" min="0" value={form.monthlyExpenses} onChange={(e) => update('monthlyExpenses', e.target.value)} className={inputClass} /></Field>
                <Field label="Emergency fund"><input type="number" min="0" value={form.emergencyFund} onChange={(e) => update('emergencyFund', e.target.value)} className={inputClass} /></Field>
                <Field label="Emergency fund months"><input type="number" min="0" value={form.emergencyFundMonths} onChange={(e) => update('emergencyFundMonths', e.target.value)} className={inputClass} /></Field>
                <Field label="Market / liquid assets"><input type="number" min="0" value={form.marketAssets} onChange={(e) => update('marketAssets', e.target.value)} className={inputClass} /></Field>
                <Field label="Other debt"><input type="number" min="0" value={form.debt} onChange={(e) => update('debt', e.target.value)} className={inputClass} /></Field>
                <Field label="Mortgage balance"><input type="number" min="0" value={form.mortgageBalance} onChange={(e) => update('mortgageBalance', e.target.value)} className={inputClass} /></Field>
                <Field label="Education funding goal"><input type="number" min="0" value={form.educationGoal} onChange={(e) => update('educationGoal', e.target.value)} className={inputClass} /></Field>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Toggle label="Existing life protection" checked={form.hasLifeInsurance} onChange={(v) => update('hasLifeInsurance', v)} />
                <Toggle label="Living benefits included" checked={form.hasLivingBenefits} onChange={(v) => update('hasLivingBenefits', v)} />
                <Toggle label="Long-term care protection / provision" checked={form.hasLtc} onChange={(v) => update('hasLtc', v)} />
                <div />
                <Field label="Coverage source"><select value={form.lifeInsuranceSource} onChange={(e) => update('lifeInsuranceSource', e.target.value)} className={inputClass}><option value="">Select</option><option>Employer</option><option>Individually owned</option><option>Both</option><option>Not sure</option></select></Field>
                <Field label="Protection type"><select value={form.policyType} onChange={(e) => update('policyType', e.target.value)} className={inputClass}><option value="">Select</option><option>Term protection</option><option>Permanent protection</option><option>Combination / multiple policies</option><option>Not sure</option></select></Field>
                <Field label="Current total coverage"><input type="number" min="0" value={form.coverageAmount} onChange={(e) => update('coverageAmount', e.target.value)} className={inputClass} /></Field>
                <Field label="Current premium"><input type="number" min="0" value={form.premiumAmount} onChange={(e) => update('premiumAmount', e.target.value)} className={inputClass} /></Field>
                <Field label="Premium frequency"><select value={form.premiumFrequency} onChange={(e) => update('premiumFrequency', e.target.value)} className={inputClass}><option value="">Select</option><option>Monthly</option><option>Quarterly</option><option>Semiannual</option><option>Annual</option></select></Field>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Toggle label="Employer retirement plan" checked={form.hasEmployerRetirement} onChange={(v) => update('hasEmployerRetirement', v)} />
                <Toggle label="Outside retirement assets" checked={form.hasOutsideRetirement} onChange={(v) => update('hasOutsideRetirement', v)} />
                <Toggle label="Employer match" checked={form.hasCompanyMatch} onChange={(v) => update('hasCompanyMatch', v)} />
                <Toggle label="Interested in additional retirement income education" checked={form.additionalIncomeInterest} onChange={(v) => update('additionalIncomeInterest', v)} />
                <Field label="Retirement balance"><input type="number" min="0" value={form.retirementBalance} onChange={(e) => update('retirementBalance', e.target.value)} className={inputClass} /></Field>
                <Field label="Current contribution"><input type="number" min="0" value={form.retirementContribution} onChange={(e) => update('retirementContribution', e.target.value)} className={inputClass} /></Field>
                <Field label="Contribution frequency"><select value={form.contributionFrequency} onChange={(e) => update('contributionFrequency', e.target.value)} className={inputClass}><option value="">Select</option><option>Per paycheck</option><option>Monthly</option><option>Quarterly</option><option>Annual</option></select></Field>
                <Field label="Employer match details"><input value={form.companyMatchDetails} onChange={(e) => update('companyMatchDetails', e.target.value)} className={inputClass} /></Field>
                <Field label="Tax filing status"><select value={form.taxStatus} onChange={(e) => update('taxStatus', e.target.value)} className={inputClass}><option value="">Select</option><option>Single</option><option>Married filing jointly</option><option>Married filing separately</option><option>Head of household</option><option>Not sure</option></select></Field>
                <Field label="Comfortable monthly savings range"><div className="grid grid-cols-2 gap-2"><input type="number" min="0" value={form.minMonthlySavings} onChange={(e) => update('minMonthlySavings', e.target.value)} placeholder="Min" className={inputClass} /><input type="number" min="0" value={form.maxMonthlySavings} onChange={(e) => update('maxMonthlySavings', e.target.value)} placeholder="Max" className={inputClass} /></div></Field>
              </div>
            ) : null}

            {step === 5 ? (
              <div>
                <p className="text-sm leading-6 text-white/70">Select up to three client priorities. These are planning categories—not carrier or proprietary product selections.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {priorities.map(([value, label]) => {
                    const active = form.selectedPriorities.includes(value)
                    return <button key={value} type="button" onClick={() => togglePriority(value)} className="rounded-xl border p-4 text-left text-sm font-bold" style={{ borderColor: active ? COLORS.gold : 'rgba(255,255,255,.10)', background: active ? 'rgba(201,162,95,.10)' : 'rgba(0,0,0,.12)', color: active ? COLORS.goldLight : 'rgba(255,255,255,.78)' }}>{active ? '✓ ' : ''}{label}</button>
                  })}
                </div>
                <div className="mt-5"><Field label="Why is the top priority important right now?"><textarea rows={5} value={form.topPriorityWhy} onChange={(e) => update('topPriorityWhy', e.target.value)} className={inputClass} /></Field></div>
              </div>
            ) : null}

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
              <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70 disabled:opacity-30"><ArrowLeft size={15} /> Previous</button>
              {step < sections.length - 1 ? (
                <button type="button" onClick={next} className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black" style={{ background: COLORS.gold, color: COLORS.navyDeep }}>Next <ArrowRight size={15} /></button>
              ) : (
                <button type="submit" disabled={saving || !canFinish} className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black disabled:opacity-40" style={{ background: COLORS.gold, color: COLORS.navyDeep }}><Save size={15} /> {saving ? 'Saving…' : 'Save PFR'}</button>
              )}
            </div>
            {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.inkMuted }}>Discovery snapshot</p>
              <div className="mt-4 space-y-4">
                <div><p className="text-xs" style={{ color: COLORS.inkMuted }}>Monthly margin</p><p className="mt-1 text-2xl font-black" style={{ color: COLORS.goldLight }}>${savingsCapacity.toLocaleString()}</p></div>
                <div><p className="text-xs" style={{ color: COLORS.inkMuted }}>Educational protection gap</p><p className="mt-1 text-2xl font-black" style={{ color: COLORS.goldLight }}>${protectionNeed.toLocaleString()}</p></div>
                <div><p className="text-xs" style={{ color: COLORS.inkMuted }}>Priorities selected</p><p className="mt-1 text-2xl font-black text-white">{form.selectedPriorities.length}/3</p></div>
              </div>
              <p className="mt-4 text-xs leading-5" style={{ color: COLORS.inkMuted }}>The protection-gap figure is a simple educational DIME-style estimate and not a recommendation or quote.</p>
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(201,162,95,.22)', background: 'rgba(201,162,95,.06)' }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLORS.goldLight }}>Tracking standard</p>
              <p className="mt-2 text-xs leading-5 text-white/70">Section completion and workflow outcomes are tracked. Client income, assets, health answers, and other sensitive values are not placed in analytics events.</p>
            </div>
          </aside>
        </form>
      )}
    </div>
  )
}
