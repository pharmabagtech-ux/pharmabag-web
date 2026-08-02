/**
 * Renders a JSON-LD graph into the document.
 *
 * Server component on purpose: the script must be present in the initial HTML
 * response. Anything injected after hydration is invisible to Bingbot,
 * PerplexityBot, ClaudeBot and GPTBot, none of which execute JavaScript —
 * which is precisely the audience this whole effort is aimed at.
 *
 * `dangerouslySetInnerHTML` is the documented way to emit JSON-LD in React;
 * the payload is machine-generated from `lib/seo/schema.ts` (never from raw
 * user input) and `<` is escaped so a stray value cannot break out of the
 * script element.
 */
export default function JsonLd({ json }: { json: string }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }}
    />
  );
}
