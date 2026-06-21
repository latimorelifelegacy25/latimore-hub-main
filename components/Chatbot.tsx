'use client'

import { FormEvent, useRef, useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_MESSAGES: Message[] = [
  {
    role: 'assistant',
    content: 'Hi, I’m the Latimore Life & Legacy assistant. Ask me about life insurance, mortgage protection, final expense, annuities, or how to contact Jackson.',
  },
]

const SUGGESTED_PROMPTS = [
  'What services do you offer?',
  'What is mortgage protection?',
  'How do I get a quote?',
]

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>(STARTER_MESSAGES)
  const inputRef = useRef<HTMLInputElement>(null)

  async function sendMessage(nextInput = input) {
    const trimmed = nextInput.trim()
    if (!trimmed || loading) return

    const nextMessages: Message[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ].slice(-12)

    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      const data = await res.json() as { reply?: string }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'I could not generate a response. Please try again or contact Jackson directly.',
        },
      ].slice(-12))
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please call 717-615-2613 or email jackson1989@latimorelegacy.com.',
        },
      ].slice(-12))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-[#C9A24D] px-5 py-3 text-sm font-semibold text-[#0E1A2B] shadow-xl transition hover:brightness-110"
        aria-expanded={open}
        aria-controls="latimore-chatbot-panel"
      >
        {open ? 'Close' : 'Chat'}
      </button>

      {open ? (
        <section
          id="latimore-chatbot-panel"
          className="fixed bottom-20 right-4 z-50 flex h-[520px] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E1A2B] shadow-2xl"
          aria-label="Latimore Life and Legacy chat assistant"
        >
          <div className="border-b border-white/10 bg-[#101D31] px-4 py-3 text-white">
            <p className="text-sm font-semibold">Latimore Assistant</p>
            <p className="text-xs text-white/70">Protecting Today. Securing Tomorrow.</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto bg-[#C9A24D] text-[#0E1A2B]'
                    : 'border border-slate-200 bg-white text-slate-900'
                }`}
              >
                {message.content}
              </div>
            ))}

            {loading ? (
              <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Thinking...
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 transition hover:border-[#C9A24D]"
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Ask a question..."
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#C9A24D]"
                maxLength={1200}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-[#0E1A2B] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </>
  )
}
