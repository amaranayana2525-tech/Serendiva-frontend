'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { AvailabilityCalendar as AvailabilityCalendarDto } from '@/lib/api/types'
import { AvailabilityCalendar } from '@/components/sections/AvailabilityCalendar'

export interface ContactAvailabilityClientProps {
  calendar: AvailabilityCalendarDto
  title?: string
}

/**
 * Interactive sidebar calendar on /contact: displays the wizard's current exact-date selection and broadcasts
 * date clicks (`serendiva:calendar-pick` / `serendiva:calendar-clear`) so clicking any date fills Step 2.
 */
export function ContactAvailabilityClient({ calendar, title }: ContactAvailabilityClientProps) {
  const t = useTranslations('contact.concierge')
  const [selected, setSelected] = useState<{ start: string; end: string }>({ start: '', end: '' })

  useEffect(() => {
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<{ start: string; end: string }>).detail
      if (detail) setSelected({ start: detail.start, end: detail.end })
    }
    window.addEventListener('serendiva:calendar-sync', onSync)
    return () => window.removeEventListener('serendiva:calendar-sync', onSync)
  }, [])

  const onSelectDate = (iso: string) => {
    window.dispatchEvent(new CustomEvent('serendiva:calendar-pick', { detail: iso }))
  }

  const onClearSelection = () => {
    window.dispatchEvent(new CustomEvent('serendiva:calendar-clear'))
  }

  const selectionHint = selected.start
    ? selected.end
      ? t('availabilityRange', { start: selected.start, end: selected.end })
      : t('availabilityPickEnd', { start: selected.start })
    : t('availabilityPickHint')

  return (
    <AvailabilityCalendar
      calendar={calendar}
      monthsToShow={1}
      title={title}
      selectedStart={selected.start}
      selectedEnd={selected.end}
      onSelectDate={onSelectDate}
      onClearSelection={onClearSelection}
      selectionHint={selectionHint}
    />
  )
}
