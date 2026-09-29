#!/usr/bin/env bash
# Master render. The film is shot on twos, so every pose is drawn once at 12 fps
# and held for two frames when encoding the 24 fps master. The audio mix (score +
# foley) comes from the 24 fps composition so every sound keeps its exact timing,
# then gets mastered to -16 LUFS / -1 dBTP.
#
# Writes out/freestand-studio.mp4 (master, CRF 18) and
#        out/freestand-studio-share.mp4 (lighter copy for email and chat).
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=${1:-out/freestand-studio.mp4}
FRAMES=out/frames12

if [[ "${SKIP_FRAMES:-0}" != "1" ]]; then
  rm -rf "$FRAMES"
  mkdir -p "$FRAMES"
  npx remotion render FreestandFilm12 "$FRAMES" --sequence --image-format=jpeg --jpeg-quality=95 --concurrency="${CONCURRENCY:-4}"
fi
npx remotion render FreestandFilm out/mix.wav --codec=wav
python3 scripts/master_audio.py out/mix.wav out/mix-master.wav

encode() {
  local crf=$1 abr=$2 out=$3
  npx remotion ffmpeg -y -hide_banner -loglevel error \
    -framerate 12 -pattern_type glob -i "$FRAMES/*.jpeg" \
    -i out/mix-master.wav \
    -r 24 -fps_mode cfr -pix_fmt yuv420p \
    -c:v libx264 -preset slow -crf "$crf" -x264-params keyint=48:min-keyint=24 \
    -c:a aac -b:a "$abr" -ar 48000 \
    -movflags +faststart -shortest \
    "$out"
  echo "wrote $out"
}

encode 18 256k "$OUT"
encode 25 160k "${OUT%.mp4}-share.mp4"
