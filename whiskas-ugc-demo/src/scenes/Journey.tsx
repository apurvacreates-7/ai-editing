import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Appear, C, Card, CardLabel, Check, clamp, Eyebrow, GRAD, Scene, Sub, Title, useProgress } from "../ui";
import { ChatBody, ChatImage, Msg, PhoneFrame, QuickReply, WaHeader, WaInput } from "../phone";

const STEP = 110;
const STEPS = ["Invite", "Handle", "Brief", "AI check", "Match", "Reward"];
export const JOURNEY = STEP * STEPS.length + 20;

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 14 }}>
      {STEPS.map((s, i) => {
        const p = interpolate(f, [i * STEP, (i + 1) * STEP], [0, 1], clamp);
        const active = f >= i * STEP;
        return (
          <div key={s} style={{ width: 118 }}>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
              <div style={{ width: `${p * 100}%`, height: "100%", background: GRAD }} />
            </div>
            <div style={{ fontSize: 17, marginTop: 10, fontWeight: 600, color: active ? C.text : C.dim }}>{s}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Left-hand explainer for one step; fades in at its slot and out before the next. */
const Panel: React.FC<{ i: number; eyebrow: string; title: string; sub: string; children?: React.ReactNode }> = ({
  i,
  eyebrow,
  title,
  sub,
  children,
}) => {
  const f = useCurrentFrame();
  const start = i * STEP;
  const end = i === STEPS.length - 1 ? 99999 : start + STEP - 10;
  if (f < start - 2 || f > end + 14) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 960 }}>
      <Appear delay={start} out={end}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Appear>
      <Appear delay={start + 3} out={end}>
        <Title style={{ marginTop: 14 }}>{title}</Title>
      </Appear>
      <Appear delay={start + 7} out={end}>
        <Sub style={{ marginTop: 18, maxWidth: 740 }}>{sub}</Sub>
      </Appear>
      <Appear delay={start + 14} out={end} style={{ marginTop: 36 }}>
        {children}
      </Appear>
    </div>
  );
};

const Row: React.FC<{ k: string; v: React.ReactNode; first?: boolean }> = ({ k, v, first }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderTop: first ? "none" : `1px solid ${C.cardLine}`,
      fontSize: 23,
    }}
  >
    <span style={{ color: C.mut }}>{k}</span>
    <span style={{ fontWeight: 650 as React.CSSProperties["fontWeight"] }}>{v}</span>
  </div>
);

const CheckLine: React.FC<{ at: number; label: string; score?: string; bar?: number }> = ({ at, label, score, bar }) => {
  const p = useProgress(at, 16);
  return (
    <div style={{ padding: "9px 0", opacity: 0.2 + 0.8 * p }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 23 }}>
        <Check size={28} color={p > 0.9 ? "#22c55e" : "#3a3a3a"} />
        <span style={{ flex: 1 }}>{label}</span>
        {score && <span style={{ color: C.ok, fontWeight: 700, opacity: p }}>{score}</span>}
      </div>
      {bar !== undefined && (
        <div style={{ marginLeft: 42, marginTop: 7, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
          <div style={{ width: `${bar * p * 100}%`, height: "100%", borderRadius: 3, background: "#22c55e" }} />
        </div>
      )}
    </div>
  );
};

const AiScan: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const scan = interpolate(f, [at, at + 50], [0, 1], clamp);
  const boxes = useProgress(at + 30, 14);
  return (
    <div style={{ position: "relative", width: 210, height: 378, borderRadius: 14, overflow: "hidden", flex: "none" }}>
      <Img src={staticFile("ugc_still.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {scan < 1 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${scan * 100}%`,
            height: 3,
            background: C.purple,
            boxShadow: `0 0 18px 6px rgba(168,116,246,0.7)`,
          }}
        />
      )}
      {[
        { l: 52, t: 30, w: 110, h: 120, label: "REACTION · 94%" },
        { l: 150, t: 115, w: 52, h: 85, label: "WHISKAS · 96%" },
        { l: 8, t: 240, w: 140, h: 130, label: "CAT · 99%" },
      ].map((b) => (
        <div
          key={b.label}
          style={{
            position: "absolute",
            left: b.l,
            top: b.t,
            width: b.w,
            height: b.h,
            border: "2px solid #4ade80",
            borderRadius: 6,
            opacity: boxes,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -2,
              left: -2,
              background: "#4ade80",
              color: "#052e12",
              fontSize: 11,
              fontWeight: 800,
              padding: "2px 5px",
              whiteSpace: "nowrap",
              borderRadius: 3,
            }}
          >
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const MatchRing: React.FC<{ at: number }> = ({ at }) => {
  const p = useProgress(at, 40);
  const pct = Math.round(97 * p);
  const r = 58;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 150, height: 150 }}>
      <svg width={150} height={150}>
        <circle cx={75} cy={75} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={10} fill="none" />
        <circle
          cx={75}
          cy={75}
          r={r}
          stroke="#4ade80"
          strokeWidth={10}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - 0.97 * p)}
          strokeLinecap="round"
          transform="rotate(-90 75 75)"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.ok }}>{pct}%</div>
        <div style={{ fontSize: 13, color: C.mut }}>match</div>
      </div>
    </div>
  );
};

