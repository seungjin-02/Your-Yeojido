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

Map geometry, labels and the user-provided friend photograph are served locally. There is no geocoding, paid map API or account requirement. Records, language and the home-base location are stored in this browser. The home-base coordinates and language preference use separate localStorage keys; visit backup exports currently contain visits, places, categories and colours.

## Map detail and reference point

The map uses **565 LGA polygons from a 2011 snapshot**, including 139 in Western Australia. These are real historical local-government areas, not every modern suburb or postcode. Later council mergers and name changes are not reflected. For example, historical council names around Sydney remain in this snapshot. Read `DATA_SOURCES.md` and `public/data/LICENSE-DATA.txt` before refreshing the dataset.

The initial camera opens around Perth. The original photograph is clipped by CSS to display the left person's face in the marker and home-base card. The default marker is **central Perth (115.8613, -31.9523)**, not an inferred home address. The home-base dialog can store user-supplied coordinates and reset to central Perth. Region distances are approximate great-circle distances to a representative point, not driving distances.

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

`src/australia.test.ts` covers dataset and guide connections, detailed visits, preserved state-level backups, reference coordinates, distance calculations and localization. Original Korea-specific suites remain in the repository and still require a separate port; the full `npm test` suite is not green. Physical iPhone Safari and Android keyboard behaviour still require device testing. The earlier `scripts/mobile-smoke.cjs` describes the superseded eight-state dataset; use `detailed-smoke.cjs` for current checks.

## GitHub Pages

The GitHub Actions workflow builds with the repository-specific base path and deploys the static site using the official Pages actions. In the repository's **Settings → Pages**, choose **GitHub Actions** as the source. Pushes to `main` then run the Australian data validation, current Australia test suite, production build and deployment. The workflow can also be started with **Actions → Build and deploy GitHub Pages → Run workflow**.
