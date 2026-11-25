'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/ErrorState'
import { Container } from '@/components/ui/Container'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'

/** Shared body of error.tsx boundaries: friendly message, retry, WhatsApp fallback. */
export function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('common.buttons')
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <Container className="py-space-3xl">
      <ErrorState
        size="page"
        onRetry={reset}
        action={
          <WhatsAppLink className="inline-flex items-center justify-center gap-2 rounded-lg bg-tertiary-container px-space-lg py-space-sm font-label-lg text-label-lg text-on-tertiary transition-colors hover:bg-tertiary coarse:min-h-11">
            <Icon name="chat" className="text-[18px]" />
            {t('chatWhatsApp')}
          </WhatsAppLink>
        }
      />
    </Container>
  )
}
