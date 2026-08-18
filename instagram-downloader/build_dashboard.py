#!/usr/bin/env python3
"""
Build a clean, editorial, Whiskas-branded HTML dashboard for the Fussy Cat UGC review.

One self-contained file, all images embedded (works offline). Left sidebar nav
with four sections:
  01 Instagram submissions   - chat photo vs Instagram post, match? cat? likes, caption
  02 No Instagram link       - uploaded a cat but no IG link -> nudge to post + link
  03 Disqualified uploads    - no cat / AI / wrong content -> ask to re-upload
  04 Invalid links           - gave a profile/junk link -> disqualify

Reads: the roster CSV, analysis_results.csv, scan_results.csv, and the local image
folders (downloads/, s3_media/, uploads_media/, thumbs/).

Run:
    python3 build_dashboard.py "Fussy chat - all with media.csv"
Output: Fussy_cat_dashboard.html
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
    186:  ("Graphic / poster", "Designed 'Adopt' poster, not an original photo"),
    650:  ("Graphic / listing", "'Kitten for sale' graphic, not an original photo"),
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

def embed_image(path, maxdim=440, q=72):
    try:
        return _encode(Image.open(path), maxdim, q)
    except Exception:
        return None

def embed_video_frame(path, maxdim=440, q=72):
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

def embed_any(path, maxdim=440, q=72):
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

def esc(s):
    return html.escape(str(s if s is not None else ""))


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
    for i, r in enumerate(rows, start=1):
        name = (r.get("name") or "").strip()
        link = (r.get("link of video") or "").strip()
        video = (r.get("video_s3_link") or "").strip()
        photo = (r.get("photo_s3_link") or "").strip()
        media_link = video or photo
        label = f"{i:04d}_{safe_name(name)}"
        ai = AI_FINDINGS.get(i)

        if is_ig(link):
            a = analysis.get(i, {})
            chat_img = embed_any(first_in(os.path.join("s3_media", label + ".*")))
            ig_img = embed_any(first_in(os.path.join("downloads", label, "*")))
            verdict = a.get("match_verdict", "") or "PENDING"
            t1.append({"name": name, "row": i, "chat_img": chat_img, "ig_img": ig_img,
                       "chat_vid": bool(video), "ig_vid": False,
                       "verdict": verdict, "similarity": a.get("similarity", ""),
                       "ig_cat": a.get("instagram_has_cat", ""),
                       "chat_cat": a.get("chat_image_has_cat", ""),
                       "likes": a.get("likes", ""), "username": a.get("ig_username", ""),
                       "caption": a.get("instagram_caption", ""),
                       "ai": ai, "ai_mark": a.get("instagram_ai_wordmark", "")})
            if verdict != "PENDING":
                done += 1
            continue

        if link:
            if "instagram.com" in link:
                ltype = "Instagram profile link — not a specific post/reel"
            elif link.lower().startswith("choice-"):
                ltype = "Not a real link (leftover form value)"
            else:
                ltype = "Not a valid Instagram post/reel link"
            img = embed_any(first_in(os.path.join("thumbs", label + ".*"))
                            or first_in(os.path.join("uploads_media", label + ".*")), 360, 68)
            t4.append({"name": name, "row": i, "link": link, "ltype": ltype, "img": img, "ai": ai})

        if media_link:
            sc = scan.get(i, {})
            has_cat = cat_yes(sc.get("has_cat")) if sc else None
            img = embed_any(first_in(os.path.join("thumbs", label + ".*"))
                            or first_in(os.path.join("uploads_media", label + ".*")), 380, 70)
            mtype = "video" if video else "photo"
            t2.append({"name": name, "row": i, "img": img, "has_cat": has_cat, "mtype": mtype, "ai": ai})
            reason = (ai[0] + " — " + ai[1]) if ai else ("No cat detected in the upload"
                                                          if (sc and has_cat is False) else None)
            if reason:
                t3.append({"name": name, "row": i, "img": img, "reason": reason, "mtype": mtype})

    # ---------------- render ----------------
    def badge(text, cls):
        return f"<span class='b {cls}'>{esc(text)}</span>"

    def figure(src, cap, is_vid=False):
        vid = "<span class='vt'>video</span>" if is_vid else ""
        frame = (f"<div class='frame'><img loading='lazy' src='{src}'>{vid}</div>"
                 if src else "<div class='frame empty'>no image</div>")
        return f"<figure class='ph'>{frame}<figcaption>{esc(cap)}</figcaption></figure>"

    vmap = {"SAME": ("Match", "ok"), "LIKELY SAME": ("Likely match", "ok"),
            "UNCERTAIN": ("Unclear", "warn"), "DIFFERENT": ("Different", "bad"),
            "PENDING": ("Not fetched yet", "mut"), "NO COMPARISON": ("Not fetched yet", "mut")}

    c1 = []
    for d in t1:
        vlabel, vcls = vmap.get(d["verdict"], (d["verdict"], "mut"))
        vtext = vlabel + (f" · {d['similarity']}" if d["similarity"] else "")
        badges = [badge(vtext, vcls),
                  badge("Cat in chat" if cat_yes(d["chat_cat"]) else "No cat in chat",
                        "ok" if cat_yes(d["chat_cat"]) else "bad")]
        if d["verdict"] != "PENDING":
            badges.append(badge("Cat on Instagram" if cat_yes(d["ig_cat"]) else "No cat on Instagram",
                                "ok" if cat_yes(d["ig_cat"]) else "bad"))
        if d["ai"] or d["ai_mark"]:
            badges.append(badge("AI content", "bad"))
        meta = []
        if d["username"]:
            meta.append("@" + esc(d["username"]))
        if str(d["likes"]) != "":
            meta.append(esc(d["likes"]) + " likes")
        cap = f"<blockquote class='cap'>{esc(d['caption'])}</blockquote>" if d["caption"] else ""
        inner = (f"<div class='chead'><span class='nm'>{esc(d['name'])}</span><span class='rw'>row {d['row']}</span></div>"
                 f"<div class='pair'>{figure(d['chat_img'],'Chat upload',d['chat_vid'])}"
                 f"{figure(d['ig_img'],'Instagram post',d['ig_vid'])}</div>"
                 f"<div class='badges'>{''.join(badges)}</div>"
                 + (f"<div class='meta'>{' &nbsp;·&nbsp; '.join(meta)}</div>" if meta else "") + cap)
        c1.append(f"<article class='card' data-v='{esc(d['verdict'])}' data-name='{esc(d['name'].lower())}'>{inner}</article>")

    c2 = []
    for d in t2:
        cb = (badge("Cat detected", "ok") if d["has_cat"] is True else
              badge("No cat found", "bad") if d["has_cat"] is False else badge("Not scanned", "mut"))
        ai = badge("AI content", "bad") if d["ai"] else ""
        flag = "yes" if d["has_cat"] else ("no" if d["has_cat"] is False else "unknown")
        inner = (f"<div class='chead'><span class='nm'>{esc(d['name'])}</span><span class='rw'>row {d['row']}</span></div>"
                 f"{figure(d['img'], d['mtype'], d['mtype']=='video')}"
                 f"<div class='badges'>{cb}{ai}</div>"
                 f"<div class='act'>Nudge to post on Instagram &amp; add the link</div>")
        c2.append(f"<article class='card' data-cat='{flag}' data-name='{esc(d['name'].lower())}'>{inner}</article>")

    c3 = []
    for d in t3:
        inner = (f"<div class='chead'><span class='nm'>{esc(d['name'])}</span><span class='rw'>row {d['row']}</span></div>"
                 f"{figure(d['img'], d['mtype'], d['mtype']=='video')}"
                 f"<div class='badges'>{badge('Disqualified','bad')}</div>"
                 f"<div class='meta'>{esc(d['reason'])}</div>"
                 f"<div class='act'>Ask them to upload a real cat photo/video</div>")
        c3.append(f"<article class='card' data-name='{esc(d['name'].lower())}'>{inner}</article>")

    c4 = []
    for d in t4:
        ai = badge("AI content", "bad") if d["ai"] else ""
        inner = (f"<div class='chead'><span class='nm'>{esc(d['name'])}</span><span class='rw'>row {d['row']}</span></div>"
                 + (figure(d["img"], "their upload") if d["img"] else "")
                 + f"<div class='badges'>{badge('Invalid link','bad')}{ai}</div>"
                 f"<div class='linkval'>{esc(d['link'])}</div>"
                 f"<div class='meta'>{esc(d['ltype'])}</div>"
                 f"<div class='act'>Ask for a valid Instagram post/reel link</div>")
        c4.append(f"<article class='card' data-name='{esc(d['name'].lower())}'>{inner}</article>")

    tabs = [
        ("Instagram submissions", len(t1),
         "They submitted an Instagram link. Does their post match the photo they sent in chat, and is there a cat in each?",
         c1,
         "<button class='chip' data-f='all'>All</button>"
         "<button class='chip' data-f='SAME'>Match</button>"
         "<button class='chip' data-f='DIFFERENT'>Different</button>"
         "<button class='chip' data-f='UNCERTAIN'>Unclear</button>"
         "<button class='chip' data-f='PENDING'>Not fetched</button>"),
        ("No Instagram link", len(t2),
         "They uploaded a cat but gave no Instagram link. Nudge them to post it and share the link.",
         c2,
         "<button class='chip' data-f='all'>All</button>"
         "<button class='chip' data-f='yes'>Has cat</button>"
         "<button class='chip' data-f='no'>No cat</button>"),
        ("Disqualified uploads", len(t3),
         "The upload is not a valid cat photo or video — no cat, AI-generated, or the wrong content. Ask them to re-upload.",
         c3, ""),
        ("Invalid links", len(t4),
         "They gave a profile or junk link, not a real post or reel. Ask for a valid Instagram post/reel link.",
         c4, ""),
    ]

    nav = "".join(
        f"<button class='nav{' on' if idx==0 else ''}' data-t='{idx}'>"
        f"<span class='n'>{idx+1:02d}</span><span class='t'>{esc(title)}</span>"
        f"<span class='c'>{cnt}</span></button>"
        for idx, (title, cnt, _d, _c, _ch) in enumerate(tabs))

    panels = []
    for idx, (title, cnt, desc, cards, chips) in enumerate(tabs):
        chip_bar = f"<div class='chips'>{chips}</div>" if chips else ""
        panels.append(
            f"<section class='panel{' on' if idx==0 else ''}' data-p='{idx}'>"
            f"<div class='eye'>Section {idx+1:02d}</div>"
            f"<h2 class='disp'>{esc(title)}</h2>"
            f"<p class='lead'>{esc(desc)}</p><hr>"
            f"<div class='toolbar'><input class='search' placeholder='Search a name…'>{chip_bar}</div>"
            f"<div class='grid'>{''.join(cards)}</div>"
            f"<div class='noresults' hidden>No matches.</div></section>")

    summary = (f"{len(t1)} Instagram · {len(t2)} awaiting link · "
               f"{len(t3)} disqualified · {len(t4)} invalid")

    doc = f"""<!doctype html><html lang=en><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>Fussy Cat — UGC Review</title>
