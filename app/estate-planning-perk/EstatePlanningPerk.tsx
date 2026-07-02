'use client'

import { useState } from 'react'
import { FileText, Landmark, PenLine, Loader2, LockOpen, Check, X, Calendar, Zap } from 'lucide-react'
import { BRAND, COLORS } from '@/lib/brand'
import { hydrateLeadContext } from '@/lib/lead'
import { trackLeadConversion } from '@/lib/tracking/client-conversions'

const GOLD = COLORS.gold
const NAVY = COLORS.navy

const STEPS = [
  {
    icon: FileText,
    title: 'Submit Verification Details',
    description: 'Enter your contact info securely below to activate the consultation pipeline.',
  },
  {
    icon: Calendar,
    title: 'Consultation & Match',
    description: "Jackson matches you with the ideal policy option for your legacy requirements.",
  },
  {
    icon: PenLine,
    title: 'Unlock Estate Perk',
    description: 'Once active, access Will, Trust, and healthcare documentation builders from your console.',
  },
]

export default function EstatePlanningPerk() {
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function openModal() {
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setSuccess(false)
    setName('')
    setEmail('')
    setPhone('')
    setError('')
    setSubmitting(false)
  }

  async function submitLead() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill out all fields.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setSubmitting(true)

    const context = hydrateLeadContext()

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          coverage_interest: 'Estate Planning Perk',
          asset: 'estate-planning-perk',
          source: context.source ?? 'website_estate_perk',
          utm_source: context.source ?? undefined,
          utm_medium: context.medium ?? undefined,
          utm_campaign: context.campaign ?? undefined,
          utm_term: context.term ?? undefined,
          utm_content: context.content ?? undefined,
          leadSessionId: context.leadSessionId,
          pageUrl: context.pageUrl,
          referrer: context.referrer ?? undefined,
        }),
      })

      const result = await res.json().catch(() => null)
      if (!res.ok || !result?.ok) {
        throw new Error(result?.error || 'Submission failed.')
      }

      trackLeadConversion({ eventId: result.conversionEventId, source: context.source, campaign: context.campaign, formName: 'estate_planning_perk' })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: '#0B0F17', color: '#F0EDE8' }} className="min-h-screen">
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.07] bg-[#0B0F17]/95 px-6 py-3.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{ background: 'rgba(196,154,108,0.13)', borderColor: 'rgba(196,154,108,0.2)', color: GOLD }}
          >
            <Zap size={18} aria-hidden="true" />
          </div>
          <div>
            <div className="text-[13px] font-bold leading-tight">
              Latimore <span style={{ color: GOLD }}>Life &amp; Legacy</span> LLC
            </div>
            <div className="text-[10px] tracking-[0.04em] text-[#8A9BAE]">{BRAND.tagline}</div>
          </div>
        </div>
      </nav>

      <header
        className="border-b border-white/[0.07] px-6 py-16 text-center"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(44,62,80,0.6) 0%, transparent 70%)` }}
      >
        <p className="mb-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>
          <span className="h-px w-7 opacity-50" style={{ background: GOLD }} />
          Presented by {BRAND.advisor}
          <span className="h-px w-7 opacity-50" style={{ background: GOLD }} />
        </p>
        <h1 className="mb-4 text-[clamp(28px,5vw,44px)] font-normal leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
          One Policy.
          <br />
          <span style={{ color: GOLD }}>Complete Protection.</span>
        </h1>
        <p className="mx-auto mb-7 max-w-xl text-[15px] leading-relaxed text-[#8A9BAE]">
          Get your life insurance strategy and receive a complete estate planning bundle included at no extra cost.
          An $898 value. Yours for $0.
        </p>
        <div
          className="mx-auto mb-5 inline-flex items-center gap-2.5 rounded-xl border px-6 py-3.5"
          style={{ background: 'rgba(196,154,108,0.13)', borderColor: 'rgba(196,154,108,0.2)' }}
        >
          <div>
            <div className="text-xl font-bold text-[#4A5B6A] line-through">$898+</div>
            <div className="text-2xl font-bold" style={{ color: GOLD }}>
              $0
            </div>
          </div>
          <div className="text-left text-xs leading-snug text-[#8A9BAE]">
            Estate planning bundle
            <br />
            included with eligible policy
            <br />
            <span className="font-bold" style={{ color: GOLD }}>
              PA fully eligible ✓
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <span className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#131820] px-3 py-1.5 text-[11px] text-[#8A9BAE]">
            <FileText size={13} style={{ color: GOLD }} aria-hidden="true" /> Legal Will
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#131820] px-3 py-1.5 text-[11px] text-[#8A9BAE]">
            <Landmark size={13} style={{ color: GOLD }} aria-hidden="true" /> Living Trust
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#131820] px-3 py-1.5 text-[11px] text-[#8A9BAE]">
            <PenLine size={13} style={{ color: GOLD }} aria-hidden="true" /> Power of Attorney
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-16 overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-bold tracking-wide text-[#8A9BAE]">
                  Included Perks
                </th>
                <th className="rounded-t-xl px-4 py-3.5 text-center text-xs font-bold tracking-wide" style={{ background: NAVY, color: GOLD }}>
                  Jackson via Ethos
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wide text-[#8A9BAE]">
                  Traditional Attorney
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wide text-[#8A9BAE]">
                  Standard DIY Online
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.07]">
                <td className="px-4 py-3 text-sm font-semibold text-[#F0EDE8]">Bundle Cost</td>
                <td className="px-4 py-3 text-center" style={{ background: 'rgba(44,62,80,0.35)' }}>
                  <span className="text-xl font-bold" style={{ color: GOLD }}>
                    $0
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-[#8A9BAE]">$2,500+</td>
                <td className="px-4 py-3 text-center text-sm text-[#8A9BAE]">$499+</td>
              </tr>
              <tr className="border-b border-white/[0.07]">
                <td className="px-4 py-3 text-sm font-semibold text-[#F0EDE8]">Will, Trust, &amp; POA</td>
                <td className="px-4 py-3 text-center text-sm text-[#F0EDE8]" style={{ background: 'rgba(44,62,80,0.35)' }}>
                  Fully Included
                </td>
                <td className="px-4 py-3 text-center text-sm text-[#8A9BAE]">Billed Hourly</td>
                <td className="px-4 py-3 text-center text-sm text-[#8A9BAE]">Extra Upgrades Required</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="mb-8 text-center text-2xl font-normal" style={{ fontFamily: 'Georgia, serif' }}>
          How It Works
        </h2>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="flex flex-col gap-2.5 bg-[#131820] p-6">
                <span className="text-[11px] font-bold tracking-wide" style={{ color: GOLD }}>
                  STEP {String(i + 1).padStart(2, '0')}
                </span>
                <Icon size={26} style={{ color: GOLD }} aria-hidden="true" />
                <h3 className="text-[13px] font-bold text-[#F0EDE8]">{s.title}</h3>
                <p className="text-xs leading-relaxed text-[#8A9BAE]">{s.description}</p>
              </div>
            )
          })}
        </div>
      </main>

      <section
        className="border-t border-white/[0.07] px-6 py-16 text-center"
        style={{ background: `radial-gradient(ellipse 60% 80% at 50% 100%, rgba(44,62,80,0.45) 0%, transparent 70%)` }}
      >
        <h2 className="mb-3 text-2xl font-normal" style={{ fontFamily: 'Georgia, serif' }}>
          Protect Your Family&apos;s Entire Future.
        </h2>
        <p className="mx-auto mb-6 max-w-md text-sm text-[#8A9BAE]">
          Lock in your life insurance quote and secure your free, comprehensive estate planning package today.
        </p>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#C49A6C] px-6 py-3 text-[13px] font-bold text-white transition-colors hover:bg-[#D4B08A]"
        >
          <Zap size={15} aria-hidden="true" /> Get Free Proposal &amp; Estate Perk
        </button>
      </section>

      <footer className="border-t border-white/[0.07] px-6 py-8 text-center text-[11px] leading-[1.7] text-[#5A6B7A]">
        <p>
          <span style={{ color: GOLD }}>{BRAND.fullName}</span> · Independent Insurance Advisor ·{' '}
          {BRAND.affiliation}
          <br />
          PA License #{BRAND.paLicense} · NIPR #{BRAND.nipr} · {BRAND.counties.join(', ')} Counties, PA
          <br />
          Life insurance and annuity products are subject to underwriting approval. Insurance products are not
          deposits, not FDIC insured. For educational purposes only — not tax or legal advice.
        </p>
      </footer>

      {open ? (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 p-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="relative w-full max-w-md rounded-[18px] border border-[#C49A6C]/20 bg-[#131820] p-8">
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close dialog"
              className="absolute right-3.5 top-3.5 text-[#8A9BAE] transition-colors hover:text-white"
            >
              <X size={18} aria-hidden="true" />
            </button>

            {!success ? (
              <div>
                <h2 className="mb-2 text-xl font-normal" style={{ fontFamily: 'Georgia, serif' }}>
                  Unlock Your Estate Benefit
                </h2>
                <p className="mb-6 text-[13px] leading-relaxed text-[#8A9BAE]">
                  Provide your contact details below. Jackson will prepare a customized legacy proposal matching
                  your estate planning entitlement.
                </p>

                <div className="mb-4">
                  <label htmlFor="estate-name" className="mb-1.5 block text-[11px] uppercase tracking-wide text-[#8A9BAE]">
                    Full Name
                  </label>
                  <input
                    id="estate-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First and last name"
                    autoComplete="name"
                    className="w-full rounded-lg border border-[#C49A6C]/20 bg-[#1c2330] px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#D4B08A]"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="estate-email" className="mb-1.5 block text-[11px] uppercase tracking-wide text-[#8A9BAE]">
                    Email Address
                  </label>
                  <input
                    id="estate-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-[#C49A6C]/20 bg-[#1c2330] px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#D4B08A]"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="estate-phone" className="mb-1.5 block text-[11px] uppercase tracking-wide text-[#8A9BAE]">
                    Phone Number
                  </label>
                  <input
                    id="estate-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={BRAND.phone}
                    autoComplete="tel"
                    className="w-full rounded-lg border border-[#C49A6C]/20 bg-[#1c2330] px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#D4B08A]"
                  />
                </div>

                {error ? <p className="mb-4 text-xs text-[#EF4444]">{error}</p> : null}

                <button
                  type="button"
                  onClick={submitLead}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C49A6C] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#D4B08A] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Verifying...
                    </>
                  ) : (
                    <>
                      <LockOpen size={16} aria-hidden="true" /> Unlock My Bundle
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border"
                  style={{ background: 'rgba(196,154,108,0.12)', borderColor: 'rgba(196,154,108,0.3)', color: GOLD }}
                >
                  <Check size={30} aria-hidden="true" />
                </div>
                <h2 className="mb-2 text-xl font-normal" style={{ fontFamily: 'Georgia, serif' }}>
                  Pre-Verification Approved!
                </h2>
                <p className="mb-6 text-[13px] leading-relaxed text-[#8A9BAE]">
                  Your contact details have been received. Please schedule your strategy briefing session on
                  Jackson&apos;s calendar to finalize your estate planning bundle.
                </p>
                <a
                  href={BRAND.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C49A6C] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#D4B08A]"
                >
                  <Calendar size={16} aria-hidden="true" /> Book Briefing Session
                </a>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
