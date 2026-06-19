export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { GET as canonicalGet, POST as canonicalPost } from '@/app/api/webhooks/fillout/route'

export const GET = canonicalGet
export const POST = canonicalPost
