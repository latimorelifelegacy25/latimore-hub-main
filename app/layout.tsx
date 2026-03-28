import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Suspense } from 'react'
import PublicTracker from './_components/public-tracker'

// Set the canonical base domain used for generating absolute URLs and OpenGraph metadata.
// This value should match the production domain (`latimorelifelegacy.com`) rather than the
// old Vercel preview domain. It can still be overridden via the NEXT_PUBLIC_BASE_URL
// environment variable if necessary.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://latimorelifelegacy.com'

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

const GA4_ID = process.env.GA4_ID || ''

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {GA4_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}',{page_path:window.location.pathname});`,
              }}
            />
          </>
        )}
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
                  telephone: '+18568951457',
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
      <body><Suspense fallback={null}><PublicTracker /></Suspense>{children}</body>
    </html>
  )
}
