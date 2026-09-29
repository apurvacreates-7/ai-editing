import React from 'react';
import {AbsoluteFill, Audio, Sequence, getStaticFiles, staticFile} from 'remotion';
import {SCENES, SceneId} from './timeline';
import {BAR, useOn} from './stop';
import {S01ColdOpen} from './scenes/S01ColdOpen';
import {S02Reveal} from './scenes/S02Reveal';
import {S03Loop} from './scenes/S03Loop';
import {S04Launch} from './scenes/S04Launch';
import {S05Operate} from './scenes/S05Operate';
import {S06Consumers} from './scenes/S06Consumers';
import {S07Identity} from './scenes/S07Identity';
import {S08Data} from './scenes/S08Data';
import {S09Measure} from './scenes/S09Measure';
import {S10Next} from './scenes/S10Next';
import {S11Finale} from './scenes/S11Finale';

export const SCENE_COMPONENTS: Partial<Record<SceneId, React.FC>> = {
  'cold-open': S01ColdOpen,
  reveal: S02Reveal,
  loop: S03Loop,
  launch: S04Launch,
  operate: S05Operate,
  consumers: S06Consumers,
  identity: S07Identity,
  data: S08Data,
  measure: S09Measure,
  next: S10Next,
  finale: S11Finale,
};

const hasScore = () => getStaticFiles().some((f) => f.name === 'audio/score.wav');

export const Film: React.FC = () => {
  const on = useOn();
  let at = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {SCENES.map((sc) => {
        const from = at;
        at += sc.bars * BAR;
        const Scene = SCENE_COMPONENTS[sc.id];
        if (!Scene) return null;
        return (
          <Sequence key={sc.id} name={sc.id} from={from * on} durationInFrames={sc.bars * BAR * on}>
            <Scene />
          </Sequence>
        );
      })}
      {hasScore() ? <Audio src={staticFile('audio/score.wav')} /> : null}
    </AbsoluteFill>
  );
};
