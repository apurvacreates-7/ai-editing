#!/usr/bin/env python3
"""
Build labelled CONTACT SHEETS of the chat uploads (no Instagram link) so a
human (or Claude) can eyeball them for AI logos/watermarks — e.g. the Gemini
sparkle — that OCR cannot read.

Uses the files already downloaded in ./uploads_media/ by scan_uploads.py.
For videos it extracts a couple of frames (a persistent logo shows in any).

Also runs OCR and prints any visible AI *text* it can find (bonus).

Run:
    python3 make_sheets.py video   "Fussy chat - all with media.csv"   # 70 videos (do first)
    python3 make_sheets.py photo   "Fussy chat - all with media.csv"   # 473 photos
    python3 make_sheets.py all     "Fussy chat - all with media.csv"

Output: sheets/<type>_NN.jpg  -> upload these here for review.

Setup: nothing new (uses pillow, opencv already installed).
"""

import csv, glob, os, re, sys
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np

S3_DIR = "uploads_media"
SHEET_DIR = "sheets"
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
VID_EXT = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}

# grid layout per media type
LAYOUT = {
    "video": dict(cols=4, rows=5, cell=360, frames=2),   # 20 tiles/sheet
    "photo": dict(cols=5, rows=6, cell=300, frames=1),   # 30 tiles/sheet
}

AI_TERMS = ["gemini", "made with ai", "made with google ai", "imagen",
            "midjourney", "dall-e", "dalle", "firefly", "copilot", "meta ai",
            "sora", "ideogram", "leonardo", "ai generated", "generated with ai"]

_ocr = None
def get_ocr():
    global _ocr
    if _ocr is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ocr = RapidOCR()
        except Exception:
            _ocr = False
    return _ocr

def ocr_terms(bgr):
    ocr = get_ocr()
    if not ocr:
        return []
    try:
        res, _ = ocr(bgr)
        text = " ".join(i[1] for i in res).lower() if res else ""
    except Exception:
        return []
    hits = [t for t in AI_TERMS if t in text]
    if re.search(r"\bai\b", text):
        hits.append("AI")
    return hits


def is_ig_post(u):
    return bool(re.search(r"instagram\.com/(p|reel|reels|tv|stories)/", u or ""))

def safe_name(n):
    n = re.sub(r"[^\w\s-]", "", n.strip())
    return re.sub(r"\s+", "_", n) or "unknown"

def find_sheet_csv():
    for p in sorted(glob.glob("*.csv")):
        try:
            if "s3_link" in open(p, encoding="utf-8").readline().lower():
                return p
        except Exception:
            pass
    return None

def find_file(label):
    for p in glob.glob(os.path.join(S3_DIR, label + ".*")):
        return p
    return None

def video_frames(path, k):
    out = []
    try:
        cap = cv2.VideoCapture(path)
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        if n > 0:
            for i in range(1, k + 1):
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * i / (k + 1)))
                ok, fr = cap.read()
                if ok:
                    out.append(Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)))
        cap.release()
    except Exception:
        pass
    return out


def make_tile(pil, cell, label, flag):
    pad = 24
    box = Image.new("RGB", (cell, cell + pad), (25, 25, 25))
    im = pil.copy()
    im.thumbnail((cell, cell))
    box.paste(im, ((cell - im.width) // 2, (cell - im.height) // 2))
    d = ImageDraw.Draw(box)
    d.text((4, cell + 4), label[:46], fill=(220, 220, 220))
    if flag:
        d.rectangle([0, 0, cell - 1, cell - 1], outline=(230, 40, 40), width=4)
        d.text((6, 4), "AI TEXT: " + flag, fill=(255, 90, 90))
    return box


def build(kind, csv_path):
    lay = LAYOUT[kind]
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    tiles = []
    text_hits = []
    for i, r in enumerate(rows, start=1):
        if is_ig_post(r.get("link of video", "")):
            continue
        video = (r.get("video_s3_link") or "").strip()
        photo = (r.get("photo_s3_link") or "").strip()
        is_vid = bool(video)
        if kind == "video" and not is_vid:
            continue
        if kind == "photo" and (is_vid or not photo):
            continue
        name = (r.get("name") or "").strip()
        label = f"{i:04d}_{safe_name(name)}"
        path = find_file(label)
        if not path:
            continue
        ext = os.path.splitext(path)[1].lower()
        if ext in VID_EXT:
            frames = video_frames(path, lay["frames"])
            for j, fr in enumerate(frames, 1):
                flag = ", ".join(ocr_terms(cv2.cvtColor(np.array(fr), cv2.COLOR_RGB2BGR)))
                if flag:
                    text_hits.append(f"row {i} {name}: {flag}")
                tiles.append((fr, f"{i} {name} f{j}", flag))
        else:
            try:
                pil = Image.open(path).convert("RGB")
            except Exception:
                continue
            flag = ", ".join(ocr_terms(cv2.imread(path)))
            if flag:
                text_hits.append(f"row {i} {name}: {flag}")
            tiles.append((pil, f"{i} {name}", flag))

    os.makedirs(SHEET_DIR, exist_ok=True)
    per = lay["cols"] * lay["rows"]
    cell = lay["cell"]
    n_sheets = (len(tiles) + per - 1) // per
    for s in range(n_sheets):
        chunk = tiles[s * per:(s + 1) * per]
        W = lay["cols"] * cell
        H = lay["rows"] * (cell + 24)
        sheet = Image.new("RGB", (W, H), (12, 12, 12))
        for idx, (pil, label, flag) in enumerate(chunk):
            cx = (idx % lay["cols"]) * cell
            cy = (idx // lay["cols"]) * (cell + 24)
            sheet.paste(make_tile(pil, cell, label, flag), (cx, cy))
        out = os.path.join(SHEET_DIR, f"{kind}_{s+1:02d}.jpg")
        sheet.save(out, quality=88)
        print(f"  wrote {out}")
    print(f"\n{kind}: {len(tiles)} tiles across {n_sheets} sheet(s).")
    if text_hits:
        print(f"AI *text* detected by OCR in {len(text_hits)} item(s):")
        for h in text_hits:
            print("   " + h)
    else:
        print("No AI *text* found by OCR (logos still need the visual review).")
    return n_sheets


def main():
    kind = sys.argv[1] if len(sys.argv) > 1 else "video"
    csv_path = sys.argv[2] if len(sys.argv) > 2 else find_sheet_csv()
    if kind not in ("video", "photo", "all"):
        print("First arg must be: video | photo | all")
        sys.exit(1)
    if not csv_path or not os.path.exists(csv_path):
        print('Pass the CSV: python3 make_sheets.py video "sheet.csv"')
        sys.exit(1)
    if not os.path.isdir(S3_DIR):
        print(f"'{S3_DIR}/' not found — run scan_uploads.py first so the media is downloaded.")
        sys.exit(1)
    print(f"Reading: {csv_path}\n")
    kinds = ["video", "photo"] if kind == "all" else [kind]
    total = 0
    for k in kinds:
        total += build(k, csv_path)
    print("\n" + "=" * 60)
    print(f"Done. {total} sheet(s) in ./{SHEET_DIR}/")
    print("Open the folder and upload the sheets here for AI-logo review:")
    print(f"  open {SHEET_DIR}")


if __name__ == "__main__":
    main()
