import React from 'react';
import {Composition} from 'remotion';
import {BAR, FPS, ON, SPS} from './stop';
import {H, W, ensureFonts} from './theme';
import {Film, SCENE_COMPONENTS} from './Film';
import {SCENES, TOTAL_SF} from './timeline';

ensureFonts();

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="FreestandFilm" component={Film} durationInFrames={TOTAL_SF * ON} fps={FPS} width={W} height={H} />
      {/* one frame per pose; scripts/render-fast.sh doubles it back up to the 24 fps master */}
      <Composition id="FreestandFilm12" component={Film} durationInFrames={TOTAL_SF} fps={SPS} width={W} height={H} />
      {SCENES.map((sc, i) => {
        const Scene = SCENE_COMPONENTS[sc.id];
        if (!Scene) return null;
        return (
          <Composition
            key={sc.id}
            id={`Scene${String(i + 1).padStart(2, '0')}-${sc.id}`}
            component={Scene}
            durationInFrames={sc.bars * BAR * ON}
            fps={FPS}
            width={W}
            height={H}
          />
        );
      })}
    </>
  );
};
