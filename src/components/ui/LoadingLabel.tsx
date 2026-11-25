'use client'

import { useTranslations } from 'next-intl'

/**
 * Screen-reader "Loading…" text for skeletons. It is a client component on purpose: skeletons are rendered by
 * `loading.tsx`, which receives no `locale` param — a server-side `useTranslations` there would fall back to reading
 * request headers and turn every page below it into a dynamic (non-static) route.
 */
export function LoadingLabel({ label }: { label?: string }) {
  const t = useTranslations('common.a11y')
  return <span className="sr-only">{label ?? t('loading')}</span>
}
