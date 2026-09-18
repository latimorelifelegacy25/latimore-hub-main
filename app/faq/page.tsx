import type { Metadata } from 'next'
import { BRAND, COLORS } from '@/lib/brand'
import { SiteHeader, SiteFooter, DEFAULT_NAV_LINKS } from '@/app/_components/site-shell'

export const metadata: Metadata = {
  title: 'Life Insurance & Annuity FAQ | Coal Region PA',
  description:
    'Answers to common questions about life insurance, living benefits, mortgage protection, final expense coverage, annuities and working with Latimore Life & Legacy.',
  alternates: { canonical: '/faq' },
}

const faqs = [
  {
    question: 'What does Latimore Life & Legacy do?',
    answer:
      'Latimore Life & Legacy LLC is an independent, education-first insurance agency. We help families, workers, retirees and business owners understand and compare life insurance, living benefits, mortgage protection, final expense coverage, annuities, retirement-income strategies and business-protection options.',
  },
  {
    question: 'Who is Jackson M. Latimore Sr.?',
    answer:
      'Jackson M. Latimore Sr. is the founder of Latimore Life & Legacy LLC and a Pennsylvania-licensed independent insurance professional. His approach is built around plain-language education, preparation and helping clients understand the tradeoffs between available insurance options.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'Our primary service area is Pennsylvania’s Coal Region, including Schuylkill, Luzerne and Northumberland Counties. We work with families and businesses throughout communities such as Pottsville, Frackville, Shenandoah, Hazleton and Shamokin.',
  },
  {
    question: 'Are you tied to one insurance company?',
    answer:
      'No. Latimore Life & Legacy operates as an independent insurance brokerage rather than a captive single-carrier agency. Available carriers and products vary by eligibility, state availability and underwriting.',
  },
  {
    question: 'What kinds of life insurance do you help with?',
    answer:
      'Depending on the client’s needs and eligibility, we can help compare term life, whole life, indexed universal life, final expense, mortgage protection and other life-insurance options, including policies that may offer living-benefit riders.',
  },
  {
    question: 'What are living benefits?',
    answer:
      'Living-benefit riders may allow an eligible policyholder to access part of a life-insurance death benefit after a qualifying critical, chronic or terminal illness. Availability, definitions and benefits depend on the specific policy and carrier.',
  },
  {
    question: 'Do you help with annuities and retirement income?',
    answer:
      'Yes. We provide education about fixed and fixed indexed annuities and how contractual income features may fit alongside Social Security, pensions, retirement accounts and other resources. Product terms, liquidity and suitability should be reviewed carefully before any decision.',
  },
  {
    question: 'Can you help business owners?',
    answer:
      'Yes. Business-protection conversations can include key-person insurance, buy-sell funding and continuity planning. Legal, tax and accounting issues should be coordinated with the appropriate qualified professionals.',
  },
  {
    question: 'How much does a consultation cost?',
    answer:
      'The initial protection review is offered without a consultation fee. The purpose of the conversation is to understand your situation, explain available insurance options and determine whether there is a useful next step.',
  },
  {
    question: 'How do I schedule a consultation?',
    answer:
      `Use the Book Consultation page or call ${BRAND.phone}. Your information can be submitted securely through the Latimore Life & Legacy website so Jackson can prepare for the conversation.`,
  },
]

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <>
      <SiteHeader currentPath="/faq" navLinks={DEFAULT_NAV_LINKS} />
      <main style={{ background: COLORS.gray50 }}>
        <section
          style={{
            background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyHero} 100%)`,
            color: COLORS.white,
            padding: '4.5rem 1.25rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <p style={{ color: COLORS.goldLight, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.82rem' }}>
              Straight Answers
            </p>
            <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', lineHeight: 1.08, margin: '0.8rem 0 1rem' }}>
              Insurance Questions from the Coal Region
            </h1>
            <p style={{ color: 'rgba(255,255,255,.82)', fontSize: '1.08rem', lineHeight: 1.8, maxWidth: 720, margin: '0 auto' }}>
              Clear answers about life insurance, annuities, living benefits and protecting the people and things you have worked for.
            </p>
          </div>
        </section>

        <section style={{ maxWidth: 920, margin: '0 auto', padding: '4rem 1.25rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {faqs.map((item) => (
              <article key={item.question} style={{ background: COLORS.white, border: `1px solid ${COLORS.gray200}`, borderRadius: 16, padding: '1.5rem 1.6rem' }}>
                <h2 style={{ color: COLORS.navy, fontSize: '1.2rem', margin: '0 0 .65rem' }}>{item.question}</h2>
                <p style={{ color: COLORS.gray600, lineHeight: 1.8, margin: 0 }}>{item.answer}</p>
              </article>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1.6rem', borderRadius: 16, background: COLORS.navy, color: COLORS.white, textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 .65rem', fontSize: '1.5rem' }}>Still have a question?</h2>
            <p style={{ margin: '0 0 1.2rem', color: 'rgba(255,255,255,.78)' }}>
              Call {BRAND.phone} or schedule a conversation. No pressure—just a clear explanation of your options.
            </p>
            <a href={BRAND.bookingUrl} style={{ display: 'inline-block', background: COLORS.gold, color: COLORS.navy, fontWeight: 800, textDecoration: 'none', padding: '.85rem 1.25rem', borderRadius: 999 }}>
              Book a Consultation
            </a>
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </main>
      <SiteFooter />
    </>
  )
}
