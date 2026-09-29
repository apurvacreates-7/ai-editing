import {useCurrentFrame, useVideoConfig} from 'remotion';

// The film is delivered at 24 fps but shot "on twos": every pose is held for two
// frames, which is what gives hand-animated stop motion its cadence. All motion
// in the film is computed from the stop-frame index (12 per second), never from
// the raw frame.
export const FPS = 24;
export const ON = 2;
export const SPS = FPS / ON; // stop-frames per second

// Music runs at 120 BPM, so one beat is half a second = 6 stop-frames.
export const BEAT = 6;
export const BAR = 4 * BEAT;

// Works at any composition frame rate: the 24 fps master holds each pose for two
// frames, the 12 fps render (see scripts/render-fast.sh) draws each pose once.
export const useSF = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return Math.floor((frame * SPS) / fps + 1e-6);
};

// Frames per stop-frame in the current composition.
export const useOn = () => useVideoConfig().fps / SPS;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// Deterministic per-object, per-pose noise (same result on every render).
export const hash = (n: number): number => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
};
export const noise = (seed: number, sf: number) => hash(seed * 131.71 + sf * 17.137);
export const signed = (seed: number, sf: number) => noise(seed, sf) * 2 - 1;

export type Ease = (t: number) => number;
export const ease = {
  linear: ((t) => t) as Ease,
  in: ((t) => t * t * t) as Ease,
  out: ((t) => 1 - Math.pow(1 - t, 3)) as Ease,
  inOut: ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) as Ease,
  outBack: ((t) => {
    const c1 = 1.5;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }) as Ease,
};

// Progress of stop-frame `sf` through [a, b], 0..1.
export const prog = (sf: number, a: number, b: number) =>
  b === a ? (sf >= b ? 1 : 0) : clamp01((sf - a) / (b - a));

export const tw = (
  sf: number,
  a: number,
  b: number,
  from: number,
  to: number,
  e: Ease = ease.inOut,
) => from + (to - from) * e(prog(sf, a, b));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// A "place" move: an object is carried in from `from`, held above the table
// (lift 1) and set down at `to` (lift 0), the way an animator repositions a
// cut-out between exposures. Returns position, lift and a settle rotation.
export type Pose = {x: number; y: number; rot: number; lift: number; t: number};
export const place = (
  sf: number,
  start: number,
  dur: number,
  from: {x: number; y: number; rot?: number},
  to: {x: number; y: number; rot?: number},
  e: Ease = ease.out,
): Pose => {
  const t = prog(sf, start, start + dur);
  const k = e(t);
  const fr = from.rot ?? 0;
  const tr = to.rot ?? 0;
  // lifted while travelling, touching down on the last pose
  const lift = t >= 1 ? 0 : t <= 0 ? 1 : Math.min(1, 1.15 * (1 - k) + 0.12);
  return {x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), rot: lerp(fr, tr, k), lift, t};
};

// The reverse of `place`: picked up off the table and carried out of shot.
export const carry = (
  sf: number,
  start: number,
  dur: number,
  from: {x: number; y: number; rot?: number},
  to: {x: number; y: number; rot?: number},
  e: Ease = ease.in,
): Pose => {
  const t = prog(sf, start, start + dur);
  const k = e(t);
  const lift = t <= 0 ? 0 : Math.min(1, 0.45 + t);
  return {
    x: lerp(from.x, to.x, k),
    y: lerp(from.y, to.y, k),
    rot: lerp(from.rot ?? 0, to.rot ?? 0, k),
    lift,
    t,
  };
};

// Step through explicit values, one per stop-frame, starting at `start`.
export const keys = (sf: number, start: number, values: number[]) =>
  sf < start ? values[0] : values[Math.min(values.length - 1, sf - start)];

export const fmtIN = (n: number) => Math.round(n).toLocaleString('en-IN');
