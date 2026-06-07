type MessageCardProps = {
  message: {
    id?: string
    fromName?: string | null
    fromEmail?: string | null
    body?: string | null
    createdAt?: string | Date | null
  }
}

function fmtDate(value?: string | Date | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function MessageCard({ message }: MessageCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="font-semibold text-white">{message.fromName ?? 'Unknown Sender'}</p>
      {message.fromEmail ? <p className="text-sm text-[#A9B1BE]">{message.fromEmail}</p> : null}
      <p className="mt-2 whitespace-pre-wrap text-sm text-[#A9B1BE]">{message.body ?? '(No message body)'}</p>
      <p className="mt-2 text-xs text-[#A9B1BE]">{fmtDate(message.createdAt)}</p>
    </div>
  )
}
