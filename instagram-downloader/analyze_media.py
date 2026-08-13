#!/usr/bin/env python3
"""
Full analysis, per person:
  1. Compare Instagram media (downloads/NN_Name/) vs the chat image (S3 link)
     -> SAME / LIKELY SAME / UNCERTAIN / DIFFERENT  (perceptual hashing)
  2. Detect whether a CAT is present in the Instagram media and in the chat image
     (local YOLO model — runs on your Mac, no data leaves it)
  3. Fetch the Instagram CAPTION (via gallery-dl + your cookies.txt)

Outputs:
  - analysis_results.csv   (full table)
  - analysis_report.html   (visual: side-by-side + cat flags + caption)
  - comparisons/NN_Name.jpg (side-by-side image per person)

Run:
    python3 analyze_media.py                 # auto-finds the S3 csv
    python3 analyze_media.py "my file.csv"

Setup (one time):
    python3 -m pip install --user --break-system-packages -U \
        pillow imagehash numpy scipy opencv-python-headless requests ultralytics
"""

import csv, glob, html, json, os, re, subprocess, sys, urllib.request
from collections import Counter
from PIL import Image, ImageDraw
import imagehash
import cv2

IG_DIR = "downloads"
S3_DIR = "s3_media"
CMP_DIR = "comparisons"
COOKIES = "cookies.txt"
YOLO_MODEL = "yolov8s.pt"           # auto-downloaded on first run
CONF = 0.30                          # detection confidence threshold
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
VID_EXT = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}
ANIMALS = {"bird", "cat", "dog", "horse", "sheep", "cow",
           "elephant", "bear", "zebra", "giraffe"}

# ---- optional YOLO ----
_model = None
def get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        _model = YOLO(YOLO_MODEL)
    return _model

def detect_animals(pil_img):
    """Return (cat_confidence, set_of_animals_seen) for one image."""
    try:
        res = get_model().predict(pil_img, conf=CONF, verbose=False)
    except Exception as e:
        print(f"   (detection error: {e})")
        return 0.0, set()
    cat_conf, seen = 0.0, set()
    for r in res:
        for b in getattr(r, "boxes", []):
            name = r.names[int(b.cls)]
            cf = float(b.conf)
            if name in ANIMALS:
                seen.add(name)
            if name == "cat":
                cat_conf = max(cat_conf, cf)
    return cat_conf, seen


def safe_name(n):
    n = re.sub(r"[^\w\s-]", "", n.strip())
    return re.sub(r"\s+", "_", n) or "unknown"


def find_s3_csv():
    for p in sorted(glob.glob("*.csv")):
        try:
            with open(p, newline="", encoding="utf-8") as f:
                if "submitted link" in f.readline().lower():
                    return p
        except Exception:
            pass
    return None


def img_reps(path):
    try:
        im = Image.open(path).convert("RGB")
        return [(imagehash.phash(im), im)]
    except Exception:
        return []


def vid_reps(path, frames=8):
    reps = []
    try:
        cap = cv2.VideoCapture(path)
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        if n > 0:
            for i in range(1, frames + 1):
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * i / (frames + 1)))
                ok, fr = cap.read()
                if ok:
                    reps.append((None, Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))))
        cap.release()
    except Exception:
        pass
    # fill hashes
    return [(imagehash.phash(im), im) for (_h, im) in reps]


def media_reps(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in VID_EXT:
        return vid_reps(path)
    return img_reps(path) or vid_reps(path)


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())


def verdict(d):
    if d is None:
        return "NO COMPARISON"
    if d <= 8:
        return "SAME"
    if d <= 14:
        return "LIKELY SAME"
    if d <= 20:
        return "UNCERTAIN"
    return "DIFFERENT"


