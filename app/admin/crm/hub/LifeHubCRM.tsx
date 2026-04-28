'use client'

import { useState } from 'react'
import { Contact } from '@prisma/client'
import PageHeader from '../../_components/PageHeader'

interface ClientWithDetails extends Contact {
  inquiries?: any[]
  notes?: any[]
  snapshot?: {
    whoTheyAre: string
    familyContext: string[]
    financialPicture: string[]
    topGoals: string[]
    riskThemes: string[]
    summary: string
  }
}

export default function LifeHubCRMContent({ initialContacts }: { initialContacts: ClientWithDetails[] }) {
  const [contacts, setContacts] = useState<ClientWithDetails[]>(initialContacts)
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [selectedContact, setSelectedContact] = useState<ClientWithDetails | null>(null)
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const pipelineStages = [
    'New Lead',
    'Contacted',
    'Booked Call',
    'Discovery Complete',
    'Options Presented',
    'App Submitted',
    'Underwriting',
    'Issued / Delivered',
    'In Force + Review',
    'Lost / Not Proceeding',
  ]

  const handleGenerateSnapshot = async (contact: ClientWithDetails) => {
    setIsGeneratingSnapshot(true)
    try {
      const response = await fetch('/api/admin/ai/client-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          notes: contact.notes,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate snapshot')

      const data = await response.json()
      setContacts(contacts.map(c =>
        c.id === contact.id ? { ...c, snapshot: data.snapshot } : c
      ))
    } catch (error) {
      console.error('Snapshot generation error:', error)
      alert('Failed to generate client snapshot')
    } finally {
      setIsGeneratingSnapshot(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const contactsByStage = pipelineStages.map(stage => ({
    stage,
    contacts: filteredContacts.filter(c => c.status === stage)
  }))

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        eyebrow="Client Relationship Management"
        title="Life Hub CRM"
        description="AI-powered pipeline management and client insights"
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              viewMode === 'pipeline'
                ? 'bg-[#C9A25F] text-slate-900'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            Pipeline View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              viewMode === 'list'
                ? 'bg-[#C9A25F] text-slate-900'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            List View
          </button>
        </div>

        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#C9A25F]"
        />
      </div>

      {viewMode === 'pipeline' ? (
        /* Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {contactsByStage.map(({ stage, contacts: stageContacts }) => (
            <div key={stage} className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-black text-white mb-4">{stage}</h3>
              <div className="space-y-3">
                {stageContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[#C9A25F] transition"
                  >
                    <p className="text-sm font-semibold text-white">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{contact.email}</p>
                    {contact.leadScore && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-xs text-[#C9A25F] font-semibold">
                          Score: {contact.leadScore}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {stageContacts.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No contacts</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Score</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-white">
                        {contact.firstName} {contact.lastName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400">{contact.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-700 text-xs font-semibold rounded">
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#C9A25F] font-semibold">{contact.leadScore || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedContact(contact)}
                        className="text-[#C9A25F] hover:text-[#D4AF77] text-sm font-semibold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h2>
                  <p className="text-slate-400 mt-1">{selectedContact.email}</p>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-white mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Phone</p>
                        <p className="text-white mt-1">{selectedContact.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">County</p>
                        <p className="text-white mt-1">{selectedContact.county || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Lead Score</p>
                        <p className="text-[#C9A25F] font-semibold mt-1">{selectedContact.leadScore || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Snapshot */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-black text-white">AI Client Snapshot</h3>
                      <button
                        onClick={() => handleGenerateSnapshot(selectedContact)}
                        disabled={isGeneratingSnapshot}
                        className="bg-[#C9A25F] hover:bg-[#D4AF77] disabled:opacity-50 text-slate-900 font-black px-4 py-2 rounded-lg transition"
                      >
                        {isGeneratingSnapshot ? 'Generating...' : 'Generate'}
                      </button>
                    </div>

                    {selectedContact.snapshot ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Who They Are</p>
                          <p className="text-white mt-2 text-sm">{selectedContact.snapshot.whoTheyAre}</p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Family Context</p>
                          <ul className="text-white mt-2 text-sm space-y-1">
                            {selectedContact.snapshot.familyContext.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-[#C9A25F] mt-1">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Financial Picture</p>
                          <ul className="text-white mt-2 text-sm space-y-1">
                            {selectedContact.snapshot.financialPicture.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-[#C9A25F] mt-1">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Summary</p>
                          <p className="text-white mt-2 text-sm">{selectedContact.snapshot.summary}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Click "Generate" to create AI snapshot
                      </p>
                    )}
                  </div>
                </div>

                {/* Inquiries */}
                <div>
                  <h3 className="text-lg font-black text-white mb-4">Recent Inquiries</h3>
                  <div className="space-y-3">
                    {selectedContact.inquiries?.slice(0, 5).map((inquiry: any) => (
                      <div key={inquiry.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-sm font-semibold text-white">{inquiry.productInterest}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )) || (
                      <p className="text-sm text-slate-400">No inquiries found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}