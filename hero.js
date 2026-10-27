// Hero: a large matte half-ball with two glossy orbs. Swipe across it (mouse or finger) and it splits along the swipe
// like a cut fruit, the halves drift apart, then close up again. three.js, pinned version, home page only.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const box = document.getElementById("collage");
if (box && "fade" in box.dataset) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.localClippingEnabled = true;
  box.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
  camera.position.z = 12.5;  // far enough that the orbs never leave the hero box (the sticky header would crop them)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dbe6, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-4, 4, 6); scene.add(key);
  const warm = new THREE.DirectionalLight(0xffe2cc, .5); warm.position.set(4, -3, 2); scene.add(warm);

  const R = 3.1, Q = Math.PI / 2, TAU = Math.PI * 2;
  const dome = new THREE.SphereGeometry(R, 128, 48, 0, TAU, Q, Q);           // bottom half of a ball
  const lid = new THREE.CircleGeometry(R, 128); lid.rotateX(-Q);              // flat face
  const matte = planes => new THREE.MeshStandardMaterial({ color: 0xf6f6f8, roughness: .9, side: THREE.DoubleSide, clippingPlanes: planes });
  const half = planes => { const g = new THREE.Group(), m = matte(planes); g.add(new THREE.Mesh(dome, m), new THREE.Mesh(lid, m)); return g; };

  const ball = new THREE.Group(); scene.add(ball);
  const whole = half([]); ball.add(whole);
  // the two pieces of a cut: clipped by world planes that move with them, each closed by a half-disc cap
  const pa = new THREE.Plane(), pb = new THREE.Plane();
  const A = half([pa]), B = half([pb]);
  const capGeo = new THREE.CircleGeometry(R, 96, Math.PI, Math.PI);           // lower half disc = cross-section of the half-ball
  const capA = new THREE.Mesh(capGeo, matte([])), capB = new THREE.Mesh(capGeo, matte([]));
  A.add(capA); B.add(capB); A.visible = B.visible = false; ball.add(A, B);

  const orb = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshPhysicalMaterial({ color: c, roughness: .15, clearcoat: 1, emissive: c, emissiveIntensity: .15 })); scene.add(m); return m; };
  const oa = orb(0xa64dff, .34), ob = orb(0xff5a1f, .26);

  const size = () => { const r = box.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  size(); addEventListener("resize", size);
  let mx = 0, my = 0;

  // ---- slicing ----
  let cut = null;                     // { n: world cut normal, t0 }
  const nl = new THREE.Vector3(), m4 = new THREE.Matrix4();
  const orient = (cap, n) => {
    // cap circle: +Y -> up within the cut plane (its lower half then points down into the dome), +Z -> cut normal
    const up = new THREE.Vector3(0, 1, 0).addScaledVector(n, -n.y).normalize(), x = new THREE.Vector3().crossVectors(up, n);
    cap.quaternion.setFromRotationMatrix(m4.makeBasis(x, up, n));
  };
  function slice(dx, dy) {
    const n = new THREE.Vector3(dy, dx, 0).normalize();   // perpendicular to the swipe, in the screen plane
    nl.copy(n).applyQuaternion(ball.quaternion.clone().invert());
    orient(capA, nl); orient(capB, nl.clone().negate());
    cut = { n, t0: performance.now() };
    whole.visible = false; A.visible = B.visible = true;
  }
  // a fast stroke over the ball cuts it (mouse: just move fast; touch: swipe)
  const trail = [];  // pointer positions from the last 120ms: one stroke = oldest point -> newest
  const c3 = new THREE.Vector3();
  addEventListener("pointermove", e => {
    mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    const now = performance.now(), p = { x: e.clientX, y: e.clientY, t: now };
    trail.push(p); while (trail.length && now - trail[0].t > 120) trail.shift();
    const last = trail[0];
    if (last !== p && !cut) {
      const dx = p.x - last.x, dy = p.y - last.y, len = Math.hypot(dx, dy), speed = len / Math.max(1, now - last.t);
      const r = box.getBoundingClientRect();
      c3.set(0, 0, 0).project(camera);
      const cx = r.left + (c3.x + 1) / 2 * r.width, cy = r.top + (1 - c3.y) / 2 * r.height;
      const rad = R / (camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * r.height / 2;
      const k = Math.max(0, Math.min(1, ((cx - last.x) * dx + (cy - last.y) * dy) / (len * len || 1)));
      const dist = Math.hypot(last.x + k * dx - cx, last.y + k * dy - cy);   // ball centre to stroke segment
      if (speed > .8 && len > rad * .5 && dist < rad * .75) { slice(dx, dy); trail.length = 0; }
    }
  });
  box.style.touchAction = "pan-y";

  const ease = x => 1 - Math.pow(1 - x, 3);
  const frame = t => {
    const s = reduce ? 0 : t * .00045;
    // flat face turned toward the viewer, upper left, like a tilted bowl
    if (!cut) ball.rotation.set(1.2 + Math.sin(s * .7) * .06 + my * .2, Math.sin(s * .5) * .15 + mx * .3, .9);
    if (cut) {
      // apart in 0.6s, hold, back together by 2.2s
      const e = performance.now() - cut.t0;
      const d = e < 600 ? ease(e / 600) * 1.1 : e < 1400 ? 1.1 : e < 2200 ? 1.1 * (1 - ease((e - 1400) / 800)) : 0;
      A.position.copy(nl).multiplyScalar(d); B.position.copy(nl).multiplyScalar(-d);
      pa.set(cut.n, -d); pb.set(cut.n.clone().negate(), -d);   // A keeps n.p >= d, B keeps n.p <= -d
      if (e >= 2200) { cut = null; whole.visible = true; A.visible = B.visible = false; }
    }
    // orbs drift slowly in front of the flat face
    oa.position.set(-.6 + Math.cos(s) * 1.4, 1.9 + Math.sin(s * 1.3) * .5, 3);
    ob.position.set(-1.5 + Math.sin(s * .9) * .8, -1.4 + Math.cos(s) * .5, 3.2);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  frame(0);
}
