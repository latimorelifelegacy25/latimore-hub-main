'use client'

import { useEffect, useState } from 'react'

export type JoinReceipt = { applicationId: string; bookingToken: string }
type Day = { date: string; slots: string[] }
const timezone = 'America/New_York'
const dateLabel = (value: string) => new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))

export default function JoinBooking({ receipt }: { receipt: JoinReceipt }) {
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)
  const [slot, setSlot] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<{ requested?: boolean; scheduledFor?: string; meetingUrl?: string } | null>(null)

  async function loadTimes() {
    setLoading(true)
    try {
      const response = await fetch('/api/availability', { cache: 'no-store', signal: AbortSignal.timeout(15000) })
      const data = await response.json()
      setDays(response.ok && data.ok ? data.days : [])
    } catch { setDays([]) } finally { setLoading(false) }
  }
  useEffect(() => { void loadTimes() }, [])

  async function submit(requestOnly = false) {
    setError(''); setSubmitting(true)
    try {
      const response = await fetch('/api/join/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: receipt.applicationId, token: receipt.bookingToken, ...(requestOnly ? { preferredTime } : { slotStart: slot }) }) })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error || 'Please try again.')
      setConfirmed(data)
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.') } finally { setSubmitting(false) }
  }

  if (confirmed) return <div role="status" className="mt-6 rounded-xl border border-[#C49A6C] bg-[#faf7f3] p-6 text-[#2C3E50]">
    <h3 className="text-xl font-bold">{confirmed.requested ? 'Your call request is saved.' : 'Your recruiting conversation is booked.'}</h3>
    <p className="mt-2">{confirmed.requested ? 'Jackson will contact you to confirm a time. This request is not yet a confirmed appointment.' : `${dateLabel(confirmed.scheduledFor!)} Eastern · 30 minutes`}</p>
    {confirmed.meetingUrl && <a href={confirmed.meetingUrl} className="mt-3 inline-block underline">Meeting details</a>}
    {!confirmed.requested && !confirmed.meetingUrl && <p className="mt-2">Jackson will call the phone number on your application.</p>}
  </div>

  return <div className="mt-8 rounded-2xl border border-slate-200 p-5 text-left text-[#2C3E50]">
    <h3 className="text-2xl font-bold">Schedule your recruiting conversation</h3>
    <p className="mt-2 text-slate-600">30 minutes with Jackson to discuss your goals, licensing, training, and joining the team. Times are shown in Eastern Time.</p>
    {loading ? <p role="status" className="mt-4">Loading available times…</p> : days.some((day) => day.slots.length) ? <>
      <label className="mt-5 block font-semibold">Available times
        <select value={slot} onChange={(event) => setSlot(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3">
          <option value="">Choose a time</option>
          {days.flatMap((day) => day.slots.map((time) => <option key={time} value={time}>{dateLabel(time)} Eastern</option>))}
        </select>
      </label>
      <button type="button" disabled={!slot || submitting} onClick={() => void submit()} className="mt-4 rounded-full bg-[#C49A6C] px-6 py-3 font-bold disabled:opacity-50">{submitting ? 'Saving…' : 'Confirm Recruiting Call'}</button>
    </> : <p className="mt-4 text-slate-600">Live times are unavailable right now. Send your preferred availability below and Jackson will confirm with you.</p>}
    <button type="button" onClick={() => void loadTimes()} disabled={loading || submitting} className="ml-3 mt-4 text-sm underline">Refresh times</button>
    <div className="mt-6 border-t border-slate-200 pt-5">
      <label className="block font-semibold">Prefer to request a time?
        <input value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} maxLength={500} placeholder="Example: Tuesday or Thursday after 4 p.m. Eastern" className="mt-2 w-full rounded-lg border border-slate-300 p-3" />
      </label>
      <button type="button" disabled={preferredTime.trim().length < 3 || submitting} onClick={() => void submit(true)} className="mt-4 rounded-full border border-[#2C3E50] px-6 py-3 font-bold disabled:opacity-50">Request Intro Call</button>
    </div>
    {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
  </div>
}
