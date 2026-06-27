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

## File structure (`Mailings Positif Design.dc.html`)
Two tabs via a tab bar (logic `state.tab`: 'modeles' | 'builder'):
1. **Modèles e-mail** — showcase of 7 finished email models in labeled white frames on gray bg:
   - SECTION 01: Vente Flash Disque A (single "Pop blast" variant)
   - SECTION 02: Restaurants, BTP, Objets & textiles, Marquage véhicule
   - SECTION 03: Newsletter mensuelle + Modèle promo générique
   - Each model = 600px table-based email, inline styles, with the carte-de-visite signature.
2. **Constructeur glisser-déposer** — drag-and-drop email builder.

## Tweaks props (root DC, French key-names ARE the labels shown in panel)
The host Tweaks panel uses the prop KEY as its label (ignores a `label` field), so keys are French:
`Points · taille`, `Points · espacement`, `Points · couleur`, `Flèches · taille`,
`Flèches · décalage droite`, `Flèches · décalage bas`. These control the dot pattern + arrows
on the 7 MODEL signatures (read via `this.props['Points · taille']` etc).

## Builder architecture (migration COMPLETE — June 2026)
The drag-and-drop builder upgrade is done and verified. Layout = 3 columns: palette (left, 8 blocks,
drag + click to add), canvas (center 600px email), right rail (export btn + inspector + decoration panel).
- **Canvas blocks are preview-only** (no contentEditable). Each wraps in `<div style="{{ b.wrapStyle }}"
  onClick="{{ b.onSelect }}" data-block="{{ b.id }}">`; selected block gets a red 2px outline via wrapStyle.
  Per-block toolbar (↑↓ dup ✕) + the "VOTRE E-MAIL" header label carry `data-tools="1"`.
- **Side inspector** (right rail, gated by `hasSelection`/`noSelection`): regular `<input>`/`<textarea>`
  with `value="{{ sel.x }}"` + `onChange="{{ sel.onX }}"` (handlers read `e.target.value`). Sections gated by
  `selIsFlash/selIsCta/selIsContact/selIsOneforone/selIsServices/selIsImage`. oneforone has a split toggle
  (`sel.onToggleSplit`/`sel.splitBtnStyle`) = black tilted bar behind line2.
- **Color controls = native `<input type="color">` + hex text field** (NOT swatch circles — user asked for
  full pickers, June 2026). Flash: `sel.onColorPick` (color) + `sel.onColorHex` (text, validated via `_normHex`).
  Services items: each row has `it.color`/`it.onColor` color picker + text field + remove (old cycle-through-
  palette `it.onCycle`/`it.dotBtn` REMOVED; `svcColor(id,idx,color)` sets it). Decoration dot color:
  `dotColorVal` + `onDotColorPick`/`onDotColorHex`. `_normHex` accepts #rgb/#rrggbb with/without leading #.
- **Right-rail layout**: outer builder row `max-width:1300px;gap:30px;flex-wrap:wrap`; palette `280px`,
  canvas `flex:1 1 600px;max-width:600px`, rail `320px` (=1260+gaps, fits without wrapping the rail under
  the canvas on normal previews). Earlier 1304/44px gap version wrapped the rail below — that was the bug.
- **Decoration panel** (dark card): halftone toggle (`onToggleHalftone`/`halftoneBtnStyle`) + range sliders
  dot size/spacing (`dotSizeVal`/`onDotSize`, `dotSpacingVal`/`onDotSpacing`) + dot color picker (above) +
  arrow size/x/y sliders. Drives the builder signature only (in-app state, NOT the root Tweaks props).
  (`dotColorSwatches[]` still computed in renderVals but unused in markup — harmless.)
- **Builder signature** matches the model carte-de-visite: service band + dark footer w/ dots
  (`sigDotsDisplay`/`sigGradient`/`sigCell`), arrows (`sigArrow*`), full contact rows + social + legal.
- **Export**: red "EXPORTER EN HTML" btn → `onExport`/`exportHtml()` clones canvas, strips `[data-tools]` +
  `[data-block]` outlines, replaces image-slots with dropped imgs (or grey div), base64-inlines `assets/`,
  downloads single `email-positif.html`. Verified: no contentEditable/toolbars/labels/outlines in output.
- oneforone tilted bars: kicker `rotate(-2deg)` (`kickerStyle`), line2 `skewX(-7deg)` (`line2Style` when split,
  `line2PlainStyle` when not).

## SESSION HANDOFF — June 25 2026 (builder edits IN PROGRESS, ~half wired)
This session added editability to several builder blocks + reworked the sticker. Page loads with **no console
errors**, but **two inspector panels are NOT yet built** and **one stale panel must be removed**. Logic is
mostly done; the gaps are template-side. Pick up here:

### DONE & working this session
- **8 blocks editable in side inspector** via `selIs*` gates: `selIsCta` (btn bg/text color), `selIsTextImage`
  (kicker/title/body/btnText + bg/text/border/kicker colors), `selIsContact` (tel+wa button bg/text/border/dot
  colors + `onToggleTelDot` to remove the red dot), `selIsOneforone`, `selIsServices`, `selIsCards`.
