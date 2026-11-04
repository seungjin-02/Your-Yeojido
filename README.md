# Your Yeojido · Australia

A React travel atlas based on `seungjin-02/My-Yeojido`, with 565 selectable Australian local-government areas, 50 starter places, Korean/English UI and a personal Perth home base. Mobile uses a central record action, expandable map controls, bottom sheets, safe-area spacing and keyboard-aware forms.

## Develop

Node 24 (`.node-version`).

```sh
npm ci
npm run dev
npm run build
npx vitest run src/australia.test.ts
```

Map geometry, labels and the user-provided friend photograph are served locally. Local region-name lookup works offline. Optional detailed location/address search uses OpenStreetMap Nominatim only when its search button is pressed; no paid API key or account is required. Records, language and the home-base location are stored in this browser. The home-base coordinates and language preference use separate localStorage keys; visit backup exports currently contain visits, places, categories and colours.

## Map detail and reference point

The map uses **565 LGA polygons from a 2011 snapshot**, including 139 in Western Australia. These are real historical local-government areas, not every modern suburb or postcode. Later council mergers and name changes are not reflected. For example, historical council names around Sydney remain in this snapshot. Read `DATA_SOURCES.md` and `public/data/LICENSE-DATA.txt` before refreshing the dataset.

The initial camera shows all of mainland Australia and Tasmania. The An Junha photo marker remains at the saved home-base coordinates (central Perth by default). The original photograph is clipped by CSS to display the left person's face in the marker and home-base card. The default marker is **central Perth (115.8613, -31.9523)**, not an inferred home address. The home-base dialog can select a named local area in Korean or English, resolve a more detailed Australian location/address using an explicit online search, accept manual coordinates, and reset to central Perth. Selecting a region uses its representative interior point rather than an exact home address. Saving moves the marker and camera; reloading starts with the national overview while preserving the chosen base. Region distances are approximate great-circle distances to a representative point, not driving distances.

Search accepts Korean aliases and official English names in either language, supports state filtering, and initially orders results by distance from the home base. Further results load in batches. State colours and local boundaries remain distinct when zooming out; zooming in reveals local labels with a limit to avoid overcrowding.

## Existing records

The existing Australia storage key is retained. `australia-states-v1` backups migrate to `australia-lga-2011-v2` without deleting broad state visits, edited places, bookmarks or classifications. Broad state visits are kept in the journal and excluded from detailed-area progress; they are not expanded into hundreds of invented visits. Old built-in place IDs remain available for those records. A preserved state record can be edited to choose a specific new local area.

Language switching changes display text without rewriting personal notes or saved visit data. Regional IDs remain stable in both languages. Proper names without a Korean alias retain their official English name.

## Browser validation

Run with the Vite server started. Install browser test tools outside the application checkout:

```sh
npm install --prefix /tmp/yeojido-browser --no-package-lock playwright
PLAYWRIGHT_MODULE=/tmp/yeojido-browser/node_modules/playwright CHROMIUM_PATH=/usr/bin/chromium node scripts/detailed-smoke.cjs
```

Results and screenshots go to ignored `work/detailed-validation/`. The script covers 320×568, 390×844, 430×932, 667×375, 844×390 and 1440×900: map rendering, language changes and persistence, the photo marker, reference-point editing, bilingual search, bookmarks, visit creation/editing, unchanged personal notes, statistics, achievements, guides and return to the reference point. `TEST_WIDTHS=390` selects a single viewport.

`src/australia.test.ts` covers dataset and guide connections, detailed visits, preserved state-level backups, reference coordinates, location-search response validation, distance calculations, 77 achievement definitions and localization. Original Korea-specific suites remain in the repository and still require a separate port; the full `npm test` suite is not green. Physical iPhone Safari and Android keyboard behaviour still require device testing. The earlier `scripts/mobile-smoke.cjs` describes the superseded eight-state dataset; use `detailed-smoke.cjs` for current checks.

## GitHub Pages

The GitHub Actions workflow builds with the repository-specific base path and deploys the static site using the official Pages actions. In the repository's **Settings → Pages**, choose **GitHub Actions** as the source. Pushes to `main` then run the Australian data validation, current Australia test suite, production build and deployment. The workflow can also be started with **Actions → Build and deploy GitHub Pages → Run workflow**.

## Travel postcards and passport stamps

My places uses postcode-style travel cards with local notes, recent visit date, repeat count, categories and direct actions for classification, recording and map selection. Achievements use a travel-passport layout with 77 collectible stamps, progress, completion filtering, search and sorting. The 24 additional stamps cover named Perth areas, state exploration, east/west and north/south visits, consecutive travel dates, longer notes, personal places and map coverage. Progress recalculates from current records; broad legacy state visits never earn local-area stamps.

Additional browser checks:

```sh
PLAYWRIGHT_MODULE=/tmp/yeojido-browser/node_modules/playwright node scripts/base-search-smoke.cjs
PLAYWRIGHT_MODULE=/tmp/yeojido-browser/node_modules/playwright node scripts/journey-smoke.cjs
```

Both cover 320×568, 390×844, 667×375 and 1440×900. The detailed address provider is mocked in the deterministic browser checks to cover successful results, unavailable service and country filtering; these checks do not establish live Nominatim availability. Typing local region names sends no requests; only the explicit detailed-search button sends the entered query to that service. Results are approximate and should be checked before saving. Region metadata, manual coordinates and existing saved bases remain usable without that service.

## Dates and yearly statistics

Visit dates accept valid past and future calendar dates; there is no today-based maximum. The year selector includes all years represented by dated local-area records and the current year. Opening statistics starts with the most recently updated dated record's year. Adding or editing a dated record while statistics is open selects that record's year automatically. The monthly chart and annual highlights follow the selected year; the four cumulative metrics are explicitly labelled as all-time totals. Unknown dates and unresolved legacy state records stay outside monthly local-area totals.

`PLAYWRIGHT_MODULE=/tmp/yeojido-browser/node_modules/playwright node scripts/date-stats-smoke.cjs` checks future/past saves, leap dates, year selection, editing, reload persistence and translated month labels at four viewport sizes.

The reference-point toolbar retains its location subtitle and uses the shorter “기준점” label. The photo marker keeps its strong contrast at a compact size (52px on phones, 56px on desktop). Map panning is bounded around Australia, rather than exposing most of the world to the west. Boundary attribution is available from the More menu rather than as a map overlay.
