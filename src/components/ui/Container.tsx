import type { ComponentPropsWithoutRef, ElementType } from 'react'
import { cn } from '@/lib/utils'

type ContainerProps<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>

/** Stitch page container: max 1440px, side margins 1.5rem / 3rem (md) / 5rem (lg). */
export function Container<T extends ElementType = 'div'>({ as, className, ...rest }: ContainerProps<T>) {
  const Component: ElementType = as ?? 'div'
  return (
    <Component
      className={cn('mx-auto w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg', className)}
      {...rest}
    />
  )
}
