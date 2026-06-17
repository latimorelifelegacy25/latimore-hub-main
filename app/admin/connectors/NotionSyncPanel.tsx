'use client'

import { useState } from 'react'

interface Props {
  totalContacts: number
  notionConfigured: boolean
}

export default function NotionSyncPanel({ totalContacts, notionConfigured }: Props) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ synced?: number; error?: string } | null>(null)

  async function triggerSync() {
    setStatus('syncing')
    setResult(null)
    try {
      const res = await fetch('/api/admin/notion-sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setResult({ error: data.error ?? 'Sync failed' })
      } else {
        setStatus('done')
        setResult({ synced: data.synced })
      }
    } catch (err) {
      setStatus('error')
      setResult({ error: 'Network error' })
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a1a]">
          <i className="fa-solid fa-n text-white text-sm" />
        </div>
        <div>
          <h2 className="text-white font-medium">Notion Sync</h2>
          <p className="text-xs text-[#A9B1BE]">Sync CRM contacts to your Notion database</p>
        </div>
        <div className="ml-auto">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              notionConfigured
                ? 'bg-green-500/10 text-green-400'
                : 'bg-yellow-500/10 text-yellow-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${notionConfigured ? 'bg-green-400' : 'bg-yellow-400'}`}
            />
            {notionConfigured ? 'Connected' : 'Not configured'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-[#A9B1BE] mb-1">Total contacts</p>
          <p className="text-2xl font-semibold text-white">{totalContacts.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-[#A9B1BE] mb-1">Last sync</p>
          <p className="text-sm text-white">
            {status === 'done' && result?.synced !== undefined
              ? `${result.synced.toLocaleString()} synced`
              : status === 'syncing'
              ? 'Running...'
              : '—'}
          </p>
        </div>
      </div>

      {!notionConfigured && (
        <p className="mb-4 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
          Set <code className="font-mono">NOTION_API_KEY</code> and{' '}
          <code className="font-mono">NOTION_CONTACT_DB_ID</code> environment variables to enable
          sync.
        </p>
      )}

      {result?.error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {result.error}
        </p>
      )}

      {status === 'done' && result?.synced !== undefined && (
        <p className="mb-4 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">
          Synced {result.synced.toLocaleString()} contacts to Notion successfully.
        </p>
      )}

      <button
        onClick={triggerSync}
        disabled={!notionConfigured || status === 'syncing'}
        className="flex items-center gap-2 rounded-lg bg-[#C9A25F] px-4 py-2 text-sm font-medium text-black transition hover:bg-[#E5C882] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === 'syncing' ? (
          <>
            <i className="fa-solid fa-spinner fa-spin text-xs" />
            Syncing...
          </>
        ) : (
          <>
            <i className="fa-solid fa-rotate text-xs" />
            Sync All Contacts
          </>
        )}
      </button>
      <p className="mt-2 text-xs text-[#A9B1BE]">
        Pushes all {totalContacts.toLocaleString()} contacts to the Notion database. May take a moment for large lists.
      </p>
    </div>
  )
}
