import fs from 'node:fs'
import path from 'node:path'
import { uiPhrases } from '../src/i18n/phrases.js'

const known = new Set(uiPhrases)
const used = new Set()

function walk(directory) {
  for (const name of fs.readdirSync(directory)) {
    const filePath = path.join(directory, name)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) walk(filePath)
    else if (/\.(jsx|js)$/.test(name)) {
      const source = fs.readFileSync(filePath, 'utf8')
      for (const match of source.matchAll(/\bt\("([^"]+)"/g)) used.add(match[1])
    }
  }
}

walk(path.resolve(process.cwd(), 'src'))
const missing = [...used].filter((phrase) => !known.has(phrase)).sort()
if (missing.length) {
  console.error('Missing source phrases:\n' + missing.join('\n'))
  process.exitCode = 1
} else {
  console.log(`All ${used.size} literal t() phrases are cataloged.`)
}

for (const code of ['fr', 'es', 'pt', 'ha', 'yo', 'ig']) {
  const filePath = path.resolve(process.cwd(), 'src/i18n/locales', `${code}.json`)
  if (!fs.existsSync(filePath)) {
    console.error(`Missing locale catalog: ${code}`)
    process.exitCode = 1
    continue
  }
  const catalog = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const missingKeys = uiPhrases.filter((phrase) => typeof catalog[phrase] !== 'string' || !catalog[phrase].trim())
  if (missingKeys.length) {
    console.error(`${code} is missing ${missingKeys.length} translations.`)
    process.exitCode = 1
  }
}
