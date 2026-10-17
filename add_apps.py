"""Add the 7 mobile app case studies (light Behance pages, same thumbnail style) to the site.
Replaces the older Adobe copies of Cloud Care, Gear app and Luxae app. Re-runnable.
Run:  python -I add_apps.py"""
import json, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))  # -I drops the script folder from sys.path
from add_featured import OUT, UPLOADS, save, load

REPLACES = ["cloud-care-mobile-app-design", "gear-app-a-futuristic-shopping-experience", "luxae-a-seamless-home-decor-shopping"]
AFTER = "inn-twin-data-platform-dashboard"  # apps sit right after the dashboards
T = ["ui/ux", "mobile app", "app design", "ios", "android"]

# slug, upload folder, title, extra tags, intro, challenge, what we did, scope
APPS = [
    ("nostradamus-football-prediction-app", "15 Nostradamus App", "Nostradamus: Football Prediction App",
     ["sports", "betting", "social", "gaming"],
     "Nostradamus turns watching football into a game between friends.",
     "Prediction apps often bury the fun under odds tables and long forms, so a quick bet with a friend feels like paperwork.",
     "We made a dashboard that leads with the next match, one tap to predict a score, simple challenges, private pools and leaderboards that show where you stand.",
     "UI/UX design, 59 mobile screens across 7 app areas, design system and prototype."),
    ("guardio-theft-protection-app", "16 Guardio App", "Guardio: Theft Protection and Reporting App",
     ["security", "insurance", "utility"],
     "Guardio helps people register what they own and report a theft in minutes.",
     "When something valuable is stolen, people scramble for receipts, serial numbers and photos, and filing a report takes hours.",
     "We made an app where items are registered once with everything attached, so a full theft report, the nearest police station and insurance options are a few taps away.",
     "UI/UX design, 16 mobile screens, design system and prototype."),
    ("gear-tech-shopping-app", "17 Gear Case Study", "Gear: Premium Tech Shopping App",
     ["ecommerce", "shopping", "tech", "audio"],
     "Gear is a shopping app for premium tech accessories.",
     "Electronics stores often bury great products under busy layouts, and checkout breaks the premium feel.",
     "We made a monochrome store with large product imagery, clear categories, a wishlist and a short checkout that stays out of the way.",
     "UI/UX design, 11 mobile screens, design system and prototype."),
    ("luxae-home-decor-shopping-app", "18 Luxae Case Study", "Luxae: Home Decor Shopping App",
     ["ecommerce", "shopping", "furniture", "home decor"],
     "Luxae is a calm, gallery like store for furniture and decor.",
     "Decor apps often feel like busy catalogues, and the checkout breaks the mood the products create.",
     "We made soft periwinkle screens with large product images, a simple colour picker and a short checkout, plus a splash in three colourways.",
     "UI/UX design, 12 mobile screens, design system and prototype."),
    ("cloud-care-family-health-app", "19 Cloud Care App", "Cloud Care: Family Health App",
     ["health", "healthcare", "family", "wellness"],
     "Cloud Care helps parents look after the whole family's health in one calm place.",
     "Family health lives in too many places: paper notes, reminders on different phones and appointment letters.",
     "We made one gentle app for vitals, baby sleep, medication reminders and appointments, with warm colours and clear cards that read at a glance.",
     "UI/UX design, 10 mobile screens, design system and prototype."),
    ("ahln-smart-delivery-box-app", "20 Ahln App", "Ahln: Smart Delivery Box App",
     ["iot", "smart home", "delivery", "dark mode"],
     "Ahln is a smart delivery box for homes, controlled from a phone.",
     "Parcels arrive when nobody is home, so they get left at the door, sent back or handed to a neighbour.",
     "We made an app to track deliveries, watch the box camera, open a door remotely and give family or riders time limited access, in Light and Dark mode.",
     "UI/UX design, 52 mobile screens in Light and Dark, design system and prototype."),
    ("lavender-organizes-business-app", "14 Lavender App", "Lavender Organizes: Home Organising App",
     ["service booking", "business", "multi role"],
     "One app for a home organising business: customers, organizers and admins.",
     "The business ran on calls, notes and spreadsheets, and juggling three kinds of users slowed everyone down.",
     "We made one app with a role picker: customers book and pay, organizers run their tasks, and admins assign work and follow every project.",
     "UI/UX design, 82 mobile screens across 3 roles, design system and prototype."),
]

if __name__ == "__main__":
    js, data = load("data.js", "[", "]")
    cs, cases = load("cases.js", "{", "}")
    drop = set(REPLACES) | {a[0] for a in APPS}
    for slug in REPLACES:
        shutil.rmtree(OUT / "img" / slug, ignore_errors=True)
        cases.pop(slug, None)
    # keep the apps where they already sit (other scripts insert above them); AFTER only on first run
    at = next((p["slug"] for p in data if p["slug"] in drop), None)
    prev = data[[p["slug"] for p in data].index(at) - 1]["slug"] if at else AFTER
    data = [p for p in data if p["slug"] not in drop]
    fresh = []
    for slug, folder, title, tags, intro, challenge, did, scope in APPS:
        shutil.rmtree(OUT / "img" / slug, ignore_errors=True)
        src = sorted((UPLOADS / folder).glob("*.png"))
        thumb, mods = src[0], src[1:]
        assert thumb.name == "00.png" and mods, folder
        fresh.append(dict(slug=slug, type="app", title=title, desc=intro, cats="UI/UX, App Design", tags=T + tags,
                          thumb=save(thumb, OUT / "img" / slug / "thumb.jpg", 1200),
                          images=[save(m, OUT / "img" / slug / f"{k:02d}.jpg", 1600) for k, m in enumerate(mods, 1)]))
        cases[slug] = dict(title=title, tags=T + tags, about=[intro],
                           sections=[["The challenge", challenge], ["What we did", did], ["Scope", scope]])
        print(f"{slug:40} {len(mods)} modules")
    i = next(k for k, p in enumerate(data) if p["slug"] == prev) + 1
    data = data[:i] + fresh + data[i:]
    assert len({p["slug"] for p in data}) == len(data), "duplicate slug"
    (OUT / "data.js").write_text(js[:js.index("[")] + json.dumps(data, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    (OUT / "cases.js").write_text(cs[:cs.index("{")] + json.dumps(cases, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(len(data), "projects")
