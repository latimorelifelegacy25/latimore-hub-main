export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { CheckSquare, Clock } from 'lucide-react'

export default async function Tasks() {
  const items = await prisma.task.findMany({
    orderBy: { dueAt: 'asc' },
    include: { contact: true },
    where: { status: 'Open' },
  })

  const now = new Date()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F7F7F5]">Tasks</h1>
        <p className="text-[#A9B1BE] text-sm mt-1">{items.length} open follow-up{items.length !== 1 ? 's' : ''}</p>
      </div>

      {items.length === 0 ? (
        <div className="border border-[#F7F7F5]/8 rounded-xl p-12 text-center text-[#A9B1BE]">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>All clear — no open tasks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => {
            const overdue = t.dueAt && t.dueAt < now
            return (
              <div key={t.id} className={`bg-[#1a2535] border rounded-xl p-4 flex items-start justify-between gap-4 ${overdue ? 'border-red-500/30' : 'border-[#F7F7F5]/6'}`}>
                <div>
                  <p className="font-medium text-[#F7F7F5] text-sm">{t.title}</p>
                  {t.contact && (
                    <p className="text-[#A9B1BE] text-xs mt-1">{t.contact.email}</p>
                  )}
                </div>
                <div className={`flex items-center gap-1.5 text-xs shrink-0 ${overdue ? 'text-red-400' : 'text-[#A9B1BE]'}`}>
                  <Clock size={12} />
                  {t.dueAt ? new Date(t.dueAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'No due date'}
                  {overdue && <span className="ml-1 text-red-400 font-bold">OVERDUE</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
