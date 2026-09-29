import React from 'react';
import {Stage} from '../components/Stage';
import {Card, Obj, paperBg} from '../components/Physical';
import {Eyebrow, TYPE, Words} from '../components/Type';
import {Pill, Sticky} from '../components/Props';
import {IconUsers} from '../components/Icons';
import {LOGO_ICON, LOGO_VIEWBOX} from '../logoPaths';
import {Sfx} from '../components/Sfx';
import {C, FONT} from '../theme';
import {ease, keys, lerp, place, prog, useSF} from '../stop';

// Exports & destinations: Freestand CDP → Mondelēz Lytics → ad and retail media.
// Match rates and "typical" benchmarks as shown in the workspace.
const DEST = [
  {name: 'Meta', sub: 'Custom Audiences', rate: 72, typical: 48},
  {name: 'Google Ads', sub: 'Customer Match', rate: 64, typical: 41},
  {name: 'YouTube · DV360', sub: 'CTV + video', rate: 58, typical: 37},
  {name: 'Amazon Ads', sub: 'Sponsored + DSP', rate: 56, typical: 34},
  {name: 'Blinkit', sub: 'Retail media (CPAS)', rate: 55, typical: 33},
  {name: 'Flipkart Ads', sub: 'Retail media (CPAS)', rate: 49, typical: 30},
];
const TILE = {w: 316, h: 188};
const tilePos = (i: number) => ({x: 1340 + (i % 2) * 342, y: 300 + Math.floor(i / 2) * 250, rot: [-1.5, 2, 1.2, -2.2, -0.8, 1.6][i]});
const DEAL = (i: number) => 8 + i * 2;

const CDP = {x: 330, y: 800};
const LYT = {x: 830, y: 800};
const HOP1 = (i: number) => 22 + i * 2; // CDP → Lytics
const HOP2 = (i: number) => 34 + i * 3; // Lytics → destination

const GiftIcon: React.FC<{h: number; color: string}> = ({h, color}) => {
  const w = (573 / 760) * h;
  return (
    <svg width={w} height={h} viewBox={`0 0 573 ${LOGO_VIEWBOX.h}`}>
      {[LOGO_ICON.bowLid, LOGO_ICON.boxL, LOGO_ICON.boxR].map((p, i) => (
        <path key={i} d={p.d} transform={`translate(${p.tx},${p.ty})`} fill={color} />
      ))}
    </svg>
  );
};

