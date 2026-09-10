'use client'

// Article composer: cover, title, rich-text body, meta + publish panel.
// Ported from the Claude Design handoff (composer.jsx), wired to real
// cover-image upload and create API calls instead of CSS-gradient covers
// and local seed state.

import { useEffect, useRef, useState } from 'react'
import { Icon, Button, Select, Wordmark } from './ui'
import {
  CATEGORIES, DESTINATIONS, UTM_SOURCES, UTM_MEDIUMS,
  buildUrl, autoCampaign, slugify, extractLinks,
} from '@/lib/marketing/repository'
import type { PublishRecord } from './Drawer'

// Rich text editor (contentEditable + execCommand toolbar) — matches the
// prototype's approach exactly; the handoff spec flags execCommand as
// prototype-grade and recommends a maintained editor (TipTap/Lexical) for a
// future pass. Kept as-is here to stay pixel/behavior-faithful this round.
function RichEditor({ html, onChange, placeholder, readOnly }: {
  html: string
  onChange: (html: string) => void
  placeholder?: string
  readOnly?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (html || '')) {
      ref.current.innerHTML = html || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val)
    ref.current?.focus()
    sync()
    refreshActive()
  }
  function sync() { onChange(ref.current ? ref.current.innerHTML : '') }
  function refreshActive() {
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
    })
  }
  function addLink() {
    const url = window.prompt('Link URL', 'https://')
    if (url) exec('createLink', url)
  }

  const tools: Array<{ ic?: string; cmd?: string; key?: string; val?: string; fn?: () => void; t: string; sep?: boolean }> = [
    { ic: 'bold', cmd: 'bold', key: 'bold', t: 'Bold' },
    { ic: 'italic', cmd: 'italic', key: 'italic', t: 'Italic' },
    { sep: true, t: '' },
    { ic: 'ul', cmd: 'insertUnorderedList', key: 'ul', t: 'Bulleted list' },
    { ic: 'ol', cmd: 'insertOrderedList', key: 'ol', t: 'Numbered list' },
    { ic: 'quote', cmd: 'formatBlock', val: 'blockquote', t: 'Quote' },
    { sep: true, t: '' },
    { ic: 'link', fn: addLink, t: 'Insert link' },
  ]

  if (readOnly) {
    return <div className="rte rte-preview"><div className="rte-body" dangerouslySetInnerHTML={{ __html: html || "<p class='rte-empty'>Nothing written yet.</p>" }} /></div>
  }
  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" className="rte-style" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'h2') }}>
          <Icon name="heading" size={15} /> Heading
        </button>
        <span className="rte-sep" />
        {tools.map((t, i) => t.sep
          ? <span key={i} className="rte-sep" />
          : (
            <button key={i} type="button" title={t.t} className={'rte-btn ' + (t.key && active[t.key] ? 'rte-on' : '')}
              onMouseDown={(e) => { e.preventDefault(); if (t.fn) t.fn(); else exec(t.cmd!, t.val) }}>
              <Icon name={t.ic!} size={16} />
            </button>
          ))}
      </div>
      <div ref={ref} className="rte-body" contentEditable suppressContentEditableWarning
        data-ph={placeholder || 'Write your article…'} onInput={sync} onKeyUp={refreshActive} onMouseUp={refreshActive} onBlur={sync} />
    </div>
  )
}

function CoverSlot({ cover, onPick, onClear, preview, uploading }: {
  cover: string
  onPick: (file: File) => void
  onClear: () => void
  preview?: boolean
  uploading?: boolean
}) {
  if (cover) {
    return (
      <div className="cover-set" style={{ backgroundImage: `url(${cover})` }}>
        {!preview && <div className="cover-badge"><Icon name="photo" size={14} /> Cover image</div>}
        {!preview && <button type="button" className="cover-clear" onClick={onClear}><Icon name="x" size={15} /></button>}
      </div>
    )
  }
  if (preview) return null
  return (
    <label className="cover-empty" style={{ cursor: 'pointer' }}>
      <span className="cover-ic"><Icon name="photo" size={24} /></span>
      <div className="cover-title">{uploading ? 'Uploading…' : 'Add a cover image'}</div>
      <div className="cover-sub">Click to upload a photo for this article</div>
      <input type="file" accept="image/*" hidden disabled={uploading}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPick(f) }} />
    </label>
  )
}

type ArticleData = { cover: string; title: string; category: string; author: string; body: string }

