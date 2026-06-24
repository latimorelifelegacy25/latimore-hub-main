import { BRAND } from '@/lib/brand'
import { SiteFooter, SiteHeader, JOIN_NAV_LINKS } from '@/app/_components/site-shell'
import JoinFormSection from '@/components/join/JoinFormSection'

const navy = '#0E1A2B'
const gold = '#C9A24D'
const goldLight = '#E5C882'

export const metadata = {
  title: 'Join Our Team | Latimore Life & Legacy',
  description: 'Build your future and leave a legacy with the Latimore Life & Legacy recruiting interest form.',
}

const benefits = [
  ['Winning Culture', 'Work with a team that supports, empowers, and celebrates you.'],
  ['Mentorship & Training', 'Learn, grow, and become the best version of you.'],
  ['Flexible Schedule', 'Build around your goals, pace, and season of life.'],
  ['Personal Growth', 'Develop confidence, discipline, leadership, and service habits.'],
  ['Helping Families', 'Protect families through education-first conversations.'],
  ['Legacy Income Opportunity', 'Explore purpose-driven income while building impact.'],
]

export default function JoinPage() {
  return (
    <>
      <SiteHeader currentPath="/join" navLinks={JOIN_NAV_LINKS} />

      <section style={{ background: `radial-gradient(circle at top right, rgba(201,162,77,.28), transparent 28%), linear-gradient(135deg, ${navy} 0%, #071121 100%)`, color: '#fff', padding: '5rem 0 4rem', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 28, alignItems: 'center' }} className="join-hero-grid">
          <div>
            <p style={{ color: goldLight, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase', margin: '0 0 12px' }}>{BRAND.name}</p>
            <h1 style={{ fontSize: 'clamp(3rem,8vw,6.5rem)', lineHeight: .9, margin: 0, letterSpacing: '-.06em', textTransform: 'uppercase' }}>Join Our <span style={{ color: gold }}>Team</span></h1>
            <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2.4rem)', margin: '1.25rem 0 .4rem', textTransform: 'uppercase' }}>Build Your Future. <span style={{ color: goldLight }}>Leave a Legacy.</span></h2>
            <p style={{ color: goldLight, fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1.2rem' }}>#TheBeatGoesOn</p>
            <p style={{ fontSize: '1.18rem', lineHeight: 1.7, maxWidth: '58ch', color: 'rgba(255,255,255,.9)' }}>Protect families. Secure futures. Build legacies.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
              <a href="#apply" style={{ background: gold, color: navy, padding: '14px 24px', borderRadius: 999, fontWeight: 900, textDecoration: 'none' }}>Submit My Interest</a>
              <a href="/book?utm_source=join_hero&utm_medium=website&utm_campaign=join-team" style={{ background: '#fff', color: navy, padding: '14px 24px', borderRadius: 999, fontWeight: 800, textDecoration: 'none' }}>Schedule Intro Call</a>
            </div>
          </div>
          <aside style={{ background: '#fff', color: navy, borderRadius: 24, padding: 'clamp(1.25rem,4vw,2rem)', boxShadow: '0 24px 60px rgba(0,0,0,.26)', border: `4px solid ${gold}` }}>
            <p style={{ margin: 0, color: gold, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase' }}>Your purpose. Our mission.</p>
            <h2 style={{ margin: '10px 0', fontSize: 'clamp(1.8rem,4vw,3rem)', lineHeight: 1 }}>Take the step. Join me today!</h2>
            <p style={{ color: '#475467', lineHeight: 1.7 }}>We're looking for driven individuals who want more out of life and are ready to help families protect their future.</p>
            <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>{['No insurance experience required to start exploring', 'Training, mentorship, and compliance support', 'Part-time and growth-oriented paths available'].map((item) => <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: gold, fontWeight: 900 }}>✓</span><span>{item}</span></div>)}</div>
          </aside>
        </div>
      </section>

      <section style={{ padding: '4rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ color: gold, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.12em' }}>The mission</p>
          <h2 style={{ color: navy, fontSize: 'clamp(1.8rem,3vw,2.6rem)', margin: '0 auto 14px', maxWidth: '820px' }}>A recruiting path for people ready to grow while serving families.</h2>
          <p style={{ color: '#475467', lineHeight: 1.75, maxWidth: '820px', margin: '0 auto' }}>{BRAND.name} helps families prepare for tomorrow through protection-focused education. If you are coachable, service-minded, and looking for purpose-driven growth, this form is the first step toward a short intro conversation.</p>
        </div>
      </section>

      <section style={{ padding: '4rem 0', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ color: navy, fontSize: 'clamp(1.8rem,3vw,2.5rem)', textAlign: 'center', margin: '0 0 28px' }}>Why Join Us</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }} className="benefit-grid">
            {benefits.map(([title, desc]) => <article key={title} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 22, boxShadow: '0 14px 40px rgba(15,53,85,.08)' }}><div style={{ width: 46, height: 46, borderRadius: 999, background: navy, color: gold, display: 'grid', placeItems: 'center', fontWeight: 900, marginBottom: 12 }}>★</div><h3 style={{ color: navy, margin: '0 0 8px' }}>{title}</h3><p style={{ color: '#475467', lineHeight: 1.6, margin: 0 }}>{desc}</p></article>)}
          </div>
        </div>
      </section>

      <JoinFormSection />

      <section style={{ padding: '4rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ background: navy, color: '#fff', borderRadius: 22, padding: 'clamp(1.5rem,4vw,2.5rem)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'center' }} className="join-footer-cta">
            <div><p style={{ color: goldLight, fontWeight: 900, margin: '0 0 6px' }}>Questions before applying?</p><h2 style={{ margin: 0 }}>Connect with {BRAND.advisor}</h2><p style={{ color: 'rgba(255,255,255,.82)' }}><a href={`tel:+1${BRAND.phoneRaw}`} style={{ color: '#fff' }}>{BRAND.phone}</a> · <a href={`mailto:${BRAND.email}`} style={{ color: '#fff' }}>{BRAND.email}</a> · <a href={BRAND.cardUrl} style={{ color: '#fff' }}>Digital Card</a></p></div>
            <a href="#apply" style={{ background: gold, color: navy, padding: '14px 24px', borderRadius: 999, fontWeight: 900, textDecoration: 'none' }}>Start Form</a>
          </div>
        </div>
      </section>

      <SiteFooter />
      <style>{`@media (max-width: 900px) { .join-hero-grid, .benefit-grid, .join-footer-cta { grid-template-columns: 1fr !important; } }`}</style>
    </>
  )
}
