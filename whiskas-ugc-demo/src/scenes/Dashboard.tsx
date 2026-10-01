import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Appear, C, clamp, CountUp, Eyebrow, GradText, Scene, Title, useProgress } from "../ui";

/*
 * Recreation of the Whiskas "Fussy Cat — UGC Review" dashboard the brand
 * received. Counts are the campaign's real numbers; names are shortened and
 * handles masked so no participant is identifiable in the demo.
 */

const PURPLE = "#16265b";
const QUAL = [
  { id: 2, name: "Rubina K.", handle: "@purrs_of_••••", likes: 15, cap: "“Pogo doesn’t eat food… he reviews it first!”" },
  { id: 0, name: "Deepak", handle: "@yash_••••", likes: 7, cap: "No caption written" },
  { id: 3, name: "Pawan C.", handle: "@pawan.••••", likes: 6, cap: "#MyFussyCatAd" },
  { id: 12, name: "Gagan P.", handle: "@cozm••••", likes: 0, cap: "#MyFussyCatAd" },
  { id: 1, name: "Shilpa B.", handle: "@chee••••", likes: 35, cap: "#myfussycatad meow!!" },
  { id: 13, name: "Anjali S.", handle: "@its_dev••••", likes: 14, cap: "Cutie 🥰 #Cat #babygirl" },
  { id: 11, name: "Shreyas", handle: "@gamb••••", likes: 1, cap: "#myfussycatad" },
  { id: 6, name: "Prathamesh", handle: "@vrus_••••", likes: 1, cap: "#myfussycatad cute cats" },
  { id: 5, name: "Mayur", handle: "@mayur••••", likes: 6, cap: "#myfussycatad" },
  { id: 9, name: "Diptimayee", handle: "@dipti••••", likes: 4, cap: "#MyFussyCatAD" },
];

const DISQ = [
  { img: "d8.jpg", name: "Akmal B.", badge: "No cat", meta: "A dog — not a cat in sight", kind: "bad" },
  { img: "d5.jpg", name: "Gaurav K.", badge: "Stock image", meta: "Looks like a stock photo, not their own cat", kind: "bad" },
  { img: "d7.jpg", name: "Dinesh", badge: "Stock image", meta: "Found online — not their own cat", kind: "bad" },
  { img: "d10.jpg", name: "Atif", badge: "Graphic / listing", meta: "A ‘for sale’ graphic, not a real photo", kind: "warn" },
];

const TABS = [
  { t: "Instagram submissions", c: 196 },
  { t: "No Instagram link", c: 619 },
  { t: "Disqualified", c: 20 },
  { t: "Invalid links", c: 70 },
];

