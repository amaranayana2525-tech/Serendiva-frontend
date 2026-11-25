import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's default scale. Teach it the Stitch tokens so `text-body-md` (font size) and
 * `text-primary` (colour) — or `px-margin` and `px-4` — are recognised as separate/conflicting groups correctly.
 * Keep in sync with tailwind.config.ts.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'label-md',
        'label-lg',
        'caption',
        'body-md',
        'body-lg',
        'body-xl',
        'headline-sm',
        'headline-md',
        'headline-lg',
        'headline-lg-mobile',
        'headline-xl',
        'headline-xl-mobile',
        'display-lg',
        'display-lg-mobile',
      ],
      spacing: [
        'gutter',
        'gutter-lg',
        'margin',
        'margin-md',
        'margin-lg',
        'space-xs',
        'space-sm',
        'space-md',
        'space-lg',
        'space-xl',
        'space-2xl',
        'space-3xl',
      ],
    },
  },
})

/** Joins class names (clsx) and resolves Tailwind conflicts (later wins) with the Stitch token scale. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Escapes a string for safe use inside a RegExp. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Returns the initials of a name ("Julian Montgomery" → "JM"). */
export function initialsOf(name: string, max = 2): string {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, max)
}

/** Type guard that removes null/undefined (for `.filter(isDefined)`). */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/** Clamps a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
