import React from 'react';
import {C} from '../theme';

/** A flat, round, orange tablet. Always a perfect circle (never a capsule or oval). */
export const Tablet: React.FC<{x: number; y: number; r: number; opacity?: number; idSuffix: string}> = ({x, y, r, opacity = 1, idSuffix}) => {
  const id = `tab-${idSuffix}`;
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={id} cx="0.38" cy="0.34" r="0.75">
          <stop offset="0" stopColor="#FF9A57" />
          <stop offset="0.55" stopColor={C.orange} />
          <stop offset="1" stopColor="#D9560E" />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y + r * 0.1} r={r} fill="#B8470B" opacity={0.55} />
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
      <circle cx={x} cy={y} r={r * 0.78} fill="none" stroke="#FFB27E" strokeWidth={Math.max(0.6, r * 0.07)} opacity={0.55} />
    </g>
  );
};

type StripProps = {
  /** centre of the strip */
  x: number;
  y: number;
  width: number;
  cols?: number;
  rows?: number;
  rotate?: number;
  /** indices of cells whose tablet has already popped out */
  empty?: number[];
  idSuffix: string;
};

/** Cell centres in strip space (origin at the strip centre). */
export const stripCells = (width: number, cols = 5, rows = 2) => {
  const height = width * (rows === 2 ? 0.4 : 0.26);
  const pitchX = width / cols;
  const pitchY = height / rows;
  const cells: Array<{x: number; y: number; r: number}> = [];
  for (let rr = 0; rr < rows; rr++)
    for (let cc = 0; cc < cols; cc++)
      cells.push({x: -width / 2 + pitchX * (cc + 0.5), y: -height / 2 + pitchY * (rr + 0.5), r: Math.min(pitchX, pitchY) * 0.34});
  return {cells, height};
};

/** Silver blister strip of round orange tablets, drawn in SVG. */
export const BlisterStrip: React.FC<StripProps> = ({x, y, width, cols = 5, rows = 2, rotate = 0, empty = [], idSuffix}) => {
  const {cells, height} = stripCells(width, cols, rows);
  const id = (n: string) => `${n}-${idSuffix}`;
  const pitchX = width / cols;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <defs>
        <linearGradient id={id('foil')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4F4F2" />
          <stop offset="0.45" stopColor="#D5D7DA" />
          <stop offset="0.7" stopColor="#EDEEEE" />
          <stop offset="1" stopColor="#C4C7CC" />
        </linearGradient>
        <radialGradient id={id('dome')} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.15} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.35} />
        </radialGradient>
      </defs>
      <rect x={-width / 2} y={-height / 2} width={width} height={height} rx={height * 0.12} fill={`url(#${id('foil')})`} />
      {/* perforations */}
      <g stroke="#B9BCC2" strokeWidth={Math.max(0.8, width * 0.004)} strokeDasharray={`${width * 0.012} ${width * 0.01}`}>
        {Array.from({length: cols - 1}).map((_, i) => (
          <line key={i} x1={-width / 2 + pitchX * (i + 1)} y1={-height / 2 + 2} x2={-width / 2 + pitchX * (i + 1)} y2={height / 2 - 2} />
        ))}
        {rows > 1 ? <line x1={-width / 2 + 2} y1={0} x2={width / 2 - 2} y2={0} /> : null}
      </g>
      {cells.map((c, i) => {
        const isEmpty = empty.includes(i);
        return (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={c.r * 1.22} fill="#C2C5CA" />
            {isEmpty ? (
              <circle cx={c.x} cy={c.y} r={c.r} fill="#9EA2A8" />
            ) : (
              <Tablet x={c.x} y={c.y} r={c.r} idSuffix={`${idSuffix}-${i}`} />
            )}
            <circle cx={c.x} cy={c.y} r={c.r * 1.12} fill={`url(#${id('dome')})`} />
            <circle cx={c.x} cy={c.y} r={c.r * 1.14} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(0.6, c.r * 0.08)} opacity={0.7} />
          </g>
        );
      })}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={height * 0.12}
        fill="none"
        stroke="#AEB2B8"
        strokeWidth={Math.max(0.8, width * 0.005)}
      />
    </g>
  );
};
