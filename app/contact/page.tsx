import type { Metadata } from 'next'
import ContactLanding from './ContactLanding'
export const metadata: Metadata = {
 title: 'Contact Jackson Latimore | Latimore Life & Legacy LLC',
 description: 'Protecting Today. Securing Tomorrow. Free, no-obligation family protection reviews across Schuylkill, Luzerne, and Northumberland Counties, PA.',
 alternates: { canonical: '/contact' },
 openGraph: { url: '/contact', images: [{ url: '/landing/images/latimore-life-legacy-logo.jpg' }] },
}
export default function ContactPage() { return <ContactLanding /> }
