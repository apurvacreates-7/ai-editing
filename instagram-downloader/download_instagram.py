#!/usr/bin/env python3
"""
Download Instagram posts / reels / videos listed in a CSV.

CSV format (header row required):
    name,link of video
    Deepak,https://www.instagram.com/p/Db720RDMnVQ/...
    ...

Files are saved into ./downloads/ named after the person, e.g. "01_Deepak.mp4".

--------------------------------------------------------------------------------
SETUP (one time)
--------------------------------------------------------------------------------
1. Install Python 3 (https://python.org) if you don't have it.
2. Install yt-dlp:
       pip install -U yt-dlp
   (yt-dlp also uses ffmpeg for some formats; install it if prompted:
    macOS: `brew install ffmpeg`  |  Windows: https://ffmpeg.org  |  Linux: `sudo apt install ffmpeg`)

--------------------------------------------------------------------------------
RUN
--------------------------------------------------------------------------------
    python download_instagram.py "Fussy_chat__for_claude.csv"

If some downloads fail with a login/"rate-limit"/"login required" error,
Instagram wants a logged-in session. Export your browser cookies to a file
called cookies.txt (use a browser extension like "Get cookies.txt LOCALLY"),
put it next to this script, and run again — the script picks it up automatically.
--------------------------------------------------------------------------------
"""

import csv
import os
import re
import subprocess
import sys

OUT_DIR = "downloads"
COOKIES_FILE = "cookies.txt"  # optional; used automatically if present


def safe_name(name: str) -> str:
    """Make a filesystem-safe version of a person's name."""
    name = name.strip()
    name = re.sub(r"[^\w\s-]", "", name)          # drop odd characters
    name = re.sub(r"\s+", "_", name)              # spaces -> underscores
    return name or "unknown"


def is_profile_only(url: str) -> bool:
    """True if the URL points at a profile, not a specific post/reel/story."""
    return not re.search(r"/(p|reel|reels|tv|stories)/", url)


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python download_instagram.py <csv_file>")
        sys.exit(1)

    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print(f"CSV not found: {csv_path}")
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    use_cookies = os.path.exists(COOKIES_FILE)
    if use_cookies:
        print(f"Using cookies from {COOKIES_FILE}\n")

    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # tolerate slightly different header names
            name = row.get("name") or row.get("Name") or ""
            link = row.get("link of video") or row.get("link") or ""
            if link.strip():
                rows.append((name.strip(), link.strip()))

    total = len(rows)
    print(f"Found {total} links.\n")

    ok, failed, skipped = [], [], []

    for i, (name, url) in enumerate(rows, start=1):
        label = f"{i:02d}_{safe_name(name)}"
        print(f"[{i}/{total}] {name}  ->  {url}")

        if is_profile_only(url):
            print("   ! This is a profile link, not a specific post — skipping.\n")
            skipped.append((name, url, "profile link, no specific post"))
            continue

        out_template = os.path.join(OUT_DIR, f"{label}.%(ext)s")
        cmd = [
            sys.executable, "-m", "yt_dlp",
            "-o", out_template,
            "--no-warnings",
            "--retries", "3",
            "--sleep-requests", "2",      # be gentle: pause between requests
            url,
        ]
        if use_cookies:
            cmd += ["--cookies", COOKIES_FILE]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("   OK\n")
            ok.append((name, url))
        else:
            err = (result.stderr or result.stdout).strip().splitlines()
            reason = err[-1] if err else "unknown error"
            print(f"   FAILED: {reason}\n")
            failed.append((name, url, reason))

    # ---- summary ----
    print("=" * 70)
    print(f"DONE.  {len(ok)} downloaded, {len(failed)} failed, {len(skipped)} skipped.")
    print(f"Files are in: {os.path.abspath(OUT_DIR)}")
    if failed:
        print("\nFAILED:")
        for name, url, reason in failed:
            print(f"  - {name}: {reason}\n      {url}")
    if skipped:
        print("\nSKIPPED:")
        for name, url, reason in skipped:
            print(f"  - {name}: {reason}\n      {url}")
    print("\nTip: most failures are Instagram asking for login. Add cookies.txt and re-run.")


if __name__ == "__main__":
    main()
