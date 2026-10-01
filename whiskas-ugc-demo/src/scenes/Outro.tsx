import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Appear, C, clamp, FreestandLogo, GradText, Scene, Sub, Title, useProgress } from "../ui";

const WALL = [0, 1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13].flatMap((id) => [`dash/q${id}_0.jpg`, `dash/q${id}_1.jpg`]);

/* ─────────── 7. Results ─────────── */
export const RESULTS = 180;
export const Results: React.FC = () => {
  const f = useCurrentFrame();
  const stats = [
    { big: "1 in 7", sm: "cat parents engaged created a UGC", src: "865 of 5,866" },
    { big: "10 in 10", sm: "entries verified by UGC AI — zero manual review", src: "all 865" },
    { big: "1 in 10", sm: "bad entries caught automatically", src: "90 stock, no-cat or bad links" },
    { big: "~1 in 4", sm: "creators also posted publicly on Instagram", src: "196 public posts" },
  ];
  return (
    <Scene dur={RESULTS}>
      <AbsoluteFill style={{ opacity: 0.22, transform: `translateY(${-f * 0.4}px)` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8, filter: "grayscale(0.3)" }}>
          {[...WALL, ...WALL].slice(0, 40).map((s, i) => (
            <Img key={i} src={staticFile(s)} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }} />
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(7,6,10,0.55), rgba(7,6,10,0.95) 75%)" }} />
      <div style={{ position: "absolute", top: 200, width: "100%", textAlign: "center" }}>
        <Appear delay={0}>
          <div style={{ display: "inline-block", fontSize: 18, fontWeight: 600, padding: "6px 16px", borderRadius: 999, background: "rgba(168,116,246,0.2)", color: C.purple }}>
            Whiskas #MyFussyCatAd · results
          </div>
        </Appear>
        <Appear delay={6}>
          <Title size={70} style={{ marginTop: 22 }}>
            No cat, no pouch. <GradText>Every entry checked.</GradText>
          </Title>
        </Appear>
      </div>
      <div style={{ position: "absolute", top: 520, left: 150, right: 150, display: "flex", gap: 24 }}>
        {stats.map((s, i) => (
          <Appear key={s.big} delay={24 + i * 12} style={{ flex: 1 }}>
            <div style={{ background: "rgba(20,16,28,0.75)", border: `1px solid ${C.cardLine}`, borderRadius: 20, padding: "28px 30px", height: 260 }}>
              <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: "-0.04em" }}>{s.big}</div>
              <div style={{ fontSize: 22, color: C.mut, marginTop: 8, lineHeight: 1.35 }}>{s.sm}</div>
              <div style={{ fontSize: 16, color: C.dim, marginTop: 12 }}>{s.src}</div>
            </div>
          </Appear>
        ))}
      </div>
    </Scene>
  );
};

/* ─────────── 8. Same engine, any brand ─────────── */
export const ENGINE = 180;
const BrandCard: React.FC<{ at: number; tag: string; img?: string; emoji?: string; title: string; points: string[]; reward: string }> = ({
  at,
  tag,
  img,
  emoji,
  title,
  points,
  reward,
}) => {
  const p = useProgress(at, 20);
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 22,
        overflow: "hidden",
        background: "#121016",
        border: `1px solid ${C.cardLine}`,
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
      }}
    >
      <div style={{ height: 228, position: "relative", background: "linear-gradient(135deg,#5b1e86,#c2347b 60%,#e2662f)" }}>
        {img ? (
          <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 92, gap: 30 }}>{emoji}</div>
        )}
        <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(30,16,40,0.85)", color: "#fff", padding: "6px 14px", borderRadius: 999, fontSize: 18, fontWeight: 600 }}>
          {tag}
        </div>
      </div>
      <div style={{ padding: "22px 26px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</div>
        {points.map((pt) => (
          <div key={pt} style={{ fontSize: 21, color: C.mut, marginTop: 10, display: "flex", gap: 10 }}>
            <span style={{ color: C.purple }}>✦</span>
            {pt}
          </div>
        ))}
        <div style={{ marginTop: 18, border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.08)", borderRadius: 12, padding: "12px 16px", color: C.ok, fontSize: 20, fontWeight: 700 }}>
          🎁 {reward}
        </div>
      </div>
    </div>
  );
};

export const Engine: React.FC = () => (
  <Scene dur={ENGINE}>
    <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center" }}>
      <Appear delay={0}>
        <Title size={76}>
          Same engine. <GradText>Any brand.</GradText>
        </Title>
      </Appear>
      <Appear delay={8}>
        <Sub style={{ marginTop: 14 }}>Swap the audience, the brief and the reward — the verification stays the same.</Sub>
      </Appear>
    </div>
    <div style={{ position: "absolute", top: 330, left: 150, right: 150, display: "flex", gap: 32 }}>
      <BrandCard at={20} tag="Beauty" img="brand_bebeautiful.png" title="Bebeautiful beauty box" points={["Unboxing reel, all 5 SKUs in frame", "Tag @bebeautiful_india"]} reward="Reward · ₹100 off the next box" />
      <BrandCard at={32} tag="Skincare" img="brand_vaseline.png" title="Vaseline Gluta-Hya" points={["7-day glow diary, tube in hand", "Real skin, no filters"]} reward="Reward · free full-size tube" />
      <BrandCard at={44} tag="Food & beverage" emoji="🍫 🥤 🍜" title="Any snack or drink launch" points={["Taste-test reaction, pack up front", "Brand hashtag on a public post"]} reward="Reward · quick-commerce coupon" />
    </div>
  </Scene>
);

/* ─────────── 9. End card ─────────── */
export const END = 120;
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const words = ["Target.", "Invite.", "Verify.", "Reward."];
  return (
    <Scene dur={END} powered={false}>
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center" }}>
        <Appear delay={0}>
          <Title size={140}>UGC AI</Title>
        </Appear>
        <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 18, fontSize: 40, fontWeight: 600 }}>
          {words.map((w, i) => (
            <span key={w} style={{ opacity: interpolate(f, [10 + i * 8, 22 + i * 8], [0, 1], clamp), color: i === 0 ? C.purple : C.pink }}>
              {w}
            </span>
          ))}
        </div>
        <Appear delay={50}>
          <div style={{ marginTop: 80, fontSize: 18, letterSpacing: "0.2em", color: C.dim, fontWeight: 600 }}>CREATED WITH</div>
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
            <FreestandLogo h={56} />
          </div>
          <div style={{ marginTop: 22, fontSize: 20, color: C.mut }}>konark@freestand.in · sneh@freestand.in</div>
        </Appear>
      </div>
    </Scene>
  );
};
