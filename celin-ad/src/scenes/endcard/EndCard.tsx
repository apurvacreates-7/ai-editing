import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COPY, HORIZON_Y, TIMING} from '../../config';
import {FONT} from '../../fonts';
import {EASE, tween} from '../../lib/motion';
import {C} from '../../theme';
import {BlisterStrip} from '../../components/Blister';
import {CtaButton, OrangeSlice} from './Props';
import {ProductShot} from './ProductShot';

/** Staggered fade-up for the type stack. */
const FadeUp: React.FC<{frame: number; at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  frame,
  at,
  children,
  style,
}) => {
  const d = TIMING.endFadeFrames;
  const o = tween(frame, at, at + d, [0, 1], EASE.out);
  const y = (1 - tween(frame, at, at + d + 4, [0, 1], EASE.outExpo)) * 30;
  return <div style={{opacity: o, transform: `translateY(${y}px)`, ...style}}>{children}</div>;
};

/** Frames 390 to 450: hard cut to the Celin end card. */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame() + TIMING.endCard;
  const [s1, s2, s3, s4] = TIMING.endStagger;
  const settle = tween(frame, TIMING.endCard, TIMING.endCard + 50, [0, 1], EASE.out);
  const productScale = 1.045 - 0.045 * settle;
  const sliceRot = -14 + 12 * tween(frame, TIMING.endCard, 450, [0, 1], EASE.inOutSoft);
  const stripsY = (1 - settle) * 14;

  return (
    <AbsoluteFill style={{backgroundColor: C.orange, fontFamily: FONT, overflow: 'hidden'}}>
      {/* single orange slice, top right */}
      <div style={{position: 'absolute', left: 1080 - 230, top: -120, width: 360, height: 360}}>
        <OrangeSlice size={360} rotate={sliceRot} />
      </div>

      {/* headline pair */}
      <div style={{position: 'absolute', top: 236, left: 0, width: 1080, textAlign: 'center', color: C.white}}>
        <FadeUp frame={frame} at={s1} style={{fontSize: 47, fontWeight: 500, letterSpacing: '-0.012em', lineHeight: 1.25}}>
          {COPY.end.line1}
        </FadeUp>
        <FadeUp frame={frame} at={s2} style={{fontSize: 47, fontWeight: 800, letterSpacing: '-0.015em', lineHeight: 1.25}}>
          {COPY.end.line2}
        </FadeUp>
      </div>

      {/* product standing on the 62% line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 1080,
          top: 420,
          height: HORIZON_Y - 420 + 10,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          transform: `scale(${productScale})`,
          transformOrigin: `540px ${HORIZON_Y - 420}px`,
        }}
      >
        <ProductShot maxW={600} maxH={HORIZON_Y - 440} />
      </div>

      {/* two drawn blister strips at the base */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{position: 'absolute', inset: 0, transform: `translateY(${stripsY}px)`, overflow: 'visible'}}
      >
        <defs>
          <filter id="stripShadow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <g opacity={0.4} filter="url(#stripShadow)">
          <rect x={218} y={HORIZON_Y - 36} width={330} height={120} rx={14} fill="#8A2E00" transform={`rotate(-9 383 ${HORIZON_Y + 24})`} />
          <rect x={560} y={HORIZON_Y - 22} width={330} height={120} rx={14} fill="#8A2E00" transform={`rotate(7 725 ${HORIZON_Y + 38})`} />
        </g>
        <BlisterStrip x={380} y={HORIZON_Y + 4} width={320} rotate={-9} idSuffix="end-a" />
        <BlisterStrip x={722} y={HORIZON_Y + 20} width={320} rotate={7} idSuffix="end-b" />
      </svg>

      {/* brand lockup and CTA */}
      <div style={{position: 'absolute', top: 1286, left: 0, width: 1080, textAlign: 'center', color: C.white}}>
        <FadeUp frame={frame} at={s3}>
          <div style={{fontSize: 176, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 0.92}}>{COPY.end.brand}</div>
          <div style={{fontSize: 60, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 8}}>{COPY.end.brandSub}</div>
        </FadeUp>
        <FadeUp frame={frame} at={s4} style={{marginTop: 52}}>
          <CtaButton />
        </FadeUp>
      </div>
    </AbsoluteFill>
  );
};
