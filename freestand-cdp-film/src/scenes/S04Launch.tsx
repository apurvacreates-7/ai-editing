import React from 'react';
import {Stage} from '../components/Stage';
import {Card, Obj, paperBg} from '../components/Physical';
import {Eyebrow, Stat, TYPE, Words} from '../components/Type';
import {Pill} from '../components/Props';
import {SpinWheel, WHEEL_SIZE} from '../components/SpinWheel';
import {Sfx} from '../components/Sfx';
import {C, FONT} from '../theme';
import {ease, place, prog, useSF} from '../stop';

// Experience library cards, copy as it appears in the workspace.
const EXPERIENCES = [
  {kind: 'Packtivation', line: 'Cadbury Dairy Milk · Scan, upload, get ₹50 back', channel: 'WhatsApp + receipt OCR', steps: '7 steps · live in 1–2 days'},
  {kind: 'Lottery', line: 'Oreo · Scan for a surprise', channel: 'WhatsApp', steps: '5 steps · live in 1–2 days'},
  {kind: 'Quiz style', line: 'Bournvita · What kind of morning are you?', channel: 'WhatsApp', steps: '5 steps · live in 1 day'},
  {kind: 'Promoter sampling', line: 'Oreo · Try a new twist at the stall', channel: 'Promoter app + WhatsApp', steps: '14 steps · live in 1–2 days'},
];

const CARD_W = 350;
const CARD_H = 206;
const SLOTS = [
  {to: {x: 1040, y: 232, rot: -4}, from: {x: 820, y: -260, rot: -24}},
  {to: {x: 1722, y: 224, rot: 3.5}, from: {x: 2200, y: -200, rot: 28}},
  {to: {x: 1032, y: 916, rot: 2.5}, from: {x: 700, y: 1400, rot: 20}},
  {to: {x: 1730, y: 924, rot: -3}, from: {x: 2250, y: 1350, rot: -26}},
];
const DEAL = [14, 18, 22, 26];

const WHEEL = {x: 1388, y: 574};
const SPIN_START = 34;
const SPIN_DUR = 36;
// clockwise: two full turns, then settle with FREE 5 STAR (segment 3) under the pointer
const SPIN_TOTAL = 720 + (360 - 3 * 45);

const spinAngle = (t: number) => SPIN_TOTAL * ease.out(Math.min(1, Math.max(0, t)));

// Pointer clicks: one each time a peg (segment edge) passes, from the unquantised curve.
export const wheelTicks = () => {
  const out: number[] = [];
  let edge = 22.5;
  for (let i = 0; i <= 2000; i++) {
    const t = i / 2000;
    if (spinAngle(t) >= edge) {
      out.push(SPIN_START + t * SPIN_DUR);
      edge += 45;
    }
  }
  return out;
};

export const S04Launch: React.FC = () => {
  const sf = useSF();
  const wheelIn = place(sf, 4, 6, {x: 2400, y: 520, rot: 40}, {x: WHEEL.x, y: WHEEL.y, rot: -2});
  const t = prog(sf, SPIN_START, SPIN_START + SPIN_DUR);
  const angle = spinAngle(t);
  const vel = SPIN_TOTAL * (3 * Math.pow(1 - t, 2)) / SPIN_DUR; // degrees per stop-frame
  const smear = sf > SPIN_START && t < 1 ? Math.min(1, Math.max(0, (vel - 14) / 40)) : 0;
  const ticket = place(sf, 71, 4, {x: WHEEL.x, y: WHEEL.y + 40, rot: 0}, {x: WHEEL.x + 6, y: WHEEL.y + 322, rot: 3});

  const overlay = (
    <div style={{position: 'absolute', left: 140, top: 150, width: 720}}>
      <Eyebrow n="01" label="Launch" at={2} />
      <Words text={'Launch in days.\n*Not months.*'} at={4} style={{...TYPE.h1, marginTop: 30}} />
      <Words
        text="Start from journeys that already work: sampling, packtivation, contests, quizzes and loyalty."
        at={16}
        per={0.5}
        style={{...TYPE.sub, marginTop: 34, width: 620}}
      />
      <Stat value={17} at={48} dur={8} label="proven journeys, live in 1–2 days" size={150} style={{marginTop: 70}} />
    </div>
  );

  return (
    <Stage seed={404} pool={{x: 1250, y: 560, rx: 1150, ry: 760}} table={{x: 420, y: -60}} overlay={overlay}>
      {sf >= 71 ? (
        <Obj x={ticket.x} y={ticket.y} rot={ticket.rot} lift={ticket.lift} w={330} h={104} seed={470} radius={10} z={1}
          style={{...paperBg('#FFF3CF'), border: `3px dashed ${C.purple}`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 17, fontWeight: 700, letterSpacing: '0.2em', color: C.purple}}>YOU WON</div>
          <div style={{fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', color: C.purpleDeep}}>Free 5 Star</div>
        </Obj>
      ) : null}
      {sf >= 4 ? (
        <Obj x={wheelIn.x} y={wheelIn.y} rot={wheelIn.rot} lift={wheelIn.lift} w={WHEEL_SIZE} h={WHEEL_SIZE} seed={440} radius="50%" z={2}>
          <SpinWheel angle={angle} smear={smear} />
        </Obj>
      ) : null}
      {EXPERIENCES.map((e, i) => {
        const land = DEAL[i];
        if (sf < land - 4) return null;
        const p = place(sf, land - 4, 4, SLOTS[i].from, SLOTS[i].to);
        return (
          <Card key={e.kind} x={p.x} y={p.y} rot={p.rot} lift={p.lift} w={CARD_W} h={CARD_H} seed={410 + i * 3} radius={18} pad="24px 26px" z={3}>
            <div style={{fontFamily: FONT, color: C.uiText, display: 'flex', flexDirection: 'column', height: '100%'}}>
              <div style={{fontSize: 31, fontWeight: 750, letterSpacing: '-0.025em'}}>{e.kind}</div>
              <div style={{fontSize: 19, color: C.uiMute, marginTop: 6, lineHeight: 1.3}}>{e.line}</div>
              <div style={{marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8}}>
                <Pill size={16} bg="#EEF2FA" color={C.navy}>{e.channel}</Pill>
                <span style={{fontSize: 15.5, color: C.uiMute, whiteSpace: 'nowrap'}}>{e.steps}</span>
              </div>
            </div>
          </Card>
        );
      })}

      <Sfx at={5} name="slide" vol={0.45} />
      <Sfx at={10} name="thud" vol={0.55} />
      {DEAL.map((d, i) => (
        <React.Fragment key={i}>
          <Sfx at={d - 4} name="paper" vol={0.3} />
          <Sfx at={d} name="drop" vol={0.7} />
        </React.Fragment>
      ))}
      {wheelTicks().map((at, i) => (
        <Sfx key={`w${i}`} at={at} name="click" vol={0.32 + 0.25 * (i / 22)} />
      ))}
      <Sfx at={71} name="slide" vol={0.35} />
      <Sfx at={75} name="ding" vol={0.55} />
    </Stage>
  );
};

