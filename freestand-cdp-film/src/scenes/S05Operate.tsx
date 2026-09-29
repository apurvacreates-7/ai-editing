import React from 'react';
import {Stage} from '../components/Stage';
import {Obj, paperBg} from '../components/Physical';
import {Eyebrow, Stat, TYPE, Words} from '../components/Type';
import {Pill, StampMark} from '../components/Props';
import {IconCheck} from '../components/Icons';
import {Sfx} from '../components/Sfx';
import {C, FONT, MONO} from '../theme';
import {carry, keys, place, prog, useSF} from '../stop';

// Packtivation on WhatsApp, as in the workspace: Meena uploads a RelianceSMART
// receipt, OCR verifies it, ₹50 lands on UPI, points land in Joy Club.
const PHONE = {x: 1500, y: 548, w: 404, h: 812};
const RECEIPT = {x: 1030, y: 610, w: 300, h: 560};

const Bubble: React.FC<{
  at: number;
  out?: boolean;
  top: number;
  width?: number;
  children: React.ReactNode;
}> = ({at, out = false, top, width = 270, children}) => {
  const sf = useSF();
  if (sf < at) return null;
  const k = keys(sf, at, [0.72, 1.06, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        [out ? 'right' : 'left']: 16,
        width,
        transform: `scale(${k})`,
        transformOrigin: out ? 'top right' : 'top left',
        background: out ? C.waBubble : '#FFFFFF',
        borderRadius: 16,
        [out ? 'borderTopRightRadius' : 'borderTopLeftRadius']: 4,
        padding: '12px 15px',
        boxSizing: 'border-box',
        fontFamily: FONT,
        fontSize: 21,
        lineHeight: 1.32,
        color: '#1C2430',
        boxShadow: '1px 2px 3px rgba(0,0,0,0.18)',
      }}
    >
      {children}
    </div>
  );
};

