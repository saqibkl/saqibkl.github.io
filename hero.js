// Hero: a large matte half-ball held at a set angle, with two glossy orbs that follow the cursor and cast soft shadows on it.
// Drag the ball to spin it any way; let go and it eases back to its resting angle. three.js, pinned version, home page only.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const box = document.getElementById("collage");
if (box && "fade" in box.dataset) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  box.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
  camera.position.z = 12.5;  // far enough that the orbs never leave the hero box (the sticky header would crop them)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dbe6, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-5, 5, 9);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8; key.shadow.bias = -.0005;
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  scene.add(key);
  const warm = new THREE.DirectionalLight(0xffe2cc, .5); warm.position.set(4, -3, 2); scene.add(warm);

  const R = 3.1, Q = Math.PI / 2;
  const mat = new THREE.MeshStandardMaterial({ color: 0xf6f6f8, roughness: .9, side: THREE.DoubleSide });
  const ball = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 48, 0, Math.PI * 2, Q, Q), mat);  // bottom half of a ball
  const lid = new THREE.Mesh(new THREE.CircleGeometry(R, 128), mat); lid.rotation.x = -Q;           // flat face
  [dome, lid].forEach(m => { m.receiveShadow = true; m.castShadow = true; });
  ball.add(dome, lid); scene.add(ball);

  const orb = (c, r) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshPhysicalMaterial({ color: c, roughness: .15, clearcoat: 1, emissive: c, emissiveIntensity: .15 }));
    m.castShadow = true; scene.add(m); return m;
  };
  const oa = orb(0xa64dff, .36), ob = orb(0xff5a1f, .28);

  const size = () => { const r = box.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  size(); addEventListener("resize", size);

  // cursor in world units on the plane of the orbs (z = 2.6), so the orbs can chase it
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.6), aim = new THREE.Vector3(-1, .5, 2.6);
  addEventListener("pointermove", e => {
    const r = box.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); ray.ray.intersectPlane(plane, aim);
    aim.x = THREE.MathUtils.clamp(aim.x, -4.2, 4.2); aim.y = THREE.MathUtils.clamp(aim.y, -3.2, 3.2);  // stay in the box
  });

  // drag to spin; on release the offset springs back to zero (the resting angle)
  const REST = new THREE.Euler(1.2, 0, .9);
  let spinX = 0, spinY = 0, drag = null;
  box.style.touchAction = "pan-y";
  box.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, sx: spinX, sy: spinY }; box.setPointerCapture(e.pointerId); box.classList.add("dragging"); });
  box.addEventListener("pointermove", e => { if (drag) { spinY = drag.sy + (e.clientX - drag.x) * .012; spinX = drag.sx + (e.clientY - drag.y) * .012; } });
  const end = () => { drag = null; box.classList.remove("dragging"); };
  box.addEventListener("pointerup", end); box.addEventListener("pointercancel", end);

  const qRest = new THREE.Quaternion().setFromEuler(REST), qSpin = new THREE.Quaternion(), eSpin = new THREE.Euler();
  const pa = new THREE.Vector3(), pb = new THREE.Vector3();
  const frame = t => {
    if (!drag) { spinX *= .92; spinY *= .92; }   // ease back to rest
    qSpin.setFromEuler(eSpin.set(spinX, spinY, 0));
    ball.quaternion.copy(qSpin).multiply(qRest);  // spin in screen directions on top of the resting angle
    const s = reduce ? 0 : t * .0008;
    // orbs chase the cursor at different speeds, keeping a gap between them
    pa.set(aim.x - .5, aim.y + .5 + Math.sin(s) * .15, 2.6); pb.set(aim.x + .7, aim.y - .6 + Math.cos(s) * .15, 3);
    oa.position.lerp(pa, reduce ? 1 : .08); ob.position.lerp(pb, reduce ? 1 : .05);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  oa.position.set(-1.5, 1, 2.6); ob.position.set(-.5, -.5, 3);
  frame(0);
}
