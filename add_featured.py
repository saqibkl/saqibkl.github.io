"""Add the 10 website projects posted on Upwork (Upwork thumbnail + Behance modules) to the top of the site,
and remove the older copies of the same projects. Re-runnable.
Run:  python -I add_featured.py"""
import json, re, shutil
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent
SAQIB = OUT.parent
UPLOADS = SAQIB / "Behance Uploads"
THUMBS = SAQIB / "Upwork Thumbnails" / "upwork-final"
KEEP_MOCKUPS = {"06_careers_mockup.jpg", "03_kitchens_mockup.jpg"}  # the two laptop scenes the user likes (Noara, WS)
REPLACES = ["siepay-crypto-payment-website", "workstream-saas-website-design",
            "passion-jewellery-brand-website", "gear-a-futuristic-tech-e-commerce-experience"]
W = ["ui/ux", "web design", "website"]
# pinned: the standout brand projects stay first, then these websites, then everything else
PINNED = ["terral-built-on-structure", "qore-core-driven-strategy-brand-identity", "opendox-connected-knowledge-brand-identity",
          "taskera-ai-powered-productivity-platform", "bambu-eco-friendly-daily-essentials-brand-identity", "bound-nature-first-living-brand-identity"]

# slug, Behance folder, Upwork thumbnail, title, tags, intro, challenge, what we did, scope
PROJECTS = [
    ("noara-labs-website", "05 Noara Labs", UPLOADS / "05 Noara Labs" / "00_thumbnail_D_pinwheel_laptop.jpg",  # user: the pinwheel laptop as cover
     "Noara Labs: Tech Talent Partner Website",
     W + ["staffing", "software house", "b2b", "careers"],
     "Noara Labs connects growing companies with vetted remote engineers, dedicated teams and full product builds.",
     "Noara speaks to two audiences at once: companies that need to hire, and developers looking for their next role. Most staffing sites feel generic and blur the two together, so Noara needed a site that feels bold and modern and gives each audience its own clear path.",
     "We designed a bold site in black and signal orange with apricot, deep green and cream, built around a pinwheel shape. Hiring companies and developers each get their own path, with a careers page of open roles, a simple apply flow and a call booking page that confirms the next step.",
     "UI/UX design, multi-page website with desktop and mobile layouts, design system, sitemap, wireframes and prototype."),
    ("passion-jewellery-ecommerce-website", "12 Passion", "02_passion.jpg", "Passion: Fine Jewellery eCommerce Website",
     W + ["ecommerce", "jewellery", "luxury", "fashion", "online store"],
     "Passion is a fine jewellery store built as a lookbook you can shop.",
     "Fine jewellery sells on feeling, but most stores flatten it into a plain product grid. Passion needed a site that feels like a fashion editorial without hiding the products or the path to buy.",
     "We set the mood with arched portraits, generous space and Marcellus headlines in a plum palette, then made buying easy: clear categories, product pages with metal and length options, and a simple bag.",
     "UI/UX design: home, collections, product, bag and about pages."),
    ("workstreams-ai-data-assistant-website", "08 WorkStreams", "03_workstreams.jpg", "WorkStreams: AI Data Assistant Product Website",
     W + ["saas", "ai", "data", "startup"],
     "WorkStreams is an AI data assistant. Teams ask their databases questions in plain English and get answers, charts and SQL back.",
     "Data tools usually speak to engineers. WorkStreams needed a site that makes AI-assisted analysis feel useful to a whole team, and turns early interest into a waitlist.",
     "We designed a deep violet and midnight look with chat chips and code panels that explain insights, database health and SQL generation in plain words. Every page leads to one action: join the waitlist.",
     "UI/UX design, 5 pages plus a waitlist flow, design system, sitemap, user journeys, wireframes and prototype."),
    ("siepay-crypto-payments-landing-page", "01 Siepay Landing", "04_siepay_landing.jpg", "Siepay: Crypto Recurring Payments Landing Page",
     W + ["landing page", "crypto", "fintech", "payments", "saas", "web3"],
     "Siepay is a cryptocurrency recurring payment system for businesses.",
     "Crypto payments are usually one-off and manual. For a business, running subscriptions and invoices in crypto felt risky, and customers were not sure what they were signing up for.",
     "We designed a landing page that says what Siepay does in one headline, shows invoices, MetaMask and subscriptions as friendly 3D cards, builds trust with real numbers and ends on a clear free trial.",
     "UI/UX design, landing page for desktop."),
    ("searchlight-digital-agency-website", "10 Search Light", "05_searchlight.jpg", "Searchlight Digital: SEO and Marketing Agency Website",
     W + ["seo agency", "marketing agency", "agency", "dark ui"],
     "Searchlight Digital is an SEO and digital marketing agency helping Los Angeles businesses rank on Google, show up in AI search and win qualified leads.",
     "Every SEO agency promises page one. Searchlight needed a site that feels premium from the first scroll and turns local business owners into audit requests.",
     "We built the whole site around a spotlight idea: dark sections lit by warm gold, a scrolling services ticker, image-led service cards and a clear four-step growth framework, all leading to one action: request a free SEO audit.",
     "UI/UX design, 5 pages (Home, About, Services, Resource Center, Contact), responsive."),
    ("winder-stilhaus-interiors-website", "11 WS", "06_ws.jpg", "Winder & Stilhaus: Kitchens and Interiors Studio Website",
     W + ["interior design", "kitchens", "luxury", "home renovation", "branding"],
     "Winder & Stilhaus brings British joinery and German precision to kitchens, bathrooms and interiors.",
     "WS sells high-value rooms, so the site had to feel calm and crafted, explain a structured process and give homeowners a confident first step.",
     "We used editorial serif headlines, a charcoal and stone palette lit by one ember accent and big interior photography, and showed guide pricing openly so homeowners know where they stand.",
     "9-page website with mobile layouts, design system, branded emails, a quote template and an A4 specification guide."),
    ("whittemore-gov-tech-website", "07 Whitte-more", "07_whittemore.jpg", "Whittemore: Gov Tech Web and Software Studio Website",
     W + ["gov tech", "software house", "accessibility", "corporate"],
     "Whittemore is a Wyoming technology studio that builds accessible websites, portals and custom software for government agencies and growing businesses.",
     "Public buyers care about trust, accessibility and clarity more than flashy visuals. The site had to show real care for accessibility and make it easy to start a conversation.",
     "We designed a confident navy look with an arch-and-sun hero framing every page, case studies that show real impact and clear paths to a project conversation.",
     "UI/UX design, 8 pages, design system, sitemap, user journeys, wireframes, clickable prototype and responsive mobile."),
    ("spiceweb-media-agency-website", "06 SpiceWeb", "08_spiceweb.jpg", "SpiceWeb Media: Digital Agency Website",
     W + ["marketing agency", "agency", "branding", "seo agency"],
     "SpiceWeb Media is a full-service digital agency for branding, websites, SEO, Google Ads and social media.",
     "An agency website has to prove its own work. SpiceWeb needed a site that feels bold, shows real results and turns visitors into booked consultations.",
     "We designed a bold monochrome look with one spice red accent and a portfolio-led layout, including a client case study page and a booking confirmation page.",
     "UI/UX design, 9 pages, design system, sitemap, wireframes and prototype."),
    ("gear-audio-ecommerce-website", "09 Gear Website", "09_gear.jpg", "Gear: Premium Tech and Audio eCommerce Website",
     W + ["ecommerce", "online store", "tech", "audio"],
     "Gear is an online store for premium tech and audio.",
     "Electronics stores often bury great products under busy layouts, banners and discount noise. Gear needed a store that feels as premium as its products and still makes buying simple.",
     "We designed a quiet monochrome store with large product photography, clear categories, product cards with price and rating, a live offer and an FAQ, so shoppers can browse, compare and add to cart without friction.",
     "UI/UX design, home page, product page and design system."),
    ("inn-twin-digital-twin-studio-website", "03 In Twinn Studio", "10_inntwin_studio.jpg", "Inn Twin: Digital Twin Studio Website",
     W + ["3d", "digital twin", "architecture", "vr", "dark ui"],
     "Inn Twin captures true-to-scale digital twins of spaces, materials and products for architects and brands.",
     "Inn Twin sells visual truth, so the site itself had to look as real and cinematic as its captures, while explaining a technical service simply.",
     "We designed a dark, immersive studio site with cinematic renders, a warm gold accent and calm type, plus a material library and a VR showroom page.",
     "UI/UX design, 8 studio pages plus an access flow, design system and prototype."),
]


