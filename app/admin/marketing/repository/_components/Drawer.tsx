'use client'

// Add to Repository drawer: Import → Track (UTM) → Publish.
// Ported from the Claude Design handoff (drawer.jsx), wired to real upload
// and create API calls instead of local fake-file/seed state.

import { useEffect, useMemo, useState } from 'react'
import { Icon, TypeGlyph, Button, Select } from './ui'
import {
  UTM_SOURCES, UTM_MEDIUMS, DESTINATIONS, TYPES,
  buildUrl, autoCampaign, guessTitleFromUrl, domainOf, typeFromUrl, formatFileSize,
  type ContentType,
} from '@/lib/marketing/repository'

const STEPS = ['Import', 'Track', 'Publish']

export type PublishRecord = {
  title: string
  type: ContentType
  status: 'draft' | 'published' | 'scheduled'
  campaign: string
  destination: string
  utmSource: string
  utmMedium: string
  utmContent: string
  sourceUrl: string | null
  domain: string | null
  fileName?: string | null
  fileSizeBytes?: number | null
  scheduledFor?: string | null
}

export function AddDrawer({
  open, onClose, onPublish, existingCampaigns,
}: {
  open: boolean
  onClose: () => void
  onPublish: (rec: PublishRecord) => Promise<void>
  existingCampaigns: string[]
}) {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'link' | 'upload'>('link')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<{ name: string; url: string; kind: ContentType; size: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ContentType>('link')
  const [utm, setUtm] = useState({ source: '', medium: '', campaign: '', content: '' })
  const [campaignMode, setCampaignMode] = useState<'existing' | 'new'>(existingCampaigns.length ? 'existing' : 'new')
  const [newCampaign, setNewCampaign] = useState('')
  const [dest, setDest] = useState('blog')
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'draft'>('now')
  const [schedule, setSchedule] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(0); setMode('link'); setUrl(''); setFile(null); setUploadError(''); setTitle(''); setType('link')
      setUtm({ source: '', medium: '', campaign: '', content: '' })
      setCampaignMode(existingCampaigns.length ? 'existing' : 'new'); setNewCampaign(''); setDest('blog')
      setPublishMode('now')
      setSchedule(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
      setCopied(false); setSubmitting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const campaignOptions = existingCampaigns.map((c) => ({ id: c, label: c }))
  const effectiveCampaign = campaignMode === 'new' ? newCampaign : utm.campaign
  const baseUrl = mode === 'link' ? url : (file?.url || 'https://www.latimorelifelegacy.com/r/resource')
  const finalUtm = { ...utm, campaign: effectiveCampaign }
  const taggedUrl = useMemo(
    () => buildUrl(baseUrl || 'https://www.latimorelifelegacy.com/r/resource', finalUtm),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on primitive UTM fields, not the recreated finalUtm object
    [baseUrl, finalUtm.source, finalUtm.medium, finalUtm.campaign, finalUtm.content],
  )

  const canNext0 = mode === 'link' ? url.trim().length > 4 && title.trim().length > 0 : Boolean(file) && title.trim().length > 0
  const canNext1 = Boolean(utm.source && utm.medium && effectiveCampaign)

  function handleUrlBlur() {
    if (url && !title) setTitle(guessTitleFromUrl(url))
    if (url) setType(typeFromUrl(url))
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    setUploadError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', picked)
      fd.append('folder', 'repository')
      const res = await fetch('/api/marketing/repository/upload', { method: 'POST', body: fd })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error ?? 'Upload failed')

      const kind: ContentType = /\.pdf$/i.test(picked.name) ? 'pdf' : 'doc'
      setFile({ name: picked.name, url: payload.url, kind, size: picked.size })
      setType(kind)
      if (!title) setTitle(picked.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function autoGen() {
    const topic = title.split(' ')[0] || 'general'
    setNewCampaign(autoCampaign(topic, finalUtm.source))
  }
  function copyUrl() {
    navigator.clipboard?.writeText(taggedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  async function publish() {
    setSubmitting(true)
    try {
      await onPublish({
        title,
        type,
        status: publishMode === 'now' ? 'published' : publishMode === 'schedule' ? 'scheduled' : 'draft',
        campaign: effectiveCampaign,
        destination: dest,
        utmSource: finalUtm.source,
        utmMedium: finalUtm.medium,
        utmContent: finalUtm.content,
        sourceUrl: mode === 'link' ? url : file?.url ?? null,
        domain: mode === 'link' ? domainOf(url) : `Uploaded · ${formatFileSize(file?.size)}`,
        fileName: mode === 'upload' ? file?.name : null,
        fileSizeBytes: mode === 'upload' ? file?.size : null,
        scheduledFor: publishMode === 'schedule' ? new Date(schedule).toISOString() : null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null
  const destObj = DESTINATIONS.find((d) => d.id === dest)

  return (
    <div className="drawer-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div>
            <div className="drawer-eyebrow">Add to Repository</div>
            <h2 className="drawer-title">{STEPS[step] === 'Import' ? 'Bring in your content' : STEPS[step] === 'Track' ? 'Configure UTM tracking' : 'Publish to your site'}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={20} /></button>
        </div>

        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={'step ' + (i === step ? 'step-on' : i < step ? 'step-done' : '')}>
              <span className="step-dot">{i < step ? <Icon name="check" size={13} stroke={2.6} /> : i + 1}</span>
              <span className="step-label">{s}</span>
              {i < STEPS.length - 1 && <span className="step-line" />}
            </div>
          ))}
        </div>

        <div className="drawer-body">
          {step === 0 && (
            <div className="stack">
              <div className="seg">
                <button className={'seg-btn ' + (mode === 'link' ? 'seg-on' : '')} onClick={() => setMode('link')}>
                  <Icon name="link" size={16} /> Paste a link
                </button>
                <button className={'seg-btn ' + (mode === 'upload' ? 'seg-on' : '')} onClick={() => setMode('upload')}>
                  <Icon name="upload" size={16} /> Upload a document
                </button>
              </div>

              {mode === 'link' ? (
                <div className="field">
                  <label>Resource URL</label>
                  <div className="input-wrap">
                    <Icon name="globe" size={17} className="input-ic" />
                    <input className="input has-ic" placeholder="https://…" value={url}
                      onChange={(e) => setUrl(e.target.value)} onBlur={handleUrlBlur} autoFocus />
                  </div>
                  {url && (
                    <div className="preview-card">
                      <TypeGlyph type={type} size={20} />
                      <div className="pc-body">
                        <div className="pc-domain">{domainOf(url) || 'link'}</div>
                        <div className="pc-title">{title || guessTitleFromUrl(url) || 'Untitled resource'}</div>
                      </div>
                      <span className="pc-badge">{TYPES[type].label} detected</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="field">
                  <label>Document</label>
                  {!file ? (
                    <label className="dropzone" style={{ cursor: 'pointer' }}>
                      <span className="dz-ic"><Icon name="upload" size={26} /></span>
                      <div className="dz-title">{uploading ? 'Uploading…' : 'Click to choose your file'}</div>
                      <div className="dz-sub">PDF, Word, or Google Docs export · up to 25 MB</div>
                      <input type="file" accept=".pdf,.doc,.docx" hidden onChange={handleFilePick} disabled={uploading} />
                    </label>
                  ) : (
                    <div className="preview-card">
                      <TypeGlyph type={file.kind} size={20} />
                      <div className="pc-body">
                        <div className="pc-domain">Uploaded · {formatFileSize(file.size)}</div>
                        <div className="pc-title">{file.name}</div>
                      </div>
                      <button className="icon-btn sm" onClick={() => { setFile(null); setTitle('') }}><Icon name="x" size={16} /></button>
                    </div>
                  )}
                  {uploadError && <div className="dep-note">{uploadError}</div>}
                </div>
              )}

              <div className="field">
                <label>Display title <span className="lbl-hint">how it appears on your site</span></label>
                <input className="input" placeholder="e.g. Understanding Medicare Advantage" value={title}
                  onChange={(e) => setTitle(e.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="stack">
              <div className="grid-2">
                <div className="field">
                  <label>utm_source</label>
                  <Select value={utm.source} onChange={(v) => setUtm({ ...utm, source: v })} options={UTM_SOURCES} placeholder="Where it's shared" />
                </div>
                <div className="field">
                  <label>utm_medium</label>
                  <Select value={utm.medium} onChange={(v) => setUtm({ ...utm, medium: v })} options={UTM_MEDIUMS} placeholder="Channel type" />
                </div>
              </div>

              <div className="field">
                <label className="lbl-row">
                  utm_campaign
                  <span className="campaign-toggle">
                    <button className={campaignMode === 'existing' ? 'on' : ''} onClick={() => setCampaignMode('existing')}>Existing</button>
                    <button className={campaignMode === 'new' ? 'on' : ''} onClick={() => setCampaignMode('new')}>New</button>
                  </span>
                </label>
                {campaignMode === 'existing' ? (
                  campaignOptions.length > 0 ? (
                    <Select value={utm.campaign} onChange={(v) => setUtm({ ...utm, campaign: v })}
                      options={campaignOptions} placeholder="Pick a campaign" />
                  ) : (
                    <div className="lbl-hint">No campaigns yet — switch to &quot;New&quot; to create one.</div>
                  )
                ) : (
                  <div className="input-wrap">
                    <input className="input mono-input" placeholder="latimore-…-2026" value={newCampaign}
                      onChange={(e) => setNewCampaign(e.target.value)} />
                    <button className="autogen" onClick={autoGen}><Icon name="sparkle" size={15} /> Auto-name</button>
                  </div>
                )}
                {campaignMode === 'new' && <div className="lbl-hint mt6">We keep names consistent: <code>latimore-topic-source-year</code></div>}
              </div>

              <div className="field">
                <label>utm_content <span className="lbl-hint">optional · which creative or placement</span></label>
                <input className="input mono-input" placeholder="e.g. carousel-1, welcome-email" value={utm.content}
                  onChange={(e) => setUtm({ ...utm, content: e.target.value })} />
              </div>

              <div className="url-preview">
                <div className="up-head">
                  <span className="up-label"><span className="live-dot" /> Live tagged URL</span>
                  <button className="up-copy" onClick={copyUrl}>
                    <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="up-url">{taggedUrl}</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="stack">
              <div className="field">
                <label>Destination on your site</label>
                <Select value={dest} onChange={setDest} options={DESTINATIONS.map((d) => ({ id: d.id, label: d.label }))} />
                <div className="lbl-hint mt6">Publishes to <code>latimorelifelegacy.com{destObj?.path}</code></div>
              </div>

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
                {publishMode === 'schedule' && (
                  <input type="date" className="input mt10" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
                )}
              </div>

              <div className="summary">
                <div className="sum-row"><span>Resource</span><strong>{title || 'Untitled'}</strong></div>
                <div className="sum-row"><span>Type</span><strong>{TYPES[type].label}</strong></div>
                <div className="sum-row"><span>Campaign</span><strong className="mono-sm">{effectiveCampaign}</strong></div>
                <div className="sum-row"><span>Destination</span><strong>{destObj?.label}</strong></div>
                <div className="sum-row sum-url"><span>Tagged URL</span><strong className="mono-sm">{taggedUrl}</strong></div>
              </div>
            </div>
          )}
        </div>

        <div className="drawer-foot">
          {step > 0 ? <Button variant="ghost" icon="chevLeft" onClick={() => setStep(step - 1)}>Back</Button> : <span />}
          {step < 2 ? (
            <Button variant="primary" iconRight="chevRight" disabled={step === 0 ? !canNext0 : !canNext1} onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button variant="gold" icon="send" disabled={submitting} onClick={publish}>
              {submitting ? 'Saving…' : publishMode === 'now' ? 'Publish & deploy' : publishMode === 'schedule' ? 'Schedule publish' : 'Save draft'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
