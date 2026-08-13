# Instagram bulk downloader

Downloads Instagram posts / reels / videos listed in a CSV, using
[`yt-dlp`](https://github.com/yt-dlp/yt-dlp). Files are named after the person
in each row (e.g. `01_Deepak.mp4`) and saved to a `downloads/` folder.

## CSV format

A header row plus one link per row:

```
name,link of video
Deepak,https://www.instagram.com/p/Db720RDMnVQ/...
```

## Setup (one time)

1. Install Python 3: https://python.org
2. Install yt-dlp:
   ```
   pip install -U yt-dlp
   ```
   (Install `ffmpeg` too if prompted — needed for some formats.)

## Run

```
python download_instagram.py your_file.csv
```

## Notes

- **Profile links** (e.g. `instagram.com/username`) point at a whole account,
  not a single post, so they are skipped. Supply the specific post/reel link.
- **Stories** expire after 24 hours and cannot be recovered once gone.
- If a download fails with a **login-required** error, Instagram wants a
  logged-in session. Export your browser cookies to `cookies.txt` (browser
  extension "Get cookies.txt LOCALLY"), place it next to the script, and re-run
  — it is picked up automatically.
- The script pauses between requests to avoid rate-limiting.

## Note on the cloud environment

This tool exists because Instagram (and general web traffic) is blocked by the
network policy of the Claude Code cloud session it was built in, so downloads
must be run on a machine with normal internet access.
