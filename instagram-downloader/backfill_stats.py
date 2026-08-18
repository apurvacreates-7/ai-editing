#!/usr/bin/env python3
"""
Backfill likes / comments / views (and the IG username) into the existing
comparison results WITHOUT re-downloading anything. The numbers are read from
the post metadata gallery-dl already saved next to each downloaded file
(downloads/<row>/<file>.json).

Preserves the strict re-scored verdicts. Rebuilds analysis_results.csv and
analysis_report.html. Safe to run multiple times.

Run:
    python3 backfill_stats.py
"""

import csv, glob, html, json, os
from collections import Counter

CHECKPOINT = "analysis_checkpoint.jsonl"
DOWNLOADS = "downloads"


def _dig_num(d, keys):
    stack = [d]
    while stack:
        x = stack.pop()
        if isinstance(x, dict):
            for k, v in x.items():
                if k.lower() in keys and isinstance(v, (int, float)) and v >= 0:
                    return int(v)
            stack.extend(x.values())
        elif isinstance(x, (list, tuple)):
            stack.extend(x)
    return ""

def _dig_str(d, keys):
    stack = [d]
    while stack:
        x = stack.pop()
        if isinstance(x, dict):
            for k, v in x.items():
                if k.lower() in keys and isinstance(v, str) and v.strip():
                    return v.strip()
            stack.extend(x.values())
        elif isinstance(x, (list, tuple)):
            stack.extend(x)
    return ""

def read_meta(label):
    for fn in sorted(glob.glob(os.path.join(DOWNLOADS, label, "*.json"))):
        try:
            d = json.load(open(fn, encoding="utf-8"))
        except Exception:
            continue
        if isinstance(d, dict):
            return d
    return {}


def build_reports(rows):
    results = sorted(rows, key=lambda r: r.get("idx", 0))
    fields = ["idx", "name", "match_verdict", "similarity", "instagram_has_cat",
              "chat_image_has_cat", "ig_username", "followers", "likes",
              "comments", "views", "chat_ai_wordmark", "instagram_ai_wordmark",
              "instagram_caption", "instagram_link", "chat_link",
              "comparison_image", "note"]
    with open("analysis_results.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in results:
            w.writerow({k: r.get(k, "") for k in fields})

    order = {"DIFFERENT": 0, "UNCERTAIN": 1, "LIKELY SAME": 2, "SAME": 3, "NO COMPARISON": 4}
    ranked = sorted(results, key=lambda r: (order.get(r.get("match_verdict"), 5),
                                            r.get("similarity_num", 999)))
    vcolor = {"SAME": "#137333", "LIKELY SAME": "#188038", "UNCERTAIN": "#b06000",
              "DIFFERENT": "#c5221f", "NO COMPARISON": "#5f6368"}
    tally = Counter(r.get("match_verdict") for r in results)
    doc = ["<html><head><meta charset='utf-8'><title>Sheet analysis</title><style>",
           "body{font-family:-apple-system,Arial,sans-serif;background:#111;color:#eee;padding:20px}",
           ".row{margin:16px 0;padding:12px;background:#1c1c1c;border-radius:10px}",
           ".v{font-weight:700;padding:2px 8px;border-radius:6px;color:#fff}",
           ".cat{display:inline-block;margin:6px 8px 0 0;padding:2px 8px;border-radius:6px;background:#263238}",
           "img{max-width:100%;border-radius:8px;margin-top:8px}",
           ".cap{margin-top:8px;color:#cfd8dc;white-space:pre-wrap}.muted{color:#999;font-size:13px}",
           ".sum{background:#222;padding:10px 14px;border-radius:8px;margin-bottom:12px}",
           "</style></head><body><h1>Instagram vs Chat — full sheet</h1>"]
    doc.append("<div class='sum'>" + " &nbsp; ".join(
        f"<b>{k}</b>: {tally.get(k,0)}" for k in
        ["SAME", "LIKELY SAME", "UNCERTAIN", "DIFFERENT", "NO COMPARISON"]) +
        f" &nbsp; | &nbsp; total: {len(results)}</div>")
    for r in ranked:
        c = vcolor.get(r.get("match_verdict"), "#5f6368")
        doc.append(f"<div class='row'><span class='v' style='background:{c}'>{r.get('match_verdict')}</span>"
                   f" <b> {html.escape(str(r.get('name','')))}</b> "
                   f"<span class='muted'>similarity {r.get('similarity','')} · row {r.get('idx','')}</span><br>"
                   f"<span class='cat'>Instagram: {html.escape(str(r.get('instagram_has_cat','')))}</span>"
                   f"<span class='cat'>Chat: {html.escape(str(r.get('chat_image_has_cat','')))}</span>")
        stat_bits = " · ".join(f"{k}: {r.get(k,'')}" for k in ("followers", "likes", "comments", "views")
                               if str(r.get(k, "")) != "")
        if r.get("ig_username") or stat_bits:
            doc.append(f"<div class='muted'>@{html.escape(str(r.get('ig_username','')))} &nbsp; {html.escape(stat_bits)}</div>")
        mark = r.get("chat_ai_wordmark") or r.get("instagram_ai_wordmark")
        if mark:
            doc.append(f"<span class='cat' style='background:#c5221f'>AI WORDMARK — {html.escape(str(mark))}</span>")
        if r.get("instagram_caption"):
            doc.append(f"<div class='cap'><b>Caption:</b> {html.escape(str(r['instagram_caption']))}</div>")
        if r.get("note"):
            doc.append(f"<div class='muted'>{html.escape(str(r['note']))}</div>")
        img = r.get("comparison_image")
        if img and os.path.exists(img):
            doc.append(f"<img src='{img}' loading='lazy'>")
        doc.append("</div>")
    doc.append("</body></html>")
    open("analysis_report.html", "w", encoding="utf-8").write("\n".join(doc))


def main():
    if not os.path.exists(CHECKPOINT):
        print(f"{CHECKPOINT} not found — run analyze_sheet.py first.")
        return
    rows = [json.loads(l) for l in open(CHECKPOINT, encoding="utf-8") if l.strip()]
    filled, no_json = 0, 0
    for r in rows:
        label = r.get("label") or f"{r.get('idx', 0):04d}"
        meta = read_meta(label)
        if not meta:
            no_json += 1
            continue
        likes = _dig_num(meta, {"likes", "like_count"})
        comments = _dig_num(meta, {"comments", "comment_count"})
        views = _dig_num(meta, {"video_view_count", "view_count", "views",
                                "play_count", "video_play_count"})
        username = _dig_str(meta, {"username", "owner_username"})
        if likes != "" or comments != "" or views != "" or username:
            filled += 1
        r["likes"] = likes
        r["comments"] = comments
        r["views"] = views
        if username:
            r["ig_username"] = username

    with open(CHECKPOINT, "w", encoding="utf-8") as f:
        f.write("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows))
    build_reports(rows)

    with_likes = sum(1 for r in rows if str(r.get("likes", "")) != "")
    with_views = sum(1 for r in rows if str(r.get("views", "")) != "")
    print(f"Backfilled stats for {filled} rows ({no_json} had no metadata on disk).")
    print(f"  rows with a likes number: {with_likes}")
    print(f"  rows with a views number: {with_views}  (views only exist on reels/videos)")
    print("Rebuilt analysis_results.csv and analysis_report.html")
    print("Then re-run:  python3 compile_report.py \"Fussy chat - all with media.csv\"")


if __name__ == "__main__":
    main()
