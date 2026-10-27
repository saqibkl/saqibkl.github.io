// Hero: a matte white ball with a quarter cut out, two glossy orbs circling it; leans toward the cursor (three.js, pinned).
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const box = document.getElementById("collage");
if (box && "fade" in box.dataset) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
  camera.position.z = 11;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dbe6, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 4, 6); scene.add(key);
  const warm = new THREE.DirectionalLight(0xffe2cc, .6); warm.position.set(4, -3, 2); scene.add(warm);

  // full bottom half + top half with one side removed, closed by two half-disc faces = 25% empty
  const mat = new THREE.MeshStandardMaterial({ color: 0xf6f6f8, roughness: .9 }), face = mat.clone();
  face.side = THREE.DoubleSide;
  const ball = new THREE.Group(), R = 2.3, Q = Math.PI / 2;
  ball.add(new THREE.Mesh(new THREE.SphereGeometry(R, 128, 48, 0, Math.PI * 2, Q, Q), mat));
  ball.add(new THREE.Mesh(new THREE.SphereGeometry(R, 128, 48, 0, Math.PI, 0, Q), mat));
  const wall = new THREE.Mesh(new THREE.CircleGeometry(R, 96, 0, Math.PI), face);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 96, Math.PI, Math.PI), face);
  floor.rotation.x = Q;
  ball.add(wall, floor);
  scene.add(ball);
  const orb = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshPhysicalMaterial({ color: c, roughness: .15, clearcoat: 1, emissive: c, emissiveIntensity: .15 })); scene.add(m); return m; };
  const a = orb(0xa64dff, .32), b = orb(0xff5a1f, .24);

  const size = () => { const r = box.getBoundingClientRect(), w = r.width * 1.24, h = r.height * 1.24; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  size(); addEventListener("resize", size);
  let mx = 0, my = 0;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  const frame = t => {
    const s = t * .00045;
    ball.rotation.set(.4 + Math.sin(s * .7) * .1 + my * .3, Math.PI - 1.05 + Math.sin(s * .5) * .25 + mx * .4, 0);
    a.position.set(Math.cos(s) * 3.1, Math.sin(s) * 1.5 + .9, Math.sin(s) * 2.4);
    b.position.set(Math.cos(-s * 1.2) * 3, Math.sin(-s * 1.2) * 1.6 - .4, Math.cos(s) * 1.8);
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  };
  frame(0);
}
