import React from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
// Inter (variable, latin) is bundled in public/fonts so renders work offline.
export const fontFamily = "Inter, sans-serif";
if (typeof document !== "undefined") {
  const handle = delayRender("Loading Inter");
  const face = new FontFace("Inter", `url(${staticFile("fonts/Inter-latin.woff2")}) format("woff2")`, {
    weight: "400 800",
  });
  face
    .load()
    .then((f) => {
      (document.fonts as unknown as Set<FontFace>).add(f);
      continueRender(handle);
    })
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}

export const C = {
  bg: "#07060a",
  card: "rgba(255,255,255,0.045)",
  cardLine: "rgba(255,255,255,0.09)",
  text: "#f5f3f7",
  mut: "rgba(245,243,247,0.62)",
  dim: "rgba(245,243,247,0.38)",
  purple: "#a874f6",
  pink: "#e46fae",
  orange: "#f39a5b",
  green: "#25d366",
  ok: "#4ade80",
  bad: "#f87171",
  warn: "#fbbf24",
};

export const GRAD = `linear-gradient(90deg, ${C.purple}, ${C.pink} 60%, ${C.orange})`;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 eased progress starting at `delay` frames, lasting `dur` frames. */
export const useProgress = (delay: number, dur = 18) => {
  const f = useCurrentFrame();
  return interpolate(f, [delay, delay + dur], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
};

export const useSpring = (delay: number, damping = 16) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, mass: 0.7 } });
};

/** Fade + rise in. Optional `out` frame fades it away again. */
export const Appear: React.FC<{
  delay?: number;
  dur?: number;
  y?: number;
  x?: number;
  out?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, dur = 18, y = 24, x = 0, out, style, children }) => {
  const f = useCurrentFrame();
  const p = useProgress(delay, dur);
  const o = out === undefined ? 1 : interpolate(f, [out, out + 12], [1, 0], clamp);
  return (
    <div
      style={{
        opacity: p * o,
        transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Background: React.FC<{ glowX?: string; glowY?: string; hue?: string }> = ({
  glowX = "50%",
  glowY = "55%",
  hue = "120,60,200",
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 55% 60% at ${glowX} ${glowY}, rgba(${hue},0.22), rgba(${hue},0.06) 45%, transparent 75%), ${C.bg}`,
    }}
  />
);

export const Scene: React.FC<{
  children: React.ReactNode;
  dur: number;
  glowX?: string;
  glowY?: string;
  powered?: boolean;
}> = ({ children, dur, glowX, glowY, powered = true }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10, dur - 10, dur], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ fontFamily, color: C.text, opacity: o }}>
      <Background glowX={glowX} glowY={glowY} />
      {children}
      {powered && <PoweredBy />}
    </AbsoluteFill>
  );
};

export const FreestandLogo: React.FC<{ h?: number }> = ({ h = 26 }) => (
  <Img src={staticFile("freestand_white.png")} style={{ height: h, width: "auto" }} />
);

export const PoweredBy: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 150,
      bottom: 46,
      display: "flex",
      alignItems: "center",
      gap: 14,
      color: C.mut,
      fontSize: 17,
      fontWeight: 500,
    }}
  >
    Powered by <FreestandLogo h={24} />
  </div>
);

export const WhiskasIcon: React.FC<{ size?: number; radius?: number }> = ({ size = 40, radius }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius ?? size / 2,
      overflow: "hidden",
      background: "#fff",
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Img src={staticFile("whiskas_logo.png")} style={{ width: "92%", height: "92%", objectFit: "contain" }} />
  </div>
);

export const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.purple }) => (
  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", color, textTransform: "uppercase" }}>
    {children}
  </div>
);

export const Title: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  children,
  size = 76,
  style,
}) => (
  <div style={{ fontSize: size, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05, ...style }}>
    {children}
  </div>
);

export const GradText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ background: GRAD, WebkitBackgroundClip: "text", color: "transparent" }}>{children}</span>
);

export const Sub: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontSize: 28, lineHeight: 1.45, color: C.mut, fontWeight: 400, ...style }}>{children}</div>
);

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: C.card,
      border: `1px solid ${C.cardLine}`,
      borderRadius: 22,
      padding: "26px 30px",
      ...style,
    }}
  >
    {children}
  </div>
);

export const CardLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, color: C.mut, fontWeight: 600, marginBottom: 14 }}>
    <span style={{ color: C.purple }}>✦</span>
    {children}
  </div>
);

export const Check: React.FC<{ size?: number; color?: string; mark?: string }> = ({
  size = 30,
  color = "#22c55e",
  mark = "✓",
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: color,
      color: "#06120a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.6,
      fontWeight: 800,
      flex: "none",
    }}
  >
    {mark}
  </div>
);

/** Animated count-up number. */
export const CountUp: React.FC<{ to: number; delay?: number; dur?: number; suffix?: string; decimals?: number }> = ({
  to,
  delay = 0,
  dur = 30,
  suffix = "",
  decimals = 0,
}) => {
  const p = useProgress(delay, dur);
  const v = to * p;
  return (
    <>
      {v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
};
