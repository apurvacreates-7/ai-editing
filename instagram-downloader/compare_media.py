#!/usr/bin/env python3
"""
Compare each person's Instagram media (already downloaded into ./downloads/NN_Name/)
against the image they submitted in chat (the S3 link in the CSV).

Reports SAME / LIKELY SAME / UNCERTAIN / DIFFERENT using perceptual hashing
(robust to re-compression/resize), writes comparison_results.csv, builds a
side-by-side image per person in ./comparisons/, and an HTML report.

Run:
    python3 compare_media.py                 # auto-finds the S3 csv
    python3 compare_media.py "my file.csv"   # or name it explicitly

Setup (one time):
    python3 -m pip install --user --break-system-packages -U \
        pillow imagehash numpy scipy opencv-python-headless requests
"""

import csv, glob, os, re, sys, urllib.request
from PIL import Image, ImageDraw
import imagehash
import cv2

IG_DIR = "downloads"
S3_DIR = "s3_media"
CMP_DIR = "comparisons"
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
VID_EXT = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}


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
                    im = Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
                    reps.append((imagehash.phash(im), im))
        cap.release()
    except Exception:
        pass
    return reps


def media_reps(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in VID_EXT:
        return vid_reps(path)
    reps = img_reps(path)
    return reps or vid_reps(path)  # fallback if a .jpg is really a video


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


def montage(s3_im, ig_im, out, caption):
    H = 500
    def rs(im):
        if im is None:
            return Image.new("RGB", (int(H * 0.7), H), (50, 50, 50))
        return im.resize((max(1, int(im.width * H / im.height)), H))
    a, b = rs(s3_im), rs(ig_im)
    canvas = Image.new("RGB", (a.width + b.width + 30, H + 46), (18, 18, 18))
    canvas.paste(a, (10, 36))
    canvas.paste(b, (a.width + 20, 36))
    d = ImageDraw.Draw(canvas)
    d.text((12, 12), "CHAT (S3)", fill=(255, 255, 255))
    d.text((a.width + 22, 12), "INSTAGRAM  " + caption, fill=(255, 255, 255))
    canvas.save(out)


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else find_s3_csv()
    if not csv_path or not os.path.exists(csv_path):
        print("Could not find the S3 CSV. Pass it explicitly: python3 compare_media.py \"file.csv\"")
        sys.exit(1)
    print(f"Reading: {csv_path}\n")

    os.makedirs(S3_DIR, exist_ok=True)
    os.makedirs(CMP_DIR, exist_ok=True)

    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append(row)

    results = []
    for i, row in enumerate(rows, start=1):
        name = (row.get("name") or "").strip()
        ig_link = (row.get("link of video") or "").strip()
        s3_link = (row.get("submitted link in chat") or row.get("submitted link") or "").strip()
        label = f"{i:02d}_{safe_name(name)}"
        print(f"[{i}/{len(rows)}] {name}")

        note = ""
        ig_dir = os.path.join(IG_DIR, label)
        ig_files = []
        if os.path.isdir(ig_dir):
            for fn in sorted(os.listdir(ig_dir)):
                ig_files.append(os.path.join(ig_dir, fn))

        # download the S3 chat image
        s3_reps, s3_im = [], None
        if s3_link:
            s3_path = os.path.join(S3_DIR, label + os.path.splitext(s3_link.split("?")[0])[1] or ".jpg")
            try:
                download(s3_link, s3_path)
                s3_reps = media_reps(s3_path)
                if s3_reps:
                    s3_im = s3_reps[0][1]
            except Exception as e:
                note = f"S3 download failed: {e}"
        else:
            note = "no S3 link"

        if not ig_files:
            note = (note + "; " if note else "") + "no Instagram media downloaded"
        if not s3_reps and not note:
            note = "could not read S3 image"

        best = None  # (distance, ig_file, ig_image)
        if ig_files and s3_reps:
            for f in ig_files:
                for (h, im) in media_reps(f):
                    for (sh, _sim) in s3_reps:
                        d = sh - h
                        if best is None or d < best[0]:
                            best = (d, f, im)

        dist = best[0] if best else None
        v = verdict(dist)
        sim = f"{round((1 - dist / 64) * 100)}%" if dist is not None else "-"
        ig_used = os.path.basename(best[1]) if best else "-"
        print(f"   {v}  (distance={dist}, similarity={sim})  {note}")

        # side-by-side image
        cmp_img = ""
        if s3_im or best:
            cmp_img = os.path.join(CMP_DIR, f"{label}.jpg")
            cap = f"{v} ({sim})" if dist is not None else v
            try:
                montage(s3_im, best[2] if best else None, cmp_img, cap)
            except Exception:
                cmp_img = ""

        results.append({
            "name": name, "verdict": v, "distance": dist if dist is not None else "",
            "similarity": sim, "instagram_link": ig_link, "s3_link": s3_link,
            "instagram_file_matched": ig_used, "comparison_image": cmp_img, "note": note,
        })

    # write CSV
    out_csv = "comparison_results.csv"
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        w.writeheader()
        w.writerows(results)

    # write HTML report
    color = {"SAME": "#137333", "LIKELY SAME": "#188038", "UNCERTAIN": "#b06000",
             "DIFFERENT": "#c5221f", "NO COMPARISON": "#5f6368"}
    html = ["<html><head><meta charset='utf-8'><title>Comparison report</title>",
            "<style>body{font-family:-apple-system,Arial,sans-serif;background:#111;color:#eee;padding:20px}",
            "h1{font-size:20px}.row{margin:18px 0;padding:12px;background:#1c1c1c;border-radius:10px}",
            ".v{font-weight:700;padding:2px 8px;border-radius:6px;color:#fff}img{max-width:100%;border-radius:8px;margin-top:8px}",
            ".muted{color:#999;font-size:13px}</style></head><body><h1>Instagram vs Chat media</h1>"]
    for r in results:
        c = color.get(r["verdict"], "#5f6368")
        html.append(f"<div class='row'><span class='v' style='background:{c}'>{r['verdict']}</span> "
                    f"<b> {r['name']}</b> <span class='muted'>similarity {r['similarity']} · distance {r['distance']}</span>"
                    f"<div class='muted'>{r['note']}</div>")
        if r["comparison_image"]:
            html.append(f"<img src='{r['comparison_image']}'>")
        html.append("</div>")
    html.append("</body></html>")
    with open("comparison_report.html", "w", encoding="utf-8") as f:
        f.write("\n".join(html))

    # summary
    print("\n" + "=" * 60)
    from collections import Counter
    tally = Counter(r["verdict"] for r in results)
    for k in ["SAME", "LIKELY SAME", "UNCERTAIN", "DIFFERENT", "NO COMPARISON"]:
        if tally.get(k):
            print(f"  {k}: {tally[k]}")
    print(f"\nResults table : {os.path.abspath(out_csv)}")
    print(f"Visual report : {os.path.abspath('comparison_report.html')}")
    print("Open the report with:  open comparison_report.html")


if __name__ == "__main__":
    main()
