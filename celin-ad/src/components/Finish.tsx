import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FINISH} from '../config';
import {mulberry32} from '../lib/prng';

const BASE = 200;
const SCALE = FINISH.grainScale;
const TILE = Math.round(BASE * SCALE);
let tileUrl: string | null = null;

/**
 * A seamless tile of soft gaussian-ish noise: random values on a 256 grid,
 * upsampled with wrap-around bilinear filtering so grain clumps are 2 to 3px
 * (film-like, and kinder to the H.264 encoder). Fixed seed = identical on every render thread.
 */
const getGrainTile = () => {
  if (tileUrl) return tileUrl;
  const rnd = mulberry32(20261130);
  const base = new Float32Array(BASE * BASE);
  for (let i = 0; i < base.length; i++) base[i] = (rnd() + rnd() + rnd() + rnd()) / 4 - 0.5;
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(TILE, TILE);
  const at = (x: number, y: number) => base[(((y % BASE) + BASE) % BASE) * BASE + (((x % BASE) + BASE) % BASE)];
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const fx = x / SCALE;
      const fy = y / SCALE;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const g =
        at(x0, y0) * (1 - tx) * (1 - ty) + at(x0 + 1, y0) * tx * (1 - ty) + at(x0, y0 + 1) * (1 - tx) * ty + at(x0 + 1, y0 + 1) * tx * ty;
      const val = Math.max(0, Math.min(255, 128 + g * 2 * 230));
      const i = (y * TILE + x) * 4;
      img.data[i] = val;
      img.data[i + 1] = val;
      img.data[i + 2] = val;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  tileUrl = canvas.toDataURL('image/png');
  return tileUrl;
};

/** Subtle animated film grain across the whole film. */
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const url = useMemo(() => getGrainTile(), []);
  // grain re-seeds every other frame (15 fps): reads as film, and costs the encoder half as much
  const rnd = mulberry32(Math.floor(frame / 2) * 7919 + 17);
  const size = TILE;
  const ox = Math.floor(rnd() * size);
  const oy = Math.floor(rnd() * size);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${ox}px ${oy}px`,
        mixBlendMode: 'overlay',
        opacity: FINISH.grainOpacity,
        pointerEvents: 'none',
      }}
    />
  );
};

/** Soft edge darkening plus a hard 2px inner edge. */
export const Vignette: React.FC = () => (
  <>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 82% 66% at 50% 47%, rgba(20,18,16,0) 58%, rgba(20,18,16,${FINISH.vignetteStrength}) 100%)`,
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
      }}
    />
    <AbsoluteFill
      style={{
        boxShadow: `inset 0 0 ${FINISH.vignetteEdgePx}px ${FINISH.vignetteEdgePx}px rgba(12,10,8,${FINISH.vignetteEdgeOpacity})`,
        pointerEvents: 'none',
      }}
    />
  </>
);
