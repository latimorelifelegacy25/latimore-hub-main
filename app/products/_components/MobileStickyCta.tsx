import { BRAND, COLORS } from '@/lib/brand'

export function MobileStickyCta() {
  return (
    <div className="products-mobile-sticky" aria-label="Product page quick actions">
      <a
        href="/products/find-my-fit"
        data-track="true"
        data-track-event="legacy_checkup_started"
        data-track-cta="true"
        style={{
          flex: 1,
          background: COLORS.gold,
          color: COLORS.navy,
          textAlign: 'center',
          padding: '0.85rem 0.75rem',
          borderRadius: 999,
          fontWeight: 850,
          textDecoration: 'none',
          fontSize: '0.92rem',
        }}
      >
        Find My Fit
      </a>
      <a
        href={`tel:${BRAND.phoneRaw}`}
        data-track="true"
        data-track-event="call_click"
        data-track-cta="true"
        style={{
          flex: 1,
          background: COLORS.navy,
          color: COLORS.white,
          textAlign: 'center',
          padding: '0.85rem 0.75rem',
          borderRadius: 999,
          fontWeight: 850,
          textDecoration: 'none',
          fontSize: '0.92rem',
        }}
      >
        Call
      </a>
    </div>
  )
}
