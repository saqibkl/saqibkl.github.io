"""Crop a full Behance-page screenshot into module JPGs + the Option A thumbnail.
usage: python -I alvi_crop.py slug page_png 'json_mods' minx miny
mods: [[name,x,y,w,h],...] as returned by Figma; writes ../Behance Uploads/Alvi/<slug>/"""
import json, sys
from pathlib import Path
from PIL import Image

slug, png, mods, minx, miny = sys.argv[1], sys.argv[2], json.loads(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
out = Path(__file__).resolve().parent.parent / "Behance Uploads" / "Alvi" / slug
out.mkdir(parents=True, exist_ok=True)
im = Image.open(png).convert("RGB")
k = 0
for name, x, y, w, h in sorted(mods, key=lambda m: m[2]):
    box = tuple(round(v) for v in (x - minx, y - miny, x - minx + w, y - miny + h))
    crop = im.crop(box)
    if name.startswith("Thumbnail"):
        crop.save(out / "00_thumbnail.jpg", quality=90)
        continue
    k += 1
    crop.save(out / f"{k:02d}_{name.split(' ', 1)[1].lower().replace(' ', '_')}.jpg", quality=90)
print(slug, k, "modules")
