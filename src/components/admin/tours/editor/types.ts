import type { AdminLocale, Translatable } from '@/lib/admin/translatable'
import type { EditorTab, L, TourForm } from './model'

/** Updates one form field; `clear` = error path prefixes to drop (defaults to the field name). */
export type UpdateField = <K extends keyof TourForm>(
  key: K,
  value: TourForm[K] | ((previous: TourForm[K]) => TourForm[K]),
  clear?: readonly string[],
) => void

/** Props every editor tab receives. */
export interface EditorTabProps {
  form: TourForm
  locale: AdminLocale
  errors: Record<string, string>
  update: UpdateField
  onJumpTab?: (tab: EditorTab) => void
}

/** TranslatableText → editing shape with all three locales. */
export const asL = (value: Translatable<string>): L => ({ en: value.en ?? '', zh: value.zh ?? '', de: value.de ?? '' })
