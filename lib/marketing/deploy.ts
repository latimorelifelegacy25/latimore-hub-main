// Real Vercel deploy trigger for the Content Repository "Publish & deploy"
// action. Two supported mechanisms, tried in order:
//
// 1. VERCEL_DEPLOY_HOOK_URL — a per-branch Deploy Hook created in the
//    Vercel project's Settings > Git > Deploy Hooks. Simplest, no token
//    needed, Vercel's documented way for third-party apps to trigger a
//    redeploy.
// 2. VERCEL_TOKEN + VERCEL_PROJECT_ID — calls the Deployments REST API
//    directly against the project's connected GitHub repo/branch.
//
// If neither is configured, deploy is skipped and the caller records that
// explicitly (deployStatus: 'not_configured') rather than failing the
// publish — saving the content to the repository must still succeed.

import { logger } from '@/lib/logger'

export type DeployTriggerResult = {
  ok: boolean
  mechanism: 'deploy_hook' | 'rest_api' | 'not_configured'
  deployId?: string
  deployUrl?: string
  status?: string
  error?: string
}

const GIT_OWNER = 'latimorelifelegacy25'
const GIT_REPO = 'latimore-hub-main'
const GIT_BRANCH = 'main'

export async function triggerVercelDeploy(): Promise<DeployTriggerResult> {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL

  if (hookUrl) {
    try {
      const res = await fetch(hookUrl, { method: 'POST' })
      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        logger.error({ status: res.status, payload }, '[deploy] deploy hook failed')
        return { ok: false, mechanism: 'deploy_hook', error: `Deploy hook returned ${res.status}` }
      }

      return {
        ok: true,
        mechanism: 'deploy_hook',
        deployId: payload?.job?.id,
        status: payload?.job?.state ?? 'queued',
      }
    } catch (err) {
      logger.error({ err }, '[deploy] deploy hook request failed')
      return { ok: false, mechanism: 'deploy_hook', error: err instanceof Error ? err.message : 'Deploy hook request failed' }
    }
  }

  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID

  if (token && projectId) {
    const teamId = process.env.VERCEL_TEAM_ID
    const url = new URL('https://api.vercel.com/v13/deployments')
    if (teamId) url.searchParams.set('teamId', teamId)

    try {
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectId,
          project: projectId,
          target: 'production',
          gitSource: {
            type: 'github',
            org: GIT_OWNER,
            repo: GIT_REPO,
            ref: GIT_BRANCH,
          },
        }),
      })
      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        logger.error({ status: res.status, payload }, '[deploy] Vercel API deploy failed')
        return {
          ok: false,
          mechanism: 'rest_api',
          error: payload?.error?.message ?? `Vercel API returned ${res.status}`,
        }
      }

      return {
        ok: true,
        mechanism: 'rest_api',
        deployId: payload?.id,
        deployUrl: payload?.url ? `https://${payload.url}` : undefined,
        status: payload?.readyState ?? 'QUEUED',
      }
    } catch (err) {
      logger.error({ err }, '[deploy] Vercel API request failed')
      return { ok: false, mechanism: 'rest_api', error: err instanceof Error ? err.message : 'Vercel API request failed' }
    }
  }

  return { ok: false, mechanism: 'not_configured', error: 'No VERCEL_DEPLOY_HOOK_URL or VERCEL_TOKEN/VERCEL_PROJECT_ID configured' }
}

export async function getVercelDeploymentStatus(deployId: string): Promise<{ status?: string; url?: string } | null> {
  const token = process.env.VERCEL_TOKEN
  if (!token || !deployId) return null

  const teamId = process.env.VERCEL_TEAM_ID
  const url = new URL(`https://api.vercel.com/v13/deployments/${deployId}`)
  if (teamId) url.searchParams.set('teamId', teamId)

  try {
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const payload = await res.json()
    return { status: payload?.readyState, url: payload?.url ? `https://${payload.url}` : undefined }
  } catch {
    return null
  }
}
