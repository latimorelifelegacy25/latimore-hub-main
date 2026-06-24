'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type FormData = {
  fullName: string; phone: string; email: string; cityState: string; bestContactMethod: string; bestContactTime: string
  interestReason: string; lookingFor: string[]; selfDescription: string; licenseStatus: string; licensesHeld: string[]; priorExperience: string; experienceDescription: string
  incomeGoal: string; hoursPerWeek: string; comfortLevel: number; willingToTrain: string; motivation: string; values: string[]; mentorshipNeeds: string
  availableForCall: string; preferredCallTime: string; questions: string; consentAccepted: boolean
  leadSessionId: string; pageUrl: string; referrer: string; source: string; medium: string; campaign: string
}

const navy = '#0E1A2B'
const gold = '#C9A24D'
const initialForm: FormData = {
  fullName: '', phone: '', email: '', cityState: '', bestContactMethod: '', bestContactTime: '',
  interestReason: '', lookingFor: [], selfDescription: '', licenseStatus: '', licensesHeld: [], priorExperience: '', experienceDescription: '',
  incomeGoal: '', hoursPerWeek: '', comfortLevel: 3, willingToTrain: '', motivation: '', values: [], mentorshipNeeds: '',
  availableForCall: '', preferredCallTime: '', questions: '', consentAccepted: false,
  leadSessionId: '', pageUrl: '', referrer: '', source: '', medium: '', campaign: '',
}

const steps = ['Contact Information', 'Your Interest', 'Licensing & Experience', 'Goals & Fit', 'Team Culture', 'Final Questions + Consent']

