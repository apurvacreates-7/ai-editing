// Writes the voice-over guide as SRT (timed to frames 210 to 420).
//   npm run srt            -> out/celin-ad-vo.srt
import fs from 'node:fs';
import path from 'node:path';
import {VIDEO, VO_CUES} from '../src/config.ts';

const stamp = (frame) => {
  const ms = Math.round((frame / VIDEO.fps) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
};

const srt = VO_CUES.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.text}\n`).join('\n');
const out = path.resolve(process.argv[2] ?? 'out/celin-ad-vo.srt');
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, srt);
console.log(`wrote ${out}\n\n${srt}`);
