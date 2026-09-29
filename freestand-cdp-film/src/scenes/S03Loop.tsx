import React from 'react';
import {Stage} from '../components/Stage';
import {Card, Obj, paperBg, shadowFor} from '../components/Physical';
import {TYPE, Words} from '../components/Type';
import {Sfx} from '../components/Sfx';
import {IconBox, IconChart, IconData, IconLaunch, IconUsers} from '../components/Icons';
import {C, FONT} from '../theme';
import {ease, place, prog, signed, useSF} from '../stop';

// The workspace's own framing, from the Home screen: one loop, five stages.
const STAGES = [
  {label: 'Launch', Icon: IconLaunch, value: '11', note: 'campaigns live'},
  {label: 'Operate', Icon: IconBox, value: '2,25,762', note: 'samples in consumers’ hands'},
  {label: 'Consumers', Icon: IconUsers, value: '1,02,48,317', note: 'verified, consented profiles'},
  {label: 'Data', Icon: IconData, value: '62,54,569', note: 'synced to Lytics'},
  {label: 'Measure', Icon: IconChart, value: '3,11,263', note: 'people with purchase intent'},
];

const CARD_W = 318;
const CARD_H = 300;
const GAP = 22;
const ROW_Y = 560;
const cardX = (i: number) => 960 + (i - 2) * (CARD_W + GAP);
const ROTS = [-2.2, 1.4, -0.8, 1.8, -1.5];

// Paper ribbon that runs from Measure back round to Launch.
const RIBBON = `M ${cardX(4)} ${ROW_Y + CARD_H / 2 + 14} C ${cardX(4)} ${ROW_Y + 330}, ${cardX(4) - 120} ${ROW_Y + 350}, ${cardX(3)} ${ROW_Y + 350} L ${cardX(1)} ${ROW_Y + 350} C ${cardX(0) + 120} ${ROW_Y + 350}, ${cardX(0)} ${ROW_Y + 330}, ${cardX(0)} ${ROW_Y + CARD_H / 2 + 22}`;
const RIBBON_LEN = 1740;

export const S03Loop: React.FC = () => {
  const sf = useSF();
  // after the ribbon closes the loop, the camera creeps in on Launch
  const push = prog(sf, 58, 71);
  const zoom = 1 + 0.2 * ease.in(push);
  const camX = -(960 - cardX(0)) * 0.9 * ease.in(push);

  const ribbonP = prog(sf, 32, 46);
  const ribbonSh = shadowFor(0, 0, 0.55);
  const headOn = sf >= 47;

  const overlay = (
    <>
      <Words
        text="One loop. *Every campaign.*"
        at={2}
        out={56}
        style={{...TYPE.h1, fontSize: 92, position: 'absolute', top: 104, width: '100%', textAlign: 'center'}}
      />
      <Words
        text="Measured results feed the next brief."
        at={47}
        out={56}
        style={{...TYPE.sub, fontSize: 30, position: 'absolute', top: 956, width: '100%', textAlign: 'center'}}
      />
    </>
  );

  return (
    <Stage light={1} seed={303} cam={{zoom, x: camX, y: 40 * ease.in(push)}} pool={{x: 960, y: 600, rx: 1150, ry: 700}} table={{x: -300, y: 120}} overlay={overlay}>
      <svg
        width={1920}
        height={1080}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          overflow: 'visible',
          filter: `drop-shadow(${ribbonSh.x.toFixed(1)}px ${ribbonSh.y.toFixed(1)}px 5px rgba(0,0,0,0.55))`,
        }}
      >
        <path
          d={RIBBON}
          fill="none"
          stroke="#ECEAE3"
          strokeWidth={14}
          strokeLinecap="butt"
          strokeDasharray={`${RIBBON_LEN * ribbonP} ${RIBBON_LEN}`}
          transform={`translate(${signed(311, sf) * 0.4} ${signed(312, sf) * 0.4})`}
        />
        {headOn ? (
          <path
            d={`M ${cardX(0) - 30} ${ROW_Y + CARD_H / 2 + 52} L ${cardX(0)} ${ROW_Y + CARD_H / 2 + 14} L ${cardX(0) + 30} ${ROW_Y + CARD_H / 2 + 52} Z`}
            fill="#ECEAE3"
          />
        ) : null}
      </svg>

      {STAGES.map((st, i) => {
        const land = 8 + i * 4;
        if (sf < land - 4) return null;
        const p = place(
          sf,
          land - 4,
          4,
          {x: 960 + (i - 2) * 140, y: 1500, rot: (i - 2) * 9 + 6},
          {x: cardX(i), y: ROW_Y, rot: ROTS[i]},
        );
        const Icon = st.Icon;
        return (
          <Card key={st.label} x={p.x} y={p.y} rot={p.rot} lift={p.lift} w={CARD_W} h={CARD_H} seed={320 + i * 5} radius={20} pad={30}>
            <div style={{fontFamily: FONT, color: C.uiText, height: '100%', display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, color: C.navy}}>
                <Icon size={30} stroke={2.2} />
                <span style={{fontSize: 21, fontWeight: 750, letterSpacing: '0.16em', textTransform: 'uppercase'}}>{st.label}</span>
              </div>
              <div
                style={{
                  marginTop: 'auto',
                  fontSize: st.value.length > 9 ? 44 : 52,
                  fontWeight: 750,
                  letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {st.value}
              </div>
              <div style={{fontSize: 21, color: C.uiMute, marginTop: 12, lineHeight: 1.3}}>{st.note}</div>
            </div>
          </Card>
        );
      })}

      {[0, 1, 2, 3].map((i) => {
        const at = 26 + i;
        if (sf < at) return null;
        const p = place(sf, at, 1, {x: cardX(i) + CARD_W / 2 + GAP / 2, y: ROW_Y - 60}, {x: cardX(i) + CARD_W / 2 + GAP / 2, y: ROW_Y});
        return (
          <Obj key={i} x={p.x} y={p.y} lift={p.lift} w={34} h={34} seed={350 + i} radius={17} shadowStrength={0.5} style={{...paperBg('#ECEAE3'), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Obj>
        );
      })}

      {STAGES.map((_, i) => (
        <React.Fragment key={i}>
          <Sfx at={8 + i * 4 - 4} name="paper" vol={0.3} />
          <Sfx at={8 + i * 4} name="drop" vol={0.7} />
        </React.Fragment>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`c${i}`} at={27 + i} name="tap" vol={0.35} />
      ))}
      <Sfx at={32} name="slide" vol={0.5} />
      <Sfx at={47} name="tap" vol={0.6} />
    </Stage>
  );
};

