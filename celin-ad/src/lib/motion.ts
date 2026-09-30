import {Easing, interpolate, spring} from 'remotion';
import type {SpringConfig} from 'remotion';

/**
 * Every ease in the film is a cubic-bezier or a spring. Nothing is linear:
 * `tween` requires an easing and always clamps.
 */
export const EASE = {
  /** easeInOutCubic: the default for transitions. */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** gentle sine-like in/out for slow drifts. */
  inOutSoft: Easing.bezier(0.45, 0.05, 0.55, 0.95),
  /** easeOutQuint: settles softly. */
  out: Easing.bezier(0.22, 1, 0.36, 1),
  /** easeOutExpo: fast arrival, long tail. */
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  /** easeInCubic. */
  in: Easing.bezier(0.55, 0, 0.75, 0.3),
  /** editorial "slow in, slow out" with a long middle. */
  cinematic: Easing.bezier(0.76, 0, 0.24, 1),
} as const;

export type EaseFn = (t: number) => number;

export const tween = (
  frame: number,
  from: number,
  to: number,
  out: readonly [number, number] = [0, 1],
  easing: EaseFn = EASE.inOut,
): number =>
  interpolate(frame, [from, to], [out[0], out[1]], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Multi-keyframe version: every segment uses the same bezier. */
export const keys = (
  frame: number,
  frames: readonly number[],
  values: readonly number[],
  easing: EaseFn = EASE.inOut,
): number =>
  interpolate(frame, frames as number[], values as number[], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const springAt = (
  frame: number,
  start: number,
  fps: number,
  config: Partial<SpringConfig>,
  durationInFrames?: number,
): number =>
  frame < start ? 0 : spring({frame: frame - start, fps, config, durationInFrames});

/** A short impulse (0 -> 1 -> 0), fast attack and soft release. u in frames since the hit. */
export const impulse = (u: number, peakAt = 1.4): number => {
  if (u <= 0) return 0;
  const x = u / peakAt;
  return x * Math.exp(1 - x);
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const frac = (v: number) => v - Math.floor(v);
/** Smooth periodic wobble in [-1, 1]. */
export const wobble = (t: number, period: number, phase = 0) => Math.sin((t / period) * Math.PI * 2 + phase);
