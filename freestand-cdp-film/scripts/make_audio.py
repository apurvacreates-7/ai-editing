"""Synthesize the film's score and stop-motion foley.

  public/audio/score.wav   120 BPM keynote bed, arranged bar-by-bar to the scene table
  public/sfx/*.wav         taps, drops, slides, stamp, pops, clicks, chime, switch

Everything is generated from code, so the soundtrack is royalty-free and can be
re-arranged whenever the edit changes. Run: python3 scripts/make_audio.py
"""
import os
import re

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
ROOT = os.path.join(os.path.dirname(__file__), "..")
rng = np.random.default_rng(2026)


# ---------------------------------------------------------------- helpers
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR / 2 - 100)], "band", fs=SR, output="sos"), x)


def env_exp(n, tau, attack=0.002):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / tau)


def noise(n):
    return rng.standard_normal(n)


def write(path, x, peak=None):
    if x.ndim == 1:
        x = x[:, None]
    if peak is not None:
        x = x / (np.max(np.abs(x)) + 1e-9) * peak
    x = np.clip(x, -1, 1)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


# ---------------------------------------------------------------- foley
def sfx_tap(k):
    n = int(0.16 * SR)
    f = [230, 260, 205, 245][k]
    body = np.sin(2 * np.pi * f * t_axis(0.16)) * env_exp(n, 0.028, 0.0008)
    click = bp(noise(n), 900 + 300 * k, 4200) * env_exp(n, 0.006, 0.0003)
    return 0.8 * body + 0.9 * click


def sfx_drop(k):
    n = int(0.32 * SR)
    t = t_axis(0.32)
    thump = np.sin(2 * np.pi * (105 + 12 * k) * t) * env_exp(n, 0.06, 0.001)
    slap = lp(noise(n), 1700 + 250 * k) * env_exp(n, 0.035, 0.0006)
    air = bp(noise(n), 180, 900) * env_exp(n, 0.09, 0.004) * 0.5
    return 0.9 * thump + 1.1 * slap + air


def sfx_slide(k):
    dur = 0.34 + 0.06 * k
    n = int(dur * SR)
    t = t_axis(dur)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    grain = 1 + 0.35 * lp(noise(n), 60)
    return bp(noise(n), 1800 + 300 * k, 7000) * shape * grain


def sfx_paper(k):
    dur = 0.22
    n = int(dur * SR)
    t = t_axis(dur)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    crinkle = (lp(noise(n), 180 + 40 * k) > 0.25).astype(float) * 0.6 + 0.4
    return bp(noise(n), 1200, 6000) * shape * crinkle


def sfx_stamp():
    n = int(0.5 * SR)
    t = t_axis(0.5)
    low = np.sin(2 * np.pi * 78 * t) * env_exp(n, 0.11, 0.001)
    knock = np.sin(2 * np.pi * 410 * t) * env_exp(n, 0.035, 0.0005)
    click = hp(noise(n), 1500) * env_exp(n, 0.004, 0.0002)
    rock = np.zeros(n)
    d = int(0.034 * SR)
    rock[d:] = (np.sin(2 * np.pi * 380 * t[: n - d]) * env_exp(n - d, 0.02, 0.0005)) * 0.35
    return 1.0 * low + 0.7 * knock + 0.5 * click + rock


def sfx_pop(k):
    dur = 0.14
    n = int(dur * SR)
    t = t_axis(dur)
    f0 = [880, 940, 830][k]
    f = f0 * (0.62 + 0.38 * np.exp(-t / 0.02))
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * env_exp(n, 0.05, 0.0015) + 0.15 * hp(noise(n), 3000) * env_exp(n, 0.003)


def sfx_tick(k):
    n = int(0.08 * SR)
    t = t_axis(0.08)
    ping = np.sin(2 * np.pi * [2500, 2700, 2350][k] * t) * env_exp(n, 0.012, 0.0003)
    return 0.6 * ping + 0.5 * hp(noise(n), 4000) * env_exp(n, 0.0025, 0.0002)


