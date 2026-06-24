export type NotionWorkerSection = {
  heading?: string
  body?: string
  items?: string[]
}

export type NotionWorkerPayload = {
  action?: 'create_page' | 'append_page'
  title?: string
  pageId?: string
  content?: string
  sections?: NotionWorkerSection[]
}

export async function callNotionWorker(payload: NotionWorkerPayload): Promise<any> {
  const url = process.env.NOTION_WORKER_URL ?? process.env.LATIMORE_NOTION_WORKER_URL ?? 'https://latimore-notion-worker.jackson1989.workers.dev'
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (process.env.NOTION_WORKER_SHARED_SECRET) {
    headers['x-latimore-worker-secret'] = process.env.NOTION_WORKER_SHARED_SECRET
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { ok: false, status: response.status, error: data?.error ?? 'Notion worker request failed', data }
  }

  return data
}

export async function createNotionWorkerPage(input: {
  title: string
  sections: NotionWorkerSection[]
}) {
  if (typeof window === 'undefined') {
    return callNotionWorker({ action: 'create_page', title: input.title, sections: input.sections })
  }

  const response = await fetch('/api/notion-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_page', title: input.title, sections: input.sections }),
  })

  const data = await response.json()
  if (!response.ok || !data.ok) {
    throw new Error(data.error || data.data?.message || 'Notion Worker failed')
  }

  return data
}
