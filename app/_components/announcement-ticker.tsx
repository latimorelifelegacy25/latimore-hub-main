'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const announcement =
  'PROUD PAHS ALL-STAR SPONSOR • FREE FAMILY PROTECTION REVIEWS • CALL 570-900-1977 • PROTECTING TODAY. SECURING TOMORROW. • #THEBEATGOESON'

export default function AnnouncementTicker() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  return (
    <aside className="announcement-ticker" aria-label="Latimore Life & Legacy announcements">
      <div className="announcement-ticker__track">
        <Link className="announcement-ticker__message" href="/pahs#review">
          {announcement}
        </Link>
        <Link className="announcement-ticker__message" href="/pahs#review" aria-hidden="true" tabIndex={-1}>
          {announcement}
        </Link>
      </div>
    </aside>
  )
}
