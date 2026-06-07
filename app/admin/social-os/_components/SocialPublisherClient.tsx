'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react'

type ProviderKey = 'linkedin' | 'facebook' | 'instagram' | 'twitter'

type SocialConnection = {
  id: string
  provider: ProviderKey
  accountName?: string | null
  status?: string | null
}

type PublishResult = {
  provider: ProviderKey
  ok: boolean
  error?: string
  postId?: string
}

const providerLabels: Record<ProviderKey, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
}

export default function SocialPublisherClient({
  connections,
}: {
  connections: SocialConnection[]
}) {
  const [selectedProviders, setSelectedProviders] = useState<ProviderKey[]>([])
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PublishResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleProvider = (provider: ProviderKey) => {
    setResults(null)
    setError(null)
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    )
  }

  const canPublish = content.trim().length > 0 && selectedProviders.length > 0

  const handlePublish = async () => {
    if (!canPublish) return
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers: selectedProviders,
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }

      setResults(data.results as PublishResult[])
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const connectedByProvider: Record<ProviderKey, SocialConnection | undefined> = {
    linkedin: connections.find((c) => c.provider === 'linkedin'),
    facebook: connections.find((c) => c.provider === 'facebook'),
    instagram: connections.find((c) => c.provider === 'instagram'),
    twitter: connections.find((c) => c.provider === 'twitter'),
  }

  return (
    <div className="space-y-6 mt-6">
      <div>
        <h2 className="text-white font-semibold text-lg">Social Publisher</h2>
        <p className="text-sm text-slate-400">
          Compose once, publish everywhere.
        </p>
      </div>

      {/* Provider selection */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Channels
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(providerLabels) as ProviderKey[]).map((provider) => {
            const conn = connectedByProvider[provider]
            const isSelected = selectedProviders.includes(provider)
            const disabled = !conn || conn.status !== 'connected'

            return (
              <button
                key={provider}
                type="button"
                onClick={() => !disabled && toggleProvider(provider)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  disabled
                    ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#C9A25F] text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {providerLabels[provider]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-4">
        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post..."
          className="w-full rounded-xl bg-slate-950/70 border border-white/10 px-4 py-3 text-sm text-white focus:border-[#C9A25F] focus:outline-none"
        />

        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL (optional)"
          className="w-full rounded-xl bg-slate-950/70 border border-white/10 px-4 py-3 text-sm text-white focus:border-[#C9A25F] focus:outline-none"
        />

        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="Link URL (optional)"
          className="w-full rounded-xl bg-slate-950/70 border border-white/10 px-4 py-3 text-sm text-white focus:border-[#C9A25F] focus:outline-none"
        />

        <button
          onClick={handlePublish}
          disabled={!canPublish || loading}
          className="rounded-xl bg-[#C9A25F] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            'Publish'
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm">Results</h3>
          {results.map((r) => (
            <div
              key={r.provider}
              className="flex items-center gap-2 text-sm text-white"
            >
              {r.ok ? (
                <CheckCircle2 className="text-emerald-400" size={18} />
              ) : (
                <AlertCircle className="text-red-400" size={18} />
              )}
              <span className="font-semibold">{providerLabels[r.provider]}:</span>
              <span>{r.ok ? `Posted (ID: ${r.postId})` : r.error}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}
