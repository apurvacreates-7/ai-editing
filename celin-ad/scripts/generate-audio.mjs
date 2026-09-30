// Generates public/audio/soundtrack.wav: a soft, low ambient pad (no drums)
// with a single warm chime on frame 300. Built with the Web Audio API
// (OfflineAudioContext via node-web-audio-api), so it renders offline and
// identically every time.
//
//   npm run audio
//
// Timings come from src/config.ts so the chime follows TIMING.chime.
import fs from 'node:fs';
import path from 'node:path';
import {OfflineAudioContext} from 'node-web-audio-api';
import {VIDEO, TIMING, AUDIO} from '../src/config.ts';

const SR = 48000;
const DUR = VIDEO.durationInFrames / VIDEO.fps; // 15 s
const LEN = Math.round(SR * DUR);
const sec = (frame) => frame / VIDEO.fps;
const TARGET_LUFS = -19; // quiet bed; a VO can sit on top later
const CEILING_DB = -1.5;

const ctx = new OfflineAudioContext(2, LEN, SR);
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// deterministic noise
let seed = 0x1234567;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

/* ---------------- automation ----------------
 * Every envelope is precomputed in JS and scheduled with setValueCurveAtTime.
 * (node-web-audio-api mis-evaluates setTargetAtTime when it follows a
 * setValueAtTime after a gap, so we avoid event chains entirely.)
 */
const CURVE_RATE = 400; // points per second
const automate = (param, fn, t0 = 0, t1 = DUR) => {
  const n = Math.max(2, Math.ceil((t1 - t0) * CURVE_RATE) + 1);
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) curve[i] = fn(t0 + (i / (n - 1)) * (t1 - t0));
  param.setValueCurveAtTime(curve, t0, t1 - t0);
};
/** Exponential "approach" chain, like successive setTargetAtTime calls. */
const chain = (v0, events) => {
  const ev = [...events].sort((a, b) => a[0] - b[0]);
  return (t) => {
    let v = v0;
    let last = 0;
    let target = v0;
    let tau = 1;
    for (const [te, tg, tu] of ev) {
      if (te > t) break;
      v = target + (v - target) * Math.exp(-(te - last) / tau);
      last = te;
      target = tg;
      tau = tu;
    }
    return target + (v - target) * Math.exp(-(t - last) / tau);
  };
};
const smoothstep = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/* ---------------- buses ---------------- */
const compressor = ctx.createDynamicsCompressor();
compressor.threshold.value = -20;
compressor.knee.value = 12;
compressor.ratio.value = 2.5;
compressor.attack.value = 0.04;
compressor.release.value = 0.35;
compressor.connect(ctx.destination);

const master = ctx.createGain();
automate(master.gain, (t) => smoothstep(0, 0.5, t) * (1 - smoothstep(DUR - 0.95, DUR - 0.02, t)));
master.connect(compressor);

// synthetic hall reverb: decaying, low-passed stereo noise
const makeImpulse = (seconds, t60) => {
  const n = Math.round(SR * seconds);
  const buf = ctx.createBuffer(2, n, SR);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    const a = 1 - Math.exp((-2 * Math.PI * 4200) / SR);
    const pre = Math.round(SR * 0.022);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const x = i < pre ? 0 : (rand() * 2 - 1) * Math.exp((-6.9 * t) / t60);
      lp += a * (x - lp);
      d[i] = lp;
    }
  }
  return buf;
};
const reverb = ctx.createConvolver();
reverb.buffer = makeImpulse(4.2, 3.4);
const reverbOut = ctx.createGain();
reverbOut.gain.value = 0.55;
reverb.connect(reverbOut);
reverbOut.connect(master);

/* ---------------- pad ---------------- */
const padFilter = ctx.createBiquadFilter();
padFilter.type = 'lowpass';
padFilter.Q.value = 0.55;
const padBus = ctx.createGain();
padBus.gain.value = 1;
padBus.connect(padFilter);
padFilter.connect(master);
const padSend = ctx.createGain();
padSend.gain.value = 0.45;
padFilter.connect(padSend);
padSend.connect(reverb);

