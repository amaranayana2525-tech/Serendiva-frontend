import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { ClientMessages } from '@/i18n/ClientMessages'
import type { NewsletterTokenAction } from '@/lib/api/newsletter-client'
import { NewsletterStatusCard } from './NewsletterStatusCard'
import { NewsletterTokenView } from './NewsletterTokenView'

function LoadingCard({ action }: { action: NewsletterTokenAction }) {
  const t = useTranslations('newsletter')
  return (
    <NewsletterStatusCard
      eyebrow={t('eyebrow')}
      icon="progress_activity"
      tone="pending"
      spinning
      title={t(`${action}.loading.title`)}
      body={t(`${action}.loading.body`)}
    />
  )
}

/** /newsletter/confirm and /newsletter/unsubscribe: static shell; the token is read and sent in the browser. */
export function NewsletterTokenPage({ action }: { action: NewsletterTokenAction }) {
  return (
    <Suspense fallback={<LoadingCard action={action} />}>
      <ClientMessages namespaces={['newsletter']}>
        <NewsletterTokenView action={action} />
      </ClientMessages>
    </Suspense>
  )
}
