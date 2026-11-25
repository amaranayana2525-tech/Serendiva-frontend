import type { ComponentProps, ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface CardProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** Card heading (h2). */
  title?: ReactNode
  description?: ReactNode
  /** Material icon before the title. */
  icon?: string
  /** Buttons/links on the right of the header. */
  actions?: ReactNode
  /** Remove body padding (tables, lists that go edge to edge). */
  flush?: boolean
  /** Heading level for the title (default 2). */
  headingLevel?: 2 | 3
  bodyClassName?: string
}

/** White surface with the organic shadow and rounded-xl; optional header (title, description, actions). */
export function Card({
  title,
  description,
  icon,
  actions,
  flush = false,
  headingLevel = 2,
  className,
  bodyClassName,
  children,
  ...rest
}: CardProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  const hasHeader = title || description || actions
  return (
    <section className={cn('shadow-ambient rounded-xl bg-surface-container-lowest', className)} {...rest}>
      {hasHeader && (
        <header
          className={cn(
            'flex flex-wrap items-start justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5',
            flush && 'border-b border-surface-container pb-3 md:pb-4',
          )}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-secondary">
                <Icon name={icon} className="text-[18px]" />
              </span>
            )}
            <div className="min-w-0">
              {title && <Heading className="font-body-lg text-body-lg font-semibold text-primary">{title}</Heading>}
              {description && (
                <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && 'p-4 md:p-5', !flush && hasHeader && 'pt-3 md:pt-4', bodyClassName)}>{children}</div>
    </section>
  )
}
