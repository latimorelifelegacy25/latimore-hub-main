import { useState } from 'react'

export interface AiTask {
  id?: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  dueAt: string
  status: string
}

export function useAiTasks() {
  const [tasks, setTasks] = useState<AiTask[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const generateTasks = async (contactId?: string, inquiryId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactId, inquiryId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tasks from the server.')
      }

      setTasks(data.tasks || [])
      return data.tasks
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while contacting the AI.'
      console.error('Hook Error:', err)
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    tasks,
    isLoading,
    error,
    generateTasks,
  }
}
