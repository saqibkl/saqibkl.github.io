// Renders the shot grid (index.html) and the case study page (project.html) from window.PROJECTS (data.js).
const P = window.PROJECTS || [];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const name = t => t.split(":")[0].trim();
const sub = t => t.includes(":") ? t.slice(t.indexOf(":") + 1).trim() : "";
const kind = p => p.type === "web" ? "Website" : "Branding";
const img = (im, alt, eager, vt) =>
  `<img src="${im.src}" width="${im.w}" height="${im.h}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"${vt ? ` style="view-transition-name:${vt}"` : ""}>`;
// Skip the morph when the user prefers less motion or the browser lacks the API.
const swap = fn => (!reduce && document.startViewTransition) ? document.startViewTransition(fn) : fn();

const shot = (p, i) => `
  <a class="shot reveal" style="--i:${i % 3}" href="project.html#${p.slug}">
    <figure>${img(p.thumb, p.title, i < 3, "shot-" + p.slug)}<span class="peek">${esc(name(p.title))}<span aria-hidden="true">→</span></span></figure>
    <div class="meta"><h3>${esc(name(p.title))}<span class="sub">${esc(sub(p.title) || "Brand identity")}</span></h3><p>${kind(p)}</p></div>
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
  const strip = document.getElementById("strip");
  const pick = P.filter((_, i) => i % 2 === 0).slice(0, 10);
  strip.innerHTML = [...pick, ...pick].map(p => img(p.thumb, "", true)).join(""); // doubled for a seamless loop

  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach(t => {
    const f = t.dataset.filter;
    t.querySelector("span").textContent = f === "all" ? P.length : P.filter(p => p.type === f).length;
  });
  const hashFilter = { "#websites": "web", "#branding": "brand" };

  function show(filter, animate) {
    const list = filter === "all" ? P : P.filter(p => p.type === filter);
    const render = () => {
      grid.innerHTML = list.length ? list.map(shot).join("") : `<p class="empty">No projects here yet.</p>`;
      tabs.forEach(t => t.setAttribute("aria-pressed", t.dataset.filter === filter));
      reveal(grid);
    };
    animate ? swap(render) : render();
  }
  tabs.forEach(t => t.addEventListener("click", () => {
    const f = t.dataset.filter;
    history.replaceState(null, "", f === "all" ? "#work" : f === "web" ? "#websites" : "#branding");
    show(f, true);
  }));
  show(hashFilter[location.hash] || "all", false);
}

/* ---------- project page ---------- */
const caseEl = document.getElementById("case");
if (caseEl) {
  function render() {
    const i = Math.max(0, P.findIndex(p => p.slug === location.hash.slice(1)));
    const p = P[i];
    const prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    const more = [1, 2, 3].map(k => P[(i + k) % P.length]);
    document.title = `${name(p.title)} | Saqib Kamal`;
    document.querySelector('meta[name="description"]').content = p.desc || p.title;
    caseEl.innerHTML = `
      <header class="case-head">
        <p class="cats">${esc(p.cats)}</p>
        <h1>${esc(name(p.title))}</h1>
        ${sub(p.title) ? `<p class="sub">${esc(sub(p.title))}</p>` : ""}
        ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ""}
      </header>
      <div class="stack">
        ${img(p.thumb, p.title, true, "shot-" + p.slug)}
        ${p.images.map((im, k) => img(im, `${name(p.title)}, image ${k + 1}`, k < 1)).join("")}
      </div>
      <div class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>
      <nav class="pager" aria-label="More projects">
        <a class="btn" href="#${prev.slug}">← ${esc(name(prev.title))}</a>
        <a class="btn" href="#${next.slug}">${esc(name(next.title))} →</a>
      </nav>
      <section class="more"><h2>More work</h2><div class="grid">${more.map(shot).join("")}</div></section>`;
    reveal(caseEl);
  }
  render();
  window.addEventListener("hashchange", () => { swap(render); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  addEventListener("keydown", e => {
    if (e.target.closest("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
    const i = Math.max(0, P.findIndex(p => p.slug === location.hash.slice(1)));
    if (e.key === "ArrowRight") location.hash = P[(i + 1) % P.length].slug;
    if (e.key === "ArrowLeft") location.hash = P[(i - 1 + P.length) % P.length].slug;
  });
}
