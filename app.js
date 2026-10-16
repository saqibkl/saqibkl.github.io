// Renders the shot grid (index.html) and the case study page (project.html) from window.PROJECTS (data.js).
const P = window.PROJECTS || [];
// cases.js holds the cleaned titles and accurate tags; they replace the scraped ones everywhere.
P.forEach(p => { const c = (window.CASES || {})[p.slug]; if (c) { p.title = c.title || p.title; p.tags = c.tags || p.tags; } });
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const name = t => t.split(":")[0].trim();
const sub = t => t.includes(":") ? t.slice(t.indexOf(":") + 1).trim() : "";
const kind = p => p.type === "web" ? "UI/UX" : "Branding";
const img = (im, alt, eager, vt) =>
  `<img src="${im.src}" width="${im.w}" height="${im.h}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"${vt ? ` style="view-transition-name:${vt}"` : ""}>`;
// Skip the morph when the user prefers less motion or the browser lacks the API.
const swap = fn => (!reduce && document.startViewTransition) ? document.startViewTransition(fn) : fn();

const shot = (p, i) => `
  <a class="shot reveal" style="--i:${i % 3}" href="project.html#${p.slug}" aria-label="${esc(p.title)}">
    <figure>${img(p.thumb, p.title, i < 3, "shot-" + p.slug)}
      <span class="peek"><span class="t">${esc(name(p.title))}<small>${esc(sub(p.title) || "Brand identity")}</small></span>
        <span class="chips" aria-hidden="true"><span class="chip">${p.type === "web" ? "UI/UX" : "Branding"}</span><span class="chip round">↗</span></span></span>
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
  // Header: two columns of real covers drifting in opposite directions (pauses on hover, static for reduced motion).
  const cols = [[0, 3, 6, 36, 5, 46], [1, 8, 35, 2, 41, 9]];
  document.getElementById("collage").innerHTML = cols.map((ks, c) => `
    <div class="mq mq${c}"><div class="mq-track">${[...ks, ...ks].map((k, n) => {
      const p = P[k];  // second copy of the list makes the loop seamless; hide it from screen readers
      return `<a href="project.html#${p.slug}" tabindex="-1"${n >= ks.length ? ' aria-hidden="true"' : ""}>${img(p.thumb, n >= ks.length ? "" : p.title, n < 2)}</a>`;
    }).join("")}</div></div>`).join("");

  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach(t => {
    const f = t.dataset.filter;
    t.querySelector("span").textContent = f === "all" ? P.length : P.filter(p => p.type === f).length;
  });
  const hashFilter = { "#ui-ux": "web", "#branding": "brand" };

  const q = document.getElementById("q");
  // Everything a client might type: title, description, Behance tags, categories and the project type.
  const hay = p => [p.title, p.desc, p.cats, p.tags.join(" "), p.type === "web" ? "website web design" : "branding brand identity logo"].join(" ").toLowerCase();
  let filter = hashFilter[location.hash] || "all";

  function show(animate) {
    const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const list = P.filter(p => (filter === "all" || p.type === filter) && terms.every(t => hay(p).includes(t)));
    const render = () => {
      grid.innerHTML = list.length ? list.map(shot).join("")
        : `<div class="empty"><p>No projects match "${esc(q.value)}".</p><button class="btn" type="button" id="clear">Show all work</button></div>`;
      tabs.forEach(t => t.setAttribute("aria-pressed", t.dataset.filter === filter));
      document.getElementById("clear")?.addEventListener("click", () => { q.value = ""; filter = "all"; sync(); show(true); });
      reveal(grid);
    };
    animate ? swap(render) : render();
  }
  function sync() {
    const url = new URL(location.href);
    q.value.trim() ? url.searchParams.set("q", q.value.trim()) : url.searchParams.delete("q");
    url.hash = filter === "all" ? "work" : filter === "web" ? "ui-ux" : "branding";
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
    if (e.target.closest("a.shot, .collage a")) try { sessionStorage.setItem("from", JSON.stringify({ url: location.pathname + location.search + location.hash, y: scrollY })); } catch {}
  });
  let backY = null;
  try { backY = sessionStorage.getItem("backY"); sessionStorage.removeItem("backY"); } catch {}
  if (backY !== null) scrollTo({ top: +backY, behavior: "instant" });  // instant: CSS smooth scroll would get cut short on load
  else if (q.value) document.getElementById("work").scrollIntoView();
}

/* ---------- case study (shared by the pop-up sheet on index.html and the standalone project.html) ---------- */
const UPWORK = "https://www.upwork.com/freelancers/saqibkl", BEHANCE = "https://www.behance.net/saqibkamal2";
const out = (href, label, cls) => `<a class="btn ${cls}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
function caseHTML(i) {
  const p = P[i], c = (window.CASES || {})[p.slug] || {};
  const prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
  const more = [1, 2, 3].map(k => P[(i + k) % P.length]);
  const about = (c.about || [p.desc].filter(Boolean)).map(t => `<p>${esc(t)}</p>`).join("");
  return `
  <article class="shot-page">
    <header class="sp-head">
      <h1>${esc(name(p.title))}${sub(p.title) ? ` <span>${esc(sub(p.title))}</span>` : ""}</h1>
      <div class="sp-by">
        <img src="img/avatar.jpg" width="48" height="48" alt="">
        <div><b>Saqib Kamal</b><small>${kind(p)} · ${esc(p.tags.slice(1, 3).join(", "))}</small></div>
        ${out(UPWORK, "Get in touch", "primary sm")}
      </div>
    </header>
    <div class="sp-media">${img(p.images[0], p.title, true)}</div>
    ${about ? `<div class="sp-text">${about}</div>` : ""}
    <div class="sp-media">${p.images.slice(1).map((im, k) => img(im, `${name(p.title)}, image ${k + 2}`, false).replace("<img ", '<img class="reveal" ')).join("")}</div>
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
    scroller.scrollTop = 0;
    if (sheet.hidden) {
      sheet.hidden = false;
      document.documentElement.classList.add("sheet-open");
      sheet.offsetHeight;  // commit the hidden state so the slide-up runs
      sheet.classList.add("on");
      sheet.querySelector(".sheet-close").focus({ preventScroll: true });
    }
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
    const a = e.target.closest("a.shot, .collage a, .sheet a.pg");
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
      back.textContent = "← " + (term ? `Results for "${term}"` : u.hash === "#ui-ux" ? "UI/UX work" : u.hash === "#branding" ? "Branding work" : "All work");
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
