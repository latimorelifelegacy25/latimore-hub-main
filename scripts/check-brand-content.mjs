import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadRules } from './brand-rules.mjs'

const roots = ['app', 'components', 'lib', 'emails', 'content', 'prisma/seed-data']
// Plain typographic/navigation symbols are allowed; colorful emoji sequences are not.
const allowedSymbols = new Set(['©', '®', '™', '↗', '↘', '↙', '↖', '➡', '⬅', '⬆', '⬇', '▶', '◀', '⏸', '☰'])
const pictographs = /\p{Extended_Pictographic}/gu
const otherEmoji = /\p{Regional_Indicator}|[0-9#*]\uFE0F?\u20E3|\uFE0F|\u200D/gu
const badPhone = /\(?717\)?[ .-]*615[ .-]*2613|\(?570\)?[ .-]*900[ .-]*1766/
const badLicensing = /licensed\s+in\s+(?:all\s+)?50\s+states/i
let scanned = 0
const failures = []
// New advertising-compliance rules (from lib/ai/compliance.ts) report as non-failing warnings.
const complianceRules = loadRules()
if (!complianceRules.length) failures.push('lib/ai/compliance.ts: could not load compliance rules')
const warnings = []
function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) scan(path)
    else if (/\.(tsx?|jsx?|mdx|json)$/.test(path)) {
      const source = readFileSync(path, 'utf8')
      scanned++
      if ([...source.matchAll(pictographs)].some(([symbol]) => !allowedSymbols.has(symbol)) || [...source.matchAll(otherEmoji)].length) failures.push(`${path}: emoji`)
      if (badPhone.test(source)) failures.push(`${path}: outdated phone`)
      if (badLicensing.test(source)) failures.push(`${path}: unsupported licensing claim`)
      // The rule definitions themselves quote the banned phrases in descriptions.
      if (path !== join('lib', 'ai', 'compliance.ts')) source.split('\n').forEach((line, index) => {
        for (const { rule, regex } of complianceRules) {
          const match = line.match(regex)
          if (match) warnings.push(`${path}:${index + 1}: [${rule}] "${match[0].slice(0, 80)}"`)
        }
      })
    }
  }
}
roots.forEach(scan)
if (warnings.length) console.warn(`Compliance warnings (non-failing, ${warnings.length}):\n${warnings.join('\n')}`)
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else console.log(`Brand content check passed across ${scanned} source files.`)
