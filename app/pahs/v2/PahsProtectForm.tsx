'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const COVERAGE_OPTIONS = [
  { value: "Protect my family's income", icon: '🛡️', label: "Protect my family's income", sub: 'Life & living benefits' },
  { value: 'Pay off my home if something happens', icon: '🏠', label: 'Pay off my home if something happens', sub: 'Mortgage protection' },
  { value: 'Plan for retirement', icon: '📈', label: 'Plan for retirement', sub: 'Annuities & IUL' },
  { value: "Protect my kids' future", icon: '👶', label: "Protect my kids' future", sub: 'Juvenile IUL & whole life' },
  { value: 'Not sure — show me my options', icon: '💡', label: 'Not sure — just show me my options', sub: '', wide: true },
]

const TIME_OPTIONS = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Weekends', 'Anytime']

const SCHEDULE = [
  { date: 'Sep 5', opponent: 'Minersville', home: true },
  { date: 'Sep 12', opponent: 'Mahanoy Area', home: false },
  { date: 'Sep 19', opponent: 'Tamaqua', home: true },
  { date: 'Sep 26', opponent: 'North Schuylkill', home: false },
  { date: 'Oct 3', opponent: 'Jim Thorpe', home: true },
  { date: 'Oct 10', opponent: 'Shenandoah Valley', home: false },
  { date: 'Oct 17', opponent: 'Nativity BVM', home: true },
  { date: 'Oct 24', opponent: 'Tri-Valley', home: false },
]

const STEP_LABELS: Record<number, string> = {
  1: 'Step 1 of 3 — What do you need help with?',
  2: 'Step 2 of 3 — Best time to reach you?',
  3: 'Step 3 of 3 — Almost done!',
}

