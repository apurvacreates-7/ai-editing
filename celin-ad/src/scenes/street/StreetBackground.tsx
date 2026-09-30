import React from 'react';
import {HORIZON_Y} from '../../config';
import {mix} from '../../lib/color';
import {IndiaGate, Tower} from '../../components/Landmarks';

/** Picks between the warm and the smog colour for the current mood (0 warm, 1 smog). */
export type Col = (warm: string, smog: string) => string;
export const makeCol = (m: number): Col => (warm, smog) => mix(warm, smog, m);

const wrap = (v: number, min: number, max: number) => {
  const span = max - min;
  return ((((v - min) % span) + span) % span) + min;
};

const FAR_CITY: Array<[number, number, number, boolean]> = [
  // x, width, height, antenna
  [-20, 70, 70, false],
  [40, 46, 120, true],
  [96, 90, 58, false],
  [170, 38, 150, false],
  [214, 80, 64, false],
  [300, 60, 96, false],
  [770, 70, 88, false],
  [846, 40, 160, true],
  [896, 96, 60, false],
  [980, 52, 124, false],
  [1030, 80, 76, false],
];

const TREES: Array<[number, number]> = [
  // x offset, scale
  [0, 1],
  [230, 0.82],
  [470, 1.1],
  [700, 0.9],
  [950, 1.05],
];

const Tree: React.FC<{x: number; base: number; s: number; canopy: string; dark: string; trunk: string}> = ({
  x,
  base,
  s,
  canopy,
  dark,
  trunk,
}) => (
  <g>
    <rect x={x - 6 * s} y={base - 70 * s} width={12 * s} height={70 * s} fill={trunk} />
    <circle cx={x - 30 * s} cy={base - 92 * s} r={40 * s} fill={dark} />
    <circle cx={x + 26 * s} cy={base - 96 * s} r={44 * s} fill={dark} />
    <circle cx={x} cy={base - 122 * s} r={50 * s} fill={canopy} />
    <circle cx={x - 22 * s} cy={base - 104 * s} r={36 * s} fill={canopy} />
    <circle cx={x + 30 * s} cy={base - 108 * s} r={34 * s} fill={canopy} />
  </g>
);

const LampPost: React.FC<{x: number; base: number; fill: string; glass: string}> = ({x, base, fill, glass}) => (
  <g fill={fill}>
    <rect x={x - 11} y={base - 26} width={22} height={26} rx={3} />
    <rect x={x - 5} y={base - 360} width={10} height={340} />
    <rect x={x - 9} y={base - 250} width={18} height={10} rx={2} />
    <rect x={x - 14} y={base - 372} width={28} height={12} rx={3} />
    <rect x={x - 12} y={base - 420} width={24} height={48} rx={4} fill={glass} />
    <path d={`M${x - 16},${base - 420} L${x},${base - 440} L${x + 16},${base - 420}Z`} />
    <rect x={x - 1.5} y={base - 452} width={3} height={14} />
  </g>
);