// Filter follows the story: open (monsoon), closing (smog), warm (city),
// muffled (smog again), opening like dawn (Celin), bright (end card).
automate(
  padFilter.frequency,
  chain(950, [
    [0.2, 1350, 0.8],
    [sec(TIMING.flips[2]), 640, 0.9],
    [sec(TIMING.street.start) - 0.05, 1500, 0.25],
    [sec(TIMING.wipe.start), 520, 0.7],
    [sec(TIMING.chime), 950, 0.5],
    [sec(TIMING.dawn.start), 2500, 0.8],
    [sec(TIMING.endCard) + 0.5, 2300, 1.2],
  ]),
);

// chords (MIDI), in D major: I - vi - IV - ii - Vsus - I
const CHORDS = [
  {t0: 0.0, t1: sec(TIMING.flips[2]) - 0.1, notes: [50, 57, 61, 64, 66], sub: 38},
  {t0: sec(TIMING.flips[2]) - 0.1, t1: sec(TIMING.street.start), notes: [47, 54, 57, 61, 62], sub: 35},
  {t0: sec(TIMING.street.start), t1: sec(TIMING.wipe.start), notes: [43, 50, 54, 57, 59], sub: 31},
  {t0: sec(TIMING.wipe.start), t1: sec(TIMING.chime), notes: [40, 47, 50, 54, 55], sub: 40},
  {t0: sec(TIMING.chime), t1: sec(TIMING.endCard) - 0.4, notes: [45, 52, 57, 62, 64], sub: 33},
  {t0: sec(TIMING.endCard) - 0.4, t1: DUR + 1, notes: [50, 57, 62, 64, 66, 69], sub: 38},
];

const lfo = ctx.createOscillator();
lfo.frequency.value = 0.16;
const lfoDepth = ctx.createGain();
lfoDepth.gain.value = 4; // cents
lfo.connect(lfoDepth);
lfo.start(0);

const voice = (freq, t0, t1, amp, pan, type = 'sawtooth') => {
  const g = ctx.createGain();
  const start = Math.max(0, t0 - 0.35);
  automate(g.gain, chain(0, [[start, amp, t0 < 0.1 ? 0.25 : 0.42], [t1 - 0.1, 0, 0.55]]));
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  g.connect(p);
  p.connect(padBus);
  for (const det of type === 'sawtooth' ? [-7, 6] : [0]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = det;
    lfoDepth.connect(o.detune);
    o.connect(g);
    o.start(start);
    o.stop(Math.min(DUR, t1 + 3.5));
  }
};

CHORDS.forEach((c, ci) => {
  c.notes.forEach((n, i) => {
    const pan = ((i / (c.notes.length - 1)) * 2 - 1) * 0.42;
    voice(midi(n), c.t0, c.t1, 0.022 * (i === 0 ? 1.1 : 1), pan * (ci % 2 ? -1 : 1));
  });
  voice(midi(c.sub), c.t0, c.t1, 0.07, 0, 'sine');
});

/* ---------------- smog "hush" (filtered noise) ---------------- */
const noiseBuf = ctx.createBuffer(2, LEN, SR);
for (let ch = 0; ch < 2; ch++) {
  const d = noiseBuf.getChannelData(ch);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < LEN; i++) {
    const w = rand() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18; // pinkish
  }
}
const noise = ctx.createBufferSource();
noise.buffer = noiseBuf;
const nbp = ctx.createBiquadFilter();
nbp.type = 'bandpass';
nbp.frequency.value = 850;
nbp.Q.value = 0.45;
const ng = ctx.createGain();
automate(
  ng.gain,
  chain(0, [
    [sec(TIMING.flips[3]), 0.05, 0.6],
    [sec(TIMING.street.start) - 0.05, 0, 0.2],
    [sec(TIMING.wipe.start), 0.07, 0.8],
    [sec(TIMING.dawn.start), 0, 0.7],
  ]),
);
noise.connect(nbp);
nbp.connect(ng);
ng.connect(master);
noise.start(0);

/* ---------------- the chime (frame 300) ---------------- */
const chimeBus = ctx.createGain();
chimeBus.gain.value = 1;
chimeBus.connect(master);
const chimeSend = ctx.createGain();
chimeSend.gain.value = 0.7;
chimeBus.connect(chimeSend);
chimeSend.connect(reverb);

