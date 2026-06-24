interface Props {
  totalContacts: number
  notionConfigured: boolean
}

export default function NotionSyncPanel({ totalContacts, notionConfigured }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a1a]">
          <i className="fa-solid fa-n text-white text-sm" />
        </div>
        <div>
          <h2 className="text-white font-medium">Notion Sync</h2>
          <p className="text-xs text-[#A9B1BE]">CRM contacts sync to Notion automatically</p>
        </div>
        <div className="ml-auto">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              notionConfigured
                ? 'bg-green-500/10 text-green-400'
                : 'bg-yellow-500/10 text-yellow-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${notionConfigured ? 'bg-green-400' : 'bg-yellow-400'}`}
            />
            {notionConfigured ? 'Connected' : 'Not configured'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-[#A9B1BE] mb-1">Total contacts</p>
          <p className="text-2xl font-semibold text-white">{totalContacts.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-[#A9B1BE] mb-1">Sync schedule</p>
          <p className="text-sm text-white">Every 5 minutes</p>
        </div>
      </div>

      {!notionConfigured && (
        <p className="mb-4 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
          Set <code className="font-mono">INTERNAL_API_SECRET</code> in this app and push it to
          the Notion Worker (<code className="font-mono">ntn workers env set</code>) to enable sync.
        </p>
      )}

      <p className="rounded-lg bg-white/5 px-3 py-2 text-xs text-[#A9B1BE]">
        Contacts sync to Notion via a managed Notion Worker — a delta sync runs every 5 minutes
        and a full backfill can be triggered with <code className="font-mono">ntn workers sync trigger contactsBackfill</code>.
        There is no manual sync button here; monitor status with{' '}
        <code className="font-mono">ntn workers sync status</code>.
      </p>
    </div>
  )
}
