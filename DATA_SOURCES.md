# Australia data sources

## Boundaries

- Source: https://github.com/thomjoy/aus-lga/blob/master/data/aus_lga.json
- 565 features identified by `LGA_CODE11`, `LGA_NAME11` and `STATE_CODE`.
- Historical 2011 local-government-area snapshot. Modern council mergers, renamings and suburb boundaries are not represented.
- Upstream repository supplies an MIT licence. The complete notice, source commit and original file SHA-256 are included in `public/data/LICENSE-DATA.txt`.
- Processing: repaired invalid geometry where required, retained feature geometry, assigned IDs `au:lga:<LGA_CODE11>`, computed bounding boxes and interior label anchors, added Korean aliases, and dissolved local features into state outlines. Display coordinates use longitude/latitude (WGS84).
- `public/data/regions.json`: local-region metadata; `regions.geojson`: selectable geometry; `states.geojson`: derived state outlines; `src/data/states.json`: state-label anchors.
- The geometry-only 2025 file evaluated during development had no region names/IDs and is not used. geoBoundaries downloads blocked by network policy are not used.

## Travel ideas

`src/data/travel-guides.json` contains 50 starter places in eight state guides, with an additional guide for other territories. Coordinates were used during preparation to associate places with an LGA polygon (nearest matching state polygon where a simplified coastline did not contain the point). These places are not an exhaustive tourism database.

Source links point to each state/territory tourism authority: Western Australia, Visit NSW, Visit Victoria, Queensland, South Australia, Discover Tasmania, Northern Territory and Visit Canberra. Descriptions are short editorial themes; current access, opening hours, prices and road conditions must be checked with official visitor information.

## Photograph and home base

`public/images/perth-friend.jpg` is the photograph provided in this conversation. CSS clips the original image to display the left person's face. It is used only in the home-base marker/card and related dialog. Central Perth is an approximate default reference, not a location extracted from the photograph or a confirmed private address. User-supplied coordinates stay in localStorage.

## Languages

`src/data/en.json` contains English UI strings and names. `src/i18n.ts` supplies a subscribed language preference and template translation. Personal notes and custom names are kept as entered. Korean place aliases are editorial transliterations; official English names are available in both search modes.

## Developer contact image

`public/images/developer-contact.jpg` is the additional photograph supplied in this conversation. It is stored unchanged and shown without cropping in the developer-contact dialog, alongside the requested Korean copy. This is a presentation-only contact screen; no DM account, external messaging integration or automatic submission has been configured. The map/data information remains accessible through a link in this dialog.
