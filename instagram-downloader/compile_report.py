#!/usr/bin/env python3
"""
Compile the final 4-sheet report for the Fussy Cat campaign.

Reads:
  - the roster CSV (the big sheet)
  - scan_results.csv       (cat detection for no-Instagram-link uploads; from scan_uploads.py)
  - analysis_results.csv   (Instagram-vs-chat comparison; from analyze_sheet.py) -- optional

Bakes in the AI submissions confirmed by visual review.

Writes 4 CSV files AND (if openpyxl is installed) one workbook Fussy_cat_report.xlsx
with 4 tabs:
  sheet1_ig_reviewed.csv     - every Instagram link vs the chat photo/video
  sheet2_no_iglink_cats.csv  - people who uploaded media but no Instagram link: cat or not
  sheet3_disqualified.csv    - disqualified uploads (no cat / AI / stock / graphic)
  sheet4_invalid_links.csv   - link-of-video values that are NOT valid post/reel links

Run:
    python3 compile_report.py "Fussy chat - all with media.csv"
"""

import csv, glob, os, re, sys

# ---- AI / invalid submissions confirmed by visual review (keyed by row number) ----
AI_FINDINGS = {
    1443: ("AI-generated video", "Google Veo/Gemini sparkle watermark; cinematic AI-generated clip"),
    949:  ("AI / fake photo",    "Underwater 'swimming cat' — AI-generated / composite, not a real snapshot"),
    494:  ("Stock image",        "Kitten on plain studio background — appears to be a stock image, not own cat"),
    798:  ("Stock image",        "Kitten on plain white studio background — appears to be a stock image"),
    448:  ("Stock image",        "Kitten on white studio background — appears to be a stock image"),
    614:  ("Stock image",        "Cat on plain yellow studio background — appears to be a stock image"),
    186:  ("Graphic / poster",   "Designed 'Pets are Family / Adopt' poster — not an original photo"),
    650:  ("Graphic / listing",  "'MALE KITTEN ₹499' sale-listing graphic — not an original photo"),
}


def is_ig(u):
    return bool(re.search(r"instagram\.com/(p|reel|reels|tv|stories)/", u or ""))

def ig_kind(u):
    m = re.search(r"instagram\.com/(p|reel|reels|tv|stories)/", u or "")
    return m.group(1) if m else ""

def cat_yes(s):
    return (s or "").strip().upper().startswith("CAT")

