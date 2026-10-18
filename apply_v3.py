"""Apply the "Thumbnails v3" exports (Behance Uploads/_v3_thumbs/<slug>.png) to the site, and add the
Copy Trading and Motor dashboards. Also writes each v3 image back to the source thumbnail the build
scripts read, so re-running add_featured.py / add_alvi.py keeps the new thumbnails. Re-runnable.
Run:  python apply_v3.py"""
import json, shutil, sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
from add_featured import OUT, UPLOADS, THUMBS, PROJECTS, DASHBOARDS, save, load

V3 = UPLOADS / "_v3_thumbs"
AFTER = "inn-twin-data-platform-dashboard"
NEW = [  # slug, upload folder, title, tags, intro, did
    ("copy-trading-platform-dashboard", "21 Copy Trading", "Tenup Copy Trading: Crypto Copy Trading Platform",
     ["ui/ux", "dashboard", "web app", "crypto", "trading", "fintech"],
     "Tenup Copy Trading lets people follow experienced crypto traders and mirror their trades automatically.",
     "We designed the full web app: sign up and KYC, connecting exchanges, plans, finding and following traders with risk limits, live trades and a portfolio overview, in a dark theme and a light theme."),
    ("motor-ad-design-app", "22 Motor", "Motor: Ad Design Web App",
     ["ui/ux", "web app", "saas", "design tool", "marketing"],
     "Motor is a web app for designing ads faster: pick a template, edit it and export it as an image, video or HTML ad.",
     "We designed the full flow: sign up, choose a template, edit text and photos, upload images, preview, export and find past work again in Recent Designs, in a calm purple workspace."),
    ("future-bit-trading-dashboard", "23 FutureBit Dashboard", "Future Bit: Crypto Trading Dashboard",
     ["ui/ux", "dashboard", "web app", "crypto", "trading", "fintech"],
     "The Future Bit dashboard is where traders take part in the trading challenge: predict whether Bitcoin goes up or down, set a stake and a payout multiplier, and track every bet.",
     "We designed a dark trading dashboard with a live price chart, an up/down bet panel with a safe-to-wild multiplier slider, open bets with cash out, wallet balance, and the pages around it: leaderboard, rewards and account."),
    ("wealth-coach-crypto-learning-dashboard", "24 Crypto Learning Dashboard", "Wealth Coach: Crypto Learning Dashboard",
     ["ui/ux", "dashboard", "web app", "crypto", "education", "fintech"],
     "The Wealth Coach dashboard is the members' area of a crypto learning platform: plans and payments, live sessions, course progress, signals and crypto updates in one place.",
     "We designed the member dashboard with a community banner, plan and subscription card, next live session and course progress, plus the Payments, Billing, Live and Crypto Updates screens."),
]


def source_for(slug):
    """The thumbnail file a build script reads for this slug (None if the slug is not built by a script)."""
    for p in PROJECTS:
        if p[0] == slug:
            return p[2] if isinstance(p[2], Path) else THUMBS / p[2]
    for p in DASHBOARDS:
        if p[0] == slug:
            return p[2]
    alvi = UPLOADS / "Alvi" / slug / "00_thumbnail.jpg"
    return alvi if alvi.exists() else None


if __name__ == "__main__":
    js, data = load("data.js", "[", "]")
    cs, cases = load("cases.js", "{", "}")
    new_slugs = {n[0] for n in NEW}
    done = []
    for png in sorted(V3.glob("*.png")):
        slug = png.stem
        if slug in new_slugs:
            continue
        p = next((x for x in data if x["slug"] == slug), None)
        if not p:
            print("not on site:", slug); continue
        p["thumb"] = save(png, OUT / "img" / slug / "thumb.jpg", 1200)
        src = source_for(slug)
        if src:
            bak = V3 / "_old_sources" / f"{slug}{src.suffix}"  # keep the previous thumbnail once
            if src.exists() and not bak.exists():
                bak.parent.mkdir(exist_ok=True); shutil.copy(src, bak)
            Image.open(png).convert("RGB").save(src, "JPEG", quality=90)
        done.append(slug)
    # older websites rebuilt in the standard Behance template: Behance Uploads/_old_sites/<slug>/NN.png
    for d in sorted((UPLOADS / "_old_sites").glob("*")):
        p = next((x for x in data if x["slug"] == d.name), None)
        if not p or not any(d.glob("*.png")):
            continue
        shutil.rmtree(OUT / "img" / d.name / "t", ignore_errors=True)
        p["images"] = [save(f, OUT / "img" / d.name / "t" / f"{k:02d}.jpg", 1600) for k, f in enumerate(sorted(d.glob("*.png")), 1)]
    data = [p for p in data if p["slug"] not in new_slugs]
    fresh = []
    for slug, folder, title, tags, intro, did in NEW:
        f = UPLOADS / folder
        shutil.copy(V3 / f"{slug}.png", f / "00_thumbnail.png")
        shutil.rmtree(OUT / "img" / slug, ignore_errors=True)
        mods = [m for m in sorted(list(f.glob("*.png")) + list(f.glob("*.jpg"))) if not m.name.startswith("00_")]
        fresh.append(dict(slug=slug, type="app", title=title, desc=intro, cats="UI/UX, Web App", tags=tags,
                          thumb=save(f / "00_thumbnail.png", OUT / "img" / slug / "thumb.jpg", 1200),
                          images=[save(m, OUT / "img" / slug / f"{k:02d}.jpg", 1600) for k, m in enumerate(mods, 1)]))
        cases[slug] = dict(title=title, tags=tags, about=[intro], sections=[["What we did", did], ["Scope", "UI/UX design, web app screens, design system."]])
    i = next(k for k, p in enumerate(data) if p["slug"] == AFTER) + 1
    data = data[:i] + fresh + data[i:]
    assert len({p["slug"] for p in data}) == len(data), "duplicate slug"
    (OUT / "data.js").write_text(js[:js.index("[")] + json.dumps(data, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    (OUT / "cases.js").write_text(cs[:cs.index("{")] + json.dumps(cases, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(len(done), "thumbnails updated,", len(fresh), "projects added ->", len(data), "projects")


def mix_apps():
    """Interleave dashboards and mobile apps (type "app") so the Apps & Dashboards tab alternates."""
    js, data = load("data.js", "[", "]")
    apps = [p for p in data if p["type"] == "app"]
    dash = [p for p in apps if "dashboard" in p["tags"] or "web app" in p["tags"]]
    mob = [p for p in apps if p not in dash]
    mixed = [x for pair in zip(dash, mob) for x in pair] + dash[len(mob):] + mob[len(dash):]
    i = next(k for k, p in enumerate(data) if p["type"] == "app")
    rest = [p for p in data if p["type"] != "app"]
    data = rest[:i] + mixed + rest[i:]
    (OUT / "data.js").write_text(js[:js.index("[")] + json.dumps(data, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    print("apps mixed:", [p["slug"].split("-")[0] for p in mixed])


if __name__ == "__main__":
    mix_apps()
