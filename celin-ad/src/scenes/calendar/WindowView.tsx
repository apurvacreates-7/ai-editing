import React from 'react';
import {HORIZON_Y, TIMING} from '../../config';
import {blend, rgba} from '../../lib/color';
import {EASE, tween} from '../../lib/motion';
import {seeded} from '../../lib/prng';
import {C} from '../../theme';
import {IndiaGate, QutubMinar, Tower} from '../../components/Landmarks';

/** Tall window on the right. The glass runs from the top molding down to the horizon (62%). */
export const WIN = {
  frameX: 830,
  frameTop: 164,
  molding: 18,
  get glassX() {
    return this.frameX + this.molding;
  },
  get glassTop() {
    return this.frameTop + this.molding;
  },
  glassRight: 1080,
  transomY: 424,
};

type WState = {
  skyTop: string;
  skyBottom: string;
  far: string;
  city: string;
  trees: string;
  gate: string;
};

// cover (late summer), July, October, November, smog
const STATES: WState[] = [
  {skyTop: '#E4D6BC', skyBottom: '#F1E8D6', far: '#CBBEA4', city: '#A39478', trees: '#978B6E', gate: '#A39478'},
  {skyTop: C.monsoonSky, skyBottom: '#C3CDB8', far: '#8FA08E', city: '#5C7060', trees: C.monsoonTrees, gate: '#5C7060'},
  {skyTop: C.clearSky, skyBottom: '#E8EFF0', far: '#A6B5BD', city: '#6A7B86', trees: '#6B7E69', gate: '#6A7B86'},
  {skyTop: '#9DA3A7', skyBottom: '#BDBAB2', far: '#9A9B97', city: '#6B6E6F', trees: '#686B64', gate: '#6B6E6F'},
  {skyTop: '#9A8F80', skyBottom: '#B9AD9A', far: '#ABA090', city: '#968B7C', trees: '#8F8475', gate: '#958A7B'},
];

/** Continuous weather position 0..4, eased around each page flip. */
export const weatherPosition = (frame: number) =>
  TIMING.flips.reduce((acc, start) => acc + tween(frame, start + 4, start + 20, [0, 1], EASE.inOut), 0);

export const weatherWeights = (frame: number) => {
  const pos = weatherPosition(frame);
  return STATES.map((_, i) => Math.max(0, 1 - Math.abs(pos - i)));
};

const pick = (w: number[], key: keyof WState) => blend(STATES.map((s, i) => [s[key], w[i]] as const));

const RAIN = (() => {
  const r = seeded('rain');
  return Array.from({length: 38}).map(() => ({
    x: WIN.frameX + 10 + r() * 280,
    y: r() * 1100,
    len: 48 + r() * 46,
    speed: 30 + r() * 14,
    o: 0.3 + r() * 0.35,
  }));
})();

const SMOG_BANDS = [
  {y: 1140, ry: 80, o: 0.7, c: '#A69A88', speed: 0.35, amp: 18},
  {y: 1040, ry: 90, o: 0.55, c: '#9C9285', speed: -0.25, amp: 24},
  {y: 930, ry: 100, o: 0.45, c: '#A89B87', speed: 0.2, amp: 20},
  {y: 640, ry: 130, o: 0.38, c: '#9F9588', speed: -0.18, amp: 28},
  {y: 420, ry: 150, o: 0.32, c: '#A2978A', speed: 0.15, amp: 30},
];

