import type { ReactNode } from 'react'
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl'
import { getMessages } from 'next-intl/server'

type Tree = { [key: string]: Tree | string }

const isTree = (value: unknown): value is Tree => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Copies `messages.<a>.<b>…` into `target` (creating the intermediate objects). */
function copyPath(source: Tree, target: Tree, path: string[]) {
  let from: Tree | string | undefined = source
  let to: Tree = target
  path.forEach((segment, index) => {
    if (!isTree(from)) return
    const next: Tree | string | undefined = from[segment]
    if (next === undefined) return
    if (index === path.length - 1) {
      to[segment] = next
    } else {
      const existing = to[segment]
      to[segment] = isTree(existing) ? existing : {}
      to = to[segment] as Tree
    }
    from = next
  })
}

/**
 * Like i18n/ClientMessages, but sends only the given message sub-trees to the client components inside
 * (e.g. `['blog.filters', 'blog.grid']`) instead of whole page namespaces. `common` is always included.
 */
export async function ScopedMessages({ paths, children }: { paths: string[]; children: ReactNode }) {
  const messages = (await getMessages()) as unknown as Tree
  const picked: Tree = {}
  copyPath(messages, picked, ['common'])
  for (const path of paths) copyPath(messages, picked, path.split('.'))
  return <NextIntlClientProvider messages={picked as AbstractIntlMessages}>{children}</NextIntlClientProvider>
}
