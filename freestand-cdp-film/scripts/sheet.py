"""Tile review stills into one labelled contact sheet.
usage: python3 scripts/sheet.py <out.png> <cols> <img> [<img> ...]
"""
import sys

from PIL import Image, ImageDraw

out, cols, *files = sys.argv[1:]
cols = int(cols)
ims = [Image.open(f).convert("RGB") for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 8) + 8, rows * (h + 30) + 8), (24, 24, 24))
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x = 8 + (i % cols) * (w + 8)
    y = 8 + (i // cols) * (h + 30)
    sheet.paste(im, (x, y))
    d.text((x + 4, y + h + 6), f.split("/")[-1], fill=(220, 220, 220))
sheet.save(out)
print("sheet", out, sheet.size)
