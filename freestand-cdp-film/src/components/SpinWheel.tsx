import React from 'react';
import {C, FONT} from '../theme';

// The Cadbury 5 Star "Spin & Win" wheel from the experience library, cut from card.
export const WHEEL_SEGMENTS = [
  {big: '50', small: 'JOY POINTS'},
  {big: '₹20', small: 'BLINKIT'},
  {big: 'TRY', small: 'AGAIN'},
  {big: 'FREE', small: '5 STAR'},
  {big: '100', small: 'JOY POINTS'},
  {big: '₹100', small: 'ZEPTO'},
  {big: '25', small: 'JOY POINTS'},
  {big: 'MYSTERY', small: 'DROP'},
];

const R = 220;
const RIM = 24;
export const WHEEL_SIZE = 2 * (R + RIM);

const Face: React.FC = () => {
  const c = WHEEL_SIZE / 2;
  const seg = (k: number) => {
    const a0 = ((k * 45 - 22.5 - 90) * Math.PI) / 180;
    const a1 = ((k * 45 + 22.5 - 90) * Math.PI) / 180;
    return `M ${c} ${c} L ${c + R * Math.cos(a0)} ${c + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${c + R * Math.cos(a1)} ${c + R * Math.sin(a1)} Z`;
  };
  return (
    <svg width={WHEEL_SIZE} height={WHEEL_SIZE} style={{display: 'block'}}>
      {WHEEL_SEGMENTS.map((s, k) => (
        <g key={k}>
          <path d={seg(k)} fill={k % 2 === 0 ? '#F8C743' : '#FFF0C4'} stroke="#E7B43A" strokeWidth={1.5} />
          <g transform={`rotate(${k * 45} ${c} ${c})`}>
            <text
              x={c}
              y={c - R * 0.68}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={800}
              fontSize={s.big.length > 4 ? 23 : 34}
              letterSpacing={s.big.length > 4 ? '0.02em' : '-0.02em'}
              fill={C.purpleDeep}
            >
              {s.big}
            </text>
            <text
              x={c}
              y={c - R * 0.68 + 24}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={700}
              fontSize={13}
              letterSpacing="0.12em"
              fill={C.purple}
            >
              {s.small}
            </text>
          </g>
        </g>
      ))}
      <circle cx={c} cy={c} r={R + RIM / 2} fill="none" stroke={C.purple} strokeWidth={RIM} />
      {Array.from({length: 16}, (_, i) => {
        const a = ((i * 22.5 - 90) * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={c + (R + RIM / 2) * Math.cos(a)}
            cy={c + (R + RIM / 2) * Math.sin(a)}
            r={5}
            fill={i % 2 ? '#FFE9A6' : '#FFFFFF'}
          />
        );
      })}
    </svg>
  );
};

// `smear` 0..1 adds the blurred "motion card" a stop-motion animator swaps in
// while a wheel is spinning fast.
export const SpinWheel: React.FC<{angle: number; smear?: number}> = ({angle, smear = 0}) => {
  const layer = (a: number, opacity: number, blur: number) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `rotate(${a.toFixed(2)}deg)`,
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    >
      <Face />
    </div>
  );
  return (
    <div style={{position: 'relative', width: WHEEL_SIZE, height: WHEEL_SIZE}}>
      {layer(angle, 1, smear > 0 ? smear * 2.5 : 0)}
      {smear > 0 ? layer(angle - 14 * smear, 0.45 * smear, 5 * smear) : null}
      {smear > 0 ? layer(angle - 28 * smear, 0.3 * smear, 8 * smear) : null}
      <svg width={WHEEL_SIZE} height={WHEEL_SIZE} style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx={WHEEL_SIZE / 2} cy={WHEEL_SIZE / 2} r={50} fill="#FFFFFF" stroke={C.purple} strokeWidth={7} />
        <text
          x={WHEEL_SIZE / 2}
          y={WHEEL_SIZE / 2 + 7}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={800}
          fontSize={20}
          letterSpacing="0.1em"
          fill={C.purple}
        >
          SPIN
        </text>
      </svg>
      <svg
        width={70}
        height={70}
        viewBox="0 0 70 70"
        style={{position: 'absolute', left: WHEEL_SIZE / 2 - 35, top: -30, filter: 'drop-shadow(2px 5px 3px rgba(0,0,0,0.45))'}}
      >
        <path d="M 12 10 L 58 10 L 35 58 Z" fill="#F8C743" stroke={C.purpleDeep} strokeWidth={5} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
