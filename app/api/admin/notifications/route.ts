import { NextRequest, NextResponse } from 'next/server'
import { getNotifications, getNotificationStats, markAllAsRead, markAsRead } from '@/lib/notifications'
import { requireAdminSession } from '@/lib/ai/shared'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type NotificationFilter = 'all' | 'unread' | 'urgent'

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const filter = (req.nextUrl.searchParams.get('filter') ?? 'all') as NotificationFilter
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 50) || 50))

    const notifications = getNotifications({
      unreadOnly: filter === 'unread',
      priority: filter === 'urgent' ? 'urgent' : undefined,
      limit,
    })

    return NextResponse.json({
      ok: true,
      data: notifications.map(notification => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
      })),
      stats: getNotificationStats(),
    })
  } catch (error) {
    logger.error({ error }, 'admin notifications GET failed')
    return NextResponse.json({ ok: false, error: 'Failed to load notifications.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json().catch(() => ({}))
    const action = body?.action

    if (action === 'mark_read' && typeof body?.id === 'string') {
      return NextResponse.json({ ok: true, changed: markAsRead(body.id) })
    }

    if (action === 'mark_all_read') {
      return NextResponse.json({ ok: true, changed: markAllAsRead() })
    }

    return NextResponse.json({ ok: false, error: 'Invalid notification action.' }, { status: 400 })
  } catch (error) {
    logger.error({ error }, 'admin notifications POST failed')
    return NextResponse.json({ ok: false, error: 'Failed to update notifications.' }, { status: 500 })
  }
}
