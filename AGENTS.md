<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Serendiva web — project rules

- Architecture and conventions: `README.md` (business rules: one personal guide, "I/my", **no prices/payments**; every page leads to an inquiry or WhatsApp).
- UI must match the Stitch export class-for-class. Use the Tailwind tokens (`text-body-md`, `px-margin`, `bg-surface-container` …) — never invent new colours.
- All user-facing static text lives in `src/messages/<locale>/<namespace>.json`; content text comes from the API (`src/lib/api/public.ts`).
- Icons: `<Icon name="…" />` (SVG sprite). New names are picked up by `npm run icons` (also runs on `predev`/`prebuild`).
- Images: always `<SmartImage>`; links: `Link` from `@/i18n/navigation` (never `next/link` for site routes).
- Before handing over: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
