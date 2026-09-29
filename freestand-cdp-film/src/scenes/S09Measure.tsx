import React from 'react';
import {Stage} from '../components/Stage';
import {Card} from '../components/Physical';
import {Eyebrow, TYPE, Words} from '../components/Type';
import {Sticky} from '../components/Props';
import {Sfx} from '../components/Sfx';
import {C, FONT, GRADIENT} from '../theme';
import {keys, place, useSF} from '../stop';

// Analytics → Lifetime value & product signals: 12-month predicted LTV by the
// mechanic that acquired the consumer, with 90-day repeat rate.
const ROWS = [
  {label: 'Loyalty · earn & burn', value: 3120, repeat: 46},
  {label: 'Packtivation', value: 2140, repeat: 38},
  {label: 'Website sampling', value: 1860, repeat: 31},
  {label: 'Contest', value: 1610, repeat: 27},
  {label: 'Digital sampling', value: 1520, repeat: 26},
  {label: 'Promoter sampling', value: 1240, repeat: 21},
];
const MAX = 3120;
const BAR_MAX = 420;
const ROW_AT = (i: number) => 16 + i * 4;
const BOARD = {x: 1318, y: 668, w: 940, h: 640};

export const S09Measure: React.FC = () => {
  const sf = useSF();
  const board = place(sf, 3, 6, {x: 2500, y: 520, rot: 16}, {x: BOARD.x, y: BOARD.y, rot: 1.2});
  const note = place(sf, 52, 5, {x: -400, y: 1400, rot: -30}, {x: 470, y: 772, rot: -5});

  const overlay = (
    <div style={{position: 'absolute', left: 140, top: 130, width: 1000}}>
      <Eyebrow n="05" label="Measure" at={2} />
      <Words text={'Measured the same way.\n*Every campaign.*'} at={4} style={{...TYPE.h1, fontSize: 88, marginTop: 28}} />
      <Words text="From consumer moment to verified outcome, on one scale." at={14} per={0.5} style={{...TYPE.sub, fontSize: 30, marginTop: 28, width: 640}} />
    </div>
  );

  return (
    <Stage seed={909} pool={{x: 1080, y: 640, rx: 1250, ry: 760}} table={{x: -420, y: -260}} overlay={overlay}>
      {sf >= 3 ? (
        <Card x={board.x} y={board.y} rot={board.rot} lift={board.lift} w={BOARD.w} h={BOARD.h} seed={910} radius={24} pad="36px 44px" z={1}>
          <div style={{fontFamily: FONT, color: C.uiText}}>
            <div style={{fontSize: 30, fontWeight: 760, letterSpacing: '-0.02em'}}>12-month value by acquisition mechanic</div>
            <div style={{fontSize: 19, color: C.uiMute, marginTop: 6}}>Predicted LTV per consumer, with 90-day repeat rate</div>
            <div style={{marginTop: 30}}>
              {ROWS.map((r, i) => {
                const at = ROW_AT(i);
                const k = sf < at ? 0 : keys(sf, at, [0.18, 0.45, 0.72, 0.9, 1]);
                return (
                  <div key={r.label} style={{display: 'flex', alignItems: 'center', height: 72, borderTop: i ? `1px solid ${C.uiLine}` : undefined}}>
                    <div style={{width: 250, fontSize: 21, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? C.uiText : '#3A4356'}}>{r.label}</div>
                    <div style={{width: BAR_MAX + 20, height: 34, display: 'flex', alignItems: 'center'}}>
                      <div
                        style={{
                          width: (BAR_MAX * r.value * k) / MAX,
                          height: 34,
                          borderRadius: 7,
                          background: i === 0 ? GRADIENT : C.navy,
                          opacity: i === 0 ? 1 : 0.88,
                          boxShadow: k > 0 ? '1px 2px 2px rgba(0,0,0,0.16)' : undefined,
                        }}
                      />
                    </div>
                    <div style={{flex: 1, textAlign: 'right', opacity: k >= 1 ? 1 : 0}}>
                      <span style={{fontSize: 26, fontWeight: 760, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>
                        ₹{r.value.toLocaleString('en-IN')}
                      </span>
                      <span style={{fontSize: 17, color: C.uiMute, marginLeft: 10}}>{r.repeat}% repeat</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : null}
      {sf >= 52 ? (
        <Sticky x={note.x} y={note.y} rot={note.rot} lift={note.lift} seed={950} w={420} h={330} z={3}>
          <div style={{fontSize: 96, lineHeight: 0.95}}>44%</div>
          <div style={{fontSize: 36, lineHeight: 1.08, marginTop: 10}}>of verified receipts come from kiranas: the cash basket no one could see.</div>
        </Sticky>
      ) : null}

      <Sfx at={4} name="slide" vol={0.4} />
      <Sfx at={9} name="thud" vol={0.45} />
      {ROWS.map((_, i) => (
        <Sfx key={i} at={ROW_AT(i)} name="paper" vol={0.25} />
      ))}
      <Sfx at={52} name="paper" vol={0.35} />
      <Sfx at={57} name="drop" vol={0.6} />
    </Stage>
  );
};
