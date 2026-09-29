import React from 'react';
import {Img, staticFile} from 'remotion';
import {Stage} from '../components/Stage';
import {Card} from '../components/Physical';
import {Eyebrow, Stat, TYPE, Words} from '../components/Type';
import {Pill, Polaroid} from '../components/Props';
import {IconShield} from '../components/Icons';
import {Sfx} from '../components/Sfx';
import {C, FONT, MONO} from '../theme';
import {keys, place, prog, tw, useSF} from '../stop';

// Meena Shah (FS-000001) is the workspace's reference consumer. Every value on
// her card is taken from the demo: consent, campaigns and partner signals.
const ROWS: {label: string; value: React.ReactNode}[] = [
  {label: 'WhatsApp opt-in', value: <Pill size={19}>Granted</Pill>},
  {label: 'Ads consent', value: <Pill size={19}>Granted</Pill>},
  {label: 'Campaigns', value: '4'},
  {label: 'Chocolate buyer · Blinkit', value: 'Weekly'},
  {label: 'Confectionery spend · Paytm', value: '₹250–500 / mo'},
  {label: 'Evening orders · Blinkit', value: '40–60% after 8 pm'},
];
const ROW_AT = (i: number) => 18 + i * 5;

const CARD = {x: 1545, y: 590, w: 600, h: 700};

export const S06Consumers: React.FC = () => {
  const sf = useSF();
  const photo = place(sf, 4, 5, {x: 760, y: -420, rot: -28}, {x: 1085, y: 372, rot: -6});
  const card = place(sf, 8, 5, {x: 2400, y: 760, rot: 24}, {x: CARD.x, y: CARD.y, rot: 1.8});
  const fill = keys(sf, 50, [0.15, 0.4, 0.62, 0.8, 0.93, 1]);
  const zoom = tw(sf, 0, 96, 1, 1.03);

  const overlay = (
    <div style={{position: 'absolute', left: 140, top: 150, width: 700}}>
      <Eyebrow n="03" label="Consumers" at={2} />
      <Words text="Meet *Meena.*" at={4} per={2} style={{...TYPE.h1, fontSize: 112, marginTop: 30}} />
      <Words
        text="Every scan, sample and receipt lands on one consented profile, across every brand."
        at={14}
        per={0.5}
        style={{...TYPE.sub, marginTop: 34, width: 600}}
      />
      <Stat value={10248317} at={58} dur={14} label="verified, consented profiles" size={120} style={{marginTop: 78}} />
    </div>
  );

  return (
    <Stage seed={606} cam={{zoom}} pool={{x: 1330, y: 560, rx: 1100, ry: 760}} table={{x: 300, y: 220}} overlay={overlay}>
      {sf >= 4 ? (
        <Polaroid
          src="img/meena.png"
          caption="Meena · Mumbai"
          x={photo.x}
          y={photo.y}
          rot={photo.rot}
          lift={photo.lift}
          seed={610}
          w={292}
          z={2}
          imgStyle={{objectPosition: '50% 30%'}}
        />
      ) : null}
      {sf >= 8 ? (
        <Card x={card.x} y={card.y} rot={card.rot} lift={card.lift} w={CARD.w} h={CARD.h} seed={620} radius={24} pad="34px 38px" z={1}>
          <div style={{fontFamily: FONT, color: C.uiText}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <div style={{width: 72, height: 72, borderRadius: 36, overflow: 'hidden', flex: 'none', boxShadow: '0 0 0 3px #fff, 0 0 0 4px #E3E6EC'}}>
                <Img src={staticFile('img/meena.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
              <div>
                <div style={{fontSize: 38, fontWeight: 760, letterSpacing: '-0.03em', lineHeight: 1.05}}>Meena Shah</div>
                <div style={{fontFamily: MONO, fontSize: 18, color: C.uiMute, marginTop: 6}}>FS-000001 · Andheri (W), Mumbai</div>
              </div>
            </div>
            <div style={{borderTop: `2px solid ${C.uiLine}`, margin: '26px 0 8px'}} />
            {ROWS.map((r, i) => {
              const at = ROW_AT(i);
              if (sf < at) return <div key={r.label} style={{height: 58}} />;
              const k = keys(sf, at, [0.4, 0.85, 1]);
              return (
                <div
                  key={r.label}
                  style={{
                    height: 58,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${C.uiLine}`,
                    opacity: k,
                    transform: `translateX(${((1 - k) * 18).toFixed(1)}px)`,
                  }}
                >
                  <span style={{fontSize: 21, color: C.uiMute}}>{r.label}</span>
                  <span style={{fontSize: 22, fontWeight: 700}}>{r.value}</span>
                </div>
              );
            })}
            <div style={{marginTop: 26, opacity: prog(sf, 49, 50)}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 650}}>
                <span>Profile</span>
                <span style={{color: C.green}}>{Math.round(fill * 100)}% complete</span>
              </div>
              <div style={{height: 12, borderRadius: 6, background: '#E9ECF1', marginTop: 10, overflow: 'hidden'}}>
                <div style={{width: `${fill * 100}%`, height: '100%', background: C.green, borderRadius: 6}} />
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 22, color: C.navy, fontSize: 18, fontWeight: 600, opacity: prog(sf, 55, 56)}}>
              <IconShield size={24} />
              Consent travels with every value
            </div>
          </div>
        </Card>
      ) : null}

      <Sfx at={4} name="paper" vol={0.3} />
      <Sfx at={9} name="drop" vol={0.75} />
      <Sfx at={9} name="slide" vol={0.35} />
      <Sfx at={13} name="drop" vol={0.6} />
      {ROWS.map((_, i) => (
        <Sfx key={i} at={ROW_AT(i)} name="tap" vol={0.45} />
      ))}
      <Sfx at={55} name="ding" vol={0.4} />
    </Stage>
  );
};