const Thumb: React.FC<{ label: string; ig?: boolean }> = ({ label, ig }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ width: 150, height: 250, borderRadius: 14, overflow: "hidden", position: "relative", border: ig ? "3px solid #e1306c" : "3px solid #25d366" }}>
      <Img src={staticFile("ugc_still.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <div style={{ fontSize: 15, color: C.mut, marginTop: 10, letterSpacing: "0.06em", fontWeight: 700 }}>{label}</div>
  </div>
);

const S = (i: number) => i * STEP;

export const Journey: React.FC = () => {
  return (
    <Scene dur={JOURNEY} glowX="77%" glowY="50%">
      <div style={{ position: "absolute", left: 150, top: 90 }}>
        <Progress />
      </div>
      <div style={{ position: "absolute", left: 150, top: 200 }}>
        <Panel
          i={0}
          eyebrow="Step 1 · Invite"
          title="One WhatsApp invite."
          sub="The matched cohort gets a one-tap invite from Whiskas’ verified business number."
        >
          <Card style={{ width: 720 }}>
            <CardLabel>Campaign setup</CardLabel>
            <Row first k="Audience" v="Cat parents · sampled before" />
            <Row k="Channel" v="WhatsApp (+ web link)" />
            <Row k="Ask" v="One on-brief UGC video" />
            <Row k="Reward" v="Free Whiskas Wet pouch" />
          </Card>
        </Panel>
        <Panel
          i={1}
          eyebrow="Step 2 · Verify handle"
          title="Instagram handle, verified."
          sub="FreeStand checks the account is real and public — before any content is made."
        >
          <Card style={{ width: 720 }}>
            <CardLabel>UGC AI · handle check</CardLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
              <div style={{ width: 58, height: 58, borderRadius: 29, background: "linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)", padding: 3 }}>
                <Img src={staticFile("dash/q12_0.jpg")} style={{ width: "100%", height: "100%", borderRadius: 29, objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>@ananya.and.ginger</div>
                <div style={{ fontSize: 17, color: C.mut }}>1,240 followers · 86 posts</div>
              </div>
            </div>
            <CheckLine at={S(1) + 30} label="Account exists" />
            <CheckLine at={S(1) + 42} label="Profile is public" />
            <CheckLine at={S(1) + 54} label="Not a duplicate entry" />
          </Card>
        </Panel>
        <Panel
          i={2}
          eyebrow="Step 3 · Share the brief"
          title="Brand guidelines, in chat."
          sub="The Whiskas brief arrives as a checklist. Not ready? We nudge them again in 24 hours."
        >
          <Card style={{ width: 720 }}>
            <CardLabel>Flow · branches on reply</CardLabel>
            <Row first k="“Ready now”" v="→ ask for the video in chat" />
            <Row k="“Need more time”" v="→ reminder in 24 hrs" />
            <Row k="No reply" v="→ auto follow-up, then close" />
          </Card>
        </Panel>
        <Panel
          i={3}
          eyebrow="Step 4 · AI checks the video"
          title="AI checks every video."
          sub="Every upload is scored against the Whiskas brief before anything goes public."
        >
          <Card style={{ width: 760, display: "flex", gap: 28 }}>
            <AiScan at={S(3) + 16} />
            <div style={{ flex: 1 }}>
              <CardLabel>Scored against brief</CardLabel>
              <CheckLine at={S(3) + 40} label="Cat in frame" score="99%" bar={0.99} />
              <CheckLine at={S(3) + 50} label="Whiskas pack visible" score="96%" bar={0.96} />
              <CheckLine at={S(3) + 60} label="Genuine reaction" score="94%" bar={0.94} />
              <CheckLine at={S(3) + 70} label="Nothing off-brand" score="Pass" bar={1} />
              <Appear delay={S(3) + 82} y={8}>
                <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(74,222,128,0.12)", color: C.ok, fontWeight: 700, fontSize: 21 }}>
                  ✓ Approved · ask to post
                </div>
              </Appear>
            </div>
          </Card>
        </Panel>
        <Panel
          i={4}
          eyebrow="Step 5 · Post & match"
          title="Posted. Then matched."
          sub="The public Instagram post is matched to the video sent in chat — same cat, same content."
        >
          <Card style={{ width: 760 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Thumb label="CHAT UPLOAD" />
              <MatchRing at={S(4) + 30} />
              <Thumb label="INSTAGRAM POST" ig />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              {["Cat in both", "@whiskasindia tagged", "#MyFussyCatAd", "Public post"].map((t, k) => (
                <Appear key={t} delay={S(4) + 50 + k * 6} y={6}>
                  <span style={{ fontSize: 17, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: "rgba(74,222,128,0.12)", color: C.ok }}>
                    ✓ {t}
                  </span>
                </Appear>
              ))}
            </div>
          </Card>
        </Panel>
        <Panel
          i={5}
          eyebrow="Step 6 · Reward"
          title="Verified UGC, rewarded."
          sub="Approved entries unlock the reward automatically. Rejected ones are told why — and how to fix it."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 720 }}>
            <Card style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 26px" }}>
              <span style={{ fontSize: 34 }}>🎁</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>Free Whiskas Wet pouch unlocked</div>
                <div style={{ fontSize: 18, color: C.mut }}>Shipped automatically · zero manual review</div>
              </div>
            </Card>
            <Card style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 26px" }}>
              <span style={{ fontSize: 34 }}>↩︎</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>No cat? Stock photo? Wrong link?</div>
                <div style={{ fontSize: 18, color: C.mut }}>Bot explains the reason and asks for a re-upload</div>
              </div>
            </Card>
          </div>
        </Panel>
      </div>

      <div style={{ position: "absolute", right: 200, top: 60 }}>
        <PhoneFrame>
          <WaHeader />
          <ChatBody>
            <Msg at={6} time="7:12 PM" pad={false}>
              <ChatImage src="ad_thumb.png" h={150} />
              <div style={{ padding: "8px 10px 0" }}>
                🐱 Is your cat a fussy eater? Make a <b>#MyFussyCatAd</b> for Whiskas and get a <b>FREE Whiskas Wet pouch!</b>
              </div>
            </Msg>
            <QuickReply at={14} tapAt={50}>
              Yes, I’m in! 🙌
            </QuickReply>
            <QuickReply at={18}>Maybe later</QuickReply>
            <Msg at={58} out time="7:13 PM">
              Yes, I’m in! 🙌
            </Msg>
            <Msg at={S(1) + 4} time="7:13 PM">
              Awesome! 🐾 Share your Instagram handle so we can verify it.
            </Msg>
            <Msg at={S(1) + 26} out time="7:14 PM">
              @ananya.and.ginger
            </Msg>
            <Msg at={S(1) + 64} time="7:14 PM">
              ✅ <b>Handle verified</b> — public profile found
            </Msg>
            <Msg at={S(2) + 6} time="7:15 PM">
              📋 <b>The Whiskas brief</b>
              <br />
              1. Your cat, clearly in frame 🐱
              <br />
              2. Whiskas pack visible
              <br />
              3. A genuine fussy-cat reaction
              <br />
              4. Keep it 15–30 sec ⏱
            </Msg>
            <QuickReply at={S(2) + 16} tapAt={S(2) + 50}>
              Ready now 🎬
            </QuickReply>
            <QuickReply at={S(2) + 18}>Need more time ⏳</QuickReply>
            <Msg at={S(2) + 58} out time="7:18 PM">
              Ready now 🎬
            </Msg>
            <Msg at={S(2) + 72} time="7:19 PM">
              Send your video right here in chat 👇
            </Msg>
            <Msg at={S(2) + 96} out time="7:20 PM" pad={false} width={240}>
              <ChatImage src="ugc_still.png" h={300} />
            </Msg>
            <Msg at={S(3) + 8} time="7:20 PM">
              ⏳ Checking your video against the brief…
            </Msg>
            <Msg at={S(3) + 86} time="7:21 PM">
              Purr-fect! ✅ Your video <b>passed the brief</b>.
              <br />
              Now post it on Instagram — tag <b>@whiskasindia</b>, use <b>#MyFussyCatAd</b> — and send us the link.
            </Msg>
            <Msg at={S(4) + 10} out time="7:24 PM">
              <div style={{ display: "flex", gap: 10, background: "rgba(0,0,0,0.05)", borderRadius: 8, padding: 6, marginBottom: 6 }}>
                <Img src={staticFile("ugc_still.png")} style={{ width: 44, height: 56, objectFit: "cover", borderRadius: 4 }} />
                <div style={{ fontSize: 14 }}>
                  <b>Instagram · @ananya.and.ginger</b>
                  <br />
                  Reel · #MyFussyCatAd
                </div>
              </div>
              <span style={{ color: "#027eb5" }}>instagram.com/reel/C8mG1ng3r</span>
            </Msg>
            <Msg at={S(4) + 74} time="7:24 PM">
              🔍 <b>Post matched</b> to your chat video
            </Msg>
            <Msg at={S(5) + 10} time="7:25 PM">
              🎉 <b>Verified!</b> Thanks for being a Whiskas star.
              <div
                style={{
                  marginTop: 8,
                  border: "2px dashed #b265c9",
                  borderRadius: 10,
                  padding: "10px 12px",
                  textAlign: "center",
                  color: "#6d2a8c",
                  fontWeight: 800,
                }}
              >
                FREE WHISKAS WET POUCH
                <div style={{ fontWeight: 500, fontSize: 13, color: "#555" }}>Ships to your saved address in 3–5 days</div>
              </div>
            </Msg>
          </ChatBody>
          <WaInput />
        </PhoneFrame>
      </div>
    </Scene>
  );
};
