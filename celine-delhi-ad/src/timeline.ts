import { Easing, interpolate } from "remotion";

export const FPS = 30;
export const DURATION = 540; // 18s
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Story beats (frames)
export const T = {
  swoopStart: 105,
  swoopEnd: 165,
  walkStart: 20,
  tabletAppear: 250,
  burst: 300,
  clearEnd: 385,
  endCard: 400,
};

const ease = Easing.bezier(0.45, 0, 0.2, 1);

export const clamp = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

/** 0 = full smog, 1 = clear sky */
export const clearness = (frame: number) => clamp(frame, [T.burst, T.clearEnd], [0, 1]);
