import { getTranslations } from 'next-intl/server'
import { BestTimeMatrix, SeasonLegend } from '@/components/sections/BestTimeMatrix'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRegions } from '@/lib/api/public'
import type { Locale, Region } from '@/lib/api/types'

/** "Where to go, month by month": the CMS region ratings (GET /regions) rendered with the shared BestTimeMatrix. */
export async function GuideSeasonMatrix({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'travelGuide.bestTime.matrix' })
  let regions: Region[]
  try {
    regions = await getRegions(locale)
  } catch {
    return <ErrorState retryHref="/travel-guide#best-time" />
  }
  const rated = regions.filter((r) => r.bestMonths.length === 12)
  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-space-sm sm:flex-row sm:items-end">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary">{t('title')}</h3>
          <p className="font-caption text-caption text-on-surface-variant">{t('intro')}</p>
        </div>
        {rated.length > 0 && <SeasonLegend className="self-start bg-surface-container-low sm:self-auto" />}
      </div>
      {rated.length > 0 ? (
        <BestTimeMatrix regions={rated} caption={t('caption')} className="rounded-xl bg-surface-container-low" />
      ) : (
        <EmptyState icon="calendar_month" />
      )}
    </div>
  )
}

export function GuideSeasonMatrixSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-space-md">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}
