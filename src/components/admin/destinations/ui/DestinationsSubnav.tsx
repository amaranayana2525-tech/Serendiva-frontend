'use client'

import NextLink from 'next/link'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

const LINKS = [
  { key: 'destinations', href: '/admin/destinations', icon: 'location_on' },
  { key: 'regions', href: '/admin/destinations/regions', icon: 'public' },
] as const

/** "Destinations · Regions" sub-navigation above both list screens. */
export function DestinationsSubnav({ current }: { current: (typeof LINKS)[number]['key'] }) {
  const t = useTranslations('adminContent.common.subnav')
  return (
    <nav aria-label={t('label')} className="relative -mx-1 mb-4 overflow-x-auto px-1 no-scrollbar">
      <ul className="flex w-max items-center gap-1 border-b border-surface-container-high">
        {LINKS.map((link) => {
          const active = link.key === current
          return (
            <li key={link.key}>
              <NextLink
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 font-body-md text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                  active ? 'border-secondary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary',
                )}
              >
                <Icon name={link.icon} className="text-[18px]" />
                {t(link.key)}
              </NextLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
