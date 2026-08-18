#!/usr/bin/env python3
"""
Build a clean, editorial, Whiskas-branded HTML dashboard for the Fussy Cat UGC review.

One self-contained file, all images embedded (works offline). Left sidebar nav
with four mutually-exclusive sections; every card has a clear ACTION, an image
lightbox (click to expand), a link to the Instagram post, and read-more captions.

Run:  python3 build_dashboard.py "Fussy chat - all with media.csv"
Output: Fussy_cat_dashboard.html
"""

import base64, csv, glob, html, io, os, re, sys
from collections import Counter
from PIL import Image
try:
    import cv2
except Exception:
    cv2 = None

VERSION = "v6 (2025-08-18) — lightbox + read-more + link button"

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
VID_EXT = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}

AI_FINDINGS = {
    1443: ("AI-generated video", "AI-generated (Veo/Gemini watermark)"),
    949:  ("AI / fake photo", "AI-generated / composite image"),
    494:  ("Stock image", "Looks like a stock photo, not their own cat"),
    798:  ("Stock image", "Looks like a stock photo, not their own cat"),
    448:  ("Stock image", "Looks like a stock photo, not their own cat"),
    614:  ("Stock image", "Looks like a stock photo, not their own cat"),
    186:  ("Graphic / poster", "A designed poster, not a real photo"),
    650:  ("Graphic / listing", "A 'for sale' graphic, not a real photo"),
}

CONFIRMED_CATS = {n.lower() for n in [
    "Aryan Raj", "APRAJIT PODDAR", "Casius cochikunnel", "Mohd Danish zafar",
    "Shariffs crazy", "ARJUN", "Supriya Raju", "Mohd zaid", "Rajat Biswas",
    "Faizal hossain", "Thirunavukkarasu", "PARIMAL KUMAR GAMIT", "Bhuwan Sharma",
    "Ajoy shil", "Alisha mansoor", "Anosh m", "Daler singh", "Doli das",
    "Sarathy", "Senti", "RIKUL SARMA", "Hayat", "Twinkle Dutta", "Ali Ahmad",
]}

# ---- inline icons (currentColor) ----
IC_PERSON = "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2'><circle cx='12' cy='8' r='3.2'/><path d='M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6'/></svg>"
IC_EXPAND = "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2'><path d='M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5'/></svg>"
IC_UP = "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='2'><path d='M12 16V5M8 9l4-4 4 4'/><path d='M5 16v3h14v-3'/></svg>"
IC_IG = "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='5'/><circle cx='12' cy='12' r='4'/><circle cx='17.5' cy='6.5' r='1.1' fill='currentColor' stroke='none'/></svg>"
IC_CHECK = "<svg viewBox='0 0 24 24' width='13' height='13' fill='none' stroke='currentColor' stroke-width='3'><path d='M20 6L9 17l-5-5'/></svg>"
IC_X = "<svg viewBox='0 0 24 24' width='13' height='13' fill='none' stroke='currentColor' stroke-width='3'><path d='M6 6l12 12M18 6L6 18'/></svg>"
IC_BANG = "<svg viewBox='0 0 24 24' width='13' height='13' fill='none' stroke='currentColor' stroke-width='3'><path d='M12 6v8M12 18h.01'/></svg>"
IC_BELL = "<svg viewBox='0 0 24 24' width='13' height='13' fill='none' stroke='currentColor' stroke-width='2.4'><path d='M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0'/></svg>"


def safe_name(n):
    n = re.sub(r"[^\w\s-]", "", (n or "").strip())
    return re.sub(r"\s+", "_", n) or "unknown"

def is_ig(u):
    return bool(re.search(r"instagram\.com/(p|reel|reels|tv|stories)/", u or ""))

def cat_yes(s):
    return (s or "").strip().upper().startswith("CAT")

def cat_class(s):
    s = (s or "").strip()
    if not s:
        return "unknown"
    if s.upper().startswith("CAT"):
        return "cat"
    if "saw:" in s.lower():
        return "other"
    return "unclear"

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

def embed_image(path, maxdim=560, q=72):
    try:
        return _encode(Image.open(path), maxdim, q)
    except Exception:
        return None

def embed_video_frame(path, maxdim=560, q=72):
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

def embed_any(path, maxdim=560, q=72):
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

