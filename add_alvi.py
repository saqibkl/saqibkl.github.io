"""Add the 25 Alvi Consulting client websites (generic Behance pages, exported to Behance Uploads/Alvi/<slug>)
right after the Upwork websites and dashboards. Re-runnable.
Run:  python -I add_alvi.py"""
from pathlib import Path
from add_featured import OUT, SAQIB, W, save, load
import json, shutil

SRC = SAQIB / "Behance Uploads" / "Alvi"
AFTER = "inn-twin-data-platform-dashboard"  # last Upwork item; Alvi sites go below it

# slug, title, extra tags, intro, what we did, scope
P = [
    ("hexa-care-website", "Hexa Care: Disability and Aged Care Website", ["healthcare", "ndis", "aged care"],
     "Hexa Care is a nurse-led disability and aged care provider.",
     "A warm, calm site that explains every service simply, shows the care journey step by step and makes it easy for families to request a call back."),
    ("national-tree-services-website", "National Tree Services: Tree Removal Website", ["trades", "local business", "lead generation"],
     "National Tree Services offers tree removal, pruning and land clearing across Sydney.",
     "A bold green site with a quote form in the hero, clear service cards, real job photos and reviews that build trust before the call."),
    ("noble-balustrades-landing-pages", "Noble Balustrades: Stainless Balustrade Landing Pages", ["construction", "trades", "landing page", "lead generation"],
     "Noble Balustrades designs and installs custom stainless steel balustrades.",
     "Conversion-focused landing pages with a quote form up front, product types, recent installs and a simple process that ends in a booked measure."),
    ("parra-digital-marketing-agency-website", "Parra Digital: Marketing Agency Website", ["marketing agency", "agency", "seo agency"],
     "Parra Digital is a digital marketing agency for Western Sydney businesses.",
     "A confident navy and yellow site that sells a free marketing audit, explains each service clearly and backs it with client stories."),
    ("reinspect-building-inspections-landing-page", "Reinspect: Building Inspections Landing Page", ["construction", "property", "landing page"],
     "Reinspect provides building and pest inspections for buyers and owners.",
     "A clear landing page that explains inspection types, shows what the report covers and drives buyers to book an inspection."),
    ("renewed-kitchens-bathrooms-landing-page", "Renewed Kitchens and Bathrooms: Renovation Landing Page", ["home renovation", "kitchens", "landing page"],
     "Renewed Kitchens and Bathrooms renovates kitchens and bathrooms with a fixed, clear process.",
     "A fresh landing page with before and after work, a simple renovation process and a quote request at every step."),
    ("saqch-partners-accounting-landing-page", "SaqCh Partners: Accounting and Virtual CFO Landing Page", ["accounting", "finance", "b2b", "landing page"],
     "SaqCh Partners provides accounting, tax and virtual CFO support for growing businesses.",
     "A trustworthy landing page that turns finance services into clear packages and leads to a discovery call."),
    ("silverwater-collision-centre-landing-page", "Silverwater Collision Centre: Smash Repair Landing Page", ["automotive", "local business", "landing page"],
     "Silverwater Collision Centre repairs, protects and details cars in Sydney.",
     "A dark, premium landing page with bold red accents, a quote form, service cards and real customer reviews."),
    ("spec-building-products-marketing-website", "Spec: Building Products Marketing Website", ["construction", "marketing agency", "b2b"],
     "Spec helps building product manufacturers get specified by architects and builders.",
     "A dark, focused website that explains the specification problem, the Spec approach and the results, with a clear path to a strategy call."),
    ("supplyspec-construction-platform-website", "SupplySpec: B2B Construction Platform Website", ["construction", "b2b", "saas", "platform"],
     "SupplySpec connects building product suppliers with architects and builders.",
     "A clean platform site with separate paths for suppliers and specifiers, product listings and an easy sign-up flow."),
    ("syddigital-creative-agency-website", "SydDigital: Creative Agency Website", ["agency", "branding", "marketing agency", "dark ui"],
     "SydDigital is a Sydney agency for advertising, branding and websites.",
     "A bold black and red agency site that shows strategy, services and results, and turns visitors into strategy sessions."),
    ("unity-online-school-landing-page", "Unity Online: Online School Landing Page", ["education", "e-learning", "landing page"],
     "Unity Online is an online school for Year 7 and 8 students.",
     "A friendly landing page that explains how online learning works, what students get and how parents can enrol."),
    ("workcover-hub-workers-compensation-website", "WorkCover Hub: Workers Compensation Guide Website", ["legal", "insurance", "guide"],
     "WorkCover Hub guides injured workers through their compensation claim.",
     "A calm, reassuring site that breaks a stressful claim into simple steps and connects workers with help."),
    ("devox-cladding-landing-page", "Devox: Cladding Landing Page", ["construction", "trades", "landing page"],
     "Devox designs and installs modern cladding for homes and commercial buildings.",
     "A sleek black and gold landing page with project photos, cladding options and a quote request front and centre."),
    ("bright-engineered-balustrades-website", "Bright Engineered: Balustrades Website", ["construction", "trades"],
     "Bright Engineered designs and installs glass and steel balustrades.",
     "A clean multi-page site with product ranges, project galleries and a clear quote flow."),
    ("a-link-plumbing-landing-page", "A-Link Plumbing: Plumbing Services Landing Page", ["trades", "plumbing", "local business", "landing page"],
     "A-Link Plumbing provides emergency and general plumbing services.",
     "A bright, direct landing page with call and quote buttons, clear services and reviews that build trust fast."),
    ("add-design-studio-website", "ADD Design Studio: Interior Design Website", ["interior design", "architecture", "luxury"],
     "ADD Design Studio creates residential and commercial interiors.",
     "A quiet, editorial website that lets the project photography lead, with services and a simple enquiry flow."),
    ("alvi-ad-architecture-website", "ALVI+AD: Architecture and Design Website", ["architecture", "construction", "design studio"],
     "ALVI+AD is an architecture and design practice.",
     "A modern multi-page website with project case studies, services and a clear path to start a project."),
    ("alvi-consulting-website", "Alvi Consulting: Digital Consulting Website", ["consulting", "marketing agency", "b2b"],
     "Alvi Consulting helps businesses grow with websites, marketing and strategy.",
     "A professional multi-page website that explains services, shows client work and drives consultations."),
    ("amana-renovations-website", "Amana Renovations: Home Renovation Website", ["home renovation", "construction", "trades"],
     "Amana Renovations delivers home renovations and shopfitting.",
     "A warm website with project galleries, a clear renovation process and quote requests throughout."),
    ("aussie-link-visa-services-website", "Aussie-Link: Visa and Migration Services Website", ["immigration", "legal", "consulting"],
     "Aussie-Link helps clients with Australian visas and migration.",
     "A clear, trustworthy multi-page site that explains each visa type, the process and how to book a consultation."),
    ("beds-r-us-furniture-landing-page", "Beds R Us: Bedding and Furniture Landing Page", ["ecommerce", "furniture", "retail", "landing page"],
     "Beds R Us sells beds, mattresses and bedroom furniture in Warwick Farm.",
     "A bright retail landing page with product categories, offers and store details that bring shoppers in."),
    ("bright-balustrading-website", "Bright Balustrading: Balustrade Website", ["construction", "trades"],
     "Bright Balustrading designs and installs balustrades and fencing.",
     "A bold multi-page website with product types, completed projects and a simple quote flow."),
    ("complete-marble-care-website", "Complete Marble Care: Stone Restoration Website", ["home services", "restoration", "local business"],
     "Complete Marble Care restores, polishes and seals marble and natural stone.",
     "An elegant website with before and after results, service details and an easy quote request."),
    ("healthplex-allied-health-website", "HealthPlex: Allied Health Network Website", ["healthcare", "allied health", "franchise"],
     "HealthPlex is a national allied health network of physiotherapy and related clinics.",
     "A bright, modern website that explains services, finds the nearest clinic and invites practitioners to join the network."),
]


