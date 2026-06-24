import { BRAND, COLORS } from '@/lib/brand'
import { Briefcase, Shield, TrendingUp } from 'lucide-react'
import { SiteHeader, SiteFooter, DEFAULT_NAV_LINKS } from '@/app/_components/site-shell'
import { PRODUCT_CATEGORY_LABELS, getProductsByCategory, type ProductCategory } from '@/lib/products/catalog'
import { ProductCard } from './_components/ProductCard'
import { ProductComparison } from './_components/ProductComparison'
import { MobileStickyCta } from './_components/MobileStickyCta'

const categoryOrder: ProductCategory[] = ['life', 'annuity', 'business']

const categoryStyles: Record<ProductCategory, { icon: React.ReactNode; background: string; intro: string }> = {
  life: {
    icon: <Shield size={30} />,
    background: COLORS.white,
    intro: 'Protection for families, homeowners, income earners, and long-term legacy planning.',
  },
  annuity: {
    icon: <TrendingUp size={30} />,
    background: COLORS.gray50,
    intro: 'Retirement-income and conservative accumulation strategies designed around product terms and time horizon.',
  },
  business: {
    icon: <Briefcase size={30} />,
    background: COLORS.white,
    intro: 'Coverage strategies that help owners protect continuity, key people, and succession planning.',
  },
}

export default function ProductsPage() {
  return (
    <>
      <SiteHeader currentPath="/products" navLinks={DEFAULT_NAV_LINKS} />

      <main>
        <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyHero} 100%)`, color: COLORS.white, padding: '4.75rem 0 4rem', textAlign: 'center' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 20px' }}>
            <p style={{ color: COLORS.goldLight, fontWeight: 850, letterSpacing: 2, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
              Products + Guidance
            </p>
            <h1 style={{ fontSize: 'clamp(2.15rem, 5vw, 3.45rem)', lineHeight: 1.08, margin: '0 0 1.25rem' }}>
              Find the right starting point for <span style={{ color: COLORS.goldLight }}>your life stage</span>
            </h1>
            <p style={{ fontSize: '1.08rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.8, maxWidth: 760, margin: '0 auto 1.8rem' }}>
              Answer a few guided questions and enter the CRM with the product interest, timeline, and follow-up context needed for a sharper consultation.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/products/find-my-fit"
                data-track="true"
                data-track-event="legacy_checkup_started"
                data-track-cta="true"
                style={{ background: COLORS.gold, color: COLORS.navy, padding: '1rem 1.45rem', borderRadius: 999, fontWeight: 900, textDecoration: 'none' }}
              >
                Find My Fit
              </a>
              <a
                href={BRAND.bookingUrl}
                data-track="true"
                data-track-event="book_consultation_clicked"
                data-track-cta="true"
                style={{ background: COLORS.white, color: COLORS.navy, padding: '1rem 1.45rem', borderRadius: 999, fontWeight: 850, textDecoration: 'none' }}
              >
                Book Free Consultation
              </a>
              <a
                href={`tel:${BRAND.phoneRaw}`}
                data-track="true"
                data-track-event="call_click"
                data-track-cta="true"
                style={{ background: 'transparent', color: COLORS.white, border: `1px solid rgba(255,255,255,0.38)`, padding: '1rem 1.45rem', borderRadius: 999, fontWeight: 850, textDecoration: 'none' }}
              >
                Call {BRAND.phone}
              </a>
            </div>
            <p style={{ margin: '1rem 0 0', color: 'rgba(255,255,255,0.68)', fontSize: '0.9rem' }}>
              No pressure. No quote engine. Just a cleaner way to narrow the options before we talk.
            </p>
          </div>
        </section>

        {categoryOrder.map((category) => {
          const settings = categoryStyles[category]
          const products = getProductsByCategory(category)

          return (
            <section key={category} style={{ padding: '4.75rem 0', background: settings.background }}>
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2.25rem' }}>
                  <span style={{ color: COLORS.gold, background: COLORS.goldPale, borderRadius: 14, padding: '0.8rem', display: 'inline-flex' }}>{settings.icon}</span>
                  <div>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.35rem)', color: COLORS.navy, margin: '0 0 0.45rem' }}>
                      {PRODUCT_CATEGORY_LABELS[category]}
                    </h2>
                    <p style={{ color: COLORS.gray600, margin: 0, maxWidth: 760, lineHeight: 1.7 }}>{settings.intro}</p>
                  </div>
                </div>

                <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: '1.25rem' }}>
                  {products.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                  ))}
                </div>
              </div>
            </section>
          )
        })}

        <ProductComparison />

        <section style={{ padding: '3.5rem 0', background: COLORS.white }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ background: COLORS.goldPale, border: `1px solid ${COLORS.goldBorder}`, borderRadius: 18, padding: '1.35rem', color: COLORS.gray700, lineHeight: 1.7, fontSize: '0.92rem' }}>
              <strong style={{ color: COLORS.navy }}>Important:</strong> Product information on this page is educational only and is not a quote, tax advice, legal advice, investment advice, or a guarantee of eligibility. Final recommendations depend on goals, health, budget, state availability, underwriting, and product terms. Business strategies should be coordinated with qualified tax and legal professionals.
            </div>
          </div>
        </section>

        <section style={{ background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldLight} 100%)`, padding: '4rem 0', textAlign: 'center' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 20px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.35rem)', color: COLORS.navy, margin: '0 0 1rem' }}>
              Not sure which product is right for you?
            </h2>
            <p style={{ fontSize: '1.05rem', color: COLORS.navy, margin: '0 0 1.75rem', lineHeight: 1.75 }}>
              That is exactly what Find My Fit is for. We will narrow the first step, preserve the context, and make the follow-up more useful.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/products/find-my-fit"
                data-track="true"
                data-track-event="legacy_checkup_started"
                data-track-cta="true"
                style={{ background: COLORS.navy, color: COLORS.white, padding: '1rem 1.5rem', borderRadius: 999, fontWeight: 900, textDecoration: 'none' }}
              >
                Find My Fit
              </a>
              <a
                href={BRAND.bookingUrl}
                data-track="true"
                data-track-event="book_consultation_clicked"
                data-track-cta="true"
                style={{ background: COLORS.white, color: COLORS.navy, padding: '1rem 1.5rem', borderRadius: 999, fontWeight: 850, textDecoration: 'none' }}
              >
                Book Free Consultation
              </a>
            </div>
          </div>
        </section>
      </main>

      <MobileStickyCta />
      <style>{`
        @media (max-width: 720px) {
          .product-grid { grid-template-columns: 1fr !important; }
          body { padding-bottom: 76px; }
          .products-mobile-sticky {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: 12px;
            z-index: 60;
            display: flex;
            gap: 0.65rem;
            padding: 0.65rem;
            border-radius: 999px;
            background: rgba(255,255,255,0.96);
            box-shadow: 0 16px 34px rgba(14,26,43,0.22);
            border: 1px solid rgba(14,26,43,0.08);
          }
        }
        @media (min-width: 721px) {
          .products-mobile-sticky { display: none; }
        }
      `}</style>
      <SiteFooter />
    </>
  )
}
