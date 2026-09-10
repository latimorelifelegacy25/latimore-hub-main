'use client'

// Content Repository dashboard — top bar, sidebar filters, stat tiles, type
// filter bar, table, bulk action bar. Ported from the Claude Design handoff
// (app.jsx), wired to real API routes instead of local seed state.

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Icon, TypeGlyph, Button, StatusBadge, Pill, Select, Toast, Wordmark } from './ui'
import { AddDrawer, type PublishRecord } from './Drawer'
import { ComposerOverlay } from './Composer'
import {
  DESTINATIONS, TYPES, UTM_SOURCES, UTM_MEDIUMS,
  buildUrl, type ContentType,
} from '@/lib/marketing/repository'
import type { MarketingContentItem } from '../../_types'

function BulkUtmModal({ open, count, onClose, onApply, campaignOptions }: {
  open: boolean
  count: number
  onClose: () => void
  onApply: (patch: { campaign?: string; source?: string; medium?: string }) => void
  campaignOptions: { id: string; label: string }[]
}) {
  const [campaign, setCampaign] = useState('')
  const [source, setSource] = useState('')
  const [medium, setMedium] = useState('')
  useEffect(() => { if (open) { setCampaign(''); setSource(''); setMedium('') } }, [open])
  if (!open) return null
  return (
    <div className="drawer-scrim center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="drawer-head">
          <div>
            <div className="drawer-eyebrow">Bulk action</div>
            <h2 className="drawer-title">Apply UTM to {count} item{count > 1 ? 's' : ''}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>
        <div className="drawer-body">
          <p className="modal-note">Set any fields below — only the ones you choose are overwritten across the selected resources. Empty fields are left as-is.</p>
          <div className="field">
            <label>utm_campaign</label>
            <Select value={campaign} onChange={setCampaign} options={campaignOptions} placeholder="Leave unchanged" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>utm_source</label>
              <Select value={source} onChange={setSource} options={UTM_SOURCES} placeholder="Leave unchanged" />
            </div>
            <div className="field">
              <label>utm_medium</label>
              <Select value={medium} onChange={setMedium} options={UTM_MEDIUMS} placeholder="Leave unchanged" />
            </div>
          </div>
        </div>
        <div className="drawer-foot">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="gold" icon="layers" disabled={!campaign && !source && !medium}
            onClick={() => onApply({ campaign: campaign || undefined, source: source || undefined, medium: medium || undefined })}>
            Apply to {count}
          </Button>
        </div>
      </div>
    </div>
  )
}

function displayDate(item: MarketingContentItem): string {
  const iso = item.status === 'scheduled' ? item.scheduledFor : item.status === 'published' ? item.publishedAt : item.createdAt
  return iso || item.createdAt
}

