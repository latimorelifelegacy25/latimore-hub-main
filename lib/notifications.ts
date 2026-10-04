/**
 * Notification System for Latimore Hub
 * Real-time alerts and notifications for admins
 */

import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface Notification {
  id: string
  type: 'lead' | 'task' | 'appointment' | 'system' | 'conversion'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
  contactId?: string
  taskId?: string
  appointmentId?: string
}

export interface NotificationPreferences {
  email: boolean
  inApp: boolean
  sms: boolean
  leadAlerts: boolean
  taskReminders: boolean
  appointmentReminders: boolean
  systemAlerts: boolean
  conversionMilestones: boolean
}

// Notification preferences are static defaults. Nothing in the app edits them
// at runtime; keeping them out of module state avoids per-instance drift on serverless.
const preferences: NotificationPreferences = {
  email: true,
  inApp: true,
  sms: false,
  leadAlerts: true,
  taskReminders: true,
  appointmentReminders: true,
  systemAlerts: true,
  conversionMilestones: true,
}

const MAX_BATCH = 200
const TERMINAL_TASK_STATUSES = ['Completed', 'Done', 'Cancelled', 'completed', 'done', 'cancelled', 'COMPLETED', 'DONE', 'CANCELLED']
const ACTIVE_APPOINTMENT_STATUSES = ['Booked', 'Confirmed', 'scheduled', 'Scheduled', 'booked', 'confirmed']

type NotificationInput = Omit<Notification, 'id' | 'read' | 'createdAt'> & { dedupeKey?: string }

type NotificationRow = {
  id: string
  type: string
  priority: string
  title: string
  message: string
  data: unknown
  contactId: string | null
  taskId: string | null
  appointmentId: string | null
  readAt: Date | null
  createdAt: Date
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type as Notification['type'],
    priority: row.priority as Notification['priority'],
    title: row.title,
    message: row.message,
    data: row.data ?? undefined,
    read: row.readAt !== null,
    createdAt: row.createdAt,
    contactId: row.contactId ?? undefined,
    taskId: row.taskId ?? undefined,
    appointmentId: row.appointmentId ?? undefined,
  }
}

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Create a notification. If a notification with the same dedupeKey already exists
 * (unique constraint), the existing row is returned and nothing new is written.
 */
export async function createNotification(notification: NotificationInput): Promise<Notification> {
  const { dedupeKey, data, ...rest } = notification
  const key = dedupeKey ?? `${rest.type}:${randomUUID()}`

  try {
    const row = await prisma.notification.create({
      data: {
        ...rest,
        dedupeKey: key,
        data: data === undefined ? undefined : (data as Prisma.InputJsonValue),
      },
    })
    if (rest.priority === 'high' || rest.priority === 'urgent') {
      logger.warn(
        { notificationId: row.id, type: row.type, priority: row.priority, contactId: row.contactId },
        'High-priority notification created',
      )
    }
    return toNotification(row)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.notification.findUnique({ where: { dedupeKey: key } })
      if (existing) return toNotification(existing)
    }
    throw error
  }
}

/**
 * Create many notifications, skipping any whose dedupeKey already exists.
 * Returns the number of newly created rows.
 */
async function createManyDeduped(items: Array<NotificationInput & { dedupeKey: string }>): Promise<number> {
  if (items.length === 0) return 0
  const result = await prisma.notification.createMany({
    data: items.map(({ data, ...rest }) => ({
      ...rest,
      data: data === undefined ? undefined : (data as Prisma.InputJsonValue),
    })),
    skipDuplicates: true,
  })
  return result.count
}

/**
 * Get notifications (newest first) with optional filtering
 */
export async function getNotifications(options: {
  unreadOnly?: boolean
  type?: string
  priority?: string
  limit?: number
} = {}): Promise<Notification[]> {
  const rows = await prisma.notification.findMany({
    where: {
      ...(options.unreadOnly ? { readAt: null } : {}),
      ...(options.type ? { type: options.type } : {}),
      ...(options.priority ? { priority: options.priority } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(options.limit || 50, 1), 100),
  })
  return rows.map(toNotification)
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, readAt: null },
    data: { readAt: new Date() },
  })
  return result.count > 0
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { readAt: null },
    data: { readAt: new Date() },
  })
  return result.count
}

