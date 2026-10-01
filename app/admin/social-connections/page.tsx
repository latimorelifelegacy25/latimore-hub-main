export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import PageHeader from '@/app/admin/_components/PageHeader'
import SocialConnectionsClient from './SocialConnectionsClient'

const FB_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Facebook connection failed: your session expired. Please try connecting again.',
  no_code: 'Facebook did not return an authorization code. Please try again.',
  token_exchange_failed: 'Facebook token exchange failed. Please try again.',
  no_pages: 'No Facebook Pages were found on that account. Connect with an account that manages a Facebook Page.',
  connect_failed: 'Facebook connection failed unexpectedly. Please try again.',
}

export default async function SocialConnectionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ fb_success?: string; fb_error?: string }>
}) {
  const params = (await searchParams) ?? {}
  const notice = params.fb_success
    ? 'Facebook connected successfully.'
    : params.fb_error
      ? (FB_ERROR_MESSAGES[params.fb_error] ?? 'Facebook connection failed. Please try again.')
      : null

  const socialConnectionModel = (prisma as any).socialConnection
  const connections: any[] = socialConnectionModel
    ? await socialConnectionModel.findMany({ orderBy: { updatedAt: 'desc' } })
    : []

  const serialized = connections.map((c: any) => ({
    ...c,
    tokenExpiresAt: c.tokenExpiresAt ? c.tokenExpiresAt.toISOString() : null,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
  }))

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Settings"
        title="Social Connections"
        description="Manage access tokens and credentials for social media publishing."
      />

      <SocialConnectionsClient initialConnections={serialized} notice={notice} />
    </div>
  )
}
