// Hero: a matte white ball with a quarter cut out, two glossy orbs circling it; leans toward the cursor (three.js, pinned).
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const box = document.getElementById("collage");
if (box && "fade" in box.dataset) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
  camera.position.z = 13.5;  // far enough that the orbs never leave the hero box (the sticky header would crop them)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dbe6, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 4, 6); scene.add(key);
  const warm = new THREE.DirectionalLight(0xffe2cc, .6); warm.position.set(4, -3, 2); scene.add(warm);

  // Bottom half is always whole; the top half keeps an arc of L radians (2pi = full ball, pi = quarter cut, 0 = half ball).
  // Cut walls and the floor of the missing slice are rebuilt whenever L changes.
  const mat = new THREE.MeshStandardMaterial({ color: 0xf6f6f8, roughness: .9 }), face = mat.clone();
  face.side = THREE.DoubleSide;
  const ball = new THREE.Group(), R = 2.3, Q = Math.PI / 2, TAU = Math.PI * 2;
  ball.add(new THREE.Mesh(new THREE.SphereGeometry(R, 128, 48, 0, TAU, Q, Q), mat));
  const cut = new THREE.Group(); ball.add(cut);
  let builtL = -1;
  const build = L => {
    if (Math.abs(L - builtL) < .002) return;
    builtL = L;
    cut.children.forEach(m => m.geometry.dispose()); cut.clear();
    if (L > .01) cut.add(new THREE.Mesh(new THREE.SphereGeometry(R, Math.max(8, Math.round(128 * L / TAU)), 48, 0, L, 0, Q), mat));
    if (L < TAU - .01) {
      // vertical quarter-disc walls at phi = 0 and phi = L (sphere direction at phi is (-cos phi, 0, sin phi))
      [0, L].forEach(p => { const w = new THREE.Mesh(new THREE.CircleGeometry(R, 64, 0, Q), face); w.rotation.y = Math.PI + p; cut.add(w); });
      const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 96, -Math.PI, TAU - L), face);
      floor.rotation.x = Q; cut.add(floor);
    }
  };
  build(Math.PI);
  scene.add(ball);
  const orb = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshPhysicalMaterial({ color: c, roughness: .15, clearcoat: 1, emissive: c, emissiveIntensity: .15 })); scene.add(m); return m; };
  const a = orb(0xa64dff, .32), b = orb(0xff5a1f, .24);

  const size = () => { const r = box.getBoundingClientRect(), w = r.width, h = r.height; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  size(); addEventListener("resize", size);
  let mx = 0, my = 0;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  // Shape cycle: quarter cut -> full ball -> half ball -> back, holding each for a moment.
  const STEPS = [Math.PI, TAU, 0], HOLD = 2600, MOVE = 1400;
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const shapeAt = t => {
    const c = t % ((HOLD + MOVE) * 3), i = Math.floor(c / (HOLD + MOVE)), f = Math.max(0, (c - i * (HOLD + MOVE) - HOLD) / MOVE);
    const from = STEPS[i], to = STEPS[(i + 1) % 3];
    return from + (to - from) * ease(f);
  };
  const frame = t => {
    const s = t * .00045;
    if (!reduce) build(shapeAt(t));
    ball.rotation.set(.4 + Math.sin(s * .7) * .1 + my * .3, Math.PI - 1.05 + Math.sin(s * .5) * .25 + mx * .4, 0);
    a.position.set(Math.cos(s) * 3.1, Math.sin(s) * 1.5 + .9, Math.sin(s) * 2.4);
    b.position.set(Math.cos(-s * 1.2) * 3, Math.sin(-s * 1.2) * 1.6 - .4, Math.cos(s) * 1.8);
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  };
  frame(0);
}
