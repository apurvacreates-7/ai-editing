import React from 'react';
import {C, FONT, GRADIENT} from '../theme';
import {ease, fmtIN, prog, useSF} from '../stop';

// Keynote typography is laid over the set in post: crisp, never jittered, but it
// still arrives on the 12 fps grid so it feels shot with everything else.

export const TYPE: Record<string, React.CSSProperties> = {
  hero: {fontSize: 132, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1.0, color: C.ink},
  h1: {fontSize: 100, fontWeight: 680, letterSpacing: '-0.04em', lineHeight: 1.03, color: C.ink},
  h2: {fontSize: 76, fontWeight: 660, letterSpacing: '-0.034em', lineHeight: 1.06, color: C.ink},
  sub: {fontSize: 34, fontWeight: 460, letterSpacing: '-0.012em', lineHeight: 1.32, color: C.mute},
  small: {fontSize: 26, fontWeight: 500, letterSpacing: '-0.005em', lineHeight: 1.35, color: C.mute},
};

export const gradText = (g: string = GRADIENT): React.CSSProperties => ({
  backgroundImage: g,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  paddingBottom: '0.12em',
  marginBottom: '-0.12em',
});

type Unit = {text: string; grad: boolean; br: boolean};
const parse = (s: string): Unit[] => {
  const out: Unit[] = [];
  const re = /\*([^*]+)\*|(\n)|([^\s*]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[1]) out.push({text: m[1], grad: true, br: false});
    else if (m[2]) out.push({text: '', grad: false, br: true});
    else out.push({text: m[3], grad: false, br: false});
  }
  return out;
};

type WordsProps = {
  /** `*phrase*` renders in the keynote gradient, `\n` breaks the line */
  text: string;
  at: number;
  per?: number;
  dur?: number;
  out?: number;
  rise?: number;
  style?: React.CSSProperties;
  gradient?: string;
};

export const Words: React.FC<WordsProps> = ({text, at, per = 1, dur = 3, out, rise = 26, style, gradient}) => {
  const sf = useSF();
  const units = parse(text);
  const outK = out === undefined ? 1 : 1 - prog(sf, out, out + 3);
  let i = 0;
  return (
    <div style={{fontFamily: FONT, ...style}}>
      {units.map((u, idx) => {
        if (u.br) return <br key={idx} />;
        const s0 = at + i * per;
        i++;
        const p = prog(sf, s0, s0 + dur);
        const k = ease.out(p);
        return (
          <React.Fragment key={idx}>
            <span
              style={{
                display: 'inline-block',
                opacity: Math.min(1, p * 1.25) * outK,
                transform: `translateY(${((1 - k) * rise + (1 - outK) * -10).toFixed(1)}px)`,
                ...(u.grad ? gradText(gradient) : {}),
              }}
            >
              {u.text}
            </span>{' '}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Eyebrow: React.FC<{n?: string; label: string; at: number; out?: number; style?: React.CSSProperties}> = ({
  n,
  label,
  at,
  out,
  style,
}) => {
  const sf = useSF();
  const p = prog(sf, at, at + 2);
  const o = out === undefined ? 1 : 1 - prog(sf, out, out + 3);
  return (
    <div
      style={{
        fontFamily: FONT,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        opacity: p * o,
        transform: `translateY(${((1 - p) * 12).toFixed(1)}px)`,
        ...style,
      }}
    >
      {n ? (
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: C.void,
            background: GRADIENT,
            borderRadius: 999,
            padding: '6px 13px 5px',
          }}
        >
          {n}
        </span>
      ) : null}
      <span style={{fontSize: 22, fontWeight: 650, letterSpacing: '0.24em', textTransform: 'uppercase', ...gradText()}}>
        {label}
      </span>
    </div>
  );
};

type StatProps = {
  value: number;
  at: number;
  dur?: number;
  label: string;
  prefix?: string;
  suffix?: string;
  size?: number;
  decimals?: number;
  out?: number;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
  format?: (n: number) => string;
};

// Big-number moment: counts up on the stop-frame grid in tabular figures.
export const Stat: React.FC<StatProps> = ({
  value,
  at,
  dur = 10,
  label,
  prefix = '',
  suffix = '',
  size = 150,
  decimals = 0,
  out,
  align = 'left',
  style,
  format,
}) => {
  const sf = useSF();
  const p = prog(sf, at, at + dur);
  const v = value * ease.out(p);
  const o = (out === undefined ? 1 : 1 - prog(sf, out, out + 3)) * (sf > at ? 1 : 0);
  const shown = format ? format(v) : decimals > 0 ? v.toFixed(decimals) : fmtIN(v);
  const lp = prog(sf, at + 3, at + 6);
  return (
    <div style={{fontFamily: FONT, textAlign: align, opacity: o, ...style}}>
      <div
        style={{
          fontSize: size,
          fontWeight: 700,
          letterSpacing: '-0.045em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          display: 'inline-block',
          ...gradText(),
        }}
      >
        {prefix}
        {shown}
        {suffix}
      </div>
      <div
        style={{
          ...TYPE.small,
          fontSize: Math.max(24, size * 0.2),
          marginTop: size * 0.12,
          opacity: lp,
          transform: `translateY(${((1 - lp) * 10).toFixed(1)}px)`,
          color: C.mute,
        }}
      >
        {label}
      </div>
    </div>
  );
};
