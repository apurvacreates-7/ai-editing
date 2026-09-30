import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {HORIZON_Y, TIMING} from '../../config';
import {blend} from '../../lib/color';
import {EASE, tween} from '../../lib/motion';
import {Calendar} from './Calendar';
import {KineticType} from './KineticType';
import {Room} from './Room';
import {WindowView, weatherWeights} from './WindowView';

// ambient tint of the room per weather state (multiplied over the wall)
const AMBIENT = ['#FFFCF6', '#E7EEE6', '#FFFFFF', '#E5E4E1', '#D8CEBF'];

/** Scene 1, frames 0 to 150: "The calendar knows". */
export const SceneCalendar: React.FC = () => {
  const frame = useCurrentFrame();
  const sat = tween(frame, TIMING.scene1.start, TIMING.scene1.end, [TIMING.saturation.from, TIMING.saturation.to], EASE.inOut);
  // slow push-in, anchored on the horizon so the 62% line never moves
  const zoom = tween(frame, 0, TIMING.scene1.end + TIMING.crossfade, [1, 1.035], EASE.inOutSoft);
  const w = weatherWeights(frame);
  const ambient = blend(AMBIENT.map((c, i) => [c, w[i]] as const));

  return (
    <AbsoluteFill style={{filter: `saturate(${sat.toFixed(3)})`}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `540px ${HORIZON_Y}px`}}>
        <Room />
        <Calendar frame={frame} />
        {/* the room takes on the light of the season; the window itself stays bright */}
        <AbsoluteFill style={{backgroundColor: ambient, mixBlendMode: 'multiply'}} />
        <WindowView frame={frame} />
      </AbsoluteFill>
      <KineticType frame={frame} />
    </AbsoluteFill>
  );
};
