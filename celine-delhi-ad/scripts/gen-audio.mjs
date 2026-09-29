// Generates a soft, emotional score (pads + piano plucks + wind + shimmer) as public/music.wav.
// Pure JS so the project has no audio-asset dependency.
import fs from "node:fs";

const SR = 44100;
const DUR = 18;
const N = SR * DUR;
const L = new Float32Array(N);
const R = new Float32Array(N);

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const env = (t, a, d, len) => (t < 0 || t > len ? 0 : Math.min(1, t / a) * Math.min(1, (len - t) / d));

// Seeded noise
let s = 1234567;
const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;

// 1) Wind / smog bed: brown noise, fades out around the reveal (10s)
let b = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  b = (b + 0.02 * rnd()) * 0.995;
  const g = Math.min(1, t / 1.5) * (t < 9.5 ? 1 : Math.max(0, 1 - (t - 9.5) / 1.5));
  const wob = 0.7 + 0.3 * Math.sin(t * 0.9);
  L[i] += b * 0.9 * g * wob;
  R[i] += b * 0.9 * g * (1.4 - wob);
}

// 2) Pads: Am -> F -> C -> G -> C (warm resolve)
const chords = [
  { at: 0.0, len: 5.2, notes: [45, 57, 60, 64] },
  { at: 4.8, len: 5.4, notes: [41, 57, 60, 65] },
  { at: 9.8, len: 4.4, notes: [48, 60, 64, 67, 72] },
  { at: 13.8, len: 2.2, notes: [43, 59, 62, 67] },
  { at: 15.6, len: 2.4, notes: [48, 60, 64, 67, 76] },
];
for (const c of chords) {
  const bright = c.at >= 9.8 ? 1 : 0.55;
  for (const m of c.notes) {
    const f = hz(m);
    for (let i = Math.floor(c.at * SR); i < Math.min(N, (c.at + c.len) * SR); i++) {
      const t = i / SR - c.at;
      const e = env(t, 1.2, 1.4, c.len) * 0.045;
      const v =
        Math.sin(2 * Math.PI * f * t) +
        0.5 * Math.sin(2 * Math.PI * f * 1.003 * t) +
        0.25 * bright * Math.sin(2 * Math.PI * f * 2 * t);
      L[i] += v * e;
      R[i] += (Math.sin(2 * Math.PI * f * 0.997 * t) + 0.5 * v) * e * 0.8;
    }
  }
}

// 3) Piano-ish plucks: gentle melody
const melody = [
  [0.6, 69], [1.7, 72], [2.8, 71], [3.9, 67],
  [5.0, 65], [6.1, 69], [7.2, 72], [8.3, 74],
  [10.1, 76], [10.8, 79], [11.6, 84], [12.6, 79],
  [14.0, 74], [15.0, 79], [15.8, 76], [16.4, 72],
];
for (const [at, m] of melody) {
  const f = hz(m);
  const len = 2.6;
  for (let i = Math.floor(at * SR); i < Math.min(N, (at + len) * SR); i++) {
    const t = i / SR - at;
    const e = Math.min(1, t / 0.005) * Math.exp(-t * 2.2) * 0.11;
    const v = Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 4) + 0.12 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 6);
    const pan = 0.5 + 0.25 * Math.sin(m);
    L[i] += v * e * (1 - pan) * 1.4;
    R[i] += v * e * pan * 1.4;
  }
}

// 4) Shimmer + swell at the tablet reveal (~9.6s -> 10s)
for (let i = Math.floor(8.6 * SR); i < Math.floor(12.5 * SR); i++) {
  const t = i / SR;
  const sw = t < 10 ? Math.pow((t - 8.6) / 1.4, 2) : Math.exp(-(t - 10) * 1.6);
  const f = 600 + 900 * Math.min(1, (t - 8.6) / 1.4);
  const v = Math.sin(2 * Math.PI * f * t) * 0.02 * sw + rnd() * 0.012 * sw;
  L[i] += v;
  R[i] += v * 0.9;
}
for (const m of [84, 88, 91, 96]) {
  const f = hz(m);
  for (let i = Math.floor(10 * SR); i < Math.floor(13 * SR); i++) {
    const t = i / SR - 10;
    const e = Math.exp(-t * 1.8) * 0.03;
    L[i] += Math.sin(2 * Math.PI * f * t) * e;
    R[i] += Math.sin(2 * Math.PI * f * 1.002 * t) * e;
  }
}

// Master: fade in/out, normalize
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 0.8) * Math.min(1, (DUR - t) / 1.5);
  L[i] *= g; R[i] *= g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.8 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
}
fs.writeFileSync(new URL("../public/music.wav", import.meta.url), buf);
console.log("wrote public/music.wav");
