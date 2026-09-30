import React from 'react';
import {IndiaGate} from '../../components/Landmarks';
import {TIMING} from '../../config';
import {EASE, tween} from '../../lib/motion';
import {C} from '../../theme';

export type GlyphKind = 'gate' | 'rain' | 'sun' | 'cloud' | 'haze';

/** Flat cloud built from overlapping circles on a rounded base (200 x 200 box). */
const Cloud: React.FC<{fill: string; dx?: number; dy?: number; s?: number}> = ({fill, dx = 0, dy = 0, s = 1}) => (
  <g fill={fill} transform={`translate(${dx} ${dy}) scale(${s})`}>
    <circle cx={72} cy={98} r={32} />
    <circle cx={112} cy={82} r={42} />
    <circle cx={148} cy={104} r={26} />
    <rect x={40} y={96} width={134} height={34} rx={17} />
  </g>
);

/**
 * Monochrome editorial weather glyphs for the calendar pages.
 * `t` is the local frame used for gentle idle motion.
 */
export const Glyph: React.FC<{kind: GlyphKind; size: number; t: number}> = ({kind, size, t}) => {
  const stroke = C.slate;
  let body: React.ReactNode = null;

  if (kind === 'gate') {
    body = <IndiaGate cx={100} baseY={170} width={112} fill={stroke} />;
  }

  if (kind === 'rain') {
    const drops = [0, 1, 2, 3];
    body = (
      <g>
        <Cloud fill={stroke} dy={-14} />
        {drops.map((i) => {
          // each streak slides down its own lane and fades, on a loop
          const period = 18;
          const phase = ((t + i * 5) % period) / period;
          const y0 = 132 + phase * 26;
          const x0 = 66 + i * 30 - phase * 7;
          const o = Math.sin(phase * Math.PI);
          return (
            <line
              key={i}
              x1={x0}
              y1={y0}
              x2={x0 - 8}
              y2={y0 + 26}
              stroke={stroke}
              strokeWidth={10}
              strokeLinecap="round"
              opacity={0.35 + 0.65 * o}
            />
          );
        })}
      </g>
    );
  }

  if (kind === 'sun') {
    const rot = tween(t, TIMING.flips[1], TIMING.flips[2] + 20, [0, 22], EASE.inOutSoft);
    body = (
      <g>
        <circle cx={100} cy={100} r={36} fill={stroke} />
        <g transform={`rotate(${rot} 100 100)`}>
          {Array.from({length: 8}).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={100 + Math.cos(a) * 56}
                y1={100 + Math.sin(a) * 56}
                x2={100 + Math.cos(a) * 78}
                y2={100 + Math.sin(a) * 78}
                stroke={stroke}
                strokeWidth={10}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </g>
    );
  }

  if (kind === 'cloud') {
    const drift = Math.sin(t / 22) * 4;
    body = (
      <g>
        <circle cx={134} cy={74} r={30} fill={C.hazeLight} />
        <Cloud fill={C.haze} dx={drift - 10} dy={10} />
      </g>
    );
  }

  if (kind === 'haze') {
    const bars: Array<[number, number, number]> = [
      [44, 34, 150],
      [70, 54, 170],
      [96, 26, 164],
      [122, 46, 176],
      [148, 30, 156],
      [174, 58, 142],
    ];
    body = (
      <g>
        <circle cx={104} cy={70} r={34} fill={C.hazeLight} />
        {bars.map(([y, x1, x2], i) => {
          const dx = Math.sin(t / 16 + i * 1.3) * 5;
          return (
            <line
              key={i}
              x1={x1 + dx}
              y1={y}
              x2={x2 + dx}
              y2={y}
              stroke={stroke}
              strokeWidth={13}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
      {body}
    </svg>
  );
};
