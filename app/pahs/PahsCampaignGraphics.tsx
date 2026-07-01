'use client'

import { QRCodeSVG } from 'qrcode.react'

export const PAHS_TRACKING_URL = 'https://card.latimorelifelegacy.com/pahs?utm_source=pahs_qr&utm_medium=qr&utm_campaign=pahs_protect&utm_content=football_sponsorship'

const logoUrl = '/pahs-latimore-logo.png'
const tideLogoUrl = '/pahs-tide-logo.png'
const throwbackImageUrl = '/pahs-2005-allarea.png'

type GraphicProps = {
  className?: string
  compact?: boolean
}

const baseCard = {
  position: 'relative' as const,
  overflow: 'hidden' as const,
  borderRadius: 16,
  background: '#070b10',
  color: '#fff',
  fontFamily: "'Oswald', system-ui, sans-serif",
}

function QrBox({ size = 166 }: { size?: number }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        background: '#fff',
        boxShadow: '0 12px 35px rgba(0,0,0,.45)',
      }}
      aria-label="Scan to start the PAHS Protect review"
    >
      <QRCodeSVG value={PAHS_TRACKING_URL} size={size} level="H" includeMargin />
    </div>
  )
}

export function PahsSponsorGraphic({ className, compact = false }: GraphicProps) {
  return (
    <div
      className={className}
      style={{
        ...baseCard,
        aspectRatio: '1 / 1',
        width: '100%',
        minHeight: compact ? 320 : undefined,
        padding: compact ? '1.35rem' : '1.8rem',
        border: '1px solid rgba(196,154,108,.55)',
        boxShadow: '0 24px 80px rgba(0,0,0,.5)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 38%, rgba(255,255,255,.28), transparent 18%), linear-gradient(180deg, #111820 0%, #0a0d12 42%, #112716 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '12% 0 28%',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.18) 8%, transparent 16%, transparent 84%, rgba(255,255,255,.18) 92%, transparent 100%)',
          transform: 'skewY(-7deg)',
          opacity: .8,
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'grid',
          height: '100%',
          gridTemplateRows: 'auto auto 1fr auto',
          gap: compact ? '.55rem' : '.8rem',
          textAlign: 'center' as const,
        }}
      >
        <div>
          <div
            style={{
              fontSize: compact ? 'clamp(1.9rem, 10vw, 3.4rem)' : 'clamp(2.4rem, 9vw, 5.3rem)',
              fontWeight: 900,
              lineHeight: .85,
              letterSpacing: '.03em',
              textTransform: 'uppercase' as const,
              color: '#f6f6f6',
              textShadow: '0 7px 28px rgba(0,0,0,.75)',
            }}
          >
            Friday Night
          </div>
          <div
            style={{
              marginTop: compact ? 2 : 4,
              fontSize: compact ? 'clamp(1.8rem, 9vw, 3.2rem)' : 'clamp(2.25rem, 8vw, 4.6rem)',
              fontWeight: 900,
              lineHeight: .88,
              letterSpacing: '.02em',
              color: '#C49A6C',
              textTransform: 'uppercase' as const,
              textShadow: '0 4px 18px rgba(196,154,108,.3)',
            }}
          >
            Lights
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: compact ? 7 : 10,
              padding: compact ? '.22rem .65rem' : '.35rem 1rem',
              background: '#7b1d2d',
              color: '#fff',
              fontSize: compact ? '.72rem' : 'clamp(.9rem, 2.8vw, 1.25rem)',
              fontWeight: 800,
              letterSpacing: '.1em',
              textTransform: 'uppercase' as const,
              boxShadow: '0 8px 20px rgba(0,0,0,.35)',
            }}
          >
            Game Day Is Everything
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginTop: compact ? '.2rem' : '.4rem',
          }}
        >
          <img src={tideLogoUrl} alt="Pottsville Area Crimson Tide" style={{ width: compact ? 94 : '28%', maxWidth: 190, height: 'auto', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.6))' }} />
          <div style={{ flex: 1 }} />
          <img src={logoUrl} alt="Latimore Life & Legacy LLC" style={{ width: compact ? 150 : '34%', maxWidth: 250, height: 'auto', filter: 'drop-shadow(0 0 16px rgba(255,255,255,.45))' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
          <QrBox size={compact ? 122 : 168} />
        </div>

        <div>
          <div style={{ marginTop: compact ? 7 : 10, color: '#f5dfbd', fontSize: compact ? '.72rem' : '1rem', fontWeight: 900, letterSpacing: '.05em', textTransform: 'uppercase' as const }}>
            Scan to protect what you play for
          </div>
          <div style={{ marginTop: 6, fontSize: compact ? '.9rem' : '1.15rem', fontWeight: 900 }}>
            #TheBeatGoesOn
          </div>
          <div style={{ marginTop: 3, color: '#f0f0f0', fontFamily: 'Lato, system-ui, sans-serif', fontSize: compact ? '.72rem' : '.92rem' }}>
            card.latimorelifelegacy.com/pahs
          </div>
        </div>
      </div>
    </div>
  )
}

