import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  Appear,
  C,
  Card,
  CardLabel,
  Check,
  clamp,
  Eyebrow,
  FreestandLogo,
  GradText,
  Scene,
  Sub,
  Title,
  useProgress,
  WhiskasIcon,
} from "../ui";
import { ChatBody, ChatImage, Msg, PhoneFrame, QuickReply, WaHeader, WaInput } from "../phone";

/* ───────────────────────── 1. Hook ───────────────────────── */
export const HOOK = 120;
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const posterIn = useProgress(4, 26);
  return (
    <Scene dur={HOOK} glowX="75%" glowY="50%" powered={false}>
      <div style={{ position: "absolute", left: 150, top: 200 }}>
        <Appear delay={0}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <WhiskasIcon size={58} radius={12} />
            <span style={{ color: C.dim, fontSize: 26 }}>×</span>
            <FreestandLogo h={40} />
            <span style={{ width: 1, height: 30, background: C.cardLine, margin: "0 6px" }} />
            <span style={{ color: C.mut, fontSize: 22, letterSpacing: "0.06em", fontWeight: 600 }}>UGC AI</span>
          </div>
        </Appear>
        <div style={{ marginTop: 60 }}>
          <Appear delay={8}>
            <Title size={92}>Real cat parents.</Title>
          </Appear>
          <Appear delay={26}>
            <Title size={92}>Real content.</Title>
          </Appear>
          <Appear delay={46}>
            <Title size={92}>
              <GradText>Verified by AI.</GradText>
            </Title>
          </Appear>
          <Appear delay={66}>
            <Sub style={{ marginTop: 34, maxWidth: 760 }}>
              How Whiskas found cat parents, collected their videos — and got only the real, on-brand ones.
            </Sub>
          </Appear>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 180,
          top: 140,
          width: 580,
          height: 774,
          borderRadius: 26,
          overflow: "hidden",
          opacity: posterIn,
          transform: `translateY(${(1 - posterIn) * 40}px) scale(${1.04 - 0.04 * posterIn + f * 0.0002}) rotate(${(1 - posterIn) * 3}deg)`,
          boxShadow: "0 0 140px rgba(160,70,220,0.45)",
        }}
      >
        <Img src={staticFile("poster.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </Scene>
  );
};

/* ─────────────────── 2. Discovery: who gets invited ─────────────────── */
export const DISCOVERY = 330;

const FILTERS = [
  { k: "Source", v: "FreeStand CDP", note: "1st-party data from past sampling" },
  { k: "Pet", v: "Cat parent", note: "self-declared in earlier journeys" },
  { k: "History", v: "Sampled pet food before", note: "Whiskas & category claimants" },
  { k: "Consent", v: "Opted in on WhatsApp", note: "OK to hear from brands" },
  { k: "Exclude", v: "Duplicates & past entrants", note: "one entry per person" },
];
const FILTER_AT = (i: number) => 40 + i * 26;

// Deterministic pseudo-random so every render is identical.
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const COLS = 26;
const ROWS = 15;
const DOTS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  i,
  // stage at which this dot drops out (1..5) or survives (6)
  cut: (() => {
    const r = rnd(i);
    if (r < 0.06) return 1; // non-CDP noise
    if (r < 0.52) return 2; // not a cat parent
    if (r < 0.7) return 3; // never sampled pet food
    if (r < 0.8) return 4; // no WhatsApp consent
    if (r < 0.84) return 5; // duplicates / past entrants
    return 6;
  })(),
}));

