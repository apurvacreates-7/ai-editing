import React from 'react';
import {LOGO_ICON, LOGO_LETTERS, LOGO_VIEWBOX, LogoPart} from '../logoPaths';
import {shadowFor} from './Physical';
import {signed, useSF} from '../stop';

// Part order: 0 bow + lid, 1 box left, 2 box right, 3..11 the letters F R E E S T A N D.
export const LOGO_PARTS: LogoPart[] = [LOGO_ICON.bowLid, LOGO_ICON.boxL, LOGO_ICON.boxR, ...LOGO_LETTERS];

// Centres of each part in viewBox units, measured from the traced artwork.
const CENTRES: [number, number][] = [
  [286, 138],
  [133, 518],
  [433, 519],
  [866, 495],
  [1231, 496],
  [1595, 496],
  [1942, 496],
  [2307, 488],
  [2682, 496],
  [3018, 495],
  [3452, 495],
  [3894, 496],
];

export type PartPose = {dx?: number; dy?: number; rot?: number; lift?: number; opacity?: number};

type Props = {
  width: number;
  color?: string;
  /** Pose of every part, in stage pixels relative to its resting place. */
  pose?: (part: number) => PartPose;
  seed?: number;
  shadow?: boolean;
  shadowStrength?: number;
  jitter?: number;
};

export const Logo: React.FC<Props> = ({
  width,
  color = '#F6F5F1',
  pose,
  seed = 40,
  shadow = true,
  shadowStrength = 0.6,
  jitter = 1,
}) => {
  const sf = useSF();
  const k = width / LOGO_VIEWBOX.w;
  const height = LOGO_VIEWBOX.h * k;
  return (
    <div style={{position: 'relative', width, height}}>
      {LOGO_PARTS.map((part, i) => {
        const p = pose ? pose(i) : {};
        if ((p.opacity ?? 1) <= 0) return null;
        const lift = p.lift ?? 0;
        const amp = jitter * (0.25 + 1.5 * lift);
        const jr = signed(seed + i * 3.1, sf) * amp * 0.25;
        const rot = (p.rot ?? 0) + jr;
        const sh = shadowFor(lift, rot, shadowStrength);
        const [cx, cy] = CENTRES[i];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: `${(cx * k).toFixed(1)}px ${(cy * k).toFixed(1)}px`,
              transform: `translate(${((p.dx ?? 0) + signed(seed + i, sf) * amp).toFixed(2)}px, ${((p.dy ?? 0) + signed(seed + i + 0.5, sf) * amp).toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${(1 + 0.05 * lift).toFixed(4)})`,
              opacity: p.opacity ?? 1,
              filter: shadow
                ? `drop-shadow(${sh.x.toFixed(1)}px ${sh.y.toFixed(1)}px ${(sh.blur * 0.45).toFixed(1)}px rgba(0,0,0,${sh.alpha.toFixed(3)}))`
                : undefined,
              color,
            }}
          >
            <svg
              viewBox={`0 0 ${LOGO_VIEWBOX.w} ${LOGO_VIEWBOX.h}`}
              width={width}
              height={height}
              style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
            >
              <path d={part.d} transform={`translate(${part.tx},${part.ty})`} fill="currentColor" />
            </svg>
          </div>
        );
      })}
    </div>
  );
};
