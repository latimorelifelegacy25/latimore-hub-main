import { BRAND, COLORS } from '@/lib/brand'
import { SiteFooter, SiteHeader, DEFAULT_NAV_LINKS } from '@/app/_components/site-shell'
import { getProductBySlug } from '@/lib/products/catalog'
import ProductFitForm from './ProductFitForm'

type PageProps = {
  searchParams?: Promise<{ product?: string | string[] }>
}

function pickProduct(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

export default async function FindMyFitPage({ searchParams }: PageProps) {
  const params = await searchParams
  const selectedProductSlug = pickProduct(params?.product)
  const selectedProduct = getProductBySlug(selectedProductSlug)

  return (
    <>
      <SiteHeader currentPath="/products" navLinks={DEFAULT_NAV_LINKS} />
      <main>
        <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyHero} 100%)`, color: COLORS.white, padding: '4.25rem 0 3.25rem' }}>
          <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px' }}>
            <p style={{ color: COLORS.goldLight, fontWeight: 850, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Product Match Quiz
            </p>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.15rem)', lineHeight: 1.08, margin: '0 0 1rem' }}>
              Find My Fit
            </h1>
            <p style={{ maxWidth: 760, color: 'rgba(255,255,255,0.82)', lineHeight: 1.8, fontSize: '1.05rem', margin: 0 }}>
              Answer a few questions so we can recommend a good starting point and create a CRM-ready inquiry with your product context, timeline, and best follow-up window.
            </p>
            {selectedProduct ? (
              <div style={{ marginTop: '1.2rem', display: 'inline-flex', background: 'rgba(201,162,95,0.16)', border: '1px solid rgba(229,200,130,0.32)', color: COLORS.goldLight, borderRadius: 999, padding: '0.55rem 0.9rem', fontWeight: 750 }}>
                Starting from: {selectedProduct.name}
              </div>
            ) : null}
          </div>
        </section>

        <section style={{ background: COLORS.goldCream, padding: '3rem 0 4.5rem' }}>
          <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px' }}>
            <ProductFitForm
              selectedProductSlug={selectedProduct?.slug ?? ''}
              selectedProductName={selectedProduct?.name ?? ''}
              selectedProductInterest={selectedProduct?.productInterest ?? 'General'}
            />

            <p style={{ color: COLORS.gray600, fontSize: '0.86rem', lineHeight: 1.7, marginTop: '1.2rem' }}>
              This is an educational starting point, not a quote, legal advice, tax advice, investment advice, or a guarantee of eligibility. Final recommendations depend on your goals, health, budget, state availability, underwriting, and product terms. You can also call {BRAND.phone}.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
