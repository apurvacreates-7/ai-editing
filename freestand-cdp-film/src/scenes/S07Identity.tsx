import React from 'react';
import {Stage} from '../components/Stage';
import {Card} from '../components/Physical';
import {TYPE, Words} from '../components/Type';
import {Pill, StampMark} from '../components/Props';
import {Sfx} from '../components/Sfx';
import {C, FONT, MONO} from '../theme';
import {ease, keys, place, useSF} from '../stop';

// Identity resolution, MATCH-117 from the workspace: two records of the same
// person, three agents vote, consensus merges them.
const LEFT = {x: 575, y: 470, rot: -4};
const RIGHT = {x: 1345, y: 478, rot: 3.5};
const MERGE_L = {x: 935, y: 470, rot: -2};
const MERGE_R = {x: 985, y: 478, rot: 2.5};

const AGENTS = [
  {name: 'Claude', vendor: 'Anthropic', pct: '93%', x: 640, y: 812, rot: -3},
  {name: 'OpenAI', vendor: 'OpenAI', pct: '90%', x: 960, y: 838, rot: 1.5},
  {name: 'Grok', vendor: 'xAI', pct: '88%', x: 1280, y: 812, rot: 3},
];
const AGENT_AT = [16, 20, 24];

const Record: React.FC<{name: string; source: string; phone: string; extra: string; tag?: React.ReactNode}> = ({
  name,
  source,
  phone,
  extra,
  tag,
}) => (
  <div style={{fontFamily: FONT, color: C.uiText}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{fontSize: 38, fontWeight: 760, letterSpacing: '-0.03em'}}>{name}</div>
      {tag}
    </div>
    <div style={{fontSize: 21, color: C.uiMute, marginTop: 6}}>{source}</div>
    <div style={{borderTop: `2px solid ${C.uiLine}`, margin: '18px 0 14px'}} />
    <div style={{fontFamily: MONO, fontSize: 19, lineHeight: 1.6, color: '#3A4356'}}>
      <div>{phone}</div>
      <div>{extra}</div>
    </div>
  </div>
);

export const S07Identity: React.FC = () => {
  const sf = useSF();
  const inL = place(sf, 3, 5, {x: -420, y: 380, rot: -30}, LEFT);
  const inR = place(sf, 5, 5, {x: 2340, y: 560, rot: 28}, RIGHT);
  // after the vote the two records are slid together into one stack
  const slide = (from: typeof LEFT, to: typeof LEFT) => place(sf, 31, 6, from, to, ease.inOut);
  const l = sf < 31 ? inL : slide(LEFT, MERGE_L);
  const r = sf < 31 ? inR : slide(RIGHT, MERGE_R);
  const merged = sf >= 40;

  const overlay = (
    <>
      <Words
        text="One person. *One profile.*"
        at={2}
        style={{...TYPE.h1, fontSize: 96, position: 'absolute', top: 96, width: '100%', textAlign: 'center'}}
      />
      <Words
        text="97.7% of pairs settle by rule. The rest go to three AI agents, and only consensus merges."
        at={46}
        per={0.5}
        style={{...TYPE.sub, fontSize: 31, position: 'absolute', top: 972, width: '100%', textAlign: 'center'}}
      />
    </>
  );

  return (
    <Stage seed={707} pool={{x: 960, y: 600, rx: 1150, ry: 720}} table={{x: -80, y: -240}} overlay={overlay}>
      {sf >= 3 ? (
        <Card x={l.x} y={l.y} rot={l.rot} lift={l.lift} w={560} h={250} seed={710} radius={22} pad="30px 34px" z={1}>
          <Record name="Priya Nair" source="FS-104213 · Joy Club" phone="Phone verified ••4408" extra="p••••@gmail.com" />
        </Card>
      ) : null}
      {sf >= 5 ? (
        <Card x={r.x} y={r.y} rot={r.rot} lift={r.lift} w={560} h={250} seed={720} radius={22} pad="30px 34px" z={2}>
          <Record
            name="Priya N."
            source="lotusbiscoff.in claim"
            phone="Phone unverified ••4408"
            extra="same hashed email"
            tag={merged ? <StampMark text="Merged" size={28} rot={-8} k={keys(sf, 40, [1.15, 1])} /> : null}
          />
        </Card>
      ) : null}
      {AGENTS.map((a, i) => {
        const at = AGENT_AT[i];
        if (sf < at - 3) return null;
        const p = place(sf, at - 3, 3, {x: a.x + (i - 1) * 120, y: 1420, rot: a.rot * 6}, {x: a.x, y: a.y, rot: a.rot});
        return (
          <Card key={a.name} x={p.x} y={p.y} rot={p.rot} lift={p.lift} w={270} h={150} seed={730 + i * 4} radius={20} pad="22px 26px" z={3}>
            <div style={{fontFamily: FONT, color: C.uiText}}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
                <span style={{fontSize: 28, fontWeight: 760, letterSpacing: '-0.02em'}}>{a.name}</span>
                <span style={{fontSize: 17, color: C.uiMute}}>{a.vendor}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 18}}>
                <Pill size={20}>Merge</Pill>
                <span style={{fontSize: 30, fontWeight: 760, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>{a.pct}</span>
              </div>
            </div>
          </Card>
        );
      })}

      <Sfx at={4} name="paper" vol={0.3} />
      <Sfx at={8} name="drop" vol={0.65} />
      <Sfx at={10} name="drop" vol={0.65} />
      {AGENT_AT.map((t, i) => (
        <Sfx key={i} at={t} name="tap" vol={0.6} />
      ))}
      <Sfx at={31} name="slide" vol={0.5} />
      <Sfx at={40} name="stamp" vol={0.85} />
      <Sfx at={41} name="ding" vol={0.35} />
    </Stage>
  );
};
