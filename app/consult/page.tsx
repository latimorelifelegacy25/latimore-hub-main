import type { Metadata } from 'next'
import ConsultBookingFlow from '@/components/booking/ConsultBookingFlow'

export const metadata: Metadata = {
  title: 'Free Insurance Consultation',
  description: 'Request a free, education-first insurance protection review with Jackson M. Latimore Sr. in Pennsylvania’s Coal Region.',
  alternates: { canonical: '/consult' },
}

export default function ConsultPage() {
  return <ConsultBookingFlow />
}