import { PublishPayload, SocialPlatform } from './types'

export async function publishToMeta(payload: PublishPayload) {
  console.log('Publishing to Meta:', payload.title)
  return { success: true }
}

export async function publishToPlatform(platform: string, payload: PublishPayload) {
  if (platform === 'facebook' || platform === 'instagram') {
    return publishToMeta(payload)
  }

  if (platform === 'linkedin') {
    const { publishToLinkedIn } = await import('./linkedin')
    return publishToLinkedIn(payload)
  }

  throw new Error(`Unsupported social platform: ${platform as SocialPlatform}`)
}
