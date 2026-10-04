export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { getGoogleCalendarConnection } from '@/lib/calendar/google'
import { listGbpAccounts, listGbpLocations } from '@/lib/gbp/client'

/**
 * Admin-only GBP connection status. Never exposes tokens.
 * When connected, lists accounts/locations so GBP_LOCATION_NAME can be set
 * to the right "accounts/{id}/locations/{id}" value.
 */
export async function GET(_req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const connection = await getGoogleCalendarConnection()
  if (!connection?.accessToken) {
    return NextResponse.json({
      ok: true,
      connected: false,
      connect_url: '/api/gbp/connect',
      hint: 'Visit /api/gbp/connect as an admin to grant the business.manage scope.',
    })
  }

  try {
    const accounts = await listGbpAccounts()
    const withLocations = await Promise.all(
      accounts.map(async (account) => ({
        name: account.name,
        account_name: account.accountName,
        locations: account.name ? await listGbpLocations(account.name).catch(() => []) : [],
      })),
    )

    return NextResponse.json({
      ok: true,
      connected: true,
      account_email: connection.accountEmail,
      location_env_set: !!process.env.GBP_LOCATION_NAME,
      accounts: withLocations,
      hint: 'Set GBP_LOCATION_NAME to one of the accounts/{id}/locations/{id} values above.',
    })
  } catch (err) {
    return NextResponse.json({
      ok: true,
      connected: true,
      account_email: connection.accountEmail,
      accounts: [],
      warning: err instanceof Error ? err.message : String(err),
    })
  }
}
