import Link from 'next/link'
import type { ArticleMeta, Track } from '@/lib/mdx'

// ── Brand tokens ──────────────────────────────────────────────────────────────
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

const C = {
  navy: '#2C3E50',
  gold: '#C49A6C',
  goldPale: '#fdf6ee',
  cream: '#f9f6f0',
  ink: '#1a1a1a',
  muted: '#6b6460',
  rule: '#e2dcd4',
  white: '#ffffff',
} as const

interface BlogCardProps {
  article: ArticleMeta
  /** Animation delay index for staggered fade-in */
  index?: number
}

export default function BlogCard({ article, index = 0 }: BlogCardProps) {
  const trackColor = TRACK_COLOR[article.track]
  const trackBg = TRACK_BG[article.track]

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="blog-card"
      style={{
        background: C.white,
        border: `1px solid ${C.rule}`,
        borderRadius: 3,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
        animationDelay: `${index * 0.05}s`,
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
    >
      {/* Track colour stripe */}
      <div style={{ height: 3, background: trackColor }} />

      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '3px 9px',
            borderRadius: 2,
            fontWeight: 500,
            background: trackBg,
            color: trackColor,
          }}>
            {article.trackLabel}
          </span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>
            {article.num}
          </span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: "'DM Mono',monospace",
            fontSize: 8,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.gold,
            background: C.goldPale,
            padding: '2px 7px',
            borderRadius: 20,
          }}>
            {article.kpi}
          </span>
          {article.bilingual && (
            <span style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: '#e8f1f8',
              color: '#2d5f8a',
              border: '1px solid #bdd4e8',
              padding: '2px 8px',
              borderRadius: 20,
            }}>
              ES/EN
            </span>
          )}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: '1.15rem',
          fontWeight: 700,
          color: C.navy,
          lineHeight: 1.35,
          marginBottom: '0.875rem',
          flex: 1,
          margin: '0 0 0.875rem',
        }}>
          {article.title}
        </h2>

        {/* Excerpt */}
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: '1.25rem', margin: '0 0 1.25rem' }}>
          {article.excerpt}
        </p>
      </div>

      {/* Card footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderTop: `1px solid ${C.rule}`,
        background: C.cream,
      }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.muted }}>
          {article.format}
          {article.readingTime ? ` · ${article.readingTime} min read` : ''}
        </span>
        <span style={{
          fontFamily: "'DM Mono',monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: C.navy,
          border: `1px solid ${C.navy}`,
          padding: '5px 12px',
          borderRadius: 2,
        }}>
          Read →
        </span>
      </div>
    </Link>
  )
}
