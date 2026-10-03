import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const roots = ['app', 'components', 'lib', 'emails', 'content', 'prisma/seed-data']
// Plain typographic/navigation symbols are allowed; colorful emoji sequences are not.
const allowedSymbols = new Set(['©', '®', '™', '↗', '↘', '↙', '↖', '➡', '⬅', '⬆', '⬇', '▶', '◀', '⏸', '☰'])
const pictographs = /\p{Extended_Pictographic}/gu
const otherEmoji = /\p{Regional_Indicator}|[0-9#*]\uFE0F?\u20E3|\uFE0F|\u200D/gu
const badPhone = /\(?717\)?[ .-]*615[ .-]*2613|\(?570\)?[ .-]*900[ .-]*1766/
const badLicensing = /licensed\s+in\s+(?:all\s+)?50\s+states/i
let scanned = 0
const failures = []
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
    }
  }
}
roots.forEach(scan)
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else console.log(`Brand content check passed across ${scanned} source files.`)