/**
 * Get notification preferences
 */
export function getNotificationPreferences(): NotificationPreferences {
  return { ...preferences }
}

/**
 * Automated notification triggers
 */

// High-lead-score alerts (at most one per contact per UTC day)
export async function checkHighLeadScoreAlerts() {
  if (!preferences.leadAlerts) return

  try {
    const highScoreContacts = await prisma.contact.findMany({
      where: {
        leadScore: { gte: 80 },
        status: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] }
      },
      select: { id: true, firstName: true, lastName: true, leadScore: true, email: true },
      orderBy: { leadScore: 'desc' },
      take: MAX_BATCH,
    })

    const day = dayKey()
    await createManyDeduped(highScoreContacts.map(contact => ({
      type: 'lead' as const,
      priority: 'high' as const,
      title: `High-Value Lead: ${contact.firstName} ${contact.lastName}`,
      message: `${contact.firstName} has a lead score of ${contact.leadScore}/100. Immediate follow-up recommended.`,
      data: { leadScore: contact.leadScore, email: contact.email },
      contactId: contact.id,
      dedupeKey: `lead:${contact.id}:${day}`,
    })))
  } catch (error) {
    logger.error({ error }, 'Failed to check high lead score alerts')
  }
}

// Overdue task alerts (at most one per task per UTC day)
export async function checkOverdueTaskAlerts() {
  if (!preferences.taskReminders) return

  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueAt: { lt: new Date() },
        status: { notIn: TERMINAL_TASK_STATUSES },
      },
      include: { contact: { select: { firstName: true, lastName: true } } },
      orderBy: { dueAt: 'asc' },
      take: MAX_BATCH,
    })

    const day = dayKey()
    await createManyDeduped(overdueTasks.map(task => ({
      type: 'task' as const,
      priority: 'urgent' as const,
      title: `Overdue Task: ${task.title}`,
      message: `Task "${task.title}" for ${task.contact?.firstName ?? 'unknown'} ${task.contact?.lastName ?? 'contact'} is overdue.`,
      data: { dueDate: task.dueAt, status: task.status },
      contactId: task.contactId || undefined,
      taskId: task.id,
      dedupeKey: `task:${task.id}:${day}`,
    })))
  } catch (error) {
    logger.error({ error }, 'Failed to check overdue task alerts')
  }
}

// Upcoming appointment alerts. Windows are wide enough to be caught by a
// 15-minute cron; each (appointment, window) fires at most once.
const APPOINTMENT_WINDOWS = [
  { key: '4h', minHours: 3.5, maxHours: 4.5, priority: 'medium' as const },
  { key: '1h', minHours: 0.5, maxHours: 1.5, priority: 'high' as const },
  { key: '15m', minHours: 0, maxHours: 0.5, priority: 'high' as const },
]

export async function checkUpcomingAppointmentAlerts() {
  if (!preferences.appointmentReminders) return

  try {
    const now = Date.now()
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        scheduledFor: {
          gte: new Date(now),
          lte: new Date(now + 4.5 * 60 * 60 * 1000),
        },
        status: { in: ACTIVE_APPOINTMENT_STATUSES },
      },
      include: { contact: { select: { firstName: true, lastName: true, phone: true, email: true } } },
      orderBy: { scheduledFor: 'asc' },
      take: MAX_BATCH,
    })

    const items: Array<NotificationInput & { dedupeKey: string }> = []
    for (const appointment of upcomingAppointments) {
      if (!appointment.scheduledFor) continue

      const hoursUntil = (appointment.scheduledFor.getTime() - now) / (1000 * 60 * 60)
      const window = APPOINTMENT_WINDOWS.find(w => hoursUntil >= w.minHours && hoursUntil < w.maxHours)
      if (!window) continue

      const minutes = Math.max(0, Math.round(hoursUntil * 60))
      const timeLabel = minutes >= 90 ? `${Math.round(hoursUntil)} hours` : `${minutes} minutes`
      items.push({
        type: 'appointment',
        priority: window.priority,
        title: `Upcoming Appointment: ${appointment.contact?.firstName ?? ''} ${appointment.contact?.lastName ?? ''}`.trim(),
        message: `Appointment in ${timeLabel} at ${appointment.scheduledFor.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })} ET.`,
        data: {
          startTime: appointment.scheduledFor,
          contactPhone: appointment.contact?.phone,
          contactEmail: appointment.contact?.email,
        },
        contactId: appointment.contactId,
        appointmentId: appointment.id,
        dedupeKey: `appointment:${appointment.id}:${window.key}`,
      })
    }
    await createManyDeduped(items)
  } catch (error) {
    logger.error({ error }, 'Failed to check upcoming appointment alerts')
  }
}

