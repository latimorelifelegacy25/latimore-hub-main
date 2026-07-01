import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const schemaPath = path.join(repoRoot, 'prisma', 'schema.prisma')
const migrationsDir = path.join(repoRoot, 'prisma', 'migrations')

const schema = fs.readFileSync(schemaPath, 'utf8')
const modelBlocks = [...schema.matchAll(/^model\s+(\w+)\s+\{([\s\S]*?)^\}/gm)]

const tableNames = modelBlocks.map(([, modelName, body]) => {
  const mapMatch = body.match(/@@map\("([^"]+)"\)/)
  return mapMatch?.[1] ?? modelName
})

const migrationSql = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(migrationsDir, entry.name, 'migration.sql'))
  .filter((file) => fs.existsSync(file))
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n')

const missing = tableNames.filter((tableName) => {
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const quoted = new RegExp(`ALTER\\s+TABLE(?:\\s+IF\\s+EXISTS)?\\s+(?:public\\.)?"${escaped}"\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i')
  const unquoted = new RegExp(`ALTER\\s+TABLE(?:\\s+IF\\s+EXISTS)?\\s+(?:public\\.)?${escaped}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i')
  return !quoted.test(migrationSql) && !unquoted.test(migrationSql)
})

if (missing.length > 0) {
  console.error(`Missing RLS enablement for ${missing.length} Prisma table(s):`)
  for (const tableName of missing) console.error(`- ${tableName}`)
  process.exit(1)
}

console.log(`RLS coverage verified for ${tableNames.length} Prisma table(s).`)
