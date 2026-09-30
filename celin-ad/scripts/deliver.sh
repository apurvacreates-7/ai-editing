#!/usr/bin/env bash
# Builds every deliverable and copies it to an output folder.
#   bash scripts/deliver.sh                       -> /mnt/user-data/outputs
#   bash scripts/deliver.sh ~/Desktop/celin       -> anywhere else
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-/mnt/user-data/outputs}"

npm run audio
npm run srt
npm run preview
npm run stills
npm run render

mkdir -p "$OUT/preview" "$OUT/celin-ad"
cp out/celin-ad.mp4 "$OUT/celin-ad.mp4"
cp out/celin-ad-vo.srt "$OUT/celin-ad-vo.srt"
cp out/stills/celin-ad-frame-140.png out/stills/celin-ad-frame-260.png out/stills/celin-ad-frame-430.png "$OUT/"
cp out/celin-ad-preview.mp4 "$OUT/preview/celin-ad-preview.mp4"
# source, without dependencies or renders
tar -c --exclude=./node_modules --exclude=./out . | tar -x -C "$OUT/celin-ad"
echo "Deliverables in $OUT"
