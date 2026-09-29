import React from "react";
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS, SERIF } from "../fonts";

export const C = {
  orange: "#FF7A1A",
  orangeDeep: "#E0580B",
  cream: "#FFF6EA",
  ink: "#1C1410",
  brown: "#4A1D05",
  smog1: "#3A332C",
  smog2: "#6B5E50",
  smog3: "#A69580",
  red: "#E5383B",
};

export const lerpColor = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => {
    const x = (pa >> s) & 255;
    const y = (pb >> s) & 255;
    return Math.round(x + (y - x) * Math.min(1, Math.max(0, t)));
  };
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

export const cl = (f: number, i: number[], o: number[]) =>
  interpolate(f, i, o, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Snappy overshoot pop used for stickers, bubbles, mascot */
export const usePop = (delay = 0, damping = 11) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness: 220, mass: 0.6 } });
};

/** Scene entrance: punch-in zoom + motion blur, like a whip cut */
export const Punch: React.FC<{ children: React.ReactNode; dir?: 1 | -1 }> = ({ children, dir = 1 }) => {
  const frame = useCurrentFrame();
  const s = cl(frame, [0, 8], [1.14, 1]);
  const b = cl(frame, [0, 7], [18, 0]);
  const y = cl(frame, [0, 8], [dir * 90, 0]);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${y}px) scale(${s})`, filter: `blur(${b}px)` }}>
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Delhi skyline — flat layered silhouettes                            */
/* ------------------------------------------------------------------ */
const IndiaGate: React.FC<{ x: number; base: number; s: number; fill: string }> = ({ x, base, s, fill }) => (
  <g transform={`translate(${x} ${base}) scale(${s})`} fill={fill}>
    <rect x={-120} y={-30} width={240} height={30} />
    <path d="M-100 -30 V-250 H100 V-30 H40 V-150 A40 40 0 0 0 -40 -150 V-30 Z" />
    <rect x={-112} y={-278} width={224} height={28} />
    <rect x={-80} y={-330} width={160} height={52} />
    <rect x={-52} y={-352} width={104} height={22} />
    <path d="M-34 -352 Q0 -392 34 -352 Z" />
  </g>
);

const Qutub: React.FC<{ x: number; base: number; s: number; fill: string }> = ({ x, base, s, fill }) => (
  <g transform={`translate(${x} ${base}) scale(${s})`} fill={fill}>
    <path d="M-48 0 L-22 -560 L22 -560 L48 0 Z" />
    {[-130, -260, -380, -480].map((y, i) => (
      <rect key={y} x={-44 + i * 6 + (y / -560) * 20} y={y - 10} width={88 - i * 12 - (y / -560) * 40} height={16} rx={4} />
    ))}
    <rect x={-10} y={-600} width={20} height={42} />
  </g>
);

const Lotus: React.FC<{ x: number; base: number; s: number; fill: string }> = ({ x, base, s, fill }) => (
  <g transform={`translate(${x} ${base}) scale(${s})`} fill={fill}>
    <rect x={-170} y={-24} width={340} height={24} />
    {[-130, -80, -32, 32, 80, 130].map((dx, i) => (
      <path key={dx} d={`M${dx} -24 Q${dx - Math.sign(dx || 1) * 10} ${-150 - (i % 3) * 10} ${dx * 0.45} -${190 - Math.abs(dx) * 0.3} Q${dx * 0.9 + 12} -110 ${dx} -24 Z`} />
    ))}
    <path d="M-30 -24 Q-30 -170 0 -220 Q30 -170 30 -24 Z" />
  </g>
);

const Towers: React.FC<{ seed: string; y: number; minH: number; maxH: number; fill: string; windows?: string }> = ({
  seed,
  y,
  minH,
  maxH,
  fill,
  windows,
}) => {
  const out: React.ReactNode[] = [];
  let x = -60;
  let i = 0;
  while (x < 1180) {
    const w = 70 + random(`${seed}w${i}`) * 90;
    const h = minH + random(`${seed}h${i}`) * (maxH - minH);
    out.push(<rect key={i} x={x} y={y - h} width={w} height={h} fill={fill} />);
    if (windows) {
      for (let wy = y - h + 24; wy < y - 20; wy += 34) {
        for (let wx = x + 14; wx < x + w - 18; wx += 26) {
          if (random(`${seed}${i}${wx}${wy}`) > 0.62) out.push(<rect key={`${i}-${wx}-${wy}`} x={wx} y={wy} width={10} height={14} fill={windows} />);
        }
      }
    }
    x += w + 6 + random(`${seed}g${i}`) * 30;
    i++;
  }
  return <>{out}</>;
};

/** clear: 0 = heavy smog, 1 = warm sunrise */
export const Skyline: React.FC<{ clear: number; zoom?: number; drift?: number }> = ({ clear, zoom = 1, drift = 0 }) => {
  const sky1 = lerpColor("#5A5046", "#FFB45E", clear);
  const sky2 = lerpColor("#8C7C69", "#FFE3B8", clear);
  const far = lerpColor("#77695A", "#E9A36A", clear);
  const mid = lerpColor("#56493D", "#B8643A", clear);
  const near = lerpColor("#2E2721", "#5A2410", clear);
  const sun = lerpColor("#B9A58A", "#FFF4D6", clear);
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky1} />
          <stop offset="0.75" stopColor={sky2} />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor={sun} stopOpacity={0.9} />
          <stop offset="1" stopColor={sun} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9C8B76" stopOpacity={0} />
          <stop offset="0.6" stopColor="#9C8B76" stopOpacity={0.75 * (1 - clear)} />
          <stop offset="1" stopColor="#6E6152" stopOpacity={0.9 * (1 - clear)} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#sky)" />
      <g transform={`translate(540 1250) scale(${zoom}) translate(-540 -1250)`}>
        <circle cx={700 - drift * 0.2} cy={760 - clear * 120} r={380} fill="url(#sunGlow)" />
        <circle cx={700 - drift * 0.2} cy={760 - clear * 120} r={110} fill={sun} opacity={0.35 + clear * 0.65} />
        <g transform={`translate(${-drift * 0.3} 0)`}>
          <Towers seed="far" y={1330} minH={120} maxH={330} fill={far} />
          <Lotus x={860} base={1330} s={0.9} fill={far} />
        </g>
        <g transform={`translate(${-drift * 0.6} 0)`}>
          <Qutub x={180} base={1420} s={1.05} fill={mid} />
          <Towers seed="mid" y={1440} minH={80} maxH={230} fill={mid} windows={lerpColor("#8A6C45", "#FFD08A", clear)} />
        </g>
        <g transform={`translate(${-drift} 0)`}>
          <rect x={-200} y={1540} width={1600} height={500} fill={near} />
          <IndiaGate x={560} base={1560} s={1.25} fill={near} />
          {[-40, 150, 960, 1130].map((x) => (
            <path key={x} d={`M${x} 1560 q60 -140 120 0 z`} fill={near} />
          ))}
        </g>
        <rect width={1080} height={1920} y={0} fill="url(#haze)" />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Pixel mascot: "Chintu" the vitamin C tablet (original character)    */
/* ------------------------------------------------------------------ */
const PIX = [
  "....XXXXXX....",
  "..XXOOOOOOXX..",
  ".XOOHHOOOOOOX.",
  ".XOHHOOOOOOOX.",
  "XOOOOOOOOOOOOX",
  "XOOEEOOOOEEOOX",
  "XOOEEOOOOEEOOX",
  "XOPOOOOOOOOPOX",
  "XOOOMOOOOMOOOX",
  ".XOOOMMMMOOOX.",
  ".XOOOOOOOOOOX.",
  "..XXOOOOOOXX..",
  "....XXXXXX....",
];
const PIX_COL: Record<string, string> = {
  X: "#A8400A",
  O: "#FF8A1F",
  H: "#FFD08A",
  E: "#2A1003",
  M: "#2A1003",
  P: "#FF5E6C",
};

export const Mascot: React.FC<{ size?: number; delay?: number; wave?: boolean }> = ({ size = 220, delay = 0, wave }) => {
  const frame = useCurrentFrame();
  const pop = usePop(delay, 9);
  const bob = Math.sin((frame - delay) / 6) * 8;
  const blink = (frame - delay) % 70 > 64;
  const tilt = wave ? Math.sin(frame / 4) * 8 : Math.sin(frame / 14) * 3;
  const px = size / 14;
  return (
    <div style={{ transform: `translateY(${bob}px) scale(${pop}) rotate(${tilt}deg)`, width: size, height: (size * 13) / 14 }}>
      <svg width={size} height={(size * 13) / 14} shapeRendering="crispEdges" style={{ filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.25))" }}>
        {PIX.flatMap((row, y) =>
          row.split("").map((ch, x) => {
            if (ch === ".") return null;
            const col = ch === "E" && blink ? PIX_COL.O : PIX_COL[ch];
            return <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px + 0.5} height={px + 0.5} fill={col} />;
          }),
        )}
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* UI bits                                                             */
/* ------------------------------------------------------------------ */
export const Bubble: React.FC<{ delay: number; from: string; time?: string; children: React.ReactNode; align?: "left" | "right" }> = ({
  delay,
  from,
  time,
  children,
  align = "left",
}) => {
  const p = usePop(delay, 13);
  const frame = useCurrentFrame();
  if (frame < delay) return null;
  return (
    <div
      style={{
        alignSelf: align === "left" ? "flex-start" : "flex-end",
        transform: `scale(${p})`,
        transformOrigin: align === "left" ? "left bottom" : "right bottom",
        maxWidth: 800,
      }}
    >
      {time ? <div style={{ fontFamily: SANS, fontSize: 26, color: "rgba(255,255,255,0.75)", marginBottom: 10, textAlign: "center" }}>{time}</div> : null}
      <div
        style={{
          background: align === "left" ? "rgba(255,255,255,0.96)" : C.orange,
          color: align === "left" ? C.ink : "#fff",
          borderRadius: 36,
          borderBottomLeftRadius: align === "left" ? 10 : 36,
          borderBottomRightRadius: align === "left" ? 36 : 10,
          padding: "26px 34px",
          fontFamily: SANS,
          fontSize: 40,
          fontWeight: 500,
          lineHeight: 1.3,
          boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
        }}
      >
        {children}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 24, color: "rgba(255,255,255,0.8)", marginTop: 8, textAlign: align }}>{from}</div>
    </div>
  );
};

export const PromptBar: React.FC<{ text: string; start: number; cps?: number; sendAt?: number }> = ({ text, start, cps = 1.2, sendAt }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor((frame - start) * cps));
  const shown = text.slice(0, n);
  const caret = frame % 16 < 9;
  const sent = sendAt !== undefined && frame >= sendAt;
  const press = sendAt !== undefined ? cl(frame, [sendAt - 2, sendAt, sendAt + 5], [1, 0.82, 1]) : 1;
  const inP = usePop(start - 6, 14);
  return (
    <div
      style={{
        width: 900,
        transform: `translateY(${(1 - inP) * 80}px)`,
        opacity: inP,
        background: "rgba(24,18,14,0.78)",
        backdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.14)",
        borderRadius: 40,
        padding: "30px 34px 24px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 38, color: "#fff", minHeight: 96, lineHeight: 1.3 }}>
        {shown}
        {!sent && caret ? <span style={{ color: C.orange }}>|</span> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <div style={{ fontFamily: SANS, fontSize: 40, color: "rgba(255,255,255,0.6)" }}>+</div>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 99,
            background: sent ? "#fff" : C.orange,
            color: sent ? C.orange : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 34,
            transform: `scale(${press})`,
          }}
        >
          ↑
        </div>
      </div>
    </div>
  );
};

export const Spark: React.FC<{ size?: number; color?: string; spin?: number }> = ({ size = 70, color = C.orange, spin = 0 }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ transform: `rotate(${spin}deg)` }}>
    {Array.from({ length: 10 }).map((_, i) => (
      <rect key={i} x={-5} y={-48} width={10} height={40} rx={5} fill={color} transform={`rotate(${i * 36})`} />
    ))}
    <circle r={12} fill={color} />
  </svg>
);

/** Clean white status card — two lines, second line reveals word by word */
export const StatusCard: React.FC<{ title: string; line: string; start?: number }> = ({ title, line, start = 0 }) => {
  const frame = useCurrentFrame();
  const words = line.split(" ");
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FBFAF7", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 34, alignItems: "flex-start", padding: "0 90px" }}>
        <div style={{ marginTop: 6 }}>
          <Spark size={78} spin={frame * 3} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 56, lineHeight: 1.25, color: C.ink }}>
          <div style={{ fontWeight: 600, opacity: cl(frame, [start, start + 6], [0, 1]) }}>{title}</div>
          <div style={{ fontWeight: 400 }}>
            {words.map((w, i) => {
              const t = start + 10 + i * 3;
              return (
                <span key={i} style={{ color: frame > t + 4 ? "#3a3a3a" : "#bdbdbd", opacity: cl(frame, [t, t + 3], [0, 1]) }}>
                  {w}{" "}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Sticker: React.FC<{ delay: number; x: number; y: number; rot?: number; children: React.ReactNode; bg?: string; color?: string; round?: boolean }> = ({
  delay,
  x,
  y,
  rot = 0,
  children,
  bg = "#fff",
  color = C.brown,
  round,
}) => {
  const p = usePop(delay, 8);
  const frame = useCurrentFrame();
  if (frame < delay) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot + Math.sin(frame / 18 + x) * 2}deg) scale(${p})`,
        background: bg,
        color,
        border: "8px solid #fff",
        borderRadius: round ? 999 : 30,
        padding: round ? 0 : "20px 34px",
        width: round ? 230 : undefined,
        height: round ? 230 : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 40,
        lineHeight: 1.05,
        boxShadow: "0 16px 30px rgba(74,29,5,0.28)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

