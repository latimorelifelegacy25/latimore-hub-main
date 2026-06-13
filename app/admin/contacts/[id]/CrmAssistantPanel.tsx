'use client'

import { useState, useTransition } from 'react'

type Props = {
  contactId: string
  inquiryId?: string | null
}

type AssistantResult = {
  answer: string
  suggestedActions: string[]
  draftReply: string | null
}

type AssistantResponse = {
  ok: boolean
  result?: AssistantResult
  error?: string
}

const QUICK_PROMPTS = [
  'Summarize this relationship and where it stands.',
  'What should I do next with this contact?',
  'Draft a friendly check-in reply.',
]

export default function CrmAssistantPanel({ contactId, inquiryId }: Props) {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<AssistantResult | null>(null)
  const [error, setError] = useState('')
  const [isAsking, startAsking] = useTransition()

  function ask(q: string) {
    const trimmed = q.trim()
    if (!trimmed) {
      setError('Enter a question for the assistant')
      return
    }

    setError('')

    startAsking(async () => {
      try {
        const res = await fetch('/api/ai/crm-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId, inquiryId, question: trimmed }),
        })

        const data: AssistantResponse = await res.json()

        if (!res.ok || !data.ok || !data.result) {
          setError(data?.error ? JSON.stringify(data.error) : 'Failed to get a response from the assistant')
          return
        }

        setResult(data.result)
      } catch {
        setError('Failed to get a response from the assistant')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              setQuestion(prompt)
              ask(prompt)
            }}
            disabled={isAsking}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#D7DCE5] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder="Ask the assistant about this contact..."
          className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-4 py-3 text-sm text-white outline-none placeholder:text-[#667085]"
        />
        <button
          type="button"
          onClick={() => ask(question)}
          disabled={isAsking}
          className="shrink-0 rounded-xl bg-[#C9A25F] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAsking ? 'Thinking...' : 'Ask'}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8F98A8]">Answer</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#E6EAF0]">{result.answer}</p>
          </div>

          {result.suggestedActions.length > 0 ? (
            <div className="rounded-xl border border-[#C9A25F]/20 bg-[#C9A25F]/5 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#C9A25F]">Suggested next actions</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#E6EAF0]">
                {result.suggestedActions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.draftReply ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#8F98A8]">Draft reply</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#E6EAF0]">{result.draftReply}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
