import React from 'react';
import {Img, staticFile} from 'remotion';
import {Obj, paperBg} from './Physical';
import {C, FONT, HAND} from '../theme';

type Placed = {x: number; y: number; rot?: number; lift?: number; seed: number; opacity?: number; scale?: number; z?: number};

// Instant photo of a consumer moment. `develop` runs 1 → 0 to "un-develop" it
// back to blank film, 0 → 1 to bring it up.
export const Polaroid: React.FC<
  Placed & {src: string; caption: string; w?: number; develop?: number; imgStyle?: React.CSSProperties}
> = ({src, caption, w = 300, develop = 1, imgStyle, ...p}) => {
  const pad = Math.round(w * 0.055);
  const photo = w - 2 * pad;
  const h = Math.round(photo + pad + w * 0.26);
  return (
    <Obj {...p} w={w} h={h} radius={3} style={{...paperBg('#F6F4EE', 300)}}>
      <div
        style={{
          position: 'absolute',
          left: pad,
          top: pad,
          width: photo,
          height: photo,
          overflow: 'hidden',
          backgroundColor: '#23221F',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
        }}
      >
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', ...imgStyle}} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 40% 35%, #3A3934 0%, #26251F 70%)',
            opacity: 1 - develop,
          }}
        />
        <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 24px rgba(0,0,0,0.25)'}} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: pad + 4,
          right: pad,
          bottom: Math.round(w * 0.055),
          fontFamily: HAND,
          fontWeight: 600,
          fontSize: Math.round(w * 0.105),
          lineHeight: 1,
          color: '#2E3040',
          transform: 'rotate(-1.5deg)',
          whiteSpace: 'nowrap',
        }}
      >
        {caption}
      </div>
    </Obj>
  );
};

export const Pill: React.FC<{
  children: React.ReactNode;
  bg?: string;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, bg = C.greenBg, color = C.green, size = 20, style}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: FONT,
      fontSize: size,
      fontWeight: 600,
      color,
      background: bg,
      borderRadius: 999,
      padding: `${Math.round(size * 0.28)}px ${Math.round(size * 0.62)}px`,
      lineHeight: 1.1,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

// Rubber-stamp impression: lands at full size, slightly rotated, in ink that
// multiplies into the paper underneath.
export const StampMark: React.FC<{
  text: string;
  color?: string;
  size?: number;
  rot?: number;
  k?: number;
  style?: React.CSSProperties;
}> = ({text, color = C.green, size = 30, rot = -9, k = 1, style}) => (
  <div
    style={{
      display: 'inline-block',
      fontFamily: FONT,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color,
      border: `${Math.max(3, size * 0.14)}px solid ${color}`,
      borderRadius: size * 0.3,
      padding: `${size * 0.22}px ${size * 0.5}px ${size * 0.18}px`,
      transform: `rotate(${rot}deg) scale(${k})`,
      opacity: k > 0 ? 0.88 : 0,
      mixBlendMode: 'multiply',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {text}
  </div>
);

export const Sticky: React.FC<Placed & {w?: number; h?: number; children: React.ReactNode}> = ({
  w = 380,
  h = 300,
  children,
  ...p
}) => (
  <Obj
    {...p}
    w={w}
    h={h}
    radius={2}
    shadowStrength={0.8}
    style={{
      ...paperBg(C.sticky, 300),
      padding: '30px 30px',
      boxSizing: 'border-box',
      fontFamily: HAND,
      fontWeight: 600,
      color: '#3B3222',
    }}
  >
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 34, background: 'rgba(0,0,0,0.035)'}} />
    {children}
  </Obj>
);
