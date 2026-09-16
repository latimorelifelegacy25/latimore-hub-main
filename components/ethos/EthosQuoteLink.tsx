'use client'

import { trackLatimoreEvent } from '@/lib/tracking/client-events'

type Props = React.PropsWithChildren<{
  style?: React.CSSProperties
  className?: string
  intent?: string
}>

/**
 * Legacy component name retained so existing pages do not break.
 * Public behavior is now fully Latimore-branded and carrier-neutral.
 */
export default function EthosQuoteLink({
  children,
  style,
  className,
  intent = 'quick_term',
}: Props) {
  function handleClick() {
    void trackLatimoreEvent({
      action: 'tool_cta_clicked',
      tool: 'family_protection_snapshot',
      category: 'Life Protection',
      metadata: { placement: 'legacy_quote_cta', intent },
    })
  }

  return (
    <a
      href="/solutions/family-protection?utm_source=latimore_site&utm_medium=internal_cta&utm_campaign=family_protection&utm_content=legacy_quote_cta"
      onClick={handleClick}
      style={style}
      className={className}
    >
      {children}
    </a>
  )
}
