'use client'

import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import type { ComposerContent } from './types'

type ComposerSidebarProps = {
  content: ComposerContent
  setContent: Dispatch<SetStateAction<ComposerContent>>
}

const contentTypes = ['post', 'email', 'landing-page', 'script']
const statuses = ['draft', 'review', 'scheduled', 'published']

export default function ComposerSidebar({ content, setContent }: ComposerSidebarProps) {
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function saveContent(status = content.status) {
    setIsSaving(true)
    setMessage('')

    try {
      const shouldPublishExisting = status === 'published' && content.id
      const res = await fetch(shouldPublishExisting ? '/api/marketing/publish' : '/api/marketing/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shouldPublishExisting ? { id: content.id } : { ...content, status }),
      })
      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error ?? 'Failed to save content')
      }

      setContent((prev) => ({ ...prev, ...payload }))
      setMessage(status === 'published' ? 'Content saved as published.' : 'Draft saved to repository.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save content')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <aside className="w-full border-b border-white/10 bg-white/[0.02] p-6 md:w-80 md:border-b-0 md:border-r">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-[#8F98A8]">Marketing OS</p>
        <h1 className="mt-1 text-xl font-semibold text-white">Content Composer</h1>
        <p className="mt-2 text-sm text-[#A9B1BE]">Draft campaign content and save it to the repository.</p>
      </div>

      <div className="space-y-4">
        <Field label="Campaign" value={content.campaign} onChange={(campaign) => setContent((prev) => ({ ...prev, campaign }))} />
        <Field label="Destination" value={content.destination} onChange={(destination) => setContent((prev) => ({ ...prev, destination }))} />
        <Field label="UTM Source" value={content.utmSource} onChange={(utmSource) => setContent((prev) => ({ ...prev, utmSource }))} />

        <label className="block text-sm text-[#A9B1BE]">
          Type
          <select
            value={content.type}
            onChange={(event) => setContent((prev) => ({ ...prev, type: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
          >
            {contentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-[#A9B1BE]">
          Status
          <select
            value={content.status}
            onChange={(event) => setContent((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => saveContent()}
          disabled={isSaving}
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={() => saveContent('published')}
          disabled={isSaving}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save as Published
        </button>
        <Link href="/admin/marketing/repository" className="text-center text-sm font-semibold text-blue-400 hover:underline">
          View Repository →
        </Link>
      </div>

      {message ? <p className="mt-4 text-sm text-[#A9B1BE]">{message}</p> : null}
    </aside>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm text-[#A9B1BE]">
      {label}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none placeholder:text-[#5F6773]"
      />
    </label>
  )
}
