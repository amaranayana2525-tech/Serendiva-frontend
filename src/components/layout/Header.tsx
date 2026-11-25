'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import logo from '../../../public/brand/serendiva-logo-256.png'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileNav } from './MobileNav'
import { isActivePath, PRIMARY_NAV } from './nav'

export interface HeaderProps {
  /**
   * Locale-less paths whose hero sits under a transparent header (white text) until the page is scrolled.
   * The home page is included by default; its hero must start at the very top (`-mt-20`, as in Stitch).
   */
  overlayOnPaths?: readonly string[]
}

/** Fixed Stitch header: logo + brand, 8 nav links (xl+), language pill, "Plan My Trip", guide avatar, mobile menu. */
export function Header({ overlayOnPaths = ['/'] }: HeaderProps) {
  const t = useTranslations('common')
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const overlay = overlayOnPaths.includes(pathname) && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      data-site-header=""
      data-overlay={overlay ? 'true' : undefined}
      className={cn(
        'fixed left-0 right-0 top-0 z-50 w-full transition-all duration-300',
        overlay ? 'bg-transparent shadow-none' : 'bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl',
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-space-sm px-margin sm:gap-gutter md:px-margin-md lg:px-margin-lg">
        <Link
          href="/"
          aria-label={t('brand.homeLink')}
          className="flex shrink-0 items-center gap-space-md rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Image
            src={logo}
            alt=""
            width={48}
            height={48}
            loading="eager"
            className="h-12 w-12 shrink-0 rounded-full object-contain shadow-sm"
          />
          <div className="flex flex-col">
            <span
              className={cn(
                'font-headline-sm text-headline-sm font-bold tracking-tight transition-colors',
                overlay ? 'text-surface' : 'text-primary',
              )}
            >
              {t('brand.name')}
            </span>
            <span
              className={cn(
                'hidden font-label-md text-label-md uppercase tracking-widest transition-colors sm:inline-block',
                overlay ? 'text-surface/80' : 'text-on-surface-variant',
              )}
            >
              {t('brand.tagline')}
            </span>
          </div>
        </Link>

        <nav aria-label={t('header.primaryNav')} className="hidden items-center gap-space-lg xl:flex">
          {PRIMARY_NAV.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4',
                  active
                    ? cn('text-base font-semibold', overlay ? 'text-surface' : 'text-primary')
                    : cn(
                        'font-body-md text-body-md',
                        overlay
                          ? 'text-surface/85 hover:text-surface'
                          : 'text-on-surface-variant hover:text-on-surface',
                      ),
                )}
              >
                {t(`nav.${item.key}`)}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-space-sm sm:gap-space-md">
          <LanguageSwitcher overlay={overlay} />
          <Link
            href="/contact"
            className="tap-target relative hidden items-center justify-center rounded-lg bg-secondary px-space-md py-space-sm font-label-lg text-label-lg text-on-secondary shadow-[0_4px_16px_rgba(156,68,30,0.2)] transition-all hover:bg-on-secondary-fixed-variant hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-[375px]:inline-flex sm:px-space-lg"
          >
            {t('header.planMyTrip')}
          </Link>
          {/* Stitch shows a guide avatar here; there are no visitor accounts, so it introduces the guide instead. */}
          <Link
            href="/about"
            aria-label={t('header.meetGuide')}
            title={t('header.meetGuide')}
            className="tap-target relative hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:flex"
          >
            <Icon name="person" className="text-[18px] text-on-primary" />
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
