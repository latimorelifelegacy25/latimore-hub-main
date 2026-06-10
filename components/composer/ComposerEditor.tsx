'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { ComposerContent } from './types'

type ComposerEditorProps = {
  content: ComposerContent
  setContent: Dispatch<SetStateAction<ComposerContent>>
}

export default function ComposerEditor({ content, setContent }: ComposerEditorProps) {
  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-8">
      <input
        type="text"
        value={content.title}
        onChange={(event) => setContent((prev) => ({ ...prev, title: event.target.value }))}
        placeholder="Title"
        className="mb-4 w-full bg-transparent text-3xl font-semibold text-white outline-none placeholder:text-[#5F6773]"
      />

      <label htmlFor="composer-body" className="mb-2 block text-xs uppercase tracking-wide text-[#8F98A8]">
        Body HTML
      </label>
      <textarea
        id="composer-body"
        value={content.bodyHtml}
        onChange={(event) => setContent((prev) => ({ ...prev, bodyHtml: event.target.value }))}
        placeholder="Draft your content here. HTML is supported for repository previews."
        className="min-h-[360px] w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white outline-none placeholder:text-[#5F6773] focus:border-blue-400/60"
      />

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Preview</h2>
        {content.bodyHtml ? (
          <div
            className="prose prose-invert max-w-none text-sm text-[#E6EAF0]"
            dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
          />
        ) : (
          <p className="text-sm text-[#8F98A8]">Preview appears here as you write.</p>
        )}
      </section>
    </main>
  )
}
