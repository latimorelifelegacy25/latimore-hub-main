'use client'

import { useAiTasks } from '@/app/admin/_hooks/useAiTasks'

interface ContactActionPanelProps {
  contactId: string
}

export default function ContactActionPanel({ contactId }: ContactActionPanelProps) {
  const { tasks, isLoading, error, generateTasks } = useAiTasks()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-white">AI Task Recommendations</h3>
        <button
          onClick={() => generateTasks(contactId)}
          disabled={isLoading}
          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-purple-300 border-t-transparent rounded-full" />
              Generating...
            </>
          ) : (
            '🤖 Generate Tasks'
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-300 bg-red-500/10 rounded-lg">
          {error}
        </div>
      )}

      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={index} className="p-4 border border-white/10 rounded-lg bg-white/[0.02]">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white">{task.title}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${
                    task.priority === 'high'
                      ? 'bg-red-500/20 text-red-300'
                      : task.priority === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-green-500/20 text-green-300'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
              <p className="text-sm text-slate-300 mb-2">{task.description}</p>
              <div className="text-xs text-slate-400 font-medium">
                Due: {new Date(task.dueAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && (
          <p className="text-sm text-slate-400 italic border-2 border-dashed border-white/10 rounded-lg p-6 text-center">
            Click the button above to analyze this contact and generate smart follow-up tasks.
          </p>
        )
      )}
    </div>
  )
}