const DotField: React.FC = () => {
  const f = useCurrentFrame();
  const sendAt = FILTER_AT(5) + 30;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 12, width: 650 }}>
      {DOTS.map((d) => {
        const appear = interpolate(f, [8 + (d.i % COLS) * 0.8, 20 + (d.i % COLS) * 0.8], [0, 1], clamp);
        // dot dims once the filter that removes it lands
        const cutF = d.cut <= 5 ? FILTER_AT(d.cut - 1) + 10 : 99999;
        const dim = interpolate(f, [cutF, cutF + 14], [0, 1], clamp);
        const survivor = d.cut === 6;
        const glow = survivor ? interpolate(f, [FILTER_AT(4) + 20, FILTER_AT(4) + 40], [0, 1], clamp) : 0;
        const pulse = survivor && f > sendAt ? 0.5 + 0.5 * Math.sin((f - sendAt) / 4 + d.i) : 0;
        const bg = survivor && glow > 0 ? `rgba(196,120,250,${0.55 + 0.45 * glow})` : `rgba(255,255,255,${0.55 - 0.45 * dim})`;
        const size = 13 + glow * 3 + pulse * 2;
        return (
          <div key={d.i} style={{ height: 19, display: "flex", alignItems: "center", justifyContent: "center", opacity: appear }}>
            <div
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                background: bg,
                boxShadow: glow > 0 ? `0 0 ${10 + pulse * 10}px rgba(196,120,250,${0.7 * glow})` : "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const Notification: React.FC<{ at: number; name: string; offset: number }> = ({ at, name, offset }) => {
  const p = useProgress(at, 16);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * -30}px) scale(${1 - offset * 0.04})`,
        marginTop: offset === 0 ? 0 : -88,
        zIndex: 10 - offset,
        position: "relative",
        filter: `brightness(${1 - offset * 0.18})`,
      }}
    >
      <div
        style={{
          background: "#28242f",
          border: `1px solid ${C.cardLine}`,
          borderRadius: 22,
          padding: "16px 20px",
          display: "flex",
          gap: 14,
          alignItems: "center",
          width: 600,
          backdropFilter: "blur(10px)",
        }}
      >
        <WhiskasIcon size={48} radius={12} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: C.mut }}>
            <span>
              <b style={{ color: C.text }}>Whiskas</b> <span style={{ color: C.green }}>✓</span> · WhatsApp
            </span>
            <span>now</span>
          </div>
          <div style={{ fontSize: 19, marginTop: 3 }}>
            Hi {name}! 🐱 Is your cat a fussy eater? Make a #MyFussyCatAd…
          </div>
        </div>
      </div>
    </div>
  );
};

export const Discovery: React.FC = () => {
  const f = useCurrentFrame();
  const sendAt = FILTER_AT(5) + 30;
  const btn = useProgress(FILTER_AT(5), 16);
  const pressed = interpolate(f, [sendAt - 6, sendAt, sendAt + 6], [1, 0.95, 1], clamp);
  return (
    <Scene dur={DISCOVERY} glowX="72%" glowY="45%">
      <div style={{ position: "absolute", left: 150, top: 110, width: 880 }}>
        <Appear delay={0}>
          <Eyebrow>Step 0 · Discovery</Eyebrow>
        </Appear>
        <Appear delay={6}>
          <Title size={60} style={{ marginTop: 14 }}>
            Who gets invited?
            <br />
            <GradText>Cat parents you already know.</GradText>
          </Title>
        </Appear>
        <Appear delay={14}>
          <Sub style={{ marginTop: 22, fontSize: 25 }}>
            No “post and pray”. FreeStand picks the cohort from its consumer data, and the invite comes from Whiskas’ own
            verified WhatsApp number.
          </Sub>
        </Appear>
        <Appear delay={24} style={{ marginTop: 34 }}>
          <Card style={{ padding: "22px 28px" }}>
            <CardLabel>Audience builder · FreeStand CDP</CardLabel>
            {FILTERS.map((r, i) => {
              const p = useProgress(FILTER_AT(i), 14);
              return (
                <div
                  key={r.k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "11px 0",
                    borderTop: i ? `1px solid ${C.cardLine}` : "none",
                    opacity: 0.25 + 0.75 * p,
                  }}
                >
                  <Check size={26} color={p > 0.5 ? (r.k === "Exclude" ? C.bad : "#22c55e") : "#444"} mark={r.k === "Exclude" ? "–" : "✓"} />
                  <span style={{ width: 120, color: C.mut, fontSize: 21 }}>{r.k}</span>
                  <span style={{ fontSize: 22, fontWeight: 650 as React.CSSProperties["fontWeight"], flex: 1 }}>{r.v}</span>
                  <span style={{ fontSize: 17, color: C.dim }}>{r.note}</span>
                </div>
              );
            })}
            <div
              style={{
                marginTop: 14,
                opacity: btn,
                transform: `scale(${pressed})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                background: f > sendAt ? "#1f8f4e" : C.green,
                color: "#04170b",
                borderRadius: 14,
                padding: "14px 0",
                fontSize: 21,
                fontWeight: 800,
              }}
            >
              {f > sendAt ? "✓ Invites sent from Whiskas’ WhatsApp" : "Send invite via WhatsApp Business →"}
            </div>
          </Card>
        </Appear>
      </div>

      <div style={{ position: "absolute", left: 1090, top: 120, width: 680 }}>
        <Appear delay={6}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, color: C.mut, marginBottom: 20, width: 650 }}>
            <span>FreeStand consumer graph</span>
            <span style={{ color: C.purple, opacity: interpolate(f, [FILTER_AT(4) + 20, FILTER_AT(4) + 34], [0, 1], clamp) }}>
              ● matched cohort
            </span>
          </div>
        </Appear>
        <DotField />
        <div style={{ marginTop: 44 }}>
          <Notification at={sendAt + 8} name="Ananya" offset={0} />
          <Notification at={sendAt + 18} name="Rohit" offset={1} />
          <Notification at={sendAt + 28} name="Meera" offset={2} />
        </div>
      </div>
    </Scene>
  );
};

