'use client'

import { FormEvent, useEffect, useState } from 'react'

type SocialPost = {
  id: string
  platform: string
  caption: string
  campaign: string | null
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  externalPostId: string | null
  createdAt: string
}

type SocialConnection = {
  id: string
  provider: string
  accountName: string | null
  externalId: string | null
  status: string | null
  updatedAt: string
}

type ApiState = {
  posts: SocialPost[]
  connections: SocialConnection[]
}

const platforms = [
  { key: 'facebook', label: 'Facebook Page' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
]

export function SocialPublisherPanel() {
  const [caption, setCaption] = useState('')
  const [campaign, setCampaign] = useState('the-beat-goes-on')
  const [linkUrl, setLinkUrl] = useState('https://www.latimorelifelegacy.com')
  const [mediaUrl, setMediaUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'linkedin'])
  const [publishNow, setPublishNow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<ApiState>({ posts: [], connections: [] })

  async function load() {
    const res = await fetch('/api/social/posts', { cache: 'no-store' })
    const json = await res.json()
    setState({
      posts: json.posts ?? [],
      connections: json.connections ?? [],
    })
  }

  useEffect(() => {
    load().catch(() => setMessage('Could not load social publisher data.'))
  }, [])

  function togglePlatform(platform: string) {
    setSelectedPlatforms(current =>
      current.includes(platform)
        ? current.filter(item => item !== platform)
        : [...current, platform],
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          campaign,
          linkUrl,
          mediaUrls: mediaUrl ? [mediaUrl] : [],
          platforms: selectedPlatforms,
          scheduledAt: scheduledAt || null,
          publishNow,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to save post.')
      }

      setCaption('')
      setMessage(publishNow ? 'Post submitted for publishing.' : 'Post saved to the social queue.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function publish(id: string) {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/social/posts/${id}/publish`, { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to publish post.')
      }

      setMessage('Publish request completed.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to publish post.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Latimore OS</p>
          <h1 className="mt-3 text-4xl font-bold">Social Publisher</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Create once, customize by platform, track campaign URLs, and publish to Facebook, Instagram, and LinkedIn from the Latimore marketing command center.
          </p>
        </header>

        {message && (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <h2 className="text-2xl font-bold">Create Social Post</h2>
            <p className="mt-2 text-sm text-slate-600">Use compliant educational content. Instagram requires a public image URL.</p>

            <label className="mt-6 block text-sm font-semibold">Caption</label>
            <textarea
              value={caption}
              onChange={event => setCaption(event.target.value)}
              required
              rows={8}
              className="mt-2 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-amber-500"
              placeholder="Example: Life insurance is not just about death. It is about protecting income, options, and family stability. #TheBeatGoesOn"
            />

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Campaign
                <input
                  value={campaign}
                  onChange={event => setCampaign(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-sm font-semibold">
                Link URL
                <input
                  value={linkUrl}
                  onChange={event => setLinkUrl(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-amber-500"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Media URL
                <input
                  value={mediaUrl}
                  onChange={event => setMediaUrl(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-amber-500"
                  placeholder="https://.../image.jpg"
                />
              </label>
              <label className="block text-sm font-semibold">
                Schedule Time
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={event => setScheduledAt(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-amber-500"
                />
              </label>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold">Platforms</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {platforms.map(platform => (
                  <button
                    type="button"
                    key={platform.key}
                    onClick={() => togglePlatform(platform.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      selectedPlatforms.includes(platform.key)
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {platform.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={event => setPublishNow(event.target.checked)}
              />
              Publish immediately after saving
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 rounded-2xl bg-amber-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? 'Working...' : 'Save Post'}
            </button>
          </form>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold">Connections</h2>
              <div className="mt-4 space-y-3">
                {platforms.map(platform => {
                  const connection = state.connections.find(item => item.provider === platform.key)
                  return (
                    <div key={platform.key} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{platform.label}</p>
                        <span className={`rounded-full px-3 py-1 text-xs ${connection ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'}`}>
                          {connection ? connection.status ?? 'connected' : 'missing'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{connection?.accountName ?? 'No account saved yet'}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold">Rules</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
                <li>Facebook posts publish to a Page, not a personal profile.</li>
                <li>Instagram requires a Business or Creator account and a public image URL.</li>
                <li>LinkedIn requires a member or organization URN.</li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Posting Queue</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="py-3">Platform</th>
                  <th className="py-3">Caption</th>
                  <th className="py-3">Campaign</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Scheduled</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {state.posts.map(post => (
                  <tr key={post.id} className="border-t border-white/10 align-top">
                    <td className="py-4 font-semibold capitalize">{post.platform}</td>
                    <td className="max-w-md py-4 text-slate-300">{post.caption}</td>
                    <td className="py-4 text-slate-300">{post.campaign ?? '-'}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{post.status}</span>
                    </td>
                    <td className="py-4 text-slate-300">{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : '-'}</td>
                    <td className="py-4">
                      {post.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => publish(post.id)}
                          disabled={loading}
                          className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-bold text-amber-200 disabled:opacity-50"
                        >
                          Publish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
