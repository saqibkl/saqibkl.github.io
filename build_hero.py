"""Header collage: crop the logo out of a flat-colour slide so the tile shows the whole logo on its own brand colour.
Run:  python -I build_hero.py   -> img/hero/<slug>.jpg + prints the JS list for app.js"""
import json
from pathlib import Path
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent
PICKS = [  # (project slug, module image number) - logo on one solid brand colour
    ("bound-nature-first-living-brand-identity", 1),
    ("nearside-a-modern-brand-identity-for-digital-growth", 2),
    ("pro-premium-supplement-branding", 1),
    ("uphope-luxury-brand-identity", 2),
    ("qore-core-driven-strategy-brand-identity", 2),
]


def crop_logo(src: Path, dst: Path) -> dict:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    px = im.load()
    border = [px[x, y] for x in range(0, w, 4) for y in (2, h - 3)] + [px[x, y] for y in range(0, h, 4) for x in (2, w - 3)]
    bg = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))
    # rows/columns where enough pixels differ strongly from the background; ignores faint texture and grid lines
    fg = [[sum(abs(px[x, y][i] - bg[i]) for i in range(3)) > 110 for x in range(0, w, 2)] for y in range(0, h, 2)]
    edge = lambda i, n: n * .1 < i < n * .9  # slides keep the logo central; skip mockup edges
    rows = [y * 2 for y, r in enumerate(fg) if sum(r) > len(r) * .01 and edge(y, len(fg))]
    cols = [x * 2 for x in range(len(fg[0])) if sum(r[x] for r in fg) > len(fg) * .01 and edge(x, len(fg[0]))]
    assert rows and cols, f"no logo found in {src}"
    box = (cols[0], rows[0], cols[-1] + 2, rows[-1] + 2)
    # copy only the tight logo box onto a plain canvas of the slide colour: no stray arcs or grid lines around it
    pad = round(max(box[2] - box[0], box[3] - box[1]) * .12)
    tight = im.crop(box)
    # keep strong logo pixels plus a soft rim (anti-aliasing); faint arcs and uneven slide background become flat colour
    strong = Image.eval(tight.convert("L").point(lambda _: 0), lambda v: v)
    strong.putdata([255 if sum(abs(c[i] - bg[i]) for i in range(3)) > 110 else 0 for c in tight.getdata()])
    rim = strong.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(1.5))
    tight = Image.composite(tight, Image.new("RGB", tight.size, bg), rim)
    tight = tight.crop(rim.point(lambda v: 255 if v > 40 else 0).getbbox())  # trim the space the removed lines left behind
    logo = Image.new("RGB", (tight.width + 2 * pad, tight.height + 2 * pad), bg)
    logo.paste(tight, (pad, pad))
    dst.parent.mkdir(parents=True, exist_ok=True)
    logo.save(dst, "JPEG", quality=92)
    return {"src": dst.relative_to(OUT).as_posix(), "w": logo.width, "h": logo.height, "bg": "#%02x%02x%02x" % bg}


if __name__ == "__main__":
    tiles = [dict(slug=s, **crop_logo(OUT / "img" / s / f"{n:02d}.jpg", OUT / "img" / "hero" / f"{s.split('-')[0]}.jpg")) for s, n in PICKS]
    print(json.dumps(tiles, indent=1))
