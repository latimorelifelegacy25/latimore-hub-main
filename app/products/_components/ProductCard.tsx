import { BRAND, COLORS } from '@/lib/brand'
import type { ProductCard as ProductCardType } from '@/lib/products/catalog'

type Props = {
  product: ProductCardType
}

function fallbackCta(product: ProductCardType) {
  if (product.ctaType === 'quote') {
    return {
      href: '/api/redirect/ethos?intent=quick_term',
      label: 'Get a Quote',
      eventType: 'instant_quote_clicked',
      target: '_blank',
      rel: 'noopener noreferrer',
    }
  }

  return {
    href: `${BRAND.bookingUrl}?product=${encodeURIComponent(product.slug)}`,
    label: 'Book Consultation',
    eventType: 'book_consultation_clicked',
    target: undefined,
    rel: undefined,
  }
}

export function ProductCard({ product }: Props) {
  const secondary = fallbackCta(product)
  const fitHref = `/products/find-my-fit?product=${encodeURIComponent(product.slug)}`

  return (
    <article
      data-product-interest={product.productInterest}
      data-product-slug={product.slug}
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.gray200}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(14,26,43,0.08)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      }}
    >
      <a
        href={fitHref}
        data-track="true"
        data-track-event="product_selected"
        data-track-cta="true"
        data-product-interest={product.productInterest}
        data-product-slug={product.slug}
        style={{
          display: 'block',
          background: COLORS.navy,
          padding: '1.35rem',
          textDecoration: 'none',
        }}
      >
        <h3 style={{ color: COLORS.goldLight, fontSize: '1.15rem', margin: '0 0 0.35rem', lineHeight: 1.25 }}>
          {product.name}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.76)', fontSize: '0.92rem', margin: 0, fontStyle: 'italic' }}>
          {product.tagline}
        </p>
      </a>

      <div style={{ padding: '1.35rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: COLORS.gray700, lineHeight: 1.75, fontSize: '0.95rem', margin: 0, flex: 1 }}>
          {product.description}
        </p>

        <div style={{ background: 'rgba(201,162,95,0.12)', borderRadius: 10, padding: '0.85rem 1rem' }}>
          <p style={{ color: COLORS.navy, fontSize: '0.84rem', fontWeight: 700, margin: 0 }}>
            Best for: {product.bestFor.join(' • ')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
          <a
            href={fitHref}
            data-track="true"
            data-track-event="legacy_checkup_started"
            data-track-cta="true"
            data-product-interest={product.productInterest}
            data-product-slug={product.slug}
            style={{
              display: 'block',
              background: COLORS.gold,
              color: COLORS.navy,
              textAlign: 'center',
              padding: '0.9rem 1rem',
              borderRadius: 10,
              fontWeight: 800,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Find My Fit →
          </a>

          <a
            href={secondary.href}
            target={secondary.target}
            rel={secondary.rel}
            data-track="true"
            data-track-event={secondary.eventType}
            data-track-cta="true"
            data-product-interest={product.productInterest}
            data-product-slug={product.slug}
            style={{
              display: 'block',
              background: COLORS.white,
              color: COLORS.navy,
              border: `1px solid ${COLORS.goldBorder}`,
              textAlign: 'center',
              padding: '0.8rem 1rem',
              borderRadius: 10,
              fontWeight: 750,
              textDecoration: 'none',
              fontSize: '0.92rem',
            }}
          >
            {secondary.label}
          </a>
        </div>
      </div>
    </article>
  )
}
