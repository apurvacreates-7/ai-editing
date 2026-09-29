import React from 'react';
import {Stage} from '../components/Stage';
import {Polaroid} from '../components/Props';
import {TYPE, Words} from '../components/Type';
import {Sfx} from '../components/Sfx';
import {carry, keys, place, prog, tw, useSF} from '../stop';

// Cold open: consumer moments land on the table as instant photos, then fade
// back to blank film and are cleared away. "Until now."
const SHOTS = [
  {
    src: 'img/cadbury-store-handover.jpg',
    caption: 'Sample handed over',
    from: {x: -320, y: 420, rot: -34},
    to: {x: 615, y: 600, rot: -8},
    exit: {x: -520, y: 760, rot: -30},
    land: 12,
    img: {objectPosition: '38% 50%'},
  },
  {
    src: 'img/cadbury-giveaway-campaign.png',
    caption: 'Pack code scanned',
    from: {x: 1900, y: -380, rot: 26},
    to: {x: 940, y: 548, rot: 3},
    exit: {x: 1240, y: -520, rot: 30},
    land: 18,
    img: {objectPosition: '50% 50%'},
  },
  {
    src: 'img/celebrations-sampling-campaign.png',
    caption: 'Diwali box delivered',
    from: {x: 2280, y: 360, rot: 28},
    to: {x: 1275, y: 605, rot: -4},
    exit: {x: 2360, y: 520, rot: 36},
    land: 24,
    img: {objectPosition: '50% 38%'},
  },
  {
    src: 'img/bournvita-campaign-square.jpg',
    caption: 'Quiz answered',
    from: {x: 260, y: 1560, rot: -18},
    to: {x: 805, y: 832, rot: 6},
    exit: {x: 420, y: 1620, rot: -24},
    land: 30,
    img: {objectPosition: '50% 50%'},
  },
  {
    src: 'img/oreo-twirl-campaign.jpg',
    caption: 'Receipt uploaded',
    from: {x: 1620, y: 1580, rot: 22},
    to: {x: 1120, y: 846, rot: -6},
    exit: {x: 1700, y: 1640, rot: 28},
    land: 36,
    img: {objectPosition: '50% 50%'},
  },
];

export const S01ColdOpen: React.FC = () => {
  const sf = useSF();

  // light: switched on, dims as the moments fade, snapped off at the end
  const light =
    sf < 4
      ? 0
      : sf < 48
        ? keys(sf, 4, [0.42, 0.78, 1])
        : sf < 80
          ? tw(sf, 48, 62, 1, 0.8)
          : keys(sf, 80, [0.8, 0.34, 0.08, 0]);

  const overlay = (
    <>
      <Words
        text="Every campaign creates *moments.*"
        at={19}
        out={46}
        style={{...TYPE.h2, position: 'absolute', top: 96, width: '100%', textAlign: 'center'}}
      />
      <Words
        text="Most of them vanish."
        at={52}
        per={2}
        out={78}
        style={{...TYPE.h2, position: 'absolute', top: 96, width: '100%', textAlign: 'center'}}
      />
      <Words
        text="Until *now.*"
        at={84}
        per={2}
        dur={3}
        style={{...TYPE.hero, position: 'absolute', top: 470, width: '100%', textAlign: 'center'}}
      />
    </>
  );

  return (
    <Stage light={light} seed={101} pool={{x: 960, y: 700, rx: 1020, ry: 640}} table={{x: -120, y: 60}} overlay={overlay}>
      {SHOTS.map((s, i) => {
        const inPose = place(sf, s.land - 5, 5, s.from, s.to);
        const outStart = 68 + i * 2;
        const pose = sf >= outStart ? carry(sf, outStart, 6, s.to, s.exit) : inPose;
        if (sf < s.land - 5 || (sf >= outStart && pose.t >= 1)) return null;
        const develop = 1 - prog(sf, 50 + i * 3, 60 + i * 3);
        return (
          <Polaroid
            key={s.src}
            src={s.src}
            caption={s.caption}
            imgStyle={s.img}
            x={pose.x}
            y={pose.y}
            rot={pose.rot}
            lift={pose.lift}
            seed={200 + i * 7}
            develop={develop}
            w={300}
            z={i}
          />
        );
      })}
      <Sfx at={4} name="switch" vol={0.7} />
      {SHOTS.map((s, i) => (
        <React.Fragment key={i}>
          <Sfx at={s.land - 4} name="paper" vol={0.28} />
          <Sfx at={s.land} name="drop" vol={0.8} />
          <Sfx at={68 + i * 2} name="slide" vol={0.4} />
        </React.Fragment>
      ))}
      <Sfx at={80} name="switch" vol={0.6} />
    </Stage>
  );
};
