'use client'

import { useState, type ComponentProps, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { controlClass, controlInvalidClass, FieldShell } from './FieldShell'

export interface PasswordFieldProps extends Omit<ComponentProps<'input'>, 'type' | 'size'> {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  fieldClassName?: string
}

/** Password input with a show/hide toggle (aria-pressed), wired to FieldShell. */
export function PasswordField({ label, hint, error, required, id, className, fieldClassName, ...input }: PasswordFieldProps) {
  const t = useTranslations('admin.kit.password')
  const [visible, setVisible] = useState(false)
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} id={id} className={fieldClassName}>
      {({ id: controlId, describedBy, invalid }) => (
        <div className="relative">
          <input
            id={controlId}
            type={visible ? 'text' : 'password'}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            spellCheck={false}
            autoCapitalize="off"
            {...input}
            className={cn(controlClass, 'pr-11', invalid && controlInvalidClass, className)}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? t('hide') : t('show')}
            title={visible ? t('hide') : t('show')}
            className="absolute right-1 top-1/2 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name={visible ? 'visibility_off' : 'visibility'} className="text-[20px]" />
          </button>
        </div>
      )}
    </FieldShell>
  )
}
