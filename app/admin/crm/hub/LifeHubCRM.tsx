'use client'

import { useMemo, useState } from 'react'
import type { Contact, LeadStatus } from '@prisma/client'
import PageHeader from '@/app/admin/_components/PageHeader'
import ContactActionPanel from './ContactActionPanel'

interface ClientWithDetails extends Contact {
  inquiries?: Array<{ id: string; stage?: string | null; createdAt?: Date | string }>
  notes?: Array<{ id: string; body?: string | null; createdAt?: Date | string }>
  snapshot?: {
    whoTheyAre?: string
    familyContext?: string[]
    financialPicture?: string[]
    topGoals?: string[]
    riskThemes?: string[]
    summary?: string
  }
}

const PIPELINE_STAGES: LeadStatus[] = [
  'NEW',
  'ATTEMPTED_CONTACT',
  'CONTACTED',
  'QUALIFIED',
  'BOOKED',
  'IN_CONSULT',
  'CLOSED_WON',
  'CLOSED_LOST',
  'NURTURE',
  'ON_HOLD',
  'DORMANT',
]

function formatStatus(status: string) {
  return status
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

function contactName(contact: ClientWithDetails) {
  const name = contact.fullName || `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim()
  return name || contact.email || contact.phone || 'Unnamed contact'
}

function dateValue(value: Date | string | null | undefined) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleDateString()
}

export default function LifeHubCRMContent({ initialContacts }: { initialContacts: ClientWithDetails[] }) {
  const [contacts, setContacts] = useState<ClientWithDetails[]>(initialContacts)
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [selectedContact, setSelectedContact] = useState<ClientWithDetails | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredContacts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return contacts.filter(contact => {
      const matchesSearch = !search || [
        contact.fullName,
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone,
        contact.county,
      ].some(value => value?.toLowerCase().includes(search))

      const matchesStatus = !statusFilter || contact.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [contacts, searchTerm, statusFilter])

  const contactsByStage = useMemo(() => {
    return PIPELINE_STAGES.map(stage => ({
      stage,
      contacts: filteredContacts.filter(contact => contact.status === stage),
    }))
  }, [filteredContacts])

  const selectedCount = selectedContacts.size

  function toggleContact(contactId: string, checked: boolean) {
    setSelectedContacts(prev => {
      const next = new Set(prev)
      if (checked) next.add(contactId)
      else next.delete(contactId)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelectedContacts(checked ? new Set(filteredContacts.map(contact => contact.id)) : new Set())
  }

  async function updateStatus(contactIds: string[], status: LeadStatus) {
    if (!contactIds.length) return
    setIsUpdating(true)
    setError(null)

    try {
      const responses = await Promise.all(contactIds.map(contactId =>
        fetch(`/api/contacts/${contactId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }),
      ))

      const failed = responses.find(response => !response.ok)
      if (failed) throw new Error(await failed.text())

      const idSet = new Set(contactIds)
      setContacts(prev => prev.map(contact => idSet.has(contact.id) ? { ...contact, status } : contact))
      setSelectedContacts(new Set())
      setSelectedContact(prev => prev && idSet.has(prev.id) ? { ...prev, status } : prev)
    } catch (err) {
      console.error('[LifeHubCRM] status update failed', err)
      setError('Status update failed. Check the contact API route and database connection.')
    } finally {
      setIsUpdating(false)
    }
  }

  function exportContacts() {
    const rows = [
      ['Name', 'Email', 'Phone', 'County', 'Status', 'Lead Score', 'Created At'],
      ...filteredContacts.map(contact => [
        contactName(contact),
        contact.email ?? '',
        contact.phone ?? '',
        contact.county ?? '',
        contact.status,
        String(contact.leadScore ?? 0),
        dateValue(contact.createdAt),
      ]),
    ]

    const csv = rows
      .map(row => row.map(field => `"${String(field).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `life-hub-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        eyebrow="Client Relationship Management"
        title="Life Hub CRM"
        description="Pipeline management, contact review, and action planning for Latimore Life & Legacy."
      />

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${viewMode === 'pipeline' ? 'bg-[#C9A25F] text-slate-950' : 'bg-white/10 text-white hover:bg-white/15'}`}
            >
              Pipeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${viewMode === 'list' ? 'bg-[#C9A25F] text-slate-950' : 'bg-white/10 text-white hover:bg-white/15'}`}
            >
              List
            </button>
            <button
              type="button"
              onClick={exportContacts}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
            >
              Export CSV
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search name, email, phone, county"
              className="min-w-[260px] rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#C9A25F]"
            />
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white outline-none focus:border-[#C9A25F]"
            >
              <option value="">All statuses</option>
              {PIPELINE_STAGES.map(stage => (
                <option key={stage} value={stage}>{formatStatus(stage)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          <span>{filteredContacts.length} shown</span>
          <span>{contacts.length} total</span>
          <span>{selectedCount} selected</span>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">
            {error}
          </div>
        )}

        {selectedCount > 0 && (
          <div className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-[#C9A25F]/30 bg-[#C9A25F]/10 p-4">
            {(['CONTACTED', 'QUALIFIED', 'BOOKED', 'CLOSED_WON', 'CLOSED_LOST', 'NURTURE'] as LeadStatus[]).map(status => (
              <button
                key={status}
                type="button"
                disabled={isUpdating}
                onClick={() => updateStatus(Array.from(selectedContacts), status)}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                Mark {formatStatus(status)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedContacts(new Set())}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-300 transition hover:bg-white/15"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {viewMode === 'pipeline' ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {contactsByStage.map(({ stage, contacts: stageContacts }) => (
            <section key={stage} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">{formatStatus(stage)}</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-black text-[#C9A25F]">{stageContacts.length}</span>
              </div>
              <div className="space-y-3">
                {stageContacts.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs font-semibold text-slate-500">No contacts</p>
                ) : stageContacts.map(contact => (
                  <article key={contact.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-[#C9A25F]/60">
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.id)}
                        onChange={event => toggleContact(contact.id, event.target.checked)}
                        className="mt-1"
                        aria-label={`Select ${contactName(contact)}`}
                      />
                      <button type="button" onClick={() => setSelectedContact(contact)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-black text-white">{contactName(contact)}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">{contact.email || contact.phone || 'No contact detail'}</p>
                        <p className="mt-2 text-xs font-bold text-[#C9A25F]">Score {contact.leadScore ?? 0}</p>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/10 text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="w-12 px-5 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                      onChange={event => toggleAll(event.target.checked)}
                      aria-label="Select all visible contacts"
                    />
                  </th>
                  <th className="px-5 py-4 text-left">Name</th>
                  <th className="px-5 py-4 text-left">Contact</th>
                  <th className="px-5 py-4 text-left">County</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Score</th>
                  <th className="px-5 py-4 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="border-t border-white/10 text-slate-200 hover:bg-white/5">
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.id)}
                        onChange={event => toggleContact(contact.id, event.target.checked)}
                        aria-label={`Select ${contactName(contact)}`}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => setSelectedContact(contact)} className="text-left font-black text-white hover:text-[#C9A25F]">
                        {contactName(contact)}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{contact.email || contact.phone || 'Not provided'}</td>
                    <td className="px-5 py-4 text-slate-400">{contact.county || 'Not set'}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-black text-[#C9A25F]">{formatStatus(contact.status)}</span></td>
                    <td className="px-5 py-4 font-black text-white">{contact.leadScore ?? 0}</td>
                    <td className="px-5 py-4 text-slate-400">{dateValue(contact.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C9A25F]">Contact detail</p>
                <h2 className="mt-2 text-2xl font-black text-white">{contactName(selectedContact)}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedContact.email || selectedContact.phone || 'No contact detail'}</p>
              </div>
              <button type="button" onClick={() => setSelectedContact(null)} className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15">
                Close
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">Profile</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div><dt className="text-slate-500">Phone</dt><dd className="font-semibold text-white">{selectedContact.phone || 'Not provided'}</dd></div>
                  <div><dt className="text-slate-500">County</dt><dd className="font-semibold text-white">{selectedContact.county || 'Not set'}</dd></div>
                  <div><dt className="text-slate-500">Status</dt><dd className="font-semibold text-[#C9A25F]">{formatStatus(selectedContact.status)}</dd></div>
                  <div><dt className="text-slate-500">Lead score</dt><dd className="font-semibold text-white">{selectedContact.leadScore ?? 0}</dd></div>
                  <div><dt className="text-slate-500">Created</dt><dd className="font-semibold text-white">{dateValue(selectedContact.createdAt)}</dd></div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(['CONTACTED', 'QUALIFIED', 'BOOKED', 'CLOSED_WON', 'CLOSED_LOST', 'NURTURE'] as LeadStatus[]).map(status => (
                    <button
                      key={status}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateStatus([selectedContact.id], status)}
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15 disabled:opacity-50"
                    >
                      {formatStatus(status)}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">AI action panel</h3>
                <div className="mt-4">
                  <ContactActionPanel contactId={selectedContact.id} />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
