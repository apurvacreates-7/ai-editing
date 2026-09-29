// Render review stills for a composition and tile them into a contact sheet.
// usage: node scripts/stills.mjs <compositionId> <outDir> <frame,frame,...> [scale]
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const [, , compId, outDir, framesArg, scaleArg] = process.argv;
const frames = framesArg.split(',').map((f) => Number(f));
const scale = Number(scaleArg ?? 0.5);
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const browser = await openBrowser('chrome', {browserExecutable});
const composition = await selectComposition({serveUrl, id: compId, puppeteerInstance: browser, browserExecutable});
for (const frame of frames) {
  const output = path.join(outDir, `${compId}-${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, scale, puppeteerInstance: browser, browserExecutable});
  console.log('wrote', output);
}
await browser.close({silent: true});
