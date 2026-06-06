'use client';

import { useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './pahs.css';

const SERVICES = [
  ['01', 'Life Insurance', 'Term and permanent coverage built for real family budgets.'],
  ['02', 'Living Benefits', 'Coverage that can pay while you are living after qualifying critical, chronic, or terminal illness.'],
  ['03', 'Indexed Universal Life', 'Tax-advantaged protection and growth potential with downside protection.'],
  ['04', 'Fixed Index Annuities', 'Retirement income strategies designed to help protect principal and create lifetime income.'],
  ['05', 'Estate & Legacy Planning', 'Guidance that helps families organize assets, wishes, and protection priorities.'],
  ['06', 'Mortgage Protection', 'Affordable coverage designed to help keep the family home protected.'],
];

const PILLARS = [
  ['Protecting Today', 'Life insurance and living-benefit solutions that safeguard the people depending on you right now.'],
  ['Securing Tomorrow', 'Annuities, IUL strategies, and income planning designed for long-term family stability.'],
  ['Serving Locally', 'Rooted in Schuylkill, Luzerne, and Northumberland Counties — not just selling, serving.'],
];

export default function PAHSPage() {
  useEffect(() => {
    const revealEls = document.querySelectorAll('.fu2');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => entry.target.classList.add('vis'), index * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    revealEls.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="pahs-v2">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-ov" />

        <div className="hero-c">
          <div className="sbadge">Proud All-Star Sponsor</div>

          <h1 className="hs">
            Pottsville Area
            <span>High School</span>
          </h1>

          <div className="hy">Crimson Tide · Class of ‘26</div>

          <div className="lhero">
            <img src="/pahs-latimore-logo.png" alt="Latimore Life & Legacy LLC" />
          </div>

          <svg className="hbeat" viewBox="0 0 200 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline
              points="0,15 34,15 42,4 48,26 54,10 60,20 66,15 100,15 108,2 116,28 122,8 128,22 134,15 200,15"
              stroke="#C49A6C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="tline">Protecting Today. Securing Tomorrow. #TheBeatGoesOn</div>

          <div className="ctas">
            <a className="btn1" href="#consult">Schedule Free Consultation</a>
            <a className="btn2" href="#story">The Full Circle Story ↓</a>
          </div>
        </div>

        <div className="scrollh">
          <span>Scroll</span>
          <div className="sarrow" />
        </div>
      </section>

      <section className="spgfx">
        <img src="/pahs-sponsor-flyer.png" alt="Proud All-Star Sponsor — Pottsville Area High School ‘26" />
      </section>

      <section className="campaign-videos">
        <div className="campaign-videos-inner fu2">
          <div className="seclab">Campaign Video</div>
          <h2 className="sect">Watch the <em>Campaign</em></h2>
          <div className="video-center-wrap">
            <iframe
              loading="lazy"
              src="https://www.canva.com/design/DAHLhIdBi1g/XrwK0tvOGXRX57S6xQtgdA/watch?embed"
              allowFullScreen
              allow="fullscreen"
              title="PAHS Campaign Video"
            />
          </div>
        </div>
      </section>

      <section className="story" id="story">
        <div className="si">
          <div className="fu2">
            <div className="slabel">The Full Circle Legacy</div>
            <div className="yb">2005 → 2026</div>
            <h2 className="sh2">
              From the Field
              <br />
              to the <em>Family</em>
            </h2>

            <p className="sbody">
              Jackson M. Latimore Sr. wore <strong>#20 for Cardinal Brennan</strong>, earning Republican & Herald All-Area Offensive Player of the Year honors in 2005. He knows what it means to compete in the Coal Region — the early mornings, the community that shows up, and the weight of a jersey.
            </p>

            <blockquote className="pq">
              A cardiac arrest at ESU&apos;s Koehler Fieldhouse nearly ended my story. An AED funded through local preparedness helped save my life. That is why protection, preparation, and legacy are personal.
            </blockquote>

            <p className="sbody">
              That moment is the heartbeat behind everything we do at <strong>Latimore Life & Legacy LLC</strong>. We help families prepare for life&apos;s uncertainties with clarity and confidence — because legacy is not just what you leave behind. It is how you show up today.
            </p>
          </div>

          <div className="cf fu2">
            <div className="ci2">
              <div className="ch">
                <div className="cht">Pottsville caps magical season</div>
                <div className="chs">Tide&apos;s Keating, Buziak, DeMarkis join CB&apos;s Latimore atop team</div>
              </div>
              <img className="cp" src="/pahs-2005-allarea.png" alt="2005 Republican & Herald All-Area Football — Jackson Latimore named Offensive Player of the Year" />
              <div className="cc">
                Headlining the 2005 R&H All-Area Football Team — Jackson Latimore (#20, Cardinal Brennan) named Offensive Player of the Year.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pills">
        <div className="sechdr fu2">
          <div className="seclab">Why Latimore Life & Legacy</div>
          <h2 className="sect">Built for <em>Coal Region</em> Families</h2>
        </div>

        <div className="pg">
          {PILLARS.map(([title, body]) => (
            <article className="pc fu2" key={title}>
              <div className="pt">{title}</div>
              <p className="pb">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cpn">
        <div className="cpni fu2">
          <img src="/pahs-free-consult.png" alt="Free Consultation — Proud Sponsor of Pottsville Area Crimson Tide · ID #2777749" />
          <div className="cpnn">Powered by CampusBox Media · ID #2777749 · Limit one per transaction</div>
        </div>
      </section>

      <section className="svcs">
        <div className="svci">
          <div className="sechdr fu2">
            <div className="seclab dark">What We Offer</div>
            <h2 className="sect dark-text">Protection <em>Strategies</em></h2>
          </div>

          <div className="sg">
            {SERVICES.map(([num, title, body]) => (
              <article className="svc fu2" key={title}>
                <div className="sn">{num}</div>
                <div>
                  <h3 className="st">{title}</h3>
                  <p className="sv">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="art-strip">
        <img src="/pahs-protect-go.png" alt="Protect What You Play For — Pottsville Area Crimson Tide ‘26" />
      </section>

      <section className="qrs" id="consult">
        <div className="qrsi fu2">
          <h2>Scan. Connect. Protect.</h2>
          <p>Scan the code or visit the link below to schedule your free protection review.</p>
          <div className="qrb">
            <QRCodeCanvas value="https://latimorelifelegacy.fillout.com/pahs" size={180} level="H" includeMargin />
            <div className="qru">latimorelifelegacy.fillout.com/pahs</div>
          </div>
          <a href="tel:7176152613" className="qruw">(717) 615-2613</a>
        </div>
      </section>

      <section className="art-strip">
        <img src="/pahs-sponsor-flyer.png" alt="Proud All-Star Sponsor — Pottsville Area High School ‘26" />
      </section>

      <section className="contact" id="contact">
        <div className="conti">
          <div className="seclab">Get in Touch</div>
          <h2 className="sect" style={{ marginTop: '.5rem' }}>
            Let&apos;s Protect
            <br />
            Your <em>Legacy</em>
          </h2>

          <div className="contc fu2">
            <div className="cname">Jackson M. Latimore Sr., MBA</div>
            <div className="ctitle">Founder & CEO · Latimore Life & Legacy LLC · GFI Affiliate</div>
            <div className="cdiv" />

            <div className="citems">
              <a href="tel:7176152613" className="citem">(717) 615-2613</a>
              <a href="mailto:leads@latimorelegacy.com" className="citem">leads@latimorelegacy.com</a>
              <div className="citem">1544 Route 61 Hwy S, Suite 6104, Pottsville, PA 17901</div>
              <div className="citem">PA DOI #1268820 · NIPR #21638507</div>
            </div>
          </div>

          <div className="lic">
            Latimore Life & Legacy LLC is an independent insurance brokerage licensed in the Commonwealth of Pennsylvania.
            <br />
            Products offered through licensed carrier appointments. Not all products available in all areas.
            <br />
            Affiliated with Global Financial Impact (GFI). Insurance products are not FDIC insured, not bank guaranteed, and may lose value.
          </div>
        </div>
      </section>

      <footer>
        <div className="fi">
          <div className="fs">
            <span>Life Insurance</span>
            <span>Living Benefits</span>
            <span>Annuities</span>
            <span>Financial Strategies</span>
          </div>
          <div className="fc">© 2026 Latimore Life & Legacy LLC · latimorelifelegacy.fillout.com/pahs</div>
        </div>
      </footer>

      <div className="mcta">
        <div className="mctx">Free Consultation</div>
        <a href="tel:7176152613" className="mctb">Call Now</a>
      </div>
    </main>
  );
}
