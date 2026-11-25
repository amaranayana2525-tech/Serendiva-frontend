import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface AdviceCardProps {
  title: string
  body: string
  cta: string
  /** Page name for the pre-filled WhatsApp message ("I'm on your … page"). */
  page?: string
  className?: string
}

/** Deep-teal "Puzzled by Itinerary Routing?" card from the travel-guide sidebar (also used beside articles). */
export function AdviceCard({ title, body, cta, page, className }: AdviceCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-space-sm overflow-hidden rounded-xl bg-primary p-space-lg text-on-primary shadow-xl',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-secondary/15"
      />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-on-primary/10">
        <Icon name="contact_support" className="text-[22px] text-secondary-fixed" />
      </div>
      <h2 className="font-headline-sm text-headline-sm tracking-tight text-surface-bright">{title}</h2>
      <p className="font-body-md text-body-md text-surface-container-high/90">{body}</p>
      <WhatsAppLink
        page={page}
        className="relative mt-space-xs inline-flex items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-md py-space-sm text-center font-label-lg text-label-lg uppercase tracking-wider text-on-secondary shadow-md transition-all hover:bg-[#a64a22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:scale-95 coarse:min-h-11"
      >
        <Icon name="chat" className="text-[18px]" />
        {cta}
      </WhatsAppLink>
    </div>
  )
}
