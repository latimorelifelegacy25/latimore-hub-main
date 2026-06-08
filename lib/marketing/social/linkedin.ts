import { PublishPayload } from './types'

export async function publishToLinkedIn(payload: PublishPayload) {
  console.log('Publishing to LinkedIn:', payload.title)
  return { success: true }
}
