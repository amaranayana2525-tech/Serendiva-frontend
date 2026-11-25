import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { GuideSection } from './GuideSection'

const ROWS = ['guide', 'safari', 'villa', 'porter', 'dining'] as const

/** Section 06 — Currency, cards & gratuities (Stitch "Tipping Benchmark Table" as a real, scrollable table). */
export function MoneyChapter({ id, icon }: { id: string; icon: string }) {
  const t = useTranslations('travelGuide.money')
  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
      <div
        role="region"
        aria-label={t('table.caption')}
        tabIndex={0}
        className="relative overflow-x-auto rounded-xl bg-surface-container-low p-space-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <table className="w-full min-w-[580px] border-collapse">
          <caption className="sr-only">{t('table.caption')}</caption>
          <thead>
            <tr className="border-b border-on-surface/10 font-label-md text-label-md font-semibold uppercase tracking-wider text-primary">
              <th scope="col" className="pb-space-sm pr-space-md text-left font-semibold">
                {t('table.role')}
              </th>
              <th scope="col" className="px-space-md pb-space-sm text-center font-semibold">
                {t('table.amount')}
              </th>
              <th scope="col" className="pb-space-sm pl-space-md text-right font-semibold">
                {t('table.method')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-on-surface/5 font-body-md text-body-md text-on-surface-variant">
            {ROWS.map((row) => (
              <tr key={row}>
                <th scope="row" className="py-space-sm pr-space-md text-left font-medium text-on-surface">
                  {t(`table.rows.${row}.role`)}
                </th>
                <td className="px-space-md py-space-sm text-center">{t(`table.rows.${row}.amount`)}</td>
                <td className="py-space-sm pl-space-md text-right font-caption text-caption">
                  {t(`table.rows.${row}.method`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
        <div className="flex items-start gap-space-sm rounded-xl bg-surface-container p-space-md">
          <Icon name="atm" className="shrink-0 text-[22px] text-primary" />
          <div>
            <h3 className="block font-label-md text-label-md font-semibold uppercase tracking-wider text-primary">
              {t('atm.title')}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('atm.body')}</p>
          </div>
        </div>
        <div className="flex items-start gap-space-sm rounded-xl bg-surface-container p-space-md">
          <Icon name="currency_exchange" className="shrink-0 text-[22px] text-secondary" />
          <div>
            <h3 className="block font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary">
              {t('exchange.title')}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('exchange.body')}</p>
          </div>
        </div>
      </div>
    </GuideSection>
  )
}
