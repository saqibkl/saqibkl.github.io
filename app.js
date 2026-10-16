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
  // Header collage: a small bento of real shots, like a Dribbble Pro profile.
  const pick = [0, 13, 4, 15, 8].map(k => P[k]).filter(Boolean);
  document.getElementById("collage").innerHTML = pick.map((p, k) => `<a class="c c${k}" href="project.html#${p.slug}" tabindex="-1">${img(p.thumb, "", true)}</a>`).join("");

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
  if (q.value) document.getElementById("work").scrollIntoView();
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
    document.querySelector('meta[name="description"]').content = (window.CASES?.[p.slug]?.brief) || p.desc || p.title;
    const c = (window.CASES || {})[p.slug];
    const study = c ? `
        <div class="study">
          <div><h2>The brief</h2><p>${esc(c.brief)}</p></div>
          <div><h2>The approach</h2><p>${esc(c.approach)}</p></div>
          <div><h2>What I delivered</h2><ul>${c.deliver.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div>
        </div>` : (p.desc ? `<p class="desc">${esc(p.desc)}</p>` : "");
    const head = `
        <p class="cats">${esc(p.cats)}</p>
        <h1>${esc(name(p.title))}</h1>
        ${sub(p.title) ? `<p class="sub">${esc(sub(p.title))}</p>` : ""}`;
    const cover = img(p.thumb, p.title, true, "shot-" + p.slug);
    const pics = p.images.map((im, k) => img(im, `${name(p.title)}, image ${k + 1}`, k < 1));
    // Three layouts, rotated so neighbouring projects never look the same.
    const layout = ["stacked", "side", "editorial"][i % 3];
    let body;
    if (layout === "side") {
      body = `<div class="case side"><aside class="case-head">${head}${study}</aside><div class="stack">${cover}${pics.join("")}</div></div>`;
    } else if (layout === "editorial") {
      // pair up landscape-ish images two by two, keep tall ones full width
      const rows = []; let pair = [];
      p.images.forEach((im, k) => {
        if (im.h / im.w < 0.9) { pair.push(pics[k]); if (pair.length === 2) { rows.push(`<div class="pair">${pair.join("")}</div>`); pair = []; } }
        else { if (pair.length) { rows.push(pair.join("")); pair = []; } rows.push(pics[k]); }
      });
      if (pair.length) rows.push(pair.join(""));
      body = `<div class="case editorial"><div class="stack">${cover}</div><header class="case-head wide">${head}</header>${study.replace('class="study"', 'class="study cols"')}<div class="stack">${rows.join("")}</div></div>`;
    } else {
      body = `<div class="case stacked"><header class="case-head">${head}${study}</header><div class="stack">${cover}${pics.join("")}</div></div>`;
    }
    caseEl.innerHTML = `
      ${body}
      <div class="tags">${p.tags.map(t => `<a href="./?q=${encodeURIComponent(t)}#work">${esc(t)}</a>`).join("")}</div>
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
