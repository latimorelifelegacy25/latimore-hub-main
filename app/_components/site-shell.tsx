import Link from 'next/link'
import { BRAND, COLORS } from '@/lib/brand'
import { MobileNav } from './mobile-nav'
import { DesktopNav } from './desktop-nav'
import { NAV_MENU, type NavMenuItem } from './nav-menu'

export type NavLink = readonly [href: string, label: string]

/**
 * SITE_COLORS — convenience re-export of canonical brand tokens for
 * components that use inline styles. Add new values from COLORS as needed.
 * For CSS classes, use var(--color-*) tokens directly.
 */
export const SITE_COLORS = {
  navy:      COLORS.navy,
  gold:      COLORS.gold,
  goldLight: COLORS.goldLight,
} as const

export const DEFAULT_NAV_LINKS = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/products', 'Products'],
  ['/services', 'Services'],
  ['/solutions', 'Planning Tools'],
  ['/education', 'Education'],
  ['/blog', 'Blog'],
  ['/join', 'Join Our Team'],
  ['/contact', 'Contact'],
] as const satisfies readonly NavLink[]

export const JOIN_NAV_LINKS = DEFAULT_NAV_LINKS

type SiteHeaderProps = {
  currentPath?: string
  navLinks?: readonly NavLink[]
  mobileBreakpoint?: number
}

export function SiteHeader({
  currentPath = '',
  navLinks = DEFAULT_NAV_LINKS,
  mobileBreakpoint = 1180,
}: SiteHeaderProps) {
  // The default links get the full dropdown menu; a page passing its own
  // links gets exactly those, as flat items.
  const menu: readonly NavMenuItem[] = navLinks === DEFAULT_NAV_LINKS
    ? NAV_MENU
    : navLinks.map(([href, label]) => ({ href, label }))

  return (
    <nav
      aria-label="Primary"
      style={{
        background: SITE_COLORS.navy,
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 700,
            minWidth: 0,
            flexShrink: 0,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>
            {BRAND.name}
          </span>
        </Link>

        <DesktopNav menu={menu} currentPath={currentPath} />

        <MobileNav
          menu={menu}
          currentPath={currentPath}
          mobileBreakpoint={mobileBreakpoint}
        />
      </div>
    </nav>
  )
}

export function SiteFooter({ navLinks = DEFAULT_NAV_LINKS }: { navLinks?: readonly NavLink[] }) {
  return (
    <footer style={{ background: SITE_COLORS.navy, color: '#fff', padding: '3rem 0 1rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h4 style={{ color: SITE_COLORS.goldLight, marginBottom: '1rem' }}>
              {BRAND.fullName}
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Independent Life, Health, Accident &amp; Annuities Broker
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {[
                ['Instagram', BRAND.instagram],
                ['LinkedIn', BRAND.linkedin],
                ['Facebook', BRAND.facebook],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
              PA License #{BRAND.paLicense} · NIPR #{BRAND.nipr}
            </p>
          </div>

          <div>
            <h4 style={{ color: SITE_COLORS.goldLight, marginBottom: '1rem' }}>Quick Links</h4>
            {navLinks.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'block',
                  color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          <div>
            <h4 style={{ color: SITE_COLORS.goldLight, marginBottom: '1rem' }}>Contact</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.8 }}>
              <a
                href={`tel:+1${BRAND.phoneRaw}`}
                style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}
              >
                {BRAND.phone}
              </a>
              <br />
              <a
                href={`mailto:${BRAND.email}`}
                style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}
              >
                {BRAND.email}
              </a>
              <br />
              1544 Route 61 Hwy S, Ste 6104
              <br />
              Pottsville, PA 17901
            </p>
          </div>

          <div>
            <h4 style={{ color: SITE_COLORS.goldLight, marginBottom: '1rem' }}>Get Started</h4>
            <a
              href={BRAND.bookingUrl}
              style={{
                display: 'inline-block',
                background: SITE_COLORS.gold,
                color: SITE_COLORS.navy,
                padding: '0.5rem 1rem',
                borderRadius: 5,
                fontWeight: 600,
                textDecoration: 'none',
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
              }}
            >
              Book Consultation
            </a>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.5)',
              maxWidth: 900,
              margin: '0 auto 0.75rem',
            }}
          >
            Licensed in Pennsylvania (DOI #{BRAND.paLicense}, NIPR #{BRAND.nipr}). For educational purposes only; not tax or legal advice.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Latimore Life & Legacy LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}