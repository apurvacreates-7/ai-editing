#!/usr/bin/env python3
"""
Build a clean, visual, self-contained HTML dashboard for the Fussy Cat UGC review.

One file, all images embedded (no internet needed), 4 tabs:
  1. Instagram submissions   - chat photo vs Instagram post, match? cat? likes, caption
  2. No Instagram link       - uploaded a cat but no IG link -> nudge them to post + link
  3. Disqualified uploads    - no cat / AI / wrong content -> ask them to re-upload
  4. Invalid links           - gave a profile/junk link, not a real post/reel -> disqualify

Reads: the roster CSV, analysis_results.csv, scan_results.csv, and the local
image folders (downloads/, s3_media/, uploads_media/, thumbs/, comparisons/).

Run:
    python3 build_dashboard.py "Fussy chat - all with media.csv"

Output: Fussy_cat_dashboard.html   (double-click to open; share the file with anyone)
Setup: uses pillow + opencv (already installed).
"""

import base64, csv, glob, html, io, os, re, sys
from PIL import Image
try:
    import cv2
except Exception:
    cv2 = None

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
VID_EXT = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}

AI_FINDINGS = {
    1443: ("AI-generated video", "Google Veo/Gemini watermark — AI video"),
    949:  ("AI / fake photo", "Underwater 'swimming cat' — AI/composite"),
    494:  ("Stock image", "Studio-background kitten — looks like stock"),
    798:  ("Stock image", "Studio-background kitten — looks like stock"),
    448:  ("Stock image", "Studio-background kitten — looks like stock"),
    614:  ("Stock image", "Studio-background cat — looks like stock"),
    186:  ("Graphic/poster", "Designed 'Adopt' poster, not an original photo"),
    650:  ("Graphic/listing", "'Kitten for sale' graphic, not an original photo"),
}


def safe_name(n):
    n = re.sub(r"[^\w\s-]", "", (n or "").strip())
    return re.sub(r"\s+", "_", n) or "unknown"

def is_ig(u):
    return bool(re.search(r"instagram\.com/(p|reel|reels|tv|stories)/", u or ""))

def cat_yes(s):
    return (s or "").strip().upper().startswith("CAT")

def load_by_idx(path):
    d = {}
    if os.path.exists(path):
        for r in csv.DictReader(open(path, newline="", encoding="utf-8")):
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


def _encode(pil, maxdim, q):
    pil = pil.convert("RGB")
    pil.thumbnail((maxdim, maxdim))
    buf = io.BytesIO()
    pil.save(buf, "JPEG", quality=q)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

def embed_image(path, maxdim=420, q=72):
    try:
        return _encode(Image.open(path), maxdim, q)
    except Exception:
        return None

def embed_video_frame(path, maxdim=420, q=72):
    if cv2 is None:
        return None
    try:
        cap = cv2.VideoCapture(path)
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, n // 2))
        ok, fr = cap.read()
        cap.release()
        if ok:
            return _encode(Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)), maxdim, q)
    except Exception:
        pass
    return None

def embed_any(path, maxdim=420, q=72):
    if not path or not os.path.exists(path):
        return None
    ext = os.path.splitext(path)[1].lower()
    if ext in VID_EXT:
        return embed_video_frame(path, maxdim, q)
    return embed_image(path, maxdim, q)

def first_in(pattern):
    hits = [p for p in sorted(glob.glob(pattern))
            if os.path.splitext(p)[1].lower() in (IMG_EXT | VID_EXT)]
    return hits[0] if hits else None

def is_video_path(p):
    return bool(p) and os.path.splitext(p)[1].lower() in VID_EXT


def esc(s):
    return html.escape(str(s if s is not None else ""))


def card_html(inner):
    return f"<div class='card'>{inner}</div>"