/** Flat pack illustration built with CSS 3D (two faces) */
export const Pack: React.FC<{ scale?: number; yaw?: number }> = ({ scale = 1, yaw = -22 }) => (
  <div style={{ width: 420, height: 600, perspective: 1600, transform: `scale(${scale})` }}>
    <div style={{ position: "relative", width: 420, height: 600, transformStyle: "preserve-3d", transform: `rotateY(${yaw}deg) rotateX(4deg)` }}>
      {/* side */}
      <div
        style={{
          position: "absolute",
          width: 150,
          height: 600,
          left: 420,
          background: `linear-gradient(90deg, ${C.orangeDeep}, #C44A06)`,
          transformOrigin: "left center",
          transform: "rotateY(90deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ transform: "rotate(-90deg)", fontFamily: SERIF, fontWeight: 700, fontSize: 84, color: "#fff", whiteSpace: "nowrap" }}>Celine</div>
      </div>
      {/* front */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#FFFBF4",
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ position: "absolute", right: -60, top: -40, width: 330, height: 330, borderRadius: 999, background: "radial-gradient(circle, #FFD47E, #FF9A2E 60%, rgba(255,154,46,0) 72%)" }} />
        <div style={{ position: "absolute", right: 40, top: 60 }}>
          <Spark size={150} color="#ffffff" />
        </div>
        <div style={{ position: "absolute", left: 32, top: 34, width: 54, height: 54, borderRadius: 99, background: C.orange, color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          C
        </div>
        <div style={{ position: "absolute", left: 34, top: 300, fontFamily: SANS, fontWeight: 600, fontSize: 24, color: C.orangeDeep, letterSpacing: 1 }}>DAILY IMMUNITY SUPPORT</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 340, height: 180, background: C.orange, padding: "8px 34px" }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 104, color: "#fff", lineHeight: 1.1 }}>Celine</div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28, color: "#fff", letterSpacing: 2 }}>VITAMIN C TABLETS</div>
        </div>
        <div style={{ position: "absolute", left: 34, bottom: 26, fontFamily: SANS, fontWeight: 500, fontSize: 22, color: "#6b4a33", letterSpacing: 2 }}>RV LIFE SCIENCES</div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Silhouette: mother + child holding hands (backlit)                  */
