import React from 'react';
import {useVideoConfig} from 'remotion';
import {COPY, TIMING} from '../../config';
import {FONT} from '../../fonts';
import {EASE, springAt, tween} from '../../lib/motion';
import {C} from '../../theme';

const WORD_SIZE = 150;
const SLAM_SIZE = 196;
const WORD_TOP = 1318;
const SLAM_TOP = 1262;

/** One word revealed letter by letter from behind a mask, then pushed up and out. */
const MaskedWord: React.FC<{text: string; frame: number; enter: number; exit: number | null; fastExit?: boolean}> = ({
  text,
  frame,
  enter,
  exit,
  fastExit = false,
}) => {
  const {fps} = useVideoConfig();
  const letters = Array.from(text);
  return (
    <div
      style={{
        position: 'absolute',
        top: WORD_TOP,
        left: 0,
        width: 1080,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        height: WORD_SIZE * 1.1,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: WORD_SIZE,
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        color: C.slate,
      }}
    >
      {letters.map((ch, i) => {
        const inP = springAt(frame, enter + i * 1.7, fps, {damping: 17, stiffness: 120, mass: 0.8});
        const stag = fastExit ? 0.6 : 1.1;
        const len = fastExit ? 7 : 9;
        const outP = exit === null ? 0 : tween(frame, exit + i * stag, exit + i * stag + len, [0, 1], EASE.in);
        const y = (1 - inP) * 105 - outP * 105;
        return (
          <span key={i} style={{display: 'inline-block', transform: `translateY(${y}%)`, whiteSpace: 'pre'}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** The final flip: bigger type that slams in with a stiff spring. */
const Slam: React.FC<{frame: number; start: number}> = ({frame, start}) => {
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', top: SLAM_TOP, left: 0, width: 1080, fontFamily: FONT}}>
      {COPY.kineticFinal.map((line, i) => {
        const s = start + i * 4;
        const p = springAt(frame, s, fps, {damping: 11, stiffness: 210, mass: 0.7});
        const scale = 1 + (1 - p) * 0.55;
        const o = tween(frame, s, s + 4, [0, 1], EASE.out);
        const blur = tween(frame, s, s + 6, [10, 0], EASE.out);
        return (
          <div
            key={i}
            style={{
              textAlign: 'center',
              fontSize: SLAM_SIZE,
              fontWeight: 800,
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              color: C.slate,
              opacity: o,
              transform: `scale(${scale})`,
              filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

export const KineticType: React.FC<{frame: number}> = ({frame}) => {
  const f = TIMING.flips;
  // the last month word clears quickly so it never overlaps the slam
  const words = COPY.kinetic.map((text, i) => ({text, enter: f[i] + 8, exit: i === COPY.kinetic.length - 1 ? f[i + 1] + 1 : f[i + 1] + 3}));
  return (
    <>
      {words.map((w) =>
        frame >= w.enter - 1 && frame < w.exit + 20 ? (
          <MaskedWord key={w.text} text={w.text} frame={frame} enter={w.enter} exit={w.exit} fastExit={w.text === COPY.kinetic[COPY.kinetic.length - 1]} />
        ) : null,
      )}
      {frame >= f[3] + 12 ? <Slam frame={frame} start={f[3] + 13} /> : null}
    </>
  );
};
