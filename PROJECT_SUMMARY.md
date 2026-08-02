# Project Summary: Filmska Teorija

## Build

Filmska Teorija is a React, Vite, TypeScript app for film theory study and scene analysis. It converts the supplied film theory resource list into a vertical, no-horizontal-menu workbench with media slots, source-backed modules, a Three.js concept graph, timeline, lens comparison, local boards, glossary quiz, paper reader, and essay support.

## Implemented Surface

- All 24 requested film theory and adjacent modules are loaded from `src/data/wikipediaSources.json`.
- `scripts/fetch-wikipedia-sources.mjs` refreshes source data from the Wikipedia API.
- The left rail is a vertical module browser with search and source coverage counts.
- The main workbench supports URL-based image, video, audio, and podcast embeds.
- Media URLs, scene breakdown tags, reader links, and essay text are local-first. They do not imply a live backend.
- AdSense Inspector shows placeholder slots only.
- GA4 hook is present but inactive without `VITE_GA_MEASUREMENT_ID`.
- Static discovery and policy files live under `public/`: `privacy.html`, `terms.html`, `llm.txt`, `robots.txt`, and `sitemap.xml`.

## Source And Claim Boundaries

- Wikipedia extracts are the only preloaded theory content source.
- Redirects are visible in the UI and data registry.
- Community debate and AI essay partner are implemented as local workflow scaffolding, not as a live community or live model call.
- No AdSense publisher ID, GA4 property, account system, database, payment flow, or copyrighted film clip is bundled.

## Local Preview

Verified local HTTP preview:

```text
http://127.0.0.1:4179/
```

## Deploy Target

GitHub repository and Pages workflow target:

```text
https://github.com/mizcausevic-dev/filmska-teorija
https://mizcausevic-dev.github.io/filmska-teorija/
```
