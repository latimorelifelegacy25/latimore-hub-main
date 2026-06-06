import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import StartForm from './start/StartForm'

import Image from 'next/image';
import './pahs.css';
import { QRCodeCanvas } from 'qrcode.react';

type LeadForm = {
  name: string;
  phone: string;
  email: string;
  promo: string;
  interest: string;
};

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

        <div className="hero-content">
          <div className="sponsor-badge">Proud Sponsor Of</div>
          <div className="hero-school-name">POTTSVILLE AREA<br />HIGH SCHOOL</div>
          <div className="hero-year">FOOTBALL '26</div>
          <div className="pulse-badge"><div className="pulse-dot" />CRIMSON TIDE — GAME DAY</div>
          <div className="football-icon">🏈</div>
          <div className="logos-row">
            <div className="tide-logo-container">
              <Image src="/pahs-tide-logo.png" alt="Pottsville Area High School Crimson Tide logo" fill sizes="(max-width: 768px) 140px, 180px" style={{ objectFit: 'contain' }} />
            </div>
            <div className="logo-divider" />
            <div className="latimore-logo-container">
              <Image src="/pahs-latimore-logo.png" alt="Latimore Life & Legacy logo" fill sizes="(max-width: 768px) 180px, 220px" style={{ objectFit: 'contain' }} />
            </div>
          </div>
          <div className="beat-img-wrap"><div className="beat-banner">#TheBeatGoesOn</div></div>
          <div className="qr-section"><div className="qr-frame"><QRCodeCanvas value="https://card.latimorelifelegacy.com/pahs" size={130} fgColor="#2C3E50" bgColor="#FFFFFF" includeMargin /></div><span className="qr-url">card.latimorelifelegacy.com/pahs</span></div>
        </div>
      </section>

      <section className="cta-strip reveal">
        <h2>GET YOUR FREE PROTECTION REVIEW</h2>
        <p>No pressure. Just clarity. One conversation can change your family's future.</p>
        <div className="cta-buttons"><a href="#intakeFormSection" className="btn-primary"><i className="fas fa-clipboard-list" />Start My Free Review</a><a href="tel:+17176152613" className="btn-secondary"><i className="fas fa-phone" />Call Jackson Direct</a></div>
      </section>

      <section className="intake-section" id="intakeFormSection">
        <div className="intake-inner reveal">
          <div className="section-label">Take Action</div><h2>Claim Your Free Consultation</h2>
          <p>Whether you're redeeming your Football Game Day Coupon or simply want to review your protection, take the first step toward securing your family's future. Fill out the form below.</p>
          <div className="intake-box">
            {leadStatus !== 'success' ? (
              <form className="intake-form" onSubmit={submitLead}>
                <div className="form-row"><div className="form-group"><label htmlFor="ifName">Full Name *</label><input id="ifName" className="form-control" placeholder="John Doe" required value={lead.name} onChange={e => setLead({ ...lead, name: e.target.value })} /></div><div className="form-group"><label htmlFor="ifPhone">Phone Number *</label><input id="ifPhone" className="form-control" placeholder="(555) 555-5555" required value={lead.phone} onChange={e => setLead({ ...lead, phone: e.target.value })} /></div></div>
                <div className="form-row"><div className="form-group"><label htmlFor="ifEmail">Email Address</label><input id="ifEmail" type="email" className="form-control" placeholder="john@example.com" value={lead.email} onChange={e => setLead({ ...lead, email: e.target.value })} /></div><div className="form-group"><label htmlFor="ifPromo">Coupon / Promo Code</label><input id="ifPromo" className="form-control" placeholder="e.g. ID#2777749" value={lead.promo} onChange={e => setLead({ ...lead, promo: e.target.value })} /></div></div>
                <div className="form-group"><label htmlFor="ifInterest">What are you most interested in? *</label><select id="ifInterest" className="form-control" required value={lead.interest} onChange={e => setLead({ ...lead, interest: e.target.value })}><option value="" disabled>Select an option...</option><option>Life Insurance & Living Benefits</option><option>Retirement & Annuities</option><option>Legacy & Estate Planning</option><option>Mortgage Protection</option><option>General Financial Review</option></select></div>
                <button type="submit" disabled={leadStatus === 'submitting'} className="btn-primary" style={{ width: '100%', marginTop: 10 }}><i className="fas fa-paper-plane" />{leadStatus === 'submitting' ? 'Submitting...' : 'Request My Free Review'}</button>
                {leadStatus === 'error' && <div className="error-msg">{leadError}</div>}
              </form>
            ) : <div className="success-msg"><i className="fas fa-check-circle" /><div><strong>Thank you!</strong> Your request was received. Jackson will follow up soon.</div></div>}
            <a href="https://latimorelifelegacy.fillout.com/latimorelifelegacy" className="intake-external-link" target="_blank" rel="noopener">Prefer our detailed intake questionnaire? Click here.</a>
          </div>

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
