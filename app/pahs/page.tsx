import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'PAHS Football 2026',
  description:
    'Proud sponsor of Pottsville Area High School Football 2026. Start with a quick quote, digital business card, or the full Latimore Life & Legacy website.',
}

const navy = '#223446'
const navyDark = '#16222d'
const gold = '#C49A6C'
const white = '#FFFFFF'
const text = 'rgba(255,255,255,0.86)'

function TopActions() {
  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
      <Link
        href="/pahs/start?utm_source=pahs&utm_medium=qr&utm_campaign=football2026"
        data-track="true"
        data-track-event="cta_click"
        style={{
          display: 'block',
          textDecoration: 'none',
          background: gold,
          color: navyDark,
          fontWeight: 800,
          fontSize: '1rem',
          padding: '16px 18px',
          borderRadius: 16,
          boxShadow: '0 14px 28px rgba(0,0,0,0.18)',
        }}
      >
        Quick Quote →
      </Link>

      <a
        href={BRAND.cardUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-track="true"
        data-track-event="cta_click"
        style={{
          display: 'block',
          textDecoration: 'none',
          color: gold,
          border: '1px solid rgba(196,154,108,0.45)',
          padding: '14px 18px',
          borderRadius: 16,
          fontWeight: 700,
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        Digital Business Card
      </a>

      <a
        href={BRAND.baseUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-track="true"
        data-track-event="cta_click"
        style={{
          display: 'inline-block',
          textDecoration: 'none',
          color: 'rgba(255,255,255,0.72)',
          fontWeight: 600,
          fontSize: '0.95rem',
          textAlign: 'center',
        }}
      >
        Website
      </a>

      <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.86rem', textAlign: 'center' }}>
        No pressure. Takes under 60 seconds.
      </div>
    </div>
  )
}

export default function PahsPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at top, rgba(196,154,108,0.12), transparent 28%), linear-gradient(180deg, ${navy} 0%, ${navyDark} 100%)`,
        padding: '22px 14px 48px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 720,
          margin: '0 auto',
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.24)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '32px 22px 38px' }}>
          <div style={{ textAlign: 'center', color: gold, fontWeight: 800, letterSpacing: '0.22em', fontSize: '0.86rem' }}>
            #ROLLTIDE
          </div>
          <div style={{ textAlign: 'center', color: gold, fontWeight: 700, letterSpacing: '0.2em', fontSize: '0.98rem', marginTop: 12 }}>
            PAHS FOOTBALL 2026
          </div>
          <h1
            style={{
              margin: '14px 0 0',
              color: white,
              textAlign: 'center',
              fontSize: 'clamp(2.1rem, 7vw, 3.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            Thanks for Scanning.
          </h1>

          <TopActions />

          <p
            style={{
              margin: '28px auto 0',
              maxWidth: 590,
              textAlign: 'center',
              color: text,
              fontSize: 'clamp(1.05rem, 3.8vw, 1.35rem)',
              lineHeight: 1.7,
            }}
          >
            Proud sponsor of Pottsville Area High School Football 2026 — protecting families and futures in the Coal Region, one Friday night at a time.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
            <div
              style={{
                width: 188,
                height: 188,
                borderRadius: '50%',
                border: `5px solid ${gold}`,
                overflow: 'hidden',
                boxShadow: '0 16px 32px rgba(0,0,0,0.24)',
                background: 'rgba(255,255,255,0.06)',
              }}
            >
              <Image src="/jackson-headshot.jpg" alt="Jackson Latimore" width={188} height={188} style={{ width: '100%', height: '100%', objectFit: 'cover' }} priority />
            </div>
          </div>

          <div style={{ maxWidth: 610, margin: '30px auto 0', color: white }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 5.2vw, 2.4rem)', margin: 0, lineHeight: 1.15 }}>Hi, I&apos;m Jackson Latimore.</h2>

            <p style={{ color: text, fontSize: 'clamp(1.08rem, 3.9vw, 1.36rem)', lineHeight: 1.8, marginTop: 22 }}>
              On December 7, 2010, an AED saved my life during a college basketball game. That defibrillator was placed by the Gregory W. Moyer Fund — honoring a 15-year-old who died from sudden cardiac arrest in 2000.
            </p>

            <p style={{ color: text, fontSize: 'clamp(1.08rem, 3.9vw, 1.36rem)', lineHeight: 1.8, marginTop: 18 }}>
              My second chance became my mission. Today, I&apos;m proud to support Pottsville Area High School Football and help local families protect income, preserve options, and secure what matters most.
            </p>

            <div
              style={{
                marginTop: 24,
                padding: '18px 18px',
                borderRadius: 18,
                background: 'rgba(255,255,255,0.06)',
                borderLeft: `4px solid ${gold}`,
                color: white,
                fontWeight: 700,
                lineHeight: 1.6,
                fontSize: '1.04rem',
              }}
            >
              Protecting Today. Securing Tomorrow.
            </div>
          </div>

          <div style={{ maxWidth: 500, margin: '30px auto 0' }}>
            <TopActions />
          </div>

          <div style={{ marginTop: 26, textAlign: 'center', color: gold, fontWeight: 700, lineHeight: 1.8 }}>
            {BRAND.hashtag} #CrimsonTide #PAHS2026 #CoalRegion
          </div>
        </div>
      </section>
    </main>
  )
}
