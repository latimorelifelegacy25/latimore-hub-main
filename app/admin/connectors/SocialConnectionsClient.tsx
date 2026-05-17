'use client'

import { useMemo, useState } from 'react'

interface ConnectionDraft {
  accountName: string
  externalId: string
  accessToken: string
  refreshToken: string
  tokenExpiresAt: string
  metadata: string
}

type ProviderKey = 'linkedin' | 'facebook' | 'instagram' | 'twitter'

interface SocialConnection {
  id: string
  provider: ProviderKey
  accountName?: string
  externalId?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: string | null
  metadata?: any
  status?: string
  updatedAt: string
}

const providerConfig: Record<ProviderKey, { label: string; description: string }> = {
  linkedin: {
    label: 'LinkedIn',
    description: 'Publish text posts and page updates directly to LinkedIn.',
  },
  facebook: {
    label: 'Facebook',
    description: 'Publish page posts to Facebook Business pages.',
  },
  instagram: {
    label: 'Instagram',
    description: 'Publish Instagram business posts with image captions.',
  },
  twitter: {
    label: 'Twitter',
    description: 'Publish tweets using a connected Twitter account.',
  },
}

export default function SocialConnectionsClient({ initialConnections }: { initialConnections: SocialConnection[] }) {
  const [connections, setConnections] = useState<SocialConnection[]>(initialConnections)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const drafts = useMemo(() => {
    return (Object.keys(providerConfig) as ProviderKey[]).reduce((acc, provider) => {
      const existing = connections.find((item) => item.provider === provider)
      acc[provider] = {
        accountName: existing?.accountName || '',
        externalId: existing?.externalId || '',
        accessToken: existing?.accessToken || '',
        refreshToken: existing?.refreshToken || '',
        tokenExpiresAt: existing?.tokenExpiresAt ? new Date(existing.tokenExpiresAt).toISOString().slice(0, 16) : '',
        metadata: existing?.metadata ? JSON.stringify(existing.metadata, null, 2) : '',
      }
      return acc
    }, {} as Record<ProviderKey, ConnectionDraft>)
  }, [connections])

  const [formState, setFormState] = useState<Record<ProviderKey, ConnectionDraft>>(drafts)

  const saveConnection = async (provider: ProviderKey) => {
    setSaving(true)
    setMessage(null)

    const draft = formState[provider]
    try {
      const response = await fetch('/api/admin/social-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          accountName: draft.accountName,
          externalId: draft.externalId,
          accessToken: draft.accessToken,
          refreshToken: draft.refreshToken,
          tokenExpiresAt: draft.tokenExpiresAt || undefined,
          metadata: draft.metadata ? JSON.parse(draft.metadata) : undefined,
          status: 'connected',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to save connection')
      }

      setConnections((current) => {
        const updated = current.filter((item) => item.provider !== provider)
        return [...updated, data.connection]
      })
      setMessage(`${providerConfig[provider].label} connection saved.`)
    } catch (error) {
      console.error('saveConnection error', error)
      setMessage(`Failed to save ${providerConfig[provider].label} connection: ${String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (provider: ProviderKey, field: keyof ConnectionDraft, value: string) => {
    setFormState((current) => ({
      ...current,
      [provider]: {
        ...current[provider],
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6 mt-6">
      {message ? (
        <div className="rounded-xl border border-white/10 bg-[#C9A25F]/10 px-4 py-3 text-sm text-[#E1C87E]">
          {message}
        </div>
      ) : null}

      {(Object.keys(providerConfig) as ProviderKey[]).map((provider) => {
        const existing = connections.find((item) => item.provider === provider)
        const draft = formState[provider]
        return (
          <div key={provider} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C9A25F]/10 text-[#C9A25F] text-lg font-bold">
                    {providerConfig[provider].label[0]}
                  </span>
                  <div>
                    <h3 className="text-white font-semibold">{providerConfig[provider].label}</h3>
                    <p className="text-sm text-slate-400">{providerConfig[provider].description}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${existing ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-500/10 text-slate-400'}`}>
                  {existing ? 'Connected' : 'Not connected'}
                </span>
                {existing?.updatedAt ? (
                  <span className="px-3 py-1 rounded-full text-xs text-slate-400 bg-white/5">
                    Updated {new Date(existing.updatedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 mt-6 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account Name</label>
                <input
                  value={draft.accountName}
                  onChange={(event) => updateField(provider, 'accountName', event.target.value)}
                  placeholder="Page or profile name"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-[#C9A25F] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account ID / Page ID</label>
                <input
                  value={draft.externalId}
                  onChange={(event) => updateField(provider, 'externalId', event.target.value)}
                  placeholder="External ID or page ID"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-[#C9A25F] focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Access Token</label>
                <textarea
                  rows={2}
                  value={draft.accessToken}
                  onChange={(event) => updateField(provider, 'accessToken', event.target.value)}
                  placeholder="Paste the provider access token here"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-[#C9A25F] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Refresh Token</label>
                <input
                  value={draft.refreshToken}
                  onChange={(event) => updateField(provider, 'refreshToken', event.target.value)}
                  placeholder="Optional refresh token"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-[#C9A25F] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Token Expires At</label>
                <input
                  type="datetime-local"
                  value={draft.tokenExpiresAt}
                  onChange={(event) => updateField(provider, 'tokenExpiresAt', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-[#C9A25F] focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Metadata</label>
                <textarea
                  rows={3}
                  value={draft.metadata}
                  onChange={(event) => updateField(provider, 'metadata', event.target.value)}
                  placeholder='Optional JSON metadata, e.g. {"imageUrl":"https://example.com/image.jpg"}'
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-[#C9A25F] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => saveConnection(provider)}
                disabled={saving}
                className="rounded-xl bg-[#C9A25F] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                Save {providerConfig[provider].label} Connection
              </button>
              <div className="text-xs text-slate-400">
                {provider === 'instagram'
                  ? 'Instagram requires a business account and an image URL provided in metadata.imageUrl.'
                  : provider === 'linkedin'
                  ? 'LinkedIn access tokens can be generated via the LinkedIn app OAuth flow.'
                  : provider === 'facebook'
                  ? 'Facebook page posts require a page access token and page ID.'
                  : 'Twitter requires a bearer token or OAuth2 user token.'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
