import type { ComponentProps } from 'react'
import { useTranslations } from 'next-intl'

/**
 * Spam trap required on every public form: `<Honeypot {...register('website')} />`.
 * Visually hidden + aria-hidden + tabIndex -1 + autoComplete off; bots fill it, the API silently drops the submission.
 */
export function Honeypot(props: Omit<ComponentProps<'input'>, 'type' | 'tabIndex' | 'autoComplete'>) {
  const t = useTranslations('common.form')
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
      <label>
        {t('honeypot')}
        <input type="text" tabIndex={-1} autoComplete="off" {...props} name={props.name ?? 'website'} />
      </label>
    </div>
  )
}
