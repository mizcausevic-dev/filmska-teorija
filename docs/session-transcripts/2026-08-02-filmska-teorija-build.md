# Filmska Teorija Build Transcript

Date: 2026-08-02

## User Request

The user asked to visualize and build an interactive web app called Filmska Teorija from the Film Theory Wikipedia resource and all listed sub-areas. Requirements included local preview first, GitHub deployment, no horizontal menus, media URL forms for images/videos/podcasts, AdSense placeholder slots, responsive web/mobile behavior, social sharing, real utility, and no fabricated content or shortcuts.

## Assistant-visible Build Notes

- Confirmed the current starting folder was not a Git repository and created the project under `C:\Users\chaus\dev\repos\filmska-teorija`.
- Used the frontend app builder and image generation guidance to create a primary product UI concept.
- Generated a design concept showing a graphite/paper film-theory workbench with vertical navigation, source inspector, media workbench, timeline, graph, Media URLs, and AdSense Inspector.
- Scaffolded a React, TypeScript, and Vite app.
- Added a Wikipedia API source fetcher for the requested module list.
- Preserved redirected source labels, including `Cognitive film theory` to `Cognitivism (aesthetics)` and `Screen theory` to `Marxist film theory`.
- Built the app shell, source-backed module browser, media URL manager, synchronized annotation prompts, lens simulator, Three.js graph, visual timeline, scene breakdown board, glossary quiz, reader queue, local essay partner, blog/study note placeholders, and AdSense Inspector.
- Added privacy, terms, `llm.txt`, robots, sitemap, favicon, schema metadata, optional GA4 hook, and GitHub Pages workflow.
- Ran QA and fixed issues discovered in browser checks: duplicate select options, overly broad test locators, WebGL canvas verification, mobile annotation overlap, and sidebar module-list collision.
- Started local preview at `http://127.0.0.1:4179/`.

## Verification Summary

- `npm run qa` completed successfully.
- Local HTTP preview returned HTTP 200.
- Browser screenshots were captured in `docs/qa/`.
- Remaining note: the production build emits a chunk-size warning because Three.js is bundled in the initial app.