def sfx_click():
    n = int(0.07 * SR)
    t = t_axis(0.07)
    ping = np.sin(2 * np.pi * 1850 * t) * env_exp(n, 0.014, 0.0003)
    return 0.7 * ping + 0.8 * bp(noise(n), 2000, 6000) * env_exp(n, 0.004, 0.0002)


def sfx_ding():
    dur = 1.8
    n = int(dur * SR)
    t = t_axis(dur)
    a = np.sin(2 * np.pi * midi(86) * t) * env_exp(n, 0.55, 0.003)  # D6
    b = np.sin(2 * np.pi * midi(93) * t) * env_exp(n, 0.35, 0.003)  # A6
    c = np.sin(2 * np.pi * midi(86) * 2.76 * t) * env_exp(n, 0.08, 0.002)
    return 0.8 * a + 0.45 * b + 0.12 * c


def sfx_switch():
    n = int(0.12 * SR)
    t = t_axis(0.12)
    clack = hp(noise(n), 2500) * env_exp(n, 0.003, 0.0002)
    ping = np.sin(2 * np.pi * 3200 * t) * env_exp(n, 0.01, 0.0003)
    body = np.sin(2 * np.pi * 160 * t) * env_exp(n, 0.02, 0.0005)
    return clack + 0.5 * ping + 0.6 * body


def sfx_thud():
    n = int(0.7 * SR)
    t = t_axis(0.7)
    f = 48 + 60 * np.exp(-t / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.2, 0.002)
    slap = lp(noise(n), 500) * env_exp(n, 0.06, 0.001)
    return boom + 0.8 * slap


def sfx_whoosh():
    dur = 0.45
    n = int(dur * SR)
    t = t_axis(dur)
    shape = np.sin(np.pi * t / dur) ** 2
    return bp(noise(n), 500, 5000) * shape


def make_sfx():
    out = os.path.join(ROOT, "public", "sfx")
    for k in range(4):
        write(f"{out}/tap-{k}.wav", sfx_tap(k), 0.42)
    for k in range(3):
        write(f"{out}/drop-{k}.wav", sfx_drop(k), 0.55)
        write(f"{out}/slide-{k}.wav", sfx_slide(k), 0.3)
        write(f"{out}/paper-{k}.wav", sfx_paper(k), 0.3)
        write(f"{out}/pop-{k}.wav", sfx_pop(k), 0.32)
        write(f"{out}/tick-{k}.wav", sfx_tick(k), 0.3)
    write(f"{out}/stamp.wav", sfx_stamp(), 0.8)
    write(f"{out}/click.wav", sfx_click(), 0.4)
    write(f"{out}/ding.wav", sfx_ding(), 0.34)
    write(f"{out}/switch.wav", sfx_switch(), 0.5)
    write(f"{out}/thud.wav", sfx_thud(), 0.7)
    write(f"{out}/whoosh.wav", sfx_whoosh(), 0.3)
    print("foley written to", os.path.abspath(out))


# ---------------------------------------------------------------- score
def scene_bars():
    src = open(os.path.join(ROOT, "src", "timeline.ts")).read()
    scenes = re.findall(r"\{id: '([a-z-]+)', bars: (\d+)\}", src)
    out, b = {}, 0
    for sid, bars in scenes:
        out[sid] = (b, b + int(bars))
        b += int(bars)
    return out, b


CHORDS = {
    # voicings as MIDI notes, bass root separately
    "Dmaj9": ([50, 57, 61, 64, 66], 38),
    "Bm9": ([47, 54, 57, 61, 62], 35),
    "Gmaj9": ([43, 50, 54, 57, 59], 31),
    "A6": ([45, 52, 57, 59, 61, 66], 33),
    "Em9": ([40, 47, 54, 55, 59, 62], 40),
    "A7sus4": ([45, 52, 55, 57, 62, 64], 33),
}


