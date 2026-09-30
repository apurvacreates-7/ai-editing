import React from 'react';
import {fmt} from '../lib/geometry';

/**
 * India Gate, front elevation. Tiers are [bottom, top, half-width] in units of
 * the monument's width; the central arch is cut out with even-odd fill so the
 * sky shows through it.
 */
const GATE_TIERS: Array<[number, number, number]> = [
  [0.0, 0.03, 0.56],
  [0.03, 0.058, 0.53],
  [0.058, 0.8, 0.5],
  [0.8, 0.835, 0.535],
  [0.835, 1.02, 0.488],
  [1.02, 1.052, 0.512],
  [1.052, 1.1, 0.42],
  [1.1, 1.145, 0.35],
  [1.145, 1.186, 0.28],
];
const ARCH_HW = 0.165;
const ARCH_SPRING = 0.44;
const DOME = {base: 1.186, top: 1.255, hw: 0.2};

export const INDIA_GATE_HEIGHT = DOME.top; // in widths

export const indiaGatePath = (cx: number, baseY: number, w: number): string => {
  const X = (u: number) => fmt(cx + u * w);
  const Y = (h: number) => fmt(baseY - h * w);
  // Right side going up, then dome, then left side going down.
  let d = `M${X(-GATE_TIERS[0][2])},${Y(0)}`;
  d += `L${X(GATE_TIERS[0][2])},${Y(0)}`;
  GATE_TIERS.forEach(([, top, hw], i) => {
    d += `L${X(hw)},${Y(i === 0 ? 0 : GATE_TIERS[i][0])}`;
    d += `L${X(hw)},${Y(top)}`;
  });
  d += `L${X(DOME.hw)},${Y(DOME.base)}`;
  d += `Q${X(DOME.hw * 0.92)},${Y(DOME.top)} ${X(0)},${Y(DOME.top)}`;
  d += `Q${X(-DOME.hw * 0.92)},${Y(DOME.top)} ${X(-DOME.hw)},${Y(DOME.base)}`;
  for (let i = GATE_TIERS.length - 1; i >= 0; i--) {
    const [bottom, top, hw] = GATE_TIERS[i];
    d += `L${X(-hw)},${Y(top)}`;
    d += `L${X(-hw)},${Y(bottom)}`;
  }
  d += 'Z';
  // Arch opening (sub-path, removed by even-odd).
  const r = ARCH_HW * w;
  d += `M${X(-ARCH_HW)},${Y(GATE_TIERS[1][1])}`;
  d += `L${X(-ARCH_HW)},${Y(ARCH_SPRING)}`;
  d += `A${fmt(r)},${fmt(r)} 0 0,1 ${X(ARCH_HW)},${Y(ARCH_SPRING)}`;
  d += `L${X(ARCH_HW)},${Y(GATE_TIERS[1][1])}Z`;
  return d;
};

type GateProps = {
  cx: number;
  baseY: number;
  width: number;
  fill: string;
  /** Adds cornice lines, pier panels and the inscription band (for large sizes). */
  detail?: {line: string; light: string} | null;
  opacity?: number;
};

export const IndiaGate: React.FC<GateProps> = ({cx, baseY, width: w, fill, detail, opacity = 1}) => {
  const X = (u: number) => cx + u * w;
  const Y = (h: number) => baseY - h * w;
  return (
    <g opacity={opacity}>
      <path d={indiaGatePath(cx, baseY, w)} fill={fill} fillRule="evenodd" />
      {detail ? (
        <g>
          {/* cornice shadows */}
          {[0.8, 1.02, 1.052, 1.1, 1.145].map((h) => (
            <rect key={h} x={X(-0.5)} y={Y(h)} width={w} height={Math.max(1.5, w * 0.008)} fill={detail.line} />
          ))}
          {/* inscription band */}
          <rect x={X(-0.33)} y={Y(0.985)} width={w * 0.66} height={w * 0.1} fill={detail.light} rx={w * 0.01} />
          {/* pier panels */}
          {[-1, 1].map((s) => (
            <g key={s}>
              <rect x={X(s > 0 ? 0.25 : -0.4)} y={Y(0.74)} width={w * 0.15} height={w * 0.58} fill={detail.line} opacity={0.45} rx={w * 0.01} />
              <rect x={X(s > 0 ? 0.268 : -0.382)} y={Y(0.72)} width={w * 0.114} height={w * 0.54} fill={fill} rx={w * 0.01} />
            </g>
          ))}
          {/* arch reveal */}
          <path
            d={`M${X(-ARCH_HW)},${Y(0.058)}L${X(-ARCH_HW)},${Y(ARCH_SPRING)}A${ARCH_HW * w},${ARCH_HW * w} 0 0,1 ${X(ARCH_HW)},${Y(ARCH_SPRING)}L${X(ARCH_HW)},${Y(0.058)}`}
            fill="none"
            stroke={detail.line}
            strokeWidth={w * 0.022}
            opacity={0.7}
          />
        </g>
      ) : null}
    </g>
  );
};

/** Qutub Minar: a tapering fluted tower with balcony rings. Height in px. */
export const QutubMinar: React.FC<{cx: number; baseY: number; height: number; fill: string; opacity?: number}> = ({
  cx,
  baseY,
  height: h,
  fill,
  opacity = 1,
}) => {
  const base = h * 0.075;
  const top = h * 0.03;
  const hwAt = (t: number) => base + (top - base) * t;
  const balconies = [0.33, 0.55, 0.71, 0.83, 0.92];
  const pts: string[] = [];
  const right: Array<[number, number]> = [];
  right.push([hwAt(0), 0]);
  balconies.forEach((b) => {
    right.push([hwAt(b - 0.012), b - 0.012]);
    right.push([hwAt(b) + h * 0.016, b - 0.004]);
    right.push([hwAt(b) + h * 0.016, b + 0.008]);
    right.push([hwAt(b + 0.012), b + 0.012]);
  });
  right.push([hwAt(0.97), 0.97]);
  right.forEach(([x, t]) => pts.push(`${fmt(cx + x)},${fmt(baseY - t * h)}`));
  const left = [...right].reverse().map(([x, t]) => `${fmt(cx - x)},${fmt(baseY - t * h)}`);
  const cupolaR = h * 0.022;
  return (
    <g opacity={opacity} fill={fill}>
      <polygon points={[...pts, ...left].join(' ')} />
      <path
        d={`M${fmt(cx - cupolaR)},${fmt(baseY - 0.97 * h)}Q${fmt(cx)},${fmt(baseY - h * 1.02)} ${fmt(cx + cupolaR)},${fmt(baseY - 0.97 * h)}Z`}
      />
      <rect x={cx - 0.6} y={baseY - h * 1.045} width={1.2} height={h * 0.03} />
    </g>
  );
};

/** A simple set-back tower silhouette. */
export const Tower: React.FC<{x: number; baseY: number; w: number; h: number; fill: string; setback?: number; antenna?: boolean}> = ({
  x,
  baseY,
  w,
  h,
  fill,
  setback = 0.18,
  antenna = false,
}) => {
  const s = w * setback;
  return (
    <g fill={fill}>
      <rect x={x} y={baseY - h * 0.86} width={w} height={h * 0.86} />
      <rect x={x + s} y={baseY - h} width={w - 2 * s} height={h * 0.15} />
      {antenna ? <rect x={x + w / 2 - 1} y={baseY - h - h * 0.12} width={2} height={h * 0.12} /> : null}
    </g>
  );
};