// Conversion milestone alerts (each conversion / milestone fires once, ever)
export async function checkConversionMilestoneAlerts() {
  if (!preferences.conversionMilestones) return

  try {
    const [recentConversions, totalConversions] = await Promise.all([
      prisma.contact.findMany({
        where: {
          status: 'CLOSED_WON',
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true, firstName: true, lastName: true, leadScore: true },
        orderBy: { updatedAt: 'desc' },
        take: MAX_BATCH,
      }),
      prisma.contact.count({ where: { status: 'CLOSED_WON' } }),
    ])

    const items: Array<NotificationInput & { dedupeKey: string }> = recentConversions.map(contact => ({
      type: 'conversion' as const,
      priority: 'medium' as const,
      title: `New Conversion: ${contact.firstName} ${contact.lastName}`,
      message: `Congratulations! ${contact.firstName} ${contact.lastName} has converted with a lead score of ${contact.leadScore || 0}/100.`,
      data: { leadScore: contact.leadScore },
      contactId: contact.id,
      dedupeKey: `conversion:${contact.id}`,
    }))

    // Alert on milestone conversions (10, 25, 50, 100, etc.)
    const milestones = [10, 25, 50, 100, 250, 500, 1000]
    const reached = milestones.filter(m => totalConversions >= m).pop()
    if (reached) {
      items.push({
        type: 'conversion',
        priority: 'high',
        title: `Milestone Achieved: ${reached} Conversions!`,
        message: `Congratulations! You've reached ${reached} total conversions. Keep up the excellent work!`,
        data: { totalConversions: reached },
        dedupeKey: `milestone:${reached}`,
      })
    }

    await createManyDeduped(items)
  } catch (error) {
    logger.error({ error }, 'Failed to check conversion milestone alerts')
  }
}

// System health alerts
export async function checkSystemHealthAlerts() {
  if (!preferences.systemAlerts) return

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    // Check for failed cron jobs (would need cron job monitoring in production)
    // For now, just check if there are any critical system issues
    // Note: EventType enum doesn't include ERROR, so we'll skip error counting for now
    const errorCount = 0 // Placeholder

    if (errorCount > 10) { // Arbitrary threshold
      await createNotification({
        type: 'system',
        priority: 'high',
        title: 'High Error Rate Detected',
        message: `${errorCount} errors occurred in the last hour. System health check recommended.`,
        data: { errorCount },
      })
    }
  } catch (error) {
    logger.error({ error }, 'Failed to check system health alerts')
    // Don't create notification about health check failure to avoid loops
  }
}

/**
 * Run all automated checks (called by cron job)
 */
export async function runAutomatedNotificationChecks() {
  await Promise.all([
    checkHighLeadScoreAlerts(),
    checkOverdueTaskAlerts(),
    checkUpcomingAppointmentAlerts(),
    checkConversionMilestoneAlerts(),
    checkSystemHealthAlerts(),
  ])
}

/**
 * Get notification statistics
 */
export async function getNotificationStats() {
  const [unread, byTypeRows, byPriorityRows] = await Promise.all([
    prisma.notification.count({ where: { readAt: null } }),
    prisma.notification.groupBy({ by: ['type'], _count: { _all: true } }),
    prisma.notification.groupBy({ by: ['priority'], _count: { _all: true } }),
  ])
  const byType = Object.fromEntries(byTypeRows.map(r => [r.type, r._count._all])) as Record<string, number>
  const byPriority = Object.fromEntries(byPriorityRows.map(r => [r.priority, r._count._all])) as Record<string, number>
  const total = Object.values(byType).reduce((a, b) => a + b, 0)

  return { total, unread, byType, byPriority }
}
