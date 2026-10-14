import type { Metadata } from 'next'
import ContactLanding from './ContactLanding'
export const metadata: Metadata = {
 title: 'Contact Jackson Latimore | Coal Region Insurance',
 description: 'Protecting Today. Securing Tomorrow. Free, no-obligation family protection reviews across Schuylkill, Luzerne, and Northumberland Counties, PA.',
 alternates: { canonical: '/contact' },
 openGraph: { url: '/contact', title: 'Contact Jackson Latimore | Latimore Life & Legacy', description: 'Schedule a free protection review with Latimore Life & Legacy in Pennsylvania\'s Coal Region.', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Latimore Life & Legacy - Protecting Today. Securing Tomorrow.' }] },
}
export default function ContactPage() { return <ContactLanding /> }
