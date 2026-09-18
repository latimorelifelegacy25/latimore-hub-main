import type { Metadata, Viewport } from 'next'
import './globals.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { Suspense } from 'react'
import PublicTracker from './_components/public-tracker'
import AnnouncementTicker from './_components/announcement-ticker'
import Chatbot from '@/components/Chatbot'
import { Analytics } from '@vercel/analytics/next'
import { GoogleTagManager } from '@next/third-parties/google'
import { BRAND } from '@/lib/brand'

// Set the canonical base domain used for generating absolute URLs and OpenGraph metadata.
// This value should match the production canonical domain. It can still be overridden via
// the NEXT_PUBLIC_BASE_URL environment variable when necessary.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.latimorelifelegacy.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Life Insurance & Annuities in Pennsylvania's Coal Region | Latimore Life & Legacy",
    template: '%s | Latimore Life & Legacy',
  },
  description:
    "Independent life insurance, annuity, mortgage protection and retirement-income guidance for families and businesses across Pennsylvania's Coal Region.",
  keywords: [
    'life insurance Schuylkill County',
    'life insurance Luzerne County',
    'life insurance Northumberland County',
    'living benefits Pennsylvania',
    'IUL annuities PA',
    'key person insurance PA',
    'retirement planning coal region',
    'Latimore Life Legacy',
    'Jackson Latimore insurance',
    'independent insurance advisor Pennsylvania',
  ],
  authors: [{ name: 'Jackson M. Latimore Sr.' }],
  creator: 'Latimore Life & Legacy LLC',
  publisher: 'Latimore Life & Legacy LLC',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Latimore Life & Legacy',
    title: "Life Insurance & Annuities in Pennsylvania's Coal Region | Latimore Life & Legacy",
    description: 'Local, education-first insurance guidance for families and businesses across Schuylkill, Luzerne, and Northumberland Counties.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Latimore Life & Legacy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Latimore Life & Legacy',
    description: "Local, education-first insurance guidance for Pennsylvania's Coal Region.",
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: BASE_URL },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0F17',
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || ''

const GA4_MAIN = process.env.NEXT_PUBLIC_MAIN_GA4_ID || process.env.NEXT_PUBLIC_GA4_ID || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ''
const GA4_CAMPAIGN = process.env.NEXT_PUBLIC_CAMPAIGN_GA4_ID || ''
const GA4_APP = process.env.NEXT_PUBLIC_APP_GA4_ID || ''
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || ''

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaIds = [GA4_MAIN, GA4_CAMPAIGN, GA4_APP].filter(Boolean)

  return (
    <html lang="en">
      <head>
        {gaIds.length > 0 && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaIds[0]}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${gaIds.map(id => `gtag('config','${id}',{page_path:window.location.pathname});`).join('')}`,
              }}
            />
          </>
        )}
        {META_PIXEL_ID ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
            }}
          />
        ) : null}

        {TIKTOK_PIXEL_ID ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments)))}};for(var i=0;i<ttq.methods.length;i++){ttq.setAndDefer(ttq,ttq.methods[i]);}ttq.load=function(e){var n='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=n;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]={};var a=d.createElement('script');a.type='text/javascript';a.async=!0;a.src=n+'?sdkid='+e+'&lib='+t;var s=d.getElementsByTagName('script')[0];s.parentNode.insertBefore(a,s)};ttq.load('${TIKTOK_PIXEL_ID}');ttq.page();}(window,document,'ttq');`,
            }}
          />
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'InsuranceAgency',
                  '@id': `${BASE_URL}/#business`,
                  name: BRAND.name,
                  legalName: BRAND.fullName,
                  description:
                    "Independent, education-first insurance agency serving families, workers, retirees, and business owners across Pennsylvania's Coal Region.",
                  url: BASE_URL,
                  logo: `${BASE_URL}/logo.jpg`,
                  telephone: BRAND.phoneHref.replace('tel:', ''),
                  email: BRAND.email,
                  slogan: BRAND.tagline,
                  sameAs: [BRAND.facebookUrl, BRAND.instagramUrl, BRAND.linkedinUrl],
                  founder: {
                    '@type': 'Person',
                    '@id': `${BASE_URL}/about#jackson-latimore`,
                    name: 'Jackson M. Latimore Sr.',
                    jobTitle: 'Founder & Independent Insurance Broker',
                    url: `${BASE_URL}/about`,
                  },
                  contactPoint: {
                    '@type': 'ContactPoint',
                    telephone: BRAND.phoneHref.replace('tel:', ''),
                    contactType: 'customer service',
                    areaServed: 'PA',
                    availableLanguage: ['English'],
                  },
                  areaServed: [
                    { '@type': 'AdministrativeArea', name: 'Schuylkill County, Pennsylvania' },
                    { '@type': 'AdministrativeArea', name: 'Luzerne County, Pennsylvania' },
                    { '@type': 'AdministrativeArea', name: 'Northumberland County, Pennsylvania' },
                  ],
                  serviceType: [
                    'Life Insurance',
                    'Living Benefits',
                    'Mortgage Protection',
                    'Final Expense Insurance',
                    'Whole Life Insurance',
                    'Indexed Universal Life Insurance',
                    'Fixed Indexed Annuities',
                    'Retirement Income Strategies',
                    'Key Person Insurance',
                    'Business Continuity Planning',
                    'Estate and Legacy Planning Education',
                  ],
                  knowsAbout: [
                    'Life insurance',
                    'Living benefits',
                    'Mortgage protection',
                    'Final expense insurance',
                    'Annuities',
                    'Retirement income',
                    'Business insurance',
                    'Legacy planning',
                  ],
                  hasOfferCatalog: {
                    '@type': 'OfferCatalog',
                    name: 'Insurance and Protection Services',
                    itemListElement: [
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Life Insurance & Living Benefits', url: `${BASE_URL}/services/life-insurance` } },
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mortgage Protection', url: `${BASE_URL}/services/mortgage-protection` } },
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Retirement Income Strategies', url: `${BASE_URL}/services/retirement-income` } },
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Business & Key-Person Insurance', url: `${BASE_URL}/services/business-continuity` } },
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Estate & Legacy Coordination', url: `${BASE_URL}/services/estate-planning` } },
                    ],
                  },
                  hasCredential: [
                    { '@type': 'EducationalOccupationalCredential', name: `Pennsylvania Insurance License #${BRAND.paLicense}` },
                    { '@type': 'EducationalOccupationalCredential', name: `NIPR #${BRAND.nipr}` },
                  ],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${BASE_URL}/#website`,
                  url: BASE_URL,
                  name: 'Latimore Life & Legacy',
                  publisher: { '@id': `${BASE_URL}/#business` },
                  inLanguage: 'en-US',
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <AnnouncementTicker />
        {GTM_ID ? <GoogleTagManager gtmId={GTM_ID} /> : null}
        {META_PIXEL_ID ? (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: 'none' }} src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} alt="" />
          </noscript>
        ) : null}
        <Suspense fallback={null}><PublicTracker /></Suspense>
        {children}
        <Chatbot />
        <Analytics />
      </body>
    </html>
  )
}
