import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Fragment } from 'react'
import { BRAND } from '@/lib/brand'
import { SiteHeader, SiteFooter, DEFAULT_NAV_LINKS } from '@/app/_components/site-shell'
import { SERVICE_PAGES, getServicePage } from '@/lib/services-content'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://latimorelifelegacy.com'

const NAVY = '#0E1A2B'
const GOLD = '#C9A24D'
const GOLD_LIGHT = '#E5C882'
const CRIMSON = '#7A2331'

export async function generateStaticParams() {
  return SERVICE_PAGES.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = getServicePage(slug)
  if (!page) return {}

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${BASE_URL}/services/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
    },
  }
}

/** Renders `*text*` segments as gold <em> emphasis within headings. */
function renderHeading(text: string) {
  const parts = text.split(/\*(.+?)\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <em key={i} style={{ color: GOLD_LIGHT, fontStyle: 'normal' }}>
        {part}
      </em>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

/** Renders `**text**` segments as <strong> within body paragraphs. */
function renderBody(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>
  )
}

function serviceEducationUrl(serviceLabel: string) {
  const params = new URLSearchParams({
    utm_source: 'google_business_profile',
    utm_medium: 'service_page',
    utm_campaign: 'latimore_services',
    source: 'GBP_SERVICE_PAGE',
    service: serviceLabel,
  })

  return `/education?${params.toString()}`
}

function CtaButtons({ centered = false, large = false, label, serviceLabel }: { centered?: boolean; large?: boolean; label: string; serviceLabel: string }) {
  const paddingClass = large ? 'px-8 py-3' : 'px-4 py-2'
  const textClass = large ? 'text-base' : 'text-sm'

  return (
    <div className={`flex flex-wrap gap-4 ${centered ? 'justify-center' : ''}`}>
      <Link
        href={serviceEducationUrl(serviceLabel)}
        className={`rounded-md font-bold no-underline transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24D] focus-visible:ring-offset-[#0E1A2B] bg-[#C9A24D] text-[#0E1A2B] ${paddingClass} ${textClass}`}
      >
        {label}
      </Link>
      <a
        href={`tel:+1${BRAND.phoneRaw}`}
        className={`rounded-md font-bold no-underline transition-all hover:bg-[#C9A24D]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24D] focus-visible:ring-offset-[#0E1A2B] bg-transparent text-white border-2 border-[#C9A24D] ${paddingClass} ${textClass}`}
      >
        Call {BRAND.phone}
      </a>
    </div>
  )
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = getServicePage(slug)

  if (!page) {
    notFound()
  }

  return (
    <>
      <SiteHeader currentPath="/services" navLinks={DEFAULT_NAV_LINKS} />

      <main className="font-sans">
        {/* Hero */}
        <section
          className="text-center text-white py-16"
          style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a2942 100%)` }}
        >
          <div className="max-w-3xl mx-auto px-5">
            <p
              className="text-sm font-semibold tracking-widest uppercase mb-4"
              style={{ color: GOLD_LIGHT }}
            >
              Service {page.serviceNumber} · {page.serviceLabel}
            </p>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
              {page.heroPrefix}
              <br />
              <span style={{ color: GOLD_LIGHT }}>{page.heroEm}</span>
            </h1>

            <p className="text-white/85 text-lg leading-relaxed mb-8">{page.heroTagline}</p>

            <CtaButtons centered large label={page.heroCtaLabel} serviceLabel={page.serviceLabel} />
          </div>
        </section>

        {/* Problem / Intro + Stats */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-6xl mx-auto px-5">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <p
                  className="text-sm font-semibold tracking-widest uppercase mb-3"
                  style={{ color: '#9C7B2E' }}
                >
                  {page.problemLabel}
                </p>

                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
                  {renderHeading(page.problemHeading)}
                </h2>

                {page.problemParagraphs.map((paragraph, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed mb-4">
                    {renderBody(paragraph)}
                  </p>
                ))}

                <blockquote
                  className="border-l-4 pl-4 italic text-gray-600 my-6"
                  style={{ borderColor: GOLD }}
                >
                  {page.pullQuote}
                </blockquote>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {page.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-xl shadow-md border border-black/5 p-6"
                  >
                    <div className="font-extrabold text-3xl mb-2" style={{ color: GOLD }}>
                      {stat.value}
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">{stat.label}</div>
                    <div className="text-sm text-gray-600 leading-relaxed">{stat.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16" style={{ background: NAVY }}>
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-10">
              <p
                className="text-sm font-semibold tracking-widest uppercase mb-3"
                style={{ color: GOLD_LIGHT }}
              >
                {page.benefitsLabel}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {renderHeading(page.benefitsHeading)}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {page.benefits.map((benefit) => (
                <article
                  key={benefit.title}
                  className="rounded-xl p-6 border border-white/10 hover:border-[#C9A24D]/50 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="text-2xl mb-4" aria-hidden="true">
                    {benefit.icon}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{benefit.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Steps (optional) */}
        {page.steps && page.steps.length > 0 && (
          <section className="py-16 bg-gray-100">
            <div className="max-w-6xl mx-auto px-5">
              <div className="text-center mb-10">
                <p
                  className="text-sm font-semibold tracking-widest uppercase mb-3"
                  style={{ color: '#9C7B2E' }}
                >
                  {page.stepsLabel}
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {renderHeading(page.stepsHeading ?? '')}
                </h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                {page.steps.map((step) => (
                  <div
                    key={step.num}
                    className="bg-white rounded-xl shadow-md border border-black/5 p-6 text-center"
                  >
                    <div className="font-extrabold text-2xl mb-3" style={{ color: GOLD }}>
                      {step.num}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ + Keyword Tags */}
        <section className="py-16" style={{ background: NAVY }}>
          <div className="max-w-3xl mx-auto px-5">
            <div className="text-center mb-10">
              <p
                className="text-sm font-semibold tracking-widest uppercase mb-3"
                style={{ color: GOLD_LIGHT }}
              >
                {page.faqLabel}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {renderHeading(page.faqHeading)}
              </h2>
            </div>

            {page.faqs.length > 0 && (
              <div className="space-y-4 mb-10">
                {page.faqs.map((faq) => (
                  <div
                    key={faq.q}
                    className="rounded-xl p-6 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                    <p className="text-white/65 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              {page.keywordTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs rounded-full px-3 py-1 border border-white/15 text-white/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-16 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${CRIMSON} 0%, #5a1a25 100%)` }}
        >
          <div className="max-w-2xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{page.ctaHeading}</h2>

            <p className="text-white/85 text-lg mb-8 leading-relaxed">{page.ctaSubtext}</p>

            <CtaButtons centered large label={page.heroCtaLabel} serviceLabel={page.serviceLabel} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
