'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const G = '#C9A25F'
const MUTED = '#8F98A8'

export default function TrendChart({ data }: { data: Record<string, any>[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          stroke={MUTED}
          fontSize={11}
          tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis stroke={MUTED} fontSize={11} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }}
          labelFormatter={v => new Date(v).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        />
        <Line type="monotone" dataKey="lead_count" stroke={G} strokeWidth={2} name="Leads" dot={{ fill: G, r: 3 }} />
        <Line type="monotone" dataKey="contact_count" stroke="#10B981" strokeWidth={2} name="Contacts" dot={{ fill: '#10B981', r: 3 }} />
        <Line type="monotone" dataKey="appointment_booked_count" stroke="#3B82F6" strokeWidth={2} name="Bookings" dot={{ fill: '#3B82F6', r: 3 }} />
        <Line type="monotone" dataKey="cta_click_count" stroke="#8B5CF6" strokeWidth={2} name="CTA Clicks" dot={{ fill: '#8B5CF6', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
