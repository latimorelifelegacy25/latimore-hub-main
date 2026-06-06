import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import StartForm from './start/StartForm'

export const metadata: Metadata = {
  title: 'Latimore Life & Legacy | Proud PAHS All-Star Sponsor',
  description: 'Proud PAHS All-Star Sponsor. Start your quick quote and view the Pottsville Area High School football schedule.',
}

const games = [
  { date: 'Sep 6', opponent: 'Minersville', location: 'Home' },
  { date: 'Sep 13', opponent: 'Mahanoy Area', location: 'Away' },
  { date: 'Sep 20', opponent: 'Tamaqua', location: 'Home' },
  { date: 'Sep 27', opponent: 'North Schuylkill', location: 'Away' },
  { date: 'Oct 4', opponent: 'Jim Thorpe', location: 'Home' },
  { date: 'Oct 11', opponent: 'Shenandoah Valley', location: 'Away' },
  { date: 'Oct 18', opponent: 'Nativity BVM', location: 'Home' },
  { date: 'Oct 25', opponent: 'Tri-Valley', location: 'Away' },
]

export default function PAHSPage() {
  return (
    <main className="pahs-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

        :root {
          --navy: #2C3E50;
          --navy-deep: #0d1821;
          --gold: #C49A6C;
          --gold-light: #e8c99a;
          --gold-dark: #9a7448;
          --crimson: #8B1A1A;
          --crimson-light: #b02020;
          --white: #FFFFFF;
          --offwhite: #f5f0e8;
          --muted: #93A4B4;
        }

        * { box-sizing: border-box; }

        body {
          background: var(--navy-deep);
        }

        .pahs-page {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          color: var(--white);
          font-family: 'Lora', Georgia, serif;
          background: var(--navy-deep);
        }

        .pahs-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background:
            linear-gradient(160deg, rgba(13,24,33,.82) 0%, rgba(44,62,80,.58) 52%, rgba(139,26,26,.42) 100%),
            url('/pahs-sponsor-flyer.png');
          background-size: cover;
          background-position: center 30%;
          filter: brightness(.72) saturate(.88);
          transform: scale(1.02);
        }

        .pahs-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% 10%, rgba(196,154,108,.20) 0%, transparent 52%),
            linear-gradient(180deg, rgba(13,24,33,.15) 0%, rgba(13,24,33,.92) 100%);
        }

        .page-shell {
          position: relative;
          z-index: 1;
          width: min(100%, 760px);
          margin: 0 auto;
          padding: 28px 16px 72px;
        }

        .lead-card,
        .schedule-card {
          background: rgba(13,24,33,.78);
          border: 1px solid rgba(196,154,108,.26);
          box-shadow: 0 28px 80px rgba(0,0,0,.48);
          backdrop-filter: blur(10px);
        }

        .lead-card {
          border-radius: 28px;
          padding: clamp(24px, 5vw, 40px) clamp(18px, 5vw, 34px);
          text-align: center;
          animation: fadeUp .7s ease both;
          overflow: hidden;
          position: relative;
        }

        .lead-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--crimson), var(--gold), var(--crimson));
        }

        .sponsor-badge {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          background: rgba(196,154,108,.15);
          border: 1px solid rgba(196,154,108,.45);
          color: var(--gold-light);
          font-family: 'Oswald', sans-serif;
          font-size: .72rem;
          font-weight: 500;
          letter-spacing: .22em;
          margin-bottom: 18px;
          padding: .42rem 1.15rem;
          text-transform: uppercase;
        }

        .sponsor-badge::before,
        .sponsor-badge::after {
          content: '★';
          color: var(--gold);
          font-size: .6rem;
        }

        .brand-logo {
          display: block;
          width: min(230px, 72vw);
          height: auto;
          margin: 0 auto 20px;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,.62));
        }

        .player-wrap {
          display: flex;
          justify-content: center;
          margin: 0 auto 18px;
        }

        .player-photo {
          width: 126px;
          height: 126px;
          border-radius: 999px;
          border: 4px solid var(--gold);
          box-shadow: 0 16px 42px rgba(0,0,0,.46);
          object-fit: cover;
          object-position: top;
          background: rgba(255,255,255,.08);
        }

        .headline {
          margin: 0;
          color: #fff;
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(3rem, 12vw, 6rem);
          line-height: .92;
          letter-spacing: .035em;
          text-shadow: 0 4px 38px rgba(0,0,0,.82);
        }

        .headline span {
          color: var(--gold);
          display: block;
        }

        .subline {
          color: var(--crimson-light);
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(1.25rem, 5vw, 2.15rem);
          letter-spacing: .12em;
          margin-top: 4px;
        }

        .heartbeat {
          width: 200px;
          height: 30px;
          margin: 16px auto 8px;
        }

        .tagline {
          color: var(--gold-light);
          font-family: 'Oswald', sans-serif;
          font-size: clamp(.76rem, 2.8vw, .95rem);
          font-weight: 400;
          letter-spacing: .16em;
          line-height: 1.6;
          text-transform: uppercase;
        }

        .form-intro {
          max-width: 470px;
          margin: 18px auto 0;
          color: rgba(255,255,255,.74);
          font-size: .96rem;
          line-height: 1.7;
        }

        .form-wrap {
          max-width: 520px;
          margin: 24px auto 0;
          text-align: left;
        }

        .phone-line {
          display: inline-flex;
          margin-top: 18px;
          color: var(--gold-light);
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: .12em;
          text-decoration: none;
          text-transform: uppercase;
        }

        .goalposts-wrap {
          margin: 22px 0 18px;
          text-align: center;
          animation: fadeUp .7s .1s ease both;
        }

        .goalposts {
          opacity: .38;
          filter: drop-shadow(0 6px 18px rgba(0,0,0,.45));
        }

        .schedule-card {
          border-radius: 24px;
          overflow: hidden;
          animation: fadeUp .7s .16s ease both;
        }

        .schedule-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 22px;
          background: linear-gradient(135deg, rgba(196,154,108,.22), rgba(196,154,108,.07));
          border-bottom: 1px solid rgba(196,154,108,.24);
        }

        .schedule-icon {
          font-size: 1.9rem;
          filter: drop-shadow(0 4px 14px rgba(0,0,0,.5));
        }

        .schedule-title {
          color: var(--gold-light);
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(1.9rem, 7vw, 3rem);
          letter-spacing: .12em;
          line-height: .95;
          text-transform: uppercase;
        }

        .schedule-subtitle {
          color: var(--muted);
          font-family: 'Oswald', sans-serif;
          font-size: .88rem;
          font-weight: 300;
          letter-spacing: .05em;
          margin-top: 5px;
        }

        .game-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 22px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .game-row:last-child {
          border-bottom: none;
        }

        .yard-bar {
          width: 5px;
          height: 40px;
          border-radius: 4px;
          flex: 0 0 auto;
        }

        .yard-bar.home {
          background: linear-gradient(to bottom, var(--gold-dark), var(--gold-light));
        }

        .yard-bar.away {
          background: rgba(255,255,255,.14);
        }

        .game-date {
          width: 64px;
          color: var(--muted);
          flex: 0 0 auto;
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: .05em;
        }

        .game-opponent {
          flex: 1;
          color: var(--white);
          font-family: 'Oswald', sans-serif;
          font-size: clamp(1.15rem, 4.8vw, 1.75rem);
          font-weight: 500;
          line-height: 1.12;
        }

        .game-tag {
          border-radius: 8px;
          font-family: 'Oswald', sans-serif;
          font-size: .78rem;
          font-weight: 700;
          letter-spacing: .08em;
          padding: 6px 11px;
          text-transform: uppercase;
        }

        .game-tag.home {
          background: rgba(196,154,108,.18);
          border: 1px solid rgba(196,154,108,.38);
          color: var(--gold-light);
        }

        .game-tag.away {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.12);
          color: var(--muted);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 440px) {
          .page-shell { padding-left: 12px; padding-right: 12px; }
          .lead-card { border-radius: 22px; }
          .schedule-card { border-radius: 20px; }
          .schedule-head { padding: 18px 16px; }
          .game-row { gap: 10px; padding: 14px 14px; }
          .game-date { width: 54px; font-size: .92rem; }
          .yard-bar { height: 36px; }
          .game-tag { padding: 5px 9px; font-size: .7rem; }
        }
      `}</style>

      <div className="pahs-bg" aria-hidden="true" />

      <div className="page-shell">
        <section className="lead-card" aria-labelledby="pahs-heading">
          <div className="sponsor-badge">Proud All-Star Sponsor</div>
          <img className="brand-logo" src="/pahs-latimore-logo.png" alt="Latimore Life & Legacy LLC" />

          <div className="player-wrap">
            <Image
              className="player-photo"
              src="/jackson-headshot.jpg"
              alt="Jackson M. Latimore Sr."
              width={126}
              height={126}
              priority
            />
          </div>

          <h1 className="headline" id="pahs-heading">
            Start Your
            <span>Quick Quote</span>
          </h1>
          <div className="subline">Pottsville Area · Crimson Tide</div>

          <svg className="heartbeat" viewBox="0 0 200 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polyline
              points="0,15 34,15 42,4 48,26 54,10 60,20 66,15 100,15 108,2 116,28 122,8 128,22 134,15 200,15"
              stroke="#C49A6C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="tagline">Protecting Today. Securing Tomorrow. #TheBeatGoesOn</div>
          <p className="form-intro">Your information hits the Latimore Hub first, then routes to the quick quote flow.</p>

          <div className="form-wrap">
            <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center' }}>Loading form...</div>}>
              <StartForm />
            </Suspense>
          </div>

          <a className="phone-line" href="tel:+17176152613">(717) 615-2613</a>
        </section>

        <div className="goalposts-wrap" aria-hidden="true">
          <svg className="goalposts" width="84" height="44" viewBox="0 0 84 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="42" y1="44" x2="42" y2="18" stroke="#C49A6C" strokeWidth="3" strokeLinecap="round" />
            <line x1="42" y1="18" x2="12" y2="18" stroke="#C49A6C" strokeWidth="3" strokeLinecap="round" />
            <line x1="42" y1="18" x2="72" y2="18" stroke="#C49A6C" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="18" x2="12" y2="4" stroke="#C49A6C" strokeWidth="3" strokeLinecap="round" />
            <line x1="72" y1="18" x2="72" y2="4" stroke="#C49A6C" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <section className="schedule-card" aria-labelledby="schedule-heading">
          <div className="schedule-head">
            <span className="schedule-icon">🏈</span>
            <div>
              <h2 className="schedule-title" id="schedule-heading">PAHS Crimson Tide — 2025 Schedule</h2>
              <div className="schedule-subtitle">Pottsville Area High School Football</div>
            </div>
          </div>

          {games.map(game => {
            const locationClass = game.location.toLowerCase()
            return (
              <div className="game-row" key={`${game.date}-${game.opponent}`}>
                <div className={`yard-bar ${locationClass}`} />
                <div className="game-date">{game.date}</div>
                <div className="game-opponent">{game.opponent}</div>
                <span className={`game-tag ${locationClass}`}>{game.location}</span>
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}
