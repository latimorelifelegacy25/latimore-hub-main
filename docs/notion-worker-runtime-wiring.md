# Notion Worker Runtime Wiring

## Status

The Notion Worker architecture is now represented in executable repo files, not only in Notion planning notes.

## Added runtime paths

- `workers/latimore-notion-worker/package.json`
- `workers/latimore-notion-worker/wrangler.toml`
- `workers/latimore-notion-worker/src/index.js`
- `lib/notion-worker.ts`
- `app/api/notion-worker/route.ts`
- `app/api/cron/notion-report/route.ts`

## Runtime roles

### Cloudflare Worker

The Cloudflare Worker receives direct POST actions:

- `create_page`
- `append_page`

The Worker writes operating notes, reports, and task logs to the configured Notion parent page.

### Next.js proxy

`/api/notion-worker` is the authenticated admin proxy from Latimore Hub to the Cloudflare Worker.

### Cron report route

`/api/cron/notion-report` creates a Latimore OS operating report through the Notion Worker. It is protected by `CRON_SECRET` through either:

- `Authorization: Bearer <CRON_SECRET>`
- `x-cron-secret: <CRON_SECRET>`

## Required Vercel env names

Set these in Vercel for `latimore-hub-main`:

- `NOTION_WORKER_URL`
- `LATIMORE_NOTION_WORKER_URL` legacy fallback, optional
- `NOTION_WORKER_SHARED_SECRET` optional, only if the Worker has `WORKER_SHARED_SECRET`
- `CRON_SECRET`

## Required Cloudflare Worker configuration

The Worker needs:

- `NOTION_PARENT_PAGE_ID` as a Worker variable
- `NOTION_TOKEN` as a Worker secret
- optional `WORKER_SHARED_SECRET` as a Worker secret

The canonical parent page ID is already present in `workers/latimore-notion-worker/wrangler.toml`.

## Deploy command

From repo root:

```bash
cd workers/latimore-notion-worker
npm install
npx wrangler secret put NOTION_TOKEN
npx wrangler deploy
```

## Health check

GET the Worker URL. Passing response should include:

```json
{
  "ok": true,
  "service": "latimore-notion-worker",
  "mode": "notion-api-enabled",
  "actions": ["create_page", "append_page"]
}
```

## Real write test

POST JSON to the Worker or to `/api/notion-worker` after admin authentication:

```json
{
  "action": "create_page",
  "title": "Latimore OS Worker Live Test",
  "sections": [
    {
      "heading": "Status",
      "body": "The Notion Worker is writing to Notion."
    }
  ]
}
```

Pass condition: response includes `action: create_page`, `ok: true`, and a Notion page object.
