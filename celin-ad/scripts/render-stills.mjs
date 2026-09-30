// Renders PNG stills for review. Bundles once, then renders each frame.
//   node scripts/render-stills.mjs                 -> frames 140 260 430 into out/stills
//   node scripts/render-stills.mjs 0 60 118        -> any frames
//   OUT_DIR=somewhere node scripts/render-stills.mjs 140
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const frames = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
const list = frames.length ? frames : [140, 260, 430];
const outDir = process.env.OUT_DIR ?? 'out/stills';
const prefix = process.env.PREFIX ?? 'celin-ad-frame-';
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const composition = await selectComposition({serveUrl, id: 'CelinAd'});
for (const frame of list) {
  const output = path.join(outDir, `${prefix}${frame}.png`);
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'png', overwrite: true});
  console.log('wrote', output);
}
