'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { isNavItemActive, type NavMenuItem } from './nav-menu'
import { SITE_COLORS } from './site-shell'

type MobileNavProps = {
  menu: readonly NavMenuItem[]
  currentPath?: string
  mobileBreakpoint?: number
}

export function MobileNav({
  menu,
  currentPath = '',
  mobileBreakpoint = 1180,
}: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [expandedHref, setExpandedHref] = useState<string | null>(null)

  const close = () => {
    setOpen(false)
    setExpandedHref(null)
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => (open ? close() : setOpen(true))}
        className="site-mobile-nav-toggle"
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '1.5rem',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div
          style={{
            background: SITE_COLORS.navy,
            padding: '1rem 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            maxHeight: 'calc(100vh - 70px)',
            overflowY: 'auto',
            boxShadow: '0 8px 18px rgba(0,0,0,0.15)',
          }}
        >
          {menu.map((item) => {
            const isActive = isNavItemActive(item, currentPath)
            const isJoin = item.href === '/join'
            const rowStyle = {
              color: isActive ? SITE_COLORS.goldLight : '#fff',
              textDecoration: 'none',
              fontSize: '1.05rem',
              fontWeight: isActive ? 600 : 400,
              padding: '0.6rem 0',
            } as const

            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  style={isJoin ? {
                    background: SITE_COLORS.gold,
                    color: SITE_COLORS.navy,
                    padding: '0.85rem 1rem',
                    margin: '0.5rem 0',
                    borderRadius: 8,
                    fontWeight: 800,
                    textDecoration: 'none',
                    textAlign: 'center',
                  } : rowStyle}
                >
                  {item.label}
                </Link>
              )
            }

            const isExpanded = expandedHref === item.href
            const panelId = `site-mobile-nav-${item.href.replace(/\W+/g, '') || 'home'}`

            return (
              <div key={item.href}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => setExpandedHref(isExpanded ? null : item.href)}
                  style={{
                    ...rowStyle,
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                  }}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    style={{ fontSize: '0.75rem', transition: 'transform 150ms', transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                  >
                    ▼
                  </span>
                </button>

                {isExpanded && (
                  <div
                    id={panelId}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderLeft: `2px solid ${SITE_COLORS.gold}`,
                      margin: '0 0 0.5rem 0.25rem',
                      paddingLeft: '0.85rem',
                    }}
                  >
                    {item.children.map((child, index) => (
                      <Link
                        key={child.href + child.label}
                        href={child.href}
                        onClick={close}
                        style={{
                          color: index === 0 ? SITE_COLORS.goldLight : 'rgba(255,255,255,0.85)',
                          fontWeight: index === 0 ? 600 : 400,
                          textDecoration: 'none',
                          fontSize: '0.98rem',
                          padding: '0.5rem 0',
                        }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <a
            href={BRAND.bookingUrl}
            onClick={close}
            style={{
              background: SITE_COLORS.gold,
              color: SITE_COLORS.navy,
              padding: '0.75rem',
              marginTop: '0.25rem',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Book Consultation
          </a>
        </div>
      )}

      <style>{`
        nav[aria-label="Primary"] { position: sticky; }
        @media (max-width: ${mobileBreakpoint}px) {
          .site-desktop-nav { display: none !important; }
          .site-mobile-nav-toggle { display: block !important; }
        }
      `}</style>
    </>
  )
}
