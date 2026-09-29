import { Composition } from "remotion";
import { Ad } from "./Ad";
import { Short, SHORT_DURATION } from "./short/Short";
import { DURATION, FPS, HEIGHT, WIDTH } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CelineShort" component={Short} durationInFrames={SHORT_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="CelineDelhiAd" component={Ad} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
