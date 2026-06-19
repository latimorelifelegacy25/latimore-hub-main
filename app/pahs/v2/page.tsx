import type { Metadata } from 'next'
import './pahs-v2.css'
import ScrollReveal from './ScrollReveal'
import V2ScrollReveal from './V2ScrollReveal'
import PahsProtectForm from './PahsProtectForm'

export const metadata: Metadata = {
  title: 'Proud PAHS All-Star Sponsor | Latimore Life & Legacy',
  description:
    'Latimore Life & Legacy LLC — Proud All-Star Sponsor of the Pottsville Area Crimson Tide. Free consultation for Coal Region families. Protecting Today. Securing Tomorrow.',
  openGraph: {
    title: 'Proud PAHS All-Star Sponsor | Latimore Life & Legacy',
    description: 'Free protection review for Schuylkill County families. Jackson follows up within 24 hours.',
    url: 'https://www.latimorelifelegacy.com/pahs/v2',
  },
}

export default function PahsV2Page() {
  return (
    <>
      <ScrollReveal />
      <V2ScrollReveal />

      {/* ── HERO ── */}
      <section className="v2-hero">
        <div
          className="v2-hero-bg"
          style={{ backgroundImage: "url('/pahs-sponsor-flyer.jpg')" }}
        />
        <div className="v2-hero-ov" />
        <div className="v2-hero-c">
          <div className="v2-sbadge">Proud All-Star Sponsor</div>
          <div className="v2-hs">
            Pottsville Area<br />
            <span>High School</span>
          </div>
          <div className="v2-hy">Crimson Tide &middot; Class of &lsquo;26</div>

          <div className="v2-lhero">
            <img src="/pahs-latimore-logo.png" alt="Latimore Life & Legacy LLC" />
            <svg className="v2-hbeat" viewBox="0 0 200 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="0,15 30,15 40,5 50,25 60,15 80,15 90,2 100,28 110,15 130,15 140,8 150,22 160,15 200,15"
                stroke="#C49A6C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          <div className="v2-tline">Protecting Today. Securing Tomorrow. #TheBeatGoesOn</div>

          <div className="v2-ctas">
            <a href="tel:7176152613" className="v2-btn1">Schedule Free Consultation</a>
            <a href="#story" className="v2-btn2">The Full Circle Story &darr;</a>
          </div>
        </div>
        <div className="v2-scrollh">
          <span>SCROLL</span>
          <div className="v2-sarrow" />
        </div>
      </section>

      {/* ── SPONSOR GRAPHIC ── */}
      <section className="v2-spgfx">
        <img src="/pahs-free-consult.png" alt="Free Consultation — Proud Sponsor of Pottsville Area Crimson Tide" />
      </section>

      {/* ── STORY ── */}
      <section className="v2-story" id="story">
        <div className="v2-si">
          <div className="v2-fu">
            <div className="v2-slabel">The Full Circle Legacy</div>
            <div className="v2-yb">2005 &rarr; 2026</div>
            <h2 className="v2-sh2">From the<br />Field to the<br /><em>Family</em></h2>
            <p className="v2-sbody">
              Jackson M. Latimore Sr. wore <strong>#20 for Cardinal Brennan</strong>, earning Republican &amp; Herald
              All-Area Offensive Player of the Year honors in 2005. He knows what it means to compete in the Coal
              Region — the early mornings, the community that shows up, the weight of a jersey.
            </p>
            <blockquote className="v2-pq">
              &ldquo;In December 2010, a cardiac arrest at ESU&rsquo;s Koehler Fieldhouse nearly ended my story.
              An AED funded by the Gregory W. Moyer Defibrillator Fund saved my life.{' '}
              <strong>#TheBeatGoesOn.</strong>&rdquo;
            </blockquote>
            <p className="v2-sbody">
              That second chance became a calling. Today, as Founder &amp; CEO of{' '}
              <strong>Latimore Life &amp; Legacy LLC</strong>, Jackson protects Coal Region families with the same
              intensity he brought to the gridiron — and gives back to the programs that shaped him.
            </p>
          </div>

          <div className="v2-cf v2-fu">
            <div className="v2-ci2">
              <div className="v2-ch">
                <div className="v2-cht">Pottsville caps magical season</div>
                <div className="v2-chs">Tide&rsquo;s Keating, Buziak, DeMarkis join CB&rsquo;s Latimore atop team</div>
              </div>
              <img className="v2-cp" src="/pahs-2005-allarea.png" alt="2005 Coal Region All-Area Football — Where the Journey Began" />
              <div className="v2-cc">
                Headlining the 2005 Republican &amp; Herald All-Area Football Team — Jackson Latimore (#20, Cardinal
                Brennan) named Offensive Player of the Year alongside Pottsville&rsquo;s finest.
                Photo: Jacqueline Dormer / Staff Photo.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PILLS ── */}
      <section className="v2-pills">
        <div className="v2-sechdr v2-fu">
          <div className="v2-seclab">Why Latimore Life &amp; Legacy</div>
          <h2 className="v2-sect">Built for <em>Coal Region</em> Families</h2>
        </div>
        <div className="v2-pg">
          <div className="v2-pc v2-fu">
            <svg className="v2-pi" viewBox="0 0 44 44" fill="none">
              <path d="M22 4L6 12V24C6 34 14 42 22 44C30 42 38 34 38 24V12L22 4Z" stroke="#C49A6C" strokeWidth="1.5" fill="rgba(196,154,108,0.08)" />
              <path d="M15 22L20 27L30 17" stroke="#C49A6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="v2-pt">Protecting Today</div>
            <p className="v2-pb">Life insurance and living-benefit solutions that safeguard your family&rsquo;s financial foundation — starting now, not someday.</p>
          </div>
          <div className="v2-pc v2-fu">
            <svg className="v2-pi" viewBox="0 0 44 44" fill="none">
              <polyline points="6,32 14,20 20,26 28,10 36,18" stroke="#C49A6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M36 18L40 14M36 18H30" stroke="#e8c99a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="v2-pt">Securing Tomorrow</div>
            <p className="v2-pb">Index-linked annuities and IUL strategies designed to grow your wealth — with downside protection built in.</p>
          </div>
          <div className="v2-pc v2-fu">
            <svg className="v2-pi" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="14" r="5" stroke="#C49A6C" strokeWidth="1.5" />
              <circle cx="10" cy="20" r="4" stroke="#C49A6C" strokeWidth="1.5" />
              <circle cx="34" cy="20" r="4" stroke="#C49A6C" strokeWidth="1.5" />
              <path d="M4 36C4 30 7 26 14 26H30C37 26 40 30 40 36" stroke="#C49A6C" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="v2-pt">Invested in Community</div>
            <p className="v2-pb">Proud ALL-STAR sponsor of PAHS Crimson Tide football. Rooted in Schuylkill, Luzerne, and Northumberland Counties.</p>
          </div>
        </div>
      </section>

      {/* ── COUPON ── */}
      <section className="v2-cpn">
        <div className="v2-cpni v2-fu">
          <img src="/pahs-free-consult.png" alt="Free Consultation — Powered by CampusBox Media" />
          <div className="v2-cpnn">Powered by CampusBox Media &middot; ID #2777749 &middot; Limit one per transaction</div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="v2-svcs">
        <div className="v2-svci">
          <div className="v2-fu" style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div className="v2-seclab" style={{ color: 'var(--v2-cr)' }}>What We Offer</div>
              <h2 className="v2-sect" style={{ color: 'var(--v2-navy)' }}>
                Protection<br /><em style={{ color: 'var(--v2-cr)' }}>Strategies</em>
              </h2>
            </div>
          </div>
          <div className="v2-sg">
            <div className="v2-svc v2-fu">
              <div className="v2-sn">01</div>
              <div>
                <div className="v2-st">Life Insurance</div>
                <p className="v2-sv">Term and permanent coverage through Ethos Life, Foresters Financial, North American Company, and more. Affordable protection built for real budgets.</p>
              </div>
            </div>
            <div className="v2-svc v2-fu">
              <div className="v2-sn">02</div>
              <div>
                <div className="v2-st">Living Benefits</div>
                <p className="v2-sv">Policies that pay while you&rsquo;re still living — critical illness, chronic illness, and terminal illness riders that deliver cash when you need it most.</p>
              </div>
            </div>
            <div className="v2-svc v2-fu">
              <div className="v2-sn">03</div>
              <div>
                <div className="v2-st">Indexed Universal Life (IUL)</div>
                <p className="v2-sv">Tax-advantaged growth linked to market indices with downside protection. Powerful for income planning, legacy building, and supplemental retirement.</p>
              </div>
            </div>
            <div className="v2-svc v2-fu">
              <div className="v2-sn">04</div>
              <div>
                <div className="v2-st">Fixed Index Annuities (FIA)</div>
                <p className="v2-sv">Guaranteed income through F&amp;G, American Equity, and Corebridge Financial. Sleep well knowing you won&rsquo;t outlive your money.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <div id="consult" style={{ background: '#0a0f14' }}>
        <PahsProtectForm />
      </div>

      {/* ── QR SECTION ── */}
      <section className="v2-qrs">
        <div className="v2-qrsi v2-fu">
          <h2>Scan. Connect. Protect.</h2>
          <p>Scan the code or visit the link below to schedule your free consultation</p>
          <div className="v2-qrb">
            <img src="/pahs-latimore-logo.png" alt="Latimore Life & Legacy QR" style={{ width: 180, height: 180, objectFit: 'contain' }} />
            <div className="v2-qru">latimorelifelegacy.fillout.com/pahs</div>
          </div>
          <a href="tel:7176152613" className="v2-qruw">&#128222; (717) 615-2613</a>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="v2-contact" id="contact">
        <div className="v2-conti v2-fu">
          <div className="v2-seclab">Get in Touch</div>
          <h2 className="v2-sect" style={{ marginTop: '.5rem' }}>
            Let&rsquo;s Protect<br />Your <em>Legacy</em>
          </h2>
          <div style={{ marginTop: '2rem' }}>
            <div className="v2-cname">Jackson M. Latimore Sr., MBA</div>
            <div className="v2-ctitle">Founder &amp; CEO &middot; Latimore Life &amp; Legacy LLC &middot; GFI Affiliate</div>
            <div className="v2-cdiv" />
            <div className="v2-citems">
              <a href="tel:7176152613" className="v2-citem">
                <svg className="v2-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 4.18 2 2 0 015.07 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                (717) 615-2613
              </a>
              <a href="mailto:leads@latimorelegacy.com" className="v2-citem">
                <svg className="v2-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                leads@latimorelegacy.com
              </a>
              <div className="v2-citem">
                <svg className="v2-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                1544 Route 61 Hwy S, Suite 6104, Pottsville, PA 17901
              </div>
              <div className="v2-citem">
                <svg className="v2-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
                PA DOI #1268820 &middot; NIPR #21638507
              </div>
            </div>
          </div>
          <div className="v2-lic">
            Latimore Life &amp; Legacy LLC is an independent insurance brokerage licensed in the Commonwealth of Pennsylvania.<br />
            Products offered through licensed carrier appointments. Not all products available in all areas.<br />
            Affiliated with Global Financial Impact (GFI). Insurance products are not FDIC insured, not bank guaranteed, and may lose value.
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="v2-footer">
        <div className="v2-fi">
          <div className="v2-fs">
            <span>Life Insurance</span>
            <span>Living Benefits</span>
            <span>Annuities</span>
            <span>Financial Strategies</span>
          </div>
          <div className="v2-fc">&copy; 2026 Latimore Life &amp; Legacy LLC &middot; latimorelifelegacy.fillout.com/pahs</div>
        </div>
      </footer>

      {/* ── MOBILE STICKY CTA ── */}
      <div className="v2-mcta">
        <div className="v2-mctx">Free Consultation</div>
        <a href="tel:7176152613" className="v2-mctb">Call Now</a>
      </div>
    </>
  )
}
