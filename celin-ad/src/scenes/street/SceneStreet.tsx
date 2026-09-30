import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COPY, HORIZON_Y, TIMING} from '../../config';
import {FONT} from '../../fonts';
import {desaturate, mix, rgba, shade} from '../../lib/color';
import {EASE, springAt, tween} from '../../lib/motion';
import {C} from '../../theme';
import {BlisterStrip, stripCells, Tablet} from '../../components/Blister';
import {ParticleLayer} from './Particles';
import {Outfit, Person, Tone} from './Person';
import {Build, Joints, solve, torsoPoint} from './rig';
import {makeCol, StreetBackground} from './StreetBackground';
import {
  ACTORS,
  child as childPerf,
  contactFrame,
  mother as motherPerf,
  olderMan as olderPerf,
  Performance,
  toScreen,
  travel,
  wipeMask,
  wipeX,
  woman as womanPerf,
  youngMan as youngPerf,
} from './cast';

const makeTone = (m: number): Tone => (c) => {
  if (m <= 0.001 || c === C.orange) return c;
  const smog = mix(desaturate(shade(c, -0.12), 0.8), '#5A5853', 0.3);
  return mix(c, smog, m);
};

type Placed = {B: Build; j: Joints; outfit: Outfit; x: number; y: number; facing: 1 | -1; perf: Performance};

