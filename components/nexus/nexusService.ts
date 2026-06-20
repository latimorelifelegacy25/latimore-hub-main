import type { Message } from './types'

const COPILOT_ENDPOINT = '/api/admin/ai/copilot'

type JsonObject = Record<string, unknown>

async function readJsonResponse(response: Response): Promise<JsonObject> {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()

  if (!text) return {}

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as JsonObject
    } catch {
      throw new Error('Copilot API returned malformed JSON.')
    }
  }

  const cleaned = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

  throw new Error(
    `Copilot API did not return JSON. ${response.status} ${response.statusText}. ${cleaned || 'Check route deployment.'}`
  )
}

function normalizeActions(actions: unknown): unknown[] {
  if (!Array.isArray(actions)) return []

  return actions.map((action) => {
    if (!action || typeof action !== 'object') return action
    const a = action as Record<string, unknown>

    if ('payload' in a) return action

    if (a.type === 'FILE_READ') {
      return { type: a.type, payload: a.path }
    }

    if (a.type === 'FILE_WRITE') {
      return {
        type: a.type,
        payload: {
          path: a.path,
          content: typeof a.content === 'string' ? a.content : '',
        },
      }
    }

    if (a.type === 'FILE_CREATE') {
      return {
        type: a.type,
        payload: {
          path: a.path,
          type: a.fileType === 'dir' ? 'dir' : 'file',
        },
      }
    }

    return action
  })
}

export const chatWithCopilot = async (
  message: string,
  history: Message[],
  fileSystem: unknown
): Promise<Message> => {
  const response = await fetch(COPILOT_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history: history.map(h => ({
        role: h.role,
        content: h.content,
        thought: h.thought,
        actions: h.actions,
      })),
      fileSystem,
    }),
  })

  const data = await readJsonResponse(response)
  if (!response.ok) throw new Error(String(data?.error || 'Nexus Copilot request failed'))

  return {
    ...(data as unknown as Message),
    actions: normalizeActions(data.actions),
  }
}
