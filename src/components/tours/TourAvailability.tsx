import { getTranslations } from 'next-intl/server'
import { getAvailability } from '@/lib/api/public'
import type { AvailabilityCalendar as AvailabilityCalendarDto } from '@/lib/api/types'
import { AvailabilityCalendar } from '@/components/sections/AvailabilityCalendar'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

/** Read-only availability calendar under the tour inquiry card (GET /availability, tag "availability"). */
export async function TourAvailability() {
  const t = await getTranslations('tourDetail.inquiry')
  let calendar: AvailabilityCalendarDto
  try {
    calendar = await getAvailability()
  } catch {
    return <ErrorState className="py-space-lg" />
  }
  return <AvailabilityCalendar calendar={calendar} monthsToShow={1} title={t('availabilityTitle')} />
}

export function TourAvailabilitySkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-space-md rounded-2xl bg-surface-container-low p-space-lg">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}
