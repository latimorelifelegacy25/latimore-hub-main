import { redirect } from 'next/navigation'
import { trackVirtualBookingClick } from '@/lib/virtual-intake'
import { BRAND } from '@/lib/brand'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params
  await trackVirtualBookingClick(leadId)
  redirect(process.env.BOOK_WITH_JACKSON_URL || BRAND.bookingUrl)
}
