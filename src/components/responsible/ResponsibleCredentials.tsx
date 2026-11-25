import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { listEntries, loose } from '@/lib/page-content/lists'

const CREDENTIALS = [
  { key: 'sltda', icon: 'verified' },
  { key: 'leaveNoTrace', icon: 'nature' },
  { key: 'fair', icon: 'groups' },
] as const

/** "Credentials of Responsible Travel" strip. */
export function ResponsibleCredentials() {
  const t = useTranslations('responsible.credentials')
  const tl = loose(t)
  const credentials = listEntries(tl.raw('items'), CREDENTIALS)
  return (
    <section aria-labelledby="credentials-title" className="w-full bg-surface-container-high py-space-2xl">
      <Container>
        <div className="flex flex-col items-center justify-between gap-space-xl lg:flex-row">
          <div className="flex max-w-lg flex-col">
            <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">
              {t('eyebrow')}
            </span>
            <h2 id="credentials-title" className="mt-1 font-headline-md text-headline-md text-primary">
              {t('title')}
            </h2>
            <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">{t('body')}</p>
          </div>
          <ul className="grid w-full grid-cols-1 gap-space-md sm:grid-cols-3 lg:w-auto">
            {credentials.map(({ key, icon }) => (
              <li
                key={key}
                className="flex items-center gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-[0_4px_12px_-4px_rgba(43,43,43,0.04)]"
              >
                {icon && <Icon name={icon} className="shrink-0 text-[32px] text-tertiary-container" />}
                <div className="flex flex-col">
                  <span className="font-headline-sm text-sm font-semibold leading-tight text-primary">
                    {tl(`items.${key}.title`)}
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {tl(`items.${key}.subtitle`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
