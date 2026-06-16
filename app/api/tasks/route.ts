export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'
import { logger } from '@/lib/logger'

type JsonRecord = Record<string, unknown>

type CrmTaskRow = {
  id: string
  lead_id: string | null
  title: string
  description: string | null
  task_type: string | null
  priority: string | null
  status: string | null
  due_at: string | null
  automation_key: string | null
  payload: JsonRecord | null
  completed_at: string | null
  created_at: string | null
}

type TaskPatch = {
  status?: string
  title?: string
  description?: string | null
  due_at?: string | null
  completed_at?: string | null
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as JsonRecord
}

function readString(source: JsonRecord | null, key: string): string | null {
  const value = source?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function readNestedString(source: JsonRecord | null, objectKey: string, key: string): string | null {
  const nested = asRecord(source?.[objectKey])
  return readString(nested, key)
}

function toDisplayStatus(status: string | null): 'Open' | 'Completed' {
  return status?.toLowerCase() === 'completed' ? 'Completed' : 'Open'
}

function toDbStatus(status: string): 'open' | 'completed' {
  return status.toLowerCase() === 'completed' ? 'completed' : 'open'
}

function toTaskItem(row: CrmTaskRow) {
  const payload = asRecord(row.payload)
  const email = readString(payload, 'email') || readNestedString(payload, 'lead', 'email')
  const phone = readString(payload, 'phone') || readNestedString(payload, 'lead', 'phone')
  const suggestedText = readString(payload, 'suggested_text') || readString(payload, 'suggestedText')

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: toDisplayStatus(row.status),
    dueAt: row.due_at,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    priority: row.priority || 'normal',
    taskType: row.task_type || 'follow_up',
    automationKey: row.automation_key,
    leadId: row.lead_id,
    suggestedText,
    contact: {
      email,
      phone,
    },
  }
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req, 'default')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('crm_tasks')
      .select('id,lead_id,title,description,task_type,priority,status,due_at,automation_key,payload,completed_at,created_at')
      .order('status', { ascending: true })
      .order('due_at', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const items = ((data || []) as CrmTaskRow[]).map(toTaskItem)
    return NextResponse.json({ ok: true, items })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Supabase task list error')
    return NextResponse.json({ ok: false, error: 'failed to load tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req, 'default')
  if (authError) return authError

  try {
    const body = await req.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''

    if (!title) {
      return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('crm_tasks')
      .insert({
        title,
        description: description || null,
        task_type: 'manual',
        priority: 'normal',
        status: 'open',
        due_at: body.dueAt ? new Date(body.dueAt).toISOString() : new Date().toISOString(),
        assigned_to: 'Jackson Latimore',
        payload: { source: 'admin_manual' },
      })
      .select('id,lead_id,title,description,task_type,priority,status,due_at,automation_key,payload,completed_at,created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, task: toTaskItem(data as CrmTaskRow) }, { status: 201 })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Supabase task create error')
    return NextResponse.json({ ok: false, error: 'failed to create task' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req, 'default')
  if (authError) return authError

  try {
    const body = await req.json()
    const id = typeof body.id === 'string' ? body.id : ''

    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }

    const updates: TaskPatch = {}

    if (typeof body.status === 'string') {
      const status = toDbStatus(body.status)
      updates.status = status
      updates.completed_at = status === 'completed' ? new Date().toISOString() : null
    }

    if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
    if (typeof body.description === 'string') updates.description = body.description.trim() || null
    if (body.dueAt !== undefined) updates.due_at = body.dueAt ? new Date(body.dueAt).toISOString() : null

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('crm_tasks')
      .update(updates)
      .eq('id', id)
      .select('id,lead_id,title,description,task_type,priority,status,due_at,automation_key,payload,completed_at,created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, task: toTaskItem(data as CrmTaskRow) })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Supabase task update error')
    return NextResponse.json({ ok: false, error: 'failed to update task' }, { status: 500 })
  }
}
