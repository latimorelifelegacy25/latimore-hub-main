'use client'

import { useEffect } from 'react'

export default function V2ScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.v2-fu')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('v2-vis'), i * 80)
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return null
}
