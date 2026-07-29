# Positif Design — Mailing Designer

Builder app that assembles marketing e-mails from blocks and exports paste-ready HTML for
Brevo / Sarbacane / Mailchimp. Goal: "beau ET prêt à envoyer".
**User writes French — answer in French, keep all UI copy and e-mail content French. Be concise
and direct. No emojis in the actual e-mail designs.**

**`ARCHITECTURE.md` is the full reference — read it before any non-trivial change.**
What follows is the minimum needed to not break things.

## The five rules

1. **`Mailings Positif Design V2.dc.html` is the live app.** After every edit:
   `cp "Mailings Positif Design V2.dc.html" index.html` (Vercel serves the root from `index.html`).
   `Mailings Positif Design.dc.html`, `*-print.dc.html`, `versions/` are archives — do not edit.
2. **A block lives in four places**: `_mk()` defaults → `_mapBlock()` styles/handlers →
   `<sc-if b.isX>` canvas markup → `else if (b.type === 'x')` in `exportHtml()`.
   Miss the last one and the block vanishes from the export.
3. **`renderVals()` and `exportHtml()` share identical lines.** A single-occurrence replace hits
   `exportHtml()` first (it is earlier in the file) and your code lands in the wrong method.
   Anchor on a string unique to the target method, then grep to confirm.
4. **E-mail strips SVG** — never reference a `.svg` from `exportHtml()`. Bake with
   `_rasterizeAsset(path, outW, slice?, patch?)` or `_rasterizeSvg(svg, size)`.
   **Rasterise at the output size, never scale the canvas over a 1× raster.** Stamp the target
   pixel size on the `<svg>` root (replacing any it already declares) so the browser renders the
   vector at full resolution; `ctx.scale()` over an image the browser already rasterised small
   just blows up pixels, and that was the aliasing on the promo block.
5. **New state must be added to BOTH `_templatePayload()` and `loadTemplate()`**, or it won't
   survive a save. Clone nested objects (`contact`, `sigFlyer`) whole. `_templatePayload()` also
   feeds the saved defaults, so anything added there is picked up by both.

## DC constraints