/** Black kites circling high over the avenue (warm state only). */
const KITES = [
  {cx: 720, cy: 400, rx: 90, ry: 22, period: 150, phase: 0.2, s: 1},
  {cx: 820, cy: 500, rx: 64, ry: 16, period: 170, phase: 2.1, s: 0.8},
  {cx: 290, cy: 330, rx: 76, ry: 18, period: 160, phase: 4.0, s: 0.7},
];
const Kites: React.FC<{frame: number; fill: string; opacity: number}> = ({frame, fill, opacity}) => (
  <g fill={fill} opacity={opacity}>
    {KITES.map((k, i) => {
      const a = (frame / k.period) * Math.PI * 2 + k.phase;
      const x = k.cx + Math.cos(a) * k.rx;
      const y = k.cy + Math.sin(a) * k.ry;
      const dir = -Math.sin(a) >= 0 ? 1 : -1;
      const flex = 1 + 0.18 * Math.sin(frame / 7 + i * 2);
      return (
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(k.s * dir).toFixed(3)} ${(k.s * flex).toFixed(3)})`}>
          <path d="M-19,1 Q-10,-6 -1,-1 Q8,-6 19,1 Q9,-2 3,2 L4,7 L0,5 L-4,7 L-3,2 Q-9,-2 -19,1 Z" />
        </g>
      );
    })}
  </g>
);

export const STREET = {
  lawnTop: HORIZON_Y,
  hedgeTop: 1318,
  roadTop: 1370,
  curbTop: 1446,
  walkTop: 1470,
};

type Props = {
  col: Col;
  /** camera travel in px (world moves right as the group walks left) */
  scroll: number;
  /** strength of smog-only details (pale sun, thick haze) 0..1 */
  smog: number;
  /** strength of the warm sun glow 0..1 */
  warm: number;
  idSuffix: string;
  frame: number;
};

/** Everything behind the figures: sky, India Gate, trees, lamps, road and pavement. */
export const StreetBackground: React.FC<Props> = ({col, scroll, smog, warm, idSuffix, frame}) => {
  const s = STREET;
  const id = (n: string) => `${n}-${idSuffix}`;
  const skyTop = col('#EEE6D7', '#6B6964');
  const skyMid = col('#F3EBDD', '#88827A');
  const skyLow = col('#EAD8B8', '#A29684');
  return (
    <g>
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2={HORIZON_Y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="0.55" stopColor={skyMid} />
          <stop offset="1" stopColor={skyLow} />
        </linearGradient>
        <radialGradient id={id('sunGlow')}>
          <stop offset="0" stopColor="#FFF9EC" stopOpacity={0.95} />
          <stop offset="1" stopColor="#FFF9EC" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('paleSun')}>
          <stop offset="0" stopColor="#F4B98E" stopOpacity={0.7} />
          <stop offset="1" stopColor="#F4B98E" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={id('haze')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col('#F3E9D6', '#A39785')} stopOpacity={0} />
          <stop offset="0.6" stopColor={col('#F3E9D6', '#A39785')} stopOpacity={0.35 + 0.5 * smog} />
          <stop offset="1" stopColor={col('#F3E9D6', '#A39785')} stopOpacity={0.15 + 0.5 * smog} />
        </linearGradient>
        <linearGradient id={id('walk')} x1="0" y1={s.walkTop} x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={col('#DDCDAF', '#5D5F62')} />
          <stop offset="1" stopColor={col('#CBB894', '#46484C')} />
        </linearGradient>
      </defs>

      {/* sky */}
      <rect x={0} y={0} width={1080} height={HORIZON_Y + 4} fill={`url(#${id('sky')})`} />
      {warm > 0.001 ? <circle cx={300} cy={560} r={440} fill={`url(#${id('sunGlow')})`} opacity={warm} /> : null}
      {smog > 0.001 ? (
        <g opacity={smog}>
          <circle cx={286} cy={640} r={170} fill={`url(#${id('paleSun')})`} />
          <circle cx={286} cy={640} r={40} fill="#F4BA90" opacity={0.92} />
        </g>
      ) : null}

      {warm > 0.001 ? <Kites frame={frame} fill="#3B4150" opacity={0.62 * warm} /> : null}

      {/* far city */}
      <g transform={`translate(${wrap(scroll * 0.05, -40, 40)} 0)`}>
        {FAR_CITY.map(([x, w, h, ant], i) => (
          <Tower key={i} x={x} baseY={HORIZON_Y} w={w} h={h} fill={col('#DCCFB6', '#948C80')} antenna={ant} />
        ))}
      </g>

      {/* India Gate on the horizon */}
      <IndiaGate
        cx={540 + scroll * 0.03}
        baseY={HORIZON_Y}
        width={356}
        fill={col('#CDB894', '#8B8378')}
        detail={{line: col('#B8A27E', '#7F786E'), light: col('#DAC9A8', '#958D82')}}
      />

      {/* atmospheric haze on the horizon */}
      <rect x={0} y={HORIZON_Y - 330} width={1080} height={420} fill={`url(#${id('haze')})`} />

      {/* lawns and tree line */}
      <rect x={0} y={s.lawnTop} width={1080} height={s.hedgeTop - s.lawnTop} fill={col('#D2C9A6', '#6E6D66')} />
      <rect x={0} y={s.lawnTop} width={1080} height={6} fill={col('#C4BA93', '#66655E')} />
      <g>
        {TREES.map(([x, sc], i) => {
          const tx = wrap(x + scroll * 0.2, -140, 1220);
          return (
            <Tree
              key={i}
              x={tx}
              base={1296}
              s={sc}
              canopy={col('#A9A57F', '#5E5F5A')}
              dark={col('#95916D', '#565752')}
              trunk={col('#7E7260', '#4C4B47')}
            />
          );
        })}
      </g>

      {/* lamp posts */}
      <g>
        {[0, 1, 2, 3].map((i) => {
          const lx = wrap(i * 380 + 120 + scroll * 0.55, -200, 1320);
          return <LampPost key={i} x={lx} base={s.roadTop + 4} fill={col('#3F4551', '#2E3137')} glass={col('#F3E7CD', '#8F877B')} />;
        })}
      </g>

      {/* hedge */}
      <g fill={col('#A29C77', '#52534E')}>
        <rect x={0} y={s.hedgeTop + 14} width={1080} height={s.roadTop - s.hedgeTop - 10} />
        {Array.from({length: 16}).map((_, i) => (
          <circle key={i} cx={wrap(i * 76 + scroll * 0.65, -60, 1156)} cy={s.hedgeTop + 20} r={24} />
        ))}
      </g>

      {/* road */}
      <rect x={0} y={s.roadTop} width={1080} height={s.curbTop - s.roadTop} fill={col('#BFB39C', '#4B4E53')} />
      <g fill={col('#EDE4D2', '#6E7072')}>
        {Array.from({length: 10}).map((_, i) => (
          <rect key={i} x={wrap(i * 140 + scroll * 0.85, -140, 1260)} y={1404} width={70} height={6} rx={3} />
        ))}
      </g>

      {/* curb and pavement */}
      <rect x={0} y={s.curbTop} width={1080} height={s.walkTop - s.curbTop} fill={col('#E6DCC8', '#6C6D6E')} />
      <rect x={0} y={s.walkTop - 4} width={1080} height={4} fill={col('#CDBF9F', '#56585B')} />
      <rect x={0} y={s.walkTop} width={1080} height={1920 - s.walkTop} fill={`url(#${id('walk')})`} />
      <g stroke={col('#CBB996', '#505255')} strokeWidth={3}>
        {[1540, 1690, 1870].map((y) => (
          <line key={y} x1={0} y1={y} x2={1080} y2={y} />
        ))}
        {Array.from({length: 8}).map((_, i) => {
          const x = wrap(i * 190 + scroll, -190, 1330);
          return <line key={i} x1={x} y1={s.walkTop} x2={x - 30} y2={1920} />;
        })}
      </g>
    </g>
  );
};
