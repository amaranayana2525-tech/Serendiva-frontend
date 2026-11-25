import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'
import { ICON_SPRITE_VERSION, type IconName } from './icon-names.generated'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  /** Material Symbols name (see icon-names.generated.ts). CMS-provided names are accepted too. */
  name: IconName | (string & {})
  /** Filled variant (Stitch `font-variation-settings: 'FILL' 1`). */
  filled?: boolean
  /** Accessible label → role="img". Omit for decorative icons (aria-hidden). */
  label?: string
}

/** Material Symbols icon from the SVG sprite. Size with text utilities (`text-sm`, `text-[18px]`), colour with `text-*`. */
export function Icon({ name, filled = false, label, className, ...rest }: IconProps) {
  const id = filled ? `${name}-fill` : name
  return (
    <svg
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
      className={cn('icon', className)}
      {...rest}
    >
      <use href={`/icons/sprite.svg?v=${ICON_SPRITE_VERSION}#${id}`} />
    </svg>
  )
}