const chime = (t, f0, level) => {
  // [ratio, amplitude, T60 seconds]
  const partials = [
    [0.5, 0.2, 3.0],
    [1, 1, 3.6],
    [2, 0.36, 2.2],
    [3.01, 0.14, 1.4],
    [4.17, 0.08, 0.9],
    [5.42, 0.045, 0.6],
  ];
  for (const [ratio, amp, t60] of partials) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f0 * ratio;
    const g = ctx.createGain();
    const atk = 0.008;
    automate(g.gain, (x) => (x < t ? 0 : x < t + atk ? amp * level * Math.pow((x - t) / atk, 2) : amp * level * Math.exp((-(x - t - atk) * 6.9) / t60)), 0, DUR);
    o.connect(g);
    g.connect(chimeBus);
    o.start(t);
    o.stop(Math.min(DUR, t + t60 + 0.5));
  }
  // soft mallet transient
  const src = ctx.createBufferSource();
  const n = Math.round(SR * 0.05);
  const b = ctx.createBuffer(1, n, SR);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (rand() * 2 - 1) * Math.exp(-i / (SR * 0.006));
  src.buffer = b;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = f0 * 3;
  bp.Q.value = 1.2;
  const tg = ctx.createGain();
  tg.gain.value = level * 0.25;
  src.connect(bp);
  bp.connect(tg);
  tg.connect(chimeBus);
  src.start(t);
};
chime(sec(TIMING.chime), midi(74), 0.16); // D5

/* ---------------- render, measure, normalise ---------------- */
const rendered = await ctx.startRendering();
const L = rendered.getChannelData(0);
const R = rendered.getChannelData(1);

// ITU-R BS.1770 integrated loudness (K-weighted, gated)
const kWeight = (x) => {
  const stages = [
    {b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585]},
    {b: [1.0, -2.0, 1.0], a: [-1.99004745483398, 0.99007225036621]},
  ];
  let y = Float64Array.from(x);
  for (const s of stages) {
    const out = new Float64Array(y.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < y.length; i++) {
      const v = s.b[0] * y[i] + s.b[1] * x1 + s.b[2] * x2 - s.a[0] * y1 - s.a[1] * y2;
      x2 = x1; x1 = y[i]; y2 = y1; y1 = v;
      out[i] = v;
    }
    y = out;
  }
  return y;
};
const lufs = (l, r) => {
  const kl = kWeight(l);
  const kr = kWeight(r);
  const block = Math.round(SR * 0.4);
  const hop = Math.round(block / 4);
  const zs = [];
  for (let s = 0; s + block <= kl.length; s += hop) {
    let sl = 0, sr = 0;
    for (let i = s; i < s + block; i++) { sl += kl[i] * kl[i]; sr += kr[i] * kr[i]; }
    zs.push((sl + sr) / block);
  }
  const lk = (z) => -0.691 + 10 * Math.log10(z);
  const abs = zs.filter((z) => lk(z) > -70);
  const rel = lk(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const gated = abs.filter((z) => lk(z) > rel);
  return lk(gated.reduce((a, b) => a + b, 0) / gated.length);
};

const measured = lufs(L, R);
let gain = Math.pow(10, (TARGET_LUFS - measured) / 20);
let peak = 0;
for (let i = 0; i < LEN; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const ceiling = Math.pow(10, CEILING_DB / 20);
if (peak * gain > ceiling) gain = ceiling / peak;

// 16-bit PCM WAV with TPDF dither
const pcm = Buffer.alloc(44 + LEN * 4);
pcm.write('RIFF', 0);
pcm.writeUInt32LE(36 + LEN * 4, 4);
pcm.write('WAVE', 8);
pcm.write('fmt ', 12);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 4, 28);
pcm.writeUInt16LE(4, 32);
pcm.writeUInt16LE(16, 34);
pcm.write('data', 36);
pcm.writeUInt32LE(LEN * 4, 40);
for (let i = 0; i < LEN; i++) {
  for (let c = 0; c < 2; c++) {
    const v = (c === 0 ? L[i] : R[i]) * gain;
    const dither = (rand() - rand()) / 32768;
    const s = Math.max(-1, Math.min(1, v + dither));
    pcm.writeInt16LE(Math.round(s * 32767), 44 + i * 4 + c * 2);
  }
}
const out = path.resolve('public', AUDIO.file);
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, pcm);
const finalLufs = measured + 20 * Math.log10(gain);
console.log(
  `wrote ${out}  ${DUR}s  ${SR}Hz stereo  ~${finalLufs.toFixed(1)} LUFS  peak ${(20 * Math.log10(peak * gain)).toFixed(1)} dBFS  chime @ ${sec(TIMING.chime).toFixed(2)}s`,
);