const Token: React.FC<{x: number; y: number; lift: number; seed: number}> = ({x, y, lift, seed}) => (
  <Obj x={x} y={y} w={46} h={46} lift={lift} seed={seed} radius={23} z={6} shadowStrength={0.5}
    style={{...paperBg('#FFFFFF'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.navy}}>
    <IconUsers size={24} stroke={2.4} />
  </Obj>
);

export const S08Data: React.FC = () => {
  const sf = useSF();
  const cdp = place(sf, 3, 5, {x: -300, y: 900, rot: -20}, {...CDP, rot: -1.5});
  const lyt = place(sf, 5, 5, {x: 820, y: 1450, rot: 18}, {...LYT, rot: 1.2});
  const lineP = prog(sf, 14, 20);

  const overlay = (
    <div style={{position: 'absolute', left: 140, top: 130, width: 1000}}>
      <Eyebrow n="04" label="Data" at={2} />
      <Words text={'Consent travels with\n*every profile.*'} at={4} style={{...TYPE.h1, fontSize: 88, marginTop: 28}} />
      <Words
        text="Profiles, traits and cohorts stream to Mondelēz Lytics, then to ad and retail-media platforms, with consent checked at every hop."
        at={14}
        per={0.4}
        style={{...TYPE.sub, fontSize: 30, marginTop: 28, width: 860}}
      />
    </div>
  );

  return (
    <Stage seed={808} pool={{x: 1060, y: 640, rx: 1250, ry: 760}} table={{x: 460, y: 300}} overlay={overlay}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <line
          x1={CDP.x + 190}
          y1={CDP.y}
          x2={CDP.x + 190 + (LYT.x - CDP.x - 380) * lineP}
          y2={LYT.y}
          stroke="#DCD9D1"
          strokeWidth={5}
          strokeDasharray="14 12"
          opacity={lineP > 0 ? 0.9 : 0}
        />
      </svg>

      {sf >= 3 ? (
        <Card x={cdp.x} y={cdp.y} rot={cdp.rot} lift={cdp.lift} w={380} h={230} seed={810} radius={22} pad="28px 30px" z={2}>
          <div style={{fontFamily: FONT, color: C.uiText}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <GiftIcon h={46} color={C.navy} />
              <div style={{fontSize: 30, fontWeight: 760, letterSpacing: '-0.02em'}}>Freestand CDP</div>
            </div>
            <div style={{fontSize: 38, fontWeight: 760, letterSpacing: '-0.03em', marginTop: 26, fontVariantNumeric: 'tabular-nums'}}>1,02,48,317</div>
            <div style={{fontSize: 19, color: C.uiMute, marginTop: 4}}>profiles · 64 living cohorts</div>
          </div>
        </Card>
      ) : null}
      {sf >= 5 ? (
        <Card x={lyt.x} y={lyt.y} rot={lyt.rot} lift={lyt.lift} w={380} h={230} seed={820} radius={22} pad="28px 30px" z={2}>
          <div style={{fontFamily: FONT, color: C.uiText}}>
            <div style={{fontSize: 30, fontWeight: 760, letterSpacing: '-0.02em'}}>Mondelēz Lytics</div>
            <div style={{marginTop: 14}}>
              <Pill size={18}>Streaming</Pill>
            </div>
            <div style={{fontSize: 19, color: C.uiMute, marginTop: 20, lineHeight: 1.4}}>
              3 cohorts streaming
              <br />
              synced 5 min ago
            </div>
          </div>
        </Card>
      ) : null}

      {DEST.map((d, i) => {
        const at = DEAL(i);
        if (sf < at - 3) return null;
        const pos = tilePos(i);
        const p = place(sf, at - 3, 3, {x: pos.x + 700, y: pos.y - 200 + i * 60, rot: 22}, pos);
        const landed = HOP2(i) + 5;
        const fill = sf < landed ? 0 : keys(sf, landed, [0.3, 0.6, 0.85, 1]);
        return (
          <Card key={d.name} x={p.x} y={p.y} rot={p.rot} lift={p.lift} w={TILE.w} h={TILE.h} seed={830 + i * 3} radius={18} pad="22px 24px" z={1}>
            <div style={{fontFamily: FONT, color: C.uiText}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <div style={{fontSize: 25, fontWeight: 760, letterSpacing: '-0.02em'}}>{d.name}</div>
                  <div style={{fontSize: 16, color: C.uiMute, marginTop: 3}}>{d.sub}</div>
                </div>
                {fill >= 1 ? <Pill size={15}>Live</Pill> : null}
              </div>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 20}}>
                <span style={{fontSize: 32, fontWeight: 780, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: fill > 0 ? C.uiText : '#B4BAC6'}}>
                  {fill > 0 ? `${Math.round(d.rate * fill)}%` : '—'}
                </span>
                <span style={{fontSize: 16, color: C.uiMute}}>match · typical {d.typical}%</span>
              </div>
              <div style={{position: 'relative', height: 12, borderRadius: 6, background: '#E9ECF1', marginTop: 12}}>
                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${d.rate * fill}%`, borderRadius: 6, background: i === 0 ? 'linear-gradient(90deg, #6F8FFF, #A993FF, #D38CF2)' : C.navy}} />
                <div style={{position: 'absolute', left: `${d.typical}%`, top: -5, width: 3, height: 22, background: '#8A93A6', borderRadius: 2}} />
              </div>
            </div>
          </Card>
        );
      })}

      {DEST.map((_, i) => {
        const a = HOP1(i);
        const b = HOP2(i);
        if (sf < a) return null;
        const dst = tilePos(i);
        if (sf < b) {
          // hop along the dashed line in stepped strides
          const t = prog(sf, a, a + 6);
          const x = lerp(CDP.x + 150, LYT.x - 150 + i * 18, ease.inOut(t));
          const y = CDP.y + 4 + (i - 2.5) * 6 - Math.sin(t * Math.PI) * 30;
          return <Token key={i} x={x} y={y} lift={t > 0 && t < 1 ? 0.6 : 0} seed={860 + i} />;
        }
        const p = place(sf, b, 5, {x: LYT.x + 110 + i * 10, y: LYT.y - 20}, {x: dst.x - TILE.w / 2 + 34, y: dst.y + 58});
        if (p.t >= 1 && sf > b + 8) return null;
        return <Token key={i} x={p.x} y={p.y - Math.sin(p.t * Math.PI) * 60} lift={p.lift} seed={860 + i} />;
      })}

      {sf >= 64 ? (
        <Sticky {...place(sf, 64, 4, {x: 700, y: 1500, rot: -24}, {x: 1030, y: 604, rot: -5})} seed={890} w={282} h={204} z={7}>
          <div style={{fontSize: 46, lineHeight: 1.0}}>72% vs 48%</div>
          <div style={{fontSize: 28, lineHeight: 1.1, marginTop: 10}}>WhatsApp-verified phones match better on Meta</div>
        </Sticky>
      ) : null}

      <Sfx at={4} name="paper" vol={0.3} />
      <Sfx at={8} name="drop" vol={0.65} />
      <Sfx at={10} name="drop" vol={0.6} />
      {DEST.map((_, i) => (
        <React.Fragment key={i}>
          <Sfx at={DEAL(i)} name="tap" vol={0.4} />
          <Sfx at={HOP2(i) + 5} name="tick" vol={0.4} />
        </React.Fragment>
      ))}
      <Sfx at={14} name="slide" vol={0.3} />
      <Sfx at={64} name="paper" vol={0.35} />
      <Sfx at={68} name="drop" vol={0.5} />
    </Stage>
  );
};