def build():
    roster = sys.argv[1] if len(sys.argv) > 1 else find_roster()
    if not roster or not os.path.exists(roster):
        print('Roster CSV not found. Pass it: python3 build_dashboard.py "sheet.csv"')
        sys.exit(1)
    print(f"Roster: {roster}")
    analysis = load_by_idx("analysis_results.csv")
    scan = load_by_idx("scan_results.csv")
    print(f"analysis rows: {len(analysis)} | scan rows: {len(scan)}")
    rows = list(csv.DictReader(open(roster, newline="", encoding="utf-8")))

    t1, t2, t3, t4 = [], [], [], []
    done = 0
    total_media = 0
    for i, r in enumerate(rows, start=1):
        name = (r.get("name") or "").strip()
        link = (r.get("link of video") or "").strip()
        video = (r.get("video_s3_link") or "").strip()
        photo = (r.get("photo_s3_link") or "").strip()
        media_link = video or photo
        label = f"{i:04d}_{safe_name(name)}"
        ai = AI_FINDINGS.get(i)

        # ---------- Tab 1: valid Instagram link ----------
        if is_ig(link):
            a = analysis.get(i, {})
            chat_img = embed_any(first_in(os.path.join("s3_media", label + ".*")))
            ig_img = embed_any(first_in(os.path.join("downloads", label, "*")))
            if ig_img:
                total_media += 1
            verdict = a.get("match_verdict", "")
            if not verdict:
                verdict = "PENDING"
            t1.append({
                "name": name, "row": i, "link": link,
                "chat_img": chat_img, "ig_img": ig_img,
                "verdict": verdict, "similarity": a.get("similarity", ""),
                "ig_cat": a.get("instagram_has_cat", ""),
                "chat_cat": a.get("chat_image_has_cat", ""),
                "likes": a.get("likes", ""), "username": a.get("ig_username", ""),
                "caption": a.get("instagram_caption", ""),
                "ai": ai, "ai_mark": a.get("instagram_ai_wordmark", ""),
            })
            if verdict != "PENDING":
                done += 1
            continue

        # ---------- Tab 4: a link, but not a valid post/reel ----------
        if link:
            if "instagram.com" in link:
                ltype = "Instagram profile link (not a specific post/reel)"
            elif link.lower().startswith("choice-"):
                ltype = "Not a real link (leftover form value)"
            else:
                ltype = "Not a valid Instagram post/reel link"
            img = embed_any(first_in(os.path.join("thumbs", label + ".*"))
                            or first_in(os.path.join("uploads_media", label + ".*")), 320, 68)
            t4.append({"name": name, "row": i, "link": link, "ltype": ltype,
                       "img": img, "ai": ai})

        # ---------- Tab 2 / 3: uploaded media, no valid IG link ----------
        if media_link:
            sc = scan.get(i, {})
            has_cat = cat_yes(sc.get("has_cat")) if sc else None
            cat_detail = sc.get("has_cat", "") if sc else ""
            img = embed_any(first_in(os.path.join("thumbs", label + ".*"))
                            or first_in(os.path.join("uploads_media", label + ".*")), 340, 70)
            mtype = "video" if video else "photo"
            t2.append({"name": name, "row": i, "img": img, "has_cat": has_cat,
                       "cat_detail": cat_detail, "mtype": mtype, "ai": ai})
            # disqualified subset
            reason = None
            if ai:
                reason = ai[0] + " — " + ai[1]
            elif sc and has_cat is False:
                reason = "No cat detected in the upload"
            if reason:
                t3.append({"name": name, "row": i, "img": img, "reason": reason,
                           "mtype": mtype})

    # ---------------- render cards ----------------
    def badge(text, cls):
        return f"<span class='b {cls}'>{esc(text)}</span>"

    def img_block(src, label_txt, is_vid=False):
        if not src:
            return f"<div class='imgwrap empty'><span>no image</span><small>{esc(label_txt)}</small></div>"
        vid = "<span class='vidtag'>▶ video</span>" if is_vid else ""
        return (f"<div class='imgwrap'><img loading='lazy' src='{src}'>{vid}"
                f"<small>{esc(label_txt)}</small></div>")

    # Tab 1 cards
    c1 = []
    vmap = {"SAME": ("Match ✓", "ok"), "LIKELY SAME": ("Likely match", "ok"),
            "UNCERTAIN": ("Unclear", "warn"), "DIFFERENT": ("Different ✗", "bad"),
            "PENDING": ("Not fetched yet", "muted"), "NO COMPARISON": ("Not fetched yet", "muted")}
    for d in t1:
        vlabel, vcls = vmap.get(d["verdict"], (d["verdict"], "muted"))
        badges = [badge(vlabel + (f"  ·  {d['similarity']}" if d["similarity"] else ""), vcls)]
        badges.append(badge("🐱 cat in chat" if cat_yes(d["chat_cat"]) else "no cat in chat",
                            "ok" if cat_yes(d["chat_cat"]) else "bad"))
        if d["verdict"] != "PENDING":
            badges.append(badge("🐱 cat on IG" if cat_yes(d["ig_cat"]) else "no cat on IG",
                                "ok" if cat_yes(d["ig_cat"]) else "bad"))
        if d["ai"] or d["ai_mark"]:
            badges.append(badge("🤖 AI content", "bad"))
        meta = []
        if d["username"]:
            meta.append("@" + esc(d["username"]))
        if str(d["likes"]) != "":
            meta.append("♥ " + esc(d["likes"]) + " likes")
        cap = d["caption"]
        cap_html = f"<div class='cap'>{esc(cap)}</div>" if cap else ""
        inner = (f"<div class='chead'><b>{esc(d['name'])}</b><span class='row'>row {d['row']}</span></div>"
                 f"<div class='pair'>{img_block(d['chat_img'],'Chat upload')}"
                 f"{img_block(d['ig_img'],'Instagram post')}</div>"
                 f"<div class='badges'>{''.join(badges)}</div>"
                 + (f"<div class='meta'>{' · '.join(meta)}</div>" if meta else "")
                 + cap_html)
        c1.append(f"<div class='card' data-v='{esc(d['verdict'])}' data-name='{esc(d['name'].lower())}'>{inner}</div>")

    # Tab 2 cards
    c2 = []
    for d in t2:
        if d["has_cat"] is True:
            cb = badge("🐱 cat detected", "ok")
        elif d["has_cat"] is False:
            cb = badge("no cat found", "bad")
        else:
            cb = badge("not scanned", "muted")
        ai = badge("🤖 AI content", "bad") if d["ai"] else ""
        inner = (f"<div class='chead'><b>{esc(d['name'])}</b><span class='row'>row {d['row']}</span></div>"
                 f"{img_block(d['img'], d['mtype'], d['mtype']=='video')}"
                 f"<div class='badges'>{cb}{ai}</div>"
                 f"<div class='meta'>Action: nudge to post on Instagram &amp; add the link</div>")
        flag = "yes" if d["has_cat"] else ("no" if d["has_cat"] is False else "unknown")
        c2.append(f"<div class='card' data-cat='{flag}' data-name='{esc(d['name'].lower())}'>{inner}</div>")

    # Tab 3 cards
    c3 = []
    for d in t3:
        inner = (f"<div class='chead'><b>{esc(d['name'])}</b><span class='row'>row {d['row']}</span></div>"
                 f"{img_block(d['img'], d['mtype'], d['mtype']=='video')}"
                 f"<div class='badges'>{badge('Disqualified', 'bad')}</div>"
                 f"<div class='meta'>{esc(d['reason'])}</div>"
                 f"<div class='meta'>Action: ask them to upload a real cat photo/video</div>")
        c3.append(f"<div class='card' data-name='{esc(d['name'].lower())}'>{inner}</div>")

    # Tab 4 cards
    c4 = []
    for d in t4:
        ai = badge("🤖 AI content", "bad") if d["ai"] else ""
        inner = (f"<div class='chead'><b>{esc(d['name'])}</b><span class='row'>row {d['row']}</span></div>"
                 + (img_block(d["img"], "their upload") if d["img"] else "")
                 + f"<div class='badges'>{badge('Invalid link', 'bad')}{ai}</div>"
                 f"<div class='linkval'>{esc(d['link'])}</div>"
                 f"<div class='meta'>{esc(d['ltype'])}</div>"
                 f"<div class='meta'>Action: ask for a valid Instagram post/reel link</div>")
        c4.append(f"<div class='card' data-name='{esc(d['name'].lower())}'>{inner}</div>")

    tabs = [
        ("Instagram submissions", len(t1),
         "They submitted an Instagram link. Does their post match their chat photo, and is there a cat?", c1,
         "<button class='chip' data-f='all'>All</button>"
         "<button class='chip' data-f='SAME'>Match</button>"
         "<button class='chip' data-f='DIFFERENT'>Different</button>"
         "<button class='chip' data-f='UNCERTAIN'>Unclear</button>"
         "<button class='chip' data-f='PENDING'>Not fetched</button>"),
        ("No Instagram link", len(t2),
         "They uploaded a cat but gave no Instagram link — nudge them to post it and share the link.", c2,
         "<button class='chip' data-f='all'>All</button>"
         "<button class='chip' data-f='yes'>Has cat</button>"
         "<button class='chip' data-f='no'>No cat</button>"),
        ("Disqualified uploads", len(t3),
         "The upload isn't a valid cat photo/video (no cat, AI, or wrong content) — ask them to re-upload.", c3, ""),
        ("Invalid links", len(t4),
         "They gave a profile/junk link, not a real post/reel — ask for a valid Instagram post/reel link.", c4, ""),
    ]

    nav = "".join(
        f"<button class='tab{' active' if idx==0 else ''}' data-t='{idx}'>{esc(title)}"
        f"<span class='cnt'>{cnt}</span></button>"
        for idx, (title, cnt, _desc, _cards, _chips) in enumerate(tabs))

    panels = []
    for idx, (title, cnt, desc, cards, chips) in enumerate(tabs):
        chip_bar = f"<div class='chips'>{chips}</div>" if chips else ""
        panels.append(
            f"<section class='panel{' active' if idx==0 else ''}' data-p='{idx}'>"
            f"<p class='desc'>{esc(desc)}</p>"
            f"<div class='toolbar'><input class='search' placeholder='Search a name…'>{chip_bar}</div>"
            f"<div class='grid'>{''.join(cards)}</div>"
            f"<div class='noresults' hidden>No matches.</div></section>")

    summary = (f"{len(t1)} Instagram submissions · {len(t2)} awaiting a link · "
               f"{len(t3)} disqualified uploads · {len(t4)} invalid links")

    doc = f"""<!doctype html><html lang=en><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>Fussy Cat — UGC Review</title>
<style>
:root{{--bg:#f6f7f9;--card:#fff;--ink:#1a1f24;--mut:#6b7480;--line:#e6e9ee;
--ok:#137333;--okbg:#e6f4ea;--bad:#c5221f;--badbg:#fce8e6;--warn:#9a6700;--warnbg:#fff3d6;
--mutbg:#eef1f4;--brand:#6d28d9;}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
background:var(--bg);color:var(--ink)}}
header{{padding:22px 24px 12px;background:linear-gradient(120deg,#6d28d9,#9333ea);color:#fff}}
header h1{{margin:0;font-size:22px}} header p{{margin:6px 0 0;opacity:.9;font-size:14px}}
.tabs{{display:flex;gap:6px;flex-wrap:wrap;padding:10px 16px;background:#fff;
position:sticky;top:0;z-index:5;border-bottom:1px solid var(--line)}}
.tab{{border:0;background:var(--mutbg);color:var(--ink);padding:9px 14px;border-radius:999px;
cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}}
.tab.active{{background:var(--brand);color:#fff}}
.tab .cnt{{background:rgba(0,0,0,.12);padding:1px 8px;border-radius:999px;font-size:12px}}
.tab.active .cnt{{background:rgba(255,255,255,.25)}}
.panel{{display:none;padding:16px 20px 60px;max-width:1280px;margin:0 auto}}
.panel.active{{display:block}}
.desc{{color:var(--mut);font-size:14px;margin:6px 2px 12px}}
.toolbar{{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}}
.search{{flex:1;min-width:200px;padding:10px 14px;border:1px solid var(--line);border-radius:10px;font-size:14px}}
.chips{{display:flex;gap:6px;flex-wrap:wrap}}
.chip{{border:1px solid var(--line);background:#fff;padding:7px 12px;border-radius:999px;cursor:pointer;font-size:13px}}
.chip.on{{background:var(--brand);color:#fff;border-color:var(--brand)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;
box-shadow:0 1px 2px rgba(0,0,0,.04)}}
.chead{{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}}
.chead b{{font-size:15px}} .chead .row{{color:var(--mut);font-size:12px}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:8px}}
.imgwrap{{position:relative;border-radius:10px;overflow:hidden;background:#f0f2f5;
aspect-ratio:1/1;display:flex;align-items:center;justify-content:center}}
.imgwrap img{{width:100%;height:100%;object-fit:cover}}
.imgwrap small{{position:absolute;left:0;bottom:0;right:0;background:rgba(0,0,0,.55);color:#fff;
font-size:11px;padding:3px 6px}}
.imgwrap.empty{{flex-direction:column;color:var(--mut);font-size:13px}}
.imgwrap.empty small{{position:static;background:none;color:var(--mut)}}
.vidtag{{position:absolute;top:6px;left:6px;background:rgba(0,0,0,.6);color:#fff;
font-size:11px;padding:2px 7px;border-radius:999px}}
.badges{{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px}}
.b{{font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px}}
.b.ok{{background:var(--okbg);color:var(--ok)}} .b.bad{{background:var(--badbg);color:var(--bad)}}
.b.warn{{background:var(--warnbg);color:var(--warn)}} .b.muted{{background:var(--mutbg);color:var(--mut)}}
.meta{{color:var(--mut);font-size:13px;margin-top:6px}}
.cap{{font-size:13px;margin-top:8px;max-height:80px;overflow:auto;white-space:pre-wrap;
background:#fafbfc;border:1px solid var(--line);border-radius:8px;padding:8px}}
.linkval{{font-size:12px;word-break:break-all;background:#fafbfc;border:1px solid var(--line);
border-radius:8px;padding:7px;margin-top:8px;color:#444}}
.noresults{{color:var(--mut);padding:30px;text-align:center}}
</style></head><body>
<header><h1>🐱 Fussy Cat — UGC Review</h1><p>{esc(summary)}</p></header>
<nav class=tabs>{nav}</nav>
{''.join(panels)}
<script>
const tabs=[...document.querySelectorAll('.tab')],panels=[...document.querySelectorAll('.panel')];
tabs.forEach(t=>t.onclick=()=>{{tabs.forEach(x=>x.classList.remove('active'));
panels.forEach(x=>x.classList.remove('active'));t.classList.add('active');
panels[+t.dataset.t].classList.add('active');}});
function apply(panel){{const q=(panel.querySelector('.search').value||'').toLowerCase().trim();
const chip=panel.querySelector('.chip.on');const f=chip?chip.dataset.f:'all';
let vis=0;panel.querySelectorAll('.card').forEach(c=>{{
const okName=!q||(c.dataset.name||'').includes(q);
let okF=true;if(f&&f!=='all'){{okF=(c.dataset.v===f)||(c.dataset.cat===f);}}
const show=okName&&okF;c.style.display=show?'':'none';if(show)vis++;}});
panel.querySelector('.noresults').hidden=vis>0;}}
panels.forEach(p=>{{p.querySelector('.search').addEventListener('input',()=>apply(p));
p.querySelectorAll('.chip').forEach(ch=>ch.onclick=()=>{{
p.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));ch.classList.add('on');apply(p);}});}});
</script></body></html>"""

    out = "Fussy_cat_dashboard.html"
    with open(out, "w", encoding="utf-8") as f:
        f.write(doc)
    mb = os.path.getsize(out) / 1e6
    print(f"\nWrote {out}  ({mb:.1f} MB, {len(t1)+len(t2)+len(t3)+len(t4)} cards)")
    print(f"  Tab 1 Instagram submissions: {len(t1)}  ({done} reviewed, {len(t1)-done} pending)")
    print(f"  Tab 2 No Instagram link:     {len(t2)}")
    print(f"  Tab 3 Disqualified uploads:  {len(t3)}")
    print(f"  Tab 4 Invalid links:         {len(t4)}")
    print("\nOpen it:  open Fussy_cat_dashboard.html")


if __name__ == "__main__":
    build()
