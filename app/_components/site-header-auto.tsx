'use client'

import { usePathname } from 'next/navigation'
import { SiteHeader } from './site-shell'

/** SiteHeader that highlights the current page itself, for use in route layouts. */
export function SiteHeaderAuto() {
  return <SiteHeader currentPath={usePathname() ?? ''} />
}
