/**
 * Google Business Profile API client — app-side wrapper.
 *
 * Supplies the OAuth access token from the server-side Google token store
 * (shared with the Calendar integration) and delegates the actual HTTP calls
 * to the import-free ./http module, which is also shared with the agent
 * harness. The public API of this module is unchanged: createLocalPost,
 * listGbpAccounts, listGbpLocations, and the Gbp* error classes.
 */

import { getValidGoogleAccessToken } from '@/lib/calendar/google'
import {
  createLocalPost as createLocalPostWithToken,
  listGbpAccounts as listGbpAccountsWithToken,
  listGbpLocations as listGbpLocationsWithToken,
  GbpNotConnectedError,
} from './http'
import type {
  CreateLocalPostInput,
  GbpLocalPost,
  GbpAccount,
  GbpLocation,
} from './http'

export { GbpNotConnectedError, GbpNotApprovedError, GbpError } from './http'
export type {
  GbpCallToAction,
  CreateLocalPostInput,
  GbpLocalPost,
  GbpAccount,
  GbpLocation,
} from './http'

async function getToken(): Promise<string> {
  try {
    return await getValidGoogleAccessToken()
  } catch {
    throw new GbpNotConnectedError(
      'Google Business Profile is not connected. An admin can connect it at /api/gbp/connect.',
    )
  }
}

/** Creates a GBP local post using the stored Google OAuth token. */
export async function createLocalPost(input: CreateLocalPostInput): Promise<GbpLocalPost> {
  return createLocalPostWithToken(input, await getToken())
}

/** Lists the GBP accounts the connected Google user manages. */
export async function listGbpAccounts(): Promise<GbpAccount[]> {
  return listGbpAccountsWithToken(await getToken())
}

/** Lists locations for one account. Pass the account `name` from listGbpAccounts(). */
export async function listGbpLocations(accountName: string): Promise<GbpLocation[]> {
  return listGbpLocationsWithToken(await getToken(), accountName)
}
