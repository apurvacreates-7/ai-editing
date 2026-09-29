import {BAR} from './stop';

// Scene lengths in stop-frames (12 per second). Every cut lands on a bar line of
// the 120 BPM score, so the soundtrack generator uses the same table.
export const SCENES = [
  {id: 'cold-open', bars: 4},
  {id: 'reveal', bars: 3},
  {id: 'loop', bars: 3},
  {id: 'launch', bars: 4},
  {id: 'operate', bars: 4},
  {id: 'consumers', bars: 4},
  {id: 'identity', bars: 3},
  {id: 'data', bars: 4},
  {id: 'measure', bars: 4},
  {id: 'next', bars: 2},
  {id: 'finale', bars: 4},
] as const;

export type SceneId = (typeof SCENES)[number]['id'];

export const sceneStart = (id: SceneId) => {
  let s = 0;
  for (const sc of SCENES) {
    if (sc.id === id) return s;
    s += sc.bars * BAR;
  }
  throw new Error(`unknown scene ${id}`);
};

export const sceneLen = (id: SceneId) => SCENES.find((s) => s.id === id)!.bars * BAR;

export const TOTAL_SF = SCENES.reduce((a, s) => a + s.bars * BAR, 0);
