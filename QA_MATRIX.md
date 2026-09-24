# QA Matrix

## 2026-09-24 Release Candidate

| Check | Status | Evidence |
| --- | --- | --- |
| `npm run source:refresh` | Executed | 24 extracts and source URLs retained; per-page related-link import now yields 22 modules with links and 186 sourced link edges. Refresh is separate from QA. |
| `npm run qa` | Verified locally | Source validator: 24 modules and 10 editorial notes. Lint clean. Build passed. Playwright: 10 passed, 2 project-specific skips. Wikipedia registry hash unchanged. |
| `GITHUB_PAGES=true npm run build` | Verified locally | Generated 24 module entry pages and a 6-URL sitemap. Initial JS: 283.33 kB; on-demand graph chunk: 533.10 kB. |
| Pages-base preview | Verified locally | HTTP 200 for root, Auteur route, and JavaScript asset at `/filmska-teorija/`; asset served as `text/javascript`. |
| Chromium responsive pass | Verified locally | Auteur route loaded at 1440x900, 820x1180, and 390x844; correct title/canonical, no page errors, no horizontal overflow. Screenshots in ignored `test-results/production-*.png`. |
| `npm audit --audit-level=high` | Verified locally | Exit 0; reported zero vulnerabilities. |
| `git diff --check` | Verified locally | Exit 0. |
| GitHub Pages deployment | Pending | Verify workflow conclusion and live routes after push. |

## Browser Coverage

Playwright covers essay persistence and per-module isolation, selected lens, abbreviation-safe summaries, HTML5 video clock and tag seeking with a synthetic clock, sourced keyboard graph navigation, authored-page metadata and citations, sitemap/noindex separation, mobile drawer, and horizontal overflow. The production-base pass additionally checked script delivery, errors, and three viewport sizes.

## Release Limits

- Three modules have cited worked scene readings and are eligible for indexing. The other 21 routes are intentionally `noindex` until they have comparable editorial depth. Sitemap inclusion is not a ranking or indexing guarantee.
- Direct HTML5 video can synchronize tags to playback. Third-party iframe media remains manually timed because its playback clock is not available through the current integration.
- The 3D graph is lazy-loaded and keyboard access is available through an HTML relationship list, but the on-demand Three.js chunk still triggers a Vite size warning.
- Browser-local drafts can be removed by clearing site storage. There is no account sync, public community board, live AI partner, active GA4, or AdSense publisher integration.
- The media clock test uses a synthetic browser media clock; it does not prove behavior of a third-party hosted video.

## Historical Baseline

The previous QA record covered the original single-page prototype and is superseded by this dated release-candidate record.
