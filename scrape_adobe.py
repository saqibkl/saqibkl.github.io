"""Copy every project from saqibkamal.myportfolio.com (Branding + UI/UX pages) into img/ and data.js.
Run:  python -I scrape_adobe.py      (re-runs skip images that are already downloaded)"""
import html, io, json, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

SITE = "https://saqibkamal.myportfolio.com"
OUT = Path(__file__).resolve().parent
IMG = OUT / "img"
SECTIONS = [("work", "brand"), ("ui-ux", "web")]  # listing page -> project type on the new site


def get(url: str, tries: int = 4) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (portfolio copy by owner)"})
    for n in range(tries):  # the CDN occasionally stalls; retry instead of losing the whole run
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except (TimeoutError, OSError):
            if n == tries - 1:
                raise


def save(url: str, dst: Path, width: int) -> dict:
    if dst.exists():
        try:
            Image.open(dst).load()
        except OSError:  # half-written file from an interrupted run
            dst.unlink()
    if not dst.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        im = Image.open(io.BytesIO(get(url)))
        if im.mode in ("RGBA", "LA", "P"):  # flatten transparency onto white, JPG has no alpha
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[3])
            im = bg
        im = im.convert("RGB")
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
    w, h = Image.open(dst).size
    return {"src": dst.relative_to(OUT).as_posix(), "w": w, "h": h}


# Behance-style tags, picked when the word appears in the title or description
TAGS = {
    "saas": ["saas", "software", "platform", "dashboard"], "ecommerce": ["e-commerce", "ecommerce", "shop", "store"],
    "crypto": ["crypto", "web3", "nft", "blockchain", "trading"], "fintech": ["payment", "fintech", "finance", "wealth"],
    "ai": [" ai ", "ai-powered", "artificial intelligence"], "mobile app": ["app", "mobile", "application"],
    "landing page": ["landing page"], "website": ["website", "web design"], "logo design": ["logo"],
    "packaging": ["packaging", "label"], "real estate": ["real estate", "property"], "wellness": ["wellness", "health", "care", "supplement"],
    "luxury": ["luxury", "premium", "jewellery", "jewelry"], "fashion": ["fashion", "barber", "apparel"],
    "food and drink": ["food", "restaurant", "fork", "dining", "organic"], "construction": ["construction", "structure", "building"],
    "marketing agency": ["marketing", "agency"], "tech": ["tech", "digital", "software house"],
    "sustainability": ["eco", "nature", "green", "sustainab"], "home decor": ["decor", "interior", "home"],
    "golf and sport": ["golf", "sport"], "consulting": ["consult", "b2b", "hr"],
}


def tag(title: str, desc: str, kind: str) -> list:
    hay = f" {title} {desc} ".lower()
    found = [t for t, words in TAGS.items() if any(w in hay for w in words)]
    base = ["brand identity", "branding"] if kind == "brand" else ["ui/ux", "web design"]
    return base + [t for t in found if t not in base]


def dedupe(images: list) -> list:
    """Adobe pages often hold every module twice (gallery + stack) under different URLs; keep the first copy only."""
    small = lambda im: Image.open(OUT / im["src"]).convert("RGB").resize((48, 36))
    kept, seen = [], []
    for im in images:
        s = small(im)
        if all(sum(ImageStat.Stat(ImageChops.difference(s, o)).mean) / 3 >= 3 for o in seen):  # < 3 of 255 = same picture
            kept.append(im); seen.append(s)
    return kept


def text(fragment: str) -> str:
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", fragment))).strip()


def project(slug: str, kind: str, cover_url: str) -> dict:
    page = get(f"{SITE}/{slug}").decode("utf-8", "replace")
    title = text(re.search(r'<h1 class="title[^"]*">(.*?)</h1>', page, re.S).group(1))
    desc_m = re.search(r'class="description">(.*?)</div>', page, re.S)
    desc = text(desc_m.group(1)) if desc_m else ""
    # every module image appears as the original plus _rw_ sizes; keep one per image, preferring 1920
    seen, images = {}, []
    for url in re.findall(r'data-src="(https://cdn\.myportfolio\.com/[^"]+)"', page):
        base = re.sub(r"_rw_\d+", "", url.split("?")[0])
        if base not in seen:
            seen[base] = url
            images.append(base)
        if "_rw_1920" in url:
            seen[base] = url
    with ThreadPoolExecutor(8) as pool:  # 8 downloads at a time; order is kept by map()
        imgs = list(pool.map(lambda ib: save(seen[ib[1]], IMG / slug / f"{ib[0]:02d}.jpg", 1600), enumerate(images, 1)))
    return dict(slug=slug, type=kind, title=title, desc=desc,
                cats="Branding, Brand Identity" if kind == "brand" else "UI/UX, Web Design",
                tags=tag(title, desc, kind), thumb=save(cover_url, IMG / slug / "thumb.jpg", 1200), images=dedupe(imgs))


if __name__ == "__main__":
    if sys.argv[1:] == ["--dedupe"]:  # clean an existing data.js without re-downloading, delete the dropped files
        js = (OUT / "data.js").read_text(encoding="utf-8")
        projects = json.loads(js[js.index("["):js.rindex("]") + 1])
        for p in projects:
            keep = dedupe(p["images"])
            for im in p["images"]:
                if im not in keep:
                    (OUT / im["src"]).unlink()
            print(f"{p['slug'][:40]:40} {len(p['images'])} -> {len(keep)}")
            p["images"] = keep
        (OUT / "data.js").write_text("window.PROJECTS = " + json.dumps(projects, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
        sys.exit()
    projects = []
    for page, kind in SECTIONS:
        listing = get(f"{SITE}/{page}").decode("utf-8", "replace")
        for slug, inner in re.findall(r'<a class="project-cover[^>]*href="/([^"]+)"(.*?)</a>', listing, re.S):
            # covers come as _carw_WxHxSIZE or _rwc_XxYxWxHxSIZE; take the largest size up to 1920 px
            sized = [(int(m.group(1)), u) for u in set(re.findall(r'(https://cdn\.myportfolio\.com/[^"\s,]+)', inner))
                     if (m := re.search(r"_(?:carw_\d+x\d+|rwc_\d+x\d+x\d+x\d+)x(\d+)\.", u)) and int(m.group(1)) <= 1920]
            cover = max(sized)[1]
            p = project(slug, kind, cover)
            projects.append(p)
            print(f"{kind:5} {len(p['images']):3} imgs  {p['title'][:60]}")
    assert projects and all(p["images"] for p in projects), "a project came back without images"
    (OUT / "data.js").write_text("window.PROJECTS = " + json.dumps(projects, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(len(projects), "projects,", sum(len(p["images"]) for p in projects), "images")
