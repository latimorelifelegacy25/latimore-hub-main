import { COLORS } from '@/lib/brand'

const comparisons = [
  {
    title: 'Term vs. Whole Life',
    left: 'Term life is built for efficient protection during a defined period, often when family income, mortgage, or child-raising needs are highest.',
    right: 'Whole life is permanent coverage with cash value features and long-term legacy or final-expense planning use cases.',
  },
  {
    title: 'FIA vs. MYGA',
    left: 'A fixed indexed annuity can credit interest based on index formulas while avoiding direct market-loss exposure, subject to contract terms.',
    right: 'A MYGA provides a fixed guaranteed rate for a set period and is often reviewed as a conservative fixed-rate option.',
  },
  {
    title: 'Key Person vs. Buy-Sell',
    left: 'Key person coverage helps protect the business from the loss of a vital owner or employee.',
    right: 'Buy-sell funding helps surviving owners buy out a deceased owner’s interest under a formal agreement.',
  },
]

export function ProductComparison() {
  return (
    <section style={{ padding: '4.5rem 0', background: COLORS.goldCream }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ maxWidth: 760, marginBottom: '2rem' }}>
          <p style={{ color: COLORS.gold, fontWeight: 850, letterSpacing: 1.5, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            Decision Helpers
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.35rem)', color: COLORS.navy, margin: 0 }}>
            Quick comparisons before you book
          </h2>
          <p style={{ color: COLORS.gray600, lineHeight: 1.75, fontSize: '1rem' }}>
            These are educational starting points only. The right fit depends on goals, budget, health, eligibility, state availability, and product terms.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {comparisons.map((item) => (
            <article
              key={item.title}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.goldBorder}`,
                borderRadius: 16,
                padding: '1.35rem',
                boxShadow: '0 10px 26px rgba(14,26,43,0.06)',
              }}
            >
              <h3 style={{ color: COLORS.navy, margin: '0 0 1rem', fontSize: '1.05rem' }}>{item.title}</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <p style={{ color: COLORS.gray700, margin: 0, lineHeight: 1.65, fontSize: '0.92rem' }}>{item.left}</p>
                <p style={{ color: COLORS.gray700, margin: 0, lineHeight: 1.65, fontSize: '0.92rem' }}>{item.right}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
