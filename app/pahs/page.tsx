'use client'

import { FormEvent, useState } from 'react'
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

  function updateLead<K extends keyof LeadForm>(field: K, value: LeadForm[K]) {
    setLead((current) => ({ ...current, [field]: value }))
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLeadStatus('submitting')
    setLeadError('')

    try {
      const response = await fetch('/api/pahs-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          source: 'PAHS Protect & Go Football Landing Page',
          page: 'app/pahs',
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result?.ok === false) {
        throw new Error(result?.error || 'Lead submission failed.')
      }

      setLead(initialLead)
      setLeadStatus('success')
    } catch (error) {
      setLeadStatus('error')
      setLeadError(error instanceof Error ? error.message : 'Lead submission failed.')
    }
  }

  return (
    <main className="pahs-v2 pahs-protect-flow">
      <section className="pahs-open" id="top">
        <div className="pahs-open-bg" />

        <div className="pahs-brand-pill" aria-label="Latimore Life and Legacy LLC">
          <strong>LATIMORE</strong>
          <span>LIFE &amp; LEGACY LLC</span>
        </div>

        <section className="pahs-video-stage" aria-labelledby="campaign-video-title">
          <div className="pahs-section-kicker">Campaign Video</div>
          <h1 id="campaign-video-title">Watch the Campaign</h1>

          <video
            className="pahs-campaign-video"
            src="/pahs-campaign-video.mp4"
            poster="/pahs-newspaper-clip.png"
            controls
            playsInline
            preload="metadata"
          />
        </section>
      </section>

      <section className="pahs-newspaper-section" aria-labelledby="newspaper-title">
        <div className="pahs-section-wrap">
          <div className="pahs-section-kicker dark">The Story</div>
          <h2 id="newspaper-title">The Larger Clip</h2>
          <p className="pahs-section-copy">
            The campaign opens with the story, then moves families directly into a simple protection review.
          </p>

          <img
            className="pahs-newspaper-image"
            src="/pahs-newspaper-clip.png"
            alt="PAHS campaign newspaper-style clip"
          />
        </div>
      </section>

      <section className="pahs-football-section" aria-labelledby="protection-title">
        <div className="pahs-section-wrap narrow">
          <img
            className="pahs-football-card"
            src="/pahs-protect-go-card.png"
            alt="Protect and Go Pottsville Area Crimson Tide 2026 official protection partner card"
          />

          <div className="pahs-partner-line">Official Protection Partner · Crimson Tide ’26</div>

          <section className="pahs-lead-card" id="intakeFormSection" aria-labelledby="protection-title">
            <h2 id="protection-title">Protect Your Family Today</h2>
            <p>
              Get a free protection review — income, debt &amp; family security. Takes 2 minutes.
            </p>

            {leadStatus === 'success' ? (
              <div className="pahs-success-box" role="status">
                <strong>Request received.</strong>
                <span>Jackson will follow up soon.</span>
              </div>
            ) : (
              <form className="pahs-lead-form" onSubmit={submitLead}>
                <label>
                  Full Name *
                  <input
                    value={lead.name}
                    onChange={(event) => updateLead('name', event.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </label>

                <label>
                  Phone Number *
                  <input
                    value={lead.phone}
                    onChange={(event) => updateLead('phone', event.target.value)}
                    placeholder="(555) 555-5555"
                    required
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    value={lead.email}
                    onChange={(event) => updateLead('email', event.target.value)}
                    placeholder="john@example.com"
                  />
                </label>

                <label>
                  Coupon / Promo Code
                  <input
                    value={lead.promo}
                    onChange={(event) => updateLead('promo', event.target.value)}
                    placeholder="e.g. ID#2777749"
                  />
                </label>

                <label>
                  What are you most interested in? *
                  <select
                    value={lead.interest}
                    onChange={(event) => updateLead('interest', event.target.value)}
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
                  {leadStatus === 'submitting' ? 'Submitting...' : 'Request My Free Review'}
                </button>

                {leadStatus === 'error' && <div className="pahs-error-box">{leadError}</div>}
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

          <a className="pahs-main-cta" href="#intakeFormSection">
            Start My Free Protection Review
          </a>
        </div>
      </section>

      <div className="pahs-mobile-cta">
        <span>Free Protection Review</span>
        <a href="#intakeFormSection">Start Now</a>
      </div>
    </main>
  )
}