export const S05Operate: React.FC = () => {
  const sf = useSF();
  const phone = place(sf, 3, 6, {x: 2350, y: 460, rot: 24}, {x: PHONE.x, y: PHONE.y, rot: -2.5});
  const receipt = place(sf, 16, 5, {x: 700, y: 1500, rot: -20}, {x: RECEIPT.x, y: RECEIPT.y, rot: 5.5});
  // the rubber stamp comes down onto the receipt and lifts away again
  const stampDown = place(sf, 26, 3, {x: 1180, y: 1340, rot: 30}, {x: 1040, y: 690, rot: -8});
  const stampUp = carry(sf, 31, 4, {x: 1040, y: 690, rot: -8}, {x: 1300, y: 1400, rot: 16});
  const stamp = sf < 31 ? stampDown : stampUp;
  const inked = sf >= 29;
  const upi = place(sf, 60, 4, {x: 1050, y: 1400, rot: -12}, {x: 1085, y: 948, rot: -3});

  const overlay = (
    <div style={{position: 'absolute', left: 140, top: 150, width: 700}}>
      <Eyebrow n="02" label="Operate" at={2} />
      <Words text={'Every reward,\n*verified.*'} at={4} style={{...TYPE.h1, marginTop: 30}} />
      <Words
        text="Samples, store passes and cashback reach real, verified people. Never a duplicate. Never a bot."
        at={14}
        per={0.5}
        style={{...TYPE.sub, marginTop: 34, width: 610}}
      />
      <Stat value={225762} at={46} dur={12} label="samples in consumers’ hands" size={132} style={{marginTop: 64}} />
    </div>
  );

  return (
    <Stage seed={505} pool={{x: 1280, y: 580, rx: 1100, ry: 760}} table={{x: -520, y: 140}} overlay={overlay}>
      {sf >= 16 ? (
        <Obj
          x={receipt.x}
          y={receipt.y}
          rot={receipt.rot}
          lift={receipt.lift}
          w={RECEIPT.w}
          h={RECEIPT.h}
          seed={520}
          radius={2}
          z={1}
          style={{
            ...paperBg('#F7F5EF', 260),
            clipPath:
              'polygon(0 0, 100% 0, 100% 97%, 95% 100%, 90% 97%, 85% 100%, 80% 97%, 75% 100%, 70% 97%, 65% 100%, 60% 97%, 55% 100%, 50% 97%, 45% 100%, 40% 97%, 35% 100%, 30% 97%, 25% 100%, 20% 97%, 15% 100%, 10% 97%, 5% 100%, 0 97%)',
            fontFamily: MONO,
            color: '#2B2B2B',
            padding: '30px 26px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 27, textAlign: 'center', letterSpacing: '-0.01em'}}>RelianceSMART</div>
          <div style={{fontSize: 14, textAlign: 'center', marginTop: 6, color: '#555'}}>Axis Mall, Andheri (W) · 400053</div>
          <div style={{borderTop: '2px dashed #9A9A9A', margin: '20px 0 16px'}} />
          {[
            ['Dairy Milk 100 g', '₹70'],
            ['Oreo 120 g', '₹50'],
          ].map(([a, b]) => (
            <div key={a} style={{display: 'flex', justifyContent: 'space-between', fontSize: 18, marginBottom: 10}}>
              <span>{a}</span>
              <span>{b}</span>
            </div>
          ))}
          <div style={{borderTop: '2px dashed #9A9A9A', margin: '14px 0 14px'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 700}}>
            <span>TOTAL</span>
            <span>₹120</span>
          </div>
          <div style={{fontSize: 14, marginTop: 14, color: '#555'}}>Paid in cash · 26 Sep 2026</div>
          <div style={{fontSize: 14, marginTop: 4, color: '#555'}}>Bill 0418-2231-7760</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center'}}>
            {inked ? <StampMark text="OCR verified" size={30} rot={-11} k={keys(sf, 29, [1.12, 1])} /> : null}
          </div>
          <div style={{position: 'absolute', left: 26, right: 26, bottom: 38, height: 44, background: 'repeating-linear-gradient(90deg, #2B2B2B 0 3px, transparent 3px 5px, #2B2B2B 5px 6px, transparent 6px 9px)', opacity: 0.85}} />
        </Obj>
      ) : null}

      {sf >= 60 ? (
        <Obj x={upi.x} y={upi.y} rot={upi.rot} lift={upi.lift} w={330} h={112} seed={560} radius={16} z={2}
          style={{...paperBg('#FFFFFF'), display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', boxSizing: 'border-box', fontFamily: FONT}}>
          <div style={{width: 52, height: 52, borderRadius: 26, background: C.greenBg, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <IconCheck size={30} stroke={3} />
          </div>
          <div>
            <div style={{fontSize: 30, fontWeight: 800, color: C.uiText, letterSpacing: '-0.02em'}}>₹50 received</div>
            <div style={{fontSize: 18, color: C.uiMute}}>From Cadbury · UPI</div>
          </div>
        </Obj>
      ) : null}

      {sf >= 3 ? (
        <Obj x={phone.x} y={phone.y} rot={phone.rot} lift={phone.lift} w={PHONE.w} h={PHONE.h} seed={540} radius={58} z={3}
          style={{background: 'linear-gradient(150deg, #2A2C33 0%, #121317 60%)', padding: 14, boxSizing: 'border-box'}}>
          <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 46, overflow: 'hidden', background: C.waBg}}>
            <div style={{height: 118, background: '#0E6B5C', display: 'flex', alignItems: 'flex-end', padding: '0 20px 16px', boxSizing: 'border-box', gap: 14}}>
              <div style={{width: 48, height: 48, borderRadius: 24, background: '#4B1F7A', color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>C</div>
              <div style={{fontFamily: FONT, color: '#fff'}}>
                <div style={{fontSize: 22, fontWeight: 700}}>Cadbury</div>
                <div style={{fontSize: 14, opacity: 0.85}}>Verified business</div>
              </div>
            </div>
            <div style={{position: 'relative', height: 666}}>
              <div style={{position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
                <span style={{fontFamily: FONT, fontSize: 15, fontWeight: 600, color: '#54656F', background: '#FFFFFFCC', borderRadius: 8, padding: '4px 12px'}}>TODAY</span>
              </div>
              <Bubble at={14} out top={62} width={290}>
                <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                  <div style={{width: 52, height: 70, borderRadius: 4, flex: 'none', background: 'repeating-linear-gradient(180deg, #F7F5EF 0 7px, #D9D6CE 7px 8px)', boxShadow: 'inset 0 0 0 1px #c9c6be'}} />
                  <span>Here’s my receipt from RelianceSMART</span>
                </div>
              </Bubble>
              <Bubble at={32} top={196} width={318}>
                Receipt <b>REC-1042</b> is verified. ₹50 is on its way to meena@upi.
              </Bubble>
              <Bubble at={42} top={330} width={250}>
                <Pill size={19} bg={C.amberBg} color={C.amber}>+80 Joy Club points</Pill>
              </Bubble>
              <Bubble at={54} out top={414} width={210}>
                Got it, thank you!
              </Bubble>
              <div style={{position: 'absolute', left: 14, right: 14, bottom: 18, display: 'flex', gap: 10, alignItems: 'center'}}>
                <div style={{flex: 1, height: 56, borderRadius: 28, background: '#FFFFFF', fontFamily: FONT, fontSize: 19, color: '#8A949B', display: 'flex', alignItems: 'center', paddingLeft: 22}}>Message</div>
                <div style={{width: 56, height: 56, borderRadius: 28, background: '#0E8A6F'}} />
              </div>
            </div>
          </div>
        </Obj>
      ) : null}

      {sf >= 26 && prog(sf, 31, 35) < 1 ? (
        <Obj x={stamp.x} y={stamp.y} rot={stamp.rot} lift={stamp.lift} w={236} h={120} seed={580} radius={18} z={4}
          style={{background: 'linear-gradient(135deg, #B07A4E 0%, #8A5A36 55%, #6E4528 100%)', boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.12)'}}>
          <div style={{position: 'absolute', left: 118 - 38, top: 60 - 38, width: 76, height: 76, borderRadius: 38, background: 'radial-gradient(circle at 35% 30%, #C89163, #7A4B2A)', boxShadow: '2px 4px 6px rgba(0,0,0,0.35)'}} />
        </Obj>
      ) : null}

      <Sfx at={4} name="slide" vol={0.45} />
      <Sfx at={9} name="thud" vol={0.5} />
      <Sfx at={14} name="pop" vol={0.4} />
      <Sfx at={17} name="paper" vol={0.35} />
      <Sfx at={21} name="drop" vol={0.6} />
      <Sfx at={29} name="stamp" vol={0.9} />
      <Sfx at={32} name="pop" vol={0.4} />
      <Sfx at={42} name="pop" vol={0.4} />
      <Sfx at={54} name="pop" vol={0.35} />
      <Sfx at={60} name="slide" vol={0.35} />
      <Sfx at={64} name="ding" vol={0.45} />
    </Stage>
  );
};
