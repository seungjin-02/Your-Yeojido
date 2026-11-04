# Australia atlas verification

Verified in Chromium with mobile/touch emulation, using the bundled system Chromium and Playwright installed outside the application dependencies.

- Production build: passed (`npm run build`). Vite reports the existing large map-library chunk warning.
- Current Australia tests: 10 passed (`npx vitest run src/australia.test.ts`). These cover all 565 boundary/region links, nine disjoint state groups, 50 current starter places, detailed visit persistence and colouring, southern seasons, state-backup migration with bookmarks/edits/classifications preserved, unrelated-backup rejection, the Perth reference point, distance validation and both UI languages.
- Bundled data validation: passed (`npm run data:prepare`). No Korean download or rewrite occurs.
- Browser workflow: passed at 320×568, 390×844, 430×932, 667×375, 844×390 and 1440×900. Runs were scoped across portrait, landscape and desktop invocations of `scripts/detailed-smoke.cjs`.
- Browser operations: WebGL rendering, original friend photo marker, home-base editing/reset and reload persistence, bilingual region search, language persistence without rewriting notes/records, bookmarks, visit creation/editing, statistics, collections, achievements, state guides, continental overview and return to the reference point. No page errors were observed in the passing runs.
- Additional English dialog checks: colour settings, map-data information and custom-place creation/save passed.
- Visual checks: region names avoid collisions and the photo marker; desktop state lists fit inside the workspace; small-screen and landscape memo fields stay above the sticky save controls.

Re-run instructions and environment variables are in README.md. Screenshots and combined results are under ignored `work/detailed-validation/`.

## Limits

The original Korea-specific test suites still use Korean region IDs and fixtures and have not been ported; the full `npm test` command is not green. Current tests are explicitly scoped above. Physical Safari/iOS/Android testing has not been performed. Boundaries are the historical 2011 LGA snapshot, not contemporary suburb or postcode boundaries. Central Perth is an approximate initial reference rather than a confirmed home address; region distances are straight-line estimates. Home-base coordinates and language are separate browser settings and are not currently included in visit backup exports.

## Latest changes: named base, national camera and travel collections

- Production build and 18 current Australia unit/integration tests pass.
- `scripts/base-search-smoke.cjs`: passed at 320×568, 390×844, 667×375 and 1440×900. Verified An Junha naming, national initial camera with retained photo marker, Korean/English region lookup, saved-region metadata, reload persistence, movement on save, explicit detailed-address queries, service failure handling and manual-coordinate fallback. Address responses are mocked; live-provider availability is not claimed.
- `scripts/journey-smoke.cjs`: passed at the same four sizes using populated visit and classification data. Verified travel postcards, personal notes, search, add-record action, 77 stamps, earned-status filtering, sorting, translated achievement copy and preservation of original notes.
- Achievement tests verify 24 new definitions, distinct regions rather than duplicate visits, exclusion of broad legacy states, consecutive dates across year boundaries, coverage thresholds and recalculation after deletions.
- Images and the base location are separate: opening/reloading shows the national map; the photo marker stays at the default Perth coordinates until the user saves another reference point.
