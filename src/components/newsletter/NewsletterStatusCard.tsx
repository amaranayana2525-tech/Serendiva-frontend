import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Icon } from '@/components/ui/Icon'

export type NewsletterStatusTone = 'pending' | 'success' | 'neutral' | 'warning'

const TONES: Record<NewsletterStatusTone, string> = {
  pending: 'bg-surface-container text-primary',
  success: 'bg-tertiary-fixed text-on-tertiary-fixed',
  neutral: 'bg-primary-fixed text-on-primary-fixed-variant',
  warning: 'bg-secondary-fixed text-secondary',
}

export interface NewsletterStatusCardProps {
  eyebrow: string
  icon: string
  tone: NewsletterStatusTone
  title: string
  body: string
  /** Spinning icon (pending request). */
  spinning?: boolean
  /** Buttons / form under the message. */
  children?: ReactNode
  testId?: string
}

/** Centred status card for the newsletter confirm / unsubscribe pages (site sand style, like the 404 page). */
export function NewsletterStatusCard({
  eyebrow,
  icon,
  tone,
  title,
  body,
  spinning = false,
  children,
  testId,
}: NewsletterStatusCardProps) {
  return (
    <section className="relative w-full overflow-hidden py-space-3xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-fixed/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-secondary-fixed/30 blur-3xl"
      />
      <Container className="relative">
        <div
          data-testid={testId}
          data-state={tone}
          className="mx-auto flex max-w-2xl flex-col items-center gap-space-md rounded-2xl bg-surface-container-low px-space-lg py-space-2xl text-center shadow-sm md:px-space-2xl"
        >
          <span className={cn('flex h-20 w-20 items-center justify-center rounded-full shadow-sm', TONES[tone])}>
            <Icon name={icon} className={cn('text-[40px]', spinning && 'motion-safe:animate-spin')} />
          </span>
          <Eyebrow size="lg">{eyebrow}</Eyebrow>
          <div role="status" aria-live="polite" aria-atomic="true" className="flex flex-col gap-space-sm">
            <h1 className="font-headline-xl text-headline-xl-mobile text-primary md:text-headline-xl">{title}</h1>
            <p className="mx-auto max-w-xl font-body-lg text-body-lg text-on-surface-variant">{body}</p>
          </div>
          {children && <div className="flex w-full flex-col items-center gap-space-md pt-space-sm">{children}</div>}
        </div>
      </Container>
    </section>
  )
}
