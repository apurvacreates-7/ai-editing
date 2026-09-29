import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SANS, SERIF } from "../fonts";
import {
  Big,
  Bubble,
  C,
  cl,
  Family,
  Grain,
  Mascot,
  Pack,
  PromptBar,
  Punch,
  Skyline,
  StatusCard,
  Sticker,
  usePop,
} from "./parts";

// Beat sheet (30fps, 600 frames = 20s)
export const S = {
  hook: [0, 48],
  texts: [48, 108],
  rapid: [108, 186],
  wait: [186, 252],
  brief: [252, 300],
  board: [300, 405],
  payoff: [405, 480],
  cta: [480, 600],
} as const;
export const SHORT_DURATION = 600;

const Scene: React.FC<{ at: readonly [number, number]; children: React.ReactNode; dir?: 1 | -1 }> = ({ at, children, dir }) => (
  <Sequence from={at[0]} durationInFrames={at[1] - at[0]}>
    <Punch dir={dir}>{children}</Punch>
  </Sequence>
);

const Cursor: React.FC<{ path: [number, number, number][]; clickAt?: number[] }> = ({ path, clickAt = [] }) => {
  const frame = useCurrentFrame();
  const fs = path.map((p) => p[0]);
  const x = cl(frame, fs, path.map((p) => p[1]));
  const y = cl(frame, fs, path.map((p) => p[2]));
  const pressed = clickAt.some((c) => frame >= c && frame < c + 5);
  const ring = clickAt.map((c) => frame - c).find((d) => d >= 0 && d < 14);
  return (
    <div style={{ position: "absolute", left: x, top: y, zIndex: 20 }}>
      {ring !== undefined ? (
        <div
          style={{
            position: "absolute",
            left: -40 - ring * 3,
            top: -40 - ring * 3,
            width: 80 + ring * 6,
            height: 80 + ring * 6,
            borderRadius: 999,
            border: "5px solid rgba(255,255,255,0.9)",
            opacity: 1 - ring / 14,
          }}
        />
      ) : null}
      <svg width={64} height={78} viewBox="0 0 24 30" style={{ transform: `scale(${pressed ? 0.85 : 1})`, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))" }}>
        <path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 17 L20 17 Z" fill="#111" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/* 1 — Hook: AQI slams up over a choking skyline */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const aqi = Math.round(cl(frame, [4, 34], [96, 452]));
  const shake = frame > 30 && frame < 40 ? Math.sin(frame * 3) * 6 : 0;
  const pill = usePop(32, 8);
  return (
    <AbsoluteFill>
      <Skyline clear={0} zoom={1 + frame * 0.002} drift={frame * 0.6} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,15,12,0.55), rgba(20,15,12,0) 55%)" }} />
      <div style={{ position: "absolute", top: 250, width: "100%", transform: `translateX(${shake}px)` }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 38, letterSpacing: 10, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
          NEW DELHI · 7:40 AM
        </div>
        <Big size={330} style={{ marginTop: 20, letterSpacing: -12, textShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
          {aqi}
        </Big>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, alignItems: "center", marginTop: 10 }}>
          <div style={{ fontFamily: SANS, fontSize: 40, color: "#fff", opacity: 0.85 }}>Air Quality Index</div>
          <div
            style={{
              transform: `scale(${pill})`,
              background: C.red,
              color: "#fff",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 36,
              padding: "10px 26px",
              borderRadius: 99,
              letterSpacing: 3,
            }}
          >
            SEVERE
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* 2 — The messages every Delhi parent gets */
const Texts: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Skyline clear={0} zoom={1.25} drift={30 + frame * 0.6} />
      <AbsoluteFill style={{ background: "rgba(20,15,12,0.45)" }} />
      <div style={{ position: "absolute", left: 80, right: 80, top: 520, display: "flex", flexDirection: "column", gap: 44 }}>
        <Bubble delay={4} from="Ria's School" time="Today 7:42 AM">
          Due to severe air quality, school stays <b>closed</b> tomorrow.
        </Bubble>
        <Bubble delay={24} from="Ria 🧒">
          Mumma, my throat hurts again 😷
        </Bubble>
      </div>
    </AbsoluteFill>
  );
};

