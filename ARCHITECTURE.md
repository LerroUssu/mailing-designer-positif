# Architecture — Mailing Designer Positif

Reference document for the builder app. `CLAUDE.md` is the short version loaded into every
session; this file is the long one, read it when you need detail.

---

## 1. What this repo is

A single-file **Design Component** (DC) that lets Positif Design assemble a marketing e-mail
from blocks and export it as paste-ready HTML for Brevo / Sarbacane / Mailchimp.

| file | role |
|---|---|
| `Mailings Positif Design V2.dc.html` | **the live app** — the only file you edit |
| `index.html` | **byte-identical copy** of V2; Vercel serves the site root from it |
| `Mailings Positif Design.dc.html` | V1 archive (the 7 showcase models). Do not edit. |
| `Mailings Positif Design-print.dc.html` | stale archive, still references Anton. Do not edit. |
| `versions/` | archives. Do not edit. |
| `assets/` | logos, SVG artwork, patterns |
| `preview-server.js` | tiny static server + `/__save-export` endpoint used for verification |
| `outputs/brevo-export/` | gitignored; where a verified export lands |

**Every edit must end with `cp "Mailings Positif Design V2.dc.html" index.html`.** If the two
drift, the deployed site is not what you tested.

## 2. DC anatomy

The file is one HTML document split at `<script type="text/x-dc">`:

- **Template half** — markup with `{{ dotted.path }}` holes, `<sc-if value="{{ x }}">`,
  `<sc-for list="{{ xs }}" as="y">`.
  - Inline styles only. No stylesheet, no classes that carry layout.
  - **Holes are dotted paths, never expressions.** `{{ a.b }}` works, `{{ a ? b : c }}` does not.
  - Static text/styles should be literal, not holes — holes don't paint while streaming.
    Live runtime values are fine.
  - React drops valueless boolean attributes: write `open="true"`, never bare `open`.
- **Logic half** — `class Component extends DCLogic` with:
  - `state = { ... }` — all app state
  - `_mk(type)` — block factory / defaults
  - `_mapBlock(b, i)` — per-block computed styles + handlers for the canvas and inspector
  - `renderVals()` — everything the template reads
  - `exportHtml()` — the e-mail HTML generator (a *separate* rendering path)
  - `_templatePayload()` / `saveTemplate()` / `loadTemplate()` — localStorage persistence

### The duplicate-anchor trap (this has bitten three times)

`renderVals()` and `exportHtml()` contain **identical lines** (both build contact rows, both
compute signature styles). A `replace(old, new, 1)` hits whichever comes first in the file —
`exportHtml()` — so your `renderVals` code silently lands in the export method. Symptoms:
blank template holes, or `X is not defined` at render.

**Always anchor edits on a string that is unique to the target method**, and after any edit to
either method grep for the identifier and confirm it appears in both places, once each.

## 3. Blocks — the four-place rule

Adding or changing a block means touching **four** places, in this order:

1. `_mk(type)` → defaults for the new field
2. `_mapBlock(b, i)` → computed styles, handlers, inspector controls
3. the `<sc-if value="{{ b.isX }}">` markup in the canvas template
4. the matching `else if (b.type === 'x')` branch in `exportHtml()`

**Miss step 4 and the block renders perfectly in the builder and vanishes from the export.**

| type | label | notable options |
|---|---|---|
| `banner` | Bannière | image height, `showText` toggle (image-only banner), title/subtitle/button + colours |
| `texte` | Texte | align, title/text sizes, title/text/bg colours, optional button |
| `image` | Image | `full` = pleine largeur (edge-to-edge, no padding/radius), height, radius, shadow, link |
| `produit` | Produit + prix | image left/right, coloured panel behind the visual, multi-line desc, big price + mention, align, 3 font sizes, 5 colours, optional button |
| `cards` | Cartes images | 1–6 cards, per-card reframe, photo height + radius |
| `oneforone` | Message promo spécial | Ben-Day halftone, bottom black band, floating deco image; **exported as a baked PNG** via `_bakeOneforoneImage` |
| `flash` | Bandeau offre flash | band colour, text colour, text size |
| `cta` | Bouton « J'en profite » | text, url, bg/text colour, size (padding scales with it) |
| `contact` | Téléphone + WhatsApp | per-button colours, red-dot toggle |
| `services` | Positif, c'est aussi | editable chips, per-chip dot/bg/text/border colours |
| `sticker` | Image encadrée | frame (aucun/photo/scotch), shape, align, size, shadow |

Shared helpers at the top of `_mapBlock`:

- `TGL(on)` — toggle pill style. **Red = an active on/off toggle.**
- `SEG(sel)` — segmented button style. **Black = the selected option**, or a primary action.
- `reframe(slotId)` — builds the `onReframe` handler so any block with an `image-slot` can be
  double-click-recadré from the inspector.

