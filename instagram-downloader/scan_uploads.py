#!/usr/bin/env python3
"""
Scan the chat uploads that DON'T have an Instagram link.

For every row whose "link of video" is NOT a real Instagram post/reel/story,
but which has a chat upload (photo_s3_link or video_s3_link), this:
  1. downloads the upload,
  2. detects whether a CAT is present (local YOLO),
  3. estimates whether the image looks AI-GENERATED (a HuggingFace AI-image
     detector + an EXIF/camera-metadata check).

IMPORTANT — read this about the AI flag:
  Automated AI-image detection is NOT reliable. It is a *screening* signal:
  it surfaces candidates to review by eye. Heavily filtered/compressed real
  photos can be false-flagged, and some AI images pass. Treat "LIKELY AI" as
  "look at this one", never as proof. (You can send the flagged images to
  Claude for a closer human-style read.)

RESUMABLE: progress saved to scan_checkpoint.jsonl after each upload.
Outputs (rebuilt each run): scan_results.csv, scan_report.html, thumbs/.

Run:
    python3 scan_uploads.py                 # auto-finds the sheet csv
    python3 scan_uploads.py "sheet.csv"

Setup (one time):
    python3 -m pip install --user --break-system-packages -U \
        pillow numpy opencv-python-headless requests ultralytics transformers timm
"""

import csv, glob, html, json, os, re, subprocess, sys, urllib.request
from collections import Counter
from PIL import Image
import cv2

S3_DIR = "uploads_media"
THUMB_DIR = "thumbs"
CHECKPOINT = "scan_checkpoint.jsonl"
YOLO_MODEL = "yolov8s.pt"
AI_MODEL = "Organika/sdxl-detector"   # swap if you prefer another HF detector
CONF = 0.30
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
VID_EXT = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}
ANIMALS = {"bird", "cat", "dog", "horse", "sheep", "cow",
           "elephant", "bear", "zebra", "giraffe"}


def is_ig_post(u):
    return bool(re.search(r"instagram\.com/(p|reel|reels|tv|stories)/", u or ""))


# ---------------- YOLO (cats) ----------------
_yolo = None
def get_yolo():
    global _yolo
    if _yolo is None:
        from ultralytics import YOLO
        _yolo = YOLO(YOLO_MODEL)
    return _yolo

def detect_animals(pil_img):
    try:
        res = get_yolo().predict(pil_img, conf=CONF, verbose=False)
    except Exception:
        return 0.0, set()
    cat_conf, seen = 0.0, set()
    for r in res:
        for b in getattr(r, "boxes", []):
            name = r.names[int(b.cls)]
            if name in ANIMALS:
                seen.add(name)
            if name == "cat":
                cat_conf = max(cat_conf, float(b.conf))
    return cat_conf, seen


# ---------------- AI-image detector ----------------
_ai = None
def get_ai():
    global _ai
    if _ai is None:
        from transformers import pipeline
        _ai = pipeline("image-classification", model=AI_MODEL)
    return _ai

def ai_prob_one(pil_img):
    try:
        scores = get_ai()(pil_img)
    except Exception:
        return None
    ai = 0.0
    for s in scores:
        lab = s["label"].lower()
        if any(k in lab for k in ["artificial", "ai", "fake", "generated",
                                  "sdxl", "synthetic", "diffus"]):
            ai = max(ai, s["score"])
    if ai == 0.0:
        real = 0.0
        for s in scores:
            lab = s["label"].lower()
            if any(k in lab for k in ["human", "real", "photo", "authentic", "natural"]):
                real = max(real, s["score"])
        if real > 0:
            ai = 1.0 - real
    return ai


# ---------------- media -> PIL ----------------
def img_pils(path):
    try:
        return [Image.open(path).convert("RGB")]
    except Exception:
        return []

def vid_pils(path, frames=6):
    out = []
    try:
        cap = cv2.VideoCapture(path)
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        if n > 0:
            for i in range(1, frames + 1):
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * i / (frames + 1)))
                ok, fr = cap.read()
                if ok:
                    out.append(Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)))
        cap.release()
    except Exception:
        pass
    return out

def media_pils(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in VID_EXT:
        return vid_pils(path)
    if ext in IMG_EXT:
        return img_pils(path)
    return []


def exif_signal(path):
    ext = os.path.splitext(path)[1].lower()
    if ext not in IMG_EXT:
        return "n/a (video)"
    try:
        ex = Image.open(path).getexif()
    except Exception:
        return "no exif"
    if not ex:
        return "no camera metadata"
    make, model = ex.get(271), ex.get(272)
    if make or model:
        return f"camera: {(str(make or '') + ' ' + str(model or '')).strip()}"
    return "exif present, no camera model"


def s3_download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())

