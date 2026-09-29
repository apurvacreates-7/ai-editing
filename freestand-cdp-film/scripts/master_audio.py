"""Master the rendered mix (score + foley) for web delivery.

Loudness-normalises to -16 LUFS integrated with a transparent lookahead peak
limiter holding true peak under -1 dBTP.
usage: python3 scripts/master_audio.py out/mix.wav out/mix-master.wav
"""
import sys

import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import resample_poly

TARGET_LUFS = -16.0
CEILING_DBTP = -1.0

src, dst = sys.argv[1], sys.argv[2]
sr, x = wavfile.read(src)
x = x.astype(np.float64) / 32768.0
meter = pyln.Meter(sr)


def true_peak_db(y):
    over = resample_poly(y, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(over)) + 1e-12)


def limit(y, ceiling_db):
    ceiling = 10 ** (ceiling_db / 20)
    look = int(0.005 * sr)
    peak = np.max(np.abs(y), axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-12))
    # forward-looking minimum, then a ramp of the same length: the gain is
    # already down when the peak arrives
    g = minimum_filter1d(need, size=look + 1, origin=-(look // 2))
    g = uniform_filter1d(g, size=look + 1, origin=look // 2)
    g = np.minimum(g, need)
    # slow release so the limiter never pumps
    rel = 1 - np.exp(-1 / (0.12 * sr))
    out = np.empty_like(g)
    cur = 1.0
    for i, v in enumerate(g):
        cur = v if v < cur else cur + (v - cur) * rel
        out[i] = cur
    return y * out[:, None]


y = x
for _ in range(3):
    gain = 10 ** ((TARGET_LUFS - meter.integrated_loudness(y)) / 20)
    y = limit(y * gain, CEILING_DBTP - 0.6)
tp = true_peak_db(y)
if tp > CEILING_DBTP:
    y *= 10 ** ((CEILING_DBTP - tp) / 20)
print(f"in {meter.integrated_loudness(x):.1f} LUFS -> out {meter.integrated_loudness(y):.1f} LUFS, true peak {true_peak_db(y):.2f} dBTP")
wavfile.write(dst, sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
