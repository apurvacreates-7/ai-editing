# Freestand Studio · stop-motion product film

A 78-second, keynote-style product film for **Freestand Studio**, the consumer-engagement
and CDP workspace built for Mondelēz India ([FS_CDP demo](https://freestandtech.github.io/FS_CDP/)).
It's animated as digital stop motion in [Remotion](https://www.remotion.dev): paper cut-outs,
instant photos and printed UI cards are moved by hand, frame by frame, on a spotlit table.
Crisp Apple-style typography sits on top.

## Render

```bash
npm install
npm start                 # Remotion Studio, scrub every scene
npm run render:fast       # → out/freestand-studio.mp4 (master) + out/freestand-studio-share.mp4
npm run render            # plain single-pass Remotion render of the 24 fps composition
```

`render:fast` is the one used for delivery. The film is shot on twos, so it draws each pose
once at 12 fps (`FreestandFilm12`), holds every pose for two frames in the 24 fps H.264
encode, and takes the score and foley mix from the 24 fps composition. That mix is mastered by
`scripts/master_audio.py` to −16 LUFS with a −1 dBTP limiter. Outputs: a CRF 18 master
(~75 MB) and a CRF 25 share copy (~18 MB) for email and chat.

On a headless Linux box without Remotion's own Chrome download, point it at any Chromium:

```bash
REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render:fast
```

Each scene is also registered as its own composition (`Scene01-cold-open` … `Scene11-finale`)
for quick previews. `node scripts/stills.mjs <composition> <dir> <frames>` renders review stills.

## Storyboard

| Time  | Scene     | What happens |
|-------|-----------|--------------|
| 00:00 | Cold open | Consumer moments land on the table as instant photos, then fade back to blank film. *"Until now."* |
| 00:08 | Reveal    | The Freestand mark is assembled piece by piece. *Every consumer moment. Verified. Consented. Activated. Measured.* |
| 00:14 | The loop  | Launch → Operate → Consumers → Data → Measure cards are dealt, and a paper ribbon closes the loop. |
| 00:20 | Launch    | The 5 Star Spin & Win wheel spins among experience-library cards. 17 proven journeys, live in 1–2 days. |
| 00:28 | Operate   | A RelianceSMART receipt on WhatsApp, an OCR-verified stamp, ₹50 over UPI. 2,25,762 samples delivered. |
| 00:36 | Consumers | *Meet Meena.* Her consented profile builds row by row. 1,02,48,317 profiles. |
| 00:44 | Identity  | Two records of Priya, three AI agents vote, and consensus merges them. |
| 00:50 | Data      | Freestand CDP → Mondelēz Lytics → ad and retail media. 72% match on Meta vs 48% typical. |
| 00:58 | Measure   | A paper bar chart of 12-month value by mechanic. A sticky note: 44% of receipts come from kiranas. |
| 01:06 | Next      | A playbook card: *Run* → *Campaign live*. |
| 01:10 | Finale    | End card, and the key light switches off. |

Every number and line of product copy comes from the FS_CDP workspace.

## How the stop-motion look is built

- **Shot on twos.** Delivery is 24 fps, but every pose is held for two frames (12 poses/s).
  All motion reads the stop-frame index from `useSF()` in `src/stop.ts`, never the raw frame.
- **Physical cut-outs.** `<Obj>` / `<Card>` in `src/components/Physical.tsx` jitter a fraction of a
  pixel between exposures, more while being carried, and cast a key-light shadow that spreads
  and softens as the object is lifted off the table. `place()` and `carry()` give the
  set-down / pick-up moves.
- **The set.** `<Stage>` in `src/components/Stage.tsx` layers a table texture, a spotlight pool,
  light falloff, a hand-cranked camera, exposure flicker and film grain.
- **Keynote type.** `src/components/Type.tsx` keeps type crisp and never jittered, but it still
  steps on the 12 fps grid. `*phrase*` renders in the gradient.
- **Foley in sync.** `<Sfx at={stopFrame}>` puts each tap, drop, stamp and click on the exact pose
  it belongs to.

## Editing

- Scene lengths live in `src/timeline.ts`, in bars of the 120 BPM score. After changing them,
  run `npm run audio` so the score is re-arranged to the new cut.
- Scene files are in `src/scenes/` (`S01ColdOpen.tsx` … `S11Finale.tsx`). Copy and numbers are
  inline in each scene.
- Colours and fonts are in `src/theme.ts`.

## Assets

- `scripts/make_textures.py` generates the table, paper and grain textures.
- `scripts/make_audio.py` synthesizes the score and all foley, so there's no licensed music.
  It needs `numpy scipy pillow pyloudnorm`.
- The campaign imagery and Meena's portrait come from the FS_CDP demo. The Freestand logo was
  traced to vector from the demo's logo (`public/img/freestand-logo.svg`, split into parts in
  `src/logoPaths.ts`).
- Fonts are Inter, JetBrains Mono and Caveat (SIL Open Font License), via Fontsource.

Remotion is free for individuals and companies of up to three people. Larger companies need a
[Remotion company license](https://www.remotion.pro/license).
