// 3D-композиция инструментов в первом экране. Без WebGL остаётся картинка-рендер.
// Обычный скрипт + динамическая загрузка Three.js — работает и с хостинга, и с диска.
(() => {
"use strict";
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
const host = document.getElementById("hero3d");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (_) { return false; }
}

function blobTexture(T) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  r.addColorStop(0, "rgba(15,47,87,0.32)"); r.addColorStop(1, "rgba(15,47,87,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

function start(T) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = T.NeutralToneMapping;
  host.appendChild(renderer.domElement);

  const scene = new T.Scene();
  scene.environment = window.SRTools.env(T, renderer);
  const key = new T.DirectionalLight(0xffffff, 1.5); key.position.set(-3, 6, 5); scene.add(key);
  scene.add(new T.HemisphereLight(0xffffff, 0xbcd7ef, 0.55));

  const M = window.SRTools.materials(T);
  const root = new T.Group(); scene.add(root);
  const items = window.SRTools.heroSet(T, M);
  items.forEach((it) => root.add(it.obj));

  // центрирование и тень-пятно
  const box = new T.Box3().setFromObject(root);
  const center = box.getCenter(new T.Vector3());
  root.children.forEach((c) => c.position.sub(center));
  items.forEach((it) => { it.base = [it.obj.position.x, it.obj.position.y, it.obj.position.z]; });
  const radius = box.getBoundingSphere(new T.Sphere()).radius;
  const blob = new T.Mesh(new T.PlaneGeometry(4.6, 2.4), new T.MeshBasicMaterial({ map: blobTexture(T), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.set(0, box.min.y - center.y - 0.35, 0.2); scene.add(blob);

  const camera = new T.PerspectiveCamera(28, 1, 0.1, 100);
  const fit = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const dist = radius / Math.sin(Math.min(vFov, hFov) / 2) * 0.98;
    const az = 0.32, el = 0.24;
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
  fit();
  new ResizeObserver(() => { fit(); if (!running) renderer.render(scene, camera); }).observe(host);

  // наклон за мышью / пальцем
  let tx = 0, ty = 0;
  window.addEventListener("pointermove", (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 0.7;
    ty = (e.clientY / window.innerHeight - 0.5) * 0.25;
  }, { passive: true });

  const clock = new T.Clock();
  let running = false, raf = 0, shown = false;
  function frame() {
    raf = 0;
    const t = clock.getElapsedTime();
    if (!reduced) {
      root.rotation.y += (tx + Math.sin(t * 0.25) * 0.14 - root.rotation.y) * 0.05;
      root.rotation.x += (ty - root.rotation.x) * 0.05;
      items.forEach((it, i) => {
        const k = i === 0 ? 0.45 : 1;
        it.obj.position.y = it.base[1] + Math.sin(t * it.sp + i * 1.7) * 0.13 * k;
        it.obj.rotation.y = it.rot[1] + Math.sin(t * 0.35 * it.sp + i) * 0.28 * k;
        it.obj.rotation.z = it.rot[2] + Math.sin(t * 0.3 * it.sp + i * 2) * 0.08 * k;
      });
      blob.material.opacity = 0.9 + Math.sin(t * items[0].sp) * 0.08;
    }
    renderer.render(scene, camera);
    if (!shown) { shown = true; host.classList.add("is-3d"); }
    if (running) raf = requestAnimationFrame(frame);
  }
  const play = () => { if (reduced) { frame(); return; } if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const pause = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
  let inView = true;
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; inView && !document.hidden ? play() : pause(); }).observe(host);
  document.addEventListener("visibilitychange", () => { !document.hidden && inView ? play() : pause(); });
  play();
}

if (host && window.SRTools && webglOK()) {
  import(THREE_URL).then(start).catch((e) => console.warn("3D отключено:", e && e.message));
}
})();
