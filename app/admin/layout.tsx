import Link from 'next/link'
import { ArrowLeft, BarChart3, Bot, CalendarDays, CheckSquare, FileText, LayoutDashboard, MessageSquareText, KanbanSquare, Users, Smartphone } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/contacts', label: 'Contacts', icon: Users },
  { href: '/admin/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquareText },
  { href: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/ai-advisor', label: 'AI Advisor', icon: Bot },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/admin/card-analytics', label: 'Card Analytics', icon: Smartphone },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0B0F17] text-[#F7F7F5]">
      <aside className="hidden w-64 shrink-0 border-r border-white/6 bg-[#0E1420] xl:flex xl:flex-col">
        <div className="border-b border-white/6 px-5 py-5">
          <p className="text-xs font-black tracking-[0.35em] text-[#C9A25F]">LATIMORE</p>
          <p className="mt-1 text-xs text-[#A9B1BE]">Hub OS Admin</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#A9B1BE] transition hover:bg-white/5 hover:text-white">
                <Icon size={16} className="text-[#C9A25F]" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-white/6 p-3">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#A9B1BE] transition hover:bg-white/5 hover:text-white">
            <ArrowLeft size={16} />
            <span>Back to Site</span>
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,162,95,0.08),transparent_28%),linear-gradient(to_bottom,#0B0F17,#101826)]">
          {children}
        </div>
      </main>
    </div>
  )
}
