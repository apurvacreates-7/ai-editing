import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Appear, C, clamp, Eyebrow, GradText, Scene, Sub, Title, useProgress } from "../ui";

const STEP = 42;
const STEPS = [
  { t: "Verify mobile", d: "OTP login — no app, no password" },
  { t: "Connect Instagram", d: "Handle checked: real & public" },
  { t: "Upload your video", d: "Straight from phone or laptop" },
  { t: "AI check", d: "Scored against the Whiskas brief" },
  { t: "Share post link", d: "Matched to the uploaded video" },
  { t: "Get your reward", d: "Coupon or free pouch, instantly" },
];
const START = 40;
export const WEB = START + STEP * STEPS.length + 70;

const Pane: React.FC<{ i: number; children: React.ReactNode }> = ({ i, children }) => {
  const f = useCurrentFrame();
  const a = START + i * STEP;
  const last = i === STEPS.length - 1;
  const o = interpolate(f, [a, a + 8, a + STEP - 4, a + STEP + 2], [0, 1, 1, last ? 1 : 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px" }}>
      {children}
    </div>
  );
};

const H: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "#111", marginBottom: 18 }}>{children}</div>
);
const Field: React.FC<{ children: React.ReactNode; ok?: boolean }> = ({ children, ok }) => (
  <div
    style={{
      border: `2px solid ${ok ? "#16a34a" : "#d4d4d8"}`,
      borderRadius: 12,
      padding: "14px 18px",
      fontSize: 22,
      color: "#111",
      display: "flex",
      justifyContent: "space-between",
    }}
  >
    {children}
  </div>
);

