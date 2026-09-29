import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {SPS, hash} from '../stop';

export type SfxName =
  | 'tap'
  | 'drop'
  | 'slide'
  | 'stamp'
  | 'pop'
  | 'tick'
  | 'ding'
  | 'switch'
  | 'whoosh'
  | 'thud'
  | 'paper'
  | 'click';

// Each foley sound ships in a few takes so repeated placements never sound
// machine-identical. Placed at the stop-frame it belongs to, so picture and
// sound can never drift apart.
const TAKES: Partial<Record<SfxName, number>> = {tap: 4, drop: 3, slide: 3, pop: 3, tick: 3, paper: 3};

export const Sfx: React.FC<{at: number; name: SfxName; vol?: number; take?: number}> = ({at, name, vol = 1, take}) => {
  const n = TAKES[name] ?? 1;
  const t = take ?? Math.floor(hash(at * 3.3 + name.length) * n);
  const file = n > 1 ? `sfx/${name}-${t % n}.wav` : `sfx/${name}.wav`;
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round((at * fps) / SPS))} durationInFrames={fps * 4} layout="none" name={`sfx ${name}`}>
      <Audio src={staticFile(file)} volume={vol} />
    </Sequence>
  );
};