def progression(sb):
    seq = {}

    def put(scene, names):
        a, b = sb[scene]
        for i in range(b - a):
            seq[a + i] = names[i % len(names)]

    put("cold-open", ["Bm9", "Gmaj9", "Em9", "A7sus4"])
    put("reveal", ["Dmaj9", "Bm9", "Gmaj9"])
    put("loop", ["A6", "Dmaj9", "Bm9"])
    for s in ["launch", "operate", "consumers"]:
        put(s, ["Gmaj9", "A6", "Dmaj9", "Bm9"])
    put("identity", ["Em9", "Gmaj9", "A6"])
    put("data", ["Dmaj9", "Bm9", "Gmaj9", "A6"])
    put("measure", ["Dmaj9", "Bm9", "Gmaj9", "A6"])
    put("next", ["Em9", "A7sus4"])
    put("finale", ["Dmaj9", "Gmaj9", "Dmaj9", "Dmaj9"])
    return seq


def pad_voice(freq, dur, cutoff, detune_cents=7):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for side, cents in ((0, -detune_cents), (1, detune_cents)):
        f = freq * 2 ** (cents / 1200)
        ph = rng.uniform(0, 2 * np.pi)
        h = 1
        sig = np.zeros(n)
        while f * h < min(6500, cutoff * 3.2):
            w = (1 / h) / np.sqrt(1 + (f * h / cutoff) ** 4)
            sig += w * np.sin(2 * np.pi * f * h * t + ph * h)
            h += 1
        out[:, side] = sig
    return out


def adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[n - nr :] *= np.linspace(1, 0, nr)
    return e


def marimba(freq, dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.32)
    s += 0.22 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t / 0.05)
    s += 0.06 * np.sin(2 * np.pi * freq * 9.2 * t) * np.exp(-t / 0.015)
    att = np.clip(t / 0.002, 0, 1)
    return vel * s * att


def bell(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t)
    s = np.sin(2 * np.pi * freq * vib * t) + 0.25 * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t / 0.4)
    return s * adsr(n, 0.02, min(0.5, dur * 0.6)) * np.exp(-t / 1.6)


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 54 + 70 * np.exp(-t / 0.035)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    s += 0.25 * hp(noise(n), 3000) * np.exp(-t / 0.004)
    return np.tanh(1.4 * s)


def snap():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for i, d in enumerate([0, 0.009, 0.019]):
        k = int(d * SR)
        s[k:] += bp(noise(n - k), 1100, 3800) * np.exp(-t[: n - k] / (0.012 if i < 2 else 0.07))
    return s


def shaker():
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    return hp(noise(n), 6500) * np.clip(t / 0.006, 0, 1) * np.exp(-t / 0.02)


def cymbal():
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    return hp(noise(n), 5000) * np.exp(-t / 0.7) * np.clip(t / 0.003, 0, 1)


def reverb_ir(rt60=2.0):
    n = int(rt60 * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.9 * t / rt60)
    ir = np.stack([lp(noise(n), 6000) * decay, lp(noise(n), 6000) * decay], axis=1)
    ir[: int(0.012 * SR)] = 0
    return ir / np.sqrt(np.sum(ir**2, axis=0))


