// Builds the list of Material Symbols icons the app actually uses, so
// index.html can load only those (a few hundred KB) instead of the whole
// icon font (several MB). Run after adding new icons:
//   node scripts/icon-subset.mjs            -> prints the list and checks index.html
//   node scripts/icon-subset.mjs --write    -> updates the icon_names in index.html
//
// It collects every quoted word and JSX text word in the website and backend
// code (icons often come from data, e.g. badges and tips) plus EXTRA_ICONS
// below (icons stored in the database), and keeps the ones that are real
// Material Symbols names.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('..', import.meta.url))
const ROOTS = [join(here, 'src'), join(here, '..', 'rcf-library-backend', 'src')]
// Icons that only live in the database (resource_types.icon and similar).
const EXTRA_ICONS = ['menu_book', 'quiz', 'article', 'description', 'auto_stories', 'graphic_eq', 'movie', 'library_books', 'more_horiz', 'category', 'school', 'folder']

// Real icon names: Google's current list (the npm package's list is older and
// misses some, e.g. auto_awesome), plus the package list as a fallback offline.
const GOOGLE_CODEPOINTS =
  'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints'
const official = new Set(
  [...readFileSync(join(here, 'node_modules', 'material-symbols', 'index.d.ts'), 'utf8').matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1])
)
try {
  const res = await fetch(GOOGLE_CODEPOINTS, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  for (const line of (await res.text()).split('\n')) {
    const name = line.split(' ')[0]?.trim()
    if (name) official.add(name)
  }
} catch (err) {
  console.warn(`Could not download Google's icon list (${err.message}); using the package list only.`)
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* files(p)
    else if (['.js', '.jsx', '.mjs'].includes(extname(p))) yield p
  }
}

const used = new Set(EXTRA_ICONS)
for (const root of ROOTS) {
  for (const file of files(root)) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/['"`]([a-z][a-z0-9_]{1,45})['"`]/g)) if (official.has(m[1])) used.add(m[1])
    for (const m of text.matchAll(/>\s*([a-z][a-z0-9_]{1,45})\s*</g)) if (official.has(m[1])) used.add(m[1])
  }
}

const names = [...used].sort()
const param = names.join(',')
console.log(`${names.length} icons, icon_names is ${param.length} characters`)

const indexPath = join(here, 'index.html')
const html = readFileSync(indexPath, 'utf8')
const current = /icon_names=([a-z0-9_,]+)/.exec(html)?.[1]
if (process.argv.includes('--write')) {
  if (!current) throw new Error('index.html has no icon_names= parameter to update')
  writeFileSync(indexPath, html.replace(/icon_names=[a-z0-9_,]+/, `icon_names=${param}`))
  console.log('index.html updated')
} else if (current !== undefined) {
  const missing = names.filter((n) => !current.split(',').includes(n))
  console.log(missing.length ? `MISSING from index.html: ${missing.join(', ')} (run with --write)` : 'index.html has every icon')
} else {
  console.log(param)
}
