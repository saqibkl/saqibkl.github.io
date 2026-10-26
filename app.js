// Renders the shot grid (index.html) and the case study page (project.html) from window.PROJECTS (data.js).
const P = window.PROJECTS || [];
// cases.js holds the cleaned titles and accurate tags; they replace the scraped ones everywhere.
P.forEach(p => { const c = (window.CASES || {})[p.slug]; if (c) { p.title = c.title || p.title; p.tags = c.tags || p.tags; } });
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const name = t => t.split(":")[0].trim();
const sub = t => t.includes(":") ? t.slice(t.indexOf(":") + 1).trim() : "";
const kind = p => p.tags.includes("dashboard") ? "Dashboard" : { web: "Website", app: "App", brand: "Branding" }[p.type];
// .mp4/.webm sources render as a muted looping video (browsers block autoplay with sound); reduced-motion users get controls instead.
// snd adds a mute toggle, only for clips marked "sound": true in data.js; leave it off inside links, where a button is not allowed.
const img = (im, alt, eager, vt, snd) => (snd = snd && im.sound, /\.(mp4|webm)$/i.test(im.src))
  ? (snd ? `<span class="vid">` : "") + `<video src="${im.src}" width="${im.w}" height="${im.h}" aria-label="${esc(alt)}" muted loop playsinline preload="metadata"${reduce ? " controls" : " autoplay"}${vt ? ` style="view-transition-name:${vt}"` : ""}></video>`
    + (snd ? `<button class="snd" type="button" aria-label="Unmute video" aria-pressed="false"><i class="ph ph-speaker-slash" aria-hidden="true"></i></button></span>` : "")
  : `<img src="${im.src}" width="${im.w}" height="${im.h}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"${vt ? ` style="view-transition-name:${vt}"` : ""}>`;
document.addEventListener("click", e => {
  const b = e.target.closest(".snd"); if (!b) return;
  const v = b.previousElementSibling; v.muted = !v.muted; if (!v.muted) v.play();
  b.setAttribute("aria-pressed", String(!v.muted)); b.setAttribute("aria-label", v.muted ? "Unmute video" : "Mute video");
  b.firstElementChild.className = `ph ph-speaker-${v.muted ? "slash" : "high"}`;
});
// Skip the morph when the user prefers less motion or the browser lacks the API.
const swap = fn => (!reduce && document.startViewTransition) ? document.startViewTransition(fn) : fn();

const shot = (p, i) => `
  <a class="shot reveal" style="--i:${i % 4}" href="project.html#${p.slug}" aria-label="${esc(p.title)}">
    <figure>${img(p.thumb, p.title, i < 3, "shot-" + p.slug)}
      <span class="peek"><span class="t">${esc(name(p.title))}<small>${esc(sub(p.title) || "Brand identity")}</small></span>
        <span class="chips" aria-hidden="true"><span class="chip">${kind(p)}</span><span class="chip round">↗</span></span></span>
    </figure>
  </a>`;

function reveal(root) {
  const items = root.querySelectorAll(".reveal:not(.in)");
  if (reduce || !("IntersectionObserver" in window)) return items.forEach(el => el.classList.add("in"));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  items.forEach(el => io.observe(el));
}

