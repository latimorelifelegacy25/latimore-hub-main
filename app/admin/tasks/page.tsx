'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckSquare, Clock, Plus, X, Check, AlertTriangle } from 'lucide-react'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  dueAt: string | null
  createdAt: string
  contact?: { firstName: string | null; lastName: string | null; email: string | null } | null
}

type Filter = 'Open' | 'Overdue' | 'Completed' | 'All'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('Open')
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', dueAt: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const now = new Date()

  const filtered = tasks.filter(t => {
    if (filter === 'All') return true
    if (filter === 'Completed') return t.status === 'Completed'
    const isOverdue = t.dueAt && new Date(t.dueAt) < now && t.status !== 'Completed'
    if (filter === 'Overdue') return !!isOverdue
    return t.status === 'Open' && !isOverdue
  })

  const counts = {
    Open: tasks.filter(t => t.status === 'Open' && !(t.dueAt && new Date(t.dueAt) < now)).length,
    Overdue: tasks.filter(t => t.status === 'Open' && t.dueAt && new Date(t.dueAt) < now).length,
    Completed: tasks.filter(t => t.status === 'Completed').length,
    All: tasks.length,
  }

  const markComplete = async (id: string) => {
    setCompleting(id)
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Completed' }),
      })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t))
      }
    } finally {
      setCompleting(null)
    }
  }

  const createTask = async () => {
    if (!newTask.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          dueAt: newTask.dueAt || null,
        }),
      })
      if (res.ok) {
        const { task } = await res.json()
        setTasks(prev => [task, ...prev])
        setNewTask({ title: '', description: '', dueAt: '' })
        setShowModal(false)
        setFilter('Open')
      }
    } finally {
      setSaving(false)
    }
  }

  const FILTERS: Filter[] = ['Open', 'Overdue', 'Completed', 'All']

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#C9A25F] mb-1">Task Manager</p>
          <h1 className="text-2xl font-bold text-[#F7F7F5]">Follow-Up Tasks</h1>
          <p className="text-[#A9B1BE] text-sm mt-1">{counts.Open} open · {counts.Overdue} overdue · {counts.Completed} completed</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-[#C9A25F] hover:bg-[#D4AF77] px-5 py-2.5 text-sm font-black uppercase tracking-widest text-slate-950 transition"
        >
          <Plus size={16} />New Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-widest transition ${filter === f ? 'bg-[#C9A25F] text-slate-950' : 'bg-white/5 text-[#A9B1BE] hover:bg-white/10'}`}
          >
            {f} {counts[f] > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-[#A9B1BE]">
          <Clock className="w-5 h-5 animate-spin opacity-50" />
          Loading tasks...
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#F7F7F5]/8 rounded-xl p-12 text-center text-[#A9B1BE]">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">
            {filter === 'Open' ? 'All clear — no open tasks.' :
             filter === 'Overdue' ? 'No overdue tasks.' :
             filter === 'Completed' ? 'No completed tasks yet.' :
             'No tasks found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const overdue = t.dueAt && new Date(t.dueAt) < now && t.status !== 'Completed'
            const done = t.status === 'Completed'
            return (
              <div
                key={t.id}
                className={`bg-[#1a2535] border rounded-xl p-4 flex items-start justify-between gap-4 transition ${
                  done ? 'border-white/5 opacity-60' :
                  overdue ? 'border-red-500/30' :
                  'border-[#F7F7F5]/8'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${done ? 'border-green-500 bg-green-500/20' : overdue ? 'border-red-400' : 'border-white/20'}`}>
                    {done && <Check size={11} className="text-green-400" />}
                    {overdue && !done && <AlertTriangle size={11} className="text-red-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-sm leading-snug ${done ? 'line-through text-[#A9B1BE]' : 'text-[#F7F7F5]'}`}>{t.title}</p>
                    {t.description && <p className="text-xs text-[#A9B1BE] mt-0.5 truncate">{t.description}</p>}
                    {t.contact && (
                      <p className="text-xs text-[#7A8499] mt-0.5">
                        {[t.contact.firstName, t.contact.lastName].filter(Boolean).join(' ') || t.contact.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`flex items-center gap-1.5 text-xs ${overdue && !done ? 'text-red-400' : 'text-[#A9B1BE]'}`}>
                    <Clock size={12} />
                    {t.dueAt ? new Date(t.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                    {overdue && !done && <span className="font-bold">OVERDUE</span>}
                  </div>
                  {!done && (
                    <button
                      onClick={() => markComplete(t.id)}
                      disabled={completing === t.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-400 transition disabled:opacity-50"
                    >
                      <Check size={11} />
                      {completing === t.id ? '...' : 'Done'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0E1420] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white text-lg">New Task</h3>
              <button onClick={() => setShowModal(false)} className="text-[#A9B1BE] hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#A9B1BE] mb-1.5">Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && createTask()}
                  placeholder="Follow up with client..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A25F]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#A9B1BE] mb-1.5">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A25F] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#A9B1BE] mb-1.5">Due Date</label>
                <input
                  type="datetime-local"
                  value={newTask.dueAt}
                  onChange={e => setNewTask(p => ({ ...p, dueAt: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C9A25F] [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createTask}
                disabled={!newTask.title.trim() || saving}
                className="flex-1 rounded-xl bg-[#C9A25F] hover:bg-[#D4AF77] py-3 text-sm font-black uppercase tracking-widest text-slate-950 transition disabled:opacity-40"
              >
                {saving ? 'Creating...' : 'Create Task'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-black uppercase tracking-widest text-[#A9B1BE] hover:border-white/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
