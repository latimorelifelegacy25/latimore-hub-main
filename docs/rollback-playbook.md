# Deployment Rollback Playbook

How to undo a bad deploy on this stack: Vercel (app), Supabase/Prisma
(database), and environment variables. Covers the standard release flow
(Build → Deploy Preview → Smoke Test → Production Deploy) and what to do
when the production step or the smoke test fails.

## 1. Standard release flow

1. **Build** — `npm run build` (`prisma generate` + `next build`). CI/Vercel
   runs this on every push; it fails the deploy on TypeScript or ESLint
   errors.
2. **Deploy Preview** — every PR gets a Vercel preview URL. Verify the
   change there before merging to `main`.
3. **Smoke test** — on the preview URL, check:
   - `/` and `/pahs` load without console errors
   - `/api/event` and `/api/lead` return `200`/`ok: true` for a minimal
     payload
   - `/admin` redirects to Google OAuth (or loads, if `DISABLE_ADMIN_AUTH`)
   - No errors in Vercel function logs for the preview deployment
4. **Production deploy** — merge to `main`. Vercel deploys automatically.
5. **Rollback validation** — only needed if step 4 or its post-deploy smoke
   test fails. See below.

## 2. Vercel rollback (app code)

Vercel keeps every previous production deployment available as an
immutable build.

- **Dashboard**: Project → Deployments → find the last known-good
  deployment → "..." menu → **Promote to Production**. This is instant and
  does not rebuild anything.
- **CLI**: `vercel rollback [deployment-url]` (requires `vercel` CLI
  authenticated against this project).

Vercel rollback only reverts the **app code/runtime**. It does not touch
the database — if the bad deploy included a migration, rolling back the
app alone can leave the schema ahead of the code (see §3 for why this
matters before you roll back).

## 3. Supabase / Prisma migration rollback (database)

Prisma's `prisma migrate deploy` is forward-only — there is no `migrate
down`. Treat schema rollback as "write and apply a new corrective
migration," not "undo the old one."

- **If the bad migration only added objects** (new table/column/index,
  nullable or with a default): write a new migration that drops what was
  added, then `npm run db:deploy` (`prisma migrate deploy`) against
  production.
- **If the bad migration altered/removed data or a NOT NULL column**: do
  **not** blind-drop it. Restore from a Supabase point-in-time-recovery
  (PITR) snapshot first (Supabase dashboard → Database → Backups), then
  re-apply only the migrations that were safe.
- **Always roll back the app (§2) before or together with the schema
  fix** if the previous app version expects the pre-migration schema —
  otherwise the rolled-back app will error against the new schema.
- Check `prisma/migrations/` for the exact ordered list of what's applied;
  `prisma migrate status` (run with `DIRECT_URL` set) shows what's pending
  vs. applied in a given environment.

## 4. Environment variable rollback

- Vercel versions environment variables per-environment but not per-deploy
  — there's no automatic "undo" for an env var change. Before changing a
  production env var, note the old value (Vercel dashboard → Settings →
  Environment Variables → shows current values for vars not marked
  sensitive).
- `lib/env.ts` + `instrumentation.ts` enforce a startup gate in production:
  if `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or
  `GOOGLE_CHAT_WEBHOOK_URL` is missing, or `DISABLE_ADMIN_AUTH=true` is set,
  the app throws at startup instead of serving traffic with a broken
  config. A bad env change to one of these surfaces immediately as a
  failed deploy/crash loop rather than silent data loss — restore the
  prior value and redeploy.
- After any env var change, redeploy (env vars only take effect on a new
  deployment) and re-run the smoke test in §1.

## 5. Decision guide

| Symptom after production deploy | Action |
|---|---|
| App crashes / 500s, no migration in this deploy | Vercel rollback (§2) only |
| App crashes / 500s, migration included | Vercel rollback (§2) **and** corrective migration (§3) |
| Leads/data missing or corrupted | Stop writes if possible, restore via Supabase PITR, then re-apply safe migrations |
| Env var change broke startup | Restore prior env value, redeploy |