Don't re-inline those styles; the semantics of red vs black are load-bearing for the UI.

### `image-slot`

Custom element that persists dropped images **by `id`** in `.image-slots.state.json`.
`_nextId` restarts at 1 on every page load, so a hand-written id like `slot-1-a` will
re-attach a photo left by an earlier session (this caused "ghost images" in new blocks).
**Always build slot ids with `_slot()`**, which prefixes a per-page-load namespace.

### The promo band (`oneforone`)

The black band is a **flow element that sizes to its own text**. `bandLeft` / `bandRight`
control the two top corners independently (the user asked for this explicitly — a single
"inclinaison" slider was too constraining), and the text padding compensates, so the text can
never fall outside the black.

It used to be an absolutely-positioned clip-path wedge with separately positioned text and
three interacting sliders. **Do not go back to that.**

`_bakeOneforoneImage` has a canvas fallback that mirrors the DOM layout — keep the two in sync.

## 4. `state.contact` — the single source for coordonnées

```js
contact: {
  company, tagline, address, phone, whatsapp, email, web, legal,
  order:  ['address', 'phone', 'whatsapp', 'email', 'web'],  // render order, reorderable
  labels: { address: 'Adresse', phone: 'Téléphone', ... },   // editable labels
  hidden: {},                                                 // per-key visibility
}
```

Every signature reads this, in the canvas **and** in `exportHtml()`. **Never hardcode a phone
number, address or e-mail in markup again.**

Each entry renders as **its own row/div** — that is deliberate. The user wanted exact control
over line breaks instead of depending on where a long string happens to wrap.

The shared row builder (duplicated in both `renderVals()` and `exportHtml()` — see §2):

```js
const CT_ORDER = CT.order || ['address', 'phone', 'whatsapp', 'email', 'web'];
const ctHref = (key, val) => key === 'phone'    ? 'tel:' + String(val || '').replace(/[^0-9+]/g, '')
                           : key === 'whatsapp' ? 'https://wa.me/' + String(val || '').replace(/[^0-9]/g, '')
                           : key === 'email'    ? 'mailto:' + (val || '')
                           : key === 'web'      ? (/^https?:/.test(val || '') ? val : 'https://' + (val || ''))
                           : '';
const ctRows = CT_ORDER.map((key) => ({ key, label, value, href, isWhatsapp, hasHref, noHref, on }));
```

`hasHref` / `noHref` exist because the address has no target — wrapping it in `<a href="">`
produced empty hrefs in the export. Rows without a target render as plain text.

`contact.web` is free text, so it is normalised through the `https://` check **and escaped**
before being used as an href. `ctWeb` must be declared *after* `const esc` or you get a
temporal-dead-zone throw.

Helpers: `setContact(k, v)`, `setContactLabel(key, v)`, `toggleContactRow(key)`,
`moveContactRow(key, dir)`.

## 5. Header

The black top bar. `state.headerArt` picks the style, and **both options must stay selectable**:

- `true` (default) — `assets/header-swoosh.svg` anchored at the bottom of the bar, plus
  `logo-long.svg` and an editable title
- `false` — plain bar, no artwork

`state.headerHeight` (60–280, default 110) drives the bar. **Nothing in the bar is laid out by
flow**: the logo/title row is absolutely placed at `top:20px; left/right:28px`, and the swoosh is
absolutely placed at the bottom. So the height slider only adds black between them — the lockup
does not drift and the red bar never leaves the bottom edge.

The swoosh reserves no space; it **overlays** the bottom of the bar. Centring the content in a
padded box was the earlier approach and it moved the logo on every height change.

`header-swoosh.svg` is the bottom band of `header-bg-clean.svg`, cropped to its own viewBox
(`0 53.56 623.21 47.71`) with the Avis Google lockup included. **The black is knocked out** with
an SVG `<mask>` — the original artwork painted a black shape to carve the curve out of the red,
which only duplicated the bar's own background and forced the two blacks to match. Masked, the
strip is the red swoosh alone on transparency and the bar shows through.

It is **not** a stretched background:

- the bar's height follows its content, so `background-size:100% 100%` flattened the curve and
  squashed the lockup — visibly wrong
- in the canvas it is an `<img>` pinned to the bottom with `aspect-ratio:623.21/47.71`. The SVG
  has no intrinsic width/height, so `naturalWidth` is 0 and `height:auto` alone collapses it to
  zero — the aspect-ratio is what gives it a height.
- in the export it is its own full-width image row. Outlook ignores `background-size` entirely,
  so a background could never have held.
- in the export the bar cell takes `headerHeight - 46px` with `valign="top"` and a 20px top pad,
  mirroring the canvas anchor, and the strip keeps its own row

Selection ring is a soft inset box-shadow in `SEL_RING`, not a hard outline.

