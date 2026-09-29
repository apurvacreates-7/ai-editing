import React from 'react';
import {Stage} from '../components/Stage';
import {Logo} from '../components/Logo';
import {Obj, paperBg} from '../components/Physical';
import {TYPE, Words} from '../components/Type';
import {Sfx} from '../components/Sfx';
import {C, FONT} from '../theme';
import {keys, place, tw, useSF} from '../stop';

// End card: the finished mark is set down in one piece, the line lands, and
// the key light is switched off.
const LOGO_W = 1000;
const LOGO_H = (LOGO_W * 760) / 4096;
const OFF = 82;

export const S11Finale: React.FC = () => {
  const sf = useSF();
  const logo = place(sf, 0, 6, {x: 960, y: 1450, rot: 10}, {x: 960, y: 392, rot: 0});
  const tag = place(sf, 8, 4, {x: 1500, y: 1400, rot: -18}, {x: 960, y: 548, rot: 1});
  const light = sf < OFF ? tw(sf, 0, 3, 0.7, 1) : keys(sf, OFF, [1, 0.4, 0.1, 0]);
  const zoom = tw(sf, 0, OFF, 1.02, 1.0);

  const overlay = (
    <div style={{position: 'absolute', top: 660, width: '100%', textAlign: 'center'}}>
      <Words text="One loop. *Every campaign.*" at={16} out={OFF - 2} style={{...TYPE.h1, fontSize: 92}} />
      <Words text="Freestand Studio · Mondelēz India" at={34} per={0.5} out={OFF - 2} style={{...TYPE.sub, fontSize: 30, marginTop: 30}} />
    </div>
  );

  return (
    <Stage light={light} seed={1111} cam={{zoom}} pool={{x: 960, y: 470, rx: 980, ry: 620}} table={{x: 60, y: -40}} overlay={overlay}>
      <div
        style={{
          position: 'absolute',
          left: logo.x - LOGO_W / 2,
          top: logo.y - LOGO_H / 2,
          transform: `rotate(${logo.rot}deg) scale(${1 + 0.05 * logo.lift})`,
        }}
      >
        <Logo width={LOGO_W} pose={() => ({lift: logo.lift})} seed={1120} jitter={0.8} />
      </div>
      {sf >= 8 ? (
        <Obj x={tag.x} y={tag.y} rot={tag.rot} lift={tag.lift} w={230} h={54} seed={1130} radius={6}
          style={{...paperBg('#F4F3EF'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.62em', paddingLeft: '0.62em', color: C.navy}}>
          STUDIO
        </Obj>
      ) : null}
      <Sfx at={1} name="slide" vol={0.35} />
      <Sfx at={6} name="thud" vol={0.7} />
      <Sfx at={12} name="tap" vol={0.6} />
      <Sfx at={16} name="ding" vol={0.4} />
      <Sfx at={OFF} name="switch" vol={0.7} />
    </Stage>
  );
};
