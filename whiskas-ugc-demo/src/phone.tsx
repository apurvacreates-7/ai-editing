import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, fontFamily, useSpring, WhiskasIcon } from "./ui";

export const PHONE_W = 470;
export const PHONE_H = 960;

/** iPhone-style frame. `screenBg` fills the screen behind children. */
export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  scale?: number;
  screenBg?: string;
  dark?: boolean;
  style?: React.CSSProperties;
}> = ({ children, scale = 1, screenBg = "#efeae2", dark = false, style }) => (
  <div
    style={{
      width: PHONE_W,
      height: PHONE_H,
      borderRadius: 72,
      padding: 14,
      background: "linear-gradient(160deg,#3a3840,#18171b 40%,#2a292e)",
      boxShadow: "0 40px 120px rgba(120,60,200,0.35), 0 0 0 2px rgba(255,255,255,0.08) inset",
      transform: `scale(${scale})`,
      transformOrigin: "center center",
      fontFamily,
      flex: "none",
      ...style,
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 58,
        overflow: "hidden",
        background: screenBg,
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StatusBar dark={dark} />
      {children}
    </div>
  </div>
);

const StatusBar: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div
    style={{
      height: 58,
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 34px 0",
      fontSize: 19,
      fontWeight: 600,
      color: dark ? "#fff" : "#111",
      background: dark ? "transparent" : "#f6f5f3",
      position: "relative",
      zIndex: 3,
    }}
  >
    <span>9:41</span>
    <div style={{ position: "absolute", left: "50%", top: 12, transform: "translateX(-50%)", width: 124, height: 36, borderRadius: 20, background: "#000" }} />
    <span style={{ letterSpacing: 1 }}>●●● ▮</span>
  </div>
);

export const WaHeader: React.FC = () => (
  <div
    style={{
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 18px 14px",
      background: "#f6f5f3",
      borderBottom: "1px solid #e4e1dc",
      zIndex: 2,
    }}
  >
    <span style={{ color: "#1d7cf2", fontSize: 26, fontWeight: 600 }}>‹</span>
    <WhiskasIcon size={42} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: "#111" }}>Whiskas</div>
      <div style={{ fontSize: 13, color: "#6b6b6b" }}>Business account</div>
    </div>
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        background: "#25d366",
        color: "#fff",
        fontSize: 13,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      ✓
    </div>
  </div>
);

export const WaInput: React.FC = () => (
  <div style={{ flex: "none", display: "flex", gap: 10, padding: "10px 14px 22px", background: "#f6f5f3", alignItems: "center", zIndex: 2 }}>
    <div style={{ flex: 1, height: 42, borderRadius: 21, background: "#fff", border: "1px solid #e2e0dc", color: "#999", fontSize: 16, display: "flex", alignItems: "center", paddingLeft: 16 }}>
      Message
    </div>
    <div style={{ width: 42, height: 42, borderRadius: 21, background: "#25d366" }} />
  </div>
);

/** Chat column: messages stack from the bottom, older ones scroll off the top. */
export const ChatBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      flex: 1,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      gap: 10,
      padding: "12px 12px 10px",
      background: "#efeae2",
    }}
  >
    {children}
  </div>
);

/**
 * A chat message that pops in at `at`. Before then it takes no space, so the
 * column "scrolls" naturally as messages arrive.
 */
export const Msg: React.FC<{
  at: number;
  out?: boolean;
  time?: string;
  children: React.ReactNode;
  width?: number | string;
  pad?: boolean;
}> = ({ at, out = false, time, children, width, pad = true }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, 15);
  if (f < at) return null;
  // grow height smoothly so earlier messages slide up instead of jumping
  const h = interpolate(f, [at, at + 8], [0, 1], clamp);
  return (
    <div
      style={{
        alignSelf: out ? "flex-end" : "flex-start",
        maxWidth: "84%",
        width,
        transform: `scale(${0.85 + 0.15 * s})`,
        transformOrigin: out ? "bottom right" : "bottom left",
        opacity: Math.min(1, s * 1.4),
        maxHeight: h * 900,
      }}
    >
      <div
        style={{
          background: out ? "#d9fdd3" : "#fff",
          borderRadius: 16,
          borderTopRightRadius: out ? 4 : 16,
          borderTopLeftRadius: out ? 16 : 4,
          padding: pad ? "10px 14px 6px" : 5,
          fontSize: 17,
          lineHeight: 1.38,
          color: "#111",
          boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
        }}
      >
        {children}
        {time && (
          <div style={{ fontSize: 12, color: "#8a8a8a", textAlign: "right", marginTop: 2, paddingRight: pad ? 0 : 8 }}>
            {time} {out && <span style={{ color: "#53bdeb" }}>✓✓</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export const QuickReply: React.FC<{ at: number; children: React.ReactNode; tapAt?: number }> = ({ at, children, tapAt }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const o = interpolate(f, [at, at + 8], [0, 1], clamp);
  const tap = tapAt !== undefined ? interpolate(f, [tapAt - 6, tapAt, tapAt + 6], [1, 0.94, 1], clamp) : 1;
  const ring = tapAt !== undefined ? interpolate(f, [tapAt - 8, tapAt + 10], [0, 1], clamp) : 0;
  return (
    <div
      style={{
        alignSelf: "flex-start",
        width: "84%",
        background: "#fff",
        borderRadius: 12,
        padding: "10px 0",
        textAlign: "center",
        color: "#1d7cf2",
        fontWeight: 600,
        fontSize: 17,
        opacity: o,
        transform: `scale(${tap})`,
        position: "relative",
      }}
    >
      {children}
      {ring > 0 && ring < 1 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 54,
            height: 54,
            marginLeft: -27,
            marginTop: -27,
            borderRadius: 27,
            border: "3px solid rgba(29,124,242,0.6)",
            transform: `scale(${0.6 + ring})`,
            opacity: 1 - ring,
          }}
        />
      )}
    </div>
  );
};

export const ChatImage: React.FC<{ src: string; h?: number; children?: React.ReactNode }> = ({ src, h = 170, children }) => (
  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: h }}>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    {children}
  </div>
);
