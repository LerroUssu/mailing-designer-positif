# Positif Design — Mailing Templates Kit

## Project
HTML/CSS email templates for **Positif Design** (Armony Positif), an advertising & print
agency in Épinay-sur-Seine, France. Single Design Component: **`Mailings Positif Design.dc.html`**.
Output goal: "beau ET prêt à envoyer" — visually strong AND paste-ready into Sarbacane/Brevo/Mailchimp.
User communicates in French; keep all UI copy and emails in French.

## Client facts (verified)
- Agence de publicité & imprimerie, Épinay-sur-Seine. **Do NOT use "depuis 1983"** copy — user flagged it as unprofessional (mails go to existing clients).
- Address: 48 bis Boulevard Foch · 93800 Épinay-sur-Seine
- Tel: 01 48 29 15 51 · WhatsApp: 06 18 70 11 18 (wa.me/33618701118)
- Email: contact@positif.biz · Web: positifdesign.fr
- Services ("Positif, c'est aussi"): Enseignes & façades, Signalétique, Marquage véhicule,
  Covering, Panneaux & bâches, Stickers & adhésifs, Impression grand format, Marquage textile,
  Objets publicitaires, Flyers & dépliants, Cartes de visite, PLV & stands, Décoration vitrine.

## Brand system
- **Red `#FC1D37`** (sampled from logo) + near-black `#141417` + white.
- Font: **Montserrat ONLY** (800/900 for big headlines). **Anton/Impact was REMOVED** — user dislikes it. Do not reintroduce.
- Art direction: **pop-art / commercial / "in your face"** (AWWWARDS-worthy, bold hierarchy).
  - **Ben-Day dots** (big halftone circles, masked gradient) on hero backgrounds — NOT tiny fine-dot grids (user called those "ugly").
  - **Coupon/ticket shapes** (notch circles + dashed divider) instead of plain black rectangles.
  - **Round Disque A** with big red "A" + "VOTRE LOGO" pill (real product is round). User LOVES the big A.
  - Pill buttons (border-radius:50px). Caution-tape diagonal stripes for urgency bars.
  - Black bars behind hero text should be **tilted** (skewX/rotate).
- Assets in `assets/`: `logo-positif.png`, `logo-positif-white.png`, `arrows.png`
  (official colorful arrows graphic from carte de visite), `dot-pattern.png` (relief-varnish dot pattern).
- **Signature = mini carte de visite**: black bg + relief dot pattern + colorful arrows graphic
  bottom-right corner + reorganized contact rows (red dots w/ glow) + "Positif c'est aussi" service band above it.

## Disque A flash offer
"50 achetés = 50 offerts" / "1 ACHETÉ = 1 OFFERT" / "100 disques A pour le prix de 50".
Cible: auto-écoles. Variante "Pop blast" (red bg) is the keeper — the dark "Black pop" variant was DELETED (user disliked it).
## File structure — the live app is `Mailings Positif Design V2.dc.html`
`index.html` is a **byte-identical copy** of the V2 file (Vercel serves the site root from it).
**Any edit to the V2 file must be mirrored with `cp "Mailings Positif Design V2.dc.html" index.html`.**
Older files are archives, do not edit: `Mailings Positif Design.dc.html` (V1, the 7 showcase models),
`Mailings Positif Design-print.dc.html` (stale, still references Anton), `versions/`.

V2 is **builder-first**, two tabs (`state.tab`: 'modeles' | 'builder'):
1. **Builder** (default) — 3 columns: palette (left, 11 blocks), canvas (center, 600px email), right rail
   (inspector + export settings + signature panel).
2. **Modèles** — saved templates, persisted to `localStorage` under `positif-mailing-builder-templates-v1`
   via `saveTemplate()` / `loadTemplate()` / `_templatePayload()`. **When you add new state that must survive
   a save, add it to BOTH `_templatePayload()` and `loadTemplate()`.**

## Blocks (`_mk(type)` → `_mapBlock(b, i)` → canvas markup → `exportHtml()` branch)
Adding or changing a block means touching **four** places, in this order:
`_mk()` defaults → `_mapBlock()` computed styles + handlers → the `<sc-if b.isX>` canvas markup →
the matching `else if (b.type === 'x')` branch in `exportHtml()`. Miss the last one and the block
silently vanishes from the Brevo export.

