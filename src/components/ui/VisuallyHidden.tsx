import type { ComponentPropsWithoutRef, ElementType } from 'react'

type VisuallyHiddenProps<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>

/** Content for screen readers only (Tailwind `sr-only`). */
export function VisuallyHidden<T extends ElementType = 'span'>({ as, className, ...rest }: VisuallyHiddenProps<T>) {
  const Component: ElementType = as ?? 'span'
  return <Component className={className ? `sr-only ${className}` : 'sr-only'} {...rest} />
}
