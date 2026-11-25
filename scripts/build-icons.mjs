#!/usr/bin/env node
/**
 * Builds the Material Symbols SVG sprite used by <Icon />.
 *
 * Collects icon names from
 *   (a) the source code:  <Icon name="…" />, icon="…", icon: '…' / iconName: '…' in src/**
 *   (b) scripts/icon-allowlist.txt (names the CMS / API data may use — one per line, `#` comments)
 * and writes
 *   - public/icons/sprite.svg                     <symbol id="name"> + <symbol id="name-fill">
 *   - src/components/ui/icon-names.generated.ts  sorted name list (admin icon picker) + sprite version hash
 *
 * Unknown names are skipped with a warning. Some Material *font* ligatures (used by the Stitch export) are only
 * aliases and have no SVG file of their own — ALIASES maps them to the file with the same glyph.
 *
 * Runs on `npm run icons`, `predev` and `prebuild`. Pure Node (works in PowerShell).
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ICON_DIR = path.join(root, 'node_modules', '@material-symbols', 'svg-400', 'outlined')
const SRC_DIR = path.join(root, 'src')
const ALLOWLIST = path.join(root, 'scripts', 'icon-allowlist.txt')
const SPRITE_OUT = path.join(root, 'public', 'icons', 'sprite.svg')
const NAMES_OUT = path.join(root, 'src', 'components', 'ui', 'icon-names.generated.ts')
const NAME_RE = /^[a-z0-9_]{2,60}$/

/** Font-ligature aliases → SVG file name (same glyph). */
const ALIASES = {
  expand_more: 'keyboard_arrow_down',
  expand_less: 'keyboard_arrow_up',
  help_outline: 'help',
  info_outline: 'info',
  error_outline: 'error',
  terrain: 'landscape_2',
  filter_hdr: 'landscape',
  airplanemode_active: 'flight',
  local_airport: 'flight',
  auto_awesome: 'star_shine',
  magic_button: 'wand_stars',
  file_download: 'download',
  grade: 'star',
  star_outline: 'star',
  favorite_border: 'favorite',
  person_outline: 'person',
  phone: 'call',
  smartphone: 'mobile',
  watch_later: 'schedule',
  tips_and_updates: 'lightbulb',
  collections: 'photo_library',
  whatsapp: 'chat',
}

if (!existsSync(ICON_DIR)) {
  console.error('[icons] @material-symbols/svg-400 is not installed — run `npm install`.')
  process.exit(1)
}

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...walk(full))
    else if (/\.(tsx?|mdx?)$/.test(entry) && !entry.endsWith('.generated.ts') && !entry.endsWith('.d.ts'))
      out.push(full)
  }
  return out
}

const fromCode = new Set()
const codePatterns = [
  /<Icon\b[^>]*?\bname=\{?["'`]([a-z0-9_]+)["'`]\}?/gs,
  /\bicon=\{?["'`]([a-z0-9_]+)["'`]\}?/g,
  /\b(?:icon|iconName|leadingIcon|trailingIcon)\s*:\s*["'`]([a-z0-9_]+)["'`]/g,
]
for (const file of walk(SRC_DIR)) {
  const text = readFileSync(file, 'utf8')
  for (const re of codePatterns) for (const m of text.matchAll(re)) fromCode.add(m[1])
}

const fromList = new Set(
  existsSync(ALLOWLIST)
    ? readFileSync(ALLOWLIST, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.replace(/#.*/, '').trim())
        .filter(Boolean)
    : [],
)

const wanted = [...new Set([...fromCode, ...fromList])].filter((n) => NAME_RE.test(n)).sort()

/** @param {string} file */
function readSvg(file) {
  const svg = readFileSync(file, 'utf8')
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? '0 -960 960 960'
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
  return { viewBox, inner }
}

const symbols = []
const names = []
const skipped = []
for (const name of wanted) {
  const fileBase = ALIASES[name] ?? name
  const outlineFile = path.join(ICON_DIR, `${fileBase}.svg`)
  if (!existsSync(outlineFile)) {
    skipped.push(name)
    continue
  }
  const outline = readSvg(outlineFile)
  symbols.push(`<symbol id="${name}" viewBox="${outline.viewBox}">${outline.inner}</symbol>`)
  const fillFile = path.join(ICON_DIR, `${fileBase}-fill.svg`)
  const fill = existsSync(fillFile) ? readSvg(fillFile) : null
  if (fill && fill.inner !== outline.inner) {
    symbols.push(`<symbol id="${name}-fill" viewBox="${fill.viewBox}">${fill.inner}</symbol>`)
  } else {
    // Same glyph filled/unfilled. (A nested <use href="#name"> would be smaller, but browsers do not resolve
    // nested references inside an external sprite, so the path is duplicated.)
    symbols.push(`<symbol id="${name}-fill" viewBox="${outline.viewBox}">${outline.inner}</symbol>`)
  }
  names.push(name)
}

if (skipped.length) {
  console.warn(`[icons] Skipped ${skipped.length} unknown icon name(s): ${skipped.join(', ')}`)
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join('')}</svg>\n`
const version = createHash('sha1').update(sprite).digest('hex').slice(0, 10)

mkdirSync(path.dirname(SPRITE_OUT), { recursive: true })
const previous = existsSync(SPRITE_OUT) ? readFileSync(SPRITE_OUT, 'utf8') : ''
if (previous !== sprite) writeFileSync(SPRITE_OUT, sprite)

const ts = `// GENERATED by scripts/build-icons.mjs — do not edit. Run \`npm run icons\` to refresh.
/* eslint-disable */

/** Every icon available in /icons/sprite.svg (outlined + "-fill" variants). Used by <Icon /> and the admin icon picker. */
export const ICON_NAMES = ${JSON.stringify(names, null, 2).replace(/"/g, "'")} as const

export type IconName = (typeof ICON_NAMES)[number]

/** Content hash of the sprite — appended as ?v= so browsers never use a stale cached sprite. */
export const ICON_SPRITE_VERSION = '${version}'
`
const previousTs = existsSync(NAMES_OUT) ? readFileSync(NAMES_OUT, 'utf8') : ''
if (previousTs !== ts) writeFileSync(NAMES_OUT, ts)

const kb = (Buffer.byteLength(sprite) / 1024).toFixed(1)
console.log(
  `[icons] ${names.length} icons (${fromCode.size} referenced in src, ${fromList.size} allowlisted) -> public/icons/sprite.svg (${kb} KB, v=${version})`,
)
