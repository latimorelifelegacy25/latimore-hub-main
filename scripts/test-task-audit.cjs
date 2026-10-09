const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { runInNewContext } = require('node:vm')
const ts = require('typescript')

// Exercise the real route, schemas, and audit writer without production writes.
function load(path, dependencies) {
  const module = { exports: {} }
  const code = ts.transpileModule(readFileSync(resolve(__dirname, '..', path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  runInNewContext(code, {
    exports: module.exports, module, Buffer,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-only' } },
    require: (id) => dependencies[id] ?? require(id),
  })
  return module.exports
}

function setup({ denied = false, databaseError = null, auditError = false } = {}) {
  const events = []
  let databaseCalls = 0
  const row = { id: 'a8a57734-1367-43a2-8097-32bdbb09ea31', title: 'Private task content', status: 'open' }
  const result = { data: row, error: databaseError }
  const query = {}
  for (const method of ['insert', 'update', 'eq', 'select']) query[method] = () => query
  query.single = async () => result
  const auth = { ok: true, email: 'admin@example.com' }
  const common = {
    '@/lib/logger': { logger: { error() {} } },
    '@/lib/rbac': { requireAdminRole: async () => auth },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  }
  const shared = load('lib/ai/shared.ts', {
    ...common,
    '@/lib/prisma': { prisma: { systemEvent: { create: async ({ data }) => {
      if (auditError) throw new Error('Audit store unavailable')
      events.push(data)
    } } } },
    '@/lib/rate-limit': {},
  })
  const route = load('app/api/tasks/route.ts', {
    ...common,
    '@/lib/require-admin': { requireAdmin: async () => denied ? Response.json({ ok: false }, { status: 401 }) : null },
    '@/lib/ai/shared': shared,
    '@/lib/schemas': load('lib/schemas.ts', {}),
    '@supabase/supabase-js': { createClient: () => {
      databaseCalls++
      return { from: (table) => { assert.equal(table, 'crm_tasks'); return query } }
    } },
  })
  return { route, events, row, databaseCalls: () => databaseCalls }
}

const request = (body) => ({ json: async () => body })

test('creation and completion record actor and changed fields, excluding task content', async () => {
  const s = setup()
  assert.equal((await s.route.POST(request({ title: s.row.title }))).status, 201)
  assert.equal((await s.route.PATCH(request({ id: s.row.id, status: 'Completed', description: 'Private description' }))).status, 200)
  assert.deepEqual(JSON.parse(JSON.stringify(s.events.map(e => ({ type: e.type, payload: e.payload })))), [
    { type: 'task.created', payload: { taskId: s.row.id, actor: 'admin@example.com', source: 'admin_manual' } },
    { type: 'task.updated', payload: { taskId: s.row.id, actor: 'admin@example.com', fields: ['status', 'completed_at', 'description'] } },
  ])
  assert.ok(!JSON.stringify(s.events).includes('Private'))
})

test('unauthorized mutations never access the database or create audit events', async () => {
  const s = setup({ denied: true })
  for (const method of ['POST', 'PATCH']) assert.equal((await s.route[method](request({ title: 'test' }))).status, 401)
  assert.equal(s.databaseCalls(), 0)
  assert.equal(s.events.length, 0)
})

test('invalid input and failed database writes create no success audit event', async () => {
  const s = setup({ databaseError: new Error('Write failed') })
  assert.equal((await s.route.POST(request({ title: '' }))).status, 422)
  assert.equal(s.databaseCalls(), 0)
  assert.equal((await s.route.POST(request({ title: 'test' }))).status, 500)
  assert.equal(s.events.length, 0)
})

test('an unavailable audit store does not turn a successful mutation into a failed response', async () => {
  const s = setup({ auditError: true })
  assert.equal((await s.route.POST(request({ title: 'test' }))).status, 201)
  assert.equal((await s.route.PATCH(request({ id: s.row.id, status: 'Completed' }))).status, 200)
})
