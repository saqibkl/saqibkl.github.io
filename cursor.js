// Custom cursor: a dot plus a ring that trails it. The ring grows over links, says "Drag" over the 3D hero, "View" over
// work cards, and over the headline words it turns into a preview card flicking through branding or website thumbnails.
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dot = document.createElement("div"), ring = document.createElement("div"), pic = new Image(), txt = document.createElement("span");
  dot.className = "cur-dot"; ring.className = "cur-ring"; pic.alt = ""; ring.append(pic, txt);
  document.body.append(dot, ring);
  document.documentElement.classList.add("has-cursor");

  const P = window.PROJECTS || [];
  const sets = {
    brand: P.filter(p => p.type === "brand").slice(0, 8).map(p => p.thumb.src),
    web: P.filter(p => p.type === "web").slice(0, 8).map(p => p.thumb.src),
  };
  Object.values(sets).flat().forEach(src => { new Image().src = src; });  // preload so the flicker never shows blanks

  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, flick = null, shown = false, mag = null;
  addEventListener("pointermove", e => {
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; rx = x; ry = y; }
    const t = e.target.closest?.("[data-cursor], #collage, a.shot, a, button, input");
    const mode = !t ? "" : t.dataset.cursor ? "preview" : t.id === "collage" ? "drag" : t.matches("a.shot") ? "label" : "link";
    if (mode === "preview" && ring.dataset.set !== t.dataset.cursor) {
      ring.dataset.set = t.dataset.cursor;
      const list = sets[t.dataset.cursor] || []; let i = 0;
      clearInterval(flick); pic.src = list[0] || "";
      if (!reduce) flick = setInterval(() => { i = (i + 1) % list.length; pic.src = list[i]; }, 900);
    }
    if (mode !== "preview") { clearInterval(flick); delete ring.dataset.set; }
    txt.textContent = mode === "drag" ? "← Drag →" : mode === "label" ? "View" : "";
    ring.className = "cur-ring" + (mode ? " " + mode : "");
    // magnetic (picked by Saqib): buttons, small links and work cards lean toward the cursor; buttons and links also get the ring wrapped around them
    const m = (mode === "link" || mode === "label") && t.offsetWidth < 700 ? t : null;
    if (m !== mag) { if (mag) mag.style.translate = ""; mag = m; if (mag) mag.style.transition = "translate .25s"; }
  }, { passive: true });
  document.addEventListener("pointerleave", () => { dot.style.opacity = ring.style.opacity = 0; });
  document.addEventListener("pointerenter", () => { dot.style.opacity = ring.style.opacity = 1; });

  const tick = () => {
    rx += (x - rx) * (reduce ? 1 : .18); ry += (y - ry) * (reduce ? 1 : .18);
    dot.style.transform = `translate(${x}px, ${y}px)`;
    const wrap = mag && ring.classList.contains("link");
    if (mag) {
      const [tx, ty] = (mag.style.translate || "0 0").split(" ").concat("0").map(v => parseFloat(v) || 0), b = mag.getBoundingClientRect();
      const cx = b.left + b.width / 2 - tx, cy = b.top + b.height / 2 - ty, dx = (x - cx) * .12, dy = (y - cy) * .12;
      mag.style.translate = `${dx}px ${dy}px`;
      if (wrap) {
        const w = b.width + 12, h = b.height + 12;
        Object.assign(ring.style, { width: w + "px", height: h + "px", margin: `${-h / 2}px 0 0 ${-w / 2}px`, borderRadius: getComputedStyle(mag).borderRadius, background: "none" });
        rx = cx + dx; ry = cy + dy;
      }
    }
    if (!wrap && ring.style.width) ["width", "height", "margin", "borderRadius", "background"].forEach(k => ring.style[k] = "");
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    // preview card: a soft rounded square whose sides ripple slowly (squircle + travelling waves, drawn as a clip path)
    if (ring.classList.contains("preview")) {
      const ts = reduce ? 0 : performance.now() / 900, p = [];
      for (let i = 0; i < 96; i++) {
        const a = i / 96 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const side = Math.cos(2 * a) ** 2;  // 1 mid-side, 0 at the corners: corners stay put, only the sides ripple
        const r = .95 + side * (.035 * Math.sin(4 * a + ts) + .015 * Math.sin(8 * a - ts * 1.4));
        p.push(`${(50 + 50 * r * Math.sign(c) * Math.abs(c) ** .45).toFixed(2)}% ${(50 + 50 * r * Math.sign(s) * Math.abs(s) ** .45).toFixed(2)}%`);
      }
      ring.style.clipPath = `polygon(${p.join(",")})`;
    } else if (ring.style.clipPath) ring.style.clipPath = "";
    requestAnimationFrame(tick);
  };
  tick();
})();
