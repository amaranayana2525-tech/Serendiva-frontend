/** Renders schema.org structured data. `<` is escaped so content can never close the script tag (XSS-safe). */
export function JsonLd({ data }: { data: object | object[] | null | undefined }) {
  if (!data || (Array.isArray(data) && data.length === 0)) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