- **Toolbar fade**: helmet rule `[data-block] [data-tools]{opacity:0}` → shows on `:hover` or `[data-sel="1"]`
  (block wrap sets `data-sel="{{ b.selFlag }}"`). Per-block ↑↓dup✕ + "VOTRE E-MAIL" label carry `data-tools="1"`.
- **Banner LOGIC done, inspector MISSING** (see TODO): `_mk('banner')` has `title/subtitle/btnLabel/btnBg/btnColor`;
  map exposes `o.onTitle/onSubtitle/onBtnLabel/onBnBg/onBnColor` + `bnBtnStyle`. Template hero already reads
  `{{ b.title }}/{{ b.subtitle }}/{{ b.btnLabel }}/{{ b.bnBtnStyle }}`.
- **1 acheté = 1 offert REDESIGNED** to match Vente Flash Disque A model: `ofWrapStyle` (red, min-height when
  float/band on), corner Ben-Day halftone (top-right radial-gradient masked circle), **tilted black bar** via
  `clip-path:polygon(0 55%,100% 0,100% 100%,0 100%)` at bottom + band text overlaid, line1 now 62px nowrap with
  text-shadow. Toggles: `sel.onToggleHalftone/onToggleBand/onToggleFloat` (+ `onBandText`). `floatImg` shows a
  circle disque-A image-slot (`b.slotFloat`) bottom-right.
- **Sticker → FREE-FLOATING overlay** (no longer an inline block). State: `state.stickers[]` (each
  `{id,x,y,size,rot,shape,radius,shadow}`) + `state.selStickerId`. Canvas div is now `position:relative`. Overlay
  rendered by `<sc-for list="{{ stickers }}">` INSIDE canvas after footer: absolute-positioned wrap, drag handle
  `✛ déplacer` (`onPointerDown`→`st.onDragStart`→`stickerDown(id,e)` uses `this._canvasEl` rect for pointer math),
  ✕ remove, `image-slot id="sticker-<id>"`. Palette "Image flottante" card calls `addSticker()` (NOT `add()`);
  onDrop special-cases `'sticker'`→`addSticker()`. Selection gating: `hasSelection`/`noSelection` now also require
  `selStickerId==null`; new `stickerSelected` flag + `stk` object (size/rot/shape/shadow handlers + `seg()` styles).

### ⚠️ NEXT SESSION — 3 template tasks remaining (all in right-rail inspector ~line 1284-1369)
1. **REMOVE the stale `selIsSticker` inspector panel** (~line 1285). It references the OLD inline-block sticker
   props (`sel.onShapeRect/onAlignLeft/onSize/onOx/onOy/onOverlap/onToggleShadow`) which no longer exist on the
   floating sticker — it's dead UI. `selIsSticker` flag can stay or go (floating stickers aren't `blocks`).
2. **ADD a `stickerSelected` inspector panel** using the `stk.*` keys already in renderVals: `stk.size`/`onSize`,
   `stk.rot`/`onRot`, `stk.shape`/`onShapeRect|Rounded|Circle` + `shapeRectStyle/...`, `stk.onToggleShadow`/
   `shadowBtnStyle`, `stk.onRemove`. Gate with `<sc-if value="{{ stickerSelected }}">`.
3. **ADD a banner inspector** (replace the `selIsImage` "Déposez vos photos" message at ~line 1367, or add
   alongside): inputs for `sel.title/subtitle/btnLabel` + color pickers `sel.btnBg`/`onBnBg` & `sel.btnColor`/
   `onBnColor`. Banner handlers already exist in logic.

### USER'S OPEN REQUEST (not yet started) — sticker frame designs
User wants the floating image to have **multiple frame designs**, not just circle/square/rounded: specifically a
**white-framed "polaroid"/photo-frame style like the images used in the custom templates** (small white border +
shadow). Plan: extend sticker `shape`/add a `frame` field with options (circle, square, rounded, **polaroid**
= white padding+border+drop-shadow, maybe taped/postage look) → render in the `<sc-for stickers>` imgStyle/wrap +
add swatch buttons in the new sticker inspector (task 2). Look at the model template image treatments for the
exact "smol frame" look the user referenced.

### Export note
`exportHtml()` now also preserves image-slot transform/filter/position/right/bottom/left/top/z-index when replacing
slots (needed for floating stickers + the disque-A float). Circle shape → `border-radius:50%`. NOT re-verified
after the floating-sticker change — **re-check export includes the floating stickers** next session.

## Notes / gotchas
- `Mailings Positif Design-print.dc.html` is a STALE old export — ignore/can delete; still references Anton.
- DC rules: inline styles only; template holes are dotted-paths only (no expressions); compute in renderVals.
  Avoid `{{ }}` holes for static style/text (won't paint while streaming) — but live runtime values are fine.
- image-slot persists dropped images by `id`; give every slot a unique id (`slot-<blockid>-a/b/c`).
- Preview-pane screenshots from main agent were flaky this session; DOM probes via eval_js worked. Verifier subagent is reliable.
- User preferences: concise, direct. French responses. No emojis in the actual email designs.