/* ─────────────────── 3. Two ways in ─────────────────── */
export const TWO_WAYS = 270;

const WebLanding: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const typed = "98201 4•••7".slice(0, Math.max(0, Math.floor((f - at - 50) / 3)));
  const otp = f > at + 110;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", color: "#111" }}>
      <div style={{ margin: "4px 14px 10px", background: "#eeedf0", borderRadius: 12, padding: "9px 14px", fontSize: 15, color: "#555", display: "flex", gap: 8 }}>
        🔒 <span>whiskas.in/myfussycatad</span>
      </div>
      <div style={{ height: 300, position: "relative", overflow: "hidden" }}>
        <Img src={staticFile("poster.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%" }} />
      </div>
      <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.02em" }}>Show us your fussy cat 🐱</div>
        <div style={{ fontSize: 16, color: "#555", lineHeight: 1.4 }}>
          Upload one video. If it’s on-brief, a free Whiskas Wet pouch is yours.
        </div>
        <div style={{ fontSize: 13, color: "#777", fontWeight: 600, marginTop: 4 }}>MOBILE NUMBER</div>
        <div style={{ border: "1.5px solid #6d2a8c", borderRadius: 10, padding: "11px 14px", fontSize: 18, minHeight: 46 }}>
          +91 {typed}
          {!otp && <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span>}
        </div>
        {otp ? (
          <div style={{ display: "flex", gap: 10 }}>
            {["4", "8", "1", "9"].map((d, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 50,
                  border: "1.5px solid #ccc",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  opacity: interpolate(f, [at + 114 + i * 6, at + 120 + i * 6], [0, 1], clamp),
                }}
              >
                {d}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#6d2a8c", color: "#fff", borderRadius: 10, padding: "13px 0", textAlign: "center", fontWeight: 700, fontSize: 18 }}>
            Get OTP
          </div>
        )}
      </div>
    </div>
  );
};

