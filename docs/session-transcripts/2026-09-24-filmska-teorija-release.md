# Filmska Teorija release conversation

Selected visible messages from the 2026-09-24 release turn. This is a handoff excerpt, not a complete export of earlier project conversations. Tool output, hidden context, and secrets are excluded.

## User

Positioning sounds good. Proceed with "What Must Be Addressed": fix essay persistence, the default lens, and misleading annotation times; deepen the editorial product and graph provenance; separate Wikipedia refresh from QA and gate Pages deployment; make authored modules crawlable and the graph keyboard-accessible and lazy-loaded.

## Assistant updates

- "Miz, the deterministic QA run passes the behavior checks, but lint found one missing effect dependency. I’m fixing that before the release check, then I’ll test the production Pages path and the live deployment separately."
- "The new release now has distinct module entry pages, with only the three cited scene-study routes submitted for indexing. I’m checking the GitHub Pages subpath build next; that catches broken assets and deep links that a root-path dev server would miss."
- "The production-style preview loads Auteur correctly at desktop, tablet, and phone widths: no script failures or horizontal overflow, and the canonical URL follows the module route. I’m doing the final dependency/diff review now, then I’ll record the release evidence and publish."
- "Final QA is clean: validation, lint, build, and 10 browser checks pass; two checks are deliberately desktop- or mobile-only. I also compared the Wikipedia registry hash before and after `npm run qa`: it stayed unchanged. I’m doing the last Pages-base rebuild and release review before pushing."

## Handoff

The dated acceptance record is `QA_MATRIX.md`. GitHub Pages publication and live verification remain release tasks until recorded there.
