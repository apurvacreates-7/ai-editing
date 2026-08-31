#!/usr/bin/env python3
"""Interactively name the cropped Instagram screenshots and move them into
manual_ig/ so build_dashboard.py uses them as the Instagram-post image.

Each image opens in Preview; you type the person's name (or a number from the
suggested list). The file is copied to manual_ig/<name>.<ext>.

Run in the Fussy cat folder:
    python3 rename_manual.py            # reads from ./manual
    python3 rename_manual.py somefolder # reads from a different folder
"""

import glob, os, shutil, subprocess, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "manual"
DST = "manual_ig"
EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}

# the people whose posts couldn't be fetched (type the number to pick quickly)
SUGGEST = ["Mr Rahul", "Nazar", "Janhabi Das", "Salim", "Shaikh sahal",
           "Aleena", "Niraj Kumar"]


def main():
    files = sorted(p for p in glob.glob(os.path.join(SRC, "*"))
                   if os.path.splitext(p)[1].lower() in EXT)
    if not files:
        print(f"No images found in {SRC}/  (pass the folder name as an argument)")
        return
    os.makedirs(DST, exist_ok=True)

    print(f"{len(files)} image(s) in {SRC}/\n")
    print("Suggested names — type the NUMBER to pick, or type any other name:")
    for n, nm in enumerate(SUGGEST, 1):
        print(f"   {n}. {nm}")
    print("   (just press Enter to skip an image)\n")

    for p in files:
        subprocess.run(["open", "-g", p])   # preview it (‑g keeps focus in Terminal)
        ans = input(f"  {os.path.basename(p)}  ->  who is this? ").strip()
        if not ans:
            print("     skipped")
            continue
        name = SUGGEST[int(ans) - 1] if ans.isdigit() and 1 <= int(ans) <= len(SUGGEST) else ans
        dst = os.path.join(DST, name + os.path.splitext(p)[1].lower())
        shutil.copy(p, dst)
        print(f"     saved  {dst}")

    saved = [os.path.basename(x) for x in glob.glob(os.path.join(DST, "*"))]
    print(f"\nmanual_ig/ now has {len(saved)} file(s): {', '.join(sorted(saved))}")
    print("\nNow rebuild:")
    print('  python3 build_dashboard.py "Fussy chat - all with media v2.csv"')
    print("  cp Fussy_cat_dashboard.html index.html")


if __name__ == "__main__":
    main()