Deriving new artwork with `xml.etree.ElementTree`: pass the root attributes **without**
`xmlns` — `register_namespace` already emits it, and passing it again produces a duplicate
attribute that makes the file invalid XML. It still renders when injected as HTML, so this
fails only in an `<img>`, where it shows as a broken-image icon.

A `header.svg` "visuel" style existed briefly and was removed: it baked the coordonnées into a
picture, duplicating the signature.

## 6. Signatures — three styles (`state.sigStyle`)

### `'carte'` (default)
The carte-de-visite footer: dark bg + dot pattern, arrows corner visual, contact rows.
`state.sigCarteLayout` picks `'labels'` (labelled rows) or `'centre'` (the no-label centred
display, logo + centred info, mirroring the Flyer style).
Exported with a baked pattern PNG + `_signatureCornerImage()`; text stays HTML so links remain
clickable. The uploaded image-motif control was removed as obsolete — the dot pattern is generated.

### `'newsletter'`
Bold centred mentions légales, a row of round social icons, sender note, « Mettre à jour vos
préférences | Se désinscrire », closing note, then a black bar with the raison sociale +
coordonnées left and the logo right. All strings editable.

### `'flyer'`
The carte-de-visite verso, built from **supplied SVG artwork** in `assets/`:
`sig-flyer-bg-clean.svg` (the dégradé + trame layers pulled out of `sig-flyer-bg.svg`, whose
other layers are the header text and would double it), `tile-*.svg` (8 service cells, each
already carrying its own rounded panel *and* its label), `sig-nfc-band.svg`, `logo.svg` /
`logo-long.svg`.

- Grid is `sigFlyer.tileCols` wide (default 4 → 2 rows of 8), cells aligned to their bottom edges.
- Because labels are baked into the artwork the grid renders plain `<img>`, not image-slots, and
  there is no label text to edit — each cell just toggles on/off and takes an optional link.
- `bgMode` picks `flyer` (the supplied dégradé) / `points` (carte-de-visite ronds) / uni.
  **The dot settings are per-signature** (`sigFlyer.dotSize/dotSpacing/dotColor/dotOpacity`),
  not shared with the carte — the user hit this as "rond carte isn't applying all the settings".
- Réseaux are a **text line** (`Suivez-nous : LinkedIn | Instagram`), not a tile, each with its
  own URL, sitting **with the coordonnées** (above the grid). `socialColor` colours the label
  independently of `accent`.
- State is the nested `state.sigFlyer` object — **clone it whole** in
  `_templatePayload`/`loadTemplate`, which also drops pre-artwork tiles lacking a `file`.
  `loadTemplate` merges `{ ...base, ...saved }`, so new keys default from current state.

#### Background framing and the black cap

The supplied artwork is 1600 × 2422.92 — black at the top, red at the bottom, and much taller
than the panel. Anchored at `bottom` it showed almost nothing but red, which made red text
(`contact@positif.biz`, the `Suivez-nous` label) unreadable.

- `bgPosY` (0–100) and `bgZoom` (%) frame it: `background-position:center {bgPosY}%` and
  `background-size:{bgZoom}% auto`
- `blackTop` / `blackFade` paint a `linear-gradient` of `FL.bg` over the top, listed **first**
  in `background-image` so it covers the artwork
- `padBottom` gives the block breathing room under the NFC band

**In the export the cap is a separate solid-black `<td>`**, not a gradient: the coordonnées and
the réseaux line live in that cell, and the artwork only backs the tile grid. Background images
are the first thing an e-mail client drops, so legibility must not depend on one loading.

#### Coordonnées

Both numbers render at the same size (17px/800). The landline used to be 18px against 13px for
WhatsApp, which its icon made look shrunken. Each carries its own picto — a handset in `accent`
for the fixe, the WhatsApp green — and `phonesInline` puts them side by side on one row.

`flLines` (canvas) is a **flat** list: a pair entry carries `a`/`b` sub-objects rather than a
nested array, because a nested `sc-for` is not worth relying on. Entries with no target
(the address) render as `<span>`, never `<a href="">`.

### Social icons
**Generated, not asset files.** `_SOCIAL` holds 24×24 monochrome paths (web, tiktok, whatsapp,
instagram, facebook, linkedin, phone), `_socialSvg()` wraps one in a tinted circle,
`_socialDataUrl()` feeds the canvas preview, `_rasterizeSvg()` bakes each to a 2× PNG at export
(`images/reseau-*.png`).

**Brand marks go through `_brandSvg()` instead** — official rounded-square presentation with the
real brand colours (LinkedIn `#0A66C2`, Instagram on its own radial gradient, Facebook
`#1877F2`). A brand mark tinted with `FL.accent` is a recoloured logo, which is exactly what it
must not be.

