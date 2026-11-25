# src/content — DEPRECATED fallback snapshot

All site content comes from the **serendiva-api** (`src/lib/api/public.ts`). This folder only holds an optional
JSON snapshot of the public API so local development keeps rendering when the API is not running.

- Generate / refresh: `npm run content:snapshot` (or `npm run content:snapshot -- http://localhost:4105`).
- Used automatically by `src/lib/api/public.ts` when the API is unreachable **in development**, or in any
  environment with `CONTENT_FALLBACK=true`. A warning is logged every time a fallback file is served.
- File names are the lookup keys used in `public.ts`: `settings.json`, `tours.json`, `tour.<slug>.json`,
  `destination.<slug>.json`, `blog.<slug>.json`, `faqs.<scope>.json`, `reviews-summary.json`, `sitemap-data.json` …
- English only, filters are ignored (the whole list is returned).
- **Never import these files anywhere else.** Do not edit them by hand — edit content in the admin panel.
- The JSON files are git-ignored-friendly snapshots; commit them only if your team wants an offline demo.