export const WindowView: React.FC<{frame: number}> = ({frame}) => {
  const w = weatherWeights(frame);
  const [wCover, wJuly, wOct, wNov, wSmog] = w;
  const g = {x: WIN.glassX, top: WIN.glassTop, right: WIN.glassRight};
  const glassW = g.right - g.x;
  const base = HORIZON_Y;
  const skyTop = pick(w, 'skyTop');
  const skyBottom = pick(w, 'skyBottom');
  const far = pick(w, 'far');
  const city = pick(w, 'city');
  const trees = pick(w, 'trees');
  const gate = pick(w, 'gate');

  // Smog thickens after the final flip lands.
  const smogDensity = wSmog * tween(frame, TIMING.flips[3] + 6, TIMING.flips[3] + 40, [0.7, 1], EASE.out);

  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{position: 'absolute', left: 0, top: 0, overflow: 'hidden'}}
    >
      <defs>
        <clipPath id="glass">
          <rect x={g.x} y={g.top} width={glassW} height={base - g.top} />
        </clipPath>
        <linearGradient id="winSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBottom} />
        </linearGradient>
        <radialGradient id="paleSun">
          <stop offset="0" stopColor={C.paleSun} stopOpacity={0.95} />
          <stop offset="0.55" stopColor={C.paleSun} stopOpacity={0.85} />
          <stop offset="1" stopColor={C.paleSun} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="octSun">
          <stop offset="0" stopColor="#FFFBF2" stopOpacity={1} />
          <stop offset="0.45" stopColor="#FFF6E4" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFF6E4" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="novHaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7B5AE" stopOpacity={0} />
          <stop offset="1" stopColor="#B7B5AE" stopOpacity={0.75} />
        </linearGradient>
        <filter id="smogBlur" x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <g clipPath="url(#glass)">
        <rect x={g.x} y={g.top} width={glassW} height={base - g.top} fill="url(#winSky)" />

        {/* October sun */}
        {wOct > 0.001 ? (
          <g opacity={wOct}>
            <circle cx={1000} cy={330} r={70} fill="url(#octSun)" />
            <circle cx={1000} cy={330} r={24} fill="#FFFCF5" />
          </g>
        ) : null}

        {/* monsoon cloud bank */}
        {wJuly > 0.001 ? (
          <g opacity={wJuly} fill="#7C8F80" filter="url(#softBlur)">
            {[0, 1, 2, 3, 4].map((i) => (
              <ellipse
                key={i}
                cx={g.x + 20 + i * 62 + Math.sin(frame / 40 + i) * 8}
                cy={g.top + 60 + (i % 2) * 40}
                rx={90}
                ry={62}
              />
            ))}
          </g>
        ) : null}

        {/* November: the light dims, a first haze gathers on the horizon */}
        {wNov > 0.001 ? (
          <g opacity={wNov}>
            <rect x={g.x} y={base - 420} width={glassW} height={420} fill="url(#novHaze)" />
            <g fill="#C4C2BC" opacity={0.55} filter="url(#softBlur)">
              <rect x={g.x - 30 + Math.sin(frame / 30) * 12} y={430} width={260} height={10} rx={5} />
              <rect x={g.x + 40 + Math.sin(frame / 36 + 1) * 10} y={560} width={220} height={8} rx={4} />
            </g>
          </g>
        ) : null}

        {/* skyline */}
        <g>
          <QutubMinar cx={876} baseY={base} height={250} fill={far} />
          <Tower x={1024} baseY={base} w={48} h={300} fill={far} antenna />
          <Tower x={846} baseY={base} w={40} h={150} fill={far} />
          <Tower x={1062} baseY={base} w={40} h={190} fill={city} />
          <IndiaGate cx={958} baseY={base} width={112} fill={gate} />
          <Tower x={880} baseY={base} w={26} h={96} fill={city} setback={0.2} />
          {/* tree canopy along the base */}
          <g fill={trees}>
            {[
              [852, 18],
              [880, 24],
              [912, 16],
              [1004, 20],
              [1034, 26],
              [1068, 22],
            ].map(([x, r], i) => (
              <circle key={i} cx={x} cy={base - r * 0.5} r={r} />
            ))}
            <rect x={g.x} y={base - 12} width={glassW} height={12} />
          </g>
        </g>

        {/* rain */}
        {wJuly > 0.001 ? (
          <g opacity={wJuly} stroke="#EEF3EC" strokeLinecap="round">
            {RAIN.map((d, i) => {
              const span = base - g.top + 200;
              const y = g.top - 100 + ((d.y + frame * d.speed) % span);
              const dx = d.len * 0.22;
              return <line key={i} x1={d.x} y1={y} x2={d.x - dx} y2={y + d.len} strokeWidth={2.2} opacity={d.o} />;
            })}
          </g>
        ) : null}

        {/* smog layers */}
        {wSmog > 0.001 ? (
          <g filter="url(#smogBlur)">
            {SMOG_BANDS.map((b, i) => {
              const drift = tween(frame, TIMING.flips[3], TIMING.scene1.end + 10, [0, 1], EASE.inOutSoft) * b.speed * 60;
              const x = g.x + glassW / 2 + Math.sin(frame / 38 + i * 1.7) * b.amp + drift;
              return (
                <ellipse key={i} cx={x} cy={b.y} rx={300} ry={b.ry} fill={b.c} opacity={b.o * smogDensity} />
              );
            })}
            <rect x={g.x - 40} y={g.top} width={glassW + 80} height={base - g.top} fill="#A09483" opacity={0.22 * smogDensity} />
          </g>
        ) : null}

        {/* pale orange sun, a crisp disc through the smog */}
        {wSmog > 0.001 ? (
          <g opacity={wSmog}>
            <circle cx={968} cy={800} r={110} fill="url(#paleSun)" opacity={0.5} />
            <circle cx={968} cy={800} r={38} fill={C.paleSun} opacity={0.96} />
            <ellipse cx={968} cy={842} rx={150} ry={18} fill="#A69A88" opacity={0.5 * smogDensity} filter="url(#softBlur)" />
          </g>
        ) : null}

        {/* cover state: warm haze near the horizon */}
        {wCover > 0.001 ? <rect x={g.x} y={base - 260} width={glassW} height={260} fill="#EFE3CB" opacity={0.25 * wCover} /> : null}

        {/* glass reflection */}
        <path
          d={`M${g.x + 40},${g.top} L${g.x + 120},${g.top} L${g.x + 20},${g.top + 520} L${g.x - 60},${g.top + 520}Z`}
          fill="#FFFFFF"
          opacity={0.07}
        />
        {/* inner edge shading */}
        <rect x={g.x} y={g.top} width={14} height={base - g.top} fill={rgba(C.slate, 0.12)} />
        <rect x={g.x} y={g.top} width={glassW} height={10} fill={rgba(C.slate, 0.14)} />
      </g>

      {/* window frame (left molding, head, transom) */}
      <g fill={C.slateMid}>
        <rect x={WIN.frameX} y={WIN.frameTop} width={WIN.molding} height={base - WIN.frameTop} />
        <rect x={WIN.frameX} y={WIN.frameTop} width={1080 - WIN.frameX} height={WIN.molding} />
        <rect x={WIN.frameX} y={WIN.transomY} width={1080 - WIN.frameX} height={12} />
      </g>
      <rect x={WIN.frameX + 3} y={WIN.frameTop + 3} width={3} height={base - WIN.frameTop - 3} fill={C.slateSoft} opacity={0.6} />
    </svg>
  );
};
