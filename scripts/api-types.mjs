#!/usr/bin/env node
/**
 * Generates src/lib/api/schema.d.ts from the API's OpenAPI document.
 *
 *   npm run api:types                                   # uses $API_URL or http://localhost:4000
 *   npm run api:types -- http://localhost:4105          # explicit API base URL
 *   npm run api:types -- ../serendiva-api/openapi.json  # local file (e.g. from `npm run openapi:export` in the API)
 *
 * Cross-platform (works in PowerShell): no shell expansion, just Node.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = process.argv[2]
const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')

let source
if (arg && !/^https?:\/\//.test(arg)) {
  source = path.resolve(process.cwd(), arg)
  if (!existsSync(source)) {
    console.error(`[api:types] File not found: ${source}`)
    process.exit(1)
  }
} else if (arg) {
  source = arg.endsWith('.json') ? arg : `${arg.replace(/\/+$/, '')}/openapi.json`
} else {
  source = `${base}/openapi.json`
}

const out = path.join(root, 'src', 'lib', 'api', 'schema.d.ts')
const bin = path.join(root, 'node_modules', 'openapi-typescript', 'bin', 'cli.js')
console.log(`[api:types] ${source} -> ${path.relative(root, out)}`)
execFileSync(process.execPath, [bin, source, '-o', out], { stdio: 'inherit', cwd: root })
