# Celin Vitamin C · "The calendar knows"

A 15-second vertical motion-graphics ad for **Celin Vitamin C Chewable Tablets (RV Lifesciences)**, built in
[Remotion](https://www.remotion.dev) (React). Everything is drawn in code (SVG, CSS and canvas). There is no stock
footage and no external API. The soundtrack is synthesised with the Web Audio API.

| | |
|---|---|
| Format | 1080 x 1920, 30 fps, 450 frames (15 s), H.264 High, yuv420p, Rec.709, AAC 192 kbps |
| Font | Manrope (SIL OFL) via `@fontsource/manrope` |
| Palette | slate `#2E3440`, sand `#D9C7A5`, off-white `#F4F1EA`, haze `#8E9299`, accent Celin orange `#F26B1D` |

## Deliverables

| File | What it is |
|---|---|
| `celin-ad.mp4` | The film |
| `celin-ad-vo.srt` | Voice-over guide, timed to frames 210 to 420 |
| `celin-ad-frame-140.png`, `-260.png`, `-430.png` | Review stills |
| `preview/celin-ad-preview.mp4` | 3-second preview (frames 0 to 89) |
| `celin-ad/` | This source folder |

## Quick start

```bash
npm install            # Node 22.18+ (the scripts import src/config.ts directly); the first render downloads Chrome Headless Shell
npm run studio         # live editor with a timeline at http://localhost:3000
npm run audio          # rebuild public/audio/soundtrack.wav (run after changing timings)
npm run srt            # rebuild out/celin-ad-vo.srt
npm run preview        # out/celin-ad-preview.mp4 (frames 0 to 89)
npm run stills         # out/stills/celin-ad-frame-{140,260,430}.png  (or: node scripts/render-stills.mjs 60 200)
npm run render         # out/celin-ad.mp4  (same as: npx remotion render CelinAd out/celin-ad.mp4)
bash scripts/deliver.sh [/path/to/outputs]   # all of the above, then copies the deliverables
```

## Change the copy, colours and timings

Everything a person normally changes lives in **`src/config.ts`**:

- **Copy**: `COPY` (calendar pages, kinetic words, `AQI 418.` / `SEVERE.`, street line, end card, CTA, placeholder
  pack text). Keep it free of em dashes. Apostrophes are typographic (`’`).
- **Voice-over**: `VO_CUES` (text plus start and end frame). Then `npm run srt`.
- **Colours**: `PALETTE` holds the five brand colours; every other tone in the film is mixed from them in
  `src/theme.ts`, so changing a brand colour re-tints the whole film. `STORY_COLOURS` holds the few colours the brief
  asks for outside the palette (monsoon green, October blue, smog browns, the pale sun, skin tones, WhatsApp green).
- **Timings**: `TIMING` uses absolute frames (30 fps), exactly like the brief:
  - `flips` start frames of the four calendar flips, `flipFrames` length of each spring flip
  - `saturation` Scene 1 eases from 1.0 to 0.3
  - `wipe` 210 to 252 (`direction: 'ltr'` or `'rtl'`), `walkStop`, `streetText`
  - `chime` (300), `womanWalk`, `stripRaise`, `tabletPop`, `tabletContact`, `dawn`
  - `endCard` (390, hard cut), `endStagger` (the four type lines), `endFadeFrames`

  After changing timings run `npm run audio` so the chime and the pad's filter moves follow.
- **Finish**: `FINISH` (grain opacity and size, vignette strength, the 2px edge).
- **Horizon**: `HORIZON_Y` (62% of the height). The calendar's ledge, the window skyline, the street horizon and the
  product's base all sit on it, and every camera move scales around a point on that line.

## Product image

The brief's photo (`/mnt/user-data/uploads/images.jpeg`) was not present when this was built, so the end card
currently shows a **drawn placeholder pack** (orange carton with the brief's own text only).

To use the real photo: copy it to **`public/product.jpeg`** and render again. Nothing else is needed.

- `PRODUCT.treatment = 'cutout'` (default) removes a flat photo background in the browser at render time: it samples
  the border colour, flood-fills the connected background within `PRODUCT.cutoutTolerance`, feathers the edge and
  trims to the pack. Raise the tolerance for soft grey backgrounds, lower it if the pack itself starts to erode.
- `PRODUCT.treatment = 'card'` keeps the photo as-is on a white rounded card instead.
- Use a large source image (1200 px or more). A small web thumbnail will look soft at this size.

## Audio

`scripts/generate-audio.mjs` renders the soundtrack offline with the Web Audio API (`OfflineAudioContext` via
`node-web-audio-api`): detuned saw and sine pad voices through a low-pass whose cutoff follows the story (open in
July, closing into smog, warm in the city, muffled at the wipe, opening at dawn), a faint filtered-noise "hush" in
the smog sections, a synthetic hall reverb, no drums, and one warm bell chime (D5, additive partials) exactly on
frame 300. It is loudness-normalised to about -19 LUFS with peaks below -1.5 dBFS, so a voice-over can sit on top.
Change the level of the music in the film with `AUDIO.volume`.

## Where things are

```
src/config.ts            copy, colours, timings, product, finish, audio
src/theme.ts             tones derived from the palette
src/CelinAd.tsx          the timeline: scenes, soft cut, end card, grain, vignette, audio
src/scenes/calendar/     Scene 1: calendar + 3D flips, window weather, kinetic type
src/scenes/street/       Scenes 2 and 3: street, figure rig (rig.ts, Person.tsx), cast and performances (cast.ts),
                         particles, wipe, tablets, dawn
src/scenes/endcard/      end card: product (photo cut-out or drawn pack), orange slice, WhatsApp button
src/components/          India Gate / Qutub Minar / towers, blister strip and tablets, grain and vignette
scripts/                 audio, SRT, stills, deliver
remotion.config.ts       encoder settings (CRF 21, x264 slow, yuv420p, bt709)
```

## Notes on the brief

- **Every ease is a cubic-bezier or a spring.** `src/lib/motion.ts` exposes named beziers and a `tween()` that
  requires one. The only constant-rate motions are physical: falling rain, particles drifting on the wind, and the
  camera tracking the walkers (which itself eases to a stop).
- **Four flips.** The calendar opens on a `DELHI 2026` cover page so that four flips land on July, October, November
  and the final page. The brief does not name the final month; it is `DECEMBER` (change it in `COPY.calendar.pages`).
- **The wipe.** It crosses left to right from frame 210 and the smog is revealed behind the line; "left / right of the
  wipe" is read as before / after. Set `TIMING.wipe.direction = 'rtl'` to have the smog roll in from the right, which
  makes the split literally warm on the left and grey on the right while it moves.
- **Figures.** A small 2D rig (`rig.ts`) with foot-planted walk cycles and inverse kinematics: the hoodie coughs into a
  fist on a loop, the muffler rises over the older man's nose and mouth, the mother draws the child in under her arm.
  After each tablet lands they ease out of it. Faces are left blank on purpose (editorial, not cartoon).
- **Particles.** 444 sprites in three parallax layers (240 far, 140 mid, 64 near and blurred). On contact they slow to
  18% speed; 85% of them sink and thin out, 15% keep floating.
- **2px vignette.** A soft edge darkening plus a hard 2px inner edge (`FINISH`).
- **Safe areas.** End-card type sits between y = 236 and y = 1710. The street line ("Every winter. Same air.") is in the bottom third as briefed (y = 1634 to 1815), so check it against the caption area of the platform you post to.
