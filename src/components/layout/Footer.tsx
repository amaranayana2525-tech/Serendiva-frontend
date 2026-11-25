import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { PublicSettings } from '@/lib/api/types'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { NewsletterForm } from '@/components/forms/NewsletterForm'
import logo from '../../../public/brand/serendiva-logo-256.png'

// Touch screens get 44 px rows (tap targets); mouse users keep the Stitch 22 px rows with the list's 8 px gap.
const linkClass =
  'block w-fit coarse:flex coarse:min-h-11 coarse:items-center rounded font-body-md text-body-md text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
const legalClass =
  'block whitespace-nowrap py-1 coarse:flex coarse:min-h-11 coarse:items-center coarse:py-0 rounded font-caption text-caption text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

/** Exact Stitch footer. Licence, service area, phone and email come from the CMS settings (null-safe if the API is down). */
export function Footer({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('common')
  const contact = settings?.contact
  const licence = settings?.guide.operatorLicense
  const year = new Date().getFullYear()
  const contactParts = [
    contact?.phone ? t('footer.telephone', { phone: contact.phone }) : null,
    contact?.email ? t('footer.conciergeEmail', { email: contact.email }) : null,
  ].filter(Boolean)

  const expeditions = [
    { label: t('footer.expeditions.signatureJourneys'), href: '/tours' },
    { label: t('footer.expeditions.hillCountry'), href: '/destinations' },
    { label: t('footer.expeditions.southernCoast'), href: '/destinations' },
    { label: t('footer.expeditions.corporateRetreats'), href: '/corporate' },
  ]
  const concierge = [
    { label: t('footer.concierge.serendivaWay'), href: '/about' },
    { label: t('footer.concierge.visualJournal'), href: '/gallery' },
    { label: t('footer.concierge.guestReviews'), href: '/reviews' },
    { label: t('footer.concierge.privateDispatch'), href: '/contact' },
  ]

  return (
    <footer aria-label={t('footer.label')} className="mt-space-3xl w-full bg-surface-container-low">
      <Container className="pb-space-2xl pt-space-3xl">
        <div className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-4">
            <Link
              href="/"
              aria-label={t('brand.homeLink')}
              className="flex w-fit items-center gap-space-md rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Image
                src={logo}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full object-contain shadow-sm"
              />
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
                {t('brand.name')}
              </span>
            </Link>
            <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">{t('footer.about')}</p>
            {licence && (
              <div className="inline-flex w-fit items-center gap-space-sm rounded-full bg-surface-container px-space-md py-space-sm">
                <Icon name="verified" className="text-sm text-tertiary" />
                <span className="font-label-md text-label-md text-tertiary">
                  {t('footer.licence', { number: licence })}
                </span>
              </div>
            )}
          </div>

          <nav aria-labelledby="footer-expeditions" className="flex flex-col gap-space-md lg:col-span-2">
            <h2 id="footer-expeditions" className="font-label-lg text-label-lg uppercase tracking-wider text-primary">
              {t('footer.expeditionsTitle')}
            </h2>
            <ul className="flex flex-col gap-space-sm coarse:gap-0">
              {expeditions.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-concierge" className="flex flex-col gap-space-md lg:col-span-2">
            <h2 id="footer-concierge" className="font-label-lg text-label-lg uppercase tracking-wider text-primary">
              {t('footer.conciergeTitle')}
            </h2>
            <ul className="flex flex-col gap-space-sm coarse:gap-0">
              {concierge.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-space-md lg:col-span-4">
            <h2 className="font-label-lg text-label-lg uppercase tracking-wider text-primary">
              {t('footer.newsletterTitle')}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('footer.newsletterIntro')}</p>
            <NewsletterForm source="footer" />
            <div className="mt-space-sm flex flex-col gap-1">
              <span className="font-caption text-caption text-on-surface-variant">
                {t('footer.serving', { area: contact?.serviceArea || t('footer.servingDefault') })}
              </span>
              {contactParts.length > 0 && (
                <span className="font-caption text-caption text-on-surface-variant">
                  {contact?.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                      className="rounded hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {t('footer.telephone', { phone: contact.phone })}
                    </a>
                  )}
                  {contact?.phone && contact?.email && ' · '}
                  {contact?.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="rounded hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {t('footer.conciergeEmail', { email: contact.email })}
                    </a>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-space-2xl flex flex-col items-center justify-between gap-space-md pt-space-lg md:flex-row">
          <span className="font-caption text-caption text-on-surface-variant">{t('footer.copyright', { year })}</span>
          <nav aria-label={t('footer.legalNav')}>
            <ul className="flex flex-wrap items-center justify-center gap-x-space-lg md:justify-end">
              <li>
                <Link href="/privacy" className={legalClass}>
                  {t('footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={legalClass}>
                  {t('footer.legal.terms')}
                </Link>
              </li>
              <li>
                <Link href={{ pathname: '/travel-guide', hash: 'safety' }} className={legalClass}>
                  {t('footer.legal.safety')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  )
}
