#!/usr/bin/env python3
"""
Fetch comment counts and view counts for the Instagram submissions using yt-dlp
(gallery-dl only captured likes). Fills views/comments/likes into
analysis_results.csv.

RESUMABLE: progress saved to eng_checkpoint.jsonl after each post. If Instagram
throttles you, wait ~15 min and run the same command again — it skips the ones
already done.

Notes:
  - Views only exist on reels/videos; photos will stay blank (that's correct).
  - Needs a fresh cookies.txt (same file the other scripts use).

Run:
    python3 fetch_engagement.py

Setup (yt-dlp was installed earlier; if not):
    python3 -m pip install --user --break-system-packages -U yt-dlp
"""

import csv, json, os, subprocess, sys, time

ANALYSIS = "analysis_results.csv"
COOKIES = "cookies.txt"
CKPT = "eng_checkpoint.jsonl"


def load_ckpt():
    d = {}
    if os.path.exists(CKPT):
        for line in open(CKPT, encoding="utf-8"):
            line = line.strip()
            if line:
                try:
                    r = json.loads(line); d[r["idx"]] = r
                except Exception:
                    pass
    return d


def fetch(url):
    cmd = ["yt-dlp", "--dump-json", "--skip-download", "--no-warnings",
           "--sleep-requests", "2"]
    if os.path.exists(COOKIES):
        cmd += ["--cookies", COOKIES]
    cmd.append(url)
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=150)
    except Exception as e:
        return None, str(e)
    lines = [l for l in (r.stdout or "").splitlines() if l.strip().startswith("{")]
    if not lines:
        err = (r.stderr or "").strip().splitlines()
        return None, (err[-1] if err else "no data")
    # for a carousel yt-dlp prints one json per item — first has the post stats
    try:
        d = json.loads(lines[0])
    except Exception:
        return None, "parse error"
    return {
        "views": d.get("view_count"),
        "comments": d.get("comment_count"),
        "likes": d.get("like_count"),
    }, ""


def main():
    if not os.path.exists(ANALYSIS):
        print(f"{ANALYSIS} not found — run analyze_sheet.py first.")
        sys.exit(1)
    if not os.path.exists(COOKIES):
        print("cookies.txt not found — export a fresh one first.")
        sys.exit(1)

    with open(ANALYSIS, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames
        rows = list(reader)

    done = load_ckpt()
    ck = open(CKPT, "a", encoding="utf-8")
    todo = [r for r in rows if (r.get("instagram_link") or "").strip()
            and int(r["idx"]) not in done]
    print(f"{len(rows)} rows · {len(done)} already fetched · {len(todo)} to go\n")

    got = 0
    for r in todo:
        idx = int(r["idx"])
        link = r["instagram_link"].strip()
        e, err = fetch(link)
        rec = {"idx": idx, "name": r.get("name", ""), **(e or {})}
        ck.write(json.dumps(rec, ensure_ascii=False) + "\n"); ck.flush()
        done[idx] = rec
        if e:
            got += 1
            print(f"[{got}] {r.get('name','')}: comments={e['comments']} views={e['views']} likes={e['likes']}")
        else:
            print(f"    {r.get('name','')}: failed ({err})")
        time.sleep(1)

    # merge into analysis_results.csv
    for r in rows:
        e = done.get(int(r["idx"]))
        if not e:
            continue
        if e.get("comments") is not None:
            r["comments"] = e["comments"]
        if e.get("views") is not None:
            r["views"] = e["views"]
        if (not str(r.get("likes", "")).strip()) and e.get("likes") is not None:
            r["likes"] = e["likes"]

    with open(ANALYSIS, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    ck.close()

    have_c = sum(1 for r in rows if str(r.get("comments", "")).strip() != "")
    have_v = sum(1 for r in rows if str(r.get("views", "")).strip() != "")
    print("\n" + "=" * 56)
    print(f"Updated {ANALYSIS}")
    print(f"  rows with a comment count: {have_c}")
    print(f"  rows with a view count:    {have_v}  (reels/videos only)")
    print("\nThen rebuild:")
    print('  python3 build_dashboard.py "Fussy chat - all with media.csv"')
    print('  python3 compile_report.py  "Fussy chat - all with media.csv"')
    fails = sum(1 for v in done.values() if v.get("comments") is None and v.get("views") is None)
    if fails:
        print(f"\n{fails} still empty (throttling?) — wait ~15 min and run this again to retry.")


if __name__ == "__main__":
    main()
