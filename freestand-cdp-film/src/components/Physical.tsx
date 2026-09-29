import React from 'react';
import {staticFile} from 'remotion';
import {C} from '../theme';
import {signed, useSF} from '../stop';

// Key light sits top-left of the set, so every shadow falls down and to the right.
// Lifting an object off the table pushes its shadow further out and softens it.
export const shadowFor = (lift: number, rot: number, strength = 1) => {
  const dx = (5 + 26 * lift) * strength;
  const dy = (9 + 42 * lift) * strength;
  // counter-rotate so the shadow direction stays fixed in world space
  const r = (-rot * Math.PI) / 180;
  const lx = dx * Math.cos(r) - dy * Math.sin(r);
  const ly = dx * Math.sin(r) + dy * Math.cos(r);
  return {
    x: lx,
    y: ly,
    blur: (10 + 48 * lift) * strength,
    alpha: 0.6 - 0.26 * lift,
    contact: 0.5 * (1 - Math.min(1, lift * 1.4)),
  };
};

export const paperBg = (bg: string = C.paper, grainScale = 384): React.CSSProperties => ({
  backgroundColor: bg,
  backgroundImage: `linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 38%, rgba(0,0,0,0.045) 100%), url(${staticFile('tex/paper.png')})`,
  backgroundBlendMode: 'normal, multiply',
  backgroundSize: `100% 100%, ${grainScale}px ${grainScale}px`,
});

type ObjProps = {
  /** centre of the object on the table */
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  /** 0 = resting on the table, 1 = held above it */
  lift?: number;
  scale?: number;
  seed: number;
  /** how much the object "boils" between exposures */
  jitter?: number;
  shadow?: 'box' | 'drop' | 'none';
  shadowStrength?: number;
  radius?: number | string;
  opacity?: number;
  z?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

// A physical cut-out on the set. Every exposure it is nudged a fraction of a
// pixel (more while it is being carried), which reads as hand-placed.
export const Obj: React.FC<ObjProps> = ({
  x,
  y,
  w,
  h,
  rot = 0,
  lift = 0,
  scale = 1,
  seed,
  jitter = 1,
  shadow = 'box',
  shadowStrength = 1,
  radius = 14,
  opacity = 1,
  z,
  style,
  children,
}) => {
  const sf = useSF();
  const amp = jitter * (0.32 + 1.7 * lift);
  const jx = signed(seed, sf) * amp;
  const jy = signed(seed + 0.37, sf) * amp;
  const jr = signed(seed + 0.71, sf) * amp * 0.16;
  const s = scale * (1 + 0.05 * lift);
  const r = rot + jr;
  const sh = shadowFor(lift, r, shadowStrength);
  const shadowCss =
    shadow === 'box'
      ? {
          boxShadow: `${sh.x.toFixed(1)}px ${sh.y.toFixed(1)}px ${sh.blur.toFixed(1)}px rgba(0,0,0,${sh.alpha.toFixed(3)}), ${(sh.x * 0.12).toFixed(1)}px ${(sh.y * 0.12).toFixed(1)}px 2px rgba(0,0,0,${sh.contact.toFixed(3)})`,
        }
      : shadow === 'drop'
        ? {
            filter: `drop-shadow(${sh.x.toFixed(1)}px ${sh.y.toFixed(1)}px ${(sh.blur * 0.5).toFixed(1)}px rgba(0,0,0,${sh.alpha.toFixed(3)})) drop-shadow(${(sh.x * 0.12).toFixed(1)}px ${(sh.y * 0.12).toFixed(1)}px 1px rgba(0,0,0,${sh.contact.toFixed(3)}))`,
          }
        : {};
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `translate(${jx.toFixed(2)}px, ${jy.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`,
        borderRadius: radius,
        opacity,
        zIndex: z,
        ...shadowCss,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// A die-cut card of warm white stock.
export const Card: React.FC<
  Omit<ObjProps, 'children'> & {bg?: string; pad?: number | string; children?: React.ReactNode}
> = ({bg, pad = 28, style, children, ...rest}) => (
  <Obj
    {...rest}
    style={{
      ...paperBg(bg),
      padding: pad,
      boxSizing: 'border-box',
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </Obj>
);
