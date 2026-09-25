'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { isNavItemActive, type NavMenuItem } from './nav-menu'
import { SITE_COLORS } from './site-shell'

type DesktopNavProps = {
  menu: readonly NavMenuItem[]
  currentPath?: string
}

export function DesktopNav({ menu, currentPath = '' }: DesktopNavProps) {
  const [openHref, setOpenHref] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close the open dropdown on an outside click or Escape.
  useEffect(() => {
    if (!openHref) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenHref(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenHref(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openHref])

  return (
    <div ref={rootRef} className="site-desktop-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
      {menu.map((item) => {
        const isActive = isNavItemActive(item, currentPath)
        const isJoin = item.href === '/join'
        const textStyle = {
          color: isActive ? SITE_COLORS.goldLight : '#fff',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: isActive ? 600 : 400,
        } as const

        if (!item.children) {
          return (
            <Link
              key={item.href}
              href={item.href}
              style={isJoin ? {
                background: SITE_COLORS.gold,
                color: SITE_COLORS.navy,
                padding: '0.55rem 0.95rem',
                borderRadius: 8,
                fontWeight: 800,
                textDecoration: 'none',
                fontSize: '0.88rem',
                boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
              } : textStyle}
            >
              {item.label}
            </Link>
          )
        }

        const isOpen = openHref === item.href
        const menuId = `site-nav-${item.href.replace(/\W+/g, '') || 'home'}`

        return (
          <div key={item.href} style={{ position: 'relative' }}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={menuId}
              onClick={() => setOpenHref(isOpen ? null : item.href)}
              style={{
                ...textStyle,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {item.label}
              <span
                aria-hidden="true"
                style={{ fontSize: '0.65rem', transition: 'transform 150ms', transform: isOpen ? 'rotate(180deg)' : 'none' }}
              >
                ▼
              </span>
            </button>

            {isOpen && (
              <div
                id={menuId}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 14px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  minWidth: 240,
                  maxHeight: 'calc(100vh - 120px)',
                  overflowY: 'auto',
                  background: SITE_COLORS.navy,
                  border: `1px solid ${SITE_COLORS.gold}55`,
                  borderRadius: 12,
                  padding: '0.5rem',
                  boxShadow: '0 16px 32px rgba(0,0,0,0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {item.children.map((child, index) => (
                  <Link
                    key={child.href + child.label}
                    href={child.href}
                    onClick={() => setOpenHref(null)}
                    className="site-nav-dropdown-link"
                    style={{
                      color: index === 0 ? SITE_COLORS.goldLight : '#fff',
                      fontWeight: index === 0 ? 700 : 400,
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      whiteSpace: 'nowrap',
                      borderBottom: index === 0 ? '1px solid rgba(255,255,255,0.1)' : undefined,
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
        style={{
          background: SITE_COLORS.gold,
          color: SITE_COLORS.navy,
          padding: '0.5rem 1rem',
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '0.85rem',
        }}
      >
        Book Consultation
      </a>

      <style>{`
        .site-nav-dropdown-link:hover,
        .site-nav-dropdown-link:focus-visible { background: rgba(201,162,95,0.16); }
      `}</style>
    </div>
  )
}
