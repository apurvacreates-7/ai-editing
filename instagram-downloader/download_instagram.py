#!/usr/bin/env python3
"""
Download Instagram posts / reels / videos / photos listed in a CSV.

Uses gallery-dl (downloads BOTH images and videos).

Usage:
    python3 download_instagram.py <csv_file> [browser]

Login (needed for most Instagram content):
  Preferred — a cookies file:
    Put a file whose name contains "cookies" and ends in .txt (e.g.
    cookies.txt, www.instagram.com_cookies.txt) in this folder. It is
    detected and used automatically.
  Alternative — a browser session:
    Pass a browser name as the 2nd argument (chrome | safari | firefox |
    edge | brave). Note: recent Chrome encrypts cookies and often fails.

Media is saved into ./downloads/NN_Name/ (a folder per person).
"""

import csv
import glob
import os
import re
import subprocess
import sys

OUT_DIR = "downloads"


def safe_name(name: str) -> str:
    name = re.sub(r"[^\w\s-]", "", name.strip())
    name = re.sub(r"\s+", "_", name)
    return name or "unknown"


def is_profile_only(url: str) -> bool:
    return not re.search(r"/(p|reel|reels|tv|stories)/", url)


def find_cookies_file() -> str | None:
    for pat in ("cookies.txt", "*cookies*.txt", "*Cookies*.txt"):
        hits = sorted(glob.glob(pat))
        if hits:
            return hits[0]
    return None


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 download_instagram.py <csv_file> [browser]")
        sys.exit(1)

    csv_path = sys.argv[1]
    browser = sys.argv[2].strip().lower() if len(sys.argv) > 2 else None
    cookies = find_cookies_file()

    if not os.path.exists(csv_path):
        print(f"CSV not found: {csv_path}")
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    if cookies:
        print(f"Using cookies file: {cookies}\n")
    elif browser:
        print(f"Using your {browser} login session.\n")
    else:
        print("No login provided — only fully public posts will work.\n")

    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = (row.get("name") or row.get("Name") or "").strip()
            link = (row.get("link of video") or row.get("link") or "").strip()
            if link:
                rows.append((name, link))

    total = len(rows)
    print(f"Found {total} links.\n")
    ok, failed, skipped = [], [], []

    for i, (name, url) in enumerate(rows, start=1):
        label = f"{i:02d}_{safe_name(name)}"
        print(f"[{i}/{total}] {name}  ->  {url}")

        if is_profile_only(url):
            print("   ! Profile link — skipping.\n")
            skipped.append((name, url, "profile link, no specific post"))
            continue

        dest = os.path.join(OUT_DIR, label)
        cmd = [sys.executable, "-m", "gallery_dl", "-D", dest,
               "--sleep-request", "2"]
        if cookies:
            cmd += ["--cookies", cookies]
        elif browser:
            cmd += ["--cookies-from-browser", browser]
        cmd.append(url)

        result = subprocess.run(cmd, capture_output=True, text=True)
        got = os.path.isdir(dest) and os.listdir(dest)

        if result.returncode == 0 and got:
            print(f"   OK ({len(os.listdir(dest))} file(s))\n")
            ok.append((name, url))
        else:
            err = (result.stderr or result.stdout).strip().splitlines()
            reason = err[-1] if err else "nothing downloaded"
            print(f"   FAILED: {reason}\n")
            failed.append((name, url, reason))

    print("=" * 60)
    print(f"DONE.  {len(ok)} downloaded, {len(failed)} failed, {len(skipped)} skipped.")
    print(f"Files are in: {os.path.abspath(OUT_DIR)}")
    if failed:
        print("\nFAILED:")
        for name, url, reason in failed:
            print(f"  - {name}: {reason}")
    if skipped:
        print("\nSKIPPED:")
        for name, url, reason in skipped:
            print(f"  - {name}: {reason}")


if __name__ == "__main__":
    main()
