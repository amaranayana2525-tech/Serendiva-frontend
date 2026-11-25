import type { ReactNode } from 'react'
import { getFormatter, getMessages, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getSettings } from '@/lib/api/public'
import type { Locale, PublicSettings } from '@/lib/api/types'
import { waLink } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import {
  DEFAULT_SECTION_ICON,
  LEGAL_SECTION_ICONS,
  fillPlaceholders,
  getLegalDocument,
  legalPlaceholders,
  tokenizeInline,
  type LegalBlock,
  type LegalKind,
  type LegalPlaceholders,
} from './legal-content'
import { LegalToc } from './LegalToc'

const LINK =
  'rounded font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-secondary hover:decoration-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

/** Renders **bold**, [links](/path) and email addresses inside a legal string. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {tokenizeInline(text).map((token, i) => {
        if (token.kind === 'strong')
          return (
            <strong key={i} className="font-semibold text-on-surface">
              {token.value}
            </strong>
          )
        if (token.kind === 'email')
          return (
            <a key={i} href={`mailto:${token.value}`} className={LINK}>
              {token.value}
            </a>
          )
        if (token.kind === 'link')
          return token.href.startsWith('/') ? (
            <Link key={i} href={token.href} className={LINK}>
              {token.label}
            </Link>
          ) : (
            <a key={i} href={token.href} target="_blank" rel="noopener noreferrer" className={LINK}>
              {token.label}
            </a>
          )
        return <span key={i}>{token.value}</span>
      })}
    </>
  )
}

interface ContactLabels {
  email: string
  whatsapp: string
  address: string
  licence: string
  licenceValue: string
}

function ContactCard({
  values,
  whatsappHref,
  labels,
}: {
  values: LegalPlaceholders
  whatsappHref: string
  labels: ContactLabels
}) {
  const rows = [
    { key: 'email', icon: 'mail', label: labels.email, value: values.email, href: `mailto:${values.email}` },
    { key: 'whatsapp', icon: 'chat', label: labels.whatsapp, value: values.whatsapp, href: whatsappHref },
    { key: 'address', icon: 'location_on', label: labels.address, value: values.address },
    { key: 'licence', icon: 'verified', label: labels.licence, value: labels.licenceValue },
  ]
  return (
    <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm">
      <p className="font-headline-sm text-headline-sm text-primary">{values.guideName}</p>
      <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">{values.businessName}</p>
      <dl className="mt-space-md grid grid-cols-1 gap-space-md sm:grid-cols-2">
        {rows.map((row) => (
          // A <dl> group may only contain <dt>/<dd>: the icon lives inside the <dt>, positioned in the left gutter.
          <div key={row.key} className="relative flex min-h-10 min-w-0 flex-col pl-12">
            <dt className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <Icon name={row.icon} className="text-[20px]" />
              </span>
              {row.label}
            </dt>
            <dd className="break-words font-body-md text-body-md text-on-surface">
              {row.href ? (
                <a
                  href={row.href}
                  className={LINK}
                  {...(row.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Block({
  block,
  fill,
  contact,
  tableHint,
}: {
  block: LegalBlock
  fill: (text: string) => string
  contact: ReactNode
  /** Accessible name / visible hint for horizontally scrollable tables. */
  tableHint: string
}) {
  switch (block.type) {
    case 'p':
      return (
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          <RichText text={fill(block.text)} />
        </p>
      )
    case 'list':
      return (
        <ul className="flex flex-col gap-space-sm">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-space-sm font-body-lg text-body-lg text-on-surface-variant">
              <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
              <span className="min-w-0">
                {typeof item === 'string' ? (
                  <RichText text={fill(item)} />
                ) : (
                  <>
                    <strong className="font-semibold text-on-surface">{fill(item.term)}</strong>
                    {' — '}
                    <RichText text={fill(item.text)} />
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )
    case 'table':
      return (
        <div className="flex flex-col gap-space-xs">
          <div
            role="region"
            aria-label={`${fill(block.head[0] ?? '')} — ${tableHint}`}
            tabIndex={0}
            className="relative overflow-x-auto rounded-xl bg-surface-container-low shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-container">
                  {block.head.map((cell) => (
                    <th
                      key={cell}
                      scope="col"
                      className="px-space-md py-space-sm font-label-md text-label-md font-semibold uppercase tracking-wider text-primary"
                    >
                      {fill(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-t border-outline-variant/40 align-top">
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th
                          key={c}
                          scope="row"
                          className="px-space-md py-space-sm font-body-md text-body-md font-semibold text-on-surface"
                        >
                          <RichText text={fill(cell)} />
                        </th>
                      ) : (
                        <td
                          key={c}
                          className="px-space-md py-space-sm font-body-md text-body-md text-on-surface-variant"
                        >
                          <RichText text={fill(cell)} />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            aria-hidden="true"
            className="flex items-center gap-1 font-caption text-caption text-on-surface-variant md:hidden"
          >
            <Icon name="swipe" className="text-sm" />
            {tableHint}
          </p>
        </div>
      )
    case 'callout':
      return (
        <div className="flex items-start gap-space-md rounded-xl bg-surface-container-highest/60 p-space-lg">
          <Icon
            name={block.tone === 'warning' ? 'warning' : 'info'}
            className="mt-0.5 shrink-0 text-[24px] text-secondary"
          />
          <div className="flex flex-col gap-1">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{fill(block.title)}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              <RichText text={fill(block.text)} />
            </p>
          </div>
        </div>
      )
    case 'contact':
      return <>{contact}</>
  }
}

/** Topographic contour lines behind the hero (Stitch travel-guide masthead). */
function ContourLines() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply">
      <svg
        className="h-full w-full"
        fill="none"
        preserveAspectRatio="none"
        stroke="currentColor"
        viewBox="0 0 1440 600"
      >
        <path d="M-100 80 C 300 200, 700 40, 1100 120 C 1300 160, 1500 90, 1600 140" strokeWidth="1.5" />
        <path d="M-100 180 C 250 280, 600 120, 950 210 C 1200 270, 1400 180, 1600 230" strokeWidth="1.5" />
        <path d="M-100 280 C 200 360, 650 220, 1050 310 C 1300 360, 1450 300, 1600 330" strokeWidth="1.5" />
        <path d="M-100 380 C 350 420, 750 310, 1150 400 C 1350 440, 1500 380, 1600 420" strokeWidth="1.5" />
        <path d="M-100 480 C 400 520, 800 400, 1200 490 C 1400 520, 1500 470, 1600 510" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  try {
    return await getSettings(locale)
  } catch (error) {
    console.error('[legal] settings unavailable:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Editorial legal page (privacy / terms): travel-guide style masthead with a visible "template — pending legal
 * review" note, sticky table of contents with scroll-spy, numbered sections rendered from legal.json.
 */
export async function LegalPage({ locale, kind }: { locale: Locale; kind: LegalKind }) {
  const [messages, t, td, tc, format, settings] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: 'legal.ui' }),
    getTranslations({ locale, namespace: 'legal.defaults' }),
    getTranslations({ locale, namespace: 'common' }),
    getFormatter({ locale }),
    loadSettings(locale),
  ])
  const doc = getLegalDocument((messages as Record<string, unknown>).legal, kind)
  if (!doc) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-margin py-space-3xl lg:px-margin-lg">
        <ErrorState size="page" retryHref={`/${kind}`} />
      </div>
    )
  }

  const values = legalPlaceholders(settings, {
    businessName: td('businessName'),
    guideName: td('guideName'),
    address: td('address'),
    email: td('email'),
    whatsapp: td('whatsapp'),
    guideLicence: td('guideLicence'),
    operatorLicence: td('operatorLicence'),
  })
  const fill = (text: string) => fillPlaceholders(text, values)
  const updated = new Date(`${doc.updated}T00:00:00Z`)
  const updatedLabel = Number.isNaN(updated.getTime())
    ? doc.updated
    : format.dateTime(updated, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  const whatsappHref = waLink(settings?.contact.whatsapp, tc('whatsapp.default'))

  const contact = (
    <ContactCard
      values={values}
      whatsappHref={whatsappHref}
      labels={{
        email: t('contactEmail'),
        whatsapp: t('contactWhatsapp'),
        address: t('contactAddress'),
        licence: t('contactLicence'),
        licenceValue: t('contactLicenceValue', {
          guideLicence: values.guideLicence,
          operatorLicence: values.operatorLicence,
        }),
      }}
    />
  )

  return (
    <>
      {/* Masthead */}
      <div className="relative w-full overflow-hidden bg-surface-container-low" id="top">
        <ContourLines />
        <div className="relative z-10 mx-auto max-w-[1440px] px-margin pb-space-3xl pt-space-lg lg:px-margin-lg">
          <Breadcrumbs items={[{ label: t('home'), href: '/' }, { label: doc.breadcrumb }]} className="mb-space-xl" />
          <div className="grid grid-cols-1 items-end gap-gutter-lg lg:grid-cols-12">
            <div className="flex flex-col gap-space-md lg:col-span-8">
              <div className="inline-flex max-w-fit items-center gap-space-xs rounded-full bg-surface-container-high/90 px-space-md py-space-xs shadow-sm">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
                <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface">
                  {doc.badge}
                </span>
              </div>
              <h1 className="font-headline-xl text-display-lg-mobile tracking-tight text-primary lg:text-display-lg">
                {doc.title}
                <br />
                <span className="font-headline-xl font-normal italic">{doc.titleAccent}</span>
              </h1>
              <p className="max-w-2xl font-body-xl text-body-xl font-light text-on-surface-variant">{doc.intro}</p>
              <p className="flex items-center gap-space-xs font-label-lg text-label-lg text-primary">
                <Icon name="event" className="text-[18px] text-secondary" />
                <time dateTime={doc.updated}>{t('updated', { date: updatedLabel })}</time>
              </p>
            </div>
            <div className="flex flex-col justify-end lg:col-span-4">
              <div
                role="note"
                data-testid="legal-template-note"
                className="flex items-start gap-space-md rounded-xl bg-surface-container p-space-md shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                  <Icon name="gavel" className="text-[22px]" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
                    {t('templateTitle')}
                  </span>
                  <p className="font-caption text-caption text-on-surface-variant">{t('templateBody')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body: sticky TOC + sections */}
      <div className="mx-auto w-full max-w-[1440px] px-margin py-space-2xl lg:px-margin-lg">
        <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
          <aside className="flex flex-col gap-space-lg self-start lg:sticky lg:top-24 lg:col-span-3">
            <LegalToc
              title={t('tocTitle')}
              countLabel={t('tocCount', { count: doc.sections.length })}
              items={doc.sections.map((s) => ({ id: s.id, label: fill(s.short) }))}
            />
            <div className="relative flex flex-col gap-space-sm overflow-hidden rounded-xl bg-primary p-space-lg text-on-primary shadow-xl">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-secondary/15"
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-on-primary/10">
                <Icon name="contact_support" className="text-[22px] text-secondary-fixed" />
              </div>
              <h2 className="font-headline-sm text-headline-sm tracking-tight text-surface-bright">{doc.help.title}</h2>
              <p className="font-body-md text-body-md text-surface-container-high/90">{doc.help.body}</p>
              <a
                href={`mailto:${values.email}`}
                className="relative mt-space-xs inline-flex items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-md py-space-sm font-label-lg text-label-lg uppercase tracking-wider text-on-secondary shadow-md transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary coarse:min-h-11"
              >
                <Icon name="mail" className="text-[18px]" />
                {t('emailCta')}
              </a>
              <WhatsAppLink
                page={doc.breadcrumb}
                className="relative inline-flex items-center justify-center gap-space-xs rounded-xl bg-surface/10 px-space-md py-space-sm font-label-lg text-label-lg uppercase tracking-wider text-surface transition-colors hover:bg-surface/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface coarse:min-h-11"
              >
                <Icon name="chat" className="text-[18px]" />
                {t('whatsappCta')}
              </WhatsAppLink>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-space-2xl lg:col-span-9">
            {/* At a glance */}
            <section aria-labelledby="legal-glance" className="flex flex-col gap-space-md">
              <h2 id="legal-glance" className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
                {t('glanceTitle')}
              </h2>
              <ul className="grid grid-cols-1 gap-space-md md:grid-cols-3">
                {doc.glance.map((item, i) => (
                  <li key={item.label} className="rounded-xl bg-surface-container-low p-space-md shadow-sm">
                    <span
                      className={cn(
                        'mb-1 block font-label-md text-label-md font-semibold uppercase tracking-widest',
                        ['text-primary', 'text-secondary', 'text-tertiary'][i % 3],
                      )}
                    >
                      {fill(item.label)}
                    </span>
                    <span className="block font-headline-sm text-headline-sm text-on-surface">{fill(item.value)}</span>
                    <p className="mt-1 font-caption text-caption text-on-surface-variant">{fill(item.text)}</p>
                  </li>
                ))}
              </ul>
            </section>

            {doc.sections.map((section, index) => {
              const number = String(index + 1).padStart(2, '0')
              const icon = (LEGAL_SECTION_ICONS[section.id] ?? DEFAULT_SECTION_ICON).icon
              return (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className="flex scroll-mt-28 flex-col gap-space-md"
                >
                  <div className="flex items-center gap-space-xs font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
                    <Icon name={icon} className="text-[18px]" />
                    <span>
                      {t('sectionLabel', { number })} • {fill(section.kicker)}
                    </span>
                  </div>
                  <h2
                    id={`${section.id}-title`}
                    className="font-headline-lg text-headline-lg tracking-tight text-primary md:text-headline-xl"
                  >
                    {fill(section.title)}
                  </h2>
                  <div className="flex max-w-4xl flex-col gap-space-md">
                    {section.blocks.map((block, i) => (
                      <Block key={i} block={block} fill={fill} contact={contact} tableHint={t('tableScrollHint')} />
                    ))}
                  </div>
                </section>
              )
            })}

            <div className="flex flex-col items-start justify-between gap-space-md border-t border-outline-variant/40 pt-space-lg sm:flex-row sm:items-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t('alsoRead')}:{' '}
                <Link href={doc.related.href} className={LINK}>
                  {doc.related.label}
                </Link>
              </p>
              <a
                href="#top"
                className="tap-target relative inline-flex items-center gap-space-xs rounded font-label-lg text-label-lg text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icon name="arrow_upward" className="text-base" />
                {t('backToTop')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
