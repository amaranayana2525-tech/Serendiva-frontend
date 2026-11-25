'use client'

import NextLink from 'next/link'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { isAdminApiError } from '@/lib/admin/errors'
import type { MediaUsage } from '@/lib/api/types'
import { USAGE_ICONS, usageHref } from './mediaApi'

/** `MEDIA_IN_USE` (409) details → the usage entries (type, id, label). */
export function usageFromError(error: unknown): MediaUsage[] {
  if (!isAdminApiError(error) || typeof error.details !== 'object' || error.details === null) return []
  const usage = (error.details as { usage?: unknown }).usage
  if (!Array.isArray(usage)) return []
  return usage.filter(
    (u): u is MediaUsage =>
      typeof u === 'object' &&
      u !== null &&
      typeof (u as MediaUsage).label === 'string' &&
      typeof (u as MediaUsage).type === 'string',
  )
}

/** List of the places that reference a media file, linking to their admin editor where one exists. */
export function MediaUsageList({ usage, className }: { usage: readonly MediaUsage[]; className?: string }) {
  const t = useTranslations('adminLibrary.media.usageTypes')
  return (
    <ul className={className ?? 'flex flex-col gap-1.5'}>
      {usage.map((u, i) => {
        const href = usageHref(u)
        const body = (
          <>
            <Icon name={USAGE_ICONS[u.type] ?? 'link'} className="mt-0.5 shrink-0 text-[18px] text-secondary" />
            <span className="flex min-w-0 flex-col">
              <span className="break-words font-body-md text-body-md text-on-surface">{u.label}</span>
              <span className="font-caption text-caption text-on-surface-variant">{t(u.type)}</span>
            </span>
            {href && <Icon name="chevron_right" className="ml-auto mt-0.5 shrink-0 text-[18px] text-outline" />}
          </>
        )
        return (
          <li key={`${u.type}-${u.id}-${i}`}>
            {href ? (
              <NextLink
                href={href}
                className="flex items-start gap-2 rounded-lg border border-surface-container-high px-3 py-2 transition-colors hover:border-primary/40 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {body}
              </NextLink>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-surface-container-high px-3 py-2">
                {body}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
