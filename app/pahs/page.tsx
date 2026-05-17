'use client';

import './pahs.css';
import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Image from 'next/image';

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data as T;
}

export default function PAHSPage() {
  const [legacyRecipient, setLegacyRecipient] = useState('');
  const [legacyMessage, setLegacyMessage] = useState('');
  const [legacyTone, setLegacyTone] = useState('Heartfelt and loving');
  const [legacyOutput, setLegacyOutput] = useState('');
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [legacyError, setLegacyError] = useState('');

  const [jargon, setJargon] = useState('');
  const [jargonOutput, setJargonOutput] = useState('');
  const [jargonLoading, setJargonLoading] = useState(false);
  const [jargonError, setJargonError] = useState('');

  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    const onScroll = () => setShowSticky(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const handleFilloutMessage = async (e: MessageEvent) => {
      if (
        e.data?.type === 'fillout:submission' ||
        e.data?.type === 'submitted' ||
        e.data?.event === 'submitted' ||
        e.data?.event === 'fillout:submission'
      ) {
        const payload = e.data?.submission ?? e.data ?? {};
        // Track to Supabase
        try {
          await fetch('/api/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
              eventType: 'form_submit',
              pageUrl: window.location.href,
              source: 'pahs',
              medium: 'qr',
              campaign: 'football2026',
              productInterest: 'General',
              county: 'Schuylkill',
              metadata: { provider: 'fillout', form: 'pahs', ...payload },
            }),
          });
        } catch { /* swallow */ }
        // Track to GA4
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'form_submit', {
            event_category: 'PAHS',
            event_label: 'PAHS Free Consultation Form',
            source: 'pahs_qr',
          });
        }
      }
    };
    window.addEventListener('message', handleFilloutMessage);

    return () => {
      revealObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('message', handleFilloutMessage);
    };
  }, []);

  async function generateLegacyLetter() {
    setLegacyLoading(true);
    setLegacyError('');
    setLegacyOutput('');
    try {
      const data = await postJson<{ text: string }>('/api/gemini/legacy-letter', {
        recipient: legacyRecipient || 'My Loved Ones',
        message: legacyMessage || 'I want you to know how much I love you and that I will always be looking out for you.',
        tone: legacyTone,
      });
      setLegacyOutput(data.text);
    } catch (err) {
      setLegacyError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLegacyLoading(false);
    }
  }

  async function translateJargon() {
    if (!jargon.trim()) return;
    setJargonLoading(true);
    setJargonError('');
    setJargonOutput('');
    try {
      const data = await postJson<{ text: string }>('/api/gemini/jargon', { jargon });
      setJargonOutput(data.text);
    } catch (err) {
      setJargonError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setJargonLoading(false);
    }
  }

  async function copyLegacyLetter() {
    await navigator.clipboard.writeText(legacyOutput);
  }

  return (
    <main>
      <section style={{ padding: '1.5rem 1rem 0', background: '#0b1017', textAlign: 'center' }}>
        <Image src="/pahs-2005-allarea.png" alt="2005: Cardinal Brennan All-Area Football — Where the Journey Began" width={480} height={480} priority style={{ width: '100%', maxWidth: 480, height: 'auto', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', margin: '0 auto', display: 'block' }} />
      </section>

      <section className="hero">
        <div className="hero-bg" />
        <div className="stadium-lights">{Array.from({ length: 6 }).map((_, i) => <div className="light-beam" key={i} />)}</div>
        <div className="field-bottom">
          <div className="field-lines">
            <div className="field-line" /><div className="field-line" /><div className="field-line" />
            <span className="yard-number left">2</span><span className="yard-number center">5 0</span><span className="yard-number right">6</span>
          </div>
        </div>

        <div className="hero-content">
          <div className="sponsor-badge" style={{ fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', fontWeight: 900, letterSpacing: '0.08em', padding: '10px 28px' }}>PROUD SPONSOR OF</div>
          <div className="hero-school-name">POTTSVILLE AREA<br />HIGH SCHOOL</div>
          <div className="hero-year">FOOTBALL '26</div>
          <div className="pulse-badge"><div className="pulse-dot" />CRIMSON TIDE — GAME DAY</div>
          <div className="football-icon">🏈</div>
          <div className="logos-row">
            <div className="tide-logo-container"><Image src="/pahs-tide-logo.png" alt="Pottsville Crimson Tide" width={110} height={110} /></div>
            <div className="logo-divider" />
            <div className="latimore-logo-container"><Image src="/pahs-latimore-logo.png" alt="Latimore Life & Legacy LLC" width={160} height={120} /></div>
          </div>
          <div className="beat-img-wrap"><Image src="/pahs-protect-go.png" alt="Protect What You Play For — Latimore Life & Legacy" width={340} height={340} style={{ width: '100%', height: 'auto', borderRadius: 8 }} /></div>
          <div className="qr-section"><div className="qr-frame"><QRCodeCanvas value="https://www.latimorelifelegacy.com" size={130} fgColor="#2C3E50" bgColor="#FFFFFF" includeMargin /></div><span className="qr-url">www.latimorelifelegacy.com</span></div>
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
          <p>Whether you're redeeming your Football Game Day Coupon or simply want to review your protection, take the first step toward securing your family's future.</p>
          <iframe src="https://latimorelifelegacy.fillout.com/pahs?embed=1" width="100%" style={{ border: 'none', minHeight: 700, display: 'block', borderRadius: 12 }} title="PAHS Free Consultation Form" />
        </div>
      </section>

      <section className="story-section"><div className="story-inner reveal"><div className="section-label">Our Story</div><h2>A Saved Life Became<br />A <em>Mission</em></h2><div className="date-callout"><div className="date">December 7, 2010</div><p>Jackson M. Latimore Sr. collapsed from sudden cardiac arrest at ESU's Koehler Fieldhouse — and was saved by an AED placed by the Gregory W. Moyer Defibrillator Fund, honoring a 15-year-old boy who died from the same cause.</p></div><p className="story-text">That moment — watching a prepared community save a life — is the heartbeat behind everything we do at <strong>Latimore Life & Legacy LLC.</strong></p><p className="story-text">We don't sell fear. We help <strong>families in Schuylkill, Luzerne, and Northumberland counties</strong> prepare for life's uncertainties with clarity and confidence — because legacy isn't just what you leave behind. It's how you show up today.</p><p className="story-text">Supporting PAHS football is just one way we put our mission into action — <strong>right here, in our community.</strong></p>
        <span className="hashtag">#TheBeatGoesOn &nbsp;🏈&nbsp; #LatimoreLifeAndLegacy</span></div></section>

      <section className="services-section"><div className="services-inner reveal"><div className="section-label">What We Do</div><h2>Your Complete<br />Financial Protection Team</h2><p className="services-subtitle">From your first policy to your retirement paycheck — we've got Central Pennsylvania covered.</p><div className="services-grid">{[['fa-shield-heart','Life Insurance & Living Benefits'],['fa-piggy-bank','Retirement Income & Annuities'],['fa-chart-line','Indexed Growth & IRA Strategies'],['fa-scroll','Estate & Legacy Planning'],['fa-building','Business Owner & Key Person'],['fa-house','Mortgage Protection Term']].map(([icon,title]) => <div className="service-card" key={title}><div className="service-icon"><i className={`fas ${icon}`} /></div><h3>{title}</h3></div>)}</div></div></section>
      <section className="territory-section"><div className="territory-inner reveal"><h3>Serving</h3><p>Schuylkill · Luzerne · Northumberland</p><p className="county-detail">560,000+ residents across Central Pennsylvania</p><div className="tide-pride"><i className="fas fa-football-ball" />GO CRIMSON TIDE</div></div></section>

      <section className="legacy-section"><div className="legacy-inner reveal"><div className="section-label" style={{ justifyContent: 'center', color: 'var(--gold)' }}>Free Digital Tool</div><h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: 'clamp(1.5rem, 6vw, 2.1rem)', color: 'var(--white)', textAlign: 'center', marginBottom: 8 }}>Draft Your Legacy Letter</h2><p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Financial protection is only half the equation. Leave behind your wisdom, values, and love. Use our AI assistant to help you draft a meaningful letter to your loved ones.</p><div className="legacy-box"><div className="form-group"><label htmlFor="llRecipient">To Who?</label><input id="llRecipient" className="form-control" placeholder="e.g., My children, Sarah and Michael" value={legacyRecipient} onChange={e => setLegacyRecipient(e.target.value)} /></div><div className="form-group"><label htmlFor="llMessage">Core Values or Lesson</label><textarea id="llMessage" className="form-control" placeholder="e.g., Always support each other, remember the importance of community, and never give up." value={legacyMessage} onChange={e => setLegacyMessage(e.target.value)} /></div><div className="form-group"><label htmlFor="llTone">Tone</label><select id="llTone" className="form-control" value={legacyTone} onChange={e => setLegacyTone(e.target.value)}><option>Heartfelt and loving</option><option>Encouraging and inspiring</option><option>Wise and reflective</option></select></div><button className="btn-gemini" disabled={legacyLoading} onClick={generateLegacyLetter}>{legacyLoading ? 'Drafting...' : '✨ Draft My Legacy Letter ✨'}</button>{legacyError && <div className="error-msg">{legacyError}</div>}{legacyOutput && <div className="letter-output-container quoted"><div className="letter-content">{legacyOutput}</div><button className="copy-btn" onClick={copyLegacyLetter}><i className="fas fa-copy" />Copy to Clipboard</button></div>}</div></div></section>

      <section className="legacy-section" style={{ background: 'linear-gradient(135deg, #111a22 0%, #1a2632 100%)' }}><div className="legacy-inner reveal"><div className="section-label" style={{ justifyContent: 'center', color: 'var(--gold)' }}>Free Digital Tool</div><h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: 'clamp(1.5rem, 6vw, 2.1rem)', color: 'var(--white)', textAlign: 'center', marginBottom: 8 }}>Insurance Jargon Translator</h2><p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Insurance policies can be confusing. Paste a complicated term or phrase below, and our AI assistant will explain it in simple, plain English.</p><div className="legacy-box"><div className="form-group"><label htmlFor="jargonInput">Confusing Term or Phrase</label><textarea id="jargonInput" className="form-control" style={{ minHeight: 60 }} placeholder="e.g., Return of Premium Term or Accelerated Death Benefit Rider" value={jargon} onChange={e => setJargon(e.target.value)} /></div><button className="btn-gemini" disabled={jargonLoading} onClick={translateJargon}>{jargonLoading ? 'Translating...' : '✨ Translate to Plain English ✨'}</button>{jargonError && <div className="error-msg">{jargonError}</div>}{jargonOutput && <div className="letter-output-container"><div className="letter-content" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem' }}>{jargonOutput}</div></div>}</div></div></section>

      <section className="contact-section"><div className="contact-inner reveal"><div className="section-label">Let's Connect</div><h2>Start the Conversation</h2><p>A 15-minute call is all it takes to know exactly where you stand.</p><div className="contact-cards">{[
        ['#intakeFormSection','fa-clipboard-list','Free Protection Review','Get Started — Takes 2 Min',''],['tel:+17176152613','fa-phone','Call Jackson Direct','(717) 615-2613',''],['mailto:Jackson1989@latimorelegacy.com','fa-envelope','Email Jackson','Jackson1989@latimorelegacy.com',''],['https://agents.ethoslife.com/invite/29ad1','fa-file-contract','Get a Term Life Quote','Apply Online via Ethos','target'],['https://www.instagram.com/jacksonlatimore.global?igsh=MTI5N25yNzR4emlieQ==','fab fa-instagram','Follow on Instagram','@jacksonlatimore.global','target'],['https://www.facebook.com/LatimoreLegacyLLC/','fab fa-facebook-f','Follow on Facebook','@LatimoreLegacyLLC','target'],['https://www.linkedin.com/in/startwithjacksongfi?trk=contact-info','fab fa-linkedin-in','Connect on LinkedIn','Jackson M. Latimore Sr.','target']].map(([href, icon, label, value, target]) => <a href={href} className="contact-card" key={label} target={target ? '_blank' : undefined} rel={target ? 'noopener' : undefined}><div className="contact-card-icon"><i className={icon.startsWith('fab') ? icon : `fas ${icon}`} /></div><div className="contact-card-text"><div className="contact-card-label">{label}</div><div className="contact-card-value">{value}</div></div><span className="contact-card-arrow"><i className="fas fa-chevron-right" /></span></a>)}</div><a href="#intakeFormSection" className="btn-primary" style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}><i className="fas fa-shield-heart" />Get My Free Protection Review</a></div></section>

      <section style={{ padding: '2rem 1rem', background: '#0b1017', textAlign: 'center' }}>
        <Image src="/pahs-sponsor-flyer.jpg" alt="Latimore Life & Legacy — Official All-Star Sponsor of the Pottsville Area Crimson Tide" width={480} height={600} style={{ width: '100%', maxWidth: 480, height: 'auto', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', margin: '0 auto', display: 'block' }} />
      </section>

      <footer className="footer"><a href="https://www.latimorelifelegacy.com" target="_blank" rel="noopener" style={{ textDecoration: 'none' }}><div className="footer-logo">LATIMORE LIFE & LEGACY LLC</div></a><div className="footer-tagline">Protecting Today. Securing Tomorrow.</div><div className="footer-hashtag">#TheBeatGoesOn · #LifeHappensLegacyIsPlanned</div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}><a href="tel:+17176152613"><i className="fas fa-phone" /></a><a href="mailto:Jackson1989@latimorelegacy.com"><i className="fas fa-envelope" /></a><a href="https://www.facebook.com/LatimoreLegacyLLC/" target="_blank" rel="noopener"><i className="fab fa-facebook-f" /></a><a href="https://www.instagram.com/jacksonlatimore.global?igsh=MTI5N25yNzR4emlieQ==" target="_blank" rel="noopener"><i className="fab fa-instagram" /></a><a href="https://www.linkedin.com/in/startwithjacksongfi?trk=contact-info" target="_blank" rel="noopener"><i className="fab fa-linkedin-in" /></a><a href="https://agents.ethoslife.com/invite/29ad1" target="_blank" rel="noopener"><i className="fas fa-file-contract" /></a></div><div className="footer-disclaimer">Jackson M. Latimore Sr. · Latimore Life & Legacy LLC · Independent Insurance Consultant<br />Licensed in Pennsylvania · NIPR #21638507 · PA D.O.I. License #1268820<br />Schuylkill · Luzerne · Northumberland Counties · <a href="https://www.latimorelifelegacy.com" target="_blank" rel="noopener">www.latimorelifelegacy.com</a><br /><br />Life insurance and annuity products are subject to underwriting approval. Rates and availability vary by individual factors. Insurance products are not deposits, not FDIC insured, not guaranteed by any bank, and may be subject to limitations, exclusions, underwriting, carrier approval, surrender charges, and market-value adjustments where applicable. This page is intended for informational purposes and does not constitute financial, legal, or tax advice. Proud sponsor of Pottsville Area High School Football 2026.</div></footer>

      <div className={`sticky-cta ${showSticky ? 'show' : ''}`}><div className="sticky-cta-text"><span>Free</span> Protection Review</div><a href="#intakeFormSection" className="sticky-btn">Start Now</a></div>
    </main>
  );
}
