#!/usr/bin/env python3
"""Auto-crop the manual_ig/ Instagram screenshots down to just the post photo.

Each screenshot is a full browser page; this finds the largest photographic
block (the cat photo, which is colourful/photographic against the white UI)
and crops to it. Originals are backed up to manual_ig/_full/ first, so you can
re-run or restore.

Run in the Fussy cat folder:
    python3 crop_manual.py
Then rebuild:
    python3 build_dashboard.py "Fussy chat - all with media v2.csv"
"""

import glob, os, shutil, sys
import numpy as np
from PIL import Image
try:
    import cv2
except Exception:
    print("OpenCV needed: python3 -m pip install --user --break-system-packages opencv-python-headless")
    sys.exit(1)

SRC = "manual_ig"
BAK = os.path.join(SRC, "_full")
EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def find_photo(rgb):
    """Bounding box (x,y,w,h) of the dominant photographic region, or None."""
    h, w = rgb.shape[:2]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    sat, val = hsv[:, :, 1], hsv[:, :, 2]
    # photographic pixels are colourful (sat) or mid/dark (val) — white/grey UI is not
    mask = (((sat > 45) | (val < 205)) & (val > 12)).astype(np.uint8) * 255
    k = max(9, (min(w, h) // 60) | 1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((k, k), np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((k, k), np.uint8))
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = None
    for c in cnts:
        x, y, cw, ch = cv2.boundingRect(c)
        area = cw * ch
        ar = cw / ch if ch else 0
        if area < 0.06 * w * h:          # ignore small UI blobs
            continue
        if ar < 0.45 or ar > 2.4:        # keep photo-ish aspect ratios
            continue
        if best is None or area > best[0]:
            best = (area, (x, y, cw, ch))
    return best[1] if best else None


def main():
    files = [p for p in sorted(glob.glob(os.path.join(SRC, "*")))
             if os.path.splitext(p)[1].lower() in EXT and os.path.isfile(p)]
    if not files:
        print("No images in manual_ig/ — nothing to crop.")
        return
    os.makedirs(BAK, exist_ok=True)
    for p in files:
        try:
            pil = Image.open(p).convert("RGB")
        except Exception as e:
            print(f"  {os.path.basename(p)}: can't open ({e})")
            continue
        rgb = np.array(pil)
        box = find_photo(rgb)
        if not box:
            print(f"  {os.path.basename(p)}: no clear photo region — left unchanged")
            continue
        x, y, cw, ch = box
        b = os.path.join(BAK, os.path.basename(p))
        if not os.path.exists(b):
            shutil.copy(p, b)            # back up the original once
        pil.crop((x, y, x + cw, y + ch)).save(p)
        print(f"  {os.path.basename(p)}: cropped to {cw}x{ch}  (from {pil.width}x{pil.height})")

    print(f"\nOriginals backed up in {BAK}/")
    print("Rebuild:  python3 build_dashboard.py \"Fussy chat - all with media v2.csv\"")
    print("Restore an original if a crop is wrong:  cp manual_ig/_full/NAME manual_ig/NAME")


if __name__ == "__main__":
    main()
