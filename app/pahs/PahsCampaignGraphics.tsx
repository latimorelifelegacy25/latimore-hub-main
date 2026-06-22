'use client'

const throwbackImageUrl = '/pahs-2005-allarea.png'

type GraphicProps = {
  className?: string
  compact?: boolean
}

export function PahsThrowbackGraphic({ className }: GraphicProps) {
  return (
    <div className={className} style={{ background: '#efe0c8', color: '#17110b', overflow: 'hidden' }}>
      <div style={{ padding: 'clamp(1rem, 3vw, 1.55rem) clamp(1rem, 3vw, 1.8rem) .6rem', textAlign: 'center' as const, fontFamily: "'Oswald', system-ui, sans-serif" }}>
        <div style={{ color: '#7b1d2d', fontSize: 'clamp(1.5rem, 5.5vw, 3rem)', fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase' as const }}>Throwback Tide Thursday</div>
        <div style={{ marginTop: 6, color: '#222', fontSize: 'clamp(1.1rem, 3.6vw, 2rem)', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' as const }}>2005 Coal Region All-Area Football</div>
        <div style={{ marginTop: 4, color: '#111', fontSize: 'clamp(2rem, 7vw, 4rem)', lineHeight: .92, fontWeight: 900, textTransform: 'uppercase' as const }}>Where The Journey Began</div>
      </div>
      <img src={throwbackImageUrl} alt="2005 Coal Region All-Area Football — Where the Journey Began" style={{ display: 'block', width: '100%', height: 'auto' }} />
      <div style={{ padding: '.65rem 1rem 1rem', fontFamily: 'Georgia, serif', fontSize: 'clamp(.85rem, 2.4vw, 1.05rem)', fontWeight: 700, lineHeight: 1.25 }}>
        Pictured from left: Coach Kevin Keating, Dave DeMarkis, Jackson Latimore, and Andy Buziak. Latimore was named Co-Defensive Player of the Year.
      </div>
    </div>
  )
}
