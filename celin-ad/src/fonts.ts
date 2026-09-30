import {continueRender, delayRender} from 'remotion';
import w400 from '@fontsource/manrope/files/manrope-latin-400-normal.woff2';
import w500 from '@fontsource/manrope/files/manrope-latin-500-normal.woff2';
import w600 from '@fontsource/manrope/files/manrope-latin-600-normal.woff2';
import w700 from '@fontsource/manrope/files/manrope-latin-700-normal.woff2';
import w800 from '@fontsource/manrope/files/manrope-latin-800-normal.woff2';

/** Geometric sans for headline and body (Manrope, OFL). */
export const FONT = 'Manrope, "Inter", "Helvetica Neue", Arial, sans-serif';

const FILES: Array<[number, string]> = [
  [400, w400],
  [500, w500],
  [600, w600],
  [700, w700],
  [800, w800],
];

let started = false;

/** Blocks rendering until every weight is loaded, so no frame is captured with a fallback font. */
export const ensureFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading Manrope');
  Promise.all(
    FILES.map(([weight, url]) =>
      new FontFace('Manrope', `url(${url}) format('woff2')`, {weight: String(weight), style: 'normal'})
        .load()
        .then((face) => (document.fonts as unknown as {add: (f: FontFace) => void}).add(face)),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error('Font loading failed, falling back to system sans', err);
      continueRender(handle);
    });
};
