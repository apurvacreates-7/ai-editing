import React from 'react';
import {shade} from '../../lib/color';
import {add, capsule, dirDown, fmt, lerpV, rotateAround, scale, smoothPath, Vec} from '../../lib/geometry';
import {Build, headPoint, Joints, Limb, torsoPoint} from './rig';

export type TopStyle = 'hoodie' | 'kurta' | 'kameez' | 'sweater' | 'shortKurta';
export type HairStyle = 'short' | 'receding' | 'bun' | 'ponytail' | 'child';

export type Outfit = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  topStyle: TopStyle;
  /** hem height above the ground for long tops, as a fraction of H */
  hem?: number;
  sleeve: string;
  cuff?: string;
  bottoms: string;
  /** trouser width multiplier (salwar / pyjama are looser) */
  loose?: number;
  shoes: string;
  jacket?: string;
  muffler?: {color: string; stripe: string};
  dupatta?: string;
  glasses?: string;
  bag?: string;
  tote?: string;
};

export type Extras = {
  /** 0 = muffler around the neck, 1 = pulled up over nose and mouth */
  mufflerUp?: number;
  /** walk phase, used for cloth sway */
  sway?: number;
  /** close the near hand (fist) */
  fist?: number;
};

/** Colour transform for the current mood (warm or smog). */
export type Tone = (c: string) => string;

const shoePath = (B: Build, ankle: Vec, angle: number): string => {
  const L = B.foot;
  const h = B.H * 0.045;
  // foot-local points (x forward, y down) with the ankle at the origin
  const pts: Vec[] = [
    {x: -0.2 * L, y: -0.25 * h},
    {x: -0.24 * L, y: 0.55 * h},
    {x: -0.14 * L, y: 1.0 * h},
    {x: 0.55 * L, y: 1.0 * h},
    {x: 0.8 * L, y: 0.92 * h},
    {x: 0.86 * L, y: 0.55 * h},
    {x: 0.62 * L, y: 0.12 * h},
    {x: 0.22 * L, y: -0.3 * h},
  ];
  const world = pts.map((p) => rotateAround(add(ankle, p), ankle, angle));
  return smoothPath(world, true, 0.9);
};

const handPath = (B: Build, limb: Limb, fist: number): string => {
  const dir = dirDown(limb.endAngle);
  const len = B.hand * (1 - 0.45 * fist);
  const tip = add(limb.end, scale(dir, len));
  return capsule(add(limb.end, scale(dir, B.H * 0.006)), B.H * (0.02 + 0.003 * fist), tip, B.H * (0.019 + 0.005 * fist));
};

/** Head outline in head space (x forward, y down, units of head height). */
const HEAD_PTS: Array<[number, number]> = [
  [-0.02, -0.5],
  [0.2, -0.46],
  [0.34, -0.32],
  [0.37, -0.14],
  [0.38, -0.05],
  [0.46, 0.07],
  [0.39, 0.115],
  [0.39, 0.17],
  [0.36, 0.205],
  [0.375, 0.245],
  [0.34, 0.36],
  [0.22, 0.42],
  [0.06, 0.4],
  [-0.06, 0.3],
  [-0.18, 0.27],
  [-0.38, 0.14],
  [-0.43, -0.12],
  [-0.34, -0.38],
];

const hairShapes: Record<HairStyle, Array<[number, number]>> = {
  short: [
    [0.33, -0.28],
    [0.3, -0.48],
    [0.08, -0.62],
    [-0.2, -0.6],
    [-0.42, -0.42],
    [-0.47, -0.12],
    [-0.39, 0.1],
    [-0.28, 0.02],
    [-0.14, -0.08],
    [0.02, -0.22],
    [0.18, -0.3],
  ],
  child: [
    [0.34, -0.26],
    [0.3, -0.5],
    [0.06, -0.6],
    [-0.22, -0.56],
    [-0.43, -0.36],
    [-0.46, -0.06],
    [-0.38, 0.12],
    [-0.26, 0.0],
    [-0.12, -0.1],
    [0.06, -0.24],
    [0.2, -0.3],
  ],
  receding: [
    [-0.04, -0.44],
    [-0.28, -0.44],
    [-0.44, -0.24],
    [-0.46, 0.02],
    [-0.38, 0.14],
    [-0.27, 0.04],
    [-0.14, -0.06],
    [-0.06, -0.14],
    [0.02, -0.3],
  ],
  bun: [
    [0.3, -0.34],
    [0.24, -0.5],
    [0.02, -0.58],
    [-0.24, -0.54],
    [-0.44, -0.34],
    [-0.5, -0.04],
    [-0.44, 0.16],
    [-0.3, 0.12],
    [-0.16, -0.02],
    [-0.02, -0.2],
    [0.14, -0.3],
  ],
  ponytail: [
    [0.3, -0.34],
    [0.24, -0.5],
    [0.02, -0.59],
    [-0.24, -0.55],
    [-0.44, -0.36],
    [-0.5, -0.06],
    [-0.44, 0.14],
    [-0.3, 0.1],
    [-0.16, -0.02],
    [-0.02, -0.2],
    [0.14, -0.3],
  ],
};