/* ---------- index ---------- */
const grid = document.getElementById("grid");
if (grid) {
  // Header: a still stack of the first three projects. Scrolling flies them into the grid's first row, where the same three sit.
  const deckBox = document.getElementById("collage");
  const fly = document.createElement("div");
  fly.className = "fly";
  fly.innerHTML = P.slice(0, 3).map((p, k) =>
    `<a class="fly-card" href="project.html#${p.slug}" tabindex="-1" aria-label="${esc(p.title)}" style="z-index:${3 - k}">${img(p.thumb, "", true)}</a>`).join("");
  document.body.append(fly);
  const cards = [...fly.children];
  const ease = t => (1 - Math.cos(Math.PI * t)) / 2;  // sine in-out: even pace, no rush in the middle
  const box = el => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const clamp = v => Math.min(1, Math.max(0, v));
  function place() {
    const d = box(deckBox);
    const free = filter === "all" && !q.value.trim();  // only the unfiltered grid starts with these three
    const slots = free ? [...grid.querySelectorAll(".shot figure")].slice(0, 3).map(box) : [];
    // done when the first row is near the top of the screen: a long scroll distance keeps the glide slow
    const goal = reduce || !slots[0] ? 0 : clamp(scrollY / Math.max(1, slots[0].y - innerHeight * .12));
    // cards trail the scroll position softly instead of jumping with each wheel step
    shown = reduce ? goal : shown + (goal - shown) * .12;
    if (Math.abs(goal - shown) < .0008) shown = goal; else tick();
    const t = shown;
    cards.forEach((c, k) => {
      const s = 1 - k * .05, k0 = { x: d.x + d.w / 2 + k * 18, y: d.y + d.h / 2 - k * 18, w: d.w * s, h: d.h * s };
      const tk = ease(clamp((t - k * .05) / .9));  // slight stagger: back cards leave a beat later
      const g = slots[k] ? { x: slots[k].x + slots[k].w / 2, y: slots[k].y + slots[k].h / 2, w: slots[k].w, h: slots[k].h } : k0;
      const m = key => k0[key] + (g[key] - k0[key]) * tk;
      // curved path (cubic Bezier): drop down on the right with a small outward swing, clear of the tab labels,
      // then sweep sideways into the slot, tilting into the turn like a dealt card
      const u = 1 - tk, dx = g.x - k0.x;
      const x = k0.x + 3 * u * u * tk * Math.min(220, d.w * .38) + tk ** 3 * dx, y = k0.y + (g.y - k0.y) * (1 - u ** 3);
      const tilt = k * 2 * u + Math.sin(Math.PI * tk) * (dx < 0 ? -7 : 5);
      Object.assign(c.style, { left: `${x - m("w") / 2}px`, top: `${y - m("h") / 2}px`, width: `${m("w")}px`, height: `${m("h")}px`,
        transform: `rotate(${tilt}deg)`, boxShadow: `0 30px 60px -30px rgb(23 24 28 / ${(.45 * u).toFixed(3)})` });
    });
    fly.classList.toggle("landed", t >= 1);
    grid.classList.toggle("held", free && t < 1);
  }
  let queued = false, shown = 0;
  const tick = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; place(); }); } };
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", tick);
  addEventListener("load", tick);  // web font swap moves the hero

  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach(t => {
    const f = t.dataset.filter;
    t.querySelector("span").textContent = f === "all" ? P.length : P.filter(p => p.type === f).length;
  });
  const hashFilter = { "#websites": "web", "#apps": "app", "#branding": "brand", "#ui-ux": "web" };  // #ui-ux: old links

  const q = document.getElementById("q");
  // Search looks at titles and tags only (descriptions are full of words like "approach" / "applications"),
  // matching whole words, plurals and a few synonyms, so "app" finds apps and nothing else.
  const words = p => [p.title, p.tags.join(" "), { web: "ui/ux ui ux", app: "ui/ux ui ux app product", brand: "branding brand identity logo" }[p.type]].join(" ")
    .toLowerCase().replace(/e-commerce/g, "ecommerce").split(/[^a-z0-9/]+/).flatMap(w => w.includes("/") ? [w, ...w.split("/")] : [w]).filter(Boolean);
  const SYN = { website: ["web", "landing"], websites: ["web", "landing"], site: ["web", "landing", "website"], ecommerce: ["shopping", "store"],
    shop: ["ecommerce", "store"], store: ["ecommerce", "shop"], brand: ["branding"], logos: ["logo", "wordmark"], application: ["app"], applications: ["app"] };
  const hit = (term, ws) => [term, ...(SYN[term] || [])].some(t => ws.some(w => w === t || w === t + "s" || t === w + "s" || (t.length >= 4 && w.startsWith(t))));
  const W = new Map(P.map(p => [p, words(p)]));
  let filter = hashFilter[location.hash] || "all";

  function show(animate) {
    const terms = q.value.toLowerCase().replace(/e-commerce/g, "ecommerce").split(/\s+/).filter(Boolean);
    const list = P.filter(p => (filter === "all" || p.type === filter) && terms.every(t => hit(t, W.get(p))));
    const render = () => {
      grid.innerHTML = list.length ? list.map(shot).join("")
        : `<div class="empty"><p>No projects match "${esc(q.value)}".</p><button class="btn" type="button" id="clear">Show all work</button></div>`;
      tabs.forEach(t => t.setAttribute("aria-pressed", t.dataset.filter === filter));
      document.getElementById("clear")?.addEventListener("click", () => { q.value = ""; filter = "all"; sync(); show(true); });
      reveal(grid);
      place();
    };
    animate ? swap(render) : render();
  }
  function sync() {
    const url = new URL(location.href);
    q.value.trim() ? url.searchParams.set("q", q.value.trim()) : url.searchParams.delete("q");
    url.hash = { all: "work", web: "websites", app: "apps", brand: "branding" }[filter];
    history.replaceState(null, "", url);
  }
  tabs.forEach(t => t.addEventListener("click", () => { filter = t.dataset.filter; sync(); show(true); }));
  q.addEventListener("input", () => { sync(); show(false); });
  q.form.addEventListener("submit", e => { e.preventDefault(); sync(); show(true); document.getElementById("work").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
  q.value = new URLSearchParams(location.search).get("q") || "";
  show(false);
  addEventListener("hashchange", () => { if (hashFilter[location.hash]) { filter = hashFilter[location.hash]; show(true); } });
  // Remember tab, search and scroll spot so "Back" on a project page returns exactly here.
  document.addEventListener("click", e => {
    if (e.target.closest("a.shot, .fly-card")) try { sessionStorage.setItem("from", JSON.stringify({ url: location.pathname + location.search + location.hash, y: scrollY })); } catch {}
  });
  let backY = null;
  try { backY = sessionStorage.getItem("backY"); sessionStorage.removeItem("backY"); } catch {}
  if (backY !== null) scrollTo({ top: +backY, behavior: "instant" });  // instant: CSS smooth scroll would get cut short on load
  else if (q.value) document.getElementById("work").scrollIntoView();
}

/* ---------- case study (shared by the pop-up sheet on index.html and the standalone project.html) ---------- */
const UPWORK = "https://www.upwork.com/freelancers/saqibkl", BEHANCE = "https://www.behance.net/saqibkamal";
const out = (href, label, cls) => `<a class="btn ${cls}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
function caseHTML(i) {
  const p = P[i], c = (window.CASES || {})[p.slug] || {};
  const prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
  const more = [1, 2, 3].map(k => P[(i + k) % P.length]);
  const about = (c.about || [p.desc].filter(Boolean)).map(t => `<p>${esc(t)}</p>`).join("")
    + (c.sections || []).map(([h, t]) => `<h2>${esc(h)}</h2><p>${esc(t)}</p>`).join("");  // challenge / what we did / scope
  return `
  <article class="shot-page${p.seamless ? " seamless" : ""}">
    <header class="sp-head">
      <h1>${esc(name(p.title))}${sub(p.title) ? ` <span>${esc(sub(p.title))}</span>` : ""}</h1>
      <div class="sp-by">
        <img src="img/avatar.jpg" width="48" height="48" alt="">
        <div><b>Saqib Kamal</b><small>${kind(p)} · ${esc(p.tags.filter(t => !/^(ui\/ux|web design|website|branding|brand identity)$/.test(t)).slice(0, 2).join(", "))}</small></div>
        ${out(UPWORK, "Get in touch", "primary sm")}
      </div>
    </header>
    <div class="sp-media">${img(p.images[0], p.title, true, "", true)}</div>
    ${about ? `<div class="sp-text">${about}</div>` : ""}
    <div class="sp-media">${p.images.slice(1).map((im, k) => img(im, `${name(p.title)}, image ${k + 2}`, false, "", true).replace(/<(img|video) /, '<$1 class="reveal" ')).join("")}</div>
    <div class="case-foot">
      <div class="tags"><span class="label">Tags</span>${p.tags.map(t => `<a href="./?q=${encodeURIComponent(t)}#work">${esc(t)}</a>`).join("")}</div>
      <nav class="pager" aria-label="More projects">
        ${[[prev, "Previous project", "prev"], [next, "Next project", "next"]].map(([q, label, cls]) => `
        <a class="pg ${cls}" href="project.html#${q.slug}">
          <span class="pg-img">${img(q.thumb, "", false)}</span>
          <span class="pg-text"><small>${label}</small><b>${esc(name(q.title))}</b></span>
          <i class="ph ph-arrow-${cls === "prev" ? "left" : "right"}" aria-hidden="true"></i>
        </a>`).join("")}
      </nav>
    </div>
    <section class="cta">
      <div><p class="kicker">Available for new projects</p><h2>Have a project in mind? <span>Let's make it together.</span></h2></div>
      ${out(UPWORK, "Get in touch", "light")}
    </section>
    <section class="sp-profile">
      <img src="img/avatar.jpg" width="80" height="80" alt="">
      <h2>Saqib Kamal</h2><p>Brand identity and website designer</p>
      <div class="actions">${out(UPWORK, "Get in touch", "primary")}${out(BEHANCE, "Behance", "")}</div>
    </section>
    <section class="more"><div class="more-head"><h2>More by Saqib Kamal</h2><a href="./#work">View all work →</a></div><div class="grid">${more.map(shot).join("")}</div></section>
  </article>`;
}
const caseMeta = p => {
  document.title = `${name(p.title)} | Saqib Kamal`;
  document.querySelector('meta[name="description"]').content = (window.CASES?.[p.slug]?.about || [])[0] || p.desc || p.title;
};

/* pop-up sheet on the home page: slides up over the dimmed grid, X / Esc / backdrop / Back closes it, grid keeps its place */
const sheet = document.getElementById("sheet");
if (sheet) {
  const body = sheet.querySelector(".sheet-body"), scroller = sheet.querySelector(".sheet-scroll"), homeTitle = document.title;
  const open = slug => {
    const i = P.findIndex(p => p.slug === slug);
    if (i < 0) return close();
    // same document as the grid: drop morph names so they never clash with the grid's
    body.innerHTML = caseHTML(i).replace(/ style="view-transition-name:[^"]*"/g, "");
    caseMeta(P[i]);
    reveal(body);
    if (sheet.hidden) {
      sheet.hidden = false;
      document.documentElement.classList.add("sheet-open");
      sheet.offsetHeight;  // commit the hidden state so the slide-up runs
      sheet.classList.add("on");
      sheet.querySelector(".sheet-close").focus({ preventScroll: true });
    }
    // after unhiding (a hidden scroller ignores scrollTop) and instant, so CSS smooth scroll can't leave it mid-page
    scroller.scrollTo({ top: 0, behavior: "instant" });
  };
  const close = () => {
    if (sheet.hidden) return;
    sheet.classList.remove("on");
    document.documentElement.classList.remove("sheet-open");
    document.title = homeTitle;
    setTimeout(() => { sheet.hidden = true; body.innerHTML = ""; }, reduce ? 0 : 450);
  };
  // leave every project opened in this sheet in one go, back to the exact grid entry
  const dismiss = () => history.state?.depth ? history.go(-history.state.depth) : close();
  document.addEventListener("click", e => {
    const a = e.target.closest("a.shot, .fly-card, .sheet a.pg");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    const slug = a.getAttribute("href").split("#")[1];
    history.pushState({ sheet: slug, depth: (history.state?.depth || 0) + 1 }, "", "project.html#" + slug);
    open(slug);
  });
  addEventListener("popstate", e => e.state?.sheet ? open(e.state.sheet) : close());
  sheet.querySelector(".sheet-close").addEventListener("click", dismiss);
  sheet.addEventListener("click", e => { if (e.target === sheet || e.target.classList.contains("sheet-backdrop")) dismiss(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) dismiss(); });
}

/* standalone project page (direct links, new tabs, reloads) */
const caseEl = document.getElementById("case");
if (caseEl) {
  // "Back" returns to the tab/search/scroll the visitor came from, and says where it goes.
  try {
    const from = JSON.parse(sessionStorage.getItem("from"));
    if (from) {
      const back = document.querySelector(".back"), u = new URL(from.url, location.href), term = u.searchParams.get("q");
      back.href = from.url;
      back.textContent = "← " + (term ? `Results for "${term}"` : ({ "#websites": "Websites", "#ui-ux": "Websites", "#apps": "Apps & dashboards", "#branding": "Branding work" })[u.hash] || "All work");
      back.addEventListener("click", () => { try { sessionStorage.setItem("backY", from.y); } catch {} });
    }
  } catch {}
  const index = () => Math.max(0, P.findIndex(p => p.slug === location.hash.slice(1)));
  const render = () => { const i = index(); caseEl.innerHTML = caseHTML(i); caseMeta(P[i]); reveal(caseEl); };
  render();
  addEventListener("hashchange", () => { swap(render); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  addEventListener("keydown", e => {
    if (e.target.closest("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
    const i = index();
    if (e.key === "ArrowRight") location.hash = P[(i + 1) % P.length].slug;
    if (e.key === "ArrowLeft") location.hash = P[(i - 1 + P.length) % P.length].slug;
  });
}
