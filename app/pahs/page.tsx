import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PAHS Football 2026 · Latimore Life & Legacy',
  description: 'Proud sponsor of Pottsville Area High School Football 2026. Protecting families and futures in the Coal Region.',
}

const quickQuoteUrl = 'https://agents.ethoslife.com/invite/29ad1?utm_source=pahs&utm_medium=qr&utm_campaign=football2026'
const bookingUrl = 'https://latimorelifelegacy.fillout.com/latimorelifelegacy'
const cardUrl = 'https://card.latimorelifelegacy.com'
const websiteUrl = 'https://www.latimorelifelegacy.com'

export default function PAHSPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --pahs-navy: #1a2d3f;
          --pahs-navy-dark: #0f1e2a;
          --pahs-navy-deep: #091520;
          --pahs-gold: #C49A6C;
          --pahs-gold-light: #e7c9a3;
          --pahs-crimson: #8B1A1A;
          --pahs-white: #ffffff;
          --pahs-text: rgba(255,255,255,0.88);
          --pahs-text-muted: rgba(255,255,255,0.55);
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--pahs-navy-deep);
        }

        .pahs-qr-page {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--pahs-navy-deep);
          color: var(--pahs-white);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        .pahs-qr-page a {
          -webkit-tap-highlight-color: transparent;
        }

        .field-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: linear-gradient(180deg, var(--pahs-navy-deep) 0%, #112233 40%, #0d1d2b 100%);
          overflow: hidden;
        }

        .field-lines {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 140vw;
          height: 60vh;
          opacity: 0.07;
        }

        .field-lines line {
          stroke: white;
          stroke-width: 1.5;
        }

        .field-glow {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 80vw;
          height: 50vh;
          background: radial-gradient(ellipse, rgba(196,154,108,0.12) 0%, transparent 65%);
          pointer-events: none;
        }

        .field-glow-red {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40vh;
          background: radial-gradient(ellipse at 50% 100%, rgba(139,26,26,0.18) 0%, transparent 60%);
          pointer-events: none;
        }

        .page {
          position: relative;
          z-index: 1;
          max-width: 680px;
          margin: 0 auto;
          padding: 20px 16px 60px;
        }

        .scoreboard {
          background: linear-gradient(135deg, var(--pahs-crimson) 0%, #6b1414 100%);
          border: 2px solid rgba(255,255,255,0.15);
          border-radius: 16px 16px 0 0;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 24px rgba(139,26,26,0.4);
          gap: 14px;
        }

        .scoreboard-left {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .scoreboard-label {
          font-family: 'Oswald', sans-serif;
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.28em;
          color: rgba(255,255,255,0.65);
          text-transform: uppercase;
        }

        .scoreboard-team {
          font-family: 'Oswald', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--pahs-white);
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .scoreboard-badge {
          background: var(--pahs-gold);
          color: var(--pahs-navy-deep);
          font-family: 'Oswald', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          padding: 4px 12px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .card {
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-top: none;
          border-radius: 0 0 24px 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.4);
        }

        .card-inner {
          padding: 28px 22px 32px;
        }

        .scan-tag {
          display: inline-block;
          font-family: 'Oswald', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.3em;
          color: var(--pahs-gold-light);
          text-transform: uppercase;
          margin-bottom: 10px;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.1s forwards;
        }

        .hero-headline {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(2.6rem, 10vw, 4rem);
          font-weight: 700;
          line-height: 0.95;
          letter-spacing: -0.01em;
          color: var(--pahs-white);
          text-transform: uppercase;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.2s forwards;
        }

        .hero-headline span {
          color: var(--pahs-gold);
          display: block;
        }

        .hero-sub {
          margin-top: 14px;
          font-size: 1rem;
          line-height: 1.65;
          color: var(--pahs-text);
          max-width: 520px;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.3s forwards;
        }

        .yardline {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0;
          opacity: 0;
          animation: fadeUp 0.4s ease 0.35s forwards;
        }

        .yardline-number {
          font-family: 'Oswald', sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: rgba(255,255,255,0.08);
          line-height: 1;
          white-space: nowrap;
        }

        .yardline-bar {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(196,154,108,0.4), rgba(196,154,108,0.1));
        }

        .ctas {
          display: grid;
          gap: 10px;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.4s forwards;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          background: var(--pahs-gold);
          color: var(--pahs-navy-deep);
          border-radius: 14px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          box-shadow: 0 8px 24px rgba(196,154,108,0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .btn-primary:active {
          transform: scale(0.98);
          box-shadow: 0 4px 12px rgba(196,154,108,0.25);
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(196,154,108,0.3);
          color: var(--pahs-gold-light);
          border-radius: 14px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .btn-secondary:active {
          background: rgba(255,255,255,0.08);
        }

        .btn-ghost {
          display: block;
          text-align: center;
          padding: 13px 20px;
          color: var(--pahs-text-muted);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 14px;
          transition: color 0.15s ease;
        }

        .btn-ghost:active { color: var(--pahs-text); }

        .profile-section {
          margin-top: 28px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 18px;
          align-items: start;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.5s forwards;
        }

        .profile-photo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid var(--pahs-gold);
          object-fit: cover;
          object-position: top;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          background: rgba(255,255,255,0.05);
          flex-shrink: 0;
        }

        .profile-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--pahs-white);
          line-height: 1.2;
        }

        .profile-title {
          font-size: 0.82rem;
          color: var(--pahs-gold);
          font-weight: 600;
          letter-spacing: 0.06em;
          margin-top: 2px;
        }

        .profile-story {
          margin-top: 10px;
          font-size: 0.92rem;
          line-height: 1.7;
          color: var(--pahs-text);
        }

        .pull-quote {
          margin-top: 20px;
          padding: 16px 18px;
          border-left: 3px solid var(--pahs-gold);
          background: rgba(255,255,255,0.04);
          border-radius: 0 12px 12px 0;
          font-size: 0.95rem;
          line-height: 1.65;
          color: var(--pahs-text);
          font-style: italic;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.6s forwards;
        }

        .why-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.65s forwards;
        }

        .why-item {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 10px;
          text-align: center;
        }

        .why-item .icon {
          font-size: 1.3rem;
          margin-bottom: 6px;
          display: block;
        }

        .why-item .label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--pahs-text-muted);
          line-height: 1.4;
        }

        .contact-bar {
          margin-top: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.7s forwards;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
          text-decoration: none;
          color: var(--pahs-text);
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.07);
        }

        .contact-item .icon { font-size: 1rem; flex-shrink: 0; }

        .hashtag-footer {
          margin-top: 28px;
          text-align: center;
          opacity: 0;
          animation: fadeUp 0.5s ease 0.75s forwards;
        }

        .hashtag-footer p {
          font-family: 'Oswald', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          color: var(--pahs-gold);
          text-transform: uppercase;
        }

        .hashtag-footer .tagline {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--pahs-text-muted);
          letter-spacing: 0.06em;
          margin-top: 4px;
        }

        .yard-markers {
          display: flex;
          justify-content: space-between;
          padding: 8px 4px 0;
          opacity: 0.18;
        }

        .yard-num {
          font-family: 'Oswald', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          color: white;
          letter-spacing: 0.1em;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 380px) {
          .why-grid { grid-template-columns: 1fr 1fr; }
          .contact-bar { grid-template-columns: 1fr; }
          .hero-headline { font-size: 2.3rem; }
          .scoreboard { padding: 10px 14px; }
          .scoreboard-badge { font-size: 0.66rem; letter-spacing: 0.1em; }
          .scoreboard-team { font-size: 1rem; }
        }
      `}</style>

      <main className="pahs-qr-page">
        <div className="field-bg" aria-hidden="true">
          <svg className="field-lines" viewBox="0 0 1400 600" preserveAspectRatio="xMidYMax meet">
            <line x1="0" y1="60" x2="1400" y2="60" />
            <line x1="0" y1="120" x2="1400" y2="120" />
            <line x1="0" y1="180" x2="1400" y2="180" />
            <line x1="0" y1="240" x2="1400" y2="240" />
            <line x1="0" y1="300" x2="1400" y2="300" />
            <line x1="0" y1="360" x2="1400" y2="360" />
            <line x1="0" y1="420" x2="1400" y2="420" />
            <line x1="0" y1="480" x2="1400" y2="480" />
            <line x1="0" y1="540" x2="1400" y2="540" />
            <line x1="0" y1="600" x2="1400" y2="600" />
            <line x1="140" y1="0" x2="140" y2="600" />
            <line x1="280" y1="0" x2="280" y2="600" />
            <line x1="420" y1="0" x2="420" y2="600" />
            <line x1="560" y1="0" x2="560" y2="600" />
            <line x1="700" y1="0" x2="700" y2="600" />
            <line x1="840" y1="0" x2="840" y2="600" />
            <line x1="980" y1="0" x2="980" y2="600" />
            <line x1="1120" y1="0" x2="1120" y2="600" />
            <line x1="1260" y1="0" x2="1260" y2="600" />
            <line x1="0" y1="0" x2="1400" y2="0" strokeWidth="4" />
            <line x1="0" y1="600" x2="1400" y2="600" strokeWidth="4" />
          </svg>
          <div className="field-glow" />
          <div className="field-glow-red" />
        </div>

        <div className="page">
          <div className="scoreboard">
            <div className="scoreboard-left">
              <span className="scoreboard-label">Proud Sponsor</span>
              <span className="scoreboard-team">POTTSVILLE AREA 🏈</span>
            </div>
            <div className="scoreboard-badge">SEASON 2026</div>
          </div>

          <div className="card">
            <div className="yard-markers" aria-hidden="true">
              <span className="yard-num">10</span>
              <span className="yard-num">20</span>
              <span className="yard-num">30</span>
              <span className="yard-num">40</span>
              <span className="yard-num">50</span>
              <span className="yard-num">40</span>
              <span className="yard-num">30</span>
              <span className="yard-num">20</span>
              <span className="yard-num">10</span>
            </div>

            <div className="card-inner">
              <span className="scan-tag">You scanned the QR · Welcome to the team</span>

              <h1 className="hero-headline">
                Thanks for
                <br />
                <span>Scanning.</span>
              </h1>

              <p className="hero-sub">
                Protecting families and futures in the Coal Region — one Friday night at a time.
              </p>

              <div className="yardline" aria-hidden="true">
                <span className="yardline-number">50</span>
                <div className="yardline-bar" />
                <span className="yardline-number">YD</span>
              </div>

              <div className="ctas">
                <a href={quickQuoteUrl} className="btn-primary">
                  <span>Get Your Quick Quote</span>
                  <span aria-hidden="true">→</span>
                </a>
                <a href={bookingUrl} className="btn-secondary">
                  <span>Book a Conversation</span>
                  <span aria-hidden="true">📅</span>
                </a>
                <a href={cardUrl} className="btn-ghost">View Digital Business Card →</a>
                <a href={websiteUrl} className="btn-ghost">Visit Website →</a>
              </div>

              <div className="profile-section">
                <img
                  className="profile-photo"
                  src="/jackson-headshot.jpg"
                  alt="Jackson Latimore"
                />
                <div>
                  <div className="profile-name">Jackson M. Latimore Sr.</div>
                  <div className="profile-title">Independent Insurance Consultant · Latimore Life & Legacy LLC</div>
                  <p className="profile-story">
                    Serving Schuylkill, Luzerne, and Northumberland Counties with life insurance, income protection, and legacy planning built for Coal Region families.
                  </p>
                </div>
              </div>

              <div className="pull-quote">
                On December 7, 2010, an AED saved my life during a college basketball game. That defibrillator was placed by the Gregory W. Moyer Fund — honoring a 15-year-old who died from sudden cardiac arrest. My second chance became my mission. <strong style={{ color: 'var(--pahs-gold-light)' }}>#TheBeatGoesOn</strong>
              </div>

              <div className="why-grid">
                <div className="why-item">
                  <span className="icon" aria-hidden="true">🏠</span>
                  <div className="label">Local &amp; Community-Centered</div>
                </div>
                <div className="why-item">
                  <span className="icon" aria-hidden="true">🛡️</span>
                  <div className="label">Protection &amp; Legacy Focused</div>
                </div>
                <div className="why-item">
                  <span className="icon" aria-hidden="true">📍</span>
                  <div className="label">Coal Region Roots</div>
                </div>
              </div>

              <div className="contact-bar">
                <a href="tel:+18568951457" className="contact-item">
                  <span className="icon" aria-hidden="true">📞</span>
                  <span>(856) 895-1457</span>
                </a>
                <a href={websiteUrl} className="contact-item">
                  <span className="icon" aria-hidden="true">🌐</span>
                  <span>latimorelifelegacy.com</span>
                </a>
              </div>

              <div className="hashtag-footer">
                <p>#TheBeatGoesOn &nbsp;·&nbsp; #PAHS2026 &nbsp;·&nbsp; #CoalRegion</p>
                <p className="tagline">Protecting Today. Securing Tomorrow. · Latimore Life &amp; Legacy LLC</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