type Props = {
  B: Build;
  j: Joints;
  outfit: Outfit;
  tone: Tone;
  extras?: Extras;
  /** render only part of the figure (used to put the mother's arm around the child) */
  part?: 'all' | 'body' | 'nearArm';
};

/**
 * Flat-vector figure in profile, facing +x. Mirror with a parent transform
 * to face left. No facial features: silhouette, skin, hair and cloth only.
 */
export const Person: React.FC<Props> = ({B, j, outfit: o, tone, extras = {}, part = 'all'}) => {
  const H = B.H;
  const loose = o.loose ?? 1;
  const far = (c: string) => tone(shade(c, -0.16));
  const skin = tone(o.skin);
  const sway = extras.sway ?? 0;
  const muff = extras.mufflerUp ?? 0;
  const fist = extras.fist ?? 0;

  const legShapes = (limb: Limb, color: string, shoeColor: string) => (
    <g>
      <path d={capsule(limb.root, B.thighR[0] * loose, limb.mid, B.thighR[1] * loose)} fill={color} />
      <path d={capsule(limb.mid, B.shinR[0] * loose, limb.end, B.shinR[1] * (loose > 1 ? loose * 0.92 : 1))} fill={color} />
      {loose > 1.1 ? (
        <path d={capsule(limb.end, B.shinR[1] * 0.9, add(limb.end, {x: 0, y: -H * 0.03}), B.shinR[1] * 1.05)} fill={shade(color, -0.08)} />
      ) : null}
      <path d={shoePath(B, limb.end, limb.endAngle)} fill={shoeColor} />
    </g>
  );

  const armShapes = (limb: Limb, sleeve: string, cuff: string | undefined, handColor: string, isNear: boolean) => (
    <g>
      <path d={capsule(limb.root, B.upperArmR[0], limb.mid, B.upperArmR[1])} fill={sleeve} />
      <path d={capsule(limb.mid, B.forearmR[0], limb.end, B.forearmR[1])} fill={sleeve} />
      {cuff ? (
        <path
          d={capsule(lerpV(limb.mid, limb.end, 0.82), B.forearmR[1] * 1.08, limb.end, B.forearmR[1] * 1.06)}
          fill={cuff}
        />
      ) : null}
      <path d={handPath(B, limb, isNear ? fist : 0)} fill={handColor} />
    </g>
  );

  // ---- torso garment ----------------------------------------------------
  const T = (x: number, y: number) => torsoPoint(B, j, x, y);
  const kneeFront = Math.max(j.nearLeg.mid.x, j.farLeg.mid.x);
  const kneeBack = Math.min(j.nearLeg.mid.x, j.farLeg.mid.x);
  const upper: Vec[] = [];
  const isLong = o.topStyle === 'kurta' || o.topStyle === 'kameez' || o.topStyle === 'shortKurta';
  const chest = o.topStyle === 'kameez' || o.topStyle === 'shortKurta' ? 0.088 : o.topStyle === 'sweater' ? 0.092 : 0.098;
  if (isLong) {
    const hemY = -(o.hem ?? 0.3) * H;
    const flare = o.topStyle === 'shortKurta' ? 0.02 * H : 0.035 * H;
    const hemSway = Math.sin(sway * Math.PI * 2) * 0.012 * H;
    upper.push(
      T(0.078, 0.03),
      T(chest, 0.12),
      T(chest + 0.004, 0.2),
      T(0.07, 0.27),
      T(0.035, 0.305),
      T(-0.045, 0.31),
      T(-0.082, 0.25),
      T(-0.078, 0.12),
      T(-0.074, 0.02),
      {x: Math.min(kneeBack, j.hip.x - 0.05 * H) - flare + hemSway, y: hemY + 0.02 * H},
      {x: Math.min(kneeBack, j.hip.x - 0.05 * H) - flare * 0.6 + hemSway, y: hemY},
      {x: Math.max(kneeFront, j.hip.x + 0.06 * H) + flare * 0.6 + hemSway, y: hemY},
      {x: Math.max(kneeFront, j.hip.x + 0.06 * H) + flare + hemSway, y: hemY + 0.02 * H},
    );
  } else {
    upper.push(
      T(0.082, -0.04),
      T(0.088, 0.06),
      T(chest, 0.17),
      T(0.078, 0.26),
      T(0.035, 0.305),
      T(-0.045, 0.31),
      T(-0.086, 0.24),
      T(-0.082, 0.1),
      T(-0.078, -0.04),
    );
  }
  // reorder so the outline runs around the shape
  const garment = isLong
    ? smoothPath([...upper.slice(0, 9), upper[9], upper[10], upper[11], upper[12]].reverse(), true, 0.7)
    : smoothPath(upper, true, 0.8);

  const hoodPts = [T(-0.02, 0.3), T(-0.07, 0.33), T(-0.1, 0.3), T(-0.1, 0.24), T(-0.06, 0.27)];

  const headPath = smoothPath(
    HEAD_PTS.map(([x, y]) => headPoint(B, j, x, y)),
    true,
    0.75,
  );
  const hairPath = smoothPath(
    hairShapes[o.hairStyle].map(([x, y]) => headPoint(B, j, x, y)),
    true,
    0.85,
  );
  const neck = capsule(j.shoulder, H * 0.028, add(j.headC, {x: -B.head * 0.06, y: B.head * 0.18}), H * 0.024);

  // ---- muffler ----------------------------------------------------------
  let muffler: React.ReactNode = null;
  if (o.muffler) {
    const downA = T(-0.05, 0.3);
    const downB = T(0.05, 0.3);
    const upA = headPoint(B, j, -0.2, 0.28);
    const upB = headPoint(B, j, 0.46, 0.2);
    const a = lerpV(downA, upA, muff);
    const b = lerpV(downB, upB, muff);
    const w = H * (0.028 + 0.006 * muff);
    const tailTop = lerpV(T(0.06, 0.28), headPoint(B, j, 0.3, 0.32), muff * 0.6);
    const tailEnd = add(tailTop, {x: H * (0.012 + Math.sin(sway * Math.PI * 2 + 1) * 0.008), y: H * (0.15 - 0.03 * muff)});
    muffler = (
      <g>
        <path d={capsule(tailTop, H * 0.024, tailEnd, H * 0.022)} fill={tone(shade(o.muffler.color, -0.1))} />
        <path d={capsule(a, w, b, w)} fill={tone(o.muffler.color)} />
        <path d={capsule(lerpV(a, b, 0.15), w * 0.28, lerpV(a, b, 0.85), w * 0.28)} fill={tone(o.muffler.stripe)} opacity={0.8} />
      </g>
    );
  }

  // ---- dupatta ------------------------------------------------------------
  let dupattaBack: React.ReactNode = null;
  let dupattaFront: React.ReactNode = null;
  if (o.dupatta) {
    const c = tone(o.dupatta);
    const s = Math.sin(sway * Math.PI * 2);
    const shoulderBack = T(-0.07, 0.28);
    const tailEnd = {x: shoulderBack.x - H * (0.035 + 0.012 * s), y: shoulderBack.y + H * 0.3};
    dupattaBack = (
      <path
        d={smoothPath(
          [shoulderBack, {x: shoulderBack.x - H * 0.03, y: shoulderBack.y + H * 0.14}, tailEnd, {x: tailEnd.x + H * 0.03, y: tailEnd.y - H * 0.005}, {x: shoulderBack.x + H * 0.005, y: shoulderBack.y + H * 0.12}, T(-0.03, 0.28)],
          true,
          0.8,
        )}
        fill={shade(c, -0.12)}
      />
    );
    dupattaFront = (
      <path
        d={smoothPath([T(-0.055, 0.31), T(0.05, 0.3), T(0.1, 0.2), T(0.095, 0.13), T(0.04, 0.2), T(-0.03, 0.26)], true, 0.8)}
        fill={c}
      />
    );
  }

  // ---- child backpack / tote ---------------------------------------------
  const bag = o.bag ? (
    <path
      d={smoothPath([T(-0.07, 0.27), T(-0.2, 0.25), T(-0.21, 0.06), T(-0.08, 0.05)], true, 0.6)}
      fill={tone(o.bag)}
    />
  ) : null;
  const tote = o.tote ? (
    <g>
      <path
        d={`M${fmt(T(-0.04, 0.29).x)},${fmt(T(-0.04, 0.29).y)} L${fmt(T(-0.13, 0.02).x)},${fmt(T(-0.13, 0.02).y)}`}
        stroke={tone(shade(o.tote, -0.2))}
        strokeWidth={H * 0.008}
        fill="none"
      />
      <path d={smoothPath([T(-0.07, 0.04), T(-0.19, 0.04), T(-0.2, -0.13), T(-0.06, -0.13)], true, 0.3)} fill={tone(o.tote)} />
    </g>
  ) : null;

  const glasses = o.glasses ? (
    <g stroke={tone(o.glasses)} strokeWidth={H * 0.004} fill="none">
      <path
        d={`M${fmt(headPoint(B, j, -0.1, -0.04).x)},${fmt(headPoint(B, j, -0.1, -0.04).y)} L${fmt(headPoint(B, j, 0.3, -0.07).x)},${fmt(
          headPoint(B, j, 0.3, -0.07).y,
        )}`}
      />
      <path
        d={smoothPath([headPoint(B, j, 0.25, -0.12), headPoint(B, j, 0.38, -0.12), headPoint(B, j, 0.38, -0.01), headPoint(B, j, 0.26, -0.01)], true, 0.4)}
      />
    </g>
  ) : null;

  const nearArm = armShapes(j.nearArm, tone(o.sleeve), o.cuff ? tone(o.cuff) : undefined, skin, true);

  if (part === 'nearArm') return <g>{nearArm}</g>;

  return (
    <g>
      {tote}
      {dupattaBack}
      {armShapes(j.farArm, far(o.sleeve), o.cuff ? far(o.cuff) : undefined, far(o.skin), false)}
      {legShapes(j.farLeg, far(o.bottoms), far(o.shoes))}
      {legShapes(j.nearLeg, tone(o.bottoms), tone(o.shoes))}
      {bag}
      <path d={neck} fill={tone(shade(o.skin, -0.06))} />
      {o.topStyle === 'hoodie' ? <path d={smoothPath(hoodPts, true, 0.9)} fill={tone(shade(o.top, -0.1))} /> : null}
      <path d={garment} fill={tone(o.top)} />
      {o.jacket ? (
        <g>
          <path
            d={smoothPath([T(0.08, -0.03), T(0.088, 0.1), T(0.096, 0.19), T(0.066, 0.272), T(0.026, 0.3), T(-0.044, 0.304), T(-0.08, 0.24), T(-0.076, 0.1), T(-0.07, -0.03)], true, 0.75)}
            fill={tone(o.jacket)}
          />
          <path
            d={`M${fmt(T(0.03, 0.302).x)},${fmt(T(0.03, 0.302).y)} L${fmt(T(0.082, 0.19).x)},${fmt(T(0.082, 0.19).y)} L${fmt(T(0.078, -0.02).x)},${fmt(T(0.078, -0.02).y)}`}
            fill="none"
            stroke={tone(shade(o.jacket, 0.25))}
            strokeWidth={H * 0.004}
          />
          <path d={capsule(T(-0.03, 0.305), H * 0.012, T(0.03, 0.31), H * 0.012)} fill={tone(shade(o.jacket, -0.1))} />
        </g>
      ) : null}
      {o.topStyle === 'hoodie' ? (
        <path
          d={`M${fmt(T(0.05, 0.29).x)},${fmt(T(0.05, 0.29).y)} L${fmt(T(0.07, 0.19).x)},${fmt(T(0.07, 0.19).y)}`}
          stroke={tone(shade(o.top, 0.35))}
          strokeWidth={H * 0.005}
          strokeLinecap="round"
        />
      ) : null}
      <path d={headPath} fill={skin} />
      <ellipse
        cx={headPoint(B, j, -0.07, 0.02).x}
        cy={headPoint(B, j, -0.07, 0.02).y}
        rx={B.head * 0.065}
        ry={B.head * 0.095}
        fill={tone(shade(o.skin, -0.12))}
        transform={`rotate(${j.headAngle} ${headPoint(B, j, -0.07, 0.02).x} ${headPoint(B, j, -0.07, 0.02).y})`}
      />
      <path d={hairPath} fill={tone(o.hair)} />
      {o.hairStyle === 'bun' ? (
        <circle cx={headPoint(B, j, -0.5, 0.02).x} cy={headPoint(B, j, -0.5, 0.02).y} r={B.head * 0.15} fill={tone(o.hair)} />
      ) : null}
      {o.hairStyle === 'ponytail' ? (
        <path
          d={capsule(headPoint(B, j, -0.44, -0.02), B.head * 0.1, headPoint(B, j, -0.62 - 0.04 * Math.sin(sway * Math.PI * 2), 0.5), B.head * 0.06)}
          fill={tone(o.hair)}
        />
      ) : null}
      {glasses}
      {dupattaFront}
      {muffler}
      {part === 'body' ? null : nearArm}
    </g>
  );
};
