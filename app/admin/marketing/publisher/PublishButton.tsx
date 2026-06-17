'use client'

import { useState } from 'react'

type PublishButtonProps = {
  id: string
  onPublish: () => void | Promise<void>
}

export default function PublishButton({ id, onPublish }: PublishButtonProps) {
  const [error, setError] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  async function handleClick() {
    setError('')
    setIsPublishing(true)

    try {
      const res = await fetch('/api/marketing/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error ?? 'Failed to publish content')
      }

      await onPublish()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish content')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPublishing}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPublishing ? 'Publishing…' : 'Publish'}
      </button>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  )
}
