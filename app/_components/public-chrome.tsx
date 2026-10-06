'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export default function PublicChrome({ children }: { children: ReactNode }) {
  return usePathname() === '/' ? null : <>{children}</>
}
