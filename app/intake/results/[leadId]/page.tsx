import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COLORS } from '@/lib/brand'
import { getVirtualIntakeResult } from '@/lib/virtual-intake'

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`
}

export default async function IntakeResultsPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params
  const result = await getVirtualIntakeResult(leadId)
  if (!result) notFound()

  return (
    <main style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem 1rem' }}>
      <section style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ background: COLORS.navy, color: '#fff', borderRadius: 24, padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: COLORS.goldLight, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', margin: 0 }}>Your Results</p>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', margin: '.7rem 0' }}>Thanks, {result.firstName}</h1>
          <p style={{ color: 'rgba(255,255,255,.82)', lineHeight: 1.7 }}>Your Protection & Legacy snapshot is ready. This is educational and prepares the review conversation.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginTop: 16 }}>
          <Card title="Protection & Legacy Score"><strong style={scoreStyle}>{result.clientScore}<span style={smallScore}>/100</span></strong></Card>
          <Card title="Advisor Priority Score"><strong style={scoreStyle}>{result.advisorScore}<span style={smallScore}>/100</span></strong><p style={muted}>Urgency: {result.urgency.toUpperCase()}</p></Card>
        </div>

        <Card title="Top priorities">
          {result.priorities.length ? <ul style={listStyle}>{result.priorities.map((p: any) => <li key={p.id}>{p.label}</li>)}</ul> : <p style={muted}>No priorities selected.</p>}
        </Card>

        <Card title="Topics to review">
          {result.recommendedTracks.length ? <ul style={listStyle}>{result.recommendedTracks.map((t: any) => <li key={t.id}>{t.label}</li>)}</ul> : <p style={muted}>Fewer immediate gaps were found, but a review is still useful.</p>}
        </Card>

        <Card title="Protection gap snapshot">
          <p style={muted}>Calculated need: <strong style={{ color: COLORS.navy }}>{money(result.calculatedNeed)}</strong></p>
          <p style={muted}>Estimated coverage gap: <strong style={{ color: COLORS.navy }}>{money(result.coverageGap)}</strong></p>
        </Card>

        <div style={{ background: COLORS.navy, color: '#fff', borderRadius: 24, padding: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Ready for your next step?</h2>
          <Link href={`/book-with-jackson/${leadId}`} style={{ display: 'inline-block', background: COLORS.gold, color: COLORS.navy, padding: '.9rem 1.25rem', borderRadius: 999, fontWeight: 900, textDecoration: 'none' }}>Book With Jackson</Link>
        </div>
      </section>
    </main>
  )
}

function Card({ title, children }: any) {
  return <section style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '1.25rem', margin: '16px 0', boxShadow: '0 10px 30px rgba(15,23,42,.08)' }}><h2 style={{ color: COLORS.navy, marginTop: 0 }}>{title}</h2>{children}</section>
}

const scoreStyle = { display: 'block', color: COLORS.navy, fontSize: '4rem', lineHeight: 1 }
const smallScore = { fontSize: '1.4rem', color: COLORS.gray500 }
const listStyle = { margin: 0, paddingLeft: '1.2rem', color: COLORS.gray700, lineHeight: 1.9 }
const muted = { color: COLORS.gray600, margin: '.4rem 0', lineHeight: 1.7 }
