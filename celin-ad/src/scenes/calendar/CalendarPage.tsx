import React from 'react';
import {FONT} from '../../fonts';
import {C} from '../../theme';
import {Glyph, GlyphKind} from './Glyphs';

export const PAGE_W = 540;
export const PAGE_H = 760;

export type PageSpec = {
  kind: GlyphKind;
  label: string;
  /** 0-based month, or null for the cover page. */
  month: number | null;
};

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MonthGrid: React.FC<{year: number; month: number}> = ({year, month}) => {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const colW = 62;
  const x0 = (PAGE_W - colW * 7) / 2;
  const rowH = 36;
  return (
    <div style={{position: 'absolute', left: x0, top: 468, width: colW * 7}}>
      <div style={{display: 'flex'}}>
        {WEEK.map((w, i) => (
          <div
            key={i}
            style={{width: colW, textAlign: 'center', fontSize: 17, fontWeight: 700, color: C.haze, letterSpacing: '0.08em'}}
          >
            {w}
          </div>
        ))}
      </div>
      <div style={{display: 'flex', flexWrap: 'wrap', marginTop: 16}}>
        {cells.map((d, i) => (
          <div
            key={i}
            style={{
              width: colW,
              height: rowH,
              textAlign: 'center',
              fontSize: 22,
              fontWeight: 600,
              color: i % 7 === 0 ? C.haze : C.slateMid,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {d ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
};

/** One calendar sheet: glyph, month title, thin rule and the date grid. */
export const CalendarPage: React.FC<{spec: PageSpec; year: number; t: number}> = ({spec, year, t}) => {
  const isCover = spec.month === null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${C.paper} 0%, ${C.paper} 70%, ${C.offWhite} 100%)`,
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', left: (PAGE_W - 210) / 2, top: isCover ? 150 : 72}}>
        <Glyph kind={spec.kind} size={210} t={t} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: isCover ? 420 : 322,
          width: '100%',
          textAlign: 'center',
          fontSize: isCover ? 64 : 50,
          fontWeight: 800,
          letterSpacing: isCover ? '0.2em' : '0.14em',
          color: C.slate,
          paddingLeft: isCover ? '0.2em' : '0.14em',
        }}
      >
        {spec.label}
      </div>
      {isCover ? (
        <div
          style={{
            position: 'absolute',
            top: 512,
            width: '100%',
            textAlign: 'center',
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '0.4em',
            paddingLeft: '0.4em',
            color: C.haze,
          }}
        >
          {year}
        </div>
      ) : (
        <>
          <div style={{position: 'absolute', top: 410, left: 60, right: 60, height: 2, background: C.hazeLight}} />
          <div
            style={{
              position: 'absolute',
              top: 422,
              width: '100%',
              textAlign: 'center',
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '0.3em',
              paddingLeft: '0.3em',
              color: C.haze,
            }}
          >
            {year}
          </div>
          <MonthGrid year={year} month={spec.month as number} />
        </>
      )}
    </div>
  );
};

/** The back of a sheet, seen while it swings over the binding. */
export const PageBack: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(180deg, ${C.paperBack} 0%, ${C.sandLight} 100%)`,
    }}
  />
);
