import { prisma } from '@/lib/prisma'
import { decryptToken } from '@/lib/crypto'
import { getSocialConnection } from '@/lib/social'
import { fetchPageInsights, fetchInstagramInsights } from '@/lib/social/facebook-oauth'

export type AccountSyncResult = {
  platform: 'facebook' | 'instagram'
  status: 'synced' | 'skipped' | 'failed'
  externalId?: string
  metricDate?: string
  error?: string
}

function startOfToday(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function latestValue(values: Array<{ value: number | Record<string, number> }> | undefined): number {
  const last = values?.[values.length - 1]?.value
  return typeof last === 'number' ? last : 0
}

export async function syncFacebookAccountMetrics(): Promise<AccountSyncResult> {
  const connection = await getSocialConnection('facebook')
  const accessToken = decryptToken(connection?.accessToken)
  if (!accessToken || !connection?.externalId) {
    return { platform: 'facebook', status: 'skipped', error: 'No connected Facebook page found' }
  }

  const [daily, lifetime] = await Promise.all([
    fetchPageInsights(connection.externalId, accessToken, ['page_impressions', 'page_engaged_users'], 'day'),
    fetchPageInsights(connection.externalId, accessToken, ['page_fans'], 'lifetime'),
  ])

  const metricDate = startOfToday()
  const impressions = latestValue(daily.metrics.find((m) => m.name === 'page_impressions')?.values)
  const engagedUsers = latestValue(daily.metrics.find((m) => m.name === 'page_engaged_users')?.values)
  const followers = latestValue(lifetime.metrics.find((m) => m.name === 'page_fans')?.values)

  await prisma.socialAccountMetric.upsert({
    where: { provider_externalId_metricDate: { provider: 'facebook', externalId: connection.externalId, metricDate } },
    create: {
      provider: 'facebook',
      externalId: connection.externalId,
      metricDate,
      followers,
      impressions,
      engagedUsers,
      raw: { daily: daily.metrics, lifetime: lifetime.metrics },
    },
    update: {
      followers,
      impressions,
      engagedUsers,
      raw: { daily: daily.metrics, lifetime: lifetime.metrics },
    },
  })

  return { platform: 'facebook', status: 'synced', externalId: connection.externalId, metricDate: metricDate.toISOString() }
}

export async function syncInstagramAccountMetrics(): Promise<AccountSyncResult> {
  const connection = await getSocialConnection('instagram')
  const accessToken = decryptToken(connection?.accessToken)
  if (!accessToken || !connection?.externalId) {
    return { platform: 'instagram', status: 'skipped', error: 'No connected Instagram business account found' }
  }

  const insights = await fetchInstagramInsights(connection.externalId, accessToken, ['reach', 'profile_views'], 'day')

  const metricDate = startOfToday()
  const reach = latestValue(insights.metrics.find((m) => m.name === 'reach')?.values)
  const profileViews = latestValue(insights.metrics.find((m) => m.name === 'profile_views')?.values)

  await prisma.socialAccountMetric.upsert({
    where: { provider_externalId_metricDate: { provider: 'instagram', externalId: connection.externalId, metricDate } },
    create: {
      provider: 'instagram',
      externalId: connection.externalId,
      metricDate,
      followers: insights.followersCount,
      reach,
      profileViews,
      raw: insights.metrics,
    },
    update: {
      followers: insights.followersCount,
      reach,
      profileViews,
      raw: insights.metrics,
    },
  })

  return { platform: 'instagram', status: 'synced', externalId: connection.externalId, metricDate: metricDate.toISOString() }
}
