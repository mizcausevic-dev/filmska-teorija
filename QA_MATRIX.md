# QA Matrix

## Commands Run

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run source:refresh` | Passed | Wrote 24 source-backed pages to `src/data/wikipediaSources.json`. |
| `npm run lint` | Passed | Oxlint completed with no reported issues. |
| `npm run build` | Passed | TypeScript and Vite production build completed. |
| `npm run smoke` | Passed | Playwright ran desktop and mobile smoke checks. |
| `npm run qa` | Passed | Source refresh, lint, build, and smoke all completed. |
| Local HTTP preview | Passed | `Invoke-WebRequest http://127.0.0.1:4179/` returned HTTP 200. |

## Browser Checks

| Surface | Coverage |
| --- | --- |
| Desktop workbench | H1/source load, no horizontal overflow, graph canvas nonblank pixel check, module switch, media URL save, scene tag add, essay panel, screenshot capture. |
| Mobile workbench | Mobile module drawer, module switch, no horizontal overflow, screenshot capture. |
| Visual QA | Compared generated concept with desktop and mobile screenshots using `view_image`; repaired mobile annotation overlap and sidebar module-list collision. |

## Screenshot Evidence

- `docs/qa/desktop-initial.png`
- `docs/qa/desktop-viewport.png`
- `docs/qa/desktop-workbench.png`
- `docs/qa/mobile-initial.png`
- `docs/qa/mobile-viewport.png`
- `docs/qa/mobile-workbench.png`

## Known Residual Risk

- Vite reports a chunk-size warning because Three.js is included in the initial bundle. Future optimization should lazy-load the graph.
- Embedded third-party media behavior depends on the supplied URL and the provider's frame policy.
- GA4 and AdSense are integration placeholders until real IDs are supplied and consent handling is configured.
