import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CityScene } from "./CityScene";
import { SANS, SERIF, SERIF_ITALIC } from "./fonts";
import { ProductScene } from "./ProductScene";
import { clamp, T } from "./timeline";

const fade = (frame: number, a: number, b: number, len = 12) =>
  interpolate(frame, [a, a + len, b - len, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Caption: React.FC<{ from: number; to: number; children: React.ReactNode; small?: React.ReactNode; top?: boolean }> = ({
  from,
  to,
  children,
  small,
  top,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const o = fade(frame, from, to, 14);
  const y = interpolate(frame, [from, from + 20], [24, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: top ? "flex-start" : "flex-end", alignItems: "center", paddingBottom: 300, paddingTop: 230 }}>
      <div style={{ opacity: o, transform: `translateY(${y}px)`, textAlign: "center", padding: "0 90px" }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: 74,
            lineHeight: 1.18,
            color: "#fffaf2",
            textShadow: "0 4px 30px rgba(0,0,0,0.55)",
          }}
        >
          {children}
        </div>
        {small ? (
          <div
            style={{
              marginTop: 26,
              fontFamily: SANS,
              fontSize: 36,
              fontWeight: 500,
              letterSpacing: 1,
              color: "rgba(255,245,230,0.92)",
              textShadow: "0 2px 16px rgba(0,0,0,0.6)",
            }}
          >
            {small}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const AqiBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const o = fade(frame, 20, T.burst - 5, 15);
  if (o <= 0) return null;
  const value = Math.round(interpolate(frame, [20, 110], [318, 452], { extrapolateRight: "clamp" }));
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(frame / 10));
  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 80,
        opacity: o,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 28px",
        borderRadius: 999,
        background: "rgba(30,22,18,0.55)",
        border: "1px solid rgba(255,255,255,0.18)",
        fontFamily: SANS,
        color: "#fff",
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: 99, background: "#e23b3b", opacity: pulse, boxShadow: "0 0 18px #e23b3b" }} />
      <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: 1 }}>NEW DELHI</div>
      <div style={{ fontSize: 32, fontWeight: 400, opacity: 0.8 }}>AQI {value} · Severe</div>
    </div>
  );
};

const Grade: React.FC = () => {
  const frame = useCurrentFrame();
  const warm = clamp(frame, [T.burst, T.clearEnd], [0, 1]);
  return (
    <>
      {/* Desaturated, heavy look in smog; warm glow after */}
      <AbsoluteFill style={{ background: "rgba(70,60,50,1)", mixBlendMode: "color", opacity: 0.35 * (1 - warm) }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(255,190,110,0.35), rgba(255,190,110,0) 60%)",
          opacity: warm * 0.8,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      {/* flash at the burst */}
      <AbsoluteFill style={{ background: "#fff3dc", opacity: clamp(frame, [T.burst - 3, T.burst + 2, T.burst + 22], [0, 0.55, 0]) }} />
    </>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const local = frame - T.endCard;
  if (local < 0) return null;
  const o = clamp(local, [0, 18], [0, 1]);
  const head = clamp(local, [10, 30], [0, 1]);
  const cta = clamp(local, [30, 50], [0, 1]);
  const btnPulse = 1 + Math.max(0, Math.sin((local - 55) / 7)) * 0.03 * (local > 55 ? 1 : 0);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, #fff4e2 0%, #ffd9a6 45%, #f59a47 100%)" }} />
      <AbsoluteFill style={{ top: 330, height: 1000 }}>
        <ThreeCanvas width={width} height={1000} camera={{ position: [0, 0, 7.2], fov: 38 }} gl={{ alpha: true }}>
          <ProductScene />
        </ThreeCanvas>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 140,
          width: "100%",
          textAlign: "center",
          opacity: head,
          transform: `translateY(${(1 - head) * 20}px)`,
          fontFamily: SERIF_ITALIC,
          fontStyle: "italic",
          fontSize: 60,
          color: "#6a2d0c",
          padding: "0 90px",
          boxSizing: "border-box",
          lineHeight: 1.25,
        }}
      >
        This winter, give your family&apos;s immunity a daily ally.
      </div>
      <div
        style={{
          position: "absolute",
          top: 1330,
          width: "100%",
          textAlign: "center",
          opacity: cta,
          transform: `translateY(${(1 - cta) * 24}px)`,
        }}
      >
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: "#7a2e06", letterSpacing: -1 }}>
          Claim your FREE sample
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 38, color: "#7a3a14", marginTop: 12 }}>
          Celine Vitamin C Tablets · RV Life Sciences
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 48,
            padding: "30px 70px",
            borderRadius: 999,
            background: "linear-gradient(180deg, #ff8a2a, #e0600c)",
            color: "#fff",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 44,
            boxShadow: "0 18px 40px rgba(180,70,10,0.35)",
            transform: `scale(${btnPulse})`,
          }}
        >
          Experience the immunity boost →
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 70,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 22,
          color: "rgba(90,40,10,0.75)",
          padding: "0 100px",
          boxSizing: "border-box",
          opacity: cta,
        }}
      >
        Nutritional supplement. Supports normal immune function; not a treatment for pollution-related illness. Consult your doctor.
        Free sample subject to availability.
      </div>
    </AbsoluteFill>
  );
};

export const Ad: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 50, near: 0.1, far: 400 }}>
        <CityScene />
      </ThreeCanvas>
      <Grade />
      <AqiBadge />
      <Caption from={12} to={110}>
        Every winter, Delhi holds its breath.
      </Caption>
      <Caption from={122} to={245}>
        And every breath asks a little more
        <br />
        of our immunity.
      </Caption>
      <Caption top from={318} to={T.endCard - 4} small="CELINE VITAMIN C · RV LIFE SCIENCES">
        Help your body stand strong.
      </Caption>
      <EndCard />
      <Audio src={staticFile("music.wav")} />
    </AbsoluteFill>
  );
};
