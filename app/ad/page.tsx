import type { Metadata } from 'next'
import { BRAND } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Latimore Life & Legacy LLC | Financial Education Ad',
  description: 'Protecting Today. Securing Tomorrow. Life, Health, Accident & Annuity guidance from Jackson M. Latimore Sr.',
}

export default function AdPage() {
  return (
    <div className="ad-page">
      <div className="ad-wrapper">

        <div className="top-tagline">{BRAND.tagline}</div>

        <div className="company-name">{BRAND.fullName}</div>
        <div className="company-sub">Life &amp; Legacy &nbsp;&middot;&nbsp; Protection &nbsp;&middot;&nbsp; Purpose</div>

        <div className="service-banner">Life &nbsp;|&nbsp; Health &nbsp;|&nbsp; Accident &nbsp;|&nbsp; Annuities</div>

        <div className="main-row">

          <div className="left-col">
            <h2>Financial Education Builds Stronger Families</h2>
            <p>
              Life insurance isn&apos;t just about money — it&apos;s about love. It&apos;s the promise you make to the people who depend on you, ensuring that no matter what happens, they will be taken care of. It&apos;s one of the most powerful acts of love a person can demonstrate.
            </p>
            <p>
              It&apos;s about responsibility. Protecting your family means planning ahead — not waiting until it&apos;s too late. A solid life insurance plan gives your loved ones the financial stability they need to grieve, heal, and move forward without the added burden of financial stress.
            </p>
            <p>
              It&apos;s about legacy. The decisions you make today shape the opportunities your children and grandchildren will have tomorrow. Life insurance is a cornerstone of generational wealth — a gift that keeps giving long after you&apos;re gone.
            </p>
          </div>

          <div className="col-divider" />

          <div className="right-col">
            <div className="founder-label">— Meet the Founder —</div>

            <div className="founder-photo">
              <img src="/jackson-founder-photo.jpg" alt="Jackson M. Latimore Sr." />
            </div>

            <div className="founder-name">Jackson M. Latimore Sr.</div>
            <p>
              Jackson M. Latimore Sr. is dedicated to helping individuals and families protect what matters most. With a passion for financial literacy and a commitment to personalized service, he brings clarity and confidence to every conversation.
            </p>
            <p>
              Through education-first guidance and customized solutions, Jackson empowers clients to make informed decisions that protect their present and secure their future.
            </p>
            <p className="founder-tagline">&quot;Real guidance. Real protection. Real impact.&quot;</p>
          </div>

        </div>

        <div className="gold-divider" />

        <div className="pillars-section">
          <div className="pillars-grid">

            <div className="pillar">
              <div className="pillar-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <h3>Protect What Matters Most</h3>
              <p>Your family is your greatest asset. Life insurance ensures that the people you love are financially protected when they need it most — providing peace of mind for you and security for them.</p>
              <p className="pillar-italic">&quot;Because love means planning ahead.&quot;</p>
            </div>

            <div className="pillar">
              <div className="pillar-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 1-1 1-3 1-3-7 0-9 5-9 5 1-1 3-1 3-1-4 4-3 9-3 9 1-2 3-3 3-3 0 4 2 6 2 6 1-3 3-5 3-5 0 3 1 5 1 5 2-4 2-8 2-8z" />
                </svg>
              </div>
              <h3>Build a Legacy That Lasts</h3>
              <p>True wealth is measured not just in what you accumulate, but in what you leave behind. A thoughtful life insurance strategy helps you build generational wealth and create opportunities for those who come after you.</p>
              <p className="pillar-italic">&quot;Your legacy begins with a single decision.&quot;</p>
            </div>

            <div className="pillar">
              <div className="pillar-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
                </svg>
              </div>
              <h3>Start Early. Live Confidently.</h3>
              <p>The earlier you start, the more you save — and the more protected your family becomes. Financial education empowers you to make smart decisions today that will pay dividends for decades to come.</p>
              <p className="pillar-italic">&quot;Knowledge is the foundation of lasting protection.&quot;</p>
            </div>

          </div>
        </div>

        <div className="gold-divider" />

        <div className="cta-section">

          <div className="quote-block">
            <blockquote>Education opens doors to smarter protection</blockquote>
          </div>

          <div className="cta-block">
            <h3>Schedule Your Free Consultation</h3>
            <div className="cta-contact">
              <a href={`tel:+1${BRAND.phoneRaw}`}>
                <svg className="cta-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                {BRAND.phone}
              </a>
              <a href={`mailto:${BRAND.email}`}>
                <svg className="cta-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                {BRAND.email}
              </a>
              <span>
                <svg className="cta-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                www.latimorelifelegacy.com
              </span>
            </div>
          </div>

        </div>

        <div className="footer">{BRAND.hashtag}</div>

      </div>

      <style>{`
        .ad-page {
          font-family: 'Open Sans', sans-serif;
          background: #f0f0f0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 30px 10px;
        }

        .ad-wrapper {
          width: 900px;
          max-width: 100%;
          background: #fff;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18);
        }

        .top-tagline {
          background: #fff;
          text-align: center;
          padding: 14px 20px 6px;
          letter-spacing: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #b8972a;
          text-transform: uppercase;
        }

        .company-name {
          text-align: center;
          padding: 4px 20px 2px;
          font-family: 'Playfair Display', serif;
          font-size: 46px;
          font-weight: 900;
          color: #0d1f3c;
          line-height: 1.1;
        }

        .company-sub {
          text-align: center;
          font-size: 13px;
          letter-spacing: 3px;
          color: #0d1f3c;
          font-weight: 600;
          padding: 4px 0 10px;
          text-transform: uppercase;
        }

        .service-banner {
          background: #0d1f3c;
          color: #d4a82a;
          text-align: center;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .main-row {
          display: flex;
          padding: 36px 40px 30px;
          gap: 36px;
          background: #fff;
        }

        .left-col { flex: 1.1; }

        .left-col h2 {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 900;
          color: #0d1f3c;
          line-height: 1.25;
          margin-bottom: 18px;
        }

        .left-col p {
          font-size: 13px;
          color: #333;
          line-height: 1.75;
          margin-bottom: 13px;
        }

        .col-divider {
          width: 1px;
          background: #d4a82a;
          opacity: 0.5;
          flex-shrink: 0;
        }

        .right-col { flex: 0.9; }

        .founder-label {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #b8972a;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .founder-photo {
          width: 100%;
          height: 220px;
          border-radius: 4px;
          margin-bottom: 14px;
          overflow: hidden;
          background: #c8d8e8;
        }

        .founder-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }

        .founder-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #0d1f3c;
          margin-bottom: 6px;
        }

        .right-col p {
          font-size: 12.5px;
          color: #333;
          line-height: 1.7;
          margin-bottom: 10px;
        }

        .founder-tagline {
          font-style: italic;
          color: #b8972a !important;
          font-weight: 600;
          font-size: 13px !important;
        }

        .gold-divider {
          height: 3px;
          background: linear-gradient(to right, #0d1f3c, #d4a82a, #0d1f3c);
          margin: 0 40px;
        }

        .pillars-section {
          background: #0d1f3c;
          padding: 36px 40px;
        }

        .pillars-grid {
          display: flex;
          gap: 0;
        }

        .pillar {
          flex: 1;
          text-align: center;
          padding: 0 24px;
          position: relative;
        }

        .pillar:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 10%;
          height: 80%;
          width: 1px;
          background: rgba(212, 168, 42, 0.35);
        }

        .pillar-icon {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: #d4a82a;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pillar-icon svg {
          width: 34px;
          height: 34px;
          fill: #0d1f3c;
        }

        .pillar h3 {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 700;
          color: #d4a82a;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .pillar p {
          font-size: 12px;
          color: #c8d8e8;
          line-height: 1.7;
          margin-bottom: 10px;
        }

        .pillar .pillar-italic {
          font-style: italic;
          color: #d4a82a;
          font-size: 12px;
        }

        .cta-section {
          background: #fff;
          padding: 36px 40px;
          display: flex;
          gap: 40px;
          align-items: center;
        }

        .quote-block {
          flex: 1;
          border-left: 4px solid #d4a82a;
          padding-left: 20px;
        }

        .quote-block blockquote {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-style: italic;
          color: #0d1f3c;
          line-height: 1.4;
        }

        .quote-block blockquote::before {
          content: '\\201C';
          font-size: 48px;
          color: #d4a82a;
          line-height: 0;
          vertical-align: -18px;
          margin-right: 4px;
        }

        .cta-block {
          flex: 1;
          background: #0d1f3c;
          border-radius: 6px;
          padding: 24px 28px;
          text-align: center;
        }

        .cta-block h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #d4a82a;
          margin-bottom: 16px;
          font-weight: 700;
        }

        .cta-contact {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cta-contact a,
        .cta-contact span {
          color: #fff;
          font-size: 13px;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .cta-contact a:hover { color: #d4a82a; }

        .cta-icon {
          width: 18px;
          height: 18px;
          fill: #d4a82a;
          flex-shrink: 0;
        }

        .footer {
          background: #0d1f3c;
          text-align: center;
          padding: 14px 20px;
          color: #d4a82a;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 3px;
        }

        @media (max-width: 700px) {
          .main-row, .pillars-grid, .cta-section {
            flex-direction: column;
          }
          .col-divider {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
