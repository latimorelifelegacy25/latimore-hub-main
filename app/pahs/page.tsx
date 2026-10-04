import Image from 'next/image'
import './pahs.css'
import './pahs-override.css'
import { PahsThrowbackGraphic } from './PahsCampaignGraphics'
import PahsLeadForm from './PahsLeadForm'
import ScrollToReviewButton from './ScrollToReviewButton'
import CampaignVideo from './CampaignVideo'

type ScheduleGame = {
  date: string
  opponent: string
  homeAway: 'HOME' | 'AWAY'
  location: string
  time: string
}

const scheduleGames: ScheduleGame[] = [
  { date: 'Aug 28', opponent: 'Shamokin Area', homeAway: 'HOME', location: 'Pottsville High School', time: '7:00 PM' },
  { date: 'Sep 4', opponent: 'Mount Carmel', homeAway: 'HOME', location: 'Pottsville Area High School', time: '7:00 PM' },
  { date: 'Sep 10', opponent: 'Pleasant Valley', homeAway: 'AWAY', location: 'Pleasant Valley High School', time: '7:00 PM' },
  { date: 'Sep 18', opponent: 'Blue Mountain', homeAway: 'AWAY', location: 'Blue Mountain High School', time: '7:00 PM' },
  { date: 'Sep 25', opponent: 'Berwick', homeAway: 'HOME', location: 'Pottsville Area High School', time: '7:00 PM' },
  { date: 'Oct 1', opponent: 'Tamaqua', homeAway: 'HOME', location: 'Pottsville Area High School', time: '7:00 PM' },
  { date: 'Oct 9', opponent: 'Panther Valley', homeAway: 'AWAY', location: 'Panther Valley Senior High School', time: '7:00 PM' },
  { date: 'Oct 16', opponent: 'Pine Grove', homeAway: 'AWAY', location: 'Pine Grove Area High School', time: '7:00 PM' },
  { date: 'Oct 23', opponent: 'North Schuylkill', homeAway: 'HOME', location: 'Pottsville High School', time: '7:00 PM' },
  { date: 'Oct 30', opponent: 'Hazleton Area', homeAway: 'HOME', location: 'Pottsville High School', time: '7:00 PM' },
]

export default function PAHSPage() {
  return (
    <main className="pahs-page" id="top">
      <section className="pahs-hero" aria-labelledby="pahs-hero-title">
        <div className="pahs-shell pahs-hero__grid">
          <div className="pahs-hero__copy">
            <p className="pahs-kicker">PAHS Protect · Pottsville Football 2026</p>
            <h1 id="pahs-hero-title">Protect What You Play For</h1>
            <p className="pahs-hero__lead">
              Latimore Life &amp; Legacy LLC is proud to support PAHS Football and help Coal Region families review protection before life forces the conversation.
            </p>

            <div className="pahs-hero__actions" aria-label="Primary actions">
              <ScrollToReviewButton className="pahs-button pahs-button--primary">
                Start Free Protection Review
              </ScrollToReviewButton>
              <a className="pahs-button pahs-button--ghost" href="tel:15709001977">
                Call 570-900-1977
              </a>
            </div>

            <div className="pahs-trust-strip" aria-label="Campaign details">
              <span>Scan QR</span>
              <span>2-minute request</span>
              <span>Local follow-up</span>
            </div>
          </div>

        </div>
      </section>

      <section className="pahs-flyer" id="flyer">
        <div className="pahs-flyer-inner">
          <div className="section-label gold-label">Proud All-Star Sponsor</div>
          <Image
            className="pahs-flyer-image"
            src="/pahs-all-star-sponsor.webp"
            alt="Latimore Life & Legacy LLC — Proud PAHS All-Star Sponsor"
            width={1448}
            height={1086}
            sizes="(max-width: 1100px) 100vw, 1100px"
            priority
          />
          <div className="pahs-flyer-qr-card">
            <Image
              src="/pahs-tide-qr.jpg"
              alt="Scan the Crimson Tide QR code to start the PAHS Protect review"
              width={1280}
              height={1280}
              sizes="180px"
            />
            <div>
              <h2>Scan to Start Your Free Protection Review</h2>
              <p>Connect directly with Latimore Life &amp; Legacy LLC for an education-first review.</p>
              <ScrollToReviewButton className="pahs-button pahs-button--primary">
                Start Free Protection Review
              </ScrollToReviewButton>
            </div>
          </div>
        </div>
      </section>

      <section className="pahs-then pahs-then--priority" id="story">
        <div className="pahs-then-inner">
          <div className="section-label gold-label">PAHS Then</div>
          <h2 className="pahs-story-title">Where the Journey Began</h2>
          <p className="pahs-story-copy">
            From Cardinal Brennan football to serving Coal Region families today, this campaign is full circle: protect the people, homes, income, and future behind every jersey.
          </p>
          <PahsThrowbackGraphic className="pahs-then-image" />
        </div>
      </section>

      <section className="campaign-videos">
        <div className="campaign-videos-inner">
          <div className="section-label gold-label">Campaign Videos</div>
          <h2 className="campaign-videos-title">Watch the Campaign</h2>
          <div className="videos-grid single">
            <div className="video-wrap">
              <CampaignVideo />
            </div>
          </div>
          <p>
            See how our PAHS partnership helps Coal Region families start a free protection review with Jackson.
          </p>
        </div>
      </section>

      <section className="pahs-schedule" id="schedule">
        <div className="pahs-shell">
          <div className="section-label gold-label">2026 Season</div>
          <h2 className="pahs-schedule-title">Crimson Tide Schedule</h2>
          <div className="pahs-schedule-list">
            {scheduleGames.map((game) => (
              <div className="pahs-schedule-row" key={`${game.date}-${game.opponent}`}>
                <div className="pahs-schedule-date">{game.date}</div>
                <div className="pahs-schedule-info">
                  <span className="pahs-schedule-opponent">{game.opponent}</span>
                  <span className={`pahs-schedule-tag pahs-schedule-tag--${game.homeAway.toLowerCase()}`}>
                    {game.homeAway}
                  </span>
                </div>
                <div className="pahs-schedule-location">{game.location}</div>
                <div className="pahs-schedule-time">{game.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="spgfx" aria-label="PAHS free family protection review coupon">
        <Image
          src="/pahs-family-protection-coupon.jpg"
          alt="Free Family Protection Review coupon — Proud Sponsor of Pottsville Area Crimson Tide"
          width={1280}
          height={443}
          sizes="100vw"
        />
      </section>

      <PahsLeadForm />

      <footer className="pahs-footer">
        <div className="pahs-shell pahs-footer__grid">
          <div>
            <strong>Latimore Life &amp; Legacy LLC</strong>
            <span>Protecting Today. Securing Tomorrow.</span>
            <span>PA Licensed DOI #1268820</span>
          </div>
          <div>
            <a href="tel:15709001977">570-900-1977</a>
            <a href="https://www.latimorelifelegacy.com">latimorelifelegacy.com</a>
          </div>
        </div>
      </footer>

      <div className="pahs-mobile-cta">
        <span>PAHS Protect Review</span>
        <ScrollToReviewButton>Start Now</ScrollToReviewButton>
      </div>
    </main>
  )
}
