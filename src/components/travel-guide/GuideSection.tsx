import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface GuideSectionProps {
  id: string
  icon: string
  eyebrow: ReactNode
  title: ReactNode
  intro?: ReactNode
  className?: string
  children?: ReactNode
}

/**
 * One travel-guide chapter (Stitch `section.guide-searchable`): icon eyebrow, h2, light lead paragraph.
 * `data-dimmed` is toggled by the live search (GuideProvider) to fade chapters without a match.
 */
export function GuideSection({ id, icon, eyebrow, title, intro, className, children }: GuideSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        'flex scroll-mt-40 flex-col gap-space-md transition-[opacity,filter] duration-300 focus:outline-none xl:scroll-mt-28',
        'data-[dimmed=true]:opacity-[0.35] data-[dimmed=true]:grayscale-[0.7]',
        className,
      )}
    >
      <div className="flex items-center gap-space-xs font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
        <Icon name={icon} className="text-[18px]" />
        <span>{eyebrow}</span>
      </div>
      <h2 id={`${id}-title`} className="font-headline-xl text-headline-xl tracking-tight text-primary">
        {title}
      </h2>
      {intro && <p className="font-body-lg text-body-lg font-light leading-relaxed text-on-surface-variant">{intro}</p>}
      {children}
    </section>
  )
}
