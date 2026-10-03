'use client'

import { useState } from 'react'

export default function CampaignVideo() {
  const [showCampaignVideo, setShowCampaignVideo] = useState(false)

  return showCampaignVideo ? (
    <video
      src="/pahs-campaign-video.mp4"
      controls
      autoPlay
      playsInline
      preload="metadata"
      style={{ width: '100%', borderRadius: '8px' }}
    />
  ) : (
    <button type="button" className="pahs-video-play" onClick={() => setShowCampaignVideo(true)}>
      Play Campaign Video
    </button>
  )
}
