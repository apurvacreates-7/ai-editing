import React from 'react';
import {noise2D} from '@remotion/noise';
import {TIMING} from '../../config';
import {EASE, tween} from '../../lib/motion';
import {seeded} from '../../lib/prng';

/**
 * 440 drifting smog particles in three parallax layers (far, mid, near).
 * In Scene 3 they slow down, and 85% of them settle downward and thin out,
 * leaving 15% still floating.
 */
type Particle = {
  x0: number;
  y0: number;
  r: number;
  o: number;
  color: string;
  settles: boolean;
  settleDelay: number;
  settleDist: number;
  seed: number;
};

export const LAYERS = [
  {count: 240, r: [1.1, 2.4], o: [0.35, 0.7], wind: 0.22, parallax: 0.15, colors: ['#BDB2A1', '#A99D8B', '#C9BFAF']},
  {count: 140, r: [2.2, 4.4], o: [0.35, 0.65], wind: 0.45, parallax: 0.5, colors: ['#C3B8A6', '#AFA491', '#D2C8B8']},
  {count: 64, r: [5.5, 11], o: [0.14, 0.32], wind: 0.8, parallax: 1.3, colors: ['#D8CEBE', '#C6BBA9']},
] as const;

const make = (layer: number): Particle[] => {
  const L = LAYERS[layer];
  const r = seeded(`particles-${layer}`);
  return Array.from({length: L.count}).map((_, i) => ({
    x0: r() * 1200 - 60,
    y0: r() * 2040 - 60,
    r: L.r[0] + r() * (L.r[1] - L.r[0]),
    o: L.o[0] + r() * (L.o[1] - L.o[0]),
    color: L.colors[Math.floor(r() * L.colors.length)],
    settles: r() > 0.15,
    settleDelay: r() * 14,
    settleDist: 150 + r() * 260,
    seed: i + layer * 1000,
  }));
};

const PARTICLES = [make(0), make(1), make(2)];

export const PARTICLE_COUNT = PARTICLES.reduce((n, l) => n + l.length, 0);

/** Speed of the particle clock: slows to 18% once Celin arrives. */
const clockRate = (f: number) => 1 - 0.82 * tween(f, TIMING.dawn.start, TIMING.dawn.start + 30, [0, 1], EASE.inOut);

const clockCache = new Map<number, number>();
const particleClock = (f: number) => {
  const key = Math.floor(f);
  const hit = clockCache.get(key);
  if (hit !== undefined) return hit;
  let c = 0;
  for (let t = TIMING.street.start - 20; t < key; t++) c += clockRate(t);
  clockCache.set(key, c);
  return c;
};

const wrap = (v: number, min: number, max: number) => {
  const span = max - min;
  return ((((v - min) % span) + span) % span) + min;
};

export const ParticleLayer: React.FC<{layer: 0 | 1 | 2; frame: number; scroll: number; opacity: number; blur?: number; idSuffix: string}> = ({
  layer,
  frame,
  scroll,
  opacity,
  blur = 0,
  idSuffix,
}) => {
  if (opacity <= 0.001) return null;
  const L = LAYERS[layer];
  const clock = particleClock(frame);
  const filterId = `pblur-${layer}-${idSuffix}`;
  return (
    <g opacity={opacity} filter={blur ? `url(#${filterId})` : undefined}>
      {blur ? (
        <defs>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        </defs>
      ) : null}
      {PARTICLES[layer].map((p) => {
        const nx = noise2D(`nx${p.seed}`, clock / 90, p.seed * 0.37) * 22;
        const ny = noise2D(`ny${p.seed}`, clock / 110, p.seed * 0.41) * 16;
        let x = wrap(p.x0 + clock * L.wind + scroll * L.parallax + nx, -60, 1140);
        let y = wrap(p.y0 + clock * 0.12 + ny, -60, 1980);
        let o = p.o;
        let r = p.r;
        if (p.settles) {
          const s = tween(frame, TIMING.dawn.start + p.settleDelay, TIMING.dawn.start + p.settleDelay + 36, [0, 1], EASE.inOut);
          y += s * p.settleDist;
          o *= 1 - 0.9 * s;
          r *= 1 - 0.2 * s;
        }
        if (y < -40 || y > 1960) return null;
        x = Math.round(x * 10) / 10;
        y = Math.round(y * 10) / 10;
        return <circle key={p.seed} cx={x} cy={y} r={r} fill={p.color} opacity={o} />;
      })}
    </g>
  );
};
