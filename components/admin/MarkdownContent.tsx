'use client'

import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Renders AI-generated markdown as formatted HTML. The model's output is not
// trusted (web-search results flow into it), so the HTML is sanitized before
// it touches the DOM.
export default function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => {
    if (!content) return ''
    const raw = marked.parse(content, { async: false, breaks: true }) as string
    return DOMPurify.sanitize(raw)
  }, [content])

  return (
    <div
      className={className ? `md-content ${className}` : 'md-content'}
      style={{ wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
