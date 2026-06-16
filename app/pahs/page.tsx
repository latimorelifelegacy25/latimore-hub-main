'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import './pahs.css'
import './pahs-override.css'

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

export default function PAHSPage() {
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

  function scrollToReview() {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    <main className="pahs-page" id="top">
      <section className="pahs-hero pahs-hero--sponsor-bg" aria-labelledby="pahs-hero-title">
        <div className="pahs-hero__bg" />
        <div className="pahs-shell pahs-hero__grid">
          <div className="pahs-hero__copy">
            <p className="pahs-kicker">PAHS Protect · Pottsville Football 2026</p>
            <h1 id="pahs-hero-title">Protect What You Play For</h1>
            <p className="pahs-hero__lead">
              Latimore Life &amp; Legacy LLC is proud to support PAHS Football and help Coal Region families review protection before life forces the conversation.
            </p>

            <div className="pahs-hero__actions" aria-label="Primary actions">
              <button type="button" onClick={scrollToReview} className="pahs-button pahs-button--primary">
                Start Free Protection Review
              </button>
              <a className="pahs-button pahs-button--ghost" href="tel:17176152613">
                Call 717-615-2613
              </a>
            </div>

            <div className="pahs-trust-strip" aria-label="Campaign details">
              <span>Scan QR</span>
              <span>2-minute request</span>
              <span>Local follow-up</span>
            </div>
          </div>

          <aside className="pahs-hero__card" aria-label="PAHS Protect campaign card">
            <img src="/pahs-protect-go-card.png" alt="PAHS Protect and Go football campaign card" />
            <p>Proud PAHS Football sponsor. Community visibility with a real protection gateway.</p>
          </aside>
        </div>
      </section>

      <section className="pahs-then pahs-then--priority" id="story">
        <div className="pahs-then-inner">
          <div className="section-label gold-label">PAHS Then</div>
          <h2 className="pahs-story-title">Where the Journey Began</h2>
          <p className="pahs-story-copy">
            From Cardinal Brennan football to serving Coal Region families today, this campaign is full circle: protect the people, homes, income, and future behind every jersey.
          </p>
          <img
            src="/pahs-2005-allarea.png"
            alt="2005 Coal Region All-Area Football — Throwback Tide Thursday: Where the Journey Began"
            className="pahs-then-image"
          />
        </div>
      </section>

      <section className="campaign-videos">
        <div className="campaign-videos-inner">
          <div className="section-label gold-label">Campaign Videos</div>
          <h2 className="campaign-videos-title">Watch the Campaign</h2>
          <div className="videos-grid single">
            <div className="video-wrap">
              <video
                src="/pahs-campaign-video.mp4"
                poster="/pahs-protect-go-card.png"
                controls
                playsInline
                preload="metadata"
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </div>
          </div>
          <p>
            The PAHS Protect campaign turns QR scans, Facebook traffic, Google Business Profile visits, referrals, and DM PROTECT conversations into one clean path: free review request, CRM capture, and personal follow-up from Jackson.
          </p>
        </div>
      </section>

      <section className="spgfx">
        <img src="/pahs-free-consult.png" alt="Free Consultation — Proud Sponsor of Pottsville Area Crimson Tide" />
      </section>

      <section className="pahs-review" ref={sectionRef} id="intakeFormSection" aria-labelledby="pahs-review-title">
        <div className="pahs-shell pahs-review__grid">
          <div className="pahs-review__content">
            <p className="pahs-kicker">Free protection review</p>
            <h2 id="pahs-review-title">Know where your family stands.</h2>
            <p>
              Use this page after scanning the PAHS QR code. The form creates a New lead for follow-up and keeps the source tied to the PAHS Protect campaign.
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
                <a href="tel:17176152613">Need faster help? Call 717-615-2613.</a>
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
                    placeholder="(717) 615-2613"
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
              href="https://latimorelifelegacy.fillout.com/latimorelifelegacy"
              className="pahs-detail-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Prefer the detailed intake questionnaire?
            </a>
          </div>
        </div>
      </section>

      <footer className="pahs-footer">
        <div className="pahs-shell pahs-footer__grid">
          <div>
            <strong>Latimore Life &amp; Legacy LLC</strong>
            <span>Protecting Today. Securing Tomorrow.</span>
          </div>
          <div>
            <a href="tel:17176152613">717-615-2613</a>
            <a href="https://www.latimorelifelegacy.com">latimorelifelegacy.com</a>
          </div>
        </div>
      </footer>

      <div className="pahs-mobile-cta">
        <span>PAHS Protect Review</span>
        <button type="button" onClick={scrollToReview}>Start Now</button>
      </div>
    </main>
  )
}
