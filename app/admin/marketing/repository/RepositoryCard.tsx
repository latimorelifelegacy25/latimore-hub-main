import StatPill from '@/app/admin/_components/StatPill'
import type { MarketingContentItem } from '@/app/admin/marketing/_types'

type RepositoryCardProps = {
  item: MarketingContentItem
}

function fmtDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function RepositoryCard({ item }: RepositoryCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{item.title}</h2>
          <p className="mt-1 text-xs text-[#A9B1BE]">
            {item.type} · {item.status} · {item.campaign ?? 'no campaign'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatPill label="Destination" value={item.destination ?? '—'} />
          <StatPill label="UTM" value={item.utmSource ?? '—'} />
        </div>
      </div>
      <div
        className="prose prose-invert max-w-none text-sm text-[#E6EAF0]"
        dangerouslySetInnerHTML={{ __html: item.bodyHtml || '<p>(No body content)</p>' }}
      />
      <p className="mt-3 text-xs text-[#8F98A8]">Updated: {fmtDate(item.updatedAt)}</p>
    </article>
  )
}
