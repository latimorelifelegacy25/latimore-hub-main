'use client'

import { useState } from 'react'
import ComposerEditor from '@/components/composer/ComposerEditor'
import ComposerSidebar from '@/components/composer/ComposerSidebar'
import type { ComposerContent } from '@/components/composer/types'

const initialContent: ComposerContent = {
  title: '',
  bodyHtml: '',
  campaign: '',
  destination: '',
  utmSource: '',
  type: 'post',
  status: 'draft',
}

export default function ComposerPage() {
  const [content, setContent] = useState<ComposerContent>(initialContent)

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0A0A0A] md:flex-row">
      <ComposerSidebar content={content} setContent={setContent} />
      <ComposerEditor content={content} setContent={setContent} />
    </div>
  )
}
