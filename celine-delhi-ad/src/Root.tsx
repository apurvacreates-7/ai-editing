import { Composition } from "remotion";
import { Ad } from "./Ad";
import { DURATION, FPS, HEIGHT, WIDTH } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <Composition id="CelineDelhiAd" component={Ad} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
