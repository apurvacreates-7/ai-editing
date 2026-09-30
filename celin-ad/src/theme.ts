import {PALETTE, STORY_COLOURS} from './config';
import {mix, shade} from './lib/color';

const {slate, sand, offWhite, haze, orange} = PALETTE;

/**
 * Derived tones. Everything is mixed from the five brand colours in
 * config.ts, so changing a brand colour re-tints the whole film.
 */
export const C = {
  ...PALETTE,
  ...STORY_COLOURS,

  slateDeep: shade(slate, -0.3),
  slateMid: mix(slate, haze, 0.32),
  slateSoft: mix(slate, haze, 0.62),

  sandDeep: mix(sand, slate, 0.3),
  sandMid: mix(sand, slate, 0.14),
  sandLight: mix(sand, offWhite, 0.55),

  hazeLight: mix(haze, offWhite, 0.5),
  hazeDeep: mix(haze, slate, 0.42),

  paper: mix(offWhite, '#ffffff', 0.45),
  paperBack: mix(offWhite, sand, 0.35),

  wallUpper: mix(offWhite, sand, 0.16),
  wallLower: mix(sand, offWhite, 0.38),
  ledgeTop: mix(sand, offWhite, 0.25),
  ledgeFace: mix(sand, slate, 0.2),

  orangeDeep: mix(orange, slate, 0.18),
  orangeLight: mix(orange, offWhite, 0.35),
  white: '#FFFFFF',
} as const;