export default function PahsProtectForm() {
  const [step, setStep] = useState(1)
  const [coverage, setCoverage] = useState('')
  const [bestTime, setBestTime] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [utm, setUtm] = useState({ source: 'PAHSsign', medium: 'organic', campaign: 'allsponsor' })

  // ── UTM capture + QR scan tracking ──────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('utm_source') || 'PAHSsign'
    const medium = params.get('utm_medium') || 'organic'
    const campaign = params.get('utm_campaign') || 'allsponsor'
    setUtm({ source, medium, campaign })

    if (params.get('utm_medium') === 'qr' || params.get('utm_source')) {
      window.gtag?.('event', 'qr_scan', {
        event_category: 'acquisition',
        event_label: campaign,
        utm_source: source,
        utm_campaign: campaign,
      })
    }
  }, [])

  function goToStep(target: number) {
    setStep(target)
    setTimeout(() => {
      document.getElementById('pahs-review-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
  }

  function selectCoverage(value: string) {
    setCoverage(value)
    setErrors((e) => ({ ...e, 1: '' }))
    window.gtag?.('event', 'coverage_selected', { event_category: 'form', event_label: value })
    setTimeout(() => goToStep(2), 280)
  }

  function selectTime(value: string) {
    setBestTime(value)
    setErrors((e) => ({ ...e, 2: '' }))
    setTimeout(() => goToStep(3), 280)
  }

  async function submitForm() {
    const fName = firstName.trim()
    const lName = lastName.trim()
    const phoneVal = phone.trim()
    const emailVal = email.trim()

    if (!fName || !lName || !phoneVal || !emailVal) {
      setErrors((e) => ({ ...e, 3: 'Please fill in all required fields.' }))
      return
    }
    if (!emailVal.includes('@')) {
      setErrors((e) => ({ ...e, 3: 'Please enter a valid email address.' }))
      return
    }
    setErrors((e) => ({ ...e, 3: '' }))
    setSubmitting(true)

    try {
      await fetch('/api/pahs-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${fName} ${lName}`,
          phone: phoneVal,
          email: emailVal,
          interest: coverage,
          bestTime,
          source: 'PAHS Protect What You Play For Landing Page',
          page: 'app/pahs/v2',
          utmSource: utm.source,
          utmMedium: utm.medium,
          utmCampaign: utm.campaign,
        }),
      })
    } catch (err) {
      console.warn('[pahs-v2] lead submission error', err)
    }

    window.gtag?.('event', 'pahs_lead_submitted', {
      event_category: 'conversion',
      event_label: coverage,
      utm_source: utm.source,
      utm_campaign: utm.campaign,
    })

    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => {
      document.getElementById('pahs-review-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function downloadVCard() {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Jackson M. Latimore Sr.',
      'ORG:Latimore Life & Legacy LLC',
      'TITLE:Licensed Life, Health, Accident & Annuities',
      'TEL;TYPE=CELL,VOICE:(717) 615-2613',
      'EMAIL:jackson1989@latimorelegacy.com',
      'URL:https://www.latimorelifelegacy.com',
      'NOTE:Protecting Today. Securing Tomorrow. #TheBeatGoesOn',
      'END:VCARD',
    ].join('\r\n')
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Jackson-Latimore.vcf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    window.gtag?.('event', 'vcard_downloaded', { event_category: 'engagement' })
  }

  async function shareReview() {
    const shareUrl = 'https://www.latimorelifelegacy.com/pahs/v2?utm_source=share&utm_medium=organic&utm_campaign=allsponsor'
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Free Protection Review — Latimore Life & Legacy',
          text: 'Jackson Latimore offers free protection reviews for Schuylkill County families.',
          url: shareUrl,
        })
      } catch {
        // user cancelled share — no action needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied! Share it with a friend.')
      } catch {
        prompt('Copy this link:', shareUrl)
      }
    }
  }

  return (
    <div className="pwyp-page">
      {/* ── HERO ── */}
      <section className="pwyp-hero" id="top">
        <div className="pwyp-flyer-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="PAHS Crimson Tide Football 2026" src="/pahs-v2/season-kickoff.jpg" />
        </div>
        <div className="pwyp-content">
          {/* Logo */}
          <div className="pwyp-logo-bar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Latimore Life & Legacy" src="/pahs-latimore-logo.png" />
            <div className="pwyp-brand-text">Latimore Life &amp; Legacy</div>
          </div>

          {/* Sponsor badge */}
          <div className="pwyp-sponsor-badge">★ Official Protection Partner · PAHS 2026 ★</div>

          {/* Sponsor card */}
          <div className="pwyp-flyer-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Free Consultation — Sponsored by Latimore Life & Legacy" src="/pahs-v2/sponsor-flyer.png" />
          </div>

          {/* Hero headline */}
          <div className="pwyp-hero-headline">
            <h1>
              Protect What
              <span>You Play For</span>
            </h1>
            <p className="pwyp-sub">
              <strong>Jackson Latimore</strong> is a Pottsville local, a Crimson Tide supporter, and a licensed
              protection specialist. Your free review takes 60 seconds.
            </p>
            <div className="pwyp-time-badge">⚡ 60 seconds &nbsp;·&nbsp; No pressure &nbsp;·&nbsp; No sales pitch</div>
          </div>

          {/* Why Jackson trust block */}
          <div className="pwyp-why-jackson">
            <div className="pwyp-wj-title">Why Jackson?</div>
            <ul>
              <li>Born and raised in the Coal Region — this is home</li>
              <li>AED survivor — protection is personal, not just professional</li>
              <li>No obligation, no pressure, ever</li>
            </ul>
          </div>

          {/* ── MULTI-STEP FORM ── */}
          <div className="pwyp-form-card" id="pahs-review-form">
            {!success && (
              <>
                <div className="pwyp-form-header">
                  <h2>Get Your Free Protection Review</h2>
                  <p>3 quick questions · Jackson follows up within 24 hours</p>
                  <div className="pwyp-form-meta">
                    <span>🔒 Never sold or shared</span>
                    <span>📞 Real follow-up</span>
                  </div>
                </div>

                <div className="pwyp-step-indicator">
                  <div className={`pwyp-step-dot ${step === 1 ? 'pwyp-active' : step > 1 ? 'pwyp-done' : ''}`}>1</div>
                  <div className={`pwyp-step-line ${step > 1 ? 'pwyp-done' : ''}`} />
                  <div className={`pwyp-step-dot ${step === 2 ? 'pwyp-active' : step > 2 ? 'pwyp-done' : ''}`}>2</div>
                  <div className={`pwyp-step-line ${step > 2 ? 'pwyp-done' : ''}`} />
                  <div className={`pwyp-step-dot ${step === 3 ? 'pwyp-active' : ''}`}>3</div>
                </div>
                <div className="pwyp-step-label">{STEP_LABELS[step]}</div>
              </>
            )}

            {/* ── STEP 1: Coverage interest ── */}
            <div className={`pwyp-step-panel ${step === 1 ? 'pwyp-active' : ''}`}>
              <div className="pwyp-coverage-grid">
                {COVERAGE_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={`pwyp-coverage-opt ${opt.wide ? 'pwyp-coverage-opt-wide' : ''} ${coverage === opt.value ? 'pwyp-selected' : ''}`}
                    onClick={() => selectCoverage(opt.value)}
                  >
                    <div className="pwyp-co-icon">{opt.icon}</div>
                    <div className="pwyp-co-label">{opt.label}</div>
                    {opt.sub && <div className="pwyp-co-sub">{opt.sub}</div>}
                  </div>
                ))}
              </div>
              <div className={`pwyp-error-msg ${errors[1] ? 'pwyp-visible' : ''}`}>Please select an option to continue.</div>
            </div>

            {/* ── STEP 2: Best time ── */}
            <div className={`pwyp-step-panel ${step === 2 ? 'pwyp-active' : ''}`}>
              <div className="pwyp-time-grid">
                {TIME_OPTIONS.map((opt) => (
                  <div
                    key={opt}
                    className={`pwyp-time-opt ${bestTime === opt ? 'pwyp-selected' : ''}`}
                    onClick={() => selectTime(opt)}
                  >
                    {opt}
                  </div>
                ))}
              </div>
              <button type="button" className="pwyp-btn-back" onClick={() => goToStep(1)}>← Back</button>
              <div className={`pwyp-error-msg ${errors[2] ? 'pwyp-visible' : ''}`}>Please select a time preference.</div>
            </div>

            {/* ── STEP 3: Contact info ── */}
            <div className={`pwyp-step-panel ${step === 3 && !success ? 'pwyp-active' : ''}`}>
              <div className="pwyp-form-row">
                <div className="pwyp-form-field">
                  <label>First Name *</label>
                  <input
                    autoComplete="given-name"
                    inputMode="text"
                    placeholder="First"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="pwyp-form-field">
                  <label>Last Name *</label>
                  <input
                    autoComplete="family-name"
                    inputMode="text"
                    placeholder="Last"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="pwyp-form-field">
                <label>Phone *</label>
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(570) 000-0000"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="pwyp-form-field">
                <label>Email *</label>
                <input
                  autoComplete="email"
                  inputMode="email"
                  placeholder="your@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="button" className="pwyp-btn-primary" disabled={submitting} onClick={submitForm}>
                {submitting ? 'Submitting…' : 'Get My Free Review →'}
              </button>
              <button type="button" className="pwyp-btn-back" onClick={() => goToStep(2)}>← Back</button>
              <div className="pwyp-privacy-note">🔒 Your information is never sold or shared. Ever.</div>
              <div className={`pwyp-error-msg ${errors[3] ? 'pwyp-visible' : ''}`}>{errors[3] || 'Please fill in all required fields.'}</div>
            </div>

            {/* ── SUCCESS STATE ── */}
            <div className={`pwyp-success-panel ${success ? 'pwyp-visible' : ''}`}>
              <div className="pwyp-check">✅</div>
              <h3>You&rsquo;re All Set, <span className="pwyp-success-name">{firstName}</span>!</h3>
              <p className="pwyp-success-sub">
                Jackson will call or text you within 24 hours.<br />
                <em>Protecting Today. Securing Tomorrow.</em>
              </p>
              <div className="pwyp-success-actions">
                <a className="pwyp-btn-call" href="tel:7176152613">📞 Call Jackson Now — (717) 615-2613</a>
                <a className="pwyp-btn-vcard" href="#" onClick={(e) => { e.preventDefault(); downloadVCard() }}>💾 Save Jackson&rsquo;s Contact</a>
                <a className="pwyp-btn-share" href="#" onClick={(e) => { e.preventDefault(); shareReview() }}>📤 Share With a Friend</a>
              </div>
              <div className="pwyp-hashtag-note">#TheBeatGoesOn</div>
            </div>
          </div>

          {/* Trust bar */}
          <div className="pwyp-trust-bar">
            <div className="pwyp-trust-item"><div className="pwyp-trust-dot" />Licensed PA</div>
            <div className="pwyp-trust-item"><div className="pwyp-trust-dot" />Coal Region Local</div>
            <div className="pwyp-trust-item"><div className="pwyp-trust-dot" />No Pressure</div>
            <div className="pwyp-trust-item"><div className="pwyp-trust-dot" />24hr Follow-Up</div>
          </div>
        </div>
      </section>

      {/* ── AED STORY BRIDGE ── */}
      <section className="pwyp-aed-section pwyp-fade-in">
        <div className="pwyp-aed-inner">
          <div className="pwyp-section-label">From the Court to the Community</div>
          <h2>
            Preparation Saved My Life.<br />
            <span>Now It Protects Yours.</span>
          </h2>
          <p>
            When Jackson Latimore collapsed on the basketball court at East Stroudsburg University, an AED was
            already in place. CPR was performed. He was taken to the hospital in stable condition.
          </p>
          <div className="pwyp-aed-quote">
            &ldquo;An AED saved my life because preparation was already in place. Latimore Life &amp; Legacy helps
            families build that same kind of preparation — financially.&rdquo;
          </div>
          <p>
            That same principle drives his mission today. Whether it&rsquo;s on the football field or in your
            family&rsquo;s finances, preparation has to come first — before life changes without warning.
          </p>
          <a className="pwyp-aed-cta" href="#pahs-review-form">Protect What You Play For →</a>
        </div>
      </section>

      {/* ── PAHS SCHEDULE ── */}
      <section className="pwyp-schedule-section pwyp-fade-in">
        <div className="pwyp-schedule-inner">
          <div className="pwyp-section-label" style={{ color: '#C49A6C' }}>2026 Season</div>
          <h2>Crimson Tide Schedule</h2>
          <table className="pwyp-schedule-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opponent</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map((game) => (
                <tr key={game.date}>
                  <td>{game.date}</td>
                  <td>{game.opponent}</td>
                  <td>
                    <span className={game.home ? 'pwyp-home-badge' : 'pwyp-away-badge'}>
                      {game.home ? 'HOME' : 'AWAY'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pwyp-schedule-cta">
            <a href="#pahs-review-form">Start Your Protection Review Before Game Day →</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pwyp-footer">
        <div className="pwyp-footer-name">Jackson M. Latimore Sr.</div>
        <div className="pwyp-footer-title">Licensed Life, Health, Accident &amp; Annuities · Pennsylvania</div>
        <div className="pwyp-footer-links">
          <a href="tel:7176152613">(717) 615-2613</a>
          <a href="mailto:jackson1989@latimorelegacy.com">jackson1989@latimorelegacy.com</a>
          <a href="https://www.latimorelifelegacy.com" rel="noopener" target="_blank">latimorelifelegacy.com</a>
        </div>
        <div className="pwyp-footer-lic">
          Latimore Life &amp; Legacy LLC · Branch of Global Financial Impact<br />
          Serving Schuylkill County &amp; Central Pennsylvania<br />
          Protecting Today. Securing Tomorrow. #TheBeatGoesOn
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA ── */}
      <div className="pwyp-sticky-cta">
        <div className="pwyp-sticky-text">
          <strong>Free Protection Review</strong>
          Jackson follows up in 24hrs
        </div>
        <div className="pwyp-sticky-btns">
          <a className="pwyp-sticky-btn-call" href="tel:7176152613">Call</a>
          <a className="pwyp-sticky-btn-review" href="#pahs-review-form">Get Review</a>
        </div>
      </div>
    </div>
  )
}
