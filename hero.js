// Hero: a large matte half-ball held at a set angle, with two glossy orbs that lean toward the cursor and cast soft shadows on it.
// Drag the ball to spin it any way; on release it drifts back to rest very slowly. three.js, pinned version, home page only.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const box = document.getElementById("collage");
if (box && "fade" in box.dataset) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  box.append(renderer.domElement);
  // The canvas is 1.8x the hero box (CSS) and sits above the header and grid, so spun orbs are never cropped;
  // the wider field of view keeps the ball the same size it would have in the box alone.
  const F = 1.8, scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(2 * THREE.MathUtils.radToDeg(Math.atan(F * Math.tan(THREE.MathUtils.degToRad(16)))), 1, .1, 60);
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
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshPhysicalMaterial({ color: c, roughness: .15, clearcoat: 1, emissive: 0x000000 }));
    m.castShadow = true; ball.add(m); return m;  // children of the ball, so they turn with it when dragged
  };
  const oa = orb(0x17181c, .36), ob = orb(0x17181c, .28);

  const size = () => { const r = renderer.domElement.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  size(); addEventListener("resize", size);

  // cursor in world units on the plane of the orbs (z = 2.6), so the orbs can chase it
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.6), aim = new THREE.Vector3(-1, .5, 2.6);
  addEventListener("pointermove", e => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); ray.ray.intersectPlane(plane, aim);
    aim.x = THREE.MathUtils.clamp(aim.x, -4.2, 4.2); aim.y = THREE.MathUtils.clamp(aim.y, -3.2, 3.2);  // stay in the box
  });

  // drag to spin; on release the offset springs back to zero (the resting angle)
  // resting angle (picked by Saqib): flat face turned up and toward the viewer, leaning left
  let spinX = 0, spinY = 0, drag = null;
  box.style.touchAction = "pan-y";
  box.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, sx: spinX, sy: spinY }; box.setPointerCapture(e.pointerId); box.classList.add("dragging"); });
  box.addEventListener("pointermove", e => { if (drag) { spinY = drag.sy + (e.clientX - drag.x) * .012; spinX = drag.sx + (e.clientY - drag.y) * .012; } });
  const end = () => { drag = null; box.classList.remove("dragging"); };
  box.addEventListener("pointerup", end); box.addEventListener("pointercancel", end);

  const qRest = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-.5, .62, .55).normalize()), qSpin = new THREE.Quaternion(), eSpin = new THREE.Euler();
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), qInv = qRest.clone().invert();
  const frame = t => {
    if (!drag) { spinX *= .996; spinY *= .996; }   // drifts back to rest very slowly (about 10s)
    qSpin.setFromEuler(eSpin.set(spinX, spinY, 0));
    ball.quaternion.copy(qSpin).multiply(qRest);  // spin in screen directions on top of the resting angle
    const s = reduce ? 0 : t * .0008;
    // orbs stay at home in front of the face and only lean a little toward the cursor (about 4% of its distance)
    pa.set(-.3 + aim.x * .05, 2.2 + aim.y * .05 + Math.sin(s) * .12, 2.6); pb.set(-1.7 + aim.x * .07, .7 + aim.y * .07 + Math.cos(s) * .12, 3);
    // homes are given in resting-view coordinates; convert into the ball's own frame
    pa.applyQuaternion(qInv); pb.applyQuaternion(qInv);
    oa.position.lerp(pa, reduce ? 1 : .08); ob.position.lerp(pb, reduce ? 1 : .05);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  oa.position.set(-.3, 2.2, 2.6).applyQuaternion(qInv); ob.position.set(-1.7, .7, 3).applyQuaternion(qInv);
  frame(0);
}
