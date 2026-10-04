import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { rateLimit } from '@/lib/rate-limit'
import { callNotionWorker } from '@/lib/notion-worker'
import { NotionWorkerSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    ok: true,
    route: '/api/notion-worker',
    workerUrl: process.env.NOTION_WORKER_URL ?? process.env.LATIMORE_NOTION_WORKER_URL ?? 'https://latimore-notion-worker.jackson1989.workers.dev',
    actions: ['create_page', 'append_page'],
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'adminSend', auth.email ?? undefined)
  if (limited) return limited

  try {
    const parsed = NotionWorkerSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 422 })
    }
    const data = await callNotionWorker(parsed.data)
    if (data?.ok === false) {
      // Do not relay the worker's raw error payload to the browser.
      logger.error({ status: data.status, err: data.error }, 'Notion worker request failed')
      return NextResponse.json({ ok: false, error: 'Notion worker request failed' }, { status: 502 })
    }
    return NextResponse.json(data)
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Notion worker route error')
    return NextResponse.json({ ok: false, error: 'Notion worker request failed' }, { status: 500 })
  }
}
