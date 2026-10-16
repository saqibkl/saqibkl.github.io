"""Build img/ and data.js for the portfolio from the Behance and Upwork export folders.
Run:  python build.py   (re-run after adding a project; only changed images are re-encoded)"""
import json, re
from pathlib import Path
from PIL import Image

SAQIB = Path(__file__).resolve().parent.parent
BEHANCE = SAQIB / "Behance Uploads"
CATALOG = SAQIB / "Upwork Thumbnails" / "catalog"
OUT = Path(__file__).resolve().parent
IMG = OUT / "img"

# Web projects: folder name -> slug (order = order on the site)
WEB = [
    ("08 WorkStreams", "workstreams"), ("05 Noara Labs", "noara-labs"), ("01 Siepay Landing", "siepay"),
    ("02 Siepay Dashboard", "siepay-dashboard"), ("09 Gear Website", "gear"), ("07 Whitte-more", "whittemore"),
    ("03 In Twinn Studio", "inntwin-studio"), ("04 In Twinn Data Platform", "inntwin-data"),
    ("10 Search Light", "searchlight"), ("06 SpiceWeb", "spiceweb"), ("11 WS", "winder-stilhaus"),
    ("12 Passion", "passion"), ("13 Greenstead", "greenstead"),
]
FALLBACK = {  # folders without post.md
    "spiceweb": dict(title="SpiceWeb Media: Digital Agency Website", tags=["web design", "agency", "ui design"],
                     cats="UI/UX, Web Design",
                     desc="A website for SpiceWeb Media, a full-service digital agency for branding, websites, SEO and ads. "
                          "Bold monochrome with one spice red, device mockups and a portfolio-led layout across 9 pages, "
                          "including a client case study and a booking confirmation page."),
}
# Branding projects: slug, title, cover in catalog/export-brand, gallery folder + files
BRAND = [
    ("stratanova", "Stratanova Brand Identity", "01_stratanova.jpg", "stratanova",
     ["v5_hero.jpg", "v4_card.jpg", "v4_cup.jpg", "v4_deck.jpg", "v4_tee.jpg", "v4_car.jpg"]),
    ("cnmi-central", "CNMI Central Brand Identity", "07_cnmi.jpg", "cnmi", list("ABCDE")),
    ("universal-hr", "Universal HR Brand Identity", "06_universal_hr.jpg", "uhr", list("ABCDE")),
    ("heavens-chefs", "Heaven's Chefs Brand Identity", "05_heavens_chefs.jpg", "heavens", list("ABCDE")),
    ("noara-brand", "Noara Labs Brand Identity", "02_noara_labs.jpg", "noara_real", list("ABC")),
    ("winder-brand", "Winder & Stilhaus Brand Toolkit", "03_winder_stilhaus.jpg", "ws", list("ABCDE")),
    ("spiceweb-brand", "SpiceWeb Media Brand Identity", "04_spiceweb.jpg", "spice", list("ABCDE")),
    ("cruise-command", "Cruise Command Brand Identity", "08_cruise_command.jpg", "cruise", list("ABCD")),
    ("juna", "Juna Brand Identity", "10_juna.jpg", "juna", ["T.jpg", "b1.jpg", "b2.jpg", "b3.jpg"]),
    ("autonomy", "Autonomy Brand Identity", "11_autonomy.jpg", "autonomy", ["T.jpg", "b1.jpg", "b2.jpg", "b3.jpg"]),
]


def save(src: Path, dst: Path, width: int) -> str:
    """Resize to max width and save as progressive JPG; skip if already newer than source."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        im = Image.open(src).convert("RGB")
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
    w, h = Image.open(dst).size
    return {"src": dst.relative_to(OUT).as_posix(), "w": w, "h": h}


def field(text, name):
    m = re.search(rf"^- {name}:\s*(.+)$", text, re.M)
    return m.group(1).strip() if m else ""


def web_project(folder, slug):
    d = BEHANCE / folder
    post = (d / "post.md").read_text(encoding="utf-8").split("## Upwork")[0] if (d / "post.md").exists() else ""
    fb = FALLBACK.get(slug, {})
    thumbs = sorted(d.glob("00_thumbnail*.jpg"))
    pick = re.search(r"recommended:\s*([\w-]+)", post) or re.search(r"^- Cover:\s*([\w-]+)", post, re.M)
    cover = next((t for t in thumbs if pick and t.stem == pick.group(1)), None) \
        or next((t for t in thumbs if "final" in t.stem), None) or thumbs[0]
    modules = sorted(p for p in d.glob("[0-9][0-9]_*.jpg") if not p.name.startswith("00_"))
    cats = (field(post, "Categories").split(". Tools")[0] or "UI/UX, Web Design").replace(".", "")
    return dict(
        slug=slug, type="web",
        title=field(post, "Title") or fb.get("title", folder[3:]),
        desc=field(post, "Description") or fb.get("desc", ""),
        tags=[t.strip() for t in field(post, "Tags").split(",") if t.strip()] or fb.get("tags", ["web design", "ui design"]),
        cats=cats,
        thumb=save(cover, IMG / slug / "thumb.jpg", 1200),
        images=[save(m, IMG / slug / m.name, 1600) for m in modules],
    )


def brand_project(slug, title, cover, folder, files):
    files = [f if "." in f else f + ".jpg" for f in files]
    return dict(
        slug=slug, type="brand", title=title, cats="Branding, Brand Identity",
        desc="", tags=["brand identity", "logo design", "branding"],
        thumb=save(CATALOG / "export-brand" / cover, IMG / slug / "thumb.jpg", 1200),
        images=[save(CATALOG / folder / f, IMG / slug / f, 1600) for f in files],
    )


if __name__ == "__main__":
    projects = [web_project(*w) for w in WEB] + [brand_project(*b) for b in BRAND]
    assert all(p["thumb"] and p["images"] and p["title"] for p in projects), "a project is missing images or title"
    (OUT / "data.js").write_text("window.PROJECTS = " + json.dumps(projects, indent=1, ensure_ascii=False) + ";\n",
                                 encoding="utf-8")
    print(len(projects), "projects,", sum(len(p["images"]) for p in projects), "images")