/* 3 — Rapid-fire: the winter checklist */
const RAPID: [string, string][] = [
  ["😷", "Scratchy throats?"],
  ["🥱", "Tired by noon?"],
  ["🤧", "Sneezing again?"],
  ["🗓️", "Every. Single. Winter."],
];
const Rapid: React.FC = () => {
  const frame = useCurrentFrame();
  const len = 17;
  const i = Math.min(RAPID.length - 1, Math.floor(frame / len));
  const local = frame - i * len;
  const slam = cl(local, [0, 5], [1.5, 1]);
  const [emoji, word] = RAPID[i];
  const bgs = ["#2E2721", "#3E342B", "#2A221C", C.brown];
  return (
    <AbsoluteFill style={{ background: bgs[i] }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        <Skyline clear={0} zoom={1.4 + i * 0.12} drift={i * 90} />
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${slam})`, filter: `blur(${cl(local, [0, 4], [10, 0])}px)` }}>
        <div style={{ fontSize: 190, fontFamily: "Noto Color Emoji" }}>{emoji}</div>
        <Big size={i === 3 ? 118 : 128} style={{ padding: "0 70px", marginTop: 30 }}>
          {word}
        </Big>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 4 — "Wait." Mascot pops in, the ask gets typed */
const Wait: React.FC = () => {
  const frame = useCurrentFrame();
  const waitOut = cl(frame, [12, 18], [1, 0]);
  const bubble = usePop(26, 12);
  return (
    <AbsoluteFill>
      <Skyline clear={0.12} zoom={1.1} drift={60 + frame * 0.4} />
      <AbsoluteFill style={{ background: "rgba(20,15,12,0.35)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: waitOut, background: "rgba(20,15,12,0.8)" }}>
        <Big serif size={200}>
          Wait.
        </Big>
      </AbsoluteFill>
      {frame >= 14 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center" }}>
            <Mascot size={300} delay={14} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 560,
              top: 360,
              transform: `scale(${bubble})`,
              transformOrigin: "left bottom",
              background: "#fff",
              borderRadius: 30,
              borderBottomLeftRadius: 6,
              padding: "18px 28px",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 38,
              color: C.ink,
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            }}
          >
            Hi! Let me help.
          </div>
          <div style={{ position: "absolute", left: 90, bottom: 360 }}>
            <PromptBar text="Give my family's immunity a daily boost." start={22} cps={1.7} sendAt={52} />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* 5 — Clean status card */
const Brief: React.FC = () => <StatusCard title="Immunity brief received." line="Meet Celine — Vitamin C by RV Life Sciences." start={2} />;

/* 6 — Sticker board build */
const Board: React.FC = () => {
  const frame = useCurrentFrame();
  const pack = usePop(4, 12);
  const head = usePop(0, 14);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 48%, #FFB255 0%, ${C.orange} 45%, ${C.orangeDeep} 100%)` }}>
      <AbsoluteFill
        style={{
          background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.10) 0deg 9deg, rgba(255,255,255,0) 9deg 18deg)",
          transform: `rotate(${frame * 0.3}deg) scale(2)`,
        }}
      />
      <div style={{ position: "absolute", top: 200, width: "100%", transform: `translateY(${(1 - head) * -60}px)`, opacity: head }}>
        <Big serif size={96} color="#fff" style={{ padding: "0 80px", textShadow: "0 8px 30px rgba(120,40,0,0.35)" }}>
          A daily ally for your family&apos;s immunity
        </Big>
      </div>
      <div style={{ position: "absolute", left: 330, top: 640, transform: `scale(${pack}) rotate(${Math.sin(frame / 20) * 2}deg)` }}>
        <Pack yaw={-24 + Math.sin(frame / 25) * 6} />
      </div>
      <Sticker delay={18} x={230} y={700} rot={-10} round bg={C.cream} color={C.orangeDeep}>
        <div>
          VITAMIN
          <div style={{ fontFamily: SERIF, fontSize: 110, lineHeight: 0.9 }}>C</div>
        </div>
      </Sticker>
      <Sticker delay={30} x={820} y={620} rot={8}>
        Supports
        <br />
        immunity
      </Sticker>
      <Sticker delay={42} x={250} y={1370} rot={-6} bg={C.brown} color="#fff">
        Antioxidant
      </Sticker>
      <Sticker delay={54} x={800} y={1400} rot={5}>
        Everyday
        <br />
        wellness
      </Sticker>
      <div style={{ position: "absolute", right: 70, bottom: 170 }}>
        <Mascot size={170} delay={60} />
      </div>
      <Cursor
        path={[
          [0, 1100, 1700],
          [26, 830, 650],
          [44, 280, 1390],
          [62, 820, 1420],
          [104, 900, 1700],
        ]}
        clickAt={[30, 42, 54]}
      />
    </AbsoluteFill>
  );
};