| type | label | notable options |
|---|---|---|
| `banner` | Bannière | image height, `showText` toggle (image-only banner), title/subtitle/button + colors |
| `texte` | Texte | align, title/text sizes, title/text/bg colors, optional button |
| `image` | Image | **`full` = pleine largeur** (edge-to-edge, no padding/radius), height, radius, shadow |
| `produit` | Produit + prix | image left/right, colored panel behind the visual, multi-line desc, **big price** + mention, text align, 3 font sizes, 5 colors, optional button |
| `cards` | Cartes images | 1–6 cards, per-card reframe, photo height + radius |
| `oneforone` | Message promo spécial | Ben-Day halftone, bottom black band, floating deco image, all colours/sizes editable; **exported as a baked PNG** via `_bakeOneforoneImage` |
| `flash` | Bandeau offre flash | band color, text color, text size |
| `cta` | Bouton « J'en profite » | text, url, bg/text color, size (padding scales with it) |
| `contact` | Téléphone + WhatsApp | per-button colors, red-dot toggle |
| `services` | Positif, c'est aussi | editable chips, per-chip dot/bg/text/border colors |
| `sticker` | Image encadree | frame (aucun/photo/scotch), shape, align, size, shadow |

Every block with an `image-slot` exposes `onReframe` (built by the shared `reframe(slotId)` helper in
`_mapBlock`) so the user can double-click-recadrer from the inspector. `TGL()` / `SEG()` at the top of
`_mapBlock` are the shared toggle-pill and segmented-button style helpers — use them, don't re-inline.

## Signatures — two styles (`state.sigStyle`)
- **`'carte'`** (default) — the carte-de-visite footer: dark bg + dot/uploaded pattern, arrows corner
  visual, labelled contact rows. Controlled by the dot/pattern/arrow sliders (all gated behind
  `<sc-if sigIsCarte>` in the right-rail SIGNATURE card). Exported with a baked pattern PNG +
  `_signatureCornerImage()`; text stays HTML so links remain clickable.
- **`'newsletter'`** — the alternate style: bold centered mentions légales, a row of round social icons,
  sender note, « Mettre à jour vos préférences | Se désinscrire » links, closing note, then a black bar
  with the raison sociale + coordonnées on the left and the logo on the right. All strings editable.
- Social icons are **generated, not asset files**: `_SOCIAL` holds 24×24 monochrome paths (web, tiktok,
  whatsapp, instagram, facebook), `_socialSvg()` wraps one in a light circle, `_socialDataUrl()` feeds the
  canvas preview, and `_rasterizeSvg()` bakes each to a 2× PNG at export time (`images/reseau-*.png`).

## Tweaks props (root DC, French key-names ARE the labels shown in panel)
The host Tweaks panel uses the prop KEY as its label (ignores a `label` field), so keys are French:
`Points · taille`, `Points · espacement`, `Points · couleur`, `Flèches · taille`,
`Flèches · décalage droite`, `Flèches · décalage bas`. These control the dot pattern + arrows
on the 7 MODEL signatures (read via `this.props['Points · taille']` etc).

## Notes / gotchas
- DC rules: inline styles only; template holes are dotted-paths only (no expressions); compute in renderVals.
  Avoid `{{ }}` holes for static style/text (won't paint while streaming) — but live runtime values are fine.
- image-slot persists dropped images by `id`. Slot ids go through `_slot()`, which prefixes a
  per-page-load namespace — `_nextId` restarts at 1 each load, so without it a new block would
  re-attach the photo an earlier session left on the same id. Never build a slot id by hand.
- The promo band is a **flow element that sizes to its own text**; `bandTilt` only slopes its top
  edge and the text padding compensates, so the text can never fall outside the black. It used to be
  an absolute wedge with separately-positioned text and three interacting sliders — do not go back.
  `_bakeOneforoneImage` has a canvas fallback that mirrors this; keep the two in sync.
- Verifying locally: `node preview-server.js 8025` then drive http://127.0.0.1:8025/index.html with the globally
  installed Playwright (`/opt/node22/lib/node_modules/playwright`, PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers).
  React is loaded from unpkg and the sandbox browser cannot reach it — intercept `**://unpkg.com/**` with
  `page.route()` and serve locally-curled copies of react/react-dom 18.3.1, otherwise the DC never mounts.
- Export writes to `outputs/brevo-export/` (gitignored) via the preview server's `/__save-export` endpoint —
  read the HTML there to verify an export instead of unzipping the download.
- User preferences: concise, direct. French responses. No emojis in the actual email designs.
