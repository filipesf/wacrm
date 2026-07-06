#!/usr/bin/env node
/**
 * i18n key-parity check.
 *
 * next-intl does NOT fall back between locales — a key present in one
 * catalogue but missing in another throws at runtime for that locale.
 * This script flattens every messages/<locale>/*.json into a dotted
 * key set and fails if any two locales disagree, so a forgotten
 * translation is caught in CI instead of in production.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const messagesDir = join(root, 'messages')

function flatten(obj, prefix = '') {
  const out = new Set()
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const nested of flatten(v, key)) out.add(nested)
    } else {
      out.add(key)
    }
  }
  return out
}

function keysForLocale(locale) {
  const dir = join(messagesDir, locale)
  const keys = new Set()
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const ns = file.replace(/\.json$/, '')
    const content = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    for (const key of flatten(content, ns)) keys.add(key)
  }
  return keys
}

if (!existsSync(messagesDir)) {
  console.error('No messages/ directory found.')
  process.exit(1)
}

const locales = readdirSync(messagesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

if (locales.length < 2) {
  console.log(`Only ${locales.length} locale(s) — nothing to compare.`)
  process.exit(0)
}

const keySets = Object.fromEntries(locales.map((l) => [l, keysForLocale(l)]))
const union = new Set(locales.flatMap((l) => [...keySets[l]]))

let failed = false
for (const locale of locales) {
  const missing = [...union].filter((k) => !keySets[locale].has(k)).sort()
  if (missing.length) {
    failed = true
    console.error(`\n✗ ${locale} is missing ${missing.length} key(s):`)
    for (const k of missing) console.error(`    ${k}`)
  }
}

if (failed) {
  console.error('\ni18n key parity check failed.')
  process.exit(1)
}

console.log(
  `✓ i18n key parity OK — ${union.size} keys across ${locales.length} locales (${locales.join(', ')}).`
)
