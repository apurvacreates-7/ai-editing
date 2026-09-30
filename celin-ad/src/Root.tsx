import React from 'react';
import {Composition} from 'remotion';
import {CelinAd} from './CelinAd';
import {VIDEO} from './config';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="CelinAd"
    component={CelinAd}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
