#!/usr/bin/env python3
"""Make analyze_sheet.py RETRY the Instagram posts that failed to fetch.

The analysis checkpoint marks failed rows as done, so they are never retried.
This clears every "NO COMPARISON" row from the checkpoint (keeping a backup),
so the next analyze_sheet.py run downloads those posts again.

Story links are NOT retried by default — Stories expire after 24 h and are
permanently gone. Add --stories to retry them anyway.

IMPORTANT: export a FRESH cookies.txt first. Stale cookies are the usual
reason valid posts fail.

Run in the Fussy cat folder:
    python3 retry_failed.py
    python3 analyze_sheet.py "Fussy chat - all with media v2.csv"
    python3 rethreshold.py
    python3 build_dashboard.py "Fussy chat - all with media v2.csv"

If some still fail (rate limiting), wait 15-30 min, then run retry_failed.py
and analyze_sheet.py again — each pass usually recovers more.
"""

import json, os, shutil, sys, time

CKPT = "analysis_checkpoint.jsonl"


def main():
    if not os.path.exists(CKPT):
        print(f"{CKPT} not found — run analyze_sheet.py first.")
        sys.exit(1)
    include_stories = "--stories" in sys.argv

    rows = [json.loads(l) for l in open(CKPT, encoding="utf-8") if l.strip()]
    keep, cleared, stories_kept = [], [], 0
    for r in rows:
        link = (r.get("instagram_link") or "").lower()
        is_story = "/stories/" in link
        if r.get("match_verdict") == "NO COMPARISON":
            if is_story and not include_stories:
                stories_kept += 1
                keep.append(r)
                continue
            cleared.append(r)
            continue
        keep.append(r)

    if not cleared:
        print("Nothing to retry — no failed (non-Story) rows in the checkpoint.")
        if stories_kept:
            print(f"({stories_kept} expired Story links left alone; --stories to force.)")
        return

    backup = CKPT + ".bak." + time.strftime("%Y%m%d%H%M%S")
    shutil.copy(CKPT, backup)
    with open(CKPT, "w", encoding="utf-8") as f:
        f.write("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in keep))

    print(f"Cleared {len(cleared)} failed rows — analyze_sheet.py will retry them:")
    for r in cleared:
        print(f"  row {r.get('idx','?'):>4}  {r.get('name','')}")
    if stories_kept:
        print(f"\nLeft alone: {stories_kept} expired Story links (permanently gone).")
    print(f"\nBackup of the old checkpoint: {backup}")
    print("\nNext (make sure cookies.txt is FRESH):")
    print('  python3 analyze_sheet.py "Fussy chat - all with media v2.csv"')
    print("  python3 rethreshold.py")
    print('  python3 build_dashboard.py "Fussy chat - all with media v2.csv"')


if __name__ == "__main__":
    main()