export function PahsFreeReviewGraphic({ className }: GraphicProps) {
  return (
    <div
      className={className}
      style={{
        ...baseCard,
        width: 'min(100%, 960px)',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, .9fr)',
        background: '#f7f3ec',
        color: '#111',
        border: '1px solid rgba(196,154,108,.55)',
      }}
    >
      <div style={{ padding: 'clamp(1.25rem, 4vw, 2.25rem)', background: '#111', color: '#fff' }}>
        <div style={{ color: '#C49A6C', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' as const }}>Proud Sponsor of</div>
        <div style={{ marginTop: 8, display: 'inline-block', padding: '.25rem .65rem', background: '#7b1d2d', color: '#fff', fontWeight: 900, letterSpacing: '.06em' }}>Pottsville Area Crimson Tide</div>
        <div style={{ marginTop: 22, fontSize: 'clamp(3rem, 12vw, 6.5rem)', lineHeight: .85, fontWeight: 900, letterSpacing: '.02em' }}>FREE</div>
        <div style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', fontWeight: 900, letterSpacing: '.08em' }}>PROTECTION REVIEW</div>
        <p style={{ marginTop: 22, maxWidth: 390, fontFamily: 'Lato, system-ui, sans-serif', fontWeight: 700, lineHeight: 1.45 }}>
          No pressure. No obligation. A clear review of income protection, life insurance, living benefits, and legacy gaps.
        </p>
        <div style={{ marginTop: 18, fontWeight: 900 }}>ID#2777749</div>
      </div>
      <div style={{ padding: 'clamp(1.25rem, 4vw, 2.25rem)', display: 'grid', placeItems: 'center', textAlign: 'center' as const }}>
        <QrBox size={180} />
        <img src={logoUrl} alt="Latimore Life & Legacy LLC" style={{ width: 'min(88%, 300px)', marginTop: 18, height: 'auto' }} />
        <div style={{ marginTop: 12, color: '#14304a', fontWeight: 900, fontSize: '1.25rem' }}>#TheBeatGoesOn</div>
        <div style={{ marginTop: 6, color: '#7b1d2d', fontWeight: 900 }}>card.latimorelifelegacy.com/pahs</div>
        <div style={{ marginTop: 10, color: '#555', fontFamily: 'Lato, system-ui, sans-serif', fontSize: '.85rem' }}>Powered by Campus Box Media</div>
      </div>
    </div>
  )
}

export function PahsThrowbackGraphic({ className }: GraphicProps) {
  return (
    <div className={className} style={{ background: '#efe0c8', color: '#17110b', overflow: 'hidden' }}>
      <div style={{ padding: 'clamp(1rem, 3vw, 1.55rem) clamp(1rem, 3vw, 1.8rem) .6rem', textAlign: 'center' as const, fontFamily: "'Oswald', system-ui, sans-serif" }}>
        <div style={{ color: '#7b1d2d', fontSize: 'clamp(1.5rem, 5.5vw, 3rem)', fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase' as const }}>Throwback Tide Thursday</div>
        <div style={{ marginTop: 6, color: '#222', fontSize: 'clamp(1.1rem, 3.6vw, 2rem)', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' as const }}>2005 Coal Region All-Area Football</div>
        <div style={{ marginTop: 4, color: '#111', fontSize: 'clamp(2rem, 7vw, 4rem)', lineHeight: .92, fontWeight: 900, textTransform: 'uppercase' as const }}>Where The Journey Began</div>
      </div>
      <img src={throwbackImageUrl} alt="2005 Coal Region All-Area Football — Where the Journey Began" style={{ display: 'block', width: '100%', height: 'auto' }} />
      <div style={{ padding: '.65rem 1rem 1rem', fontFamily: 'Georgia, serif', fontSize: 'clamp(.85rem, 2.4vw, 1.05rem)', fontWeight: 700, lineHeight: 1.25 }}>
        Pictured from left: Coach Kevin Keating, Dave DeMarkis, Jackson Latimore, and Andy Buziak. Latimore was named Co-Defensive Player of the Year.
      </div>
    </div>
  )
}
