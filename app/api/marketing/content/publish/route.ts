export const dynamic = 'force-dynamic'
import { publishMarketingContent } from '@/app/api/marketing/_lib/publishMarketingContent'

export async function POST(req: Request) {
  return publishMarketingContent(req)
}