## 7. Assets and the SVG rule

**E-mail clients strip SVG.** Never reference a `.svg` from `exportHtml()`.

- `_rasterizeAsset(path, outW, slice?)` bakes a file asset to a 2× PNG at export time
- `_rasterizeSvg(svgString, size)` does the same for generated markup

**Inset margins:** the supplied Illustrator SVGs have padding inside their viewBox.
`background-size:100% 100%` maps that padding onto the panel edges as visible bands — use
`cover`, and pass a `slice` (e.g. `[0.03, 0.97]`) when baking.

**Layer surgery:** several `*-clean.svg` files were produced by parsing the original with
`xml.etree.ElementTree`, rendering each top-level group to identify it, and keeping only the
decorative layers. Do that again rather than reimplementing artwork in CSS — the user was
explicit: *"i dislike that you remade the background because mine was already perfect."*

## 8. Right rail / UI

Three columns: palette (left, 11 blocks) · canvas (centre, 600px) · right rail.

The rail is **tabbed** (`state.railTab`: `'bloc' | 'export' | 'signature'`) and scrolls
independently (`max-height:calc(100vh - 48px)`). Stacked, the three cards ran to ~2400px in a
1400px viewport and `position:sticky` never engaged.

Inside a tab, related controls group into collapsible `.pd-section` blocks. `image`, `produit`
and `oneforone` use them; the other eight inspectors are still flat runs — that is the main
outstanding UI debt.

Colour semantics again, because it is easy to get wrong: **red = active toggle**,
**black = selected segmented option or primary action**.

### Only relevant options, in relevant places

**A control that does nothing in the current state must not render.** Gate it with `<sc-if>` on
the flag that makes it meaningful — don't grey it out, don't leave it. Currently gated:

| control | shown when |
|---|---|
| flyer `Noir en haut`, `Cadrage vertical`, `Échelle` | `flIsArtwork` (dégradé mode) |
| flyer `Ronds · *` | `flIsPoints` |
| flyer `Sur une ligne` | `flWhatsappOn` |
| flyer réseaux inputs | `flSocialOn` |
| flyer NFC `Décalage` | `flNfcOn` |
| carte `Points · *` | `halftoneOn` |
| shared `Accroche`, `Mention légale` | `sigIsCarte` (only the carte renders them) |
| shared row `Libellé` | `ctLabelsUsed` (carte, labelled layout) |
| banner text fields | `sel.showText` |
| `produit` `Arrondi image` | `sel.pdIsRounded` |
| `produit` `Arrondi fond`, `Fond visuel` | `sel.panel` |
| `image` `Arrondi` | `sel.notFull` |
| `contact` dot colour | `sel.telDot` |
| `oneforone` band / déco / Ben-Day colour | `sel.band` / `sel.floatImg` / `sel.halftone` |

When you add an option, add its gate in the same edit.

**Selection is blue** — `SEL` (`#2F6BFF`) and `SEL_RING`, module-scope consts declared just
above `class Component`. Block outline, sticker outline, header ring and the drag-drop insertion
bar all use them. Red was the brand colour, so a red ring read as part of the design rather than
as UI state.

## 9. Saved templates

`localStorage` key `positif-mailing-builder-templates-v1`, via `saveTemplate()` /
`loadTemplate()` / `_templatePayload()`.

**Any new state that must survive a save has to be added to BOTH `_templatePayload()` and
`loadTemplate()`.** Nested objects (`contact`, `sigFlyer`) must be cloned whole.

## 10. Verifying locally

```bash
node preview-server.js 8025
# then drive http://127.0.0.1:8025/index.html
```

Playwright is installed globally at `/opt/node22/lib/node_modules/playwright`, with
`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`. **React is loaded from unpkg and the sandbox
cannot reach it** — intercept `**://unpkg.com/**` with `page.route()` and serve locally-curled
copies of react / react-dom 18.3.1, otherwise the DC never mounts.

Checks worth running after any change:

- add all 11 blocks, select each, confirm an inspector panel renders and the console is clean
- switch through the 3 signatures, confirm a coordinate edit propagates to all of them
- export, then read `outputs/brevo-export/` (written by the server's `/__save-export`
  endpoint — no need to unzip the download) and grep for: unresolved `{{` holes, `.svg`
  references, `href=""`

## 11. Deploying

Vercel auto-deploys `main` through the GitHub integration. **The project is invisible to the
Vercel MCP account** — `list_projects` returns nothing, which does not mean the site is down.
Verify a deploy by curling the live URL and grepping for a marker string you just shipped.

## 12. Known open items

- 8 of 11 block inspectors are flat, always-expanded control runs (only `image`, `produit`,
  `oneforone` use collapsible sections)
- the `services` block heading is hardcoded
- the `contact` block's "WhatsApp" prefix is hardcoded