const Badge: React.FC<{ kind: "ok" | "bad" | "warn" | "mut"; children: React.ReactNode }> = ({ kind, children }) => {
  const m = {
    ok: ["#ecfdf3", "#15803d"],
    bad: ["#fef2f2", "#b91c1c"],
    warn: ["#fffbeb", "#92400e"],
    mut: ["#efedf2", "#6b7280"],
  }[kind];
  return (
    <span style={{ fontSize: 13, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: m[0], color: m[1], whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
};

const Frame: React.FC<{ src: string; label: string; ig?: boolean }> = ({ src, label, ig }) => (
  <div style={{ flex: 1 }}>
    <div style={{ aspectRatio: "1/1", borderRadius: 10, overflow: "hidden", background: "#f1eef4" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "#6b7280", marginTop: 6 }}>
      {ig ? "◎ INSTAGRAM POST" : "💬 CHAT UPLOAD"}
      {label}
    </div>
  </div>
);

const QualCard: React.FC<{ q: (typeof QUAL)[number]; at: number; highlight?: number }> = ({ q, at, highlight = 0 }) => {
  const p = useProgress(at, 14);
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${highlight > 0 ? "#7c3aed" : "#e5e7eb"}`,
        boxShadow: highlight > 0 ? `0 0 0 ${4 * highlight}px rgba(124,58,237,0.25), 0 20px 50px rgba(0,0,0,${0.25 * highlight})` : "none",
        borderRadius: 14,
        padding: 13,
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: "#edf1f8", color: PURPLE, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ●
        </div>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#111827" }}>{q.name}</div>
        <div style={{ fontSize: 10.5, color: "#6b7280" }}>Batch 1 · 24 Aug</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Frame src={`dash/q${q.id}_0.jpg`} label="" />
        <Frame src={`dash/q${q.id}_1.jpg`} label="" ig />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Badge kind="ok">✓ Match · 100%</Badge>
        <Badge kind="ok">✓ Cat in chat</Badge>
        <Badge kind="ok">✓ Cat in post</Badge>
      </div>
      <div style={{ fontSize: 12.5, color: "#6b7280" }}>
        {q.handle} · {q.likes} likes
      </div>
      <div style={{ fontSize: 13, color: "#374151", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.cap}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10, background: "#ecfdf3" }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, background: "#15803d", color: "#fff", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.07em", color: "#15803d" }}>QUALIFIED</div>
          <div style={{ fontSize: 12, color: "#2c5a3c" }}>Post matches and shows a cat</div>
        </div>
      </div>
    </div>
  );
};

const DisqCard: React.FC<{ d: (typeof DISQ)[number]; at: number }> = ({ d, at }) => {
  const p = useProgress(at, 14);
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 13,
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: "#edf1f8", color: PURPLE, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>●</div>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#111827" }}>{d.name}</div>
        <div style={{ fontSize: 10.5, color: "#6b7280" }}>Batch 1 · 24 Aug</div>
      </div>
      <div style={{ aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", position: "relative" }}>
        <Img src={staticFile(`dash/${d.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(36,22,38,.72)", color: "#fff", fontSize: 10, letterSpacing: ".06em", padding: "2px 7px", borderRadius: 999 }}>
          CHAT UPLOAD
        </div>
      </div>
      <div>
        <Badge kind={d.kind as "bad" | "warn"}>✕ {d.badge}</Badge>
      </div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{d.meta}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10, background: "#fef2f2" }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, background: "#b91c1c", color: "#fff", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.07em", color: "#b91c1c" }}>DISQUALIFY</div>
          <div style={{ fontSize: 12, color: "#7f1d1d" }}>Not a real cat photo — ask them to re-upload</div>
        </div>
      </div>
    </div>
  );
};

const DashShell: React.FC<{ tab: number; children: React.ReactNode; chips: React.ReactNode; heading: string; lead: string }> = ({
  tab,
  children,
  chips,
  heading,
  lead,
}) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      borderRadius: 18,
      overflow: "hidden",
      background: "#fff",
      fontFamily: "inherit",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 40px 140px rgba(120,60,200,0.35)",
    }}
  >
    <div style={{ height: 44, background: "#efeef2", display: "flex", alignItems: "center", gap: 9, padding: "0 16px", flex: "none" }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
      ))}
      <div style={{ marginLeft: 16, flex: 1, height: 26, borderRadius: 7, background: "#fff", display: "flex", alignItems: "center", padding: "0 12px", fontSize: 13, color: "#555" }}>
        🔒 Fussy Cat — UGC Review · FreeStand
      </div>
    </div>
    <div style={{ display: "flex", gap: 2, padding: "4px 24px 0", borderBottom: "1px solid #e5e7eb", flex: "none" }}>
      {TABS.map((t, i) => (
        <div
          key={t.t}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 13px",
            fontSize: 14,
            fontWeight: 600,
            color: i === tab ? PURPLE : "#6b7280",
            borderBottom: `2px solid ${i === tab ? PURPLE : "transparent"}`,
          }}
        >
          {t.t}
          <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 999, background: i === tab ? "#edf1f8" : "#f3f4f6" }}>{t.c}</span>
        </div>
      ))}
    </div>
    <div style={{ padding: "18px 24px", flex: 1, overflow: "hidden" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{heading}</div>
      <div style={{ fontSize: 13.5, color: "#6b7280", margin: "4px 0 14px" }}>{lead}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 14px", fontSize: 14, color: "#9ca3af" }}>Search a name…</div>
        <div style={{ border: `1px solid ${PURPLE}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, fontWeight: 600, color: PURPLE }}>All batches ▾</div>
        {chips}
      </div>
      {children}
    </div>
  </div>
);

const Chip: React.FC<{ on?: boolean; children: React.ReactNode }> = ({ on, children }) => (
  <div
    style={{
      border: `1px solid ${PURPLE}`,
      background: on ? PURPLE : "#fff",
      color: on ? "#fff" : PURPLE,
      borderRadius: 8,
      padding: "7px 13px",
      fontSize: 13,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

const Callout: React.FC<{ at: number; x: number; y: number; children: React.ReactNode }> = ({ at, x, y, children }) => {
  const p = useProgress(at, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: p,
        transform: `translateX(${(1 - p) * 20}px)`,
        background: "rgba(20,16,28,0.94)",
        border: "1px solid rgba(200,140,255,0.45)",
        borderRadius: 14,
        padding: "12px 18px",
        fontSize: 21,
        color: C.text,
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

/* ─────────── 6a. What the brand sees: qualified entries ─────────── */
export const DASH_A = 270;
export const DashboardQualified: React.FC = () => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [130, 175], [0, 1], { ...clamp });
  const s = 1 + 0.32 * zoom;
  return (
    <Scene dur={DASH_A} glowY="60%">
      <div style={{ position: "absolute", left: 150, top: 64, right: 150, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <Appear delay={0}>
            <Eyebrow>What the brand sees</Eyebrow>
          </Appear>
          <Appear delay={4}>
            <Title size={58} style={{ marginTop: 10 }}>
              Every entry, judged by AI. <GradText>In one dashboard.</GradText>
            </Title>
          </Appear>
        </div>
      </div>
      <div style={{ position: "absolute", left: 150, right: 150, top: 220, bottom: 110, overflow: "hidden", borderRadius: 18 }}>
        <Appear delay={8} y={40} style={{ width: "100%", height: "100%" }}>
          <div style={{ width: "100%", height: "100%", transform: `scale(${s})`, transformOrigin: "16% 60%" }}>
            <DashShell
              tab={0}
              heading="Instagram submissions"
              lead="Shared an Instagram link. AI checked the post matches their chat photo and shows a cat."
              chips={
                <>
                  <Chip on>All · 196</Chip>
                  <Chip>Has cat · 181</Chip>
                  <Chip>Does not have cat · 15</Chip>
                </>
              }
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
                {QUAL.slice(0, 10).map((q, i) => (
                  <QualCard key={q.id} q={q} at={18 + i * 5} highlight={i === 0 ? zoom : 0} />
                ))}
              </div>
            </DashShell>
          </div>
        </Appear>
      </div>
      <Callout at={180} x={830} y={360}>
        <span style={{ color: C.ok }}>●</span> Chat upload ↔ Instagram post · <b>100% match</b>
      </Callout>
      <Callout at={194} x={830} y={436}>
        <span style={{ color: C.ok }}>●</span> Cat detected in <b>both</b>
      </Callout>
      <Callout at={208} x={830} y={512}>
        <span style={{ color: C.ok }}>●</span> Handle, likes & caption captured
      </Callout>
      <Callout at={222} x={830} y={588}>
        <span style={{ color: C.ok }}>●</span> Verdict + next action, ready to approve
      </Callout>
    </Scene>
  );
};

/* ─────────── 6b. Rejections + campaign summary ─────────── */
export const DASH_B = 300;

const Funnel: React.FC<{ at: number }> = ({ at }) => {
  const rows = [
    { k: "Cat parents engaged", v: 5866, w: 1, note: "" },
    { k: "Submitted UGC", v: 865, w: 865 / 5866, note: "14.7%" },
    { k: "Verified by UGC AI", v: 865, w: 865 / 5866, note: "100%" },
    { k: "Posted on Instagram", v: 196, w: 196 / 5866, note: "" },
  ];
  return (
    <div>
      {rows.map((r, i) => {
        const p = useProgress(at + i * 10, 20);
        return (
          <div key={r.k} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, marginBottom: 6 }}>
              <span style={{ color: C.mut }}>{r.k}</span>
              <span style={{ fontWeight: 700 }}>
                <CountUp to={r.v} delay={at + i * 10} dur={24} />
                {r.note && <span style={{ color: C.purple, marginLeft: 8, fontWeight: 600 }}>{r.note}</span>}
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ width: `${r.w * p * 100}%`, height: "100%", borderRadius: 5, background: "linear-gradient(90deg,#a874f6,#e46fae)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const DashboardRejected: React.FC = () => {
  const panel = useProgress(120, 22);
  return (
    <Scene dur={DASH_B} glowY="60%">
      <div style={{ position: "absolute", left: 150, top: 64 }}>
        <Appear delay={0}>
          <Eyebrow>Caught automatically</Eyebrow>
        </Appear>
        <Appear delay={4}>
          <Title size={58} style={{ marginTop: 10 }}>
            No cat, no pouch. <GradText>And the brand sees why.</GradText>
          </Title>
        </Appear>
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 220,
          bottom: 110,
          width: 1620 - 560 * panel,
          overflow: "hidden",
          borderRadius: 18,
        }}
      >
        <Appear delay={6} y={30} style={{ width: 1620, height: "100%" }}>
          <DashShell
            tab={2}
            heading="Disqualified"
            lead="Not a real cat photo — stock images, graphics, AI fakes or no cat at all."
            chips={
              <>
                <Chip on>All · 20</Chip>
                <Chip>Stock image</Chip>
                <Chip>Graphic</Chip>
                <Chip>AI / fake</Chip>
              </>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 250px)", gap: 14 }}>
              {DISQ.map((d, i) => (
                <DisqCard key={d.name} d={d} at={18 + i * 8} />
              ))}
            </div>
          </DashShell>
        </Appear>
      </div>
      <div
        style={{
          position: "absolute",
          right: 150,
          top: 220,
          width: 520,
          opacity: panel,
          transform: `translateX(${(1 - panel) * 60}px)`,
        }}
      >
        <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.cardLine}`, borderRadius: 20, padding: "24px 28px" }}>
          <div style={{ fontSize: 18, color: C.mut, fontWeight: 600, marginBottom: 18 }}>
            <span style={{ color: C.purple }}>✦</span> Campaign summary · #MyFussyCatAd
          </div>
          <Funnel at={132} />
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.cardLine}`, borderRadius: 20, padding: "20px 28px", marginTop: 16 }}>
          <div style={{ fontSize: 18, color: C.mut, fontWeight: 600, marginBottom: 12 }}>
            <span style={{ color: C.purple }}>✦</span> One-click next actions
          </div>
          {[
            ["🔔", "Remind 619 to post on Instagram"],
            ["🔗", "Ask 70 for a valid post link"],
            ["↩︎", "Ask 20 to re-upload a real cat"],
            ["✓", "Approve 196 matched posts"],
          ].map(([i, t], k) => (
            <Appear key={t} delay={180 + k * 8} y={8}>
              <div style={{ display: "flex", gap: 12, fontSize: 20, padding: "6px 0" }}>
                <span style={{ width: 26 }}>{i}</span>
                {t}
              </div>
            </Appear>
          ))}
        </div>
      </div>
    </Scene>
  );
};