/* 7 — Emotional payoff */
const Payoff: React.FC = () => {
  const frame = useCurrentFrame();
  const clear = cl(frame, [0, 40], [0.45, 0.8]);
  const cap = usePop(10, 14);
  return (
    <AbsoluteFill>
      <Skyline clear={clear} zoom={1.05} drift={frame * 0.8} />
      <div style={{ position: "absolute", left: 250 + frame * 1.2, top: 1080 }}>
        <Family fill={"#3A1506"} step={frame / 4} />
      </div>
      <div style={{ position: "absolute", top: 230, width: "100%", opacity: cap, transform: `translateY(${(1 - cap) * 30}px)` }}>
        <Big serif size={104} color="#fff" style={{ textShadow: "0 8px 30px rgba(120,40,0,0.4)" }}>
          Small habit.
          <br />
          Stronger days.
        </Big>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 640, display: "flex", flexDirection: "column" }}>
        <Bubble delay={22} from="Ria 🧒">
          Had my Celine, Mumma! Off to school 🎒🍊
        </Bubble>
      </div>
    </AbsoluteFill>
  );
};

/* 8 — CTA with click-to-claim */
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const head = usePop(4, 13);
  const pack = usePop(0, 12);
  const clicked = frame >= 62;
  const btnPress = cl(frame, [60, 62, 68], [1, 0.9, 1]);
  const done = usePop(62, 10);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #FFFFFF 0%, ${C.cream} 40%, #FFD9A8 100%)` }}>
      <AbsoluteFill
        style={{
          background: "repeating-conic-gradient(from 0deg at 50% 36%, rgba(255,122,26,0.07) 0deg 8deg, rgba(255,122,26,0) 8deg 16deg)",
          transform: `rotate(${frame * 0.2}deg) scale(2)`,
        }}
      />
      <div style={{ position: "absolute", left: 330, top: 250, transform: `scale(${pack * 0.95})` }}>
        <Pack yaw={-18 + Math.sin(frame / 25) * 5} />
      </div>
      <div style={{ position: "absolute", left: 90, top: 330 }}>
        <Mascot size={170} delay={10} wave />
      </div>
      <div style={{ position: "absolute", top: 1020, width: "100%", opacity: head, transform: `translateY(${(1 - head) * 40}px)` }}>
        <Big size={112} color={C.brown}>
          Claim your
          <br />
          <span style={{ color: C.orange }}>FREE</span> sample
        </Big>
        <div style={{ fontFamily: SANS, fontSize: 40, fontWeight: 500, color: "#7a3a14", textAlign: "center", marginTop: 22 }}>
          Celine Vitamin C Tablets · RV Life Sciences
        </div>
      </div>
      <div style={{ position: "absolute", top: 1450, width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            transform: `scale(${btnPress})`,
            background: clicked ? C.brown : `linear-gradient(180deg, #FF9440, ${C.orangeDeep})`,
            color: "#fff",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 48,
            padding: "34px 80px",
            borderRadius: 999,
            boxShadow: "0 20px 44px rgba(180,70,10,0.35)",
            minWidth: 640,
            textAlign: "center",
          }}
        >
          {clicked ? (
            <span style={{ display: "inline-block", transform: `scale(${done})` }}>✓ Your sample is reserved</span>
          ) : (
            "Experience the immunity boost →"
          )}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 110,
          right: 110,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 24,
          lineHeight: 1.4,
          color: "rgba(90,40,10,0.7)",
        }}
      >
        Nutritional supplement. Supports normal immune function; not a treatment for pollution-related illness. Consult your doctor. Free sample subject to availability.
      </div>
      <Cursor
        path={[
          [0, 1000, 1850],
          [40, 700, 1530],
          [80, 700, 1530],
          [120, 1000, 1850],
        ]}
        clickAt={[60]}
      />
    </AbsoluteFill>
  );
};

/** Two-frame white flash on the key cuts */
const Flash: React.FC<{ at: number[] }> = ({ at }) => {
  const frame = useCurrentFrame();
  const o = Math.max(0, ...at.map((a) => cl(frame, [a - 1, a, a + 4], [0, 0.7, 0])));
  return <AbsoluteFill style={{ background: "#fff", opacity: o, pointerEvents: "none" }} />;
};

export const Short: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Scene at={S.hook}>
      <Hook />
    </Scene>
    <Scene at={S.texts}>
      <Texts />
    </Scene>
    <Scene at={S.rapid} dir={-1}>
      <Rapid />
    </Scene>
    <Scene at={S.wait}>
      <Wait />
    </Scene>
    <Scene at={S.brief}>
      <Brief />
    </Scene>
    <Scene at={S.board} dir={-1}>
      <Board />
    </Scene>
    <Scene at={S.payoff}>
      <Payoff />
    </Scene>
    <Scene at={S.cta}>
      <Cta />
    </Scene>
    <Flash at={[S.brief[0], S.board[0], S.cta[0]]} />
    <Grain opacity={0.1} />
    <Audio src={staticFile("short-music.wav")} />
  </AbsoluteFill>
);