def safe_name(n):
    n = re.sub(r"[^\w\s-]", "", n.strip())
    return re.sub(r"\s+", "_", n) or "unknown"

def find_sheet_csv():
    best = None
    for p in sorted(glob.glob("*.csv")):
        try:
            hdr = open(p, encoding="utf-8").readline().lower()
        except Exception:
            continue
        if "link of video" in hdr and "s3_link" in hdr:
            best = p
    return best

def ai_verdict(p):
    if p is None:
        return "AI: n/a"
    if p >= 0.70:
        return f"LIKELY AI ({round(p*100)}%)"
    if p >= 0.40:
        return f"AI UNCERTAIN ({round(p*100)}%)"
    return f"likely real ({round((1-p)*100)}%)"

def cat_label(conf, seen, has_media):
    if not has_media:
        return "no media"
    if conf >= CONF:
        return f"CAT ✓ ({round(conf*100)}%)"
    others = seen - {"cat"}
    return "no cat (saw: " + ", ".join(sorted(others)) + ")" if others else "no cat"

def save_thumb(pil, out):
    try:
        H = 340
        pil.resize((max(1, int(pil.width * H / pil.height)), H)).save(out, quality=85)
        return out
    except Exception:
        return ""


def load_done():
    done = {}
    if os.path.exists(CHECKPOINT):
        for line in open(CHECKPOINT, encoding="utf-8"):
            line = line.strip()
            if line:
                try:
                    r = json.loads(line); done[r["label"]] = r
                except Exception:
                    pass
    return done


