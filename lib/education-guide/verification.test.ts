import test from 'node:test'
import assert from 'node:assert/strict'
import { PDFDocument } from 'pdf-lib'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/education-guide/route'
import { GUIDE_PRIORITIES, buildGuide, guideToPlainText } from './content'
import { generateGuidePdf } from './pdf'
import { checkCompliance } from '@/lib/ai/compliance'

test('all 127 priority combinations produce readable PDFs without critical findings', async () => {
  for (let mask = 1; mask < 1 << GUIDE_PRIORITIES.length; mask++) {
    const priorities = GUIDE_PRIORITIES.filter((_, index) => mask & (1 << index))
    const guide = buildGuide({ firstName: 'Verification', priorities })
    assert.equal(checkCompliance(guideToPlainText(guide)).violations.filter(v => v.severity === 'critical').length, 0)
    const pdf = await PDFDocument.load(await generateGuidePdf(guide))
    assert.ok(pdf.getPageCount() > 0)
    assert.ok(pdf.getPages().every(p => p.getWidth() === 612 && p.getHeight() === 792))
  }
})

test('guide route stays off by default, ignores bots, attaches PDF, and fails on provider rejection', async () => {
  const keys = ['EDUCATION_GUIDE_ENABLED', 'THANKYOU_FROM', 'RESEND_FROM_EMAIL', 'OUTBOUND_FROM_EMAIL', 'RESEND_API_KEY'] as const
  const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]))
  const originalFetch = globalThis.fetch
  let calls = 0
  const request = (extra = {}) => new NextRequest('https://example.com/api/education-guide', { method: 'POST', body: JSON.stringify({ email: 'owner@example.com', priorities: ['family'], ...extra }) })
  try {
    delete process.env.EDUCATION_GUIDE_ENABLED
    assert.equal((await POST(request())).status, 404)
    process.env.EDUCATION_GUIDE_ENABLED = 'true'
    process.env.RESEND_API_KEY = 're_test_only'
    delete process.env.THANKYOU_FROM
    delete process.env.OUTBOUND_FROM_EMAIL
    process.env.RESEND_FROM_EMAIL = 'verified@example.com'
    globalThis.fetch = async (_url, options) => {
      calls++
      const payload = JSON.parse(String(options?.body))
      assert.equal(payload.from, 'verified@example.com')
      const pdf = Buffer.from(payload.attachments[0].content, 'base64')
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
      return Response.json({ id: 'accepted-guide' })
    }
    assert.equal((await POST(request({ website: 'bot' }))).status, 200)
    assert.equal(calls, 0)
    assert.equal((await POST(request({ email: 'bad' }))).status, 422)
    assert.equal((await POST(request())).status, 200)
    assert.equal(calls, 1)
    globalThis.fetch = async () => Response.json({ name: 'validation_error', message: 'Rejected' }, { status: 422 })
    assert.equal((await POST(request())).status, 500)
  } finally {
    globalThis.fetch = originalFetch
    for (const key of keys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key]
  }
})