def get_caption(url):
    if not url or not re.search(r"/(p|reel|reels|tv|stories)/", url):
        return ""
    cmd = [sys.executable, "-m", "gallery_dl", "-j"]
    if os.path.exists(COOKIES):
        cmd += ["--cookies", COOKIES]
    cmd.append(url)
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        data = json.loads(r.stdout)
    except Exception:
        return ""
    stack = [data]
    while stack:
        x = stack.pop()
        if isinstance(x, dict):
            for k in ("description", "caption", "title"):
                if x.get(k):
                    return str(x[k]).strip()
            stack.extend(x.values())
        elif isinstance(x, (list, tuple)):
            stack.extend(x)
    return ""


def cat_label(conf, seen):
    if conf >= CONF:
        return f"CAT ✓ ({round(conf*100)}%)"
    others = seen - {"cat"}
    if others:
        return "no cat (saw: " + ", ".join(sorted(others)) + ")"
    return "no cat"


def montage(s3_im, ig_im, out, caption):
    H = 500
    def rs(im):
        if im is None:
            return Image.new("RGB", (int(H * 0.7), H), (50, 50, 50))
        return im.resize((max(1, int(im.width * H / im.height)), H))
    a, b = rs(s3_im), rs(ig_im)
    canvas = Image.new("RGB", (a.width + b.width + 30, H + 46), (18, 18, 18))
    canvas.paste(a, (10, 36)); canvas.paste(b, (a.width + 20, 36))
    d = ImageDraw.Draw(canvas)
    d.text((12, 12), "CHAT (S3)", fill=(255, 255, 255))
    d.text((a.width + 22, 12), "INSTAGRAM  " + caption, fill=(255, 255, 255))
    canvas.save(out)


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else find_s3_csv()
    if not csv_path or not os.path.exists(csv_path):
        print('Could not find the S3 CSV. Pass it: python3 analyze_media.py "file.csv"')
        sys.exit(1)
    print(f"Reading: {csv_path}")
    print("Loading detector (first run downloads the model)...\n")
    try:
        get_model()
    except Exception as e:
        print(f"WARNING: YOLO not available ({e}); cat detection will be skipped.\n")

    os.makedirs(S3_DIR, exist_ok=True)
    os.makedirs(CMP_DIR, exist_ok=True)

    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    results = []
    for i, row in enumerate(rows, start=1):
        name = (row.get("name") or "").strip()
        ig_link = (row.get("link of video") or "").strip()
        s3_link = (row.get("submitted link in chat") or row.get("submitted link") or "").strip()
        label = f"{i:02d}_{safe_name(name)}"
        print(f"[{i}/{len(rows)}] {name}")
        note = ""

        # Instagram media reps
        ig_dir = os.path.join(IG_DIR, label)
        ig_files = [os.path.join(ig_dir, fn) for fn in sorted(os.listdir(ig_dir))] \
            if os.path.isdir(ig_dir) else []
        ig_reps = []
        for f in ig_files:
            ig_reps += media_reps(f)

        # S3 chat image
        s3_reps = []
        if s3_link:
            ext = os.path.splitext(s3_link.split("?")[0])[1] or ".jpg"
            s3_path = os.path.join(S3_DIR, label + ext)
            try:
                download(s3_link, s3_path)
                s3_reps = media_reps(s3_path)
            except Exception as e:
                note = f"S3 download failed: {e}"
        else:
            note = "no S3 link"
        if not ig_files:
            note = (note + "; " if note else "") + "no Instagram media downloaded"

        # comparison
        best = None
        for (h, im) in ig_reps:
            for (sh, _s) in s3_reps:
                d = sh - h
                if best is None or d < best[0]:
                    best = (d, im)
        dist = best[0] if best else None
        v = verdict(dist)
        sim = f"{round((1 - dist / 64) * 100)}%" if dist is not None else "-"

        # cat detection
        ig_cat_conf, ig_seen = 0.0, set()
        for (_h, im) in ig_reps:
            c, s = detect_animals(im)
            ig_cat_conf = max(ig_cat_conf, c); ig_seen |= s
        s3_cat_conf, s3_seen = 0.0, set()
        for (_h, im) in s3_reps:
            c, s = detect_animals(im)
            s3_cat_conf = max(s3_cat_conf, c); s3_seen |= s
        ig_cat = cat_label(ig_cat_conf, ig_seen) if ig_reps else "no media"
        s3_cat = cat_label(s3_cat_conf, s3_seen) if s3_reps else "no media"

        caption = get_caption(ig_link)

        print(f"   match={v} ({sim}) | IG: {ig_cat} | chat: {s3_cat}")
        if caption:
            print(f"   caption: {caption[:80]}{'...' if len(caption) > 80 else ''}")

        # side-by-side
        cmp_img = os.path.join(CMP_DIR, f"{label}.jpg")
        try:
            montage(s3_reps[0][1] if s3_reps else None,
                    best[1] if best else (ig_reps[0][1] if ig_reps else None),
                    cmp_img, f"{v} ({sim})")
        except Exception:
            cmp_img = ""

        results.append({
            "name": name, "match_verdict": v, "similarity": sim,
            "distance": dist if dist is not None else "",
            "instagram_has_cat": ig_cat, "chat_image_has_cat": s3_cat,
            "instagram_caption": caption,
            "instagram_link": ig_link, "s3_link": s3_link,
            "comparison_image": cmp_img, "note": note,
        })

    # CSV
    with open("analysis_results.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        w.writeheader(); w.writerows(results)

    # HTML
    vcolor = {"SAME": "#137333", "LIKELY SAME": "#188038", "UNCERTAIN": "#b06000",
              "DIFFERENT": "#c5221f", "NO COMPARISON": "#5f6368"}
    doc = ["<html><head><meta charset='utf-8'><title>Media analysis</title><style>",
           "body{font-family:-apple-system,Arial,sans-serif;background:#111;color:#eee;padding:20px}",
           ".row{margin:18px 0;padding:14px;background:#1c1c1c;border-radius:10px}",
           ".v{font-weight:700;padding:2px 8px;border-radius:6px;color:#fff}",
           ".cat{display:inline-block;margin:6px 8px 0 0;padding:2px 8px;border-radius:6px;background:#263238}",
           "img{max-width:100%;border-radius:8px;margin-top:8px}",
           ".cap{margin-top:8px;color:#cfd8dc;white-space:pre-wrap}.muted{color:#999;font-size:13px}",
           "</style></head><body><h1>Instagram vs Chat — analysis</h1>"]
    for r in results:
        c = vcolor.get(r["match_verdict"], "#5f6368")
        doc.append(f"<div class='row'><span class='v' style='background:{c}'>{r['match_verdict']}</span>"
                   f" <b> {html.escape(r['name'])}</b> <span class='muted'>similarity {r['similarity']}</span><br>"
                   f"<span class='cat'>Instagram: {html.escape(r['instagram_has_cat'])}</span>"
                   f"<span class='cat'>Chat image: {html.escape(r['chat_image_has_cat'])}</span>")
        if r["instagram_caption"]:
            doc.append(f"<div class='cap'><b>Caption:</b> {html.escape(r['instagram_caption'])}</div>")
        if r["note"]:
            doc.append(f"<div class='muted'>{html.escape(r['note'])}</div>")
        if r["comparison_image"]:
            doc.append(f"<img src='{r['comparison_image']}'>")
        doc.append("</div>")
    doc.append("</body></html>")
    with open("analysis_report.html", "w", encoding="utf-8") as f:
        f.write("\n".join(doc))

    # summary
    print("\n" + "=" * 60)
    tally = Counter(r["match_verdict"] for r in results)
    print("Match verdicts:", dict(tally))
    print("Instagram with cat:", sum("CAT" in r["instagram_has_cat"] for r in results))
    print("Chat images with cat:", sum("CAT" in r["chat_image_has_cat"] for r in results))
    print(f"\nTable  : {os.path.abspath('analysis_results.csv')}")
    print(f"Report : {os.path.abspath('analysis_report.html')}")
    print("Open the report with:  open analysis_report.html")


if __name__ == "__main__":
    main()
