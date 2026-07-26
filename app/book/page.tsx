import type { Metadata } from 'next'
import ConsultBookingFlow from '@/components/booking/ConsultBookingFlow'

export const metadata: Metadata = {
  title: 'Book a Consultation | Latimore Life & Legacy',
  description:
    'Complete a secure Latimore Life & Legacy consultation intake and schedule a 30-minute conversation with Jackson.',
  alternates: {
    canonical: 'https://www.latimorelifelegacy.com/book',
  },
}

export default function BookPage() {
  return <ConsultBookingFlow />
}
