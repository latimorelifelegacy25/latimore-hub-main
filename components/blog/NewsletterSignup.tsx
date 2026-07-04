'use client'

import { useState } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || status === 'submitting') return

    setStatus('submitting')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          source: 'Education Blog',
          medium: 'newsletter',
          campaign: 'blog_newsletter',
          landingPage: window.location.pathname,
          notes: 'Newsletter signup from education blog sidebar',
          metadata: { form: 'blog-newsletter' },
        }),
      })
      if (!res.ok) throw new Error(`Signup failed (${res.status})`)
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600, lineHeight: 1.6 }}>
        You&apos;re in! Watch your inbox for plain-language financial insights.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        aria-label="Email address"
        style={{
          padding: '0.6rem 0.9rem',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          fontSize: '0.85rem',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          background: 'var(--gold)',
          color: 'var(--navy)',
          border: 'none',
          padding: '0.6rem',
          borderRadius: 6,
          fontWeight: 700,
          cursor: status === 'submitting' ? 'wait' : 'pointer',
          fontSize: '0.85rem',
          opacity: status === 'submitting' ? 0.7 : 1,
        }}
      >
        {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <p style={{ fontSize: '0.8rem', color: '#b91c1c', margin: 0 }}>
          Something went wrong — please try again.
        </p>
      )}
    </form>
  )
}
