# Project Summary: Filmska Teorija

## Build

Filmska Teorija is a React, Vite, TypeScript app for film theory study and scene analysis. It converts the supplied film theory resource list into a vertical, no-horizontal-menu workbench with media slots, source-backed modules, a Three.js concept graph, timeline, lens comparison, local boards, glossary quiz, paper reader, and essay support.

## Implemented Surface

- All 24 requested film theory and adjacent modules are loaded from `src/data/wikipediaSources.json`, with ten original study notes and three source-cited scene readings.
- `scripts/fetch-wikipedia-sources.mjs` refreshes source data from the Wikipedia API.
- The left rail is a vertical module browser with search and source coverage counts.
- The main workbench supports URL-based image, video, audio, and podcast embeds.
- Media URLs, scene breakdown tags, reader links, and per-module essay text persist in browser localStorage. They do not imply a live backend or cross-device sync.
- Direct HTML5 video uses actual playback time for capture and seeking. Third-party embeds use manual timecodes.
- Static module entry pages provide unique metadata and crawlable links. Only the three worked-analysis routes are indexed; other routes are noindex pending editorial depth.
- The 3D graph loads on demand and has a sourced HTML relationship list usable without WebGL.
- AdSense Inspector shows placeholder slots only.
- GA4 hook is present but inactive without `VITE_GA_MEASUREMENT_ID`.
- Static discovery and policy files live under `public/`: `privacy.html`, `terms.html`, `llm.txt`, `robots.txt`, and `sitemap.xml`.

## Source And Claim Boundaries

- Wikipedia extracts remain the source registry. Original notes and scene interpretations are separate, with specific film, institution, publication, and theory source links.
- Redirects are visible in the UI and data registry.
- Community debate and AI essay partner remain local workflow scaffolding, not a live community or live model call.
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
