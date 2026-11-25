/**
 * Client-side Zod schemas use *message keys* instead of English text so errors can be translated:
 * `'required'`, `'email'`, or `'key:value'` for keys with a parameter (e.g. `'tooLong:120'`).
 * <Field> translates them with `common.form.validation.<key>`; anything else (e.g. a message returned by the API)
 * is shown verbatim.
 */
export const VALIDATION_KEYS = [
  'required',
  'nameTooShort',
  'tooShort',
  'tooLong',
  'email',
  'phone',
  'phoneCountryCode',
  'integer',
  'min',
  'max',
  'date',
  'month',
  'dateOrder',
  'datePast',
  'partySolo',
  'partyCouple',
  'partyFamily',
  'partyGroup',
  'tooMany',
  'fileTooLarge',
  'fileType',
  'reviewTooShort',
  'rating',
  'country',
  'invalid',
] as const

export type ValidationKey = (typeof VALIDATION_KEYS)[number]

/** Which ICU argument the numeric parameter feeds (tooLong:120 → { max: 120 }). */
const PARAM_NAME: Partial<Record<ValidationKey, 'min' | 'max'>> = {
  tooShort: 'min',
  tooLong: 'max',
  min: 'min',
  max: 'max',
  tooMany: 'max',
}

export interface ParsedValidationMessage {
  key: ValidationKey
  values: { min?: number; max?: number }
}

/** 'tooLong:120' → { key: 'tooLong', values: { max: 120 } }; non-keys → null. */
export function parseValidationMessage(message: string | undefined | null): ParsedValidationMessage | null {
  if (!message) return null
  const [rawKey, rawParam] = message.split(':')
  if (!(VALIDATION_KEYS as readonly string[]).includes(rawKey ?? '')) return null
  const key = rawKey as ValidationKey
  const param = PARAM_NAME[key]
  const n = rawParam !== undefined ? Number(rawParam) : NaN
  return { key, values: param && Number.isFinite(n) ? { [param]: n } : {} }
}

/** Builds a message key with a parameter: msg('tooLong', 120) → 'tooLong:120'. */
export const msg = (key: ValidationKey, param?: number): string => (param === undefined ? key : `${key}:${param}`)
