'use client'

import { BRAND } from '@/lib/brand'
import { buildFilloutParams } from '@/lib/lead'

type Props = React.PropsWithChildren<{
  style?: React.CSSProperties
  className?: string
  intent?: string
}>

export default function EthosQuoteLink({
  children,
  style,
  className,
  intent = 'quick_term',
}: Props) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Enhanced tracking via server-side redirect when JS is available
    e.preventDefault()
    try {
      const qs = buildFilloutParams({ intent })
      const url = `/api/redirect/ethos?${qs}&intent=${encodeURIComponent(intent)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // If tracking fails, still open the direct Ethos link
      window.open(BRAND.ethosUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Primary href is the direct Ethos URL — works even if /api/redirect/ethos is unavailable
  // onClick enhances with tracking when JS loads successfully
  return (
    <a
      href={BRAND.ethosQuoteUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      style={style}
      className={className}
    >
      {children}
    </a>
  )
}
