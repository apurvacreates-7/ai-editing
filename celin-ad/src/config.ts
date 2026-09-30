/**
 * CELIN VITAMIN C · "The calendar knows"
 *
 * Every piece of copy, every colour and every timing lives in this file.
 * Frame numbers are ABSOLUTE (30 fps, 450 frames = 15 s), matching the brief.
 *
 * This file must stay plain data (types only, no imports) because the Node
 * scripts in /scripts import it directly to build the SRT and the soundtrack.
 */

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 450,
} as const;

/** The horizon is locked to 62% of the frame height in Scenes 1 to 3. */
export const HORIZON_Y = Math.round(VIDEO.height * 0.62); // 1190

/* ------------------------------------------------------------------ */
/* Colour                                                              */
/* ------------------------------------------------------------------ */

/** Brand palette. Every other colour in the film is mixed from these. */
export const PALETTE = {
  slate: '#2E3440',
  sand: '#D9C7A5',
  offWhite: '#F4F1EA',
  haze: '#8E9299',
  /** The only accent. Reserved for Celin moments. */
  orange: '#F26B1D',
} as const;

/** Colours that are not part of the brand palette but are asked for by the brief. */
export const STORY_COLOURS = {
  /** July window (monsoon green). */
  monsoonSky: '#A3B49B',
  monsoonTrees: '#5E7A5C',
  /** October window (pale blue). */
  clearSky: '#C9DCE6',
  /** Final page: smog layers and the pale sun disc. */
  smogBrown: '#8C8171',
  smogGrey: '#8A8680',
  paleSun: '#F4B98E',
  /** Warm brown skin tones for the figures. */
  skin: ['#8A5A3E', '#76492F', '#9A6446', '#A06A4A', '#7F5037'],
  hair: '#1D1A18',
  greyHair: '#CFCAC0',
  /** WhatsApp green for the CTA icon. */
  whatsapp: '#25D366',
} as const;

/* ------------------------------------------------------------------ */
/* Copy (no em dashes anywhere on screen)                              */
/* ------------------------------------------------------------------ */

export const COPY = {
  calendar: {
    year: 2026,
    coverTitle: 'DELHI',
    /** Page headers, in flip order. The cover shows before the first flip. */
    pages: ['JULY', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
  },
  /** Kinetic type that lands with each flip. */
  kinetic: ['JULY', 'OCTOBER', 'NOVEMBER'],
  /** The final flip slams in bigger, one line per entry. */
  kineticFinal: ['AQI 418.', 'SEVERE.'],
  street: ['Every winter.', 'Same air.'],
  end: {
    line1: 'Delhi’s air will take time to change.',
    line2: 'Your immunity doesn’t have to wait.',
    brand: 'CELIN',
    brandSub: 'Vitamin C',
    cta: 'Claim your free sample',
  },
  /** Text on the drawn placeholder pack (only used when no product photo is supplied). */
  pack: {
    brand: 'CELIN',
    line1: 'Vitamin C',
    line2: 'Chewable Tablets',
    maker: 'RV Lifesciences',
  },
} as const;

/**
 * Voice-over script for a human VO, timed to frames 210 to 420.
 * `npm run srt` turns this into celin-ad-vo.srt.
 */
export const VO_CUES: ReadonlyArray<{from: number; to: number; text: string}> = [
  {from: 210, to: 252, text: "Delhi's air will take time to change."},
  {from: 255, to: 300, text: "Your immunity doesn't have to wait."},
  {from: 303, to: 339, text: 'Celin Vitamin C.'},
  {from: 342, to: 381, text: 'Trusted for generations.'},
  {from: 384, to: 420, text: 'Try a free sample today.'},
];

/* ------------------------------------------------------------------ */
/* Timeline (absolute frames)                                          */
/* ------------------------------------------------------------------ */

export const TIMING = {
  scene1: {start: 0, end: 150},
  /** Frame on which each of the four calendar pages starts to flip. */
  flips: [10, 44, 78, 110],
  /** Length of a page flip (spring is stretched to this many frames). */
  flipFrames: 30,
  /** Global saturation eases 1.0 -> 0.3 across Scene 1. */
  saturation: {from: 1, to: 0.3},
  /** Soft cut between Scene 1 and Scene 2, centred on frame 150. */
  crossfade: 6,

  street: {start: 150, end: 390},
  /**
   * Vertical wipe (warm -> smog). 'ltr' crosses left to right and reveals the
   * smog behind the line; 'rtl' rolls the smog in from the right instead.
   */
  wipe: {start: 210, end: 252, direction: 'ltr' as 'ltr' | 'rtl'},
  /** Figures slow from a walk to a standstill as the smog arrives. */
  walkStop: {start: 212, end: 266},
  streetText: {in: 240, out: 296},

  scene3: 300,
  chime: 300,
  womanWalk: {start: 300, end: 326},
  stripRaise: {start: 320, end: 334},
  /** Tablets pop out of the strip (one per figure). */
  tabletPop: [330, 333, 336],
  /** Frame each tablet reaches its figure. */
  tabletContact: [348, 353, 358],
  dawn: {start: 348, end: 390},

  endCard: 390,
  /** Staggered fade-up of the end-card type stack. */
  endStagger: [392, 398, 404, 410],
  endFadeFrames: 16,
} as const;

/* ------------------------------------------------------------------ */
/* Product image                                                       */
/* ------------------------------------------------------------------ */

export const PRODUCT = {
  /**
   * Put the pack photo at public/<file>. If it is missing, a drawn
   * placeholder pack is used instead so the film still renders.
   */
  file: 'product.jpeg',
  /** 'cutout' removes a flat photo background; 'card' keeps it on a rounded card. */
  treatment: 'cutout' as 'cutout' | 'card',
  /** Colour distance (0 to 441) treated as "background" when cutting out. */
  cutoutTolerance: 42,
} as const;

/* ------------------------------------------------------------------ */
/* Finish                                                              */
/* ------------------------------------------------------------------ */

export const FINISH = {
  grainOpacity: 0.07,
  /** grain clump size in px (larger is softer and cheaper to encode) */
  grainScale: 2.5,
  /** Soft edge darkening. */
  vignetteStrength: 0.22,
  /** Hard 2px inner edge of the vignette. */
  vignetteEdgePx: 2,
  vignetteEdgeOpacity: 0.16,
} as const;

/* ------------------------------------------------------------------ */
/* Audio                                                               */
/* ------------------------------------------------------------------ */

export const AUDIO = {
  file: 'audio/soundtrack.wav',
  /** Overall music level in the final mix (0 to 1). */
  volume: 1,
} as const;