def make_score():
    sb, total_bars = scene_bars()
    seq = progression(sb)
    dur = total_bars * BAR + 3.0
    N = int(dur * SR)
    dry = np.zeros((N, 2))
    send = np.zeros((N, 2))

    def add(buf, x, at, gain=1.0, pan=0.0):
        i = int(at * SR)
        if i >= N:
            return
        x = x[: N - i]
        if x.ndim == 1:
            left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            buf[i : i + len(x), 0] += gain * x * left * 1.414
            buf[i : i + len(x), 1] += gain * x * right * 1.414
        else:
            buf[i : i + len(x)] += gain * x

    def in_scene(bar, *names):
        return any(sb[s][0] <= bar < sb[s][1] for s in names)

    cold = sb["cold-open"]
    fin = sb["finale"]
    reveal_bar = sb["reveal"][0]
    KICK, SNAP, SHAKE, CYM = kick(), snap(), shaker(), cymbal()

    for bar in range(total_bars):
        name = seq[bar]
        notes, root = CHORDS[name]
        t0 = bar * BAR
        # --- pad: dark and low in the cold open, opens up once the product arrives
        if bar < reveal_bar:
            cutoff, gain = 800 + 180 * (bar - cold[0]), 0.115 if bar < cold[1] - 1 else 0.07
        elif in_scene(bar, "identity", "next"):
            cutoff, gain = 1500, 0.085
        elif bar >= fin[0]:
            cutoff, gain = 1900, 0.095
        else:
            cutoff, gain = 3100, 0.075
        start = t0 + (4 / 12 if bar == cold[0] else 0)  # pad enters with the light switch
        pdur = BAR + 0.9 if bar < total_bars - 1 else BAR + 2.8
        for m in [m for m in notes if m >= 50]:
            v = pad_voice(midi(m), pdur, cutoff) * adsr(int(pdur * SR), 0.35 if bar != reveal_bar else 0.02, 0.9)[:, None]
            add(dry, v, start, gain / 5 * 2.2)
            add(send, v, start, gain / 5 * 1.2)

        # --- marimba arpeggio: the clockwork of the set
        tones = sorted(set(m + 24 for m in notes[1:]))
        pattern = [0, 2, 1, 3, 2, 1, 3, 2]
        if bar < reveal_bar:
            steps = [0, 2, 4, 6] if bar < cold[1] - 1 else []  # quarter notes, silent before the reveal
            vel = 0.55
        elif bar >= fin[0] + 1:
            steps = [0, 3, 6] if bar < total_bars - 1 else [0]
            vel = 0.5
        else:
            steps = range(8)
            vel = 0.7
        for s in steps:
            f = midi(tones[pattern[s] % len(tones)])
            accent = 1.0 if s % 2 == 0 else 0.72
            x = marimba(f, 0.9, vel * accent)
            pan = -0.35 if s % 2 else 0.35
            add(dry, x, t0 + s * BEAT / 2, 0.115, pan)
            add(send, x, t0 + s * BEAT / 2, 0.06, pan)

        # --- bass
        if reveal_bar <= bar < fin[0] + 1:
            fr = midi(root + 12)
            pat = [(0, 1.4, 1.0), (2, 0.9, 0.85), (3.5, 0.4, 0.6)]
            if in_scene(bar, "identity"):
                pat = [(0, 3.8, 0.9)]
            if bar == fin[0]:
                pat = [(0, 3.8, 1.0)]
            for beat, length, v in pat:
                n = int(length * BEAT * SR)
                tt = np.arange(n) / SR
                b = np.sin(2 * np.pi * fr * tt) + 0.35 * np.sin(4 * np.pi * fr * tt) + 0.12 * np.sin(6 * np.pi * fr * tt)
                b = np.tanh(1.5 * b) * adsr(n, 0.006, 0.06)
                add(dry, b, t0 + beat * BEAT, 0.115 * v)

        # --- drums
        grooving = reveal_bar <= bar < fin[0] and not in_scene(bar, "identity")
        if bar == reveal_bar or bar == fin[0]:
            add(dry, KICK, t0, 0.4)
            add(dry, CYM, t0, 0.06)
            add(send, CYM, t0, 0.05)
        if grooving:
            kicks = [0, 2] if not in_scene(bar, "reveal") else [0]
            if in_scene(bar, "data", "measure", "operate"):
                kicks = [0, 2, 3.5]
            for k in kicks:
                add(dry, KICK, t0 + k * BEAT, 0.25)
            if not in_scene(bar, "reveal"):
                for k in (1, 3):
                    add(dry, SNAP, t0 + k * BEAT, 0.14, 0.1)
                    add(send, SNAP, t0 + k * BEAT, 0.07, 0.1)
                for s16 in range(16):
                    v = 0.1 if s16 % 4 == 2 else 0.055
                    add(dry, SHAKE, t0 + s16 * BEAT / 4 + (0.012 if s16 % 2 else 0), v, 0.4)
        # scene downbeats get a soft cymbal swell so the cuts land
        if any(sb[s][0] == bar for s in sb) and reveal_bar < bar < fin[0]:
            add(dry, CYM, t0, 0.055)
            add(send, CYM, t0, 0.05)

        # --- lead bell over data + measure
        if in_scene(bar, "data", "measure"):
            motif = {
                "Dmaj9": [(0, 1, 78), (1, 0.5, 76), (1.5, 1.5, 74)],
                "Bm9": [(0, 1, 74), (1, 1, 73), (2, 2, 71)],
                "Gmaj9": [(0, 1.5, 83), (1.5, 0.5, 81), (2, 2, 78)],
                "A6": [(0, 1.5, 76), (1.5, 0.5, 78), (2, 2, 81)],
            }[name]
            for beat, length, m in motif:
                x = bell(midi(m), length * BEAT + 0.6)
                add(dry, x, t0 + beat * BEAT, 0.035, -0.15)
                add(send, x, t0 + beat * BEAT, 0.045, -0.15)

    # --- riser into the reveal and into the finale: a noise band sweeping upward
    def riser(length):
        n = int(length * SR)
        p_ = np.arange(n) / SR / length
        src = noise(n)
        logc = np.log(400 + 5600 * p_**2)
        out = np.zeros(n)
        for c in np.geomspace(300, 7000, 16):
            w = np.exp(-0.5 * ((np.log(c) - logc) / 0.3) ** 2)
            out += bp(src, c / 1.2, c * 1.2, 2) * w
        return out * p_**2.2

    for end_bar in (reveal_bar, fin[0]):
        r = riser(BAR)
        add(dry, r, end_bar * BAR - BAR, 0.1)
        add(send, r, end_bar * BAR - BAR, 0.07)

    # --- impact on the reveal
    n = int(2.5 * SR)
    tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 50 * np.exp(-tt / 0.08)) / SR) * np.exp(-tt / 0.9)
    add(dry, boom, reveal_bar * BAR, 0.2)
    add(dry, boom, fin[0] * BAR, 0.16)

    ir = reverb_ir()
    wet = np.stack([fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], axis=1)
    mix = dry + 0.55 * wet
    mix = hp(mix.T, 34).T
    # gentle bus glue, then a clean fade at the very end
    mix = np.tanh(1.2 * mix) / np.tanh(1.2)
    end = total_bars * BAR
    fade = np.ones(N)
    fe = int((end - 0.5) * SR)
    fade[fe:] = np.clip(1 - (np.arange(N - fe) / (2.8 * SR)), 0, 1) ** 1.5
    mix *= fade[:, None]
    mix = mix[: int((end + 0.0) * SR)]
    try:
        import pyloudnorm as pyln

        meter = pyln.Meter(SR)
        loud = meter.integrated_loudness(mix)
        mix *= 10 ** ((-19.0 - loud) / 20)
        print(f"score loudness {loud:.1f} LUFS -> -19.0 LUFS")
    except Exception as e:  # noqa: BLE001
        print("loudness meter unavailable:", e)
    peak = np.max(np.abs(mix))
    if peak > 0.89:
        mix *= 0.89 / peak
    write(os.path.join(ROOT, "public", "audio", "score.wav"), mix)
    print(f"score: {total_bars} bars, {len(mix) / SR:.2f}s, peak {20 * np.log10(np.max(np.abs(mix))):.1f} dBFS")


if __name__ == "__main__":
    make_sfx()
    make_score()