function ArticleComposer({ data, set, preview, coverUploading }: {
  data: ArticleData
  set: (patch: Partial<ArticleData>) => void
  preview?: boolean
  coverUploading?: boolean
}) {
  async function pickCover(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'covers')
    const res = await fetch('/api/marketing/repository/upload', { method: 'POST', body: fd })
    const payload = await res.json()
    if (res.ok) set({ cover: payload.url })
  }

  return (
    <div className="composer">
      <CoverSlot cover={data.cover} onPick={pickCover} onClear={() => set({ cover: '' })} preview={preview} uploading={coverUploading} />
      {preview
        ? <h1 className="compose-title-read">{data.title || 'Untitled article'}</h1>
        : <input className="compose-title" placeholder="Article title" value={data.title} onChange={(e) => set({ title: e.target.value })} />}
      <div className="compose-meta" style={preview ? { pointerEvents: 'none', opacity: 0.9 } : {}}>
        <div className="cm-field">
          <Icon name="layers" size={15} />
          <div className="cm-sel">
            <Select value={data.category} onChange={(v) => set({ category: v })} options={CATEGORIES} placeholder="Category" />
          </div>
        </div>
        <div className="cm-field">
          <Icon name="edit" size={15} />
          <input className="cm-input" placeholder="Author byline" value={data.author} onChange={(e) => set({ author: e.target.value })} />
        </div>
      </div>
      <RichEditor html={data.body} onChange={(h) => set({ body: h })} readOnly={preview}
        placeholder="Write your article… Use the toolbar to format, and add links — they'll be UTM-tagged automatically in the next step." />
    </div>
  )
}