const Door: React.FC<{
  at: number;
  tag: string;
  title: string;
  body: string;
  sources: string[];
  phone: React.ReactNode;
  side: "left" | "right";
}> = ({ at, tag, title, body, sources, phone, side }) => {
  const p = useProgress(at, 22);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: side === "left" ? "row" : "row-reverse",
        alignItems: "center",
        gap: 40,
        opacity: p,
        transform: `translateX(${(1 - p) * (side === "left" ? -40 : 40)}px)`,
      }}
    >
      <div style={{ width: 380, height: 780, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: "scale(0.8)" }}>{phone}</div>
      </div>
      <div style={{ width: 300 }}>
        <div
          style={{
            display: "inline-block",
            fontSize: 17,
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: 999,
            background: side === "left" ? "rgba(37,211,102,0.15)" : "rgba(168,116,246,0.18)",
            color: side === "left" ? C.green : C.purple,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {tag}
        </div>
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 16, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 21, color: C.mut, marginTop: 14, lineHeight: 1.45 }}>{body}</div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {sources.map((s, i) => (
            <Appear key={s} delay={at + 24 + i * 8} y={10}>
              <div style={{ fontSize: 19, color: C.text, display: "flex", gap: 10 }}>
                <span style={{ color: side === "left" ? C.green : C.purple }}>→</span>
                {s}
              </div>
            </Appear>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TwoWays: React.FC = () => {
  const f = useCurrentFrame();
  const engine = useProgress(170, 20);
  return (
    <Scene dur={TWO_WAYS} glowY="40%">
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center" }}>
        <Appear delay={0}>
          <Title size={64}>
            Two ways in. <GradText>One AI referee.</GradText>
          </Title>
        </Appear>
        <Appear delay={8}>
          <Sub style={{ marginTop: 10, fontSize: 25 }}>Creators join where they already are — no app to download.</Sub>
        </Appear>
      </div>
      <div style={{ position: "absolute", top: 200, left: 90, right: 90, display: "flex", justifyContent: "space-between" }}>
        <Door
          side="left"
          at={18}
          tag="WhatsApp-native"
          title="Existing customers"
          body="Whiskas messages the matched cohort directly. One tap and they’re in."
          sources={["FreeStand CDP cohort", "Past sample claimants", "Brand’s own CRM list"]}
          phone={
            <PhoneFrame>
              <WaHeader />
              <ChatBody>
                <Msg at={30} time="7:12 PM" pad={false}>
                  <ChatImage src="ad_thumb.png" h={150} />
                  <div style={{ padding: "8px 10px 0" }}>
                    🐱 Is your cat a fussy eater? Make a <b>#MyFussyCatAd</b> for Whiskas and get a <b>FREE Whiskas Wet pouch!</b>
                  </div>
                </Msg>
                <QuickReply at={40} tapAt={110}>
                  Yes, I’m in! 🙌
                </QuickReply>
                <QuickReply at={44}>Maybe later</QuickReply>
              </ChatBody>
              <WaInput />
            </PhoneFrame>
          }
        />
        <Door
          side="right"
          at={60}
          tag="Web"
          title="New cat parents"
          body="Anyone outside the cohort lands on a web page and signs up with mobile OTP."
          sources={["Instagram & Meta ads", "Influencer bio links", "QR on the pack / in-store"]}
          phone={
            <PhoneFrame screenBg="#fff">
              <WebLanding at={60} />
            </PhoneFrame>
          }
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 560,
          transform: `translate(-50%, -50%) scale(${0.8 + 0.2 * engine})`,
          opacity: engine,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, color: C.dim }}>
          <span>→</span>
          <div
            style={{
              padding: "18px 30px",
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(168,116,246,0.25), rgba(228,111,174,0.2))",
              border: "1px solid rgba(200,140,255,0.5)",
              boxShadow: `0 0 ${40 + 10 * Math.sin(f / 6)}px rgba(168,116,246,0.5)`,
              color: C.text,
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            UGC AI
          </div>
          <span>←</span>
        </div>
        <div style={{ fontSize: 16, color: C.mut, marginTop: 14, lineHeight: 1.4 }}>
          same brief
          <br />
          same checks
          <br />
          same reward
        </div>
      </div>
    </Scene>
  );
};


