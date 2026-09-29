import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, H, W} from '../theme';
import {noise, signed, useSF} from '../stop';

export type Cam = {zoom?: number; x?: number; y?: number};

type Props = {
  /** Global light level, 0 = lights off, 1 = full key light. */
  light?: number;
  /** Spotlight pool centre and size in stage pixels. */
  pool?: {x: number; y: number; rx: number; ry: number};
  /** Hand-moved camera: zoom and pan in stage pixels. */
  cam?: Cam;
  /** Which part of the table this shot looks at. */
  table?: {x: number; y: number};
  seed?: number;
  /** Crisp keynote typography, laid over the photographed set. */
  overlay?: React.ReactNode;
  children?: React.ReactNode;
};

const Grain: React.FC<{sf: number; seed: number; opacity?: number}> = ({sf, seed, opacity = 0.11}) => {
  const tile = Math.floor(noise(seed + 3, sf) * 6) % 6;
  const ox = Math.floor(noise(seed + 4, sf) * 512);
  const oy = Math.floor(noise(seed + 5, sf) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile(`tex/grain-${tile}.png`)})`,
        backgroundPosition: `${ox}px ${oy}px`,
        backgroundSize: '512px 512px',
        mixBlendMode: 'overlay',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

export const Stage: React.FC<Props> = ({
  light = 1,
  pool = {x: W / 2, y: H * 0.54, rx: 980, ry: 700},
  cam = {},
  table = {x: 0, y: 0},
  seed = 1,
  overlay,
  children,
}) => {
  const sf = useSF();
  const zoom = cam.zoom ?? 1;
  // the camera sits on a hand-cranked slider: tiny offsets between exposures
  const jx = signed(seed + 11, sf) * 0.7;
  const jy = signed(seed + 12, sf) * 0.7;
  const tx = (cam.x ?? 0) + jx;
  const ty = (cam.y ?? 0) + jy;
  // exposure flicker between frames, a signature of real stop motion
  const flicker = 0.02 + 0.035 * noise(seed + 13, sf);
  const dark = Math.min(1, Math.max(0, 1 - light) + flicker * Math.min(1, light + 0.2));

  // light layers are oversized so camera moves never reveal an edge
  const PAD = 600;
  const at = `at ${pool.x + PAD}px ${pool.y + PAD}px`;
  const poolGrad = `radial-gradient(ellipse ${pool.rx}px ${pool.ry}px ${at}, rgba(196,208,238,0.30) 0%, rgba(160,176,220,0.15) 38%, rgba(120,135,180,0.04) 70%, rgba(0,0,0,0) 100%)`;
  const falloff = `radial-gradient(ellipse ${pool.rx * 1.05}px ${pool.ry * 1.05}px ${at}, rgba(4,5,8,0) 0%, rgba(4,5,8,0) 42%, rgba(4,5,8,0.5) 78%, rgba(4,5,8,0.86) 100%)`;
  const big: React.CSSProperties = {
    position: 'absolute',
    left: -PAD,
    top: -PAD,
    width: W + 2 * PAD,
    height: H + 2 * PAD,
    pointerEvents: 'none',
  };

  return (
    <AbsoluteFill style={{backgroundColor: C.void, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${-tx}px, ${-ty}px) scale(${zoom})`,
          transformOrigin: `${W / 2 + tx}px ${H / 2 + ty}px`,
        }}
      >
        <Img
          src={staticFile('tex/table.jpg')}
          style={{
            position: 'absolute',
            left: (W - 3400) / 2 - table.x,
            top: (H - 2000) / 2 - table.y,
            width: 3400,
            height: 2000,
          }}
        />
        <div style={{...big, background: poolGrad}} />
        {children}
        <div style={{...big, background: falloff}} />
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: '#000', opacity: dark, pointerEvents: 'none'}} />
      {overlay ? <AbsoluteFill>{overlay}</AbsoluteFill> : null}
      <Grain sf={sf} seed={seed} />
    </AbsoluteFill>
  );
};