function Row({ item, selected, onToggle, onOpen }: {
  item: MarketingContentItem
  selected: boolean
  onToggle: () => void
  onOpen: () => void
}) {
  const dest = DESTINATIONS.find((d) => d.id === item.destination)
  const type = (item.type as ContentType) in TYPES ? (item.type as ContentType) : 'link'
  const base = item.sourceUrl && /^https?:/.test(item.sourceUrl) ? item.sourceUrl : `https://www.latimorelifelegacy.com${dest?.path || ''}`
  const tagged = buildUrl(base, { source: item.utmSource, medium: item.utmMedium, campaign: item.campaign, content: item.utmContent })

  return (
    <div className={'row ' + (selected ? 'row-sel' : '')}>
      <label className="cbox">
        <input type="checkbox" checked={selected} onChange={onToggle} />
        <span className="cbox-box"><Icon name="check" size={12} stroke={3} /></span>
      </label>
      <div className="row-main" onClick={onOpen}>
        <TypeGlyph type={type} />
        <div className="row-text">
          <div className="row-title">{item.title}</div>
          <div className="row-meta">
            <span className="rm-domain">{item.domain}</span>
            <span className="dotsep" />
            <span className="rm-url mono-sm">{tagged.replace(/^https?:\/\//, '')}</span>
          </div>
        </div>
      </div>
      <div className="row-camp">{item.campaign && <span className="camp-chip">{item.campaign}</span>}</div>
      <div className="row-dest">{dest?.label}</div>
      <div className="row-status"><StatusBadge status={item.status} /></div>
      <div className="row-date">{new Date(displayDate(item)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      <button className="icon-btn sm row-more"><Icon name="dots" size={18} /></button>
    </div>
  )
}

type Toast = { id: number; msg: string } | null

export default function RepositoryApp() {
  const [items, setItems] = useState<MarketingContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [drawer, setDrawer] = useState(false)
  const [composer, setComposer] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<Toast>(null)
  const [q, setQ] = useState('')
  const [fType, setFType] = useState('all')
  const [fStatus, setFStatus] = useState('all')
  const [fCampaign, setFCampaign] = useState('all')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/marketing/repository')
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error ?? 'Failed to load repository')
      setItems(payload)
      setLoadError('')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load repository')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function ping(msg: string) {
    const t = { id: Date.now(), msg }
    setToast(t)
    setTimeout(() => setToast((c) => (c && c.id === t.id ? null : c)), 2600)
  }

  const campaigns = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach((r) => { if (r.campaign) counts.set(r.campaign, (counts.get(r.campaign) ?? 0) + 1) })
    return Array.from(counts.entries()).map(([id, count]) => ({ id, label: id, count })).sort((a, b) => b.count - a.count)
  }, [items])

  const filtered = useMemo(() => items.filter((r) => {
    if (fType !== 'all' && r.type !== fType) return false
    if (fStatus !== 'all' && r.status !== fStatus) return false
    if (fCampaign !== 'all' && r.campaign !== fCampaign) return false
    if (q && !((r.title + (r.domain ?? '')).toLowerCase().includes(q.toLowerCase()))) return false
    return true
  }), [items, fType, fStatus, fCampaign, q])

  const selIds = Object.keys(sel).filter((k) => sel[k])
  const selCount = selIds.length
  const allSel = filtered.length > 0 && filtered.every((r) => sel[r.id])

  function toggleAll() {
    if (allSel) { const n = { ...sel }; filtered.forEach((r) => delete n[r.id]); setSel(n) }
    else { const n = { ...sel }; filtered.forEach((r) => (n[r.id] = true)); setSel(n) }
  }

  async function publish(rec: PublishRecord & Partial<{ bodyHtml: string; category: string; coverImageUrl: string; author: string; slug: string }>) {
    const res = await fetch('/api/marketing/repository', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec),
    })
    const payload = await res.json()
    setDrawer(false)
    setComposer(false)
    if (!res.ok) {
      ping(typeof payload?.error === 'string' ? payload.error : 'Failed to save')
      return
    }
    await load()
    if (rec.status === 'published') {
      ping(payload.deploy?.ok ? 'Deploying to latimorelifelegacy.com — live in ~40s' : 'Saved — deploy trigger not configured yet')
    } else if (rec.status === 'scheduled') {
      ping('Scheduled — deploys on publish date')
    } else {
      ping('Saved to repository as draft')
    }
  }

  async function applyBulk(patch: { campaign?: string; source?: string; medium?: string }) {
    const res = await fetch('/api/marketing/repository/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'utm', ids: selIds, ...patch }),
    })
    setBulk(false)
    if (res.ok) {
      await load()
      ping(`UTM applied to ${selIds.length} resource${selIds.length > 1 ? 's' : ''}`)
    } else {
      ping('Failed to apply UTM')
    }
    setSel({})
  }

  async function bulkPublish() {
    const count = selIds.length
    const res = await fetch('/api/marketing/repository/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', ids: selIds }),
    })
    if (res.ok) {
      await load()
      ping(`${count} resources published`)
    } else {
      ping('Failed to publish')
    }
    setSel({})
  }

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter((r) => r.status === 'published').length,
    scheduled: items.filter((r) => r.status === 'scheduled').length,
    campaigns: campaigns.length,
  }), [items, campaigns])

  const typeFilters = [
    { id: 'all', label: 'All types' },
    { id: 'article', label: 'Articles' },
    { id: 'link', label: 'Links' }, { id: 'pdf', label: 'PDFs' },
    { id: 'doc', label: 'Docs' }, { id: 'video', label: 'Videos' },
  ]

  return (
    <div className="lcr">
      <div className="app">
        <header className="topbar">
          <div className="tb-left">
            <Wordmark />
            <span className="tb-divider" />
            <span className="tb-app">Content Repository</span>
          </div>
          <div className="tb-right">
            <div className="search">
              <Icon name="search" size={17} className="search-ic" />
              <input placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button variant="ghost" icon="plus" onClick={() => setDrawer(true)}>Import link / doc</Button>
            <Button variant="gold" icon="edit" onClick={() => setComposer(true)}>Write article</Button>
          </div>
        </header>

        <div className="layout">
          <aside className="sidebar">
            <div className="side-group">
              <div className="side-h">Status</div>
              {[
                { id: 'all', label: 'Everything', n: items.length },
                { id: 'published', label: 'Published', n: stats.published },
                { id: 'scheduled', label: 'Scheduled', n: stats.scheduled },
                { id: 'draft', label: 'Drafts', n: items.filter((r) => r.status === 'draft').length },
              ].map((s) => (
                <button key={s.id} className={'side-item ' + (fStatus === s.id ? 'side-on' : '')} onClick={() => setFStatus(s.id)}>
                  <span>{s.label}</span><span className="side-n">{s.n}</span>
                </button>
              ))}
            </div>
            <div className="side-group">
              <div className="side-h">Campaigns</div>
              <button className={'side-item ' + (fCampaign === 'all' ? 'side-on' : '')} onClick={() => setFCampaign('all')}>
                <span>All campaigns</span><span className="side-n">{stats.campaigns}</span>
              </button>
              {campaigns.map((c) => (
                <button key={c.id} className={'side-item ' + (fCampaign === c.id ? 'side-on' : '')} onClick={() => setFCampaign(c.id)}>
                  <span className="side-camp"><span className="camp-tick" />{c.label}</span>
                  <span className="side-n">{c.count}</span>
                </button>
              ))}
            </div>
            <div className="side-foot">
              <div className="beat">#TheBeatGoesOn</div>
              <div className="beat-sub">Protecting Today. Securing Tomorrow.</div>
            </div>
          </aside>

          <main className="main">
            <div className="page-head">
              <div>
                <h1 className="page-title">Repository</h1>
                <p className="page-sub">Every link &amp; document, UTM-tagged and ready for your site.</p>
              </div>
            </div>

            <div className="stats">
              {[
                { k: 'Resources', v: stats.total, ic: 'layers' },
                { k: 'Published', v: stats.published, ic: 'globe' },
                { k: 'Scheduled', v: stats.scheduled, ic: 'clock' },
                { k: 'Campaigns', v: stats.campaigns, ic: 'sparkle' },
              ].map((s) => (
                <div className="stat" key={s.k}>
                  <span className="stat-ic"><Icon name={s.ic} size={18} /></span>
                  <div><div className="stat-v">{s.v}</div><div className="stat-k">{s.k}</div></div>
                </div>
              ))}
            </div>

            <div className="type-bar">
              {typeFilters.map((t) => (
                <Pill key={t.id} active={fType === t.id} onClick={() => setFType(t.id)}>{t.label}</Pill>
              ))}
            </div>

            <div className="table">
              <div className="thead">
                <label className="cbox">
                  <input type="checkbox" checked={allSel} onChange={toggleAll} />
                  <span className="cbox-box"><Icon name="check" size={12} stroke={3} /></span>
                </label>
                <div className="th-main">Resource</div>
                <div className="th-camp">Campaign</div>
                <div className="th-dest">Destination</div>
                <div className="th-status">Status</div>
                <div className="th-date">Date</div>
                <div className="th-more" />
              </div>
              {loading ? (
                <div className="empty"><div className="empty-t">Loading…</div></div>
              ) : loadError ? (
                <div className="empty"><div className="empty-t">{loadError}</div></div>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <span className="empty-ic"><Icon name="inbox" size={30} /></span>
                  <div className="empty-t">Nothing here yet</div>
                  <div className="empty-s">Write an article or import a link to start tagging.</div>
                  <div className="empty-actions">
                    <Button variant="ghost" icon="plus" onClick={() => setDrawer(true)}>Import link / doc</Button>
                    <Button variant="gold" icon="edit" onClick={() => setComposer(true)}>Write article</Button>
                  </div>
                </div>
              ) : filtered.map((r) => (
                <Row key={r.id} item={r} selected={!!sel[r.id]}
                  onToggle={() => setSel({ ...sel, [r.id]: !sel[r.id] })}
                  onOpen={() => ping('UTM links on this resource are tracked automatically')} />
              ))}
            </div>
          </main>
        </div>

        {selCount > 0 && (
          <div className="bulk-bar">
            <div className="bulk-left">
              <span className="bulk-count">{selCount}</span> selected
              <button className="bulk-clear" onClick={() => setSel({})}>Clear</button>
            </div>
            <div className="bulk-actions">
              <Button variant="ghost" size="sm" icon="layers" onClick={() => setBulk(true)}>Apply UTM</Button>
              <Button variant="gold" size="sm" icon="send" onClick={bulkPublish}>Publish</Button>
            </div>
          </div>
        )}

        <AddDrawer open={drawer} onClose={() => setDrawer(false)} onPublish={publish} existingCampaigns={campaigns.map((c) => c.id)} />
        <ComposerOverlay open={composer} onClose={() => setComposer(false)} onPublish={publish} />
        <BulkUtmModal open={bulk} count={selCount} onClose={() => setBulk(false)} onApply={applyBulk} campaignOptions={campaigns.map((c) => ({ id: c.id, label: c.label }))} />
        <Toast toast={toast} />
      </div>
    </div>
  )
}
