import React from 'react';
import {Stage} from '../components/Stage';
import {Card} from '../components/Physical';
import {TYPE, Words} from '../components/Type';
import {Pill} from '../components/Props';
import {IconCheck, IconPlay} from '../components/Icons';
import {Sfx} from '../components/Sfx';
import {C, FONT, MONO} from '../theme';
import {keys, place, useSF} from '../stop';

// Playbooks turn what a campaign learned into the next brief. This one is the
// first enabled playbook on the workspace's Home screen.
const PRESS = 22;

export const S10Next: React.FC = () => {
  const sf = useSF();
  const card = place(sf, 2, 5, {x: 960, y: 1500, rot: 14}, {x: 960, y: 610, rot: -1.2});
  const pressed = sf >= PRESS && sf < PRESS + 2;
  const live = sf >= PRESS + 2;

  const overlay = (
    <Words
      text="Then launch *the next one.*"
      at={2}
      style={{...TYPE.h1, fontSize: 96, position: 'absolute', top: 110, width: '100%', textAlign: 'center'}}
    />
  );

  return (
    <Stage seed={1010} pool={{x: 960, y: 620, rx: 1000, ry: 700}} table={{x: 120, y: 330}} overlay={overlay}>
      {sf >= 2 ? (
        <Card x={card.x} y={card.y} rot={card.rot} lift={card.lift} w={940} h={400} seed={1020} radius={26} pad="40px 48px" z={1}>
          <div style={{fontFamily: FONT, color: C.uiText, height: '100%', display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', gap: 12}}>
              <Pill size={18} bg="#EEF2FA" color={C.navy}>Playbook</Pill>
              <Pill size={18} bg="#F3EEFF" color="#5B35B5">Conversion</Pill>
            </div>
            <div style={{fontSize: 46, fontWeight: 760, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 22, textWrap: 'balance'} as React.CSSProperties}>
              Nudge single-SKU Dairy Milk buyers to a combo
            </div>
            <div style={{fontSize: 22, color: C.uiMute, marginTop: 14, lineHeight: 1.4}}>
              Baskets with Oreo and Dairy Milk together come back 2.3× more often.
            </div>
            <div style={{marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                <span style={{fontSize: 32, fontWeight: 780, letterSpacing: '-0.02em'}}>87,981</span>
                <span style={{fontSize: 21, color: C.uiMute, marginLeft: 10}}>people</span>
                <span style={{fontFamily: MONO, fontSize: 17, color: C.uiMute, marginLeft: 22}}>built from CMP-2026-020</span>
              </div>
              {live ? (
                <div style={{transform: `scale(${keys(sf, PRESS + 2, [0.8, 1.08, 1])})`, transformOrigin: 'right center'}}>
                  <Pill size={27} style={{padding: '12px 22px', gap: 10}}>
                    <IconCheck size={26} stroke={3} />
                    Campaign live
                  </Pill>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: pressed ? '#0A2154' : C.navy,
                    color: '#fff',
                    borderRadius: 14,
                    padding: '14px 28px',
                    fontSize: 24,
                    fontWeight: 700,
                    transform: `translateY(${pressed ? 3 : 0}px)`,
                    boxShadow: pressed ? '0 1px 1px rgba(0,0,0,0.3)' : '0 4px 0 #061638, 0 6px 10px rgba(0,0,0,0.25)',
                  }}
                >
                  <IconPlay size={20} color="#fff" stroke={2.6} />
                  Run
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : null}
      <Sfx at={3} name="paper" vol={0.3} />
      <Sfx at={7} name="drop" vol={0.7} />
      <Sfx at={PRESS} name="click" vol={0.8} />
      <Sfx at={PRESS + 2} name="ding" vol={0.55} />
    </Stage>
  );
};
