import React from 'react';
import {useVideoConfig} from 'remotion';
import {COPY, TIMING} from '../../config';
import {rgba} from '../../lib/color';
import {springAt, tween, EASE} from '../../lib/motion';
import {C} from '../../theme';
import {CalendarPage, PageBack, PageSpec, PAGE_H, PAGE_W} from './CalendarPage';

export const CAL = {
  x: 510 - PAGE_W / 2,
  top: 330,
  bindingH: 46,
  nail: {x: 510, y: 214},
};

const PAGES: PageSpec[] = [
  {kind: 'gate', label: COPY.calendar.coverTitle, month: null},
  {kind: 'rain', label: COPY.calendar.pages[0], month: 6},
  {kind: 'sun', label: COPY.calendar.pages[1], month: 9},
  {kind: 'cloud', label: COPY.calendar.pages[2], month: 10},
  {kind: 'haze', label: COPY.calendar.pages[3], month: 11},
];

/** Spring-eased 0..1 progress of flip i (overshoot allowed). */
export const flipProgress = (frame: number, i: number, fps: number) =>
  springAt(frame, TIMING.flips[i], fps, {damping: 15, stiffness: 42, mass: 1.15}, TIMING.flipFrames);

const Binding: React.FC = () => {
  const rings = 11;
  return (
    <div style={{position: 'absolute', left: 0, top: -CAL.bindingH, width: PAGE_W, height: CAL.bindingH}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${C.slateMid} 0%, ${C.slate} 100%)`,
          borderRadius: '6px 6px 0 0',
        }}
      />
      {Array.from({length: rings}).map((_, i) => {
        const x = 34 + (i * (PAGE_W - 68)) / (rings - 1);
        return (
          <div key={i}>
            <div
              style={{
                position: 'absolute',
                left: x - 5,
                top: CAL.bindingH - 16,
                width: 10,
                height: 34,
                borderRadius: 5,
                background: `linear-gradient(90deg, ${C.hazeDeep}, ${C.hazeLight} 55%, ${C.hazeDeep})`,
                zIndex: 30,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/**
 * Wall calendar with a spring-eased 3D card flip. Each sheet hinges on the
 * binding (rotateX around its top edge), swings over, and drops out of view.
 */
export const Calendar: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const year = COPY.calendar.year;

  // Which flip is active?
  let top = 0; // index of the sheet currently resting on top
  let flipping: {index: number; p: number} | null = null;
  TIMING.flips.forEach((start, i) => {
    if (frame >= start) {
      const p = flipProgress(frame, i, fps);
      if (frame - start < TIMING.flipFrames + 4) {
        flipping = {index: i, p};
      }
      top = i + 1;
    }
  });

  const current = flipping as {index: number; p: number} | null;
  const angle = current ? current.p * 180 : 0;
  const lift = Math.sin((Math.min(angle, 90) * Math.PI) / 180);
  const fadeOut = current ? tween(angle, 105, 168, [1, 0], EASE.inOut) : 1;

  const hangSwing = current ? Math.sin(current.p * Math.PI) * 0.6 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: CAL.x,
        top: CAL.top,
        width: PAGE_W,
        height: PAGE_H,
        transform: `rotate(${hangSwing}deg)`,
        transformOrigin: `${CAL.nail.x - CAL.x}px ${CAL.nail.y - CAL.top}px`,
      }}
    >
      {/* hanging string to the nail */}
      <svg
        style={{position: 'absolute', left: 0, top: CAL.nail.y - CAL.top - 6, overflow: 'visible'}}
        width={PAGE_W}
        height={CAL.top - CAL.nail.y}
      >
        <path
          d={`M${PAGE_W * 0.3},${CAL.top - CAL.nail.y - CAL.bindingH + 10} L${CAL.nail.x - CAL.x},6 L${PAGE_W * 0.7},${
            CAL.top - CAL.nail.y - CAL.bindingH + 10
          }`}
          fill="none"
          stroke={C.slateMid}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <circle cx={CAL.nail.x - CAL.x} cy={6} r={7} fill={C.slate} />
        <circle cx={CAL.nail.x - CAL.x - 2} cy={4} r={2.2} fill={C.hazeLight} />
      </svg>

      {/* shadow of the whole calendar on the wall (light from the window, right) */}
      <div
        style={{
          position: 'absolute',
          left: -16,
          top: -CAL.bindingH + 18,
          width: PAGE_W,
          height: PAGE_H + CAL.bindingH - 6,
          background: rgba(C.slate, 0.2),
          filter: 'blur(26px)',
          transform: 'translate(-10px, 22px)',
        }}
      />

      {/* page stack edge */}
      {[3, 6].map((d) => (
        <div
          key={d}
          style={{
            position: 'absolute',
            left: d / 2,
            top: d,
            width: PAGE_W - d,
            height: PAGE_H,
            background: C.paperBack,
            borderBottom: `1px solid ${rgba(C.slate, 0.12)}`,
          }}
        />
      ))}

      {/* resting sheet */}
      <div style={{position: 'absolute', inset: 0}}>
        <CalendarPage spec={PAGES[Math.min(top, PAGES.length - 1)]} year={year} t={frame} />
        {/* shadow cast by the lifting sheet */}
        {current ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, ${rgba(C.slate, 0.24 * lift * fadeOut)} 0%, ${rgba(
                C.slate,
                0.06 * lift * fadeOut,
              )} 22%, ${rgba(C.slate, 0)} 42%)`,
            }}
          />
        ) : null}
      </div>

      {/* flipping sheet */}
      {current ? (
        <div style={{position: 'absolute', inset: 0, perspective: 2400, perspectiveOrigin: '50% -10%'}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: '50% 0%',
              transformStyle: 'preserve-3d',
              transform: `rotateX(${angle}deg)`,
            }}
          >
            <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', opacity: fadeOut}}>
              <CalendarPage spec={PAGES[current.index]} year={year} t={frame} />
              <div style={{position: 'absolute', inset: 0, background: rgba(C.slate, 0.28 * lift)}} />
            </div>
            <div
              style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateX(180deg)', opacity: fadeOut}}
            >
              <PageBack />
              <div style={{position: 'absolute', inset: 0, background: rgba(C.slate, 0.18 * (1 - lift))}} />
            </div>
          </div>
        </div>
      ) : null}

      <Binding />
    </div>
  );
};
