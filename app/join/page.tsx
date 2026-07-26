import { BRAND } from '@/lib/brand'
import { SiteFooter, SiteHeader, JOIN_NAV_LINKS } from '@/app/_components/site-shell'
import Image from 'next/image'
import { Clock3, GraduationCap, HeartHandshake, TrendingUp, Users } from 'lucide-react'
import JoinFormSection from '@/components/join/JoinFormSection'

const navy = '#0E1A2B'
const gold = '#C9A24D'
const goldLight = '#E5C882'

export const metadata = {
  title: 'Join Our Team | Latimore Life & Legacy',
  description: 'Build your future and leave a legacy with the Latimore Life & Legacy recruiting interest form.',
}

const benefits = [
  { title: 'Winning Culture', description: 'Work with a team that supports, empowers, and celebrates you.', Icon: Users },
  { title: 'Mentorship & Training', description: 'Learn the business with guidance, training, and compliance support.', Icon: GraduationCap },
  { title: 'Flexible Schedule', description: 'Build around your goals, pace, and season of life.', Icon: Clock3 },
  { title: 'Personal Growth', description: 'Develop confidence, discipline, leadership, and service habits.', Icon: TrendingUp },
  { title: 'Helping Families', description: 'Protect families through education-first conversations.', Icon: HeartHandshake },
  { title: 'Legacy Income Opportunity', description: 'Explore purpose-driven income while building impact.', Icon: TrendingUp },
]

export default function JoinPage() {
  return (
    <>
      <SiteHeader currentPath="/join" navLinks={JOIN_NAV_LINKS} />

      <section style={{ background: `radial-gradient(circle at 82% 18%, rgba(201,162,77,.24), transparent 30%), linear-gradient(135deg, ${navy} 0%, #071121 100%)`, color: '#fff', padding: 'clamp(4rem,8vw,6.5rem) 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 'clamp(2rem,5vw,4.5rem)', alignItems: 'center' }} className="join-hero-grid">
          <div>
            <p style={{ color: goldLight, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase', margin: '0 0 12px' }}>{BRAND.name}</p>
            <h1 style={{ fontSize: 'clamp(3.25rem,7.5vw,6.25rem)', lineHeight: .9, margin: 0, letterSpacing: '-.055em', textTransform: 'uppercase' }}>Join Our <span style={{ color: gold }}>Team</span></h1>
            <h2 style={{ fontSize: 'clamp(1.35rem,2.7vw,2.25rem)', margin: '1.45rem 0 .5rem', textTransform: 'uppercase', lineHeight: 1.15 }}>Build Your Future. <span style={{ color: goldLight }}>Leave a Legacy.</span></h2>
            <p style={{ color: goldLight, fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1.2rem' }}>#TheBeatGoesOn</p>
            <p style={{ fontSize: '1.12rem', lineHeight: 1.7, maxWidth: '55ch', color: 'rgba(255,255,255,.86)' }}>Build a purpose-driven path helping families understand protection, prepare for tomorrow, and leave a legacy.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
              <a href="#apply" style={{ background: gold, color: navy, padding: '14px 24px', borderRadius: 999, fontWeight: 900, textDecoration: 'none' }}>Submit My Interest</a>
              <a href="/book?utm_source=join_hero&utm_medium=website&utm_campaign=join-team" style={{ border: '1px solid rgba(255,255,255,.35)', color: '#fff', padding: '14px 24px', borderRadius: 999, fontWeight: 800, textDecoration: 'none' }}>Schedule Intro Call</a>
            </div>
          </div>
          <aside style={{ maxWidth: 500, width: '100%', justifySelf: 'center', background: '#fff', borderRadius: 24, padding: 8, boxShadow: '0 26px 70px rgba(0,0,0,.34)', border: `3px solid ${gold}` }}>
            <Image
              src="/join-team-poster.svg"
              alt="Latimore Life & Legacy LLC Join Our Team recruiting poster"
              width={1024}
              height={1536}
              priority
              sizes="(max-width: 900px) 92vw, 500px"
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
            />
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
            {benefits.map(({ title, description, Icon }) => <article key={title} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 22, boxShadow: '0 14px 40px rgba(15,53,85,.08)' }}><div style={{ width: 46, height: 46, borderRadius: 999, background: navy, color: gold, display: 'grid', placeItems: 'center', marginBottom: 12 }}><Icon size={22} strokeWidth={2.25} /></div><h3 style={{ color: navy, margin: '0 0 8px' }}>{title}</h3><p style={{ color: '#475467', lineHeight: 1.6, margin: 0 }}>{description}</p></article>)}
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
