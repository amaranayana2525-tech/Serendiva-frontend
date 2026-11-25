import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadMessages } from '@/i18n/messages'

const TRANSLATED_NAMESPACES = [
  'common',
  'home',
  'contact',
  'tours',
  'tourDetail',
  'destinations',
  'destinationDetail',
  'newsletter',
  'corporate',
  'reviews',
] as const

type JsonObj = Record<string, unknown>

function readLocaleFile(locale: 'en' | 'de' | 'zh', ns: string): JsonObj {
  const file = path.resolve(import.meta.dirname, '..', 'src', 'messages', locale, `${ns}.json`)
  return JSON.parse(readFileSync(file, 'utf8')) as JsonObj
}

function flattenLeaves(obj: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  if (typeof obj === 'string') {
    out.set(prefix, obj)
    return out
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error(`Unexpected non-object / non-string at "${prefix}"`)
  }
  for (const [k, v] of Object.entries(obj as JsonObj)) {
    const key = prefix ? `${prefix}.${k}` : k
    for (const [leafKey, leafVal] of flattenLeaves(v, key)) out.set(leafKey, leafVal)
  }
  return out
}

/** Extract top-level ICU argument names (and plural selectors) from an ICU MessageFormat string. */
function icuSignature(msg: string): string[] {
  const vars: string[] = []
  let depth = 0
  let start = -1
  for (let i = 0; i < msg.length; i++) {
    const ch = msg[i]
    if (ch === '{') {
      if (depth === 0) start = i + 1
      depth++
    } else if (ch === '}') {
      depth--
      if (depth < 0) throw new Error(`Unbalanced closing brace in "${msg}"`)
      if (depth === 0 && start >= 0) {
        const inner = msg.slice(start, i)
        const parts = inner.split(',')
        const argName = parts[0]?.trim()
        const kind = parts[1]?.trim()
        if (argName) vars.push(kind === 'plural' ? `${argName}:plural` : argName)
        start = -1
      }
    }
  }
  if (depth !== 0) throw new Error(`Unbalanced opening brace in "${msg}"`)
  return vars.sort()
}

describe('i18n translation parity across en / de / zh', () => {
  for (const ns of TRANSLATED_NAMESPACES) {
    it.each(['de', 'zh'] as const)(`${ns}.json (%s) has identical keys and ICU placeholders to English`, (locale) => {
      const enLeaves = flattenLeaves(readLocaleFile('en', ns))
      const locLeaves = flattenLeaves(readLocaleFile(locale, ns))

      const missing = [...enLeaves.keys()].filter((k) => !locLeaves.has(k))
      const extra = [...locLeaves.keys()].filter((k) => !enLeaves.has(k))
      expect(missing, `${locale}/${ns}.json missing keys`).toEqual([])
      expect(extra, `${locale}/${ns}.json extra keys`).toEqual([])

      for (const [key, enVal] of enLeaves) {
        const locVal = locLeaves.get(key) ?? ''
        expect(locVal.trim(), `${locale}/${ns}.json key "${key}" is empty`).not.toBe('')
        expect(icuSignature(locVal), `ICU mismatch in ${locale}/${ns}.json at "${key}"`).toEqual(icuSignature(enVal))
      }
    })
  }

  it('loadMessages loads translated de and zh namespaces rather than falling back to English', async () => {
    const [de, zh] = await Promise.all([loadMessages('de'), loadMessages('zh')])
    expect((de.common as { header: { planMyTrip: string } }).header.planMyTrip).toBe('Reise planen')
    expect((zh.common as { header: { planMyTrip: string } }).header.planMyTrip).toBe('定制行程')
    expect((de.contact as { breadcrumb: { current: string } }).breadcrumb.current).toBe('Reise planen')
    expect((zh.contact as { breadcrumb: { current: string } }).breadcrumb.current).toBe('定制行程')
    expect(
      (de.newsletter as { confirm: { confirmed: { title: string } } }).confirm.confirmed.title,
    ).toBe('Willkommen beim Private Dispatch Journal')
    expect(
      (zh.newsletter as { confirm: { confirmed: { title: string } } }).confirm.confirmed.title,
    ).toBe('欢迎订阅私人通讯')
  })
})
