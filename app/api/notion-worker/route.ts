import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { callNotionWorker } from '@/lib/notion-worker'

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

export async function POST(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const data = await callNotionWorker(body)
    const status = data?.ok === false && data?.status ? data.status : 200
    return NextResponse.json(data, { status })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
