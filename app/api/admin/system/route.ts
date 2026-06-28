export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    integrations: [
      { name: 'Facebook', status: 'disconnected' },
      { name: 'Instagram', status: 'disconnected' },
      { name: 'LinkedIn', status: 'disconnected' },
    ],
  })
}
