'use client'

import { BRAND } from '@/lib/brand'
import { ensureLeadSessionId } from '@/lib/lead'
import { FormEvent, useEffect, useRef, useState } from 'react'

type LeadForm = {
  name: string
  phone: string
  email: string
  promo: string
  interest: string
  bestTime: string
}

type Tracking = {
  utmSource: string
  utmMedium: string
  utmCampaign: string
}

const initialLead: LeadForm = {
  name: '',
  phone: '',
  email: '',
  promo: '',
  interest: '',
  bestTime: '',
}

const defaultTracking: Tracking = {
  utmSource: 'pahs_qr',
  utmMedium: 'qr_code',
  utmCampaign: 'pahs_protect',
}

const reviewItems = [
  'Income replacement',
  'Mortgage and debt protection',
  'Life insurance and living benefits',
  'Retirement income and annuity questions',
]

export default function PahsLeadForm() {
  const [lead, setLead] = useState<LeadForm>(initialLead)
  const [tracking, setTracking] = useState<Tracking>(defaultTracking)
  const [leadStatus, setLeadStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [leadError, setLeadError] = useState('')
  const formRef = useRef<HTMLFormElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setTracking({
      utmSource: params.get('utm_source') || defaultTracking.utmSource,
      utmMedium: params.get('utm_medium') || defaultTracking.utmMedium,
      utmCampaign: params.get('utm_campaign') || defaultTracking.utmCampaign,
    })
  }, [])

  function updateLead<K extends keyof LeadForm>(field: K, value: LeadForm[K]) {
    setLead((current) => ({ ...current, [field]: value }))
  }

  function normalizeLead(data: LeadForm): LeadForm {
    return {
      name: data.name.trim(),
      phone: data.phone.replace(/\D/g, ''),
      email: data.email.trim().toLowerCase(),
      promo: data.promo.trim(),
      interest: data.interest,
      bestTime: data.bestTime,
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLeadStatus('submitting')
    setLeadError('')

    const cleanLead = normalizeLead(lead)

    try {
      const response = await fetch('/api/pahs-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cleanLead,
          source: 'PAHS_QR',
          page: '/pahs',
          bestTime: cleanLead.bestTime,
          leadSessionId: ensureLeadSessionId(),
          utmSource: tracking.utmSource,
          utmMedium: tracking.utmMedium,
          utmCampaign: tracking.utmCampaign,
        }),
      })

      let result: any = {}
      try {
        result = await response.json()
      } catch {
        result = {}
      }

      if (!response.ok || result?.ok === false) {
        throw new Error(result?.error || 'Lead submission failed.')
      }

      setLead(initialLead)
      setLeadStatus('success')
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch (error) {
      setLeadStatus('error')
      setLeadError(error instanceof Error ? error.message : 'Lead submission failed.')
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <section className="pahs-review" ref={sectionRef} id="intakeFormSection" aria-labelledby="pahs-review-title">
      <div className="pahs-shell pahs-review__grid">
        <div className="pahs-review__content">
          <p className="pahs-kicker">Free protection review</p>
          <h2 id="pahs-review-title">Know where your family stands.</h2>
          <p>
            Request a free review of your family’s protection needs. Jackson will follow up personally to discuss your priorities and next steps.
          </p>

          <div className="pahs-checklist" aria-label="Review topics">
            {reviewItems.map((item) => (
              <div className="pahs-check" key={item}>
                <span aria-hidden="true">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="pahs-lead-card">
          {leadStatus === 'success' ? (
            <div className="pahs-success-box" role="status">
              <strong>Request received.</strong>
              <span>Jackson will follow up directly. Your PAHS Protect review is now in the pipeline.</span>
              <a href="tel:15709001977">Need faster help? Call 570-900-1977.</a>
            </div>
          ) : (
            <form ref={formRef} className="pahs-lead-form" onSubmit={submitLead}>
              <div className="pahs-form-header">
                <h3>Request My Free Review</h3>
                <p>No pressure. Just a clear review of your protection gaps and next best steps.</p>
              </div>

              <label>
                Full Name *
                <input
                  value={lead.name}
                  onChange={(e) => updateLead('name', e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Phone Number *
                <input
                  type="tel"
                  inputMode="tel"
                  value={lead.phone}
                  onChange={(e) => updateLead('phone', e.target.value)}
                  placeholder="(570) 900-1977"
                  autoComplete="tel"
                  required
                />
              </label>

              <label>
                Email Address
                <input
                  type="email"
                  value={lead.email}
                  onChange={(e) => updateLead('email', e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              <label>
                Main Concern *
                <select
                  value={lead.interest}
                  onChange={(e) => updateLead('interest', e.target.value)}
                  required
                >
                  <option value="" disabled>Select one...</option>
                  <option>Income Protection</option>
                  <option>Mortgage Protection</option>
                  <option>Family Security</option>
                  <option>Life Insurance &amp; Living Benefits</option>
                  <option>Retirement &amp; Annuities</option>
                  <option>Final Expense</option>
                  <option>General Protection Review</option>
                </select>
              </label>

              <label>
                Best Time To Contact
                <select value={lead.bestTime} onChange={(e) => updateLead('bestTime', e.target.value)}>
                  <option value="">No preference</option>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Text first</option>
                </select>
              </label>

              <label>
                Coupon / Promo Code
                <input
                  value={lead.promo}
                  onChange={(e) => updateLead('promo', e.target.value)}
                  placeholder="ID#2777749"
                />
              </label>

              <button type="submit" disabled={leadStatus === 'submitting'}>
                {leadStatus === 'submitting' ? 'Submitting…' : 'Submit Free Review Request'}
              </button>

              {leadStatus === 'error' && (
                <div className="pahs-error-box" role="alert">
                  {leadError}
                </div>
              )}

              <p className="pahs-disclaimer">
                Insurance products are subject to eligibility and underwriting. This review is educational and needs-based.
              </p>
            </form>
          )}

          <a
            href={BRAND.bookingUrl}
            className="pahs-detail-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Prefer the detailed intake questionnaire?
          </a>
        </div>
      </div>
    </section>
  )
}
