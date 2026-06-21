'use client'

import { useRef, useState } from 'react'

type ComplianceViolation = {
  rule: string
  severity: 'critical' | 'major' | 'minor'
  description: string
  excerpt: string
}

type ComplianceResult = {
  passed: boolean
  violations: ComplianceViolation[]
  warnings: string[]
}

type GeneratedAsset = {
  id: string
  title: string
  bodyText: string | null
  metadata: {
    slug?: string
    description?: string
    sourceFileName?: string
  } | null
}

export default function PdfBlogUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [asset, setAsset] = useState<GeneratedAsset | null>(null)
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (selected.type !== 'application/pdf') {
      setError('Please select a valid PDF file.')
      setFile(null)
      return
    }
    setError(null)
    setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF first.')
      return
    }

    setIsLoading(true)
    setError(null)
    setAsset(null)
    setCompliance(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/content/generate-from-pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blog post.')
      }

      setAsset(data.asset)
      setCompliance(data.compliance)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
      <h3 className="text-lg font-black text-white mb-2">Generate Blog from PDF</h3>
      <p className="text-sm text-slate-400 mb-6">
        Upload a source PDF and the AI will draft a blog post saved to your content drafts.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Upload PDF</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full mt-2 text-sm text-slate-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-[#C9A25F]/10 file:text-[#C9A25F]
              hover:file:bg-[#C9A25F]/20"
          />
        </div>

        {error && (
          <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="w-full sm:w-auto bg-[#C9A25F] hover:bg-[#D4AF77] disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black px-4 py-3 rounded-xl transition"
        >
          {isLoading ? 'Reading PDF & Writing Blog...' : 'Generate Blog Post'}
        </button>

        {asset && (
          <div className="mt-6 border-t border-white/10 pt-6 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Title</p>
              <p className="text-white font-semibold mt-1">{asset.title}</p>
            </div>

            {asset.metadata?.description && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Description</p>
                <p className="text-slate-300 text-sm mt-1">{asset.metadata.description}</p>
              </div>
            )}

            {compliance && !compliance.passed && (
              <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1">
                <p className="font-semibold">Compliance flagged {compliance.violations.length} item(s) for review:</p>
                <ul className="list-disc list-inside space-y-1">
                  {compliance.violations.map((v, i) => (
                    <li key={i}>
                      <span className="font-semibold">{v.severity}:</span> {v.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Generated MDX Draft</p>
              <div className="bg-slate-900 border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-slate-200 whitespace-pre-wrap">{asset.bodyText}</pre>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Saved as a draft content asset. View and edit it under{' '}
              <a href="/admin/content" className="text-[#C9A25F] hover:underline">
                Content
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