function PublishPanel({ data, onClose, onPublish }: {
  data: ArticleData
  onClose: () => void
  onPublish: (rec: PublishRecord & { bodyHtml: string; category: string; coverImageUrl: string; author: string; slug: string }) => Promise<void>
}) {
  const [dest, setDest] = useState('blog')
  const [source, setSource] = useState('')
  const [medium, setMedium] = useState('social')
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'draft'>('now')
  const [schedule, setSchedule] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const cat = CATEGORIES.find((c) => c.id === data.category)
  const destObj = DESTINATIONS.find((d) => d.id === dest)
  const slug = slugify(data.title)
  const campaign = autoCampaign(cat ? cat.id : (data.title.split(' ')[0] || 'article'), source || 'site')
  const shareBase = `https://www.latimorelifelegacy.com${destObj ? destObj.path : '/blog'}/${slug}`
  const shareUrl = buildUrl(shareBase, { source, medium, campaign, content: 'article-share' })
  const bodyLinks = extractLinks(data.body)

  function copy() { navigator.clipboard?.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1600) }

  async function go() {
    setSubmitting(true)
    try {
      await onPublish({
        title: data.title || 'Untitled article',
        type: 'article',
        status: publishMode === 'now' ? 'published' : publishMode === 'schedule' ? 'scheduled' : 'draft',
        campaign,
        destination: dest,
        utmSource: source,
        utmMedium: medium,
        utmContent: 'article-share',
        sourceUrl: null,
        domain: 'Authored' + (cat ? ' · ' + cat.label : ''),
        scheduledFor: publishMode === 'schedule' ? new Date(schedule).toISOString() : null,
        bodyHtml: data.body,
        category: data.category,
        coverImageUrl: data.cover,
        author: data.author,
        slug,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pp-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pp" role="dialog" aria-modal="true">
        <div className="pp-head">
          <div>
            <div className="drawer-eyebrow">Publish article</div>
            <h2 className="drawer-title">Ready to go live</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>
        <div className="pp-body">
          <div className="field">
            <label>Publish to</label>
            <Select value={dest} onChange={setDest} options={DESTINATIONS.map((d) => ({ id: d.id, label: d.label }))} />
            <div className="lbl-hint mt6">Lives at <code>latimorelifelegacy.com{destObj ? destObj.path : ''}/{slug}</code></div>
          </div>

          <div className="field">
            <label className="lbl-row">Share link tracking <span className="lbl-hint">how you&apos;ll promote it</span></label>
            <div className="grid-2">
              <Select value={source} onChange={setSource} options={UTM_SOURCES} placeholder="utm_source" />
              <Select value={medium} onChange={setMedium} options={UTM_MEDIUMS} placeholder="utm_medium" />
            </div>
            <div className="lbl-hint mt6">Campaign auto-named: <code>{campaign}</code></div>
          </div>

          <div className="url-preview">
            <div className="up-head">
              <span className="up-label"><span className="live-dot" /> Tagged share URL</span>
              <button className="up-copy" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'Copied' : 'Copy'}</button>
            </div>
            <div className="up-url">{shareUrl}</div>
          </div>

          {bodyLinks.length > 0 && (
            <div className="inbody-note">
              <Icon name="link" size={14} />
              <span><strong>{bodyLinks.length}</strong> in-article link{bodyLinks.length > 1 ? 's' : ''} will be auto-tagged with <code>{campaign}</code>.</span>
            </div>
          )}

          <div className="deploy-card">
            <div className="dep-head">
              <span className="dep-target"><span className="dep-mark" /><span>Vercel · Production</span></span>
              <span className="dep-env">latimorelifelegacy.com</span>
            </div>
            <div className="dep-rows">
              <div className="dep-row"><Icon name="branch" size={14} /> Deploys from <code>main</code></div>
              <div className="dep-row"><Icon name="clock" size={14} /> Build &amp; go live in ~40s</div>
            </div>
            {publishMode === 'draft' && <div className="dep-note">Drafts don&apos;t deploy — saved to the repository only.</div>}
            {publishMode === 'schedule' && <div className="dep-note">Deploy triggers automatically on the scheduled date.</div>}
          </div>

          <div className="field">
            <label>When</label>
            <div className="radio-cards">
              {[
                { id: 'now', t: 'Publish now', s: 'Goes live immediately', ic: 'send' },
                { id: 'schedule', t: 'Schedule', s: 'Pick a date', ic: 'calendar' },
                { id: 'draft', t: 'Save as draft', s: 'Stays unpublished', ic: 'edit' },
              ].map((o) => (
                <button key={o.id} className={'radio-card ' + (publishMode === o.id ? 'rc-on' : '')} onClick={() => setPublishMode(o.id as typeof publishMode)}>
                  <Icon name={o.ic} size={17} />
                  <div><div className="rc-t">{o.t}</div><div className="rc-s">{o.s}</div></div>
                  <span className="rc-check"><Icon name="check" size={13} stroke={2.6} /></span>
                </button>
              ))}
            </div>
            {publishMode === 'schedule' && <input type="date" className="input mt10" value={schedule} onChange={(e) => setSchedule(e.target.value)} />}
          </div>
        </div>
        <div className="pp-foot">
          <Button variant="ghost" onClick={onClose}>Keep editing</Button>
          <Button variant="gold" icon="send" disabled={submitting} onClick={go}>
            {submitting ? 'Saving…' : publishMode === 'now' ? 'Publish & deploy' : publishMode === 'schedule' ? 'Schedule publish' : 'Save draft'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_ARTICLE: ArticleData = { cover: '', title: '', category: '', author: 'Jackson Latimore', body: '' }

export function ComposerOverlay({ open, onClose, onPublish }: {
  open: boolean
  onClose: () => void
  onPublish: (rec: PublishRecord & { bodyHtml: string; category: string; coverImageUrl: string; author: string; slug: string }) => Promise<void>
}) {
  const [data, setData] = useState<ArticleData>(EMPTY_ARTICLE)
  const [preview, setPreview] = useState(false)
  const [panel, setPanel] = useState(false)

  useEffect(() => {
    if (open) { setData(EMPTY_ARTICLE); setPreview(false); setPanel(false) }
  }, [open])

  if (!open) return null
  const set = (patch: Partial<ArticleData>) => setData((d) => ({ ...d, ...patch }))
  const canPublish = data.title.trim().length > 0

  return (
    <div className="composer-overlay">
      <div className="co-bar">
        <div className="co-bar-left">
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="chevLeft" size={20} /></button>
          <Wordmark compact />
          <span className="co-crumb">New article</span>
          <span className="co-saved"><span className="co-saved-dot" /> Draft saved</span>
        </div>
        <div className="co-bar-right">
          <Button variant="ghost" size="sm" icon={preview ? 'edit' : 'eye'} onClick={() => setPreview(!preview)}>{preview ? 'Edit' : 'Preview'}</Button>
          <Button variant="gold" size="sm" icon="send" disabled={!canPublish} onClick={() => setPanel(true)}>Publish</Button>
        </div>
      </div>
      <div className="co-scroll">
        <ArticleComposer data={data} set={set} preview={preview} />
      </div>
      {panel && <PublishPanel data={data} onClose={() => setPanel(false)} onPublish={onPublish} />}
    </div>
  )
}
