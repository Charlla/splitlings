/**
 * Server-rendered JSON-LD <script>. Output lands in the initial HTML so search
 * engines and LLM fetchers can read structured data without executing JS.
 */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
