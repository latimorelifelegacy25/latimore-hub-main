# Local Setup Troubleshooting

Use this when setup fails while installing, creating `.env.local`, running Prisma, or seeding the database.

## Known-good setup sequence

Run these commands from the project root, the folder that contains `package.json`:

```bash
npm install
npm run env:init
# Edit .env.local and fill DATABASE_URL and DIRECT_URL with Supabase connection strings.
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

## `cp: cannot stat '.env.example': No such file or directory`

This usually means the shell is still in your home directory or another folder, not the extracted project folder.

Fix:

```bash
pwd
cd /path/to/osv2-build
npm run env:init
```

The `env:init` script copies `.env.local.example` first, then falls back to `.env.example`, and it will not overwrite an existing `.env.local`.

## Prisma loads `localhost:51213` or returns `Schema engine error`

Prisma reads `DATABASE_URL` and `DIRECT_URL` from your environment. If it is trying `localhost:51213`, the Supabase URLs were not copied into `.env.local` or an older shell-level variable is taking precedence.

Fix:

1. Open `.env.local`.
2. Set `DATABASE_URL` to the Supabase pooled connection string, usually on port `6543`.
3. Set `DIRECT_URL` to the Supabase direct connection string, usually on port `5432`.
4. Save the file, restart the terminal session if needed, and run `npm run db:push` again.

The warning `Prisma detected unknown OS "android"` can appear in Termux. It is a warning, but the database URLs still must point to a reachable PostgreSQL/Supabase database.

## `npx ts-node ... prisma/seed.ts` prompts to install `ts-node`

Do not seed with `ts-node`; this project already includes `tsx` and exposes a seed script.

Use:

```bash
npm run db:seed
```

## `npm audit` reports moderate vulnerabilities

Run the app setup first. Do not run `npm audit fix --force` unless you intentionally want breaking dependency upgrades. If dependency remediation is needed, review the audit output and upgrade packages deliberately.
