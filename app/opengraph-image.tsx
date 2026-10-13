import { ImageResponse } from 'next/og'

export const alt = 'Latimore Life & Legacy — Protecting Today. Securing Tomorrow.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '68px 76px', background: 'linear-gradient(135deg, #0E1A2B 0%, #1A2942 100%)', color: '#FFFFFF' }}>
      <div style={{ display: 'flex', fontSize: 28, fontWeight: 800, letterSpacing: 3, color: '#E5C882' }}>LATIMORE LIFE &amp; LEGACY</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.05 }}>Protecting Today.</div>
        <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.05, color: '#E5C882' }}>Securing Tomorrow.</div>
      </div>
      <div style={{ display: 'flex', fontSize: 26, opacity: 0.9 }}>Independent insurance guidance · Pennsylvania's Coal Region</div>
    </div>,
    size
  )
}
