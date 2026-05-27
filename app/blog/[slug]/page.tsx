import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticleBySlug, getAllSlugs, renderMarkdown, type Track } from '@/lib/mdx'
import ArticleAnalytics from '@/components/blog/ArticleAnalytics'

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  navy: '#2C3E50',
  navyDeep: '#1a2530',
  gold: '#C49A6C',
  goldPale: '#fdf6ee',
  cream: '#f9f6f0',
  ink: '#1a1a1a',
  muted: '#6b6460',
  rule: '#e2dcd4',
  white: '#ffffff',
} as const

const TRACK_COLOR: Record<Track, string> = {
  A: '#2d5f8a',
  B: '#4a7c59',
  C: '#7a4f2e',
}
const TRACK_BG: Record<Track, string> = {
  A: '#e8f1f8',
  B: '#e8f2ec',
  C: '#f2ebe5',
}

// ── Static generation ─────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

// ── Metadata per article ──────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return {}
  const { meta } = article
  return {
    title: meta.title,
    description: meta.excerpt,
    openGraph: {
      title: meta.title,
      description: meta.excerpt,
      type: 'article',
    },
  }
}

// ── Article page ──────────────────────────────────────────────────────────────
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const { meta, content } = article
  const html = await renderMarkdown(content)
  const trackColor = TRACK_COLOR[meta.track]
  const trackBg = TRACK_BG[meta.track]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@400;500&display=swap');

        .article-root { font-family:'Source Serif 4',Georgia,serif; background:${C.cream}; color:${C.ink}; font-size:17px; line-height:1.7; -webkit-font-smoothing:antialiased; min-height:100vh; }
        .article-root *, .article-root *::before, .article-root *::after { box-sizing:border-box; margin:0; padding:0; }
      `}</style>

      <ArticleAnalytics slug={meta.slug} title={meta.title} track={meta.track} num={meta.num} />

      <div className="article-root">
        {/* ── Header ── */}
        <header style={{ background: C.navyDeep, borderBottom: `2px solid ${C.gold}`, padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, gap: '2rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, background: C.gold, clipPath: 'polygon(50% 0%,100% 20%,100% 70%,50% 100%,0% 70%,0% 20%)', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: C.white, lineHeight: 1.1 }}>Latimore Life &amp; Legacy</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Protecting Today. Securing Tomorrow.</div>
              </div>
            </Link>
            <nav style={{ display: 'flex', gap: '1.75rem' }}>
              {([['/', 'Home'], ['/about', 'About'], ['/products', 'Products'], ['/contact', 'Contact']] as [string, string][]).map(([href, label]) => (
                <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13, fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</Link>
              ))}
              <Link href="/blog" style={{ color: C.gold, textDecoration: 'none', fontSize: 13, fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Blog</Link>
            </nav>
            <a href="tel:7176152613" style={{ background: C.gold, color: C.navyDeep, fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, padding: '8px 16px', borderRadius: 2, textDecoration: 'none', whiteSpace: 'nowrap' }}>(717) 615-2613</a>
          </div>
        </header>

        {/* ── Article header ── */}
        <section style={{ background: C.navy, backgroundImage: `radial-gradient(ellipse at 80% 20%,rgba(196,154,108,0.12) 0%,transparent 60%)`, padding: '4rem 2rem 3rem', borderBottom: `1px solid rgba(196,154,108,0.25)` }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/blog" style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Blog</Link>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '2px 9px', borderRadius: 2, background: trackBg, color: trackColor }}>
                {meta.trackLabel}
              </span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                {meta.num}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 900, color: C.white, lineHeight: 1.15, marginBottom: '1.25rem' }}>
              {meta.title}
            </h1>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '1.25rem', borderTop: `1px solid rgba(196,154,108,0.2)` }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                {meta.format}
              </span>
              {meta.readingTime && (
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  {meta.readingTime} min read
                </span>
              )}
              {meta.bilingual && (
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#e8f1f8', color: '#2d5f8a', border: '1px solid #bdd4e8', padding: '2px 8px', borderRadius: 20 }}>
                  ES / EN
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Article body ── */}
        <main style={{ maxWidth: 780, margin: '0 auto', padding: '3.5rem 2rem' }}>
          <div
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* ── In-article CTA ── */}
          <div style={{ background: C.navy, color: C.white, padding: '2.25rem 2.5rem', borderRadius: 3, marginTop: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: 6, color: C.white }}>{meta.cta}</strong>
              <span style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.7)' }}>No cost. No pressure. Just clarity.</span>
            </div>
            <a href="tel:7176152613" style={{ background: C.gold, color: C.navyDeep, fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', borderRadius: 2, textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>
              (717) 615-2613
            </a>
          </div>

          {/* ── Back link ── */}
          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: `1px solid ${C.rule}` }}>
            <Link href="/blog" style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, textDecoration: 'none' }}>
              ← Back to all articles
            </Link>
          </div>
        </main>

        {/* ── Author strip ── */}
        <div style={{ background: C.navyDeep, borderTop: `1px solid rgba(196,154,108,0.2)`, borderBottom: `1px solid rgba(196,154,108,0.2)`, padding: '2.5rem 2rem' }}>
          <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: C.navyDeep, fontWeight: 900 }}>JL</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700, color: C.white }}>Jackson M. Latimore Sr.</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gold, margin: '3px 0 8px' }}>Founder &amp; CEO — Latimore Life &amp; Legacy LLC · PA DOI #1268820</div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 300, lineHeight: 1.65 }}>Independent insurance broker serving Schuylkill, Luzerne, and Northumberland Counties. Cardiac arrest survivor. #TheBeatGoesOn</p>
            </div>
          </div>
        </div>

        {/* ── Site footer ── */}
        <footer style={{ background: C.navyDeep, borderTop: `2px solid ${C.gold}`, padding: '2rem', textAlign: 'center' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.gold, marginBottom: '0.75rem', letterSpacing: '0.08em' }}>#TheBeatGoesOn</div>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {([['/', 'Home'], ['/blog', 'Blog'], ['tel:7176152613', '(717) 615-2613'], ['mailto:jackson1989@latimorelegacy.com', 'Email']] as [string, string][]).map(([href, label]) => (
                <a key={href} href={href} style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>{label}</a>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
              Latimore Life &amp; Legacy LLC · 1544 Route 61 Highway S, Suite 6104, Pottsville, PA 17901<br />
              PA DOI License #1268820 · NIPR #21638507 · Affiliated with Global Financial Impact<br />
              Content is for educational purposes only and does not constitute personalized financial or insurance advice.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
