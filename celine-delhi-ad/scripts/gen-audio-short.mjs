// Score + sound design for the 20s Celine short, synced to the beat sheet in src/short/Short.tsx (30fps).
import fs from "node:fs";

const SR = 44100, DUR = 20, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const F = (f) => f / 30; // frame -> seconds
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let s = 99991;
const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;

const add = (t0, len, fn, pan = 0.5, gain = 1) => {
  const i0 = Math.max(0, Math.floor(t0 * SR)), i1 = Math.min(N, Math.floor((t0 + len) * SR));
  for (let i = i0; i < i1; i++) {
    const v = fn((i - i0) / SR) * gain;
    L[i] += v * (1 - pan) * 2 * 0.5 + v * 0.5 * (1 - Math.abs(pan - 0.5));
    R[i] += v * pan * 2 * 0.5 + v * 0.5 * (1 - Math.abs(pan - 0.5));
  }
};
const sine = (f) => (t) => Math.sin(2 * Math.PI * f * t);

// --- SFX ---
const whoosh = (t0, g = 0.35) => {
  let lp = 0;
  add(t0 - 0.18, 0.45, (t) => {
    lp += (rnd() - lp) * (0.05 + 0.4 * Math.sin(Math.PI * t / 0.45));
    return lp * Math.sin(Math.PI * t / 0.45) ** 2;
  }, 0.5, g);
};
const boom = (t0, g = 0.9) => add(t0, 0.8, (t) => Math.sin(2 * Math.PI * (55 - 25 * t) * t) * Math.exp(-t * 5) + rnd() * 0.15 * Math.exp(-t * 30), 0.5, g);
const thud = (t0, g = 0.6) => add(t0, 0.35, (t) => Math.sin(2 * Math.PI * (110 * Math.exp(-t * 12) + 45) * t) * Math.exp(-t * 11) + rnd() * 0.3 * Math.exp(-t * 40), 0.5, g);
const ping = (t0, g = 0.22) => { add(t0, 0.6, (t) => sine(hz(88))(t) * Math.exp(-t * 7), 0.5, g); add(t0 + 0.07, 0.6, (t) => sine(hz(95))(t) * Math.exp(-t * 7), 0.5, g); };
const blip = (t0, m, g = 0.12) => add(t0, 0.07, (t) => (Math.sin(2 * Math.PI * hz(m) * t) > 0 ? 1 : -1) * Math.exp(-t * 20), 0.5, g);
const click = (t0, g = 0.25) => add(t0, 0.03, (t) => rnd() * Math.exp(-t * 200), 0.5, g);
const pop = (t0, g = 0.35) => add(t0, 0.18, (t) => Math.sin(2 * Math.PI * (300 + 900 * t) * t) * Math.exp(-t * 22), 0.5, g);
const chime = (t0, notes, g = 0.12) => notes.forEach((m, k) => add(t0 + k * 0.06, 1.6, (t) => (sine(hz(m))(t) + 0.3 * sine(hz(m) * 2)(t)) * Math.exp(-t * 2.5), 0.3 + k * 0.15, g));

// --- ACT 1 (0 -> 6.2s): tension bed ---
const act1End = F(186);
add(0, act1End, (t) => { // low drone
  const e = Math.min(1, t / 0.4) * Math.min(1, (act1End - t) / 0.05);
  return (sine(hz(38))(t) + 0.5 * sine(hz(45))(t) + 0.3 * sine(hz(50) * 1.003)(t)) * e * 0.12;
});
for (let b = 0; b < act1End; b += 0.75) { // heartbeat
  add(b, 0.2, (t) => sine(60)(t) * Math.exp(-t * 18), 0.5, 0.35);
  add(b + 0.22, 0.2, (t) => sine(55)(t) * Math.exp(-t * 18), 0.5, 0.25);
}
for (let f = 4; f < 34; f += 2) blip(F(f), 60 + (f - 4) * 0.8, 0.05); // AQI counter ticks
boom(F(34));
whoosh(F(48)); ping(F(52)); ping(F(72));
whoosh(F(108), 0.3);
[108, 125, 142, 159].forEach((f, i) => thud(F(f), 0.55 + i * 0.08));

// --- "Wait." (6.2s): everything drops, then the mascot arrives ---
[0, 1, 2, 3].forEach((k) => blip(F(200) + k * 0.06, 72 + [0, 4, 7, 12][k], 0.1));
for (let f = 208; f < 238; f += 1.6) click(F(f) + rnd() * 0.01, 0.12);
whoosh(F(238), 0.25);
chime(F(252), [79, 84, 88]);

// --- ACT 2 (10s -> 20s): warm, hopeful groove @ 108 BPM ---
const bpm = 108, beat = 60 / bpm, t2 = F(300);
const prog = [[60, 64, 67, 72], [55, 62, 67, 71], [57, 60, 64, 69], [53, 60, 65, 69]]; // C G Am F
const bars = Math.ceil((DUR - t2) / (beat * 4));
for (let b = 0; b < bars; b++) {
  const bt = t2 + b * beat * 4;
  const ch = prog[b % 4];
  ch.forEach((m, k) => add(bt, beat * 4 + 0.3, (t) => {
    const e = Math.min(1, t / 0.25) * Math.exp(-t * 0.35);
    return (sine(hz(m))(t) + 0.4 * sine(hz(m) * 1.004)(t)) * e;
  }, 0.25 + k * 0.17, 0.035));
  add(bt, beat * 4, (t) => sine(hz(ch[0] - 24))(t) * Math.min(1, t / 0.02) * Math.exp(-(t % beat) * 2), 0.5, 0.18); // bass
  for (let q = 0; q < 4; q++) {
    const qt = bt + q * beat;
    add(qt, 0.35, (t) => Math.sin(2 * Math.PI * (120 * Math.exp(-t * 20) + 48) * t) * Math.exp(-t * 9), 0.5, 0.5); // kick
    if (q % 2 === 1) add(qt, 0.2, (t) => rnd() * Math.exp(-t * 25), 0.5, 0.16); // clap
    add(qt + beat / 2, 0.06, (t) => rnd() * Math.exp(-t * 80), 0.7, 0.07); // hat
  }
  // plucky melody
  const mel = [72, 76, 79, 76, 74, 79, 83, 79, 72, 76, 81, 76, 72, 77, 81, 84];
  for (let q = 0; q < 4; q++) {
    const m = mel[(b * 4 + q) % mel.length];
    add(bt + q * beat, 0.8, (t) => (sine(hz(m))(t) + 0.3 * sine(hz(m) * 2)(t)) * Math.exp(-t * 5), 0.6, 0.06);
  }
}
whoosh(F(300), 0.35); boom(F(300), 0.5);
[318, 330, 342, 354].forEach((f) => { pop(F(f)); click(F(f) - 0.02, 0.2); });
whoosh(F(405), 0.3); ping(F(427));
whoosh(F(480), 0.3);
click(F(542), 0.35); chime(F(543), [84, 88, 91, 96], 0.14);

// master
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR, g = Math.min(1, t / 0.05) * Math.min(1, (DUR - t) / 1.2);
  L[i] = Math.tanh(L[i] * g * 1.2); R[i] = Math.tanh(R[i] * g * 1.2);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4);
}
fs.writeFileSync(new URL("../public/short-music.wav", import.meta.url), buf);
console.log("wrote public/short-music.wav");
