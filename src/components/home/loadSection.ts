import 'server-only'
import { unstable_rethrow } from 'next/navigation'

export type Loaded<T> = { ok: true; data: T } | { ok: false }

/**
 * Runs a data loader for one home section. API failures become `{ ok: false }` (the section shows <ErrorState/>)
 * instead of breaking the whole page; Next.js control-flow errors are re-thrown.
 */
export async function loadSection<T>(label: string, run: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await run() }
  } catch (error) {
    unstable_rethrow(error)
    console.error(`[home] ${label} unavailable:`, error instanceof Error ? error.message : error)
    return { ok: false }
  }
}
