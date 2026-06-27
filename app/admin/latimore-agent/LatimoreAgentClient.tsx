'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const brand = {
  navy: '#000835',
  navyLight: '#0a1245',
  gold: '#C49A6C',
  goldLight: '#d4b48c',
  goldDim: '#8a6b4a',
  white: '#FFFFFF',
  offWhite: '#F5F3EF',
  gray: '#6B7280',
  surface: '#0d1660',
  surfaceDark: '#070e48',
  red: '#ef4444',
  green: '#22c55e',
}

type ToolConfig = { webSearch: boolean; code: boolean; files: boolean; database: boolean; business: boolean }

type AgentAction =
  | { type: 'web_search'; queries: string[]; sources: string[] }
  | { type: 'execute_js'; code: string; result: string }
  | { type: 'read_file'; filePath: string; preview: string }
  | { type: 'read_database'; table: string; preview: string }
  | { type: 'business_lookup'; topic: string; preview: string }

type Message = {
  id?: number
  role: 'user' | 'assistant'
  content: string
  actions?: AgentAction[]
  streaming?: boolean
  time: string
}

const SUGGESTIONS = [
  'Search the web for current IUL interest rate trends',
  'Draft a final expense proposal for a 65-year-old client',
  'Look up my most recent leads in the database',
  'What are PA DOI compliance requirements for life insurance?',
  "Summarize Foresters Financial's key products",
  'Write a follow-up email for a warm prospect',
]

async function callAgent(message: string, history: Message[], tools: ToolConfig) {
  const response = await fetch('/api/admin/ai/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history: history.map((m) => ({ role: m.role, text: m.content })),
      tools,
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error || 'Agent request failed')
  return { text: data.reply as string, actions: (data.actions ?? []) as AgentAction[] }
}

function actionLabel(action: AgentAction): { label: string; preview: string } {
  switch (action.type) {
    case 'web_search':
      return { label: `Web search: ${action.queries[0] ?? ''}`, preview: action.sources.join('\n') || 'No sources returned.' }
    case 'execute_js':
      return { label: 'Executed sandboxed JavaScript', preview: `${action.code}\n\n→ ${action.result}` }
    case 'read_file':
      return { label: `Read file: ${action.filePath}`, preview: action.preview }
    case 'read_database':
      return { label: `Database: ${action.table}`, preview: action.preview }
    case 'business_lookup':
      return { label: `Business lookup: ${action.topic}`, preview: action.preview }
  }
}