/* ------------------------------------------------------------------ */
export const Family: React.FC<{ fill: string; step: number }> = ({ fill, step }) => {
  const sw = Math.sin(step) * 10;
  return (
    <svg viewBox="-200 -520 400 540" width={520} height={702}>
      <g fill={fill}>
        {/* mother */}
        <circle cx={-60} cy={-440} r={38} />
        <path d="M-40 -470 q40 10 30 70 q-10 -30 -30 -40 z" />
        <path d="M-108 -390 q48 -22 96 0 l14 170 l22 200 h-168 l22 -200 z" />
        <path d={`M-100 -380 q-26 90 -${18 - sw * 0.3} 170`} stroke={fill} strokeWidth={22} strokeLinecap="round" fill="none" />
        <path d="M-20 -380 q40 70 58 140" stroke={fill} strokeWidth={22} strokeLinecap="round" fill="none" />
        {/* child */}
        <circle cx={92} cy={-262} r={30} />
        <path d="M62 -226 q30 -14 60 0 l8 120 h-76 z" />
        <path d={`M72 -110 l-${6 + sw * 0.4} 108`} stroke={fill} strokeWidth={20} strokeLinecap="round" />
        <path d={`M112 -110 l${6 + sw * 0.4} 108`} stroke={fill} strokeWidth={20} strokeLinecap="round" />
        <path d="M66 -214 q-20 -10 -28 -26" stroke={fill} strokeWidth={16} strokeLinecap="round" fill="none" />
        {/* school bag */}
        <rect x={116} y={-222} width={30} height={70} rx={10} />
      </g>
    </svg>
  );
};

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.08 }) => {
  const frame = useCurrentFrame();
  const seed = frame % 6;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <filter id={`g${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
      </filter>
      <rect width="100%" height="100%" filter={`url(#g${seed})`} />
    </svg>
  );
};

export const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; serif?: boolean; style?: React.CSSProperties }> = ({
  children,
  size = 130,
  color = "#fff",
  serif,
  style,
}) => (
  <div
    style={{
      fontFamily: serif ? SERIF : SANS,
      fontWeight: serif ? 700 : 800,
      fontSize: size,
      lineHeight: 1.02,
      letterSpacing: serif ? 0 : -3,
      color,
      textAlign: "center",
      ...style,
    }}
  >
    {children}
  </div>
);
