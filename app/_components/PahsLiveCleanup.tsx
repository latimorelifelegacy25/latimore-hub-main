'use client'

import { useEffect } from 'react'

export default function PahsLiveCleanup() {
  useEffect(() => {
    const isPahs =
      window.location.pathname === '/pahs' ||
      window.location.hostname.toLowerCase().includes('pahs')

    if (!isPahs) return

    const removeCampaignVideoBlock = () => {
      const nodes = Array.from(document.querySelectorAll('section, div, article'))

      for (const node of nodes) {
        const text = (node.textContent || '').toLowerCase()

        const isCampaignVideoBlock =
          text.includes('campaign videos') ||
          text.includes('watch the campaign')

        if (isCampaignVideoBlock) {
          node.remove()
          return true
        }
      }

      const videos = Array.from(document.querySelectorAll('video, iframe, embed'))

      for (const media of videos) {
        const parent =
          media.closest('section') ||
          media.closest('article') ||
          media.closest('div')

        parent?.remove()
      }

      return videos.length > 0
    }

    removeCampaignVideoBlock()

    const observer = new MutationObserver(() => {
      removeCampaignVideoBlock()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  return null
}
