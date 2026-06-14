import { copyFileSync, existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const destination = resolve(process.cwd(), '.env.local')
const candidates = ['.env.local.example', '.env.example']
const source = candidates.map((file) => resolve(process.cwd(), file)).find((file) => existsSync(file))

if (!source) {
  console.error('Could not find .env.local.example or .env.example in the current directory.')
  console.error('Run this command from the project root, then try again: npm run env:init')
  process.exit(1)
}

if (existsSync(destination)) {
  console.log('.env.local already exists; leaving it unchanged.')
  console.log('Edit .env.local and set DATABASE_URL and DIRECT_URL before running Prisma commands.')
  process.exit(0)
}

copyFileSync(source, destination)
console.log(`Created .env.local from ${basename(source)}.`)
console.log('Next: edit .env.local and set DATABASE_URL and DIRECT_URL, then run npm run db:push.')
