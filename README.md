# Filmska Teorija

Filmska Teorija is a source-backed film theory learning workbench. User journey: pick a theory module, add media URLs, mark observable scene evidence, compare theoretical lenses, inspect cited knowledge paths, quiz the glossary, and keep local research notes.

## What It Includes

- Interactive Theory Workbench with media URL slots, study prompts, and saved tags that seek to real playback time for direct HTML5 video. Third-party iframe players use manual timecodes.
- Film Lens Simulator for feminist, Marxist, psychoanalytic, queer, cognitive, and apparatus readings.
- On-demand Three.js Concept Map with all requested modules and a keyboard-accessible list of sourced theorist, publication, and concept links.
- Visual History Timeline with links back into source modules.
- Scene Breakdown & Tagging Tool stored locally in browser localStorage.
- Theory vs. Practice prompts for cinematography, digital cinema, 3D film, narrative film, and invisible auditor.
- Glossary & Quiz engine using source extracts.
- Periodical & Paper Reader queue for user-added research URLs.
- Essay & Hypothesis Partner that checks local outline text against covered source lenses.
- Ten original study notes for short or key modules, three worked scene readings with citations, Blog & Study Notes prompts, AdSense Inspector placeholders, social sharing, and policy/discovery pages.

## Source Posture

Core content is generated from the Wikipedia API using `scripts/fetch-wikipedia-sources.mjs` and stored in `src/data/wikipediaSources.json`. The app preserves requested module labels and records redirects, including:

- `Cognitive film theory` redirects to `Cognitivism (aesthetics)`.
- `Screen theory` redirects to `Marxist film theory`.

Wikipedia text is attributed under the Creative Commons Attribution-ShareAlike License 4.0 unless otherwise noted. User-entered media, scene tags, reader links, and essay notes stay local to the browser in this static build.

Editorial study notes live in `src/data/editorial.json`; cited scene readings live in `src/data/caseStudies.ts`; named knowledge links live in `src/data/knowledge.ts`. Interpretations are labeled as Filmska readings. The site indexes only the three module pages with worked scene readings. Other module routes remain available but carry `noindex` until they have sufficient original analysis.

## Local Development

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 4179
```

Local preview used during QA: `http://127.0.0.1:4179/`

## QA

```bash
npm run qa
```

If port `4179` is already serving another local app, run smoke checks on a clean port:

```powershell
$env:PLAYWRIGHT_PORT='4187'; npm run smoke; Remove-Item Env:PLAYWRIGHT_PORT
```

The QA script validates the checked-in source registry, runs Oxlint, builds the TypeScript/Vite multipage site, and runs Playwright smoke checks. It does not fetch Wikipedia or alter source extracts. New screenshots go to Playwright's ignored `test-results/` directory; `docs/qa/` holds historical snapshots.

Refresh source data deliberately with `npm run source:refresh`, review the JSON diff and redirects, then run QA. Use Node.js 24. The graph is loaded only on request; its separate Three.js chunk still emits a size warning.

## Configuration

`VITE_GA_MEASUREMENT_ID` is optional. GA4 is inactive when the value is unset.

AdSense is represented only by visible placeholder slots. No publisher ID is configured.

## Deployment

GitHub Pages is configured in `.github/workflows/deploy-pages.yml`. The workflow runs lint, build, and Playwright smoke before artifact upload. It builds with `GITHUB_PAGES=true`, which sets the Vite base path to `/filmska-teorija/`. The build generates static HTML for all 24 routes and a sitemap listing the three worked-analysis pages.
