'use client'

import type { ComponentProps } from 'react'
import { useTranslations } from 'next-intl'
import { useWhatsAppHref, type UseWhatsAppHrefOptions } from './SiteSettingsProvider'

export type WhatsAppLinkProps = Omit<ComponentProps<'a'>, 'href' | 'target' | 'rel'> & UseWhatsAppHrefOptions

/**
 * <a> to WhatsApp with the guide's number (CMS settings) and a localised pre-filled message.
 * Usable from server components: <WhatsAppLink tourTitle={tour.title} className="…">Inquire</WhatsAppLink>
 */
export function WhatsAppLink({
  page,
  tourTitle,
  destinationName,
  corporate,
  ignorePageContext,
  children,
  ...rest
}: WhatsAppLinkProps) {
  const t = useTranslations('common.a11y')
  const href = useWhatsAppHref({ page, tourTitle, destinationName, corporate, ignorePageContext })
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      <span className="sr-only"> {t('opensInNewTab')}</span>
    </a>
  )
}
