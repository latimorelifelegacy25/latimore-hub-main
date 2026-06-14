'use client'

import { useEffect, useState } from 'react'

type SocialPublishJob = {
  id: string
  platform: string
  status: string
  scheduledFor: string | null
}

export function SocialPublisherPanel() {
  const [jobs, setJobs] = useState<SocialPublishJob[]>([])
  const [loading, setLoading] = useState(true)

  async function loadJobs() {
    const res = await fetch('/api/admin/marketing/publisher')
    const data = await res.json()
    setJobs(data)
    setLoading(false)
  }

  useEffect(() => {
    loadJobs()
  }, [])

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-xl font-semibold text-white">Social Publisher</h1>
      <p className="mt-2 text-sm text-[#A9B1BE]">
        Publish content to Facebook, Instagram, and LinkedIn.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <FacebookPublisher />
        <InstagramPublisher />
        <LinkedInPublisher />
      </div>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-[#A9B1BE]">Loading…</p>}

        {!loading && jobs.length === 0 && (
          <p className="text-[#A9B1BE]">No jobs yet.</p>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-sm font-semibold text-white">
              {job.platform.toUpperCase()}
            </p>
            <p className="mt-1 text-xs text-[#A9B1BE]">
              Status: {job.status}
            </p>
            <p className="mt-1 text-xs text-[#A9B1BE]">
              Scheduled: {job.scheduledFor ?? '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FacebookPublisher() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-sm font-semibold text-white">Facebook</h2>
      <p className="mt-1 text-xs text-[#A9B1BE]">
        Facebook publishing integration placeholder.
      </p>
    </div>
  )
}

export function InstagramPublisher() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-sm font-semibold text-white">Instagram</h2>
      <p className="mt-1 text-xs text-[#A9B1BE]">
        Instagram publishing integration placeholder.
      </p>
    </div>
  )
}

export function LinkedInPublisher() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-sm font-semibold text-white">LinkedIn</h2>
      <p className="mt-1 text-xs text-[#A9B1BE]">
        LinkedIn publishing integration placeholder.
      </p>
    </div>
  )
}
