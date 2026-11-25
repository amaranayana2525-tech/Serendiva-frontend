import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

export interface StarsProps {
  /** 0–5, halves are rounded to the nearest 0.5. */
  rating: number
  /** Filled glyphs (reviews page) or outlined (home cards). */
  filled?: boolean
  /** Review count for the accessible label. */
  count?: number
  className?: string
  /** Size classes for each star, e.g. 'text-sm' or 'text-[18px]'. */
  starClassName?: string
}

/** Five-star rating with an accessible label ("Rated 4.5 out of 5"). Colour via className (default text-secondary). */
export function Stars({ rating, filled = true, count, className, starClassName = 'text-sm' }: StarsProps) {
  const t = useTranslations('common.a11y')
  const value = Math.max(0, Math.min(5, Math.round(rating * 2) / 2))
  const label = count !== undefined ? t('ratingWithCount', { rating: value, count }) : t('rating', { rating: value })
  return (
    <span role="img" aria-label={label} className={cn('inline-flex text-secondary', className)}>
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1
        const name = value >= n ? 'star' : value >= n - 0.5 ? 'star_half' : 'star'
        const isEmpty = value < n - 0.5
        return (
          <Icon
            key={n}
            name={name}
            filled={filled && !isEmpty}
            className={cn(starClassName, isEmpty && filled && 'opacity-35')}
          />
        )
      })}
    </span>
  )
}
