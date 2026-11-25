import { proposalSchema } from '@/lib/validation/proposal'

/**
 * Client-side check of an RFP attachment with the shared schema rules (PDF or DOCX, ≤ 5 MB).
 * Returns a validation key ('fileType' | 'fileTooLarge' | 'invalid') or null when the file is fine.
 * A wrong type wins over the size so a 20 MB .exe gets the more useful message.
 */
export function attachmentProblem(file: File): string | null {
  const result = proposalSchema.shape.attachment.safeParse(file)
  if (result.success) return null
  const messages = result.error.issues.map((issue) => issue.message)
  return messages.includes('fileType') ? 'fileType' : (messages[0] ?? 'invalid')
}

/** 2 400 000 → "2.3 MB", 595 → "1 kB" (locale-aware). */
export function formatFileSize(bytes: number, locale: string): string {
  const mb = bytes >= 1024 * 1024
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: mb ? 'megabyte' : 'kilobyte',
    maximumFractionDigits: mb ? 1 : 0,
  }).format(mb ? bytes / (1024 * 1024) : Math.max(1, Math.round(bytes / 1024)))
}
