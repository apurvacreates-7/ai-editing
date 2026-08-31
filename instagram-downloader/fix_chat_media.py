#!/usr/bin/env python3
"""Re-download any MISSING chat photos/videos into s3_media/ for rows that
have an Instagram link, so their cards stop showing "no image".

Safe to run multiple times — it only downloads what's missing, and reports
every link that is genuinely dead so you know which cards can't be fixed.

Run in the Fussy cat folder:
    python3 fix_chat_media.py "Fussy chat - all with media v2.csv"
Then rebuild:
    python3 build_dashboard.py "Fussy chat - all with media v2.csv"
"""

import csv, glob, os, re, sys, urllib.request

S3_DIR = "s3_media"
MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif",
             ".mp4", ".mov", ".mkv", ".webm", ".m4v"}


def safe_name(n):
    n = re.sub(r"[^\w\s-]", "", (n or "").strip())
    return re.sub(r"\s+", "_", n) or "unknown"

def is_ig(u):
    return bool(re.search(r"instagram\.com/(p|reel|reels|tv|stories)/", u or ""))

def existing(label):
    return [p for p in glob.glob(os.path.join(S3_DIR, glob.escape(label) + ".*"))
            if os.path.splitext(p)[1].lower() in MEDIA_EXT and os.path.getsize(p) > 0]

def fetch(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())
    if os.path.getsize(dest) == 0:
        os.remove(dest)
        raise IOError("empty file")


def find_roster():
    for p in sorted(glob.glob("*.csv")):
        try:
            h = open(p, encoding="utf-8").readline().lower()
        except Exception:
            continue
        if "link of video" in h and "s3_link" in h:
            return p
    return None


def main():
    roster = sys.argv[1] if len(sys.argv) > 1 else find_roster()
    if not roster or not os.path.exists(roster):
        print('Roster CSV not found. Pass it: python3 fix_chat_media.py "sheet.csv"')
        sys.exit(1)
    os.makedirs(S3_DIR, exist_ok=True)
    rows = list(csv.DictReader(open(roster, newline="", encoding="utf-8")))
    print(f"Roster: {roster} ({len(rows)} rows)\n")

    already = fixed = 0
    failed = []
    for i, r in enumerate(rows, start=1):
        link = (r.get("link of video") or "").strip()
        if not is_ig(link):
            continue
        video = (r.get("video_s3_link") or "").strip()
        photo = (r.get("photo_s3_link") or "").strip()
        chat = video or photo
        if not chat:
            continue
        label = f"{i:04d}_{safe_name((r.get('name') or '').strip())}"
        if existing(label):
            already += 1
            continue
        ext = os.path.splitext(chat.split("?")[0])[1].lower()
        if ext not in MEDIA_EXT:
            ext = ".mp4" if video else ".jpg"
        dest = os.path.join(S3_DIR, label + ext)
        try:
            fetch(chat, dest)
            fixed += 1
            print(f"  fixed  row {i:4d}  {r.get('name','')}")
        except Exception as e:
            failed.append((i, (r.get("name") or "").strip(), str(e)[:70]))
            print(f"  FAILED row {i:4d}  {r.get('name','')}  ({e})")

    print("\n" + "=" * 56)
    print(f"Already had media : {already}")
    print(f"Downloaded now    : {fixed}")
    print(f"Still failing     : {len(failed)}")
    if failed:
        print("\nThese links are dead (expired/removed on S3) — cards will stay blank:")
        for i, n, e in failed:
            print(f"  row {i:4d}  {n}: {e}")
    print('\nNow rebuild:  python3 build_dashboard.py "' + roster + '"')


if __name__ == "__main__":
    main()
