import { useTranslations } from 'next-intl'

/** Visually hidden until focused; jumps to <main id="main-content">. */
export function SkipLink() {
  const t = useTranslations('common.a11y')
  return (
    <a
      href="#main-content"
      className="sr-only-focusable fixed left-space-md top-space-md z-[100] rounded-lg bg-primary px-space-md py-space-sm font-label-lg text-label-lg text-on-primary shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
    >
      {t('skipToContent')}
    </a>
  )
}
