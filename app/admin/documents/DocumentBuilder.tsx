'use client'

import { useState, useRef } from 'react'

let _counter = 0
const uid = () => `s${Date.now()}-${_counter++}`

type Section = {
  id: string
  heading: string
  subheading: string
  body: string
  pullQuote: string
  tableRows: { colA: string; colB: string }[]
}

const EMPTY_SECTION = (): Section => ({
  id: uid(),
  heading: '',
  subheading: '',
  body: '',
  pullQuote: '',
  tableRows: [],
})

export default function DocumentBuilder() {
  const [docName, setDocName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [territory, setTerritory] = useState('Schuylkill, Luzerne & Northumberland Counties  ·  PA')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [classification, setClassification] = useState('Confidential — Internal Use Only')
  const [sections, setSections] = useState<Section[]>([EMPTY_SECTION()])
  const [preview, setPreview] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const addSection = () => setSections((s: Section[]) => [...s, EMPTY_SECTION()])
  const removeSection = (id: string) => setSections((s: Section[]) => s.filter((x: Section) => x.id !== id))
  const updateSection = (id: string, field: keyof Section, value: string | { colA: string; colB: string }[]) =>
    setSections((s: Section[]) => s.map((x: Section) => x.id === id ? { ...x, [field]: value } : x))
  const addTableRow = (id: string) =>
    setSections((s: Section[]) => s.map((x: Section) => x.id === id ? { ...x, tableRows: [...x.tableRows, { colA: '', colB: '' }] } : x))
  const updateTableRow = (sectionId: string, rowIdx: number, col: 'colA' | 'colB', val: string) =>
    setSections((s: Section[]) => s.map((x: Section) => x.id === sectionId
      ? { ...x, tableRows: x.tableRows.map((r: { colA: string; colB: string }, i: number) => i === rowIdx ? { ...r, [col]: val } : r) }
      : x))
  const removeTableRow = (sectionId: string, rowIdx: number) =>
    setSections((s: Section[]) => s.map((x: Section) => x.id === sectionId
      ? { ...x, tableRows: x.tableRows.filter((_: { colA: string; colB: string }, i: number) => i !== rowIdx) }
      : x))

  const handlePrint = () => {
    setPreview(true)
    setTimeout(() => window.print(), 300)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setPreview((p: boolean) => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-colors"
        >
          <i className={`fa-solid ${preview ? 'fa-pen' : 'fa-eye'} text-[#C9A25F]`}></i>
          {preview ? 'Edit' : 'Preview'}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A25F] text-[#0E1A2B] text-sm font-bold hover:bg-[#E5C882] transition-colors"
        >
          <i className="fa-solid fa-print"></i>
          Print / Export PDF
        </button>
      </div>

      {!preview ? (
        /* ── EDITOR ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cover fields */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-[#C9A25F] font-bold text-sm uppercase tracking-widest">Cover / Header</h2>
            {[
              { label: 'Document Name', value: docName, set: setDocName, placeholder: 'e.g. 2026 Business Plan' },
              { label: 'Subtitle', value: subtitle, set: setSubtitle, placeholder: 'e.g. Strategic Growth Roadmap' },
              { label: 'Tagline · Descriptors', value: tagline, set: setTagline, placeholder: 'e.g. Insurance · Wealth · Legacy' },
              { label: 'Territory / Context', value: territory, set: setTerritory, placeholder: '' },
              { label: 'Year', value: year, set: setYear, placeholder: '2026' },
              { label: 'Classification', value: classification, set: setClassification, placeholder: 'Confidential — Internal Use Only' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-slate-400 text-xs font-medium mb-1">{f.label}</label>
                <input
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A25F]/50"
                />
              </div>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((sec, idx) => (
              <div key={sec.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-semibold text-sm">Section {idx + 1}</h3>
                  {sections.length > 1 && (
                    <button onClick={() => removeSection(sec.id)} className="text-slate-500 hover:text-rose-400 text-xs">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </div>
                {[
                  { label: 'Heading', field: 'heading' as const, placeholder: 'Section Heading' },
                  { label: 'Subheading', field: 'subheading' as const, placeholder: 'Subsection Heading' },
                ].map(f => (
                  <div key={f.field}>
                    <label className="block text-slate-400 text-xs mb-1">{f.label}</label>
                    <input
                      value={sec[f.field] as string}
                      onChange={e => updateSection(sec.id, f.field, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A25F]/50"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Body Copy</label>
                  <textarea
                    value={sec.body}
                    onChange={e => updateSection(sec.id, 'body', e.target.value)}
                    rows={4}
                    placeholder="Section body copy..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A25F]/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Pull Quote (optional)</label>
                  <input
                    value={sec.pullQuote}
                    onChange={e => updateSection(sec.id, 'pullQuote', e.target.value)}
                    placeholder='"Key principle or pull quote..."'
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A25F]/50"
                  />
                </div>

                {/* Table rows */}
                {sec.tableRows.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-slate-400 text-xs">Table Rows</label>
                    {sec.tableRows.map((row, ri) => (
                      <div key={ri} className="flex gap-2 items-center">
                        <input
                          value={row.colA}
                          onChange={e => updateTableRow(sec.id, ri, 'colA', e.target.value)}
                          placeholder="Column A"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#C9A25F]/50"
                        />
                        <input
                          value={row.colB}
                          onChange={e => updateTableRow(sec.id, ri, 'colB', e.target.value)}
                          placeholder="Column B"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#C9A25F]/50"
                        />
                        <button onClick={() => removeTableRow(sec.id, ri)} className="text-slate-500 hover:text-rose-400 text-xs px-1">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => addTableRow(sec.id)}
                  className="text-[#C9A25F] text-xs hover:text-[#E5C882] flex items-center gap-1"
                >
                  <i className="fa-solid fa-plus"></i> Add table row
                </button>
              </div>
            ))}
            <button
              onClick={addSection}
              className="w-full py-3 rounded-2xl border border-dashed border-white/20 text-slate-400 text-sm hover:border-[#C9A25F]/50 hover:text-[#C9A25F] transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Add Section
            </button>
          </div>
        </div>
      ) : null}

      {/* ── RENDERED DOCUMENT ── */}
      <div
        ref={printRef}
        className={`${preview ? '' : 'mt-8'} rounded-2xl overflow-hidden`}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        <DocumentPreview
          docName={docName}
          subtitle={subtitle}
          tagline={tagline}
          territory={territory}
          year={year}
          classification={classification}
          sections={sections}
        />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #doc-preview, #doc-preview * { visibility: visible; }
          #doc-preview { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}

function DocumentPreview({
  docName, subtitle, tagline, territory, year, classification, sections
}: {
  docName: string; subtitle: string; tagline: string; territory: string; year: string
  classification: string; sections: Section[]
}) {
  return (
    <div
      id="doc-preview"
      style={{
        background: '#fff',
        color: '#333',
        maxWidth: '800px',
        margin: '0 auto',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Cover Header */}
      <div style={{ background: '#0E1A2B', padding: '40px 48px 32px', color: '#fff' }}>
        {/* Top accent bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg,#C9A25F,#E5C882,#C9A25F)', marginBottom: '32px', borderRadius: '2px' }} />

        <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#C9A25F', marginBottom: '12px' }}>
          Latimore Life &amp; Legacy LLC
        </div>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px', color: '#fff' }}>
          {docName || '[Document Name]'}
        </h1>
        {subtitle && (
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 'normal', color: '#C9A25F', margin: '0 0 16px' }}>
            {subtitle}
          </h2>
        )}
        {tagline && (
          <p style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '1px', margin: '0 0 24px' }}>{tagline}</p>
        )}
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0' }}>
          {territory} · {year}
        </p>

        {/* Bottom accent */}
        <div style={{ height: '1px', background: 'rgba(201,162,95,0.3)', margin: '28px 0 24px' }} />

        {/* Prepared by block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '11px', color: '#94a3b8' }}>
          <div>
            <div style={{ color: '#C9A25F', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Prepared By</div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>Jackson M. Latimore Sr., MBA</div>
            <div>Founder &amp; CEO</div>
            <div style={{ marginTop: '8px' }}>In Affiliation with Global Financial Impact</div>
          </div>
          <div>
            <div style={{ color: '#C9A25F', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact</div>
            <div>(717) 615-2613</div>
            <div>jackson1989@latimorelegacy.com</div>
            <div>latimorelifelegacy.com</div>
            <div style={{ marginTop: '8px' }}>
              <span style={{ color: '#64748b' }}>PA DOI #1268820 · NIPR #21638507</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '10px 16px', border: '1px solid rgba(201,162,95,0.3)', borderRadius: '6px', display: 'inline-block' }}>
          <span style={{ fontSize: '10px', color: '#C9A25F', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {classification || 'Confidential — Internal Use Only'}
          </span>
        </div>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
          "Protecting Today. Securing Tomorrow." · #TheBeatGoesOn
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: '40px 48px' }}>
        {sections.map((sec, idx) => (
          <div key={sec.id} style={{ marginBottom: '40px' }}>
            {/* Section divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '28px', background: '#C9A25F', borderRadius: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>
                  PART I · SECTION {idx + 1}
                </div>
                {sec.heading && (
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 'bold', color: '#0E1A2B', margin: 0 }}>
                    {sec.heading}
                  </h2>
                )}
              </div>
            </div>

            {sec.subheading && (
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0E1A2B', margin: '0 0 10px' }}>
                {sec.subheading}
              </h3>
            )}

            {sec.body && (
              <p style={{ fontSize: '11px', lineHeight: '1.8', color: '#333', margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>
                {sec.body}
              </p>
            )}

            {sec.pullQuote && (
              <blockquote style={{
                margin: '20px 0',
                padding: '16px 20px',
                borderLeft: '3px solid #C9A25F',
                background: '#fafafa',
                borderRadius: '0 6px 6px 0',
                fontFamily: 'Georgia, serif',
                fontSize: '13px',
                fontStyle: 'italic',
                color: '#0E1A2B',
              }}>
                {sec.pullQuote}
              </blockquote>
            )}

            {sec.tableRows.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '12px' }}>
                <thead>
                  <tr style={{ background: '#0E1A2B', color: '#fff' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 'bold', letterSpacing: '0.5px' }}>Column A</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 'bold', letterSpacing: '0.5px' }}>Column B</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.tableRows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '9px 14px', color: '#333' }}>{row.colA}</td>
                      <td style={{ padding: '9px 14px', color: '#333' }}>{row.colB}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}

        {/* Footer */}
        <div style={{ borderTop: '2px solid #0E1A2B', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Latimore Life &amp; Legacy LLC · {classification}
          </div>
          <div style={{ fontSize: '10px', color: '#C9A25F', fontWeight: 'bold', letterSpacing: '1px' }}>
            "Protecting Today. Securing Tomorrow."
          </div>
        </div>
      </div>
    </div>
  )
}