def modules(folder: Path) -> list:
    """Behance modules in order, minus thumbnails, laptop scenes (except the two kept) and plain thank-you cards."""
    out = []
    for f in sorted(folder.glob("*.jpg")):
        n = f.name
        if n.startswith("00_") or (re.search(r"laptop|mockup|showroom", n) and n not in KEEP_MOCKUPS):
            continue
        if "thank_you" in n and "mobile" not in n:  # the pop-up ends on its own call to action
            continue
        out.append(f)
    return out


def save(src: Path, dst: Path, width: int) -> dict:
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
    return {"src": dst.relative_to(OUT).as_posix(), "w": im.width, "h": im.height}


def load(name: str, start: str, end: str):
    s = (OUT / name).read_text(encoding="utf-8")
    return s, json.loads(s[s.index(start):s.rindex(end) + 1])


if __name__ == "__main__":
    js, data = load("data.js", "[", "]")
    cs, cases = load("cases.js", "{", "}")
    new_slugs = [p[0] for p in PROJECTS]
    drop = set(REPLACES) | set(new_slugs)
    for slug in REPLACES:
        shutil.rmtree(OUT / "img" / slug, ignore_errors=True)
        cases.pop(slug, None)
    data = [p for p in data if p["slug"] not in drop]
    fresh = []
    for slug, folder, thumb, title, tags, intro, challenge, did, scope in PROJECTS:
        shutil.rmtree(OUT / "img" / slug, ignore_errors=True)
        mods = modules(UPLOADS / folder)
        assert mods, f"no modules in {folder}"
        fresh.append(dict(slug=slug, type="web", title=title, desc=intro, cats="UI/UX, Web Design", tags=tags,
                          thumb=save(THUMBS / thumb, OUT / "img" / slug / "thumb.jpg", 1200),
                          images=[save(m, OUT / "img" / slug / f"{k:02d}.jpg", 1600) for k, m in enumerate(mods, 1)]))
        cases[slug] = dict(title=title, tags=tags, about=[intro],
                           sections=[["The challenge", challenge], ["What we did", did], ["Scope", scope]])
        print(f"{slug:42} {len(mods):2} modules: {', '.join(m.stem for m in mods)}")
    pinned = [next(p for p in data if p["slug"] == s) for s in PINNED]
    data = pinned + fresh + [p for p in data if p["slug"] not in PINNED]
    assert len({p['slug'] for p in data}) == len(data), "duplicate slug"
    (OUT / "data.js").write_text(js[:js.index("[")] + json.dumps(data, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    (OUT / "cases.js").write_text(cs[:cs.index("{")] + json.dumps(cases, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(len(data), "projects")