export default function JoinFormSection() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const stored = window.localStorage.getItem('lead_session_id')
    const leadSessionId = stored || window.crypto.randomUUID()
    window.localStorage.setItem('lead_session_id', leadSessionId)
    setForm((prev) => ({
      ...prev,
      pageUrl: window.location.href,
      referrer: document.referrer || '',
      source: params.get('utm_source') || 'website',
      medium: params.get('utm_medium') || 'join',
      campaign: params.get('utm_campaign') || 'join-team',
      leadSessionId,
    }))
  }, [])

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step])
  function update<K extends keyof FormData>(key: K, value: FormData[K]) { setForm((prev) => ({ ...prev, [key]: value })) }
  function toggle(key: 'lookingFor' | 'licensesHeld' | 'values', value: string) {
    setForm((prev) => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value] }))
  }

  function validateCurrentStep() {
    const requiredByStep: Array<[keyof FormData, string][]> = [
      [['fullName', 'full name'], ['phone', 'phone number'], ['email', 'email address'], ['bestContactMethod', 'best contact method'], ['bestContactTime', 'best contact time']],
      [['interestReason', 'what made you interested'], ['selfDescription', 'which phrase best describes you']],
      [['licenseStatus', 'licensing status']],
      [['incomeGoal', 'income goal'], ['hoursPerWeek', 'hours per week'], ['willingToTrain', 'willingness to train']],
      [],
      [['availableForCall', 'availability for an intro call']],
    ]
    for (const [key, label] of requiredByStep[step]) {
      if (!String(form[key] ?? '').trim()) return `Please complete ${label}.`
    }
    if (step === 5 && !form.consentAccepted) return 'Please accept the consent checkbox before submitting.'
    return ''
  }

  function nextStep() {
    const message = validateCurrentStep()
    if (message) { setError(message); return }
    setError(''); setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    const message = validateCurrentStep()
    if (message) { setError(message); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Submission failed')
      setSuccess(true)
    } catch (err: any) { setError(err?.message || 'Something went wrong. Please try again.') } finally { setSubmitting(false) }
  }

  if (success) return <ThankYou />

  return (
    <section id="apply" style={{ padding: '4rem 0', background: '#f9fafb' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ color: gold, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>Join Our Team Interest Form</p>
          <h2 style={{ color: navy, fontSize: 'clamp(1.7rem,3vw,2.4rem)', margin: 0 }}>Take the first step.</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 'clamp(1rem,4vw,2rem)', boxShadow: '0 14px 40px rgba(15,53,85,.10)' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#475467', fontSize: '.9rem', marginBottom: 8 }}><strong style={{ color: navy }}>Step {step + 1}: {steps[step]}</strong><span>{progress}%</span></div>
            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', background: gold }} /></div>
          </div>
          {step === 0 && <Grid><Field label="Full Name *"><Input value={form.fullName} onChange={(v) => update('fullName', v)} /></Field><Field label="Phone Number *"><Input value={form.phone} onChange={(v) => update('phone', v)} /></Field><Field label="Email Address *"><Input type="email" value={form.email} onChange={(v) => update('email', v)} /></Field><Field label="City / State"><Input value={form.cityState} onChange={(v) => update('cityState', v)} /></Field><Field label="Best Way to Contact You *"><Select value={form.bestContactMethod} onChange={(v) => update('bestContactMethod', v)} options={['Call', 'Text', 'Email']} /></Field><Field label="Best Time to Contact You *"><Select value={form.bestContactTime} onChange={(v) => update('bestContactTime', v)} options={['Morning', 'Afternoon', 'Evening', 'Weekend']} /></Field></Grid>}
          {step === 1 && <Stack><Field label="What made you interested? *"><Textarea value={form.interestReason} onChange={(v) => update('interestReason', v)} /></Field><Checkboxes label="What are you looking for most right now?" values={['More income', 'Purpose-driven work', 'Flexible schedule', 'Mentorship', 'Personal growth']} selected={form.lookingFor} onToggle={(v) => toggle('lookingFor', v)} /><Field label="Which phrase best describes you? *"><Select value={form.selfDescription} onChange={(v) => update('selfDescription', v)} options={['Driven self-starter', 'People-first helper', 'Career changer', 'Experienced professional', 'Exploring options']} /></Field></Stack>}
          {step === 2 && <Stack><Field label="Licensing status *"><Select value={form.licenseStatus} onChange={(v) => update('licenseStatus', v)} options={['Not licensed yet', 'Studying / in process', 'Licensed life insurance agent', 'Licensed in multiple lines']} /></Field><Checkboxes label="Licenses currently held" values={['Life', 'Health', 'Annuities', 'Securities', 'None yet']} selected={form.licensesHeld} onToggle={(v) => toggle('licensesHeld', v)} /><Field label="Prior experience"><Select value={form.priorExperience} onChange={(v) => update('priorExperience', v)} options={['None', 'Sales', 'Insurance', 'Financial services', 'Customer service', 'Leadership / coaching']} /></Field><Field label="Experience description"><Textarea value={form.experienceDescription} onChange={(v) => update('experienceDescription', v)} rows={3} /></Field></Stack>}
          {step === 3 && <Stack><Grid><Field label="Income goal *"><Select value={form.incomeGoal} onChange={(v) => update('incomeGoal', v)} options={['Extra monthly income', '$25k-$50k', '$50k-$100k', '$100k+', 'Not sure yet']} /></Field><Field label="Hours per week *"><Select value={form.hoursPerWeek} onChange={(v) => update('hoursPerWeek', v)} options={['1-5', '6-10', '11-20', '21-30', '30+']} /></Field></Grid><Field label={`Comfort level talking with families (${form.comfortLevel}/5)`}><input type="range" min="1" max="5" value={form.comfortLevel} onChange={(e) => update('comfortLevel', Number(e.target.value))} style={{ width: '100%' }} /></Field><Field label="Willing to train and follow compliance? *"><Select value={form.willingToTrain} onChange={(v) => update('willingToTrain', v)} options={['Yes', 'I have questions first', 'Not sure']} /></Field><Field label="Motivation"><Textarea value={form.motivation} onChange={(v) => update('motivation', v)} /></Field></Stack>}
          {step === 4 && <Stack><Checkboxes label="Values that matter to you" values={['Faith and family', 'Service', 'Integrity', 'Growth', 'Community impact', 'Legacy']} selected={form.values} onToggle={(v) => toggle('values', v)} /><Field label="What mentorship or support would help you most?"><Textarea value={form.mentorshipNeeds} onChange={(v) => update('mentorshipNeeds', v)} /></Field></Stack>}
          {step === 5 && <Stack><Field label="Available for an intro call? *"><Select value={form.availableForCall} onChange={(v) => update('availableForCall', v)} options={['Yes, this week', 'Yes, next week', 'I need a few options', 'Not yet']} /></Field><Field label="Preferred call date/time"><Input value={form.preferredCallTime} onChange={(v) => update('preferredCallTime', v)} /></Field><Field label="Questions before connecting"><Textarea value={form.questions} onChange={(v) => update('questions', v)} /></Field><label style={{ display: 'flex', gap: 10, color: '#475467', lineHeight: 1.5 }}><input type="checkbox" checked={form.consentAccepted} onChange={(e) => update('consentAccepted', e.target.checked)} /> <span>I consent to Latimore Life & Legacy LLC contacting me by phone, text, or email about joining the team. I understand this is an interest form and not an employment contract.</span></label></Stack>}
          {error && <div style={{ marginTop: 18, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', color: '#991b1b' }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 26 }}><button type="button" onClick={() => { setError(''); setStep((s) => Math.max(0, s - 1)) }} disabled={step === 0} style={secondaryButton}>Back</button>{step < steps.length - 1 ? <button type="button" onClick={nextStep} style={primaryButton}>Next</button> : <button type="submit" disabled={submitting} style={{ ...primaryButton, opacity: submitting ? .65 : 1 }}>{submitting ? 'Submitting...' : 'Submit My Interest'}</button>}</div>
        </form>
      </div>
    </section>
  )
}

function ThankYou() { return <section id="apply" style={{ padding: '4rem 0', background: '#f9fafb' }}><div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}><div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 'clamp(1.5rem,5vw,3rem)', boxShadow: '0 14px 40px rgba(15,53,85,.10)', textAlign: 'center' }}><p style={{ color: gold, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.14em' }}>Thank You</p><h2 style={{ color: navy, fontSize: 'clamp(1.8rem,3vw,2.5rem)', margin: '0 0 16px' }}>Thank you for your interest in joining Latimore Life & Legacy LLC.</h2><p style={{ color: '#475467', lineHeight: 1.7, maxWidth: '68ch', margin: '0 auto 1rem' }}>Your information has been received. The next step is a short introductory conversation to learn more about your goals, answer your questions, and see whether this opportunity is a good fit.</p><p style={{ color: navy, fontWeight: 800 }}>Protect families. Secure futures. Build legacies.<br /><span style={{ color: gold }}>#TheBeatGoesOn</span></p><div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24 }}><Link href="/book?utm_source=join_success&utm_medium=website&utm_campaign=join-team" style={primaryButton}>Schedule Intro Call</Link><a href="https://card.latimorelifelegacy.com" style={secondaryButton}>Visit My Digital Card</a><Link href="/" style={secondaryButton}>Return to Website</Link></div></div></div></section> }
function Grid({ children }: { children: React.ReactNode }) { return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>{children}</div> }
function Stack({ children }: { children: React.ReactNode }) { return <div style={{ display: 'grid', gap: 18 }}>{children}</div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: 'block' }}><span style={{ display: 'block', marginBottom: 6, color: '#475467', fontWeight: 700, fontSize: '.9rem' }}>{label}</span>{children}</label> }
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: '1rem' }
function Input({ value, onChange, type = 'text' }: { value: string; onChange: (v: string) => void; type?: string }) { return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} /> }
function Textarea({ value, onChange, rows = 4 }: { value: string; onChange: (v: string) => void; rows?: number }) { return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} style={{ ...inputStyle, resize: 'vertical' }} /> }
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) { return <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}><option value="">Select</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select> }
function Checkboxes({ label, values, selected, onToggle }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) { return <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ color: '#475467', fontWeight: 700, fontSize: '.9rem', marginBottom: 8 }}>{label}</legend><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>{values.map((value) => <label key={value} style={{ border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 12px', color: navy }}><input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} /> {value}</label>)}</div></fieldset> }
const primaryButton = { display: 'inline-block', background: gold, color: navy, padding: '12px 22px', borderRadius: 999, fontWeight: 800, textDecoration: 'none', border: 'none', cursor: 'pointer' }
const secondaryButton = { display: 'inline-block', background: '#fff', color: navy, padding: '12px 22px', borderRadius: 999, fontWeight: 800, textDecoration: 'none', border: '1px solid #d1d5db', cursor: 'pointer' }
