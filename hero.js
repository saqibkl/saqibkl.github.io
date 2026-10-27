// Hero: a glossy 3D knot that turns slowly and leans toward the cursor (three.js, pinned version, loaded only on the home page).
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const box = document.getElementById("collage");
if (box && "fade" in box.dataset) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .1, 50);
  camera.position.z = 11.5;
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.6, .52, 260, 48, 2, 3),
    new THREE.MeshPhysicalMaterial({ color: 0x17181c, roughness: .22, metalness: .1, clearcoat: 1, clearcoatRoughness: .08 }));
  scene.add(knot);
  // flat coloured lights give the black knot orange and teal edges, no background gradient
  scene.add(new THREE.AmbientLight(0xffffff, .35));
  const key = new THREE.DirectionalLight(0xff6a2b, 3.2); key.position.set(4, 3, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x2fd1c5, 2.6); rim.position.set(-5, -2, 2); scene.add(rim);
  const top = new THREE.DirectionalLight(0xffffff, 1.2); top.position.set(0, 6, 3); scene.add(top);
  const size = () => { const r = box.getBoundingClientRect(), w = r.width * 1.24, h = r.height * 1.24; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  size(); addEventListener("resize", size);
  let mx = 0, my = 0, rx = 0, ry = 0;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  const frame = t => {
    rx += (my * .6 - rx) * .05; ry += (mx * .8 - ry) * .05;
    knot.rotation.set(rx + t * .00018, ry + t * .00026, t * .00008);
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  };
  frame(0);
}