<style>
:root{{
--purple:#5e2a84; --purple-soft:#f3edf8; --ink:#241626; --body:#3d3444; --mut:#8a8291;
--line:#ece8f1; --bg:#faf8fb; --card:#fff;
--ok:#2f6a45; --okbg:#eaf3ed; --bad:#a83430; --badbg:#f7e9e7; --warn:#8a6a1e; --warnbg:#f6efdd;
--serif:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,'Times New Roman',serif;
--sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:var(--sans);color:var(--body);background:var(--bg);
-webkit-font-smoothing:antialiased}}
a{{color:inherit}}
.app{{display:flex;align-items:flex-start;max-width:1360px;margin:0 auto}}
/* sidebar */
.side{{width:260px;flex:none;position:sticky;top:0;height:100vh;padding:34px 26px;
border-right:1px solid var(--line);background:#fff}}
.brand{{font-weight:800;letter-spacing:.22em;font-size:13px;color:var(--purple)}}
.prod{{font-family:var(--serif);font-size:24px;line-height:1.15;color:var(--ink);margin:6px 0 26px}}
.nav{{display:flex;width:100%;align-items:center;gap:10px;border:0;background:none;cursor:pointer;
text-align:left;padding:11px 10px;border-radius:9px;color:var(--body);margin-bottom:2px}}
.nav:hover{{background:var(--bg)}}
.nav.on{{background:var(--purple-soft);color:var(--purple)}}
.nav .n{{font-variant-numeric:tabular-nums;font-size:12px;color:var(--mut);width:20px}}
.nav.on .n{{color:var(--purple)}}
.nav .t{{flex:1;font-size:14px;font-weight:600}}
.nav .c{{font-size:12px;color:var(--mut);font-variant-numeric:tabular-nums}}
.side .foot{{margin-top:26px;padding-top:18px;border-top:1px solid var(--line);
font-size:12px;color:var(--mut);line-height:1.6}}
/* main */
main{{flex:1;min-width:0;padding:44px 48px 80px}}
.panel{{display:none;max-width:1100px}} .panel.on{{display:block}}
.eye{{text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:700;color:var(--purple)}}
.disp{{font-family:var(--serif);font-weight:600;font-size:38px;line-height:1.1;color:var(--ink);
margin:10px 0 12px}}
.lead{{font-size:17px;line-height:1.6;color:var(--mut);max-width:680px;margin:0 0 22px}}
hr{{border:0;border-top:1px solid var(--line);margin:0 0 24px}}
.toolbar{{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:22px}}
.search{{flex:1;min-width:220px;padding:11px 15px;border:1px solid var(--line);border-radius:10px;
font-size:14px;font-family:var(--sans);background:#fff}}
.search:focus{{outline:none;border-color:var(--purple)}}
.chips{{display:flex;gap:7px;flex-wrap:wrap}}
.chip{{border:1px solid var(--line);background:#fff;padding:8px 13px;border-radius:999px;cursor:pointer;
font-size:13px;color:var(--body);font-family:var(--sans)}}
.chip.on{{background:var(--purple);color:#fff;border-color:var(--purple)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(304px,1fr));gap:18px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px}}
.chead{{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:11px}}
.nm{{font-size:15px;font-weight:700;color:var(--ink)}}
.rw{{font-size:12px;color:var(--mut);font-variant-numeric:tabular-nums}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
.ph{{margin:0}}
.frame{{position:relative;border-radius:10px;overflow:hidden;background:#f1eef4;aspect-ratio:1/1;
display:flex;align-items:center;justify-content:center}}
.frame img{{width:100%;height:100%;object-fit:cover}}
.frame.empty{{color:var(--mut);font-size:13px}}
.vt{{position:absolute;top:7px;left:7px;background:rgba(36,22,38,.72);color:#fff;font-size:10px;
letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:999px}}
figcaption{{text-transform:uppercase;letter-spacing:.1em;font-size:10.5px;font-weight:700;
color:var(--mut);margin-top:7px}}
.badges{{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 2px}}
.b{{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;white-space:nowrap}}
.b.ok{{background:var(--okbg);color:var(--ok)}} .b.bad{{background:var(--badbg);color:var(--bad)}}
.b.warn{{background:var(--warnbg);color:var(--warn)}} .b.mut{{background:#efedf2;color:var(--mut)}}
.meta{{color:var(--mut);font-size:13px;margin-top:9px}}
.act{{color:var(--purple);font-size:12.5px;font-weight:600;margin-top:10px}}
.cap{{font-family:var(--serif);font-style:italic;font-size:14.5px;line-height:1.5;color:var(--body);
margin:12px 0 0;padding:2px 0 2px 13px;border-left:3px solid var(--purple-soft);
max-height:96px;overflow:auto;white-space:pre-wrap}}
.linkval{{font-size:12px;word-break:break-all;background:var(--bg);border:1px solid var(--line);
border-radius:8px;padding:8px 9px;margin-top:9px;color:#555;font-family:var(--sans)}}
.noresults{{color:var(--mut);padding:34px;text-align:center}}
@media(max-width:820px){{
.app{{display:block}} .side{{width:auto;height:auto;position:static;border-right:0;
border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:18px}}
.prod{{margin:0 18px 0 0}} .nav{{width:auto;margin:0}} .side .foot{{display:none}}
main{{padding:26px 18px 60px}} .disp{{font-size:30px}}}}
</style></head><body>
<div class=app>
<aside class=side>
<div class=brand>WHISKAS</div>
<div class=prod>Fussy&nbsp;Cat<br>UGC Review</div>
<nav>{nav}</nav>
<div class=foot>{esc(summary)}<br><br>#MyFussyCatAd</div>
</aside>
<main>{''.join(panels)}</main>
</div>
<script>
const navs=[...document.querySelectorAll('.nav')],panels=[...document.querySelectorAll('.panel')];
navs.forEach(n=>n.onclick=()=>{{navs.forEach(x=>x.classList.remove('on'));
panels.forEach(x=>x.classList.remove('on'));n.classList.add('on');
panels[+n.dataset.t].classList.add('on');window.scrollTo(0,0);}});
function apply(p){{const q=(p.querySelector('.search').value||'').toLowerCase().trim();
const chip=p.querySelector('.chip.on');const f=chip?chip.dataset.f:'all';let vis=0;
p.querySelectorAll('.card').forEach(c=>{{const okN=!q||(c.dataset.name||'').includes(q);
let okF=true;if(f&&f!=='all')okF=(c.dataset.v===f)||(c.dataset.cat===f);
const s=okN&&okF;c.style.display=s?'':'none';if(s)vis++;}});
p.querySelector('.noresults').hidden=vis>0;}}
panels.forEach(p=>{{p.querySelector('.search').addEventListener('input',()=>apply(p));
p.querySelectorAll('.chip').forEach(ch=>ch.onclick=()=>{{
p.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));ch.classList.add('on');apply(p);}});}});
</script></body></html>"""

    out = "Fussy_cat_dashboard.html"
    with open(out, "w", encoding="utf-8") as f:
        f.write(doc)
    mb = os.path.getsize(out) / 1e6
    print(f"\nWrote {out}  ({mb:.1f} MB, {len(t1)+len(t2)+len(t3)+len(t4)} cards)")
    print(f"  01 Instagram submissions: {len(t1)}  ({done} reviewed, {len(t1)-done} pending)")
    print(f"  02 No Instagram link:     {len(t2)}")
    print(f"  03 Disqualified uploads:  {len(t3)}")
    print(f"  04 Invalid links:         {len(t4)}")
    print("\nOpen it:  open Fussy_cat_dashboard.html")


if __name__ == "__main__":
    build()
