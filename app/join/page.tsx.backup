'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import Script from 'next/script'

const navy = '#0E1A2B'
const gold = '#C9A24D'
const goldLight = '#E5C882'

const navLinks: [string, string][] = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/products', 'Products'],
  ['/services', 'Services'],
  ['/education', 'Education'],
  ['/join', 'Join Our Team'],
  ['/contact', 'Contact'],
]

function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <nav style={{ background: navy, padding: '1rem 0', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
          <img src="/logo.jpg" alt="Logo" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
          Latimore Life & Legacy
        </Link>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }} className="desktop-nav">
          {navLinks.map(([href, label]) => (
            <Link key={href} href={href} style={{ color: href === '/join' ? goldLight : '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: href === '/join' ? 600 : 400 }}>{label}</Link>
          ))}
          <a href={BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" style={{ background: gold, color: navy, padding: '0.5rem 1rem', borderRadius: 5, fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Book Consultation</a>
          <a href={BRAND.ethosUrl} target="_blank" rel="noopener noreferrer" style={{ background: goldLight, color: navy, padding: '0.5rem 1rem', borderRadius: 5, fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>Get Quote</a>
        </div>
        <button onClick={() => setOpen(!open)} style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }} className="mobile-btn">{open ? '✕' : '☰'}</button>
      </div>
      {open && (
        <div style={{ background: navy, padding: '1rem 20px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {navLinks.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{ color: href === '/join' ? goldLight : '#fff', textDecoration: 'none', fontSize: '1.1rem' }}>{label}</Link>
          ))}
          <a href={BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" style={{ background: gold, color: navy, padding: '0.75rem', borderRadius: 5, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Book Consultation</a>
          <a href={BRAND.ethosUrl} target="_blank" rel="noopener noreferrer" style={{ background: goldLight, color: navy, padding: '0.75rem', borderRadius: 5, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>Get Quote</a>
        </div>
      )}
      <style>{`@media(max-width:900px){.desktop-nav{display:none !important;}.mobile-btn{display:block !important;}}`}</style>
    </nav>
  )
}

function Footer() {
  return (
    <footer style={{ background: navy, color: 'rgba(255,255,255,0.7)', padding: '3rem 0 1.5rem', marginTop: '4rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
        <div>
          <h4 style={{ color: goldLight, marginBottom: '1rem', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase' }}>Latimore Life & Legacy LLC</h4>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>Independent Insurance Advisor<br />{BRAND.affiliation}</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>PA License #{BRAND.paLicense} · NIPR #{BRAND.nipr}</p>
        </div>
        <div>
          <h4 style={{ color: goldLight, marginBottom: '1rem', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase' }}>Quick Links</h4>
          {navLinks.map(([href, label]) => (
            <div key={href} style={{ marginBottom: '0.4rem' }}>
              <Link href={href} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem' }}>{label}</Link>
            </div>
          ))}
        </div>
        <div>
          <h4 style={{ color: goldLight, marginBottom: '1rem', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase' }}>Contact</h4>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>
            <a href={`tel:+1${BRAND.phoneRaw}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{BRAND.phone}</a><br />
            <a href={`mailto:${BRAND.email}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{BRAND.email}</a><br />
            1544 Route 61 Hwy S, Ste 6104<br />Pottsville, PA 17901
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <a href={BRAND.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: goldLight, textDecoration: 'none', fontSize: '0.85rem' }}>LinkedIn</a>
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" style={{ color: goldLight, textDecoration: 'none', fontSize: '0.85rem' }}>Instagram</a>
            <a href={BRAND.facebook} target="_blank" rel="noopener noreferrer" style={{ color: goldLight, textDecoration: 'none', fontSize: '0.85rem' }}>Facebook</a>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '2rem auto 0', padding: '1.5rem 20px 0', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
        © {new Date().getFullYear()} Latimore Life & Legacy LLC · All rights reserved · {BRAND.tagline} · {BRAND.hashtag}
      </div>
    </footer>
  )
}

const services = [
  { title: 'Tax-Advantaged Wealth Accumulation', sub: 'Build assets efficiently using tax-deferred and tax-favored strategies.' },
  { title: 'Asset Protection & Qualified Plan Rollovers', sub: 'Protect wealth and transition 401(k), 403(b), and pension assets.' },
  { title: 'College Education Funds', sub: 'Planning and funding solutions for future education costs.' },
  { title: 'Debt Management & Consolidation', sub: 'Strategies to reduce and restructure high-interest obligations.' },
  { title: 'Infinite Banking & Family Banks', sub: 'Personal and family financing systems using specialized designs.' },
  { title: 'Life Insurance, Living Benefits & Final Expense', sub: 'Protection for income, emergencies, and end-of-life costs.' },
  { title: 'Estate & Legacy Planning', sub: 'Transfer wealth and address potential estate tax issues.' },
  { title: 'Indexed Growth (Roth, SEP & Traditional IRA)', sub: 'Market-linked strategies with downside protection.' },
  { title: 'Mortgage Protection Term', sub: 'Help families stay in their homes if a wage earner passes away.' },
  { title: 'Business Owner Strategies', sub: 'Key-person insurance and continuity-focused protection.' },
]

export default function JoinPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${navy} 0%, #1a2942 100%)`, color: '#fff', padding: '5rem 0 4rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ color: goldLight, fontWeight: 600, letterSpacing: 2, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Careers & Opportunities</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', lineHeight: 1.2, marginBottom: '1.5rem' }}>
            Join Our Mission at<br /><span style={{ color: goldLight }}>Latimore Life & Legacy</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.8 }}>
            We don't just sell insurance — we protect families and build legacies. If you want to make a real difference in your community while building a rewarding career, this is your opportunity.
          </p>
          <a href="#apply" style={{ display: 'inline-block', background: gold, color: navy, padding: '0.9rem 2.2rem', borderRadius: 6, fontWeight: 700, textDecoration: 'none', fontSize: '1rem', marginRight: '1rem' }}>Apply Now</a>
          <a href={BRAND.ethosUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'transparent', color: goldLight, padding: '0.9rem 2.2rem', borderRadius: 6, fontWeight: 600, textDecoration: 'none', fontSize: '1rem', border: `2px solid ${goldLight}` }}>Apply Through Ethos</a>
        </div>
      </section>

      {/* Mission Quote */}
      <section style={{ background: '#f0f4f8', padding: '2.5rem 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', borderLeft: `5px solid ${gold}`, paddingLeft: '2rem' }}>
          <p style={{ fontSize: '1.25rem', fontStyle: 'italic', color: navy, lineHeight: 1.7, margin: 0 }}>
            "Helping you become legacy ready isn't just my passion — it's my purpose."
          </p>
          <p style={{ color: '#555', marginTop: '0.75rem', fontWeight: 600 }}>— Jackson M. Latimore Sr., Founder & CEO</p>
        </div>
      </section>

      {/* Why Join */}
      <section style={{ padding: '4rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ color: navy, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '2.5rem', textAlign: 'center' }}>Why Join Our Team?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '🎯', title: 'Purpose-Driven Work', items: ['Help families protect what matters most', 'Guide clients through financial protection planning', 'Build lasting relationships rooted in trust'] },
              { icon: '📈', title: 'Career Growth', items: ['No prior experience required — training provided', 'Pathway from agent to leadership roles', "Backed by Global Financial Impact's support systems"] },
              { icon: '🗓️', title: 'Flexibility & Independence', items: ['Work-from-anywhere opportunities', 'Set your own schedule', 'Build your own book of business with guidance'] },
            ].map(({ icon, title, items }) => (
              <div key={title} style={{ background: '#f8fafc', borderRadius: 12, padding: '2rem', border: `1px solid #e2e8f0` }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
                <h3 style={{ color: navy, fontSize: '1.1rem', marginBottom: '1rem' }}>{title}</h3>
                <ul style={{ paddingLeft: '1.2rem', color: '#444', lineHeight: 1.8 }}>
                  {items.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We're Looking For */}
      <section style={{ padding: '4rem 0', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ color: navy, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '2rem', textAlign: 'center' }}>Who We Are Looking For</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <thead>
                <tr>
                  <th style={{ background: navy, color: '#fff', padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600 }}>Ideal Candidate Traits</th>
                  <th style={{ background: navy, color: '#fff', padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600 }}>What We Offer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Self-motivated and goal-oriented', 'Full training and licensing support'],
                  ['Strong communication skills', 'Competitive commission structure'],
                  ['Compassionate and trustworthy', 'Mentorship from experienced producers'],
                  ['Community-focused', 'Access to diverse product portfolio'],
                ].map(([trait, offer], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                    <td style={{ padding: '1rem 1.5rem', color: '#333' }}>{trait}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#333' }}>{offer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* What You'll Help Clients Achieve */}
      <section style={{ padding: '4rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ color: navy, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '0.5rem', textAlign: 'center' }}>What You Will Help Clients Achieve</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '2.5rem' }}>Our agents are trained to deliver across three core areas of financial planning.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[
              { title: 'Wealth Accumulation & Growth', color: '#e8f4fd', border: '#bee3f8', items: ['Tax-Advantaged Wealth Accumulation: Tax-deferred and tax-free strategies to build assets.', 'Indexed Growth Strategies: Market-linked growth with downside protection, including Roth, SEP, and Traditional IRAs.', 'Infinite Banking & Family Banks: Specialized strategies for personal and familial financing.'] },
              { title: 'Protection & Risk Management', color: '#fef9e7', border: '#fde68a', items: ['Life Insurance & Living Benefits: Income replacement, final expense, and critical illness benefits.', 'Mortgage Protection: Help families remain in their homes after a primary earner\'s death or disability.', 'Asset Protection: Safeguard wealth and execute qualified plan rollovers (401k, 403b, pensions).'] },
              { title: 'Planning & Management', color: '#f0fdf4', border: '#bbf7d0', items: ['Debt Management: Consolidation strategies focused on eliminating high-interest debt.', 'College Education Funding: Plans that avoid high-interest debt for future education.', 'Estate & Legacy Planning: Wealth transfer solutions and estate tax mitigation.', 'Business Owner Strategies: Key-person insurance and business continuity planning.'] },
            ].map(({ title, color, border, items }) => (
              <div key={title} style={{ background: color, border: `1px solid ${border}`, borderRadius: 12, padding: '1.75rem' }}>
                <h3 style={{ color: navy, fontSize: '1.05rem', marginBottom: '1rem' }}>{title}</h3>
                <ul style={{ paddingLeft: '1.2rem', color: '#444', lineHeight: 1.9, fontSize: '0.92rem' }}>
                  {items.map(item => <li key={item} style={{ marginBottom: '0.4rem' }}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Service Menu */}
      <section style={{ padding: '4rem 0', background: '#f0f4f8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ color: navy, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '0.5rem', textAlign: 'center' }}>Client Service Menu</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '2.5rem' }}>Core services our agents deliver for families, pre-retirees, and business owners.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {services.map(({ title, sub }) => (
              <div key={title} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontWeight: 700, color: navy, marginBottom: '0.4rem', fontSize: '0.92rem' }}>{title}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Details */}
      <section style={{ padding: '4rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ color: navy, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '2rem', textAlign: 'center' }}>Available Opportunity: Insurance Producer / Agent</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="role-grid">
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ color: navy, marginBottom: '1rem' }}>Responsibilities</h3>
              <ul style={{ paddingLeft: '1.2rem', color: '#444', lineHeight: 1.9 }}>
                <li>Educate families on comprehensive financial protection strategies</li>
                <li>Conduct client needs assessments across wealth, risk, and legacy planning</li>
                <li>Build and maintain policyholder relationships</li>
                <li>Ensure compliance with state licensing requirements</li>
              </ul>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ color: navy, marginBottom: '1rem' }}>Requirements</h3>
              <ul style={{ paddingLeft: '1.2rem', color: '#444', lineHeight: 1.9 }}>
                <li>High school diploma or equivalent (college degree preferred)</li>
                <li>Willingness to obtain life & health insurance license</li>
                <li>Energetic, self-starting personality</li>
                <li>Strong desire to help others build and protect their wealth</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Apply Section */}
      <section id="apply" style={{ padding: '4rem 0', background: `linear-gradient(135deg, ${navy} 0%, #1a2942 100%)` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '0.5rem', textAlign: 'center' }}>Ready to Start Your Legacy?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: '2.5rem' }}>Complete the application below and we will be in touch.</p>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '100%', minHeight: 500 }} data-fillout-id="tMz7ZcqpaZus" data-fillout-embed-type="standard" data-fillout-inherit-parameters data-fillout-dynamic-resize />
            <Script src="https://server.fillout.com/embed/v1/" strategy="lazyOnload" />
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <a href={BRAND.ethosUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: gold, color: navy, padding: '0.9rem 2.5rem', borderRadius: 6, fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>Apply Through Ethos Instead</a>
          </div>
        </div>
      </section>

      {/* Contact Bar */}
      <section style={{ padding: '3rem 0', background: '#f8fafc' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: navy, marginBottom: '0.75rem' }}>Contact Jackson M. Latimore Sr.</h3>
            <p style={{ color: '#555', lineHeight: 1.9, fontSize: '0.92rem' }}>
              📍 1544 Route 61 Hwy S, Ste 6104, Pottsville, PA 17901<br />
              📧 <a href={`mailto:${BRAND.email}`} style={{ color: navy }}>{BRAND.email}</a><br />
              📱 <a href={`tel:+1${BRAND.phoneRaw}`} style={{ color: navy }}>{BRAND.phone}</a><br />
              🌐 <a href={BRAND.cardUrl} target="_blank" rel="noopener noreferrer" style={{ color: navy }}>Digital Business Card</a>
            </p>
          </div>
          <div>
            <h4 style={{ color: navy, marginBottom: '0.75rem' }}>Connect</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href={BRAND.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: navy, textDecoration: 'none', fontWeight: 600 }}>💼 LinkedIn</a>
              <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" style={{ color: navy, textDecoration: 'none', fontWeight: 600 }}>📸 Instagram</a>
              <a href={BRAND.facebook} target="_blank" rel="noopener noreferrer" style={{ color: navy, textDecoration: 'none', fontWeight: 600 }}>👍 Facebook</a>
            </div>
          </div>
        </div>
      </section>

      {/* Tagline */}
      <section style={{ padding: '2rem 0', background: navy, textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', margin: 0 }}>
          <em>{BRAND.tagline} {BRAND.hashtag}</em>
        </p>
        <p style={{ color: goldLight, fontWeight: 700, marginTop: '0.5rem' }}>
          Latimore Life & Legacy LLC — Building Wealth, Preserving Futures, Creating Legacies.
        </p>
      </section>

      <Footer />

      <style>{`
        @media(max-width:700px){
          .role-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
