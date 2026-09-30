import React from 'react';
import {COPY} from '../../config';
import {FONT} from '../../fonts';
import {C} from '../../theme';

/** A single orange slice (citrus cross-section), drawn in SVG. */
export const OrangeSlice: React.FC<{size: number; rotate: number}> = ({size, rotate}) => {
  const segs = 10;
  const R = 100;
  return (
    <svg width={size} height={size} viewBox="-110 -110 220 220" style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="flesh" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFD9A8" />
          <stop offset="0.5" stopColor="#FFB05E" />
          <stop offset="1" stopColor="#FF9A3D" />
        </radialGradient>
        <filter id="sliceShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <circle cx={6} cy={12} r={R} fill="#A83C08" opacity={0.35} filter="url(#sliceShadow)" />
      <g transform={`rotate(${rotate})`}>
        <circle r={R} fill="#E0550E" />
        <circle r={R * 0.93} fill="#F58A3A" />
        <circle r={R * 0.87} fill="#FFF1DE" />
        {Array.from({length: segs}).map((_, i) => {
          const a0 = (i / segs) * Math.PI * 2 + 0.035;
          const a1 = ((i + 1) / segs) * Math.PI * 2 - 0.035;
          const r0 = R * 0.1;
          const r1 = R * 0.8;
          const p = (a: number, r: number) => `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
          return (
            <path
              key={i}
              d={`M${p(a0, r0)} L${p(a0, r1)} A${r1},${r1} 0 0,1 ${p(a1, r1)} L${p(a1, r0)} Z`}
              fill="url(#flesh)"
              stroke="#FFE3C2"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          );
        })}
        <circle r={R * 0.1} fill="#FFF1DE" />
        {/* juice vesicle highlights */}
        {Array.from({length: segs}).map((_, i) => {
          const a = ((i + 0.5) / segs) * Math.PI * 2;
          return <ellipse key={i} cx={Math.cos(a) * R * 0.5} cy={Math.sin(a) * R * 0.5} rx={6} ry={2.4} fill="#FFFFFF" opacity={0.35} transform={`rotate(${(a * 180) / Math.PI + 90} ${Math.cos(a) * R * 0.5} ${Math.sin(a) * R * 0.5})`} />;
        })}
      </g>
    </svg>
  );
};

/** WhatsApp-style glyph: green disc, white bubble ring with a tail, white handset. */
export const WhatsAppIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <circle cx={32} cy={32} r={32} fill={C.whatsapp} />
    <g fill="none" stroke="#FFFFFF" strokeWidth={3.6} strokeLinejoin="round">
      <path d="M32 12.5 A19.5 19.5 0 1 1 20.4 47.8 L12.6 50.4 L15.3 43 A19.5 19.5 0 0 1 32 12.5 Z" />
    </g>
    {/* handset (Material "call" glyph, Apache 2.0) */}
    <path
      transform="translate(20.2 20.4) scale(0.98)"
      fill="#FFFFFF"
      d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
    />
  </svg>
);

export const CtaButton: React.FC = () => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 22,
      padding: '24px 46px 24px 26px',
      background: '#FFFFFF',
      borderRadius: 999,
      boxShadow: '0 22px 44px rgba(122, 38, 0, 0.28), 0 4px 10px rgba(122, 38, 0, 0.16)',
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 44,
      letterSpacing: '-0.01em',
      color: C.slate,
      whiteSpace: 'nowrap',
    }}
  >
    <WhatsAppIcon size={70} />
    <span>{COPY.end.cta}</span>
  </div>
);

/**
 * Placeholder Celin pack, used only when no product photo is supplied.
 * A plain orange carton in three-quarter view with the brief's copy.
 */
export const DrawnPack: React.FC<{width: number}> = ({width}) => {
  const W = 330;
  const H = 540;
  const D = 76;
  const s = width / (W + D);
  return (
    <svg width={width} height={(H + D * 0.5) * s} viewBox={`0 ${-D * 0.5} ${W + D} ${H + D * 0.5}`} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="packFront" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A3F" />
          <stop offset="0.55" stopColor="#F46A1C" />
          <stop offset="1" stopColor="#E35B10" />
        </linearGradient>
        <linearGradient id="packSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C94F0B" />
          <stop offset="1" stopColor="#B04309" />
        </linearGradient>
      </defs>
      {/* top and side faces */}
      <path d={`M0,0 L${D},${-D * 0.5} L${W + D},${-D * 0.5} L${W},0 Z`} fill="#FF9F5F" />
      <path d={`M${W},0 L${W + D},${-D * 0.5} L${W + D},${H - D * 0.5} L${W},${H} Z`} fill="url(#packSide)" />
      {/* front face */}
      <rect x={0} y={0} width={W} height={H} fill="url(#packFront)" />
      <rect x={0} y={0} width={W} height={4} fill="#FFB27A" opacity={0.8} />
      <text x={W / 2} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={17} letterSpacing="2.5" fill="#FFFFFF" opacity={0.9}>
        {COPY.pack.maker.toUpperCase()}
      </text>
      {/* slice mark */}
      <g transform={`translate(${W / 2} 116)`}>
        <circle r={40} fill="none" stroke="#FFFFFF" strokeWidth={5} />
        {Array.from({length: 8}).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={0} y1={0} x2={Math.cos(a) * 33} y2={Math.sin(a) * 33} stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" />;
        })}
      </g>
      <text x={W / 2} y={244} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={92} letterSpacing="-2" fill="#FFFFFF">
        {COPY.pack.brand}
      </text>
      <text x={W / 2} y={294} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill="#FFFFFF">
        {COPY.pack.line1}
      </text>
      <text x={W / 2} y={332} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={25} fill="#FFFFFF" opacity={0.92}>
        {COPY.pack.line2}
      </text>
      {/* bottom band */}
      <path d={`M0,${H - 118} C${W * 0.3},${H - 150} ${W * 0.65},${H - 96} ${W},${H - 128} L${W},${H} L0,${H} Z`} fill={C.offWhite} />
      <path d={`M${W},${H - 128} L${W + D},${H - 128 - D * 0.5} L${W + D},${H - D * 0.5} L${W},${H} Z`} fill="#D8D2C6" />
      {/* edge highlight */}
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} fill="none" stroke="#FFB889" strokeWidth={1.5} opacity={0.6} />
    </svg>
  );
};
