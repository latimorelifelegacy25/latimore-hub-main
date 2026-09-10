export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { requireAdminSession } from '@/lib/ai/shared'
import { isBlobConfigured, uploadContentFile, MAX_UPLOAD_BYTES } from '@/lib/marketing/blob'

// Real file upload for the Import drawer (PDF/Word docs) and article cover
// images. Replaces the prototype's two hardcoded fake-file buttons.
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'fillout')
  if (limited) return limited

  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: 'File storage is not configured. Set BLOB_READ_WRITE_TOKEN in Vercel project settings.' },
      { status: 503 },
    )
  }

  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 415 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') === 'covers' ? 'covers' : 'repository'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 422 })
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit` }, { status: 413 })
    }

    const { url } = await uploadContentFile(file, folder)

    return NextResponse.json({ url, fileName: file.name, fileSizeBytes: file.size }, { status: 201 })
  } catch (err) {
    logger.error({ err }, '[marketing/repository/upload] failed')
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500 })
  }
}