const Figure: React.FC<{p: Placed; tone: Tone; part?: 'all' | 'body' | 'nearArm'}> = ({p, tone, part = 'all'}) => (
  <g transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${p.facing} 1)`}>
    <Person B={p.B} j={p.j} outfit={p.outfit} tone={tone} part={part} extras={{mufflerUp: p.perf.mufflerUp, sway: p.perf.sway, fist: p.perf.fist}} />
  </g>
);

const Shadow: React.FC<{p: Placed; opacity: number}> = ({p, opacity}) => (
  <ellipse cx={p.x} cy={p.y - 2} rx={p.B.H * 0.13} ry={p.B.H * 0.02} fill={C.slateDeep} opacity={opacity} />
);

type LayerProps = {
  frame: number;
  m: number;
  smog: number;
  warm: number;
  scroll: number;
  cast: Placed[];
  showWoman: boolean;
  id: string;
  hazeFront: number;
};

/** One complete rendering of the street in a given mood. */
const StreetLayer: React.FC<LayerProps> = ({frame, m, smog, warm, scroll, cast, showWoman, id, hazeFront}) => {
  const col = makeCol(m);
  const tone = makeTone(m);
  const [young, older, mom, kid, woman] = cast;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <StreetBackground col={col} scroll={scroll} smog={smog} warm={warm} idSuffix={id} frame={frame} />
      {smog > 0.001 ? (
        <>
          <ParticleLayer layer={0} frame={frame} scroll={scroll} opacity={smog} idSuffix={id} />
          <ParticleLayer layer={1} frame={frame} scroll={scroll} opacity={smog} idSuffix={id} />
        </>
      ) : null}
      {[young, older, mom, kid, ...(showWoman ? [woman] : [])].map((p) => (
        <Shadow key={p.outfit.top + p.x} p={p} opacity={0.16 + 0.14 * m} />
      ))}
      <Figure p={older} tone={tone} />
      <Figure p={young} tone={tone} />
      <Figure p={mom} tone={tone} part="body" />
      <Figure p={kid} tone={tone} />
      <Figure p={mom} tone={tone} part="nearArm" />
      {showWoman ? <Figure p={woman} tone={makeTone(m * 0.45)} /> : null}
      {smog > 0.001 ? (
        <>
          <rect x={0} y={0} width={1080} height={1920} fill="#9A8F7F" opacity={hazeFront} />
          <ParticleLayer layer={2} frame={frame} scroll={scroll} opacity={smog} blur={3.5} idSuffix={id} />
        </>
      ) : null}
    </svg>
  );
};

/** Chest point of a placed figure in screen space. */
const chestOf = (p: Placed) => toScreen(p, torsoPoint(p.B, p.j, 0.1, 0.19));

const HAND_STRIP = {width: 98, rotate: -6};
const POP_CELLS = [1, 2, 3];

/** Scene 3 overlay: the strip, the tablets and their arrival. */
const CelinMoment: React.FC<{frame: number; woman: Placed; targets: Placed[]}> = ({frame, woman, targets}) => {
  if (frame < TIMING.scene3) return null;
  const hand = toScreen(woman, woman.j.nearArm.end);
  const stripPos = {x: hand.x + HAND_STRIP.width / 2 - 12, y: hand.y - 2};
  const {cells} = stripCells(HAND_STRIP.width);
  const rot = (HAND_STRIP.rotate * Math.PI) / 180;
  const cellScreen = (i: number) => ({
    x: stripPos.x + cells[i].x * Math.cos(rot) - cells[i].y * Math.sin(rot),
    y: stripPos.y + cells[i].x * Math.sin(rot) + cells[i].y * Math.cos(rot),
  });
  const empty = POP_CELLS.filter((_, i) => frame >= TIMING.tabletPop[i]);
  const stripIn = tween(frame, TIMING.scene3, TIMING.scene3 + 8, [0, 1], EASE.out);

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="contactGlow">
          <stop offset="0" stopColor={C.orange} stopOpacity={0.55} />
          <stop offset="0.5" stopColor={C.orange} stopOpacity={0.18} />
          <stop offset="1" stopColor={C.orange} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g opacity={stripIn}>
        <BlisterStrip x={stripPos.x} y={stripPos.y} width={HAND_STRIP.width} rotate={HAND_STRIP.rotate} empty={empty} idSuffix="hand" />
      </g>
      {POP_CELLS.map((cell, i) => {
        const pop = TIMING.tabletPop[i];
        const hit = contactFrame(i);
        if (frame < pop) return null;
        const start = cellScreen(cell);
        const lifted = {x: start.x + 6, y: start.y - 40};
        const p = springAt(frame, pop, 30, {damping: 12, stiffness: 140, mass: 0.6});
        const scale = 0.35 + 0.65 * p;
        const target = chestOf(targets[i]);
        const pathAt = (t: number) => {
          const ctrl = {x: (lifted.x + target.x) / 2, y: Math.min(lifted.y, target.y) - 150 - Math.abs(target.x - lifted.x) * 0.12};
          const u = 1 - t;
          return {x: u * u * lifted.x + 2 * u * t * ctrl.x + t * t * target.x, y: u * u * lifted.y + 2 * u * t * ctrl.y + t * t * target.y};
        };
        const travelT = (fr: number) => tween(fr, pop + 7, hit, [0, 1], EASE.inOut);
        const riseT = tween(frame, pop, pop + 7, [0, 1], EASE.out);
        const pos = (fr: number) => {
          const t = travelT(fr);
          if (t <= 0) {
            const rt = tween(fr, pop, pop + 7, [0, 1], EASE.out);
            return {x: start.x + (lifted.x - start.x) * rt, y: start.y + (lifted.y - start.y) * rt};
          }
          return pathAt(t);
        };
        const cur = pos(frame);
        const arrived = frame >= hit;
        const absorb = tween(frame, hit, hit + 5, [1, 0], EASE.in);
        const ring = tween(frame, hit, hit + 20, [0, 1], EASE.out);
        const glow = tween(frame, hit, hit + 10, [0, 1], EASE.out) * tween(frame, hit + 10, hit + 40, [1, 0.45], EASE.inOut);
        const r = 12 * scale;
        return (
          <g key={i}>
            {arrived ? (
              <>
                <circle cx={target.x} cy={target.y} r={150} fill="url(#contactGlow)" opacity={glow} style={{mixBlendMode: 'screen'}} />
                <circle cx={target.x} cy={target.y} r={14 + 90 * ring} fill="none" stroke={C.orange} strokeWidth={3.5 * (1 - ring) + 0.5} opacity={0.85 * (1 - ring)} />
              </>
            ) : null}
            {!arrived && riseT > 0.5
              ? [4.5, 3, 1.5].map((d, k) => {
                  const g = pos(frame - d);
                  return <circle key={k} cx={g.x} cy={g.y} r={r * (0.55 + k * 0.12)} fill={C.orange} opacity={0.08 + k * 0.07} />;
                })
              : null}
            {absorb > 0.01 ? <Tablet x={cur.x} y={cur.y} r={r * absorb} idSuffix={`fly-${i}`} /> : null}
          </g>
        );
      })}
    </svg>
  );
};

/** The orange dawn that rises from the bottom of the frame after contact. */
const Dawn: React.FC<{frame: number}> = ({frame}) => {
  const p = tween(frame, TIMING.dawn.start, TIMING.dawn.end, [0, 1], EASE.inOut);
  if (p <= 0.001) return null;
  const cy = 2480 - 700 * p;
  const r = 760 + 560 * p;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id="dawn" cx={540} cy={cy} r={r} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.orange} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={C.orange} stopOpacity={0.55} />
          <stop offset="0.75" stopColor="#F59A5B" stopOpacity={0.16} />
          <stop offset="1" stopColor="#F59A5B" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#dawn)" opacity={0.85 * p} />
    </svg>
  );
};

const StreetText: React.FC<{frame: number}> = ({frame}) => {
  const {in: tin, out} = TIMING.streetText;
  return (
    <div style={{position: 'absolute', left: 0, top: 1634, width: 1080, textAlign: 'center', fontFamily: FONT}}>
      {COPY.street.map((line, i) => {
        const s = tin + i * 8;
        const o = tween(frame, s, s + 18, [0, 1], EASE.out) * tween(frame, out + i * 3, out + i * 3 + 12, [1, 0], EASE.inOut);
        const y = (1 - tween(frame, s, s + 24, [0, 1], EASE.out)) * 26;
        return (
          <div
            key={line}
            style={{
              fontSize: 84,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
              color: C.offWhite,
              opacity: o,
              transform: `translateY(${y}px)`,
              textShadow: `0 2px 28px ${rgba(C.slateDeep, 0.35)}`,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

/** Scenes 2 and 3, frames 150 to 390: "The city" and "Celin". */
export const SceneStreet: React.FC = () => {
  const frame = useCurrentFrame() + TIMING.street.start - TIMING.crossfade / 2;
  const f = frame;
  const {scroll} = travel(f);

  const place = (A: (typeof ACTORS)[keyof typeof ACTORS], perf: Performance, j?: Joints): Placed => ({
    B: A.B,
    j: j ?? solve(A.B, perf.pose),
    outfit: A.outfit as Outfit,
    x: perf.x,
    y: perf.y,
    facing: A.facing,
    perf,
  });
  const kid = childPerf(f);
  const young = place(ACTORS.youngMan, youngPerf(f));
  const older = place(ACTORS.olderMan, olderPerf(f));
  const kidP = place(ACTORS.child, kid, kid.joints);
  const mom = place(ACTORS.mother, motherPerf(f, kid.joints, {x: kid.x, y: kid.y}));
  const wmn = place(ACTORS.woman, womanPerf(f));
  const cast = [young, older, mom, kidP, wmn];

  const wx = wipeX(f);
  const warmOn = f < TIMING.wipe.end + 1;
  const smogOn = f >= TIMING.wipe.start;
  const dawn = tween(f, TIMING.dawn.start, TIMING.dawn.end, [0, 1], EASE.inOut);
  const mSmog = 1 - 0.42 * dawn;
  const showWoman = f >= TIMING.scene3;
  const feather = 46;
  const mask = wipeMask(wx, feather);
  const wipeOn = f >= TIMING.wipe.start && f <= TIMING.wipe.end;
  const zoom = tween(f, TIMING.street.start, TIMING.endCard, [1, 1.03], EASE.inOutSoft);

  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `540px ${HORIZON_Y}px`}}>
        {warmOn ? (
          <StreetLayer frame={f} m={0} smog={0} warm={1} scroll={scroll} cast={cast} showWoman={false} id="warm" hazeFront={0} />
        ) : null}
        {smogOn ? (
          <AbsoluteFill style={f < TIMING.wipe.end ? {maskImage: mask, WebkitMaskImage: mask} : undefined}>
            <StreetLayer
              frame={f}
              m={mSmog}
              smog={1 - 0.35 * dawn}
              warm={0}
              scroll={scroll}
              cast={cast}
              showWoman={showWoman}
              id="smog"
              hazeFront={0.16 * (1 - 0.7 * dawn)}
            />
          </AbsoluteFill>
        ) : null}
        {wipeOn ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: wx - 1,
              width: 2,
              height: 1920,
              background: rgba(C.offWhite, 0.55),
              boxShadow: `0 0 24px 6px ${rgba(C.offWhite, 0.18)}`,
            }}
          />
        ) : null}
        <CelinMoment frame={f} woman={wmn} targets={[young, older, mom]} />
      </AbsoluteFill>
      <Dawn frame={f} />
      <StreetText frame={f} />
    </AbsoluteFill>
  );
};