def build_reports(done):
    results = sorted(done.values(), key=lambda r: r["idx"])
    if not results:
        return
    fields = ["idx", "name", "has_cat", "ai_flag", "ai_score", "exif",
              "media_type", "chat_link", "thumb", "note"]
    with open("scan_results.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in results:
            w.writerow({k: r.get(k, "") for k in fields})

    # surface cat + likely-AI first
    def rank(r):
        has_cat = "CAT" in r["has_cat"]
        return (0 if has_cat else 1, -(r.get("ai_score") or 0))
    ranked = sorted(results, key=rank)

    def acolor(r):
        s = r.get("ai_score")
        if s is None:
            return "#5f6368"
        if s >= 0.70:
            return "#c5221f"
        if s >= 0.40:
            return "#b06000"
        return "#137333"

    cat_ct = sum("CAT" in r["has_cat"] for r in results)
    ai_ct = sum((r.get("ai_score") or 0) >= 0.70 for r in results)
    catai = sum(("CAT" in r["has_cat"]) and ((r.get("ai_score") or 0) >= 0.70) for r in results)
    doc = ["<html><head><meta charset='utf-8'><title>Upload scan</title><style>",
           "body{font-family:-apple-system,Arial,sans-serif;background:#111;color:#eee;padding:20px}",
           ".row{display:inline-block;vertical-align:top;width:300px;margin:8px;padding:10px;background:#1c1c1c;border-radius:10px}",
           ".b{font-weight:700;padding:2px 8px;border-radius:6px;color:#fff;font-size:13px}",
           ".cat{display:inline-block;margin:6px 6px 0 0;padding:2px 8px;border-radius:6px;background:#263238;font-size:13px}",
           "img{max-width:100%;border-radius:8px;margin-top:8px}.muted{color:#999;font-size:12px}",
           ".sum{background:#222;padding:10px 14px;border-radius:8px;margin-bottom:12px}",
           "</style></head><body><h1>Chat uploads (no Instagram link) — cat & AI scan</h1>"]
    doc.append(f"<div class='sum'>total scanned: <b>{len(results)}</b> &nbsp;|&nbsp; with cat: <b>{cat_ct}</b> "
               f"&nbsp;|&nbsp; likely-AI: <b>{ai_ct}</b> &nbsp;|&nbsp; "
               f"<b>cat &amp; likely-AI: {catai}</b> (review these first) &nbsp;|&nbsp; "
               f"<span class='muted'>AI flag is a screening signal, not proof</span></div>")
    for r in ranked:
        doc.append(f"<div class='row'><span class='b' style='background:{acolor(r)}'>{html.escape(r['ai_flag'])}</span>"
                   f"<div style='margin-top:6px'><b>{html.escape(str(r['name']))}</b> "
                   f"<span class='muted'>row {r['idx']}</span></div>"
                   f"<span class='cat'>{html.escape(r['has_cat'])}</span>")
        if r.get("thumb") and os.path.exists(r["thumb"]):
            doc.append(f"<img src='{r['thumb']}' loading='lazy'>")
        doc.append(f"<div class='muted'>{html.escape(r.get('exif',''))}"
                   + (f" · {html.escape(r['note'])}" if r.get("note") else "") + "</div>")
        doc.append("</div>")
    doc.append("</body></html>")
    open("scan_report.html", "w", encoding="utf-8").write("\n".join(doc))


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else find_sheet_csv()
    if not csv_path or not os.path.exists(csv_path):
        print('Could not find the sheet CSV. Pass it: python3 scan_uploads.py "sheet.csv"')
        sys.exit(1)
    print(f"Reading: {csv_path}")
    print("Loading models (first run downloads them)...")
    try:
        get_yolo()
    except Exception as e:
        print(f"WARNING: YOLO unavailable ({e}); cat detection skipped.")
    ai_ok = True
    try:
        get_ai()
    except Exception as e:
        ai_ok = False
        print(f"WARNING: AI detector unavailable ({e}). Will still do cat + EXIF.")
        print("Install:  python3 -m pip install --user --break-system-packages -U transformers timm")

    os.makedirs(S3_DIR, exist_ok=True)
    os.makedirs(THUMB_DIR, exist_ok=True)

    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    todo = []
    for i, r in enumerate(rows, start=1):
        if is_ig_post(r.get("link of video", "")):
            continue
        chat = (r.get("photo_s3_link") or "").strip() or (r.get("video_s3_link") or "").strip()
        if chat:
            todo.append((i, r, chat))
    print(f"{len(todo)} chat uploads without an Instagram link.\n")

    done = load_done()
    ckpt = open(CHECKPOINT, "a", encoding="utf-8")
    processed = 0

    for i, row, chat_link in todo:
        name = (row.get("name") or "").strip()
        label = f"{i:04d}_{safe_name(name)}"
        if label in done:
            continue
        processed += 1
        note = ""
        ext = os.path.splitext(chat_link.split("?")[0])[1] or ".jpg"
        media_type = "video" if ext.lower() in VID_EXT else "image"
        path = os.path.join(S3_DIR, label + ext)

        imgs = []
        try:
            if not os.path.exists(path):
                s3_download(chat_link, path)
            imgs = media_pils(path)
        except Exception as e:
            note = f"download failed: {e}"

        cat_conf, seen = 0.0, set()
        for im in imgs:
            cf, s = detect_animals(im); cat_conf = max(cat_conf, cf); seen |= s
        has_cat = cat_label(cat_conf, seen, bool(imgs))

        ai_score = None
        if ai_ok and imgs:
            probs = [p for p in (ai_prob_one(im) for im in imgs) if p is not None]
            if probs:
                ai_score = sum(probs) / len(probs)

        thumb = save_thumb(imgs[0], os.path.join(THUMB_DIR, f"{label}.jpg")) if imgs else ""

        result = {
            "idx": i, "label": label, "name": name,
            "has_cat": has_cat,
            "ai_flag": ai_verdict(ai_score),
            "ai_score": round(ai_score, 3) if ai_score is not None else "",
            "exif": exif_signal(path) if os.path.exists(path) else "",
            "media_type": media_type, "chat_link": chat_link,
            "thumb": thumb, "note": note,
        }
        # keep numeric for ranking
        result["ai_score"] = ai_score if ai_score is not None else None
        print(f"[{processed}] row {i} {name}: {has_cat} | {result['ai_flag']}"
              + (f" | {note}" if note else ""))
        ckpt.write(json.dumps(result, ensure_ascii=False) + "\n"); ckpt.flush()
        done[label] = result
        if processed % 20 == 0:
            build_reports(done)

    ckpt.close()
    build_reports(done)
    vals = list(done.values())
    print("\n" + "=" * 60)
    print(f"Scanned {len(vals)} uploads.")
    print("With a cat:", sum("CAT" in r["has_cat"] for r in vals))
    print("Likely AI (>=70%):", sum((r.get("ai_score") or 0) >= 0.70 for r in vals))
    print("Cat AND likely-AI (review first):",
          sum(("CAT" in r["has_cat"]) and ((r.get("ai_score") or 0) >= 0.70) for r in vals))
    print(f"\nTable : {os.path.abspath('scan_results.csv')}")
    print(f"Report: {os.path.abspath('scan_report.html')}  (open scan_report.html)")


if __name__ == "__main__":
    main()
