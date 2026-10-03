'use client'

import type { ReactNode } from 'react'

export default function ScrollToReviewButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => document.getElementById('intakeFormSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
    >
      {children}
    </button>
  )
}
