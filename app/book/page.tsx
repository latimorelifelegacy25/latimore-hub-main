import type { Metadata } from 'next'
import BookingDesign from './BookingDesign'
export const metadata: Metadata = {
 title: 'Book a Consultation | Latimore Life & Legacy',
 description: 'Schedule a free 30-minute consultation with Jackson M. Latimore Sr.',
 alternates: { canonical: '/book' },
}
export default function BookPage() { return <BookingDesign /> }
