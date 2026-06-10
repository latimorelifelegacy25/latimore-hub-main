import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminSession } from '@/lib/ai/shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BUCKET = process.env.SUPABASE_SOCIAL_UPLOADS_BUCKET || 'social-uploads'
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const ALLOWED_MIME_PREFIXES = ['image/']
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

type ProviderFolder = 'facebook' | 'instagram' | 'linkedin' | 'general'

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase upload configuration is missing')
  }

  return { url, serviceRoleKey }
}

function sanitizeExtension(filename: string, fallback = 'jpg') {
  const ext = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  return ext || fallback
}

function sanitizeProviderFolder(value: unknown): ProviderFolder {
  if (value === 'facebook' || value === 'instagram' || value === 'linkedin') {
    return value
  }

  return 'general'
}

function isAllowedFile(file: File) {
  return ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix)) && ALLOWED_MIME_TYPES.has(file.type)
}

export async function POST(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const provider = sanitizeProviderFolder(formData.get('provider'))

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No file uploaded' }, { status: 400 })
    }

    if (!isAllowedFile(file)) {
      return NextResponse.json(
        { ok: false, error: 'Only JPG, PNG, WEBP, and GIF image uploads are supported right now.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'Upload is too large. Maximum social upload size is 20MB.' },
        { status: 400 },
      )
    }

    const { url, serviceRoleKey } = getSupabaseConfig()
    const supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const extension = sanitizeExtension(file.name)
    const today = new Date().toISOString().slice(0, 10)
    const filePath = `${provider}/${today}/${crypto.randomUUID()}.${extension}`

    const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

    if (!data.publicUrl) {
      return NextResponse.json({ ok: false, error: 'Supabase did not return a public URL' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      bucket: BUCKET,
      path: filePath,
      url: data.publicUrl,
      mimeType: file.type,
      size: file.size,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
