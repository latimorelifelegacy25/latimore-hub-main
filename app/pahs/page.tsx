'use client'

import { FormEvent, useRef, useState } from 'react'
import './pahs.css'

type LeadForm = {
  name: string
  phone: string
  email: string
  promo: string
  interest: string
}

const initialLead: LeadForm = {
  name: '',
  phone: '',
  email: '',
  promo: '',
  interest: '',
}

export default function PAHSPage() {
  const [lead, setLead] = useState<LeadForm>(initialLead)
  const [leadStatus, setLeadStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [leadError, setLeadError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function updateLead<K extends keyof LeadForm>(field: K, value: LeadForm[K]) {
    setLead((current) => ({ ...current, [field]: value }))
  }

  function normalizeLead(data: LeadForm): LeadForm {
    return {
      name: data.name.trim(),
      phone: data.phone.replace(/\D/g, ''), // keep digits only
      email: data.email.trim().toLowerCase(),
      promo: data.promo.trim(),
      interest: data.interest,
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
          source: 'PAHS Protect & Go Football Landing Page',
          page: 'app/pahs',
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

      // scroll to success state (mobile UX win)
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    } catch (error) {
      setLeadStatus('error')
      setLeadError(error instanceof Error ? error.message : 'Lead submission failed.')

      // bring error into view
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <main className="pahs-v2 pahs-protect-flow">
      {/* ---------- VIDEO SECTION ---------- */}
      <section className="pahs-open" id="top">
        <div className="pahs-open-bg" />

        <div className="pahs-brand-pill">
          <strong>LATIMORE</strong>
          <span>LIFE &amp; LEGACY LLC</span>
        </div>

        <section className="pahs-video-stage">
          <div className="pahs-section-kicker">Campaign Video</div>
          <h1>Watch the Campaign</h1>

          <video
            className="pahs-campaign-video"
            src="/pahs-campaign-video.mp4"
            controls
            playsInline
            preload="metadata"
            poster="/pahs-protect-go-card.png"
          />
        </section>
      </section>

      {/* ---------- FORM SECTION ---------- */}
      <section className="pahs-football-section">
        <div className="pahs-section-wrap narrow">
          <img
            src="/pahs-protect-go-card.png"
            alt="PAHS Protect & Go football sponsorship card"
            className="pahs-football-card"
          />

          <div className="pahs-partner-line">
            Official Protection Partner · Crimson Tide ’26
          </div>

          <section
            ref={formRef}
            className="pahs-lead-card"
            id="intakeFormSection"
          >
            <h2>Protect Your Family Today</h2>
            <p>
              Get a free protection review — income, debt &amp; family security. Takes 2 minutes.
            </p>

            {leadStatus === 'success' ? (
              <div className="pahs-success-box">
                <strong>Request received.</strong>
                <span>Jackson will follow up soon.</span>
              </div>
            ) : (
              <form className="pahs-lead-form" onSubmit={submitLead}>
                <label>
                  Full Name *
                  <input
                    value={lead.name}
                    onChange={(e) => updateLead('name', e.target.value)}
                    placeholder="John Doe"
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
                    placeholder="(555) 555-5555"
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
                    placeholder="john@example.com"
                    autoComplete="email"
                  />
                </label>

                <label>
                  Coupon / Promo Code
                  <input
                    value={lead.promo}
                    onChange={(e) => updateLead('promo', e.target.value)}
                    placeholder="e.g. ID#2777749"
                  />
                </label>

                <label>
                  What are you most interested in? *
                  <select
                    value={lead.interest}
                    onChange={(e) => updateLead('interest', e.target.value)}
                    required
                  >
                    <option value="" disabled>Select an option...</option>
                    <option>Income Protection</option>
                    <option>Debt Protection</option>
                    <option>Family Security</option>
                    <option>Life Insurance &amp; Living Benefits</option>
                    <option>Retirement &amp; Annuities</option>
                    <option>Mortgage Protection</option>
                    <option>General Financial Review</option>
                  </select>
                </label>

                <button type="submit" disabled={leadStatus === 'submitting'}>
                  {leadStatus === 'submitting' ? 'Submitting…' : 'Request My Free Review'}
                </button>

                {leadStatus === 'error' && (
                  <div className="pahs-error-box">
                    {leadError}
                  </div>
                )}
              </form>
            )}

            <a
              href="https://latimorelifelegacy.fillout.com/latimorelifelegacy"
              className="pahs-detail-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Prefer our detailed intake questionnaire? Click here.
            </a>
          </section>

          <a href="#intakeFormSection" className="pahs-main-cta">
            Start My Free Protection Review
          </a>
        </div>
      </section>

      {/* ---------- MOBILE CTA ---------- */}
      <div className="pahs-mobile-cta">
        <span>Free Protection Review</span>
        <a href="#intakeFormSection">Start Now</a>
      </div>
    </main>
  )
}
