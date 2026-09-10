// Real file upload for the Content Repository: article cover images and
// imported PDF/Word documents go to Vercel Blob (BLOB_READ_WRITE_TOKEN).
// If the token isn't configured, callers get a clear error instead of a
// silent fake URL — see app/api/marketing/repository/upload/route.ts.

import { put } from '@vercel/blob'
import { logger } from '@/lib/logger'

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024 // 25 MB, matches the design's dropzone copy

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export async function uploadContentFile(file: File, folder: 'repository' | 'covers'): Promise<{ url: string }> {
  if (!isBlobConfigured()) {
    throw new Error('File storage is not configured (missing BLOB_READ_WRITE_TOKEN).')
  }

  try {
    const blob = await put(`content-${folder}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return { url: blob.url }
  } catch (err) {
    logger.error({ err, fileName: file.name }, '[blob] upload failed')
    throw err instanceof Error ? err : new Error('Upload failed')
  }
}
