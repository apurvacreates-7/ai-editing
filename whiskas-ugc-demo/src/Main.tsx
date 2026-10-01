import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { Discovery, DISCOVERY, Hook, HOOK, TWO_WAYS, TwoWays } from "./scenes/Intro";
import { Journey, JOURNEY } from "./scenes/Journey";
import { Web, WEB } from "./scenes/Web";
import { DASH_A, DASH_B, DashboardQualified, DashboardRejected } from "./scenes/Dashboard";
import { END, End, ENGINE, Engine, Results, RESULTS } from "./scenes/Outro";
import { C } from "./ui";

const SCENES: [React.FC, number][] = [
  [Hook, HOOK],
  [Discovery, DISCOVERY],
  [TwoWays, TWO_WAYS],
  [Journey, JOURNEY],
  [Web, WEB],
  [DashboardQualified, DASH_A],
  [DashboardRejected, DASH_B],
  [Results, RESULTS],
  [Engine, ENGINE],
  [End, END],
];

export const TOTAL = SCENES.reduce((a, [, d]) => a + d, 0);

export const Main: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio
        src={staticFile("music.mp3")}
        loop
        volume={(f) => interpolate(f, [0, 15, TOTAL - 60, TOTAL], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {SCENES.map(([Comp, dur], i) => {
        const s = (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Comp />
          </Sequence>
        );
        from += dur;
        return s;
      })}
    </AbsoluteFill>
  );
};
