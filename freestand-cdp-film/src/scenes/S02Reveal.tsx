import React from 'react';
import {Stage} from '../components/Stage';
import {Logo, PartPose} from '../components/Logo';
import {Obj, paperBg} from '../components/Physical';
import {TYPE, Words} from '../components/Type';
import {Sfx} from '../components/Sfx';
import {C, FONT} from '../theme';
import {ease, hash, keys, place, tw, useSF} from '../stop';

// The mark is built by hand: box halves slide in, the lid and bow drop on,
// then the wordmark is set down letter by letter.
const LOGO_W = 1200;

const partTiming = (i: number) => {
  if (i === 1) return {start: 0, dur: 5, from: {x: -980, y: 140, rot: -38}};
  if (i === 2) return {start: 2, dur: 5, from: {x: 980, y: 170, rot: 34}};
  if (i === 0) return {start: 6, dur: 4, from: {x: 40, y: -720, rot: 16}};
  const j = i - 3;
  const start = 10 + Math.round(j * 1.5);
  return {start, dur: 3, from: {x: 30 + (hash(j + 5) - 0.5) * 80, y: -210 - hash(j + 9) * 90, rot: (hash(j + 2) - 0.5) * 30}};
};

export const LETTER_LANDS = Array.from({length: 12}, (_, i) => {
  const t = partTiming(i);
  return t.start + t.dur;
});

export const S02Reveal: React.FC = () => {
  const sf = useSF();
  const pose = (i: number): PartPose => {
    const t = partTiming(i);
    if (sf < t.start) return {opacity: 0};
    const p = place(sf, t.start, t.dur, t.from, {x: 0, y: 0, rot: 0}, i === 0 ? ease.outBack : ease.out);
    return {dx: p.x, dy: p.y, rot: p.rot, lift: p.lift};
  };

  const tag = place(sf, 24, 4, {x: 960, y: 1300, rot: 8}, {x: 960, y: 596, rot: -1.2});
  const zoom = tw(sf, 0, 72, 1, 1.035, ease.linear);
  const light = keys(sf, 0, [0.55, 0.9, 1]);

  const overlay = (
    <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center'}}>
      <Words text="Every consumer moment." at={32} style={{...TYPE.h2, fontSize: 76}} />
      <div style={{display: 'flex', justifyContent: 'center', gap: 30, marginTop: 30}}>
        {['Verified.', 'Consented.', 'Activated.', 'Measured.'].map((w, i) => (
          <Words key={w} text={`*${w}*`} at={40 + i * 6} dur={2} style={{...TYPE.h2, fontSize: 56, fontWeight: 620}} />
        ))}
      </div>
    </div>
  );

  return (
    <Stage light={light} seed={202} cam={{zoom}} pool={{x: 960, y: 520, rx: 1080, ry: 720}} table={{x: 260, y: -90}} overlay={overlay}>
      <div style={{position: 'absolute', left: 960 - LOGO_W / 2, top: 296}}>
        <Logo width={LOGO_W} pose={pose} seed={210} />
      </div>
      {sf >= 24 ? (
        <Obj
          x={tag.x}
          y={tag.y}
          rot={tag.rot}
          lift={tag.lift}
          w={250}
          h={58}
          seed={230}
          radius={6}
          style={{
            ...paperBg('#F4F3EF'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: '0.62em',
            paddingLeft: '0.62em',
            color: C.navy,
          }}
        >
          STUDIO
        </Obj>
      ) : null}
      <Sfx at={0} name="thud" vol={0.9} />
      <Sfx at={5} name="drop" vol={0.8} />
      <Sfx at={7} name="drop" vol={0.8} />
      <Sfx at={10} name="drop" vol={0.9} />
      {LETTER_LANDS.slice(3).map((t, i) => (
        <Sfx key={i} at={t} name="tap" vol={0.55} />
      ))}
      <Sfx at={28} name="tap" vol={0.7} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`t${i}`} at={40 + i * 6} name="tick" vol={0.45} />
      ))}
    </Stage>
  );
};