def load_by_idx(path):
    d = {}
    if os.path.exists(path):
        with open(path, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                try:
                    d[int(r["idx"])] = r
                except Exception:
                    pass
    return d

def find_roster():
    for p in sorted(glob.glob("*.csv")):
        try:
            h = open(p, encoding="utf-8").readline().lower()
        except Exception:
            continue
        if "link of video" in h and "s3_link" in h:
            return p
    return None

def write_csv(name, header, rows):
    with open(name, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"  wrote {name}  ({len(rows)} rows)")


def main():
    roster = sys.argv[1] if len(sys.argv) > 1 else find_roster()
    if not roster or not os.path.exists(roster):
        print('Roster CSV not found. Pass it: python3 compile_report.py "sheet.csv"')
        sys.exit(1)
    print(f"Roster: {roster}")

    scan = load_by_idx("scan_results.csv")
    analysis = load_by_idx("analysis_results.csv")
    print(f"scan_results.csv rows: {len(scan)} | analysis_results.csv rows: {len(analysis)}")
    if not scan:
        print("  (note: scan_results.csv missing — sheet 2/3 cat column will say 'run scan_uploads.py')")
    if not analysis:
        print("  (note: analysis_results.csv missing — sheet 1 comparison will say 'run analyze_sheet.py')")

    with open(roster, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    s1, s2, s3, s4 = [], [], [], []

    for i, r in enumerate(rows, start=1):
        name = (r.get("name") or "").strip()
        link = (r.get("link of video") or "").strip()
        video = (r.get("video_s3_link") or "").strip()
        photo = (r.get("photo_s3_link") or "").strip()
        media_link = video or photo
        media_type = "video" if video else ("photo" if photo else "")
        ai_cat, ai_reason = AI_FINDINGS.get(i, ("", ""))

        # ---- Sheet 1: valid Instagram link vs chat submission ----
        if is_ig(link):
            a = analysis.get(i, {})
            got = bool(a)
            kind = ig_kind(link)
            note = "Story link (expires after 24h — may be unavailable)" if kind == "stories" else ""
            ig_mark = a.get("instagram_ai_wordmark", "")
            chat_mark = a.get("chat_ai_wordmark", "")
            marks = "; ".join(x for x in [f"chat: {chat_mark}" if chat_mark else "",
                                          f"IG: {ig_mark}" if ig_mark else ""] if x)
            s1.append([
                i, name, kind, link, media_type, media_link,
                a.get("match_verdict", "PENDING — run analyze_sheet.py"),
                a.get("similarity", ""),
                a.get("instagram_has_cat", ""),
                a.get("chat_image_has_cat", ""),
                a.get("ig_username", ""), a.get("followers", ""),
                a.get("likes", ""), a.get("comments", ""), a.get("views", ""),
                a.get("instagram_caption", ""),
                marks, note,
            ])
            continue

        # ---- Sheet 4: link-of-video has a value but it is NOT a valid post/reel ----
        if link:
            if "instagram.com" in link:
                ltype = "Instagram profile link (not a specific post/reel)"
            elif link.lower().startswith("choice-"):
                ltype = "Not a link (leftover form/answer value)"
            else:
                ltype = "Other — not a valid Instagram post/reel link"
            s4.append([i, name, link, ltype, "yes" if media_link else "no", media_type])

        # ---- Sheet 2: uploaded media but NO valid Instagram link -> cat or not ----
        if media_link:
            sc = scan.get(i, {})
            if sc:
                has_cat = "Yes" if cat_yes(sc.get("has_cat")) else "No"
                cat_detail = sc.get("has_cat", "")
            else:
                has_cat, cat_detail = "Unknown (run scan_uploads.py)", ""
            if ai_cat:
                ai_flag = ai_cat
            elif str(sc.get("ai_wordmark", "")).lower() in ("true", "1", "yes"):
                ai_flag = "AI wordmark: " + sc.get("ai_terms", "")
            else:
                ai_flag = ""
            s2.append([i, name, media_type, media_link, has_cat, cat_detail, ai_flag])

            # ---- Sheet 3: disqualified (no cat, or AI/stock/graphic) ----
            disq_reason = ""
            category = ""
            if ai_cat:
                category, disq_reason = ai_cat, ai_reason
            elif sc and has_cat == "No":
                category, disq_reason = "No cat", "No cat detected in the uploaded media"
            if disq_reason:
                s3.append([i, name, category, disq_reason, media_type, media_link])

    write_csv("sheet1_ig_reviewed.csv",
              ["row", "name", "ig_link_type", "instagram_link", "chat_media_type",
               "chat_media_link", "match_verdict", "similarity", "instagram_has_cat",
               "chat_has_cat", "ig_username", "followers", "likes", "comments",
               "views", "instagram_caption", "ai_wordmark", "notes"], s1)
    write_csv("sheet2_no_iglink_cats.csv",
              ["row", "name", "media_type", "chat_media_link", "has_cat",
               "cat_detail", "ai_or_invalid_flag"], s2)
    write_csv("sheet3_disqualified.csv",
              ["row", "name", "category", "reason", "media_type", "chat_media_link"], s3)
    write_csv("sheet4_invalid_links.csv",
              ["row", "name", "link_value", "link_type", "has_chat_media", "media_type"], s4)

    # ---- optional single workbook ----
    try:
        from openpyxl import Workbook
        wb = Workbook()
        data = [
            ("1_IG_reviewed", "sheet1_ig_reviewed.csv"),
            ("2_no_IGlink_cats", "sheet2_no_iglink_cats.csv"),
            ("3_disqualified", "sheet3_disqualified.csv"),
            ("4_invalid_links", "sheet4_invalid_links.csv"),
        ]
        wb.remove(wb.active)
        for title, path in data:
            ws = wb.create_sheet(title[:31])
            with open(path, newline="", encoding="utf-8") as f:
                for row in csv.reader(f):
                    ws.append(row)
        wb.save("Fussy_cat_report.xlsx")
        print("  wrote Fussy_cat_report.xlsx (4 tabs)")
    except ImportError:
        print("  (install openpyxl for a single .xlsx workbook: "
              "python3 -m pip install --user --break-system-packages openpyxl)")

    print("\nSummary:")
    print(f"  Sheet 1 (IG links reviewed):        {len(s1)}")
    print(f"  Sheet 2 (no IG link, cat check):    {len(s2)}")
    print(f"  Sheet 3 (disqualified):             {len(s3)}")
    print(f"  Sheet 4 (invalid link values):      {len(s4)}")


if __name__ == "__main__":
    main()
