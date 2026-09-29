"""Generate the physical textures used by the film.

  public/tex/table.jpg   dark matte table surface (flat lay), low-contrast mottling
  public/tex/paper.png   light paper fibre tile, multiplied over cards
  public/tex/grain-N.png film grain tiles, overlaid per stop-frame

Run: python3 scripts/make_textures.py
"""
import os

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "tex")
os.makedirs(ROOT, exist_ok=True)
rng = np.random.default_rng(7)


def mottle(h, w, scales, weights):
    acc = np.zeros((h, w))
    for s, wt in zip(scales, weights):
        n = gaussian_filter(rng.standard_normal((h, w)), s)
        acc += wt * n / (n.std() + 1e-9)
    return acc


# Table: slightly blue-black slate. Values stay low so the spotlight shapes it.
H, W = 2000, 3400
m = mottle(H, W, [90, 22, 4, 1], [0.55, 0.35, 0.25, 0.35])
base = np.array([28, 31, 40], dtype=float)
img = base[None, None, :] * (1 + 0.045 * m[..., None])
# faint directional fibres (felt / matte card)
fib = gaussian_filter(rng.standard_normal((H, W)), (1.2, 5))
img += 0.8 * (fib / fib.std())[..., None]
Image.fromarray(np.clip(img, 0, 255).astype("uint8")).save(
    os.path.join(ROOT, "table.jpg"), quality=92
)

# Paper tile: near-white, multiplied over cards. Fibres + soft cloudiness.
P = 768
cloud = mottle(P, P, [40, 8], [0.6, 0.4])
fibres = gaussian_filter(rng.standard_normal((P, P)), (0.5, 6)) + gaussian_filter(
    rng.standard_normal((P, P)), (6, 0.5)
)
fine = rng.standard_normal((P, P))
v = 250 - 3.2 * cloud - 2.2 * fibres / fibres.std() - 2.0 * fine
v = np.clip(v, 225, 255)
Image.fromarray(v.astype("uint8"), "L").save(os.path.join(ROOT, "paper.png"))

# Grain tiles: mid-grey centred noise for overlay blending.
for i in range(6):
    g = rng.standard_normal((512, 512))
    g = 0.65 * g + 0.35 * gaussian_filter(rng.standard_normal((512, 512)), 0.8) * 2.2
    g = np.clip(128 + 38 * g, 0, 255).astype("uint8")
    Image.fromarray(g, "L").save(os.path.join(ROOT, f"grain-{i}.png"))

print("textures written to", os.path.abspath(ROOT))