function StepBubble({ action }: { action: AgentAction }) {
  const [expanded, setExpanded] = useState(false)
  const { label, preview } = actionLabel(action)

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      style={{
        background: 'rgba(196,154,108,0.1)',
        border: `1px solid ${brand.gold}30`,
        borderRadius: 8,
        padding: '6px 10px',
        marginBottom: 4,
        cursor: 'pointer',
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: brand.gold }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ marginLeft: 'auto', color: brand.gray, fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <pre
          style={{
            marginTop: 6,
            fontSize: 11,
            color: brand.offWhite,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            opacity: 0.85,
            fontFamily: 'monospace',
            lineHeight: 1.5,
          }}
        >
          {preview}
        </pre>
      )}
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copy = () => {
    navigator.clipboard.writeText(msg.content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 20 }}>
      {!isUser && msg.actions && msg.actions.length > 0 && (
        <div style={{ width: '100%', marginBottom: 8 }}>
          {msg.actions.map((a, i) => (
            <StepBubble key={i} action={a} />
          ))}
        </div>
      )}

      {(msg.content || msg.streaming) && (
        <div
          style={{
            maxWidth: isUser ? '75%' : '100%',
            background: isUser ? `linear-gradient(135deg, ${brand.gold}, ${brand.goldDim})` : brand.surface,
            color: isUser ? brand.navy : brand.white,
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: '12px 16px',
            fontSize: 14,
            lineHeight: 1.65,
            position: 'relative',
            border: isUser ? 'none' : `1px solid ${brand.navyLight}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.content || (msg.streaming ? 'Working…' : '')}
          </div>
          {!isUser && msg.content && !msg.streaming && (
            <button
              onClick={copy}
              title="Copy"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'transparent',
                border: 'none',
                color: copied ? brand.green : brand.gray,
                cursor: 'pointer',
                padding: 4,
                fontSize: 11,
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      )}

      <div style={{ fontSize: 10, color: brand.gray, marginTop: 4, padding: '0 4px' }}>{msg.time}</div>
    </div>
  )
}

export default function LatimoreAgentClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [tools, setTools] = useState<ToolConfig>({ webSearch: true, code: true, files: false, database: true, business: true })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const timestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || running) return
      const history = messages
      const userMsg: Message = { role: 'user', content: text.trim(), time: timestamp() }
      setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '', streaming: true, time: timestamp() }])
      setInput('')
      setRunning(true)

      try {
        const { text: reply, actions } = await callAgent(text.trim(), history, tools)
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: reply, actions, streaming: false, time: timestamp() }
          return next
        })
      } catch (err) {
        const fallback = err instanceof Error ? err.message : 'Unknown error'
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: `Agent error: ${fallback}`, streaming: false, time: timestamp() }
          return next
        })
      } finally {
        setRunning(false)
      }
    },
    [messages, running, tools]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const newChat = () => {
    setMessages([])
    setInput('')
  }

  const toggleTool = (key: keyof ToolConfig) => setTools((prev) => ({ ...prev, [key]: !prev[key] }))

  const isEmpty = messages.length === 0

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: brand.navy,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: brand.white,
      }}
    >
      <style>{`
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${brand.navyLight}; border-radius: 10px; }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${brand.navyLight}`,
          background: brand.surfaceDark,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Latimore Agent</div>
          <div style={{ fontSize: 11, color: brand.goldLight }}>{running ? 'Working…' : 'Ready'}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              ['webSearch', 'Web search'],
              ['code', 'Sandboxed JS'],
              ['files', 'Repo files'],
              ['database', 'CRM database'],
              ['business', 'Business lookup'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleTool(key)}
              style={{
                background: tools[key] ? `${brand.gold}25` : 'transparent',
                border: `1px solid ${tools[key] ? brand.gold : brand.navyLight}`,
                color: tools[key] ? brand.goldLight : brand.gray,
                borderRadius: 8,
                padding: '5px 9px',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={newChat}
            style={{
              background: 'transparent',
              border: `1px solid ${brand.navyLight}`,
              color: brand.gray,
              borderRadius: 8,
              padding: '5px 10px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            New Chat
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', maxWidth: 780, width: '100%', margin: '0 auto' }}>
        {isEmpty && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 22, marginBottom: 8, color: brand.white }}>What can I help you with?</div>
            <div style={{ fontSize: 13, color: brand.gray, marginBottom: 32, lineHeight: 1.6 }}>
              I can search the web, query the CRM database, look up business/carrier info,
              <br />
              and write documents — all through Latimore Hub&apos;s server-side AI route.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, textAlign: 'left' }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: brand.surface,
                    border: `1px solid ${brand.navyLight}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: brand.offWhite,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    lineHeight: 1.4,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 16px 20px', borderTop: `1px solid ${brand.navyLight}`, background: brand.surfaceDark }}>
        <div
          style={{
            maxWidth: 780,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            background: brand.surface,
            border: `1px solid ${brand.navyLight}`,
            borderRadius: 14,
            padding: '10px 12px',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your business..."
            rows={1}
            disabled={running}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: brand.white,
              fontSize: 14,
              resize: 'none',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.5,
              maxHeight: 120,
              opacity: running ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={running || !input.trim()}
            style={{
              background: input.trim() && !running ? `linear-gradient(135deg, ${brand.gold}, ${brand.goldDim})` : brand.navyLight,
              border: 'none',
              borderRadius: 10,
              width: 36,
              height: 36,
              cursor: running || !input.trim() ? 'not-allowed' : 'pointer',
              color: brand.navy,
              flexShrink: 0,
            }}
          >
            ➤
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: brand.gray, marginTop: 8 }}>
          Latimore Agent · Press Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
