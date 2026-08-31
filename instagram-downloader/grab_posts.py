#!/usr/bin/env python3
"""Targeted re-download of specific Instagram posts that failed in the big batch.

Downloads ONLY the rows you name (default: the manually-verified people) with
gallery-dl + cookies and generous delays, so Instagram doesn't rate-limit you.
Then it removes those rows from analysis_checkpoint.jsonl so the next
analyze_sheet.py run re-analyses them properly (real similarity, likes, caption).

This is better than a screenshot — you get the full-res post image and its stats.

Setup: export a FRESH cookies.txt first (stale cookies are the usual failure).

Run in the Fussy cat folder:
    python3 grab_posts.py "Fussy chat - all with media v2.csv"
    python3 analyze_sheet.py "Fussy chat - all with media v2.csv"
    python3 rethreshold.py
    python3 build_dashboard.py "Fussy chat - all with media v2.csv"

Grab specific people/rows instead of the default set:
    python3 grab_posts.py "Fussy chat - all with media v2.csv" "Aleena" "2405"
"""

import csv, glob, json, os, re, subprocess, sys, time

IG_DIR = "downloads"
COOKIES = "cookies.txt"
CKPT = "analysis_checkpoint.jsonl"
MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".mkv", ".webm", ".m4v"}

# who to grab if you don't name anyone (the human-verified live posts)
DEFAULT_TARGETS = [
    "Mr Rahul", "Nazar", "Janhabi Das", "Salim", "Shaikh sahal", "Aleena",
    "Niraj Kumar",
]


def safe_name(n):
    n = re.sub(r"[^\w\s-]", "", (n or "").strip())
    return re.sub(r"\s+", "_", n) or "unknown"

def is_ig(u):
    return bool(re.search(r"instagram\.com/(p|reel|reels|tv|stories)/", u or ""))

def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())

def ig_media(label):
    d = os.path.join(IG_DIR, label)
    return [p for p in glob.glob(os.path.join(d, "*"))
            if os.path.splitext(p)[1].lower() in MEDIA_EXT and os.path.getsize(p) > 0]

def find_roster():
    for p in sorted(glob.glob("*.csv")):
        try:
            h = open(p, encoding="utf-8").readline().lower()
        except Exception:
            continue
        if "link of video" in h and "s3_link" in h:
            return p
    return None

def download(url, dest_dir):
    os.makedirs(dest_dir, exist_ok=True)
    # invoke gallery-dl as a module (same as analyze_sheet.py) — the bare
    # `gallery-dl` binary is often not on PATH even when the package is installed.
    cmd = [sys.executable, "-m", "gallery_dl", "-D", dest_dir,
           "--write-metadata", "--sleep-request", "3.0-6.0", "--retries", "2"]
    if os.path.exists(COOKIES):
        cmd += ["--cookies", COOKIES]
    cmd.append(url)
    return subprocess.run(cmd, capture_output=True, text=True, timeout=180)


def main():
    args = sys.argv[1:]
    roster = None
    wanted = []
    for a in args:
        if a.lower().endswith(".csv") and os.path.exists(a) and roster is None:
            roster = a
        else:
            wanted.append(a)
    roster = roster or find_roster()
    if not roster or not os.path.exists(roster):
        print('Roster CSV not found. Pass it: python3 grab_posts.py "sheet.csv"')
        sys.exit(1)
    if not os.path.exists(COOKIES):
        print("cookies.txt not found — export a FRESH one first.")
        sys.exit(1)

    want_norm = {norm(w) for w in (wanted or DEFAULT_TARGETS)}
    rows = list(csv.DictReader(open(roster, newline="", encoding="utf-8")))

    todo = []
    for i, r in enumerate(rows, start=1):
        name = (r.get("name") or "").strip()
        link = (r.get("link of video") or "").strip()
        if not is_ig(link):
            continue
        if norm(name) in want_norm or str(i) in want_norm:
            todo.append((i, name, link))

    if not todo:
        print("No matching rows with an Instagram link. Names/rows tried:",
              ", ".join(wanted or DEFAULT_TARGETS))
        return

    print(f"Grabbing {len(todo)} post(s):\n")
    grabbed = []
    for i, name, link in todo:
        label = f"{i:04d}_{safe_name(name)}"
        if ig_media(label):
            print(f"  have   row {i:4d}  {name} (already downloaded)")
            grabbed.append(i)
            continue
        r = download(link, os.path.join(IG_DIR, label))
        if ig_media(label):
            print(f"  OK     row {i:4d}  {name}")
            grabbed.append(i)
        else:
            err = (r.stderr or r.stdout or "").strip().splitlines()
            print(f"  FAIL   row {i:4d}  {name}  ({err[-1] if err else 'no media'})")
        time.sleep(4)

    # remove grabbed rows from the checkpoint so analyze_sheet re-analyses them
    if grabbed and os.path.exists(CKPT):
        keep = []
        for line in open(CKPT, encoding="utf-8"):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            if rec.get("idx") in grabbed:
                continue
            keep.append(line)
        bak = CKPT + ".bak." + time.strftime("%Y%m%d%H%M%S")
        os.rename(CKPT, bak)
        open(CKPT, "w", encoding="utf-8").write("\n".join(keep) + ("\n" if keep else ""))
        print(f"\nCleared {len(grabbed)} row(s) from the checkpoint (backup: {bak}).")

    print("\nNext — to SHOW the images now (verified rows already read as Qualified):")
    print(f'  python3 build_dashboard.py "{roster}"')
    print("\nOptional — to also compute real similarity / likes / caption:")
    print(f'  python3 analyze_sheet.py "{roster}"')
    print("  python3 rethreshold.py")
    print(f'  python3 build_dashboard.py "{roster}"')


if __name__ == "__main__":
    main()
