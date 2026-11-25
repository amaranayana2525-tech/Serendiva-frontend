import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { publicEnv } from '@/lib/env'
import { isApiErrorBody, parseRetryAfter, toFieldErrors } from './errors'
import type {
  InquiryBody,
  InquiryResult,
  NewsletterSubscribeBody,
  NewsletterSubscribeResult,
  ProposalBody,
  ProposalResult,
  ReviewSubmissionBody,
  ReviewSubmissionResult,
} from './types'

/*
 * Browser-side form submissions. They POST directly to the API (NEXT_PUBLIC_API_URL, CORS) and never throw:
 * every outcome is a discriminated union the form can render.
 *
 *   const result = await submitInquiry(values)
 *   if (result.ok) showSuccess(result.data.reference)
 *   else if (result.kind === 'validation') applyFieldErrors(form.setError, result.fieldErrors)
 */

export type FormResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'validation'; fieldErrors: Record<string, string>; message: string }
  | { ok: false; kind: 'rate_limited'; retryAfterSeconds?: number }
  | { ok: false; kind: 'network' }
  | { ok: false; kind: 'server'; message: string }

export type FormFailure = Exclude<FormResult<unknown>, { ok: true }>

const TIMEOUT_MS = 15_000

/** Low-level POST used by the helpers below (exported for tests and future endpoints). */
export async function postToApi<T>(path: string, init: { body: BodyInit; json?: boolean }): Promise<FormResult<T>> {
  let response: Response
  try {
    response = await fetch(`${publicEnv.apiUrl}/api/v1${path}`, {
      method: 'POST',
      body: init.body,
      headers: init.json
        ? { 'content-type': 'application/json', accept: 'application/json' }
        : { accept: 'application/json' },
      credentials: 'omit',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    // TypeError (offline, DNS, CORS) or TimeoutError/AbortError
    return { ok: false, kind: 'network' }
  }

  const payload: unknown = await response.json().catch(() => null)

  if (response.ok) return { ok: true, data: (payload ?? {}) as T }

  const body = isApiErrorBody(payload) ? payload.error : undefined

  if (response.status === 429) {
    return { ok: false, kind: 'rate_limited', retryAfterSeconds: parseRetryAfter(response.headers.get('retry-after')) }
  }
  if (response.status === 413 || response.status === 415) {
    // Upload rejected by the API (size / type) — report it on the attachment field.
    return {
      ok: false,
      kind: 'validation',
      fieldErrors: { attachment: response.status === 413 ? 'fileTooLarge' : 'fileType' },
      message: body?.message ?? 'Invalid attachment',
    }
  }
  if (response.status === 400 || response.status === 422) {
    return {
      ok: false,
      kind: 'validation',
      fieldErrors: body?.code === 'VALIDATION_ERROR' ? toFieldErrors(body.details) : {},
      message: body?.message ?? 'Some fields are invalid',
    }
  }
  return { ok: false, kind: 'server', message: body?.message ?? `Unexpected response (${response.status})` }
}

const json = (value: unknown) => ({ body: JSON.stringify(value), json: true })

/** POST /inquiries — the multi-step contact form, tour/destination sidebar forms and the hero quick-inquiry bar. */
export function submitInquiry(body: InquiryBody): Promise<FormResult<InquiryResult>> {
  return postToApi<InquiryResult>('/inquiries', json(body))
}

/** Builds the multipart body for POST /corporate-proposals (repeats `logistics` per checked item). */
export function proposalFormData(input: ProposalBody): FormData {
  const fd = new FormData()
  const { logistics, attachment, ...fields } = input
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue
    fd.append(key, String(value))
  }
  for (const item of logistics) fd.append('logistics', item)
  if (attachment) fd.append('attachment', attachment, attachment.name)
  return fd
}

/** POST /corporate-proposals (multipart/form-data, optional PDF/DOCX ≤ 5 MB). Accepts the typed body or a ready FormData. */
export function submitProposal(input: ProposalBody | FormData): Promise<FormResult<ProposalResult>> {
  const body = input instanceof FormData ? input : proposalFormData(input)
  return postToApi<ProposalResult>('/corporate-proposals', { body })
}

/** POST /newsletter/subscribe — double opt-in: the API emails a confirmation link. */
export function subscribeNewsletter(body: NewsletterSubscribeBody): Promise<FormResult<NewsletterSubscribeResult>> {
  return postToApi<NewsletterSubscribeResult>('/newsletter/subscribe', json(body))
}

/** POST /reviews — saved as pending until the guide approves it. */
export function submitReview(body: ReviewSubmissionBody): Promise<FormResult<ReviewSubmissionResult>> {
  return postToApi<ReviewSubmissionResult>('/reviews', json(body))
}

/** Maps API field errors onto react-hook-form (`form.setError`). Fields the form doesn't have go to `root.server`. */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string>,
  knownFields: readonly Path<T>[],
): void {
  for (const [field, message] of Object.entries(fieldErrors)) {
    const known = (knownFields as readonly string[]).includes(field)
    if (known) setError(field as Path<T>, { type: 'server', message })
    else setError('root.server', { type: 'server', message })
  }
}