Inline styles only. Template holes are **dotted paths, no expressions** — compute in
`renderVals()`. Avoid holes for static text/styles (they don't paint while streaming); live
values are fine. React drops valueless booleans: write `open="true"`, not bare `open`.

Slot ids always go through `_slot()` — hand-written ids collide with the persisted
`.image-slots.state.json` and resurrect ghost images.

## Blocks (11)

`banner` · `texte` · `image` (`full` = pleine largeur) · `produit` (image + big price) ·
`cards` · `oneforone` (promo, exported as a baked PNG) · `flash` · `cta` · `contact` ·
`services` · `sticker`.

Use the shared `TGL()` / `SEG()` helpers at the top of `_mapBlock`. **Red = active on/off
toggle. Black = selected segmented option or primary action.** Every block with an
`image-slot` gets `onReframe` from the shared `reframe(slotId)` helper.

The `oneforone` black band is a **flow element that sizes to its own text**; `bandLeft` /
`bandRight` slope the two top corners independently. It used to be an absolute clip-path wedge
with three interacting sliders — do not go back. Keep `_bakeOneforoneImage` in sync.

## Contact + header + signatures

**`state.contact`** is the single source for company / tagline / address / phone / whatsapp /
email / web / legal, plus `order`, `labels`, `hidden`. All three signatures read it, in the
canvas *and* in `exportHtml()`. **Never hardcode a coordinate.** Each entry renders as its own
row so line breaks are controlled, not accidental. Rows with no target (address) render as
plain text — an `<a href="">` is a bug.

**Header**: `state.headerArt` — `true` = `header-swoosh.svg` strip anchored at the bottom +
`logo-long.svg` + editable title, `false` = plain bar. Both must stay selectable.
`state.headerHeight` sets the bar height. Nothing in the bar flows: the logo/title row is
absolutely placed at `top:20px`, the swoosh overlays the bottom edge — so the height only adds
black between them and the lockup never drifts.
**Never stretch the swoosh** — its black is knocked out with a mask so only the red band paints,
and `background-size:100% 100%` flattened the curve and squashed the Avis Google lockup. The
export ships it as its own full-width image row, with the bar cell taking `height - 46px`.

**Selection is blue** (`SEL` / `SEL_RING`, module-scope consts at the top of the logic half) —
red is the brand colour and read as part of the design rather than as UI state.

**Signatures** (`state.sigStyle`):
- `'carte'` — carte-de-visite footer. `sigCarteLayout`: `'labels'` or `'centre'` (no-label
  centred display).
- `'newsletter'` — mentions légales + social icons + prefs/désinscription links + black bar.
- `'flyer'` — carte-de-visite verso from supplied SVG artwork (`sig-flyer-bg-clean.svg`,
  `tile-*.svg`, `sig-nfc-band.svg`). Labels are baked into the artwork, so tiles are plain
  `<img>` that only toggle + take a link. State is the nested `state.sigFlyer`.
  **Dot settings are per-signature, not shared.** The artwork runs black→red top to bottom and
  is taller than the panel: `bgPosY` / `bgZoom` frame it and `blackTop` / `blackFade` paint a
  black cap so the coordonnées never land on red. In the export that cap is a **separate solid
  black cell** — background images are the first thing an e-mail client drops. Both numbers
  render at the same size, each with its own picto (`phonesInline` puts them on one row).
  `panelOpacity` fades **the dark panel inside each tile**, not the cell: every `tile-*.svg`
  carries one `<rect fill:#343333;mix-blend-mode:multiply>` behind its photo and label (repainted
  black), and that
  rect is what the slider rewrites (`_patchTilePanel`). `#343333` occurs exactly once per file,
  so the match cannot stray into the artwork. Canvas serves a patched data URL
  (`_tileDataUrl`, cached, re-renders once fetched); the export passes the same patch to
  `_rasterizeAsset`. Never dim the whole `<img>` — that would fade the photo and label too.
  Both vertical sliders run the same way — **handle right = the boundary rises**. `Limite du
  noir` gets `direction:rtl` for that; without it the two ran opposite each other.

Social icons are **generated** (`_SOCIAL` / `_socialSvg()`), not asset files. Instagram and
LinkedIn go through `_brandSvg()` instead — official rounded-square marks with the real brand
colours, including Instagram's gradient. Do not tint a brand mark with `FL.accent`.

Use the user's supplied artwork. Do not reimplement it in CSS — that has been rejected before.

## Verifying

`node preview-server.js 8025`, drive `http://127.0.0.1:8025/index.html` with the global
Playwright (`/opt/node22/lib/node_modules/playwright`, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`).
**Intercept `**://unpkg.com/**`** and serve locally-curled react/react-dom 18.3.1 — the sandbox
can't reach the CDN and the DC never mounts otherwise.
Exports land in `outputs/brevo-export/` via the server's `/__save-export` endpoint; grep them
for unresolved `{{`, `.svg`, and `href=""`.

Vercel auto-deploys `main`. The project is **invisible to the Vercel MCP** — that is not an
outage. Verify by curling the live URL and grepping for a marker you just shipped.

## Client facts (verified)

Agence de publicité & imprimerie, Épinay-sur-Seine. "PUBLICITÉ DEPUIS 1983" is approved copy
(the earlier ban was reversed) and headlines the flyer signature.

- 48 bis Boulevard Foch · 93800 Épinay-sur-Seine
- Tél 01 48 29 15 51 · WhatsApp 06 18 70 11 18 (wa.me/33618701118)
- contact@positif.biz · positifdesign.fr
- Services: Enseignes & façades, Signalétique, Marquage véhicule, Covering, Panneaux & bâches,
  Stickers & adhésifs, Impression grand format, Marquage textile, Objets publicitaires,
  Flyers & dépliants, Cartes de visite, PLV & stands, Décoration vitrine.

## Brand

Red `#FC1D37` + near-black `#141417` + white. **Montserrat only** (800/900 for headlines) —
Anton/Impact was removed, the user dislikes it, do not reintroduce.
Pop-art / commercial / "in your face": big Ben-Day halftone dots (not fine grids — "ugly"),
coupon/ticket shapes, pill buttons (`border-radius:50px`), tilted black bars behind hero text.

Disque A flash offer: "50 achetés = 50 offerts" / "1 ACHETÉ = 1 OFFERT", cible auto-écoles.
The "Pop blast" red variant is the keeper; the dark "Black pop" one was deleted.

## Tweaks props (root DC)

The host Tweaks panel uses the prop KEY as its label, so keys are French: `Points · taille`,
`Points · espacement`, `Points · couleur`, `Flèches · taille`, `Flèches · décalage droite`,
`Flèches · décalage bas`. They control the dot pattern + arrows on the V1 model signatures.

## Saved defaults

The Export tab's « Enregistrer les réglages actuels » writes `_defaultsPayload()` to
`localStorage['positif-mailing-defaults-v1']`, and `state` is built through `_withDefaults()`,
so the app opens on them. **Settings only** — `blocks` and `stickers` are stripped; content is
what the Modèles tab is for. `_withDefaults` applies only keys the built-in state already
declares, so a stale entry can't inject anything unknown.

## Only relevant options, in relevant places

A control that does nothing in the current state must not render. Gate it with `<sc-if>`, don't
grey it out. Already enforced: the flyer's `Noir en haut` / `Cadrage` (artwork mode only),
`Ronds · *` (points mode only), `Sur une ligne` (needs WhatsApp on); the carte's `Points · *`
(needs the motif on) and its shared `Accroche` / `Mention légale` (carte-only fields) and row
`Libellé` (labelled layout only); the banner's text fields (needs the text block on); `produit`'s
`Arrondi image` (rounded shape) and `Arrondi fond` / `Fond visuel` (panel on); `contact`'s dot
colour (dot on); `oneforone`'s Ben-Day colour (dots on).

When adding an option, add its gate in the same edit.

## Known open items

- 8 of 11 block inspectors are flat control runs (only `image`, `produit`, `oneforone` use
  collapsible sections)
- the `services` block heading and the `contact` block's "WhatsApp" prefix are hardcoded
