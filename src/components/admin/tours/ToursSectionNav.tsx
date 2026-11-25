'use client'

import NextLink from 'next/link'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

/** "Tours | Categories" sub-navigation shared by /admin/tours and /admin/tours/categories. */
export function ToursSectionNav({ current, className }: { current: 'tours' | 'categories'; className?: string }) {
  const t = useTranslations('adminTours.nav')
  const items = [
    { key: 'tours', href: '/admin/tours', icon: 'map', label: t('tours') },
    { key: 'categories', href: '/admin/tours/categories', icon: 'category', label: t('categories') },
  ] as const
  return (
    <nav aria-label={t('label')} className={cn('relative -mx-1 overflow-x-auto px-1 no-scrollbar', className)}>
      <ul className="flex w-max items-center gap-1 border-b border-surface-container-high">
        {items.map((item) => {
          const active = item.key === current
          return (
            <li key={item.key}>
              <NextLink
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 font-body-md text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                  active ? 'border-secondary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary',
                )}
              >
                <Icon name={item.icon} className="text-[18px]" />
                {item.label}
              </NextLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
