'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PipelineChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F7F7F5" strokeOpacity={0.05} />
        <XAxis dataKey="status" tick={{ fill: '#A9B1BE', fontSize: 11 }} />
        <YAxis tick={{ fill: '#A9B1BE', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#0B0F17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F7F7F5' }} />
        <Bar dataKey="count" fill="#C9A25F" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
