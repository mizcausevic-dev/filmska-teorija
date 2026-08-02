# Filmska Teorija

Filmska Teorija is a source-backed film theory learning workbench. User journey: pick a theory module, add media URLs, annotate a scene, compare theoretical lenses, inspect the knowledge graph, quiz the glossary, and keep local research notes.

## What It Includes

- Interactive Theory Workbench with media URL slots and synchronized annotation prompts.
- Film Lens Simulator for feminist, Marxist, psychoanalytic, queer, cognitive, and apparatus readings.
- Three.js Concept Map & Knowledge Graph covering every requested sub-area.
- Visual History Timeline with links back into source modules.
- Scene Breakdown & Tagging Tool stored locally in browser localStorage.
- Theory vs. Practice prompts for cinematography, digital cinema, 3D film, narrative film, and invisible auditor.
- Glossary & Quiz engine using source extracts.
- Periodical & Paper Reader queue for user-added research URLs.
- Essay & Hypothesis Partner that checks local outline text against covered source lenses.
- Blog & Study Notes placeholders, AdSense Inspector slots, social sharing, favicon, policy pages, schema, sitemap, robots.txt, and llm.txt.

## Source Posture

Core content is generated from the Wikipedia API using `scripts/fetch-wikipedia-sources.mjs` and stored in `src/data/wikipediaSources.json`. The app preserves requested module labels and records redirects, including:

- `Cognitive film theory` redirects to `Cognitivism (aesthetics)`.
- `Screen theory` redirects to `Marxist film theory`.

Wikipedia text is attributed under the Creative Commons Attribution-ShareAlike License 4.0 unless otherwise noted. User-entered media, scene tags, reader links, and essay notes stay local to the browser in this static build.

## Local Development

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4179
```

Local preview used during QA: `http://127.0.0.1:4179/`

## QA

```bash
npm run qa
```

The QA script runs source refresh, Oxlint, TypeScript/Vite production build, and Playwright smoke checks. Screenshots are written to `docs/qa/`.

Current note: the production build emits a Vite chunk-size warning because Three.js is included for the interactive graph.

## Configuration

`VITE_GA_MEASUREMENT_ID` is optional. GA4 is inactive when the value is unset.

AdSense is represented only by visible placeholder slots. No publisher ID is configured.

## Deployment

GitHub Pages is configured in `.github/workflows/deploy-pages.yml`. The workflow builds with `GITHUB_PAGES=true`, which sets the Vite base path to `/filmska-teorija/`.
