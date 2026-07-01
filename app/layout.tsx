import type { Metadata, Viewport } from 'next'
import './globals.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { Suspense } from 'react'
import PublicTracker from './_components/public-tracker'
import Chatbot from '@/components/Chatbot'
import { Analytics } from '@vercel/analytics/next'
import { GoogleTagManager } from '@next/third-parties/google'

// Set the canonical base domain used for generating absolute URLs and OpenGraph metadata.
// This value should match the production canonical domain. It can still be overridden via
// the NEXT_PUBLIC_BASE_URL environment variable when necessary.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.latimorelifelegacy.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Latimore Life & Legacy | Education-First Insurance Protection',
    template: '%s | Latimore Life & Legacy',
  },
  description:
    'Independent insurance guidance for families, pre-retirees, and local employers across Schuylkill, Luzerne, and Northumberland Counties, PA. Clear plans, no pressure.',
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
    title: 'Latimore Life & Legacy | Education-First Protection',
    description: 'Clear, honest insurance guidance for PA families. No pressure. No jargon.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Latimore Life & Legacy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Latimore Life & Legacy',
    description: 'Education-first insurance protection for PA families.',
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
                  '@type': 'LocalBusiness',
                  '@id': `${BASE_URL}/#business`,
                  name: 'Latimore Life & Legacy LLC',
                  description: 'Independent insurance agency serving Central PA families and employers.',
                  url: BASE_URL,
                  telephone: '+17176152613',
                  email: 'jackson1989@latimorelegacy.com',
                  founder: { '@type': 'Person', name: 'Jackson M. Latimore Sr.' },
                  areaServed: [
                    { '@type': 'AdministrativeArea', name: 'Schuylkill County, PA' },
                    { '@type': 'AdministrativeArea', name: 'Luzerne County, PA' },
                    { '@type': 'AdministrativeArea', name: 'Northumberland County, PA' },
                  ],
                  serviceType: ['Life Insurance', 'Living Benefits', 'IUL', 'Annuities', 'Key Person Insurance', 'Retirement Planning'],
                  hasCredential: [
                    { '@type': 'EducationalOccupationalCredential', name: 'PA Insurance License #1268820' },
                    { '@type': 'EducationalOccupationalCredential', name: 'NIPR #21638507' },
                  ],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${BASE_URL}/#website`,
                  url: BASE_URL,
                  name: 'Latimore Life & Legacy',
                  publisher: { '@id': `${BASE_URL}/#business` },
                },
              ],
            }),
          }}
        />
      </head>
      <body>
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
