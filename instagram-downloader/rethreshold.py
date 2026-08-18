#!/usr/bin/env python3
"""
Re-score the Instagram-vs-chat comparisons with a STRICTER similarity scale,
WITHOUT re-downloading anything. It re-maps the scores already saved in
analysis_checkpoint.jsonl, then rebuilds analysis_results.csv and
analysis_report.html.

Why: CLIP gives a middling score (~55-65%) when two images merely both
contain a cat (e.g. a real photo vs. an AI/graphic poster). The stricter
mapping pushes those down into DIFFERENT.

Idempotent: safe to run multiple times, and safe to run again after you
recover more rows with analyze_sheet.py. Always run this LAST.

Tune here if needed:
  - raise NEW_LO to be stricter (more DIFFERENT), lower it to be more lenient.

Run:
    python3 rethreshold.py
"""

import csv, glob, html, json, os

OLD_LO, OLD_HI = 0.20, 0.90     # scale analyze_sheet.py originally used
NEW_LO, NEW_HI = 0.35, 0.88     # stricter scale
CHECKPOINT = "analysis_checkpoint.jsonl"


def verdict(pct):
    if pct is None:
        return "NO COMPARISON"
    if pct >= 85:
        return "SAME"
    if pct >= 70:
        return "LIKELY SAME"
    if pct >= 50:
        return "UNCERTAIN"
    return "DIFFERENT"


def remap(cos):
    return max(0, min(100, round((cos - NEW_LO) / (NEW_HI - NEW_LO) * 100)))


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
    from collections import Counter
    tally = Counter(r.get("match_verdict") for r in results)
    doc = ["<html><head><meta charset='utf-8'><title>Sheet analysis</title><style>",
           "body{font-family:-apple-system,Arial,sans-serif;background:#111;color:#eee;padding:20px}",
           ".row{margin:16px 0;padding:12px;background:#1c1c1c;border-radius:10px}",
           ".v{font-weight:700;padding:2px 8px;border-radius:6px;color:#fff}",
           ".cat{display:inline-block;margin:6px 8px 0 0;padding:2px 8px;border-radius:6px;background:#263238}",
           "img{max-width:100%;border-radius:8px;margin-top:8px}",
           ".cap{margin-top:8px;color:#cfd8dc;white-space:pre-wrap}.muted{color:#999;font-size:13px}",
           ".sum{background:#222;padding:10px 14px;border-radius:8px;margin-bottom:12px}",
           "</style></head><body><h1>Instagram vs Chat — full sheet (strict re-score)</h1>"]
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
    return tally


def main():
    if not os.path.exists(CHECKPOINT):
        print(f"{CHECKPOINT} not found — run analyze_sheet.py first.")
        return
    rows = [json.loads(l) for l in open(CHECKPOINT, encoding="utf-8") if l.strip()]
    changed = 0
    for r in rows:
        if r.get("match_verdict") == "NO COMPARISON":
            continue
        # recover the original cosine once (idempotent), then re-map
        if "cos_raw" not in r:
            sn = r.get("similarity_num")
            if not isinstance(sn, (int, float)) or sn == 999:
                continue
            r["cos_raw"] = OLD_LO + (sn / 100.0) * (OLD_HI - OLD_LO)
        pct = remap(r["cos_raw"])
        newv = verdict(pct)
        if newv != r.get("match_verdict"):
            changed += 1
        r["similarity"] = f"{pct}%"
        r["similarity_num"] = pct
        r["match_verdict"] = newv

    with open(CHECKPOINT, "w", encoding="utf-8") as f:
        f.write("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows))

    tally = build_reports(rows)
    print(f"Re-scored with strict scale (NEW_LO={NEW_LO}, NEW_HI={NEW_HI}).")
    print(f"Verdicts changed: {changed}")
    print("New verdicts:", dict(tally))
    print("Rebuilt analysis_results.csv and analysis_report.html")
    print("Open the report: open analysis_report.html")


if __name__ == "__main__":
    main()