const Browser: React.FC = () => {
  const f = useCurrentFrame();
  const active = Math.min(STEPS.length - 1, Math.max(0, Math.floor((f - START) / STEP)));
  const upload = interpolate(f, [START + 2 * STEP + 6, START + 3 * STEP - 6], [0, 1], clamp);
  return (
    <div
      style={{
        width: 1060,
        height: 660,
        borderRadius: 18,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 40px 140px rgba(120,60,200,0.35)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 50, background: "#efeef2", display: "flex", alignItems: "center", gap: 10, padding: "0 18px", flex: "none" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <div style={{ marginLeft: 20, flex: 1, height: 30, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", padding: "0 14px", fontSize: 15, color: "#555" }}>
          🔒 whiskas.in/myfussycatad
        </div>
      </div>
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ width: 330, background: "#faf7fc", borderRight: "1px solid #eee", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <Img src={staticFile("whiskas_logo.png")} style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "#4a1663" }}>#MyFussyCatAd</div>
          </div>
          {STEPS.map((s, i) => {
            const done = i < active || (i === active && i === STEPS.length - 1 && f > START + i * STEP + 20);
            const on = i === active;
            return (
              <div key={s.t} style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 10px", borderRadius: 10, background: on ? "#efe3f6" : "transparent" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: done ? "#16a34a" : on ? "#6d2a8c" : "#e4e4e7",
                    color: done || on ? "#fff" : "#888",
                    fontSize: 15,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: 18, fontWeight: on ? 700 : 500, color: on ? "#111" : "#555" }}>{s.t}</div>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <Pane i={0}>
            <H>Join with your mobile number</H>
            <Field ok>
              +91 98201 4•••7 <span style={{ color: "#16a34a" }}>✓</span>
            </Field>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {"4819".split("").map((d) => (
                <div key={d} style={{ width: 64, height: 64, border: "2px solid #16a34a", borderRadius: 12, fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#111" }}>
                  {d}
                </div>
              ))}
            </div>
          </Pane>
          <Pane i={1}>
            <H>Your Instagram handle</H>
            <Field ok>
              @meera.and.mochi <span style={{ color: "#16a34a", fontSize: 18, fontWeight: 700 }}>✓ Public profile</span>
            </Field>
            <div style={{ fontSize: 17, color: "#666", marginTop: 12 }}>We only read public info. Duplicate entries are blocked.</div>
          </Pane>
          <Pane i={2}>
            <H>Upload your fussy-cat video</H>
            <div style={{ display: "flex", gap: 20, alignItems: "center", border: "2px dashed #c9a6dc", borderRadius: 16, padding: 18 }}>
              <Img src={staticFile("dash/q13_0.jpg")} style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, color: "#111", fontWeight: 600 }}>mochi_dinner.mp4 · 6.1 MB</div>
                <div style={{ height: 10, borderRadius: 5, background: "#eee", marginTop: 12 }}>
                  <div style={{ width: `${upload * 100}%`, height: "100%", borderRadius: 5, background: "#6d2a8c" }} />
                </div>
                <div style={{ fontSize: 15, color: "#666", marginTop: 8 }}>{Math.round(upload * 100)}% uploaded</div>
              </div>
            </div>
          </Pane>
          <Pane i={3}>
            <H>Checking against the brief…</H>
            {[
              ["Cat in frame", "98%"],
              ["Whiskas pack visible", "95%"],
              ["Genuine reaction", "91%"],
              ["Nothing off-brand", "Pass"],
            ].map(([k, v], j) => {
              const p = useProgress(START + 3 * STEP + 4 + j * 7, 10);
              return (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#111", padding: "9px 0", borderBottom: "1px solid #eee", opacity: 0.2 + 0.8 * p }}>
                  <span>
                    <span style={{ color: "#16a34a", fontWeight: 800 }}>✓</span> {k}
                  </span>
                  <b style={{ color: "#16a34a" }}>{v}</b>
                </div>
              );
            })}
          </Pane>
          <Pane i={4}>
            <H>Paste your Instagram post link</H>
            <Field ok>
              instagram.com/reel/Cz7Mochi… <span style={{ color: "#16a34a", fontSize: 18, fontWeight: 700 }}>✓ 96% match</span>
            </Field>
            <div style={{ fontSize: 17, color: "#666", marginTop: 12 }}>@whiskasindia tagged · #MyFussyCatAd · public</div>
          </Pane>
          <Pane i={5}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 64 }}>🎉</div>
              <H>You’re verified, Meera!</H>
              <div style={{ display: "inline-block", border: "2px dashed #b265c9", borderRadius: 14, padding: "14px 30px", color: "#6d2a8c", fontWeight: 800, fontSize: 24 }}>
                FREE WHISKAS WET POUCH
                <div style={{ fontWeight: 500, fontSize: 16, color: "#555" }}>Confirmation also sent on SMS & email</div>
              </div>
            </div>
          </Pane>
        </div>
      </div>
    </div>
  );
};

export const Web: React.FC = () => (
  <Scene dur={WEB} glowX="68%" glowY="50%">
    <div style={{ position: "absolute", left: 150, top: 230, width: 560 }}>
      <Appear delay={0}>
        <Eyebrow>Or on the web</Eyebrow>
      </Appear>
      <Appear delay={4}>
        <Title size={68} style={{ marginTop: 14 }}>
          Prefer a browser?
          <br />
          <GradText>Same journey.</GradText>
        </Title>
      </Appear>
      <Appear delay={10}>
        <Sub style={{ marginTop: 22, fontSize: 25 }}>
          For cat parents who arrive from an ad, an influencer’s link or a QR code — sign up and submit without WhatsApp.
        </Sub>
      </Appear>
      <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 12 }}>
        {["Mobile OTP sign-up, no app", "Same AI checks & rules", "Lands in the same brand dashboard"].map((t, i) => (
          <Appear key={t} delay={20 + i * 8} y={10}>
            <div style={{ fontSize: 23, display: "flex", gap: 12 }}>
              <span style={{ color: C.purple }}>✦</span>
              {t}
            </div>
          </Appear>
        ))}
      </div>
    </div>
    <div style={{ position: "absolute", right: 110, top: 210 }}>
      <Appear delay={8} y={40}>
        <Browser />
      </Appear>
    </div>
  </Scene>
);