def mods(folder: Path) -> list:
    return [f for f in sorted(folder.glob("*.jpg")) if not f.name.startswith("00_") and "thank_you" not in f.name]


if __name__ == "__main__":
    js, data = load("data.js", "[", "]")
    cs, cases = load("cases.js", "{", "}")
    slugs = {p[0] for p in P}
    data = [p for p in data if p["slug"] not in slugs]
    fresh = []
    for slug, title, tags, intro, did in P:
        folder = SRC / slug
        ms = mods(folder)
        assert ms and (folder / "00_thumbnail.jpg").exists(), f"missing export for {slug}"
        shutil.rmtree(OUT / "img" / slug, ignore_errors=True)
        tags = W + tags
        fresh.append(dict(slug=slug, type="web", title=title, desc=intro, cats="UI/UX, Web Design", tags=tags,
                          thumb=save(folder / "00_thumbnail.jpg", OUT / "img" / slug / "thumb.jpg", 1200),
                          images=[save(m, OUT / "img" / slug / f"{k:02d}.jpg", 1600) for k, m in enumerate(ms, 1)]))
        cases[slug] = dict(title=title, tags=tags, about=[intro],
                           sections=[["What we did", did], ["Scope", "UI/UX design, website design, design system and responsive layouts."]])
    i = next(k for k, p in enumerate(data) if p["slug"] == AFTER) + 1
    data = data[:i] + fresh + data[i:]
    assert len({p["slug"] for p in data}) == len(data), "duplicate slug"
    (OUT / "data.js").write_text(js[:js.index("[")] + json.dumps(data, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    (OUT / "cases.js").write_text(cs[:cs.index("{")] + json.dumps(cases, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(len(fresh), "Alvi sites added after", AFTER, "->", len(data), "projects")