def simval(d):
    s = str(d.get("similarity", "")).replace("%", "").strip()
    try:
        return int(s)
    except Exception:
        return -1

def t1_status(v):
    if v in ("SAME", "LIKELY SAME"):
        return "match"
    if v == "DIFFERENT":
        return "different"
    if v == "UNCERTAIN":
        return "unclear"
    return "pending"


def build():
    roster = sys.argv[1] if len(sys.argv) > 1 else find_roster()
    if not roster or not os.path.exists(roster):
        print('Roster CSV not found. Pass it: python3 build_dashboard.py "sheet.csv"')
        sys.exit(1)
    print(f"=== build_dashboard {VERSION} ===")
    print(f"Roster: {roster}")
    analysis = load_by_idx("analysis_results.csv")
    scan = load_by_idx("scan_results.csv")
    print(f"analysis rows: {len(analysis)} | scan rows: {len(scan)}")
    rows = list(csv.DictReader(open(roster, newline="", encoding="utf-8")))

    t1, t2, t3, t4 = [], [], [], []
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
            t1.append({
                "name": name, "row": i, "link": link,
                "chat_img": embed_any(first_in(os.path.join("s3_media", label + ".*"))),
                "ig_img": embed_any(first_in(os.path.join("downloads", label, "*"))),
                "chat_vid": bool(video),
                "verdict": a.get("match_verdict", "") or "PENDING",
                "similarity": a.get("similarity", ""),
                "ig_cat": a.get("instagram_has_cat", ""),
                "chat_cat": a.get("chat_image_has_cat", ""),
                "likes": a.get("likes", ""), "username": a.get("ig_username", ""),
                "caption": a.get("instagram_caption", ""),
                "ai": ai, "ai_mark": a.get("instagram_ai_wordmark", "")})
            continue

        has_media = bool(media_link)
        sc = scan.get(i, {})
        klass = cat_class(sc.get("has_cat")) if sc else "unknown"
        real_link = bool(link) and not link.lower().startswith("choice-")
        confirmed = name.strip().lower() in CONFIRMED_CATS
        img = embed_any(first_in(os.path.join("thumbs", label + ".*"))
                        or first_in(os.path.join("uploads_media", label + ".*")), 520, 70)
        mtype = "video" if video else "photo"

        if has_media and confirmed:
            t2.append({"name": name, "row": i, "img": img, "mtype": mtype, "klass": "cat"})
            continue
        if has_media and ai:
            t3.append({"name": name, "row": i, "img": img, "mtype": mtype,
                       "reason": ai[0], "detail": ai[1]})
            continue
        if real_link:
            ltype = ("They linked their profile, not a post"
                     if "instagram.com" in link else "Not a valid Instagram post link")
            t4.append({"name": name, "row": i, "link": link, "ltype": ltype, "img": img})
            continue
        if has_media:
            t2.append({"name": name, "row": i, "img": img, "mtype": mtype, "klass": klass})

    t1.sort(key=simval, reverse=True)

    # counts for filter chips
    s1 = Counter(t1_status(d["verdict"]) for d in t1)
    s2 = Counter("yes" if d["klass"] == "cat" else "verify" for d in t2)

    # ---------- render helpers ----------
    def badge(text, cls, icon=""):
        return f"<span class='b {cls}'>{icon}{esc(text)}</span>"

    def figure(src, cap, kind, is_vid=False):
        ic = IC_UP if kind == "chat" else IC_IG
        if src:
            vt = "<span class='vt'>video</span>" if is_vid else ""
            frame = (f"<div class='frame'><img loading='lazy' src='{src}'>"
                     f"<button class='expand' title='Expand'>{IC_EXPAND}</button>{vt}</div>")
        else:
            frame = "<div class='frame empty'>no image</div>"
        return f"<figure class='ph'>{frame}<figcaption>{ic}<span>{esc(cap)}</span></figcaption></figure>"

    def visit(url, text="View Instagram post"):
        return (f"<a class='visit' href='{esc(url)}' target='_blank' rel='noopener'>{IC_IG}"
                f"<span>{esc(text)}</span></a>")

    def caption_block(text):
        if not text:
            return ""
        return (f"<div class='capwrap'><div class='cap clamp'>{esc(text)}</div>"
                f"<button class='more' hidden>Read more</button></div>")

    aicon = {"green": IC_CHECK, "red": IC_X, "amber": IC_BANG, "purple": IC_BELL, "grey": IC_BANG}
    def action(kind, label, text):
        return (f"<div class='action {kind}'><span class='aicon'>{aicon[kind]}</span>"
                f"<span class='atxt'><span class='alabel'>{esc(label)}</span>"
                f"<span class='atext'>{esc(text)}</span></span></div>")

    def head(name, row):
        return (f"<div class='chead'><span class='avatar'>{IC_PERSON}</span>"
                f"<span class='nm'>{esc(name)}</span><span class='rw'>row {row}</span></div>")

    vmap = {"SAME": ("Match", "ok"), "LIKELY SAME": ("Likely match", "ok"),
            "UNCERTAIN": ("Unclear", "warn"), "DIFFERENT": ("Different", "bad"),
            "PENDING": ("Not fetched", "mut"), "NO COMPARISON": ("Not fetched", "mut")}

    # ---- Tab 1 ----
    c1 = []
    for d in t1:
        cat_ig = cat_yes(d["ig_cat"]); cat_chat = cat_yes(d["chat_cat"])
        is_ai = bool(d["ai"] or d["ai_mark"])
        vlabel, vcls = vmap.get(d["verdict"], (d["verdict"], "mut"))
        vicon = IC_CHECK if vcls == "ok" else (IC_X if vcls == "bad" else "")
        badges = [badge(vlabel + (f" · {d['similarity']}" if d["similarity"] else ""), vcls, vicon)]
        if d["verdict"] != "PENDING":
            badges.append(badge("Cat in post" if cat_ig else "No cat in post",
                                "ok" if cat_ig else "bad"))
        if is_ai:
            badges.append(badge("AI content", "bad"))
        if d["verdict"] == "PENDING":
            act = action("grey", "Fetch", "Post not downloaded yet")
        elif is_ai:
            act = action("red", "Disqualify", "AI-generated post")
        elif not cat_ig:
            act = action("red", "Disqualify", "No cat in the Instagram post")
        elif d["verdict"] == "DIFFERENT":
            act = action("amber", "Review", "Photo doesn’t match the post — check")
        elif d["verdict"] == "UNCERTAIN":
            act = action("amber", "Review", "Not sure it matches — check")
        else:
            act = action("green", "Qualified", "Approve — post matches and shows a cat")
        meta = []
        if d["username"]:
            meta.append("@" + esc(d["username"]))
        if str(d["likes"]) != "":
            meta.append(esc(d["likes"]) + " likes")
        inner = (head(d["name"], d["row"])
                 + f"<div class='pair'>{figure(d['chat_img'],'Chat upload','chat',d['chat_vid'])}"
                 f"{figure(d['ig_img'],'Instagram post','ig')}</div>"
                 f"<div class='badges'>{''.join(badges)}</div>"
                 + (f"<div class='meta'>{' &nbsp;·&nbsp; '.join(meta)}</div>" if meta else "")
                 + visit(d["link"]) + caption_block(d["caption"]) + act)
        c1.append(f"<article class='card' data-s='{t1_status(d['verdict'])}' data-name='{esc(d['name'].lower())}'>{inner}</article>")

    # ---- Tab 2 ----
    c2 = []
    for d in t2:
        if d["klass"] == "cat":
            cb = badge("Cat detected", "ok", IC_CHECK)
            act = action("purple", "Remind", "Ask them to post on Instagram and send the link")
            flag = "yes"
        else:
            cb = badge("Check it’s a cat", "warn")
            act = action("amber", "Verify", "Confirm it’s a cat, then remind them to post & send the link")
            flag = "verify"
        inner = (head(d["name"], d["row"])
                 + figure(d["img"], d["mtype"], "chat", d["mtype"] == "video")
                 + f"<div class='badges'>{cb}</div>" + act)
        c2.append(f"<article class='card' data-cat='{flag}' data-name='{esc(d['name'].lower())}'>{inner}</article>")

    # ---- Tab 3 ----
    c3 = []
    for d in t3:
        inner = (head(d["name"], d["row"])
                 + figure(d["img"], d["mtype"], "chat", d["mtype"] == "video")
                 + f"<div class='badges'>{badge(d['reason'], 'bad', IC_X)}</div>"
                 f"<div class='meta'>{esc(d['detail'])}</div>"
                 + action("red", "Disqualify", "Not a real cat photo — ask them to re-upload"))
        c3.append(f"<article class='card' data-name='{esc(d['name'].lower())}'>{inner}</article>")

    # ---- Tab 4 ----
    c4 = []
    for d in t4:
        inner = (head(d["name"], d["row"])
                 + (figure(d["img"], "their upload", "chat") if d["img"] else "")
                 + f"<div class='badges'>{badge('Wrong link', 'bad', IC_X)}</div>"
                 + visit(d["link"], "Open the link they sent")
                 + f"<div class='meta'>{esc(d['ltype'])}</div>"
                 + action("purple", "Request link", "Ask for the actual Instagram post link"))
        c4.append(f"<article class='card' data-name='{esc(d['name'].lower())}'>{inner}</article>")

    tabs = [
        ("Instagram submissions", len(t1),
         "Shared an Instagram link. Check the post matches their photo and shows a cat.",
         c1,
         f"<button class='chip on' data-f='all'>All · {len(t1)}</button>"
         f"<button class='chip' data-f='match'>Match · {s1['match']}</button>"
         f"<button class='chip' data-f='different'>Different · {s1['different']}</button>"
         f"<button class='chip' data-f='unclear'>Unclear · {s1['unclear']}</button>"
         f"<button class='chip' data-f='pending'>Not fetched · {s1['pending']}</button>"),
        ("No Instagram link", len(t2),
         "Sent a cat but no link. Ask them to post it on Instagram and share the link.",
         c2,
         f"<button class='chip on' data-f='all'>All · {len(t2)}</button>"
         f"<button class='chip' data-f='yes'>Cat detected · {s2['yes']}</button>"
         f"<button class='chip' data-f='verify'>Check it’s a cat · {s2['verify']}</button>"),
        ("Disqualified", len(t3),
         "Not a real cat photo — AI-made or stock content.",
         c3, ""),
        ("Invalid links", len(t4),
         "Sent the wrong kind of link. Ask them for the actual post link.",
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
:root{{--purple:#5e2a84;--purple-soft:#f3edf8;--ink:#241626;--body:#3d3444;--mut:#8a8291;
--line:#ece8f1;--bg:#faf8fb;--card:#fff;
--ok:#2f6a45;--okbg:#e9f3ec;--bad:#a83430;--badbg:#f7e9e7;--warn:#8a6a1e;--warnbg:#f6efdd;
--serif:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,'Times New Roman',serif;
--sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:var(--sans);color:var(--body);background:var(--bg);-webkit-font-smoothing:antialiased}}
.app{{display:flex;align-items:flex-start;max-width:1360px;margin:0 auto}}
.side{{width:260px;flex:none;position:sticky;top:0;height:100vh;padding:34px 26px;border-right:1px solid var(--line);background:#fff}}
.brand{{font-weight:800;letter-spacing:.22em;font-size:13px;color:var(--purple)}}
.prod{{font-family:var(--serif);font-size:24px;line-height:1.15;color:var(--ink);margin:6px 0 26px}}
.nav{{display:flex;width:100%;align-items:center;gap:10px;border:0;background:none;cursor:pointer;text-align:left;padding:11px 10px;border-radius:9px;color:var(--body);margin-bottom:2px}}
.nav:hover{{background:var(--bg)}} .nav.on{{background:var(--purple-soft);color:var(--purple)}}
.nav .n{{font-variant-numeric:tabular-nums;font-size:12px;color:var(--mut);width:20px}}
.nav.on .n{{color:var(--purple)}} .nav .t{{flex:1;font-size:14px;font-weight:600}}
.nav .c{{font-size:12px;color:var(--mut);font-variant-numeric:tabular-nums}}
.side .foot{{margin-top:26px;padding-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--mut);line-height:1.6}}
main{{flex:1;min-width:0;padding:44px 48px 80px}}
.panel{{display:none;max-width:1100px}} .panel.on{{display:block}}
.eye{{text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:700;color:var(--purple)}}
.disp{{font-family:var(--serif);font-weight:600;font-size:38px;line-height:1.1;color:var(--ink);margin:10px 0 12px}}
.lead{{font-size:17px;line-height:1.6;color:var(--mut);max-width:680px;margin:0 0 22px}}
hr{{border:0;border-top:1px solid var(--line);margin:0 0 24px}}
.toolbar{{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:22px}}
.search{{flex:1;min-width:220px;padding:11px 15px;border:1px solid var(--line);border-radius:10px;font-size:14px;font-family:var(--sans);background:#fff}}
.search:focus{{outline:none;border-color:var(--purple)}}
.chips{{display:flex;gap:7px;flex-wrap:wrap}}
.chip{{border:1px solid var(--line);background:#fff;padding:8px 13px;border-radius:999px;cursor:pointer;font-size:13px;color:var(--body);font-family:var(--sans);font-variant-numeric:tabular-nums}}
.chip.on{{background:var(--purple);color:#fff;border-color:var(--purple)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column}}
.chead{{display:flex;align-items:center;gap:10px;margin-bottom:12px}}
.avatar{{width:34px;height:34px;border-radius:50%;background:var(--purple-soft);color:var(--purple);display:flex;align-items:center;justify-content:center;flex:none}}
.nm{{font-size:16px;font-weight:700;color:var(--ink);flex:1}}
.rw{{font-size:12px;color:var(--mut);font-variant-numeric:tabular-nums}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
.ph{{margin:0}}
.frame{{position:relative;border-radius:12px;overflow:hidden;background:#f1eef4;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center}}
.frame img{{width:100%;height:100%;object-fit:cover;cursor:zoom-in}}
.frame.empty{{color:var(--mut);font-size:13px}}
.expand{{position:absolute;top:8px;right:8px;width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.9);color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.2)}}
.expand:hover{{background:#fff}}
.vt{{position:absolute;top:8px;left:8px;background:rgba(36,22,38,.72);color:#fff;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:999px}}
figcaption{{display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.08em;font-size:10.5px;font-weight:700;color:var(--mut);margin-top:8px}}
figcaption svg{{opacity:.8}}
.badges{{display:flex;flex-wrap:wrap;gap:7px;margin:13px 0 2px}}
.b{{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:5px 11px;border-radius:999px;white-space:nowrap}}
.b.ok{{background:var(--okbg);color:var(--ok)}} .b.bad{{background:var(--badbg);color:var(--bad)}}
.b.warn{{background:var(--warnbg);color:var(--warn)}} .b.mut{{background:#efedf2;color:var(--mut)}}
.meta{{color:var(--mut);font-size:13px;margin-top:9px}}
.visit{{display:inline-flex;align-items:center;gap:7px;margin-top:11px;padding:9px 13px;border:1px solid var(--line);border-radius:10px;color:var(--purple);font-size:13px;font-weight:600;text-decoration:none;width:fit-content}}
.visit:hover{{background:var(--purple-soft);border-color:var(--purple-soft)}}
.capwrap{{margin-top:11px}}
.cap{{font-family:var(--serif);font-style:italic;font-size:14.5px;line-height:1.5;color:var(--body);white-space:pre-wrap}}
.cap.clamp{{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}}
.more{{border:0;background:none;color:var(--purple);font-size:13px;font-weight:600;cursor:pointer;padding:4px 0 0}}
.action{{margin-top:14px;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px}}
.aicon{{width:30px;height:30px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff}}
.atxt{{display:flex;flex-direction:column;gap:1px}}
.alabel{{text-transform:uppercase;letter-spacing:.07em;font-size:11px;font-weight:800}}
.atext{{font-size:13px;line-height:1.4}}
.action.green{{background:var(--okbg)}} .action.green .aicon{{background:var(--ok)}} .action.green .alabel{{color:var(--ok)}} .action.green .atext{{color:#2c5a3c}}
.action.red{{background:var(--badbg)}} .action.red .aicon{{background:var(--bad)}} .action.red .alabel{{color:var(--bad)}} .action.red .atext{{color:#8f3a36}}
.action.amber{{background:var(--warnbg)}} .action.amber .aicon{{background:var(--warn)}} .action.amber .alabel{{color:var(--warn)}} .action.amber .atext{{color:#725722}}
.action.purple{{background:var(--purple-soft)}} .action.purple .aicon{{background:var(--purple)}} .action.purple .alabel{{color:var(--purple)}} .action.purple .atext{{color:#5a437a}}
.action.grey{{background:#eef0f3}} .action.grey .aicon{{background:#8a93a0}} .action.grey .alabel{{color:#5c6470}} .action.grey .atext{{color:#5c6470}}
.noresults{{color:var(--mut);padding:34px;text-align:center}}
.lb{{position:fixed;inset:0;background:rgba(20,12,22,.9);display:flex;align-items:center;justify-content:center;z-index:50;padding:24px;cursor:zoom-out}}
.lb[hidden]{{display:none}}
.lb img{{max-width:96vw;max-height:92vh;border-radius:10px;object-fit:contain}}
.lbx{{position:fixed;top:18px;right:22px;width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:24px;cursor:pointer}}
@media(max-width:820px){{
.app{{display:block}} .side{{width:auto;height:auto;position:static;border-right:0;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:18px}}
.prod{{margin:0 18px 0 0}} .nav{{width:auto;margin:0}} .side .foot{{display:none}}
main{{padding:26px 18px 60px}} .disp{{font-size:30px}}}}
</style></head><body>
<div class=app>
<aside class=side>
<div class=brand>WHISKAS</div>
<div class=prod>Fussy&nbsp;Cat<br>UGC Review</div>
<nav>{nav}</nav>
<div class=foot>{esc(summary)}<br><br>#MyFussyCatAd<br><span style="opacity:.6">{esc(VERSION)}</span></div>
</aside>
<main>{''.join(panels)}</main>
</div>
<div id=lb class=lb hidden><img alt=""><button class=lbx>×</button></div>
<script>
const navs=[...document.querySelectorAll('.nav')],panels=[...document.querySelectorAll('.panel')];
navs.forEach(n=>n.onclick=()=>{{navs.forEach(x=>x.classList.remove('on'));
panels.forEach(x=>x.classList.remove('on'));n.classList.add('on');
panels[+n.dataset.t].classList.add('on');window.scrollTo(0,0);}});
function apply(p){{const q=(p.querySelector('.search').value||'').toLowerCase().trim();
const chip=p.querySelector('.chip.on');const f=chip?chip.dataset.f:'all';let vis=0;
p.querySelectorAll('.card').forEach(c=>{{const okN=!q||(c.dataset.name||'').includes(q);
let okF=true;if(f&&f!=='all')okF=(c.dataset.s===f)||(c.dataset.cat===f);
const s=okN&&okF;c.style.display=s?'':'none';if(s)vis++;}});
p.querySelector('.noresults').hidden=vis>0;}}
panels.forEach(p=>{{p.querySelector('.search').addEventListener('input',()=>apply(p));
p.querySelectorAll('.chip').forEach(ch=>ch.onclick=()=>{{
p.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));ch.classList.add('on');apply(p);}});}});
// read-more
document.querySelectorAll('.capwrap').forEach(w=>{{const cap=w.querySelector('.cap'),btn=w.querySelector('.more');
if(cap.scrollHeight-cap.clientHeight>2){{btn.hidden=false;
btn.onclick=()=>{{const on=cap.classList.toggle('clamp');btn.textContent=on?'Read more':'Read less';}};}}}});
// lightbox
const lb=document.getElementById('lb'),lbimg=lb.querySelector('img');
function open(src){{if(src){{lbimg.src=src;lb.hidden=false;}}}}
document.querySelectorAll('.frame img').forEach(im=>im.onclick=()=>open(im.src));
document.querySelectorAll('.expand').forEach(b=>b.onclick=e=>{{e.stopPropagation();const im=b.closest('.frame').querySelector('img');open(im&&im.src);}});
lb.onclick=()=>lb.hidden=true;
document.addEventListener('keydown',e=>{{if(e.key==='Escape')lb.hidden=true;}});
</script></body></html>"""

    out = "Fussy_cat_dashboard.html"
    with open(out, "w", encoding="utf-8") as f:
        f.write(doc)
    mb = os.path.getsize(out) / 1e6
    print(f"\nWrote {out}  ({mb:.1f} MB)")
    print(f"  01 Instagram submissions: {len(t1)}  (match {s1['match']} · different {s1['different']} · unclear {s1['unclear']} · pending {s1['pending']})")
    print(f"  02 No Instagram link:     {len(t2)}  (cat {s2['yes']} · verify {s2['verify']})")
    print(f"  03 Disqualified:          {len(t3)}")
    print(f"  04 Invalid links:         {len(t4)}")
    print("\nOpen it:  open Fussy_cat_dashboard.html")


if __name__ == "__main__":
    build()
