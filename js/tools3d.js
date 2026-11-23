// 3D-модели строительных инструментов из примитивов Three.js.
// Обычный скрипт (работает и с диска): window.SRTools.build(THREE, "helmet", M)
// THREE передаётся снаружи — модуль сам ничего не загружает.
(() => {
"use strict";

const PAL = {
  white: 0xf6f8fb, navy: 0x143b6b, navyDeep: 0x0f2f57, ice: 0x6fa8dc, iceLight: 0xbcd7ef,
  steel: 0xc9d2dc, steelDark: 0x7d8894, gold: 0xc8a24a, wood: 0xcdb48e, woodDark: 0xb39770,
  concrete: 0x9ea6af, rubber: 0x1f2a36, kraft: 0xc9aa80, glass: 0x15202e, paper: 0xf7f5ef,
};

function materials(T) {
  const std = (color, metalness, roughness, extra = {}) => new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  return {
    white: std(PAL.white, 0.0, 0.32),
    navy: std(PAL.navy, 0.1, 0.42),
    navyMatte: std(PAL.navyDeep, 0.05, 0.7),
    ice: std(PAL.ice, 0.1, 0.35),
    iceLight: std(PAL.iceLight, 0.05, 0.4),
    steel: std(0xdde3ea, 1.0, 0.2),
    steelBrushed: std(0xe4e9ef, 0.9, 0.34),
    steelDark: std(PAL.steelDark, 0.9, 0.38),
    gold: std(PAL.gold, 1.0, 0.3),
    wood: std(PAL.wood, 0.0, 0.62),
    woodDark: std(PAL.woodDark, 0.0, 0.66),
    concrete: std(PAL.concrete, 0.0, 0.92, { flatShading: true }),
    rubber: std(PAL.rubber, 0.0, 0.78),
    kraft: std(PAL.kraft, 0.0, 0.88),
    paper: std(PAL.paper, 0.0, 0.7),
    glass: std(PAL.glass, 0.4, 0.06),
    vial: new T.MeshStandardMaterial({ color: PAL.iceLight, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.72 }),
  };
}

/** Мягкое «студийное» окружение для отражений металла (без внешних файлов). */
function env(T, renderer) {
  const scene = new T.Scene();
  const room = new T.Mesh(new T.BoxGeometry(10, 10, 10), new T.MeshBasicMaterial({ color: 0xb4bfcc, side: T.BackSide }));
  scene.add(room);
  const panel = (w, h, pos, rot, color, k) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color, side: T.DoubleSide }));
    m.material.color.multiplyScalar(k); m.position.set(...pos); m.rotation.set(...rot); scene.add(m);
  };
  panel(6, 2.2, [0, 4.8, 0], [Math.PI / 2, 0, 0], 0xffffff, 4.2);
  panel(1.2, 5, [-2.5, 2, -4.8], [0, 0, 0], 0xffffff, 3.0);
  panel(2.2, 4, [-4.8, 1, 1], [0, Math.PI / 2, 0], 0xdfeaf7, 2.4);
  panel(2.2, 4, [4.8, 0.5, -1], [0, -Math.PI / 2, 0], 0xbcd7ef, 1.8);
  panel(4, 1.2, [0, 0.5, 4.8], [0, Math.PI, 0], 0xffffff, 1.6);
  panel(4, 1, [0, -4.8, 0], [-Math.PI / 2, 0, 0], 0x6f8094, 0.6);
  const pm = new T.PMREMGenerator(renderer);
  const tex = pm.fromScene(scene, 0.04).texture;
  pm.dispose();
  return tex;
}

/* ---------- помощники ---------- */
const mesh = (T, geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scale) => {
  const m = new T.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot);
  if (scale) m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};
function rrect(T, w, h, r) {
  const s = new T.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function extrude(T, shape, depth, bevel = 0.02, segs = 3) {
  const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  return g;
}
const rbox = (T, w, h, d, r = 0.03) => extrude(T, rrect(T, w, h, Math.min(r * 1.5, w / 2.2, h / 2.2)), Math.max(0.001, d - r * 2), r);
const tube = (T, pts, r, closed = false, segs = 64) =>
  new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p)), closed), segs, r, 12, closed);

/* ---------- модели ---------- */
function helmet(T, M, domeColor) {
  // Все части оболочки лежат в одной группе с общим растяжением —
  // поэтому рёбра и полоса точно повторяют купол и не «проваливаются» в него.
  const g = new T.Group();
  const SX = 1, SY = 0.9, SZ = 1.14;
  const shell = new T.Group(); shell.scale.set(SX, SY, SZ); g.add(shell);
  const shellMat = domeColor ? M.white.clone() : M.white;
  if (domeColor) shellMat.color.set(domeColor);
  const domeMat = shellMat.clone(); domeMat.side = T.DoubleSide;
  shell.add(mesh(T, new T.SphereGeometry(1, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2), domeMat));
  // рёбра: дуги по поверхности купола (центр трубки на поверхности), с закруглёнными концами
  const ridge = (x, r, yFront, yBack) => {
    const k = Math.sqrt(1 - x * x);
    const a0 = Math.asin(Math.min(0.98, yFront / k)), a1 = Math.PI - Math.asin(Math.min(0.98, yBack / k));
    const geo = new T.TorusGeometry(k, r, 16, 96, a1 - a0);
    const m = mesh(T, geo, shellMat);
    const holder = new T.Group(); holder.position.x = x; holder.rotation.y = -Math.PI / 2;
    m.rotation.z = a0; holder.add(m);
    for (const a of [a0, a1]) holder.add(mesh(T, new T.SphereGeometry(r, 16, 12), shellMat, [Math.cos(a) * k, Math.sin(a) * k, 0]));
    shell.add(holder);
  };
  ridge(0, 0.075, 0.62, 0.24);
  ridge(-0.36, 0.045, 0.26, 0.24);
  ridge(0.36, 0.045, 0.26, 0.24);
  // синяя полоса чуть снаружи купола, ниже начала рёбер
  shell.add(mesh(T, new T.CylinderGeometry(0.994, 1.008, 0.17, 96, 1, true), M.navy, [0, 0.1, 0]));
  // козырёк: кольцо с выносом вперёд, вырез под купол (без перекрытия поверхностей)
  const outer = new T.Shape(), hole = new T.Path(), N = 96;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2, front = Math.max(0, Math.sin(t));
    const x = 1.13 * Math.cos(t), z = (1.24 + 0.3 * front * front * front) * Math.sin(t);
    i ? outer.lineTo(x, z) : outer.moveTo(x, z);
    const hx = 0.975 * Math.cos(t), hz = 1.11 * Math.sin(t);
    i ? hole.lineTo(hx, hz) : hole.moveTo(hx, hz);
  }
  outer.holes.push(hole);
  const brimGeo = new T.ExtrudeGeometry(outer, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 8 });
  const brim = mesh(T, brimGeo, shellMat, [0, 0.01, 0], [Math.PI / 2, 0, 0]);
  g.add(brim);
  // золотая эмблема спереди: на поверхности, по нормали, между рёбрами
  const phi = 0.36, ux = 0, uy = Math.sin(phi), uz = Math.cos(phi);
  const pos = new T.Vector3(ux * SX, uy * SY, uz * SZ);
  const nrm = new T.Vector3(ux / SX, uy / SY, uz / SZ).normalize();
  const e = mesh(T, new T.CylinderGeometry(0.11, 0.11, 0.026, 40), M.gold);
  e.position.copy(pos).addScaledVector(nrm, 0.022);
  e.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), nrm);
  g.add(e);
  return g;
}

function wrench(T, M) {
  const g = new T.Group();
  // открытый зев
  const hw = 0.17, R = 0.5, a0 = Math.asin(0.26 / R);
  const jaw = new T.Shape();
  jaw.moveTo(R * Math.cos(a0), 0.26);
  jaw.absarc(0, 0, R, a0, Math.PI * 2 - a0, false);
  jaw.lineTo(R * Math.cos(a0), -hw); jaw.lineTo(0.02, -hw); jaw.lineTo(0.02, hw); jaw.lineTo(R * Math.cos(a0), hw);
  jaw.lineTo(R * Math.cos(a0), 0.26);
  const j = mesh(T, extrude(T, jaw, 0.11, 0.025), M.steel, [1.42, 0, 0], [0, 0, 0.26]);
  g.add(j);
  // кольцо с шестигранником
  const ring = new T.Shape(); ring.absarc(0, 0, 0.42, 0, Math.PI * 2, false);
  const hole = new T.Path();
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; const p = [Math.cos(a) * 0.21, Math.sin(a) * 0.21]; i ? hole.lineTo(...p) : hole.moveTo(...p); }
  ring.holes.push(hole);
  g.add(mesh(T, extrude(T, ring, 0.13, 0.025), M.steel, [-1.42, 0, 0]));
  // рукоять
  const h = new T.Shape();
  h.moveTo(-1.2, -0.13); h.lineTo(1.15, -0.15); h.lineTo(1.15, 0.15); h.lineTo(-1.2, 0.13); h.lineTo(-1.2, -0.13);
  g.add(mesh(T, extrude(T, h, 0.08, 0.025), M.steel));
  // гравировка-полоса
  g.add(mesh(T, rbox(T, 1.3, 0.07, 0.02, 0.008), M.navy, [0, 0, 0.075]));
  return g;
}

function hammer(T, M) {
  const g = new T.Group();
  g.add(mesh(T, rbox(T, 1.0, 0.34, 0.34, 0.05), M.steel, [0, 0, 0]));
  g.add(mesh(T, new T.CylinderGeometry(0.2, 0.19, 0.32, 40), M.steel, [0.62, 0, 0], [0, 0, Math.PI / 2]));
  g.add(mesh(T, new T.CylinderGeometry(0.21, 0.21, 0.05, 40), M.steelBrushed, [0.8, 0, 0], [0, 0, Math.PI / 2]));
  // гвоздодёр — два изогнутых зубца
  const claw = new T.Shape();
  claw.moveTo(0, 0.15); claw.quadraticCurveTo(-0.45, 0.12, -0.7, -0.3); claw.lineTo(-0.62, -0.33);
  claw.quadraticCurveTo(-0.42, 0.0, 0, -0.1); claw.lineTo(0, 0.15);
  for (const z of [-0.085, 0.085]) g.add(mesh(T, extrude(T, claw, 0.1, 0.02), M.steel, [-0.45, 0, z]));
  // рукоять
  g.add(mesh(T, new T.CylinderGeometry(0.1, 0.12, 1.9, 32), M.navy, [0, -1.05, 0]));
  for (let i = 0; i < 5; i++) g.add(mesh(T, new T.TorusGeometry(0.122, 0.018, 8, 32), M.navyMatte, [0, -1.35 - i * 0.12, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(T, new T.CylinderGeometry(0.13, 0.13, 0.06, 32), M.gold, [0, -2.0, 0]));
  return g;
}

function trowel(T, M) {
  const g = new T.Group();
  const s = new T.Shape();
  s.moveTo(0, 1.1); s.quadraticCurveTo(0.64, 0.25, 0.56, -0.32); s.quadraticCurveTo(0, -0.56, -0.56, -0.32);
  s.quadraticCurveTo(-0.64, 0.25, 0, 1.1);
  g.add(mesh(T, extrude(T, s, 0.02, 0.012, 2), M.steel, [0, 0, 0], [-Math.PI / 2, 0, 0]));
  const shank = tube(T, [[0, 0.03, 0.25], [0, 0.12, 0.32], [0, 0.38, 0.42], [0, 0.46, 0.62]], 0.035);
  g.add(mesh(T, shank, M.steelDark));
  const handle = mesh(T, new T.CapsuleGeometry(0.11, 0.62, 8, 20), M.navy, [0, 0.5, 1.0], [Math.PI / 2 - 0.12, 0, 0]);
  g.add(handle);
  g.add(mesh(T, new T.TorusGeometry(0.1, 0.03, 10, 30), M.gold, [0, 0.47, 0.66], [-0.12, 0, 0]));
  return g;
}

function level(T, M) {
  const g = new T.Group();
  g.add(mesh(T, rbox(T, 3.0, 0.34, 0.2, 0.025), M.steelBrushed));
  for (const x of [-1.56, 1.56]) g.add(mesh(T, rbox(T, 0.14, 0.38, 0.24, 0.03), M.navy, [x, 0, 0]));
  // окошки с колбами
  for (const [x, vertical] of [[0, false], [-1.0, true]]) {
    g.add(mesh(T, rbox(T, 0.5, 0.24, 0.05, 0.015), M.navyMatte, [x, 0, 0.1]));
    const v = mesh(T, new T.CapsuleGeometry(0.055, 0.28, 6, 16), M.vial, [x, 0, 0.13], [0, 0, vertical ? 0 : Math.PI / 2]);
    v.castShadow = false; g.add(v);
    g.add(mesh(T, new T.SphereGeometry(0.035, 16, 12), M.white, [x + (vertical ? 0 : 0.02), vertical ? 0.03 : 0, 0.165]));
    for (const d of [-0.08, 0.08]) g.add(mesh(T, new T.BoxGeometry(vertical ? 0.1 : 0.012, vertical ? 0.012 : 0.1, 0.01), M.gold, [x + (vertical ? 0 : d), vertical ? d : 0, 0.185]));
  }
  // шкала
  for (let i = 0; i < 14; i++) g.add(mesh(T, new T.BoxGeometry(0.012, i % 2 ? 0.05 : 0.09, 0.008), M.navy, [0.45 + i * 0.065, 0.11, 0.104]));
  return g;
}

function bucket(T, M) {
  const g = new T.Group();
  const prof = [[0, 0], [0.6, 0], [0.8, 1.05], [0.86, 1.1], [0.86, 1.16], [0.81, 1.16], [0.76, 1.08], [0.56, 0.06], [0, 0.06]]
    .map(([x, y]) => new T.Vector2(x, y));
  const shell = mesh(T, new T.LatheGeometry(prof, 64), M.navy);
  shell.material = M.navy; g.add(shell);
  for (const y of [0.35, 0.7]) g.add(mesh(T, new T.TorusGeometry(0.66 + y * 0.19, 0.012, 8, 64), M.navyMatte, [0, y, 0], [Math.PI / 2, 0, 0]));
  // раствор с неровной поверхностью
  const top = new T.CircleGeometry(0.76, 48, 0, Math.PI * 2);
  const pos = top.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), r = Math.hypot(x, y);
    pos.setZ(i, r < 0.7 ? (Math.sin(x * 9) * Math.cos(y * 7) * 0.03 + Math.sin((x + y) * 13) * 0.012) : 0);
  }
  top.computeVertexNormals();
  g.add(mesh(T, top, M.concrete, [0, 0.98, 0], [-Math.PI / 2, 0, 0]));
  // ручка
  g.add(mesh(T, new T.TorusGeometry(0.87, 0.022, 10, 64, Math.PI), M.steel, [0, 1.13, 0], [0, 0, 0]));
  for (const x of [-0.87, 0.87]) g.add(mesh(T, new T.CylinderGeometry(0.05, 0.05, 0.08, 16), M.navyMatte, [x, 1.1, 0], [0, 0, Math.PI / 2]));
  // мастерок в растворе
  const t = trowel(T, M); t.scale.setScalar(0.72); t.position.set(0.22, 1.25, 0.05); t.rotation.set(-1.0, 0.5, 0.35);
  g.add(t);
  return g;
}

function carabiner(T, M) {
  const g = new T.Group();
  const pts = [[-0.22, -0.45, 0], [0.18, -0.48, 0], [0.3, -0.25, 0], [0.32, 0.25, 0], [0.12, 0.5, 0], [-0.16, 0.5, 0], [-0.28, 0.25, 0], [-0.3, -0.25, 0]];
  g.add(mesh(T, tube(T, pts, 0.045, true, 96), M.steel));
  g.add(mesh(T, new T.CylinderGeometry(0.06, 0.06, 0.22, 20), M.gold, [0.31, 0.02, 0]));
  return g;
}

function sling(T, M) {
  // Каска, рядом плоская бухта страховочного стропа (витки с зазором) и отдельно лежащий карабин.
  // Все предметы стоят на одном уровне пола (низ козырька ≈ -0.037) и не пересекаются.
  const g = new T.Group();
  g.add(helmet(T, M));
  const FLOOR = -0.037, r = 0.06, R0 = 0.3, turns = 2.25, pitch = 2.25 * r, pts = [];
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * turns * Math.PI * 2;
    const R = R0 + (a / (Math.PI * 2)) * pitch;
    pts.push([Math.cos(a) * R, r, Math.sin(a) * R]);
  }
  const coil = mesh(T, tube(T, pts, r, false, 320), M.ice, [1.85, FLOOR, 0.5], [0, 0.6, 0]);
  for (const p of [pts[0], pts[pts.length - 1]]) coil.add(mesh(T, new T.SphereGeometry(r, 14, 10), M.ice, p));
  g.add(coil);
  const c = carabiner(T, M);
  c.rotation.set(-Math.PI / 2, 0, 0.9);
  c.position.set(0.35, FLOOR + 0.06, 1.86);
  g.add(c);
  return g;
}

function rebar(T, M) {
  const g = new T.Group();
  const bars = [[0, 0], [0.14, 0.02], [-0.14, 0.02], [0.07, 0.14], [-0.07, 0.14]];
  for (const [y, z] of bars) {
    const b = new T.Group();
    b.add(mesh(T, new T.CylinderGeometry(0.055, 0.055, 3.0, 16), M.steelDark, [0, 0, 0], [0, 0, Math.PI / 2]));
    for (let i = 0; i < 22; i++) b.add(mesh(T, new T.TorusGeometry(0.056, 0.011, 6, 18), M.steelDark, [-1.4 + i * 0.133, 0, 0], [0, Math.PI / 2, 0.35]));
    b.position.set(0, y + 0.06, z); g.add(b);
  }
  for (const x of [-0.8, 0.8]) g.add(mesh(T, new T.TorusGeometry(0.2, 0.015, 8, 40), M.steel, [x, 0.13, 0.08], [0, Math.PI / 2, 0]));
  // крючок для вязки
  const hk = new T.Group();
  const spiral = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; spiral.push([Math.cos(t * 18) * 0.03, t * 0.9, Math.sin(t * 18) * 0.03]); }
  spiral.push([0, 1.0, 0], [0.08, 1.12, 0], [0.16, 1.08, 0], [0.18, 0.98, 0]);
  hk.add(mesh(T, tube(T, spiral, 0.022, false, 200), M.steel));
  hk.add(mesh(T, new T.CapsuleGeometry(0.1, 0.45, 8, 20), M.navy, [0, -0.3, 0]));
  hk.add(mesh(T, new T.TorusGeometry(0.085, 0.022, 8, 24), M.gold, [0, -0.02, 0], [Math.PI / 2, 0, 0]));
  hk.position.set(0.3, 0.45, 0.7); hk.rotation.set(0.2, 0, -1.15);
  g.add(hk);
  return g;
}

function carpentry(T, M) {
  const g = new T.Group();
  g.add(mesh(T, rbox(T, 2.6, 0.36, 0.36, 0.02), M.wood, [0, 0, 0]));
  for (let i = 0; i < 6; i++) g.add(mesh(T, new T.BoxGeometry(2.5, 0.004, 0.005), M.woodDark, [0, -0.12 + i * 0.05, 0.181]));
  // угольник
  const sq = new T.Shape();
  sq.moveTo(0, 0); sq.lineTo(1.4, 0); sq.lineTo(1.4, 0.16); sq.lineTo(0.16, 0.16); sq.lineTo(0.16, 0.95); sq.lineTo(0, 0.95); sq.lineTo(0, 0);
  const s = new T.Group();
  s.add(mesh(T, extrude(T, sq, 0.025, 0.006, 2), M.steelBrushed));
  for (let i = 1; i < 13; i++) s.add(mesh(T, new T.BoxGeometry(0.008, i % 2 ? 0.05 : 0.08, 0.004), M.navy, [0.16 + i * 0.095, 0.16 - (i % 2 ? 0.025 : 0.04), 0.02]));
  s.position.set(-0.9, 0.2, 0.3); s.rotation.set(-1.25, 0, 0.25);
  g.add(s);
  const h = hammer(T, M); h.scale.setScalar(0.62); h.position.set(0.35, 0.32, 0.35); h.rotation.set(Math.PI / 2 - 0.15, 0, -0.9);
  g.add(h);
  return g;
}

function welding(T, M) {
  const g = new T.Group();
  const shell = mesh(T, new T.SphereGeometry(1, 48, 32, Math.PI / 2 - 1.15, 2.3, 0.15, 2.5), M.navy, [0, 0, 0], [0, 0, 0], [0.82, 1.08, 0.78]);
  shell.material = M.navy.clone(); shell.material.side = T.DoubleSide; g.add(shell);
  g.add(mesh(T, rbox(T, 0.62, 0.34, 0.06, 0.03), M.steelDark, [0, 0.12, 0.79]));
  g.add(mesh(T, rbox(T, 0.52, 0.25, 0.04, 0.02), M.glass, [0, 0.12, 0.83]));
  g.add(mesh(T, new T.TorusGeometry(0.86, 0.035, 10, 60, Math.PI), M.rubber, [0, 0.2, -0.05], [Math.PI / 2, 0, Math.PI]));
  for (const x of [-0.84, 0.84]) g.add(mesh(T, new T.CylinderGeometry(0.09, 0.09, 0.06, 24), M.gold, [x, 0.2, 0], [0, 0, Math.PI / 2]));
  // электрод
  const el = new T.Group();
  el.add(mesh(T, new T.CylinderGeometry(0.035, 0.035, 1.4, 16), M.concrete, [0, 0, 0]));
  el.add(mesh(T, new T.CylinderGeometry(0.03, 0.03, 0.3, 16), M.steel, [0, 0.85, 0]));
  el.position.set(0.95, -0.55, 0.55); el.rotation.set(0.2, 0, -1.1);
  g.add(el);
  return g;
}

function electric(T, M) {
  const g = new T.Group();
  // моток кабеля
  const coil = [];
  for (let i = 0; i <= 480; i++) { const t = i / 480 * Math.PI * 2 * 5; coil.push([Math.cos(t) * (0.62 + Math.sin(t * 0.21) * 0.02), (i / 480) * 0.42, Math.sin(t) * 0.62]); }
  g.add(mesh(T, tube(T, coil, 0.055, false, 900), M.navy, [-0.35, 0, 0]));
  g.add(mesh(T, tube(T, [[0.27, 0.42, 0], [0.6, 0.45, 0.2], [0.9, 0.2, 0.55], [1.25, 0.06, 0.7]], 0.055, false, 60), M.navy, [-0.35, 0, 0]));
  g.add(mesh(T, new T.CylinderGeometry(0.075, 0.075, 0.14, 20), M.iceLight, [0.92, 0.06, 0.72], [0, 0, Math.PI / 2 - 0.4]));
  // плоскогубцы
  const p = new T.Group();
  const jaw = new T.Shape();
  jaw.moveTo(0, -0.06); jaw.lineTo(0.55, -0.03); jaw.quadraticCurveTo(0.62, 0, 0.55, 0.03); jaw.lineTo(0, 0.08); jaw.lineTo(0, -0.06);
  for (const s of [1, -1]) {
    const half = new T.Group();
    half.add(mesh(T, extrude(T, jaw, 0.06, 0.012), M.steel, [0, 0, 0]));
    half.add(mesh(T, tube(T, [[0, 0, 0], [-0.4, -0.06, 0], [-0.9, -0.16, 0], [-1.25, -0.22, 0]], 0.06, false, 40), s > 0 ? M.navy : M.ice, [0, 0, 0]));
    half.rotation.z = s * 0.2; half.position.z = s * 0.035;
    p.add(half);
  }
  p.add(mesh(T, new T.CylinderGeometry(0.075, 0.075, 0.16, 24), M.gold, [0, 0, 0], [Math.PI / 2, 0, 0]));
  p.scale.setScalar(1.15); p.position.set(0.45, 0.75, 0.75); p.rotation.set(-0.35, -0.35, 0.55);
  g.add(p);
  return g;
}

function shovel(T, M) {
  const g = new T.Group();
  const s = new T.Shape();
  s.moveTo(-0.45, 0.5); s.lineTo(0.45, 0.5); s.lineTo(0.45, -0.25); s.quadraticCurveTo(0.36, -0.7, 0, -0.92); s.quadraticCurveTo(-0.36, -0.7, -0.45, -0.25); s.lineTo(-0.45, 0.5);
  g.add(mesh(T, extrude(T, s, 0.025, 0.012, 2), M.steel, [0, 0, 0]));
  g.add(mesh(T, new T.CylinderGeometry(0.09, 0.15, 0.45, 24), M.steelDark, [0, 0.7, 0]));
  g.add(mesh(T, new T.CylinderGeometry(0.075, 0.075, 2.0, 24), M.wood, [0, 1.85, 0]));
  g.add(mesh(T, new T.TorusGeometry(0.2, 0.04, 10, 32, Math.PI), M.navy, [0, 2.88, 0]));
  g.add(mesh(T, new T.CylinderGeometry(0.05, 0.05, 0.42, 16), M.navy, [0, 3.08, 0], [0, 0, Math.PI / 2]));
  g.add(mesh(T, new T.CylinderGeometry(0.085, 0.085, 0.06, 20), M.gold, [0, 2.84, 0]));
  return g;
}

function wheelbarrow(T, M) {
  const g = new T.Group();
  // кузов: дно меньше верха
  const top = [[-0.75, 0.9, -0.55], [0.85, 0.9, -0.55], [0.85, 0.9, 0.55], [-0.75, 0.9, 0.55]];
  const bot = [[-0.45, 0.3, -0.35], [0.35, 0.3, -0.35], [0.35, 0.3, 0.35], [-0.45, 0.3, 0.35]];
  const v = [], idx = [];
  const P = [...top, ...bot];
  P.forEach((p) => v.push(...p));
  const quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);
  quad(0, 1, 5, 4); quad(1, 2, 6, 5); quad(2, 3, 7, 6); quad(3, 0, 4, 7); quad(4, 5, 6, 7);
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(v, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const tubMat = M.navy.clone(); tubMat.side = T.DoubleSide; tubMat.flatShading = true;
  g.add(mesh(T, geo, tubMat));
  g.add(mesh(T, tube(T, top.concat([top[0]]).map((p) => [p[0], p[1] + 0.01, p[2]]), 0.03, false, 120), M.steel));
  // колесо
  g.add(mesh(T, new T.TorusGeometry(0.3, 0.1, 16, 40), M.rubber, [1.05, 0.38, 0]));
  g.add(mesh(T, new T.CylinderGeometry(0.13, 0.13, 0.16, 24), M.steel, [1.05, 0.38, 0], [Math.PI / 2, 0, 0]));
  // рама и ручки
  for (const z of [-0.42, 0.42]) {
    g.add(mesh(T, tube(T, [[1.05, 0.38, z * 0.4], [0.6, 0.32, z], [-0.6, 0.38, z], [-1.5, 0.62, z * 1.1]], 0.035, false, 60), M.steel));
    g.add(mesh(T, new T.CapsuleGeometry(0.05, 0.28, 6, 16), M.rubber, [-1.62, 0.66, z * 1.1], [0, 0, Math.PI / 2 - 0.27]));
    g.add(mesh(T, new T.CylinderGeometry(0.03, 0.03, 0.4, 12), M.steel, [-0.5, 0.15, z]));
  }
  return g;
}

function pallet(T, M) {
  const g = new T.Group();
  for (let i = 0; i < 5; i++) g.add(mesh(T, new T.BoxGeometry(0.34, 0.06, 1.6), M.wood, [-0.8 + i * 0.4, 0.27, 0]));
  for (const z of [-0.7, 0, 0.7]) g.add(mesh(T, new T.BoxGeometry(1.95, 0.18, 0.14), M.woodDark, [0, 0.15, z]));
  for (const x of [-0.8, 0, 0.8]) g.add(mesh(T, new T.BoxGeometry(0.3, 0.05, 1.6), M.wood, [x, 0.03, 0]));
  const box = (w, h, d, pos, rotY = 0) => {
    const b = new T.Group();
    b.add(mesh(T, rbox(T, w, h, d, 0.015), M.kraft));
    b.add(mesh(T, new T.BoxGeometry(0.16, 0.004, d + 0.004), M.navy, [0, h / 2 + 0.002, 0]));
    b.add(mesh(T, new T.BoxGeometry(w * 0.34, h * 0.24, 0.004), M.paper, [-w * 0.18, -h * 0.1, d / 2 + 0.003]));
    b.position.set(...pos); b.rotation.y = rotY; g.add(b);
  };
  box(0.85, 0.6, 0.7, [-0.45, 0.6, -0.32]);
  box(0.85, 0.6, 0.7, [0.45, 0.6, -0.3], 0.03);
  box(0.8, 0.55, 0.7, [-0.42, 0.6, 0.42], -0.02);
  box(0.75, 0.5, 0.62, [0.0, 1.16, -0.1], 0.12);
  return g;
}

function training(T, M) {
  const g = new T.Group();
  const book = (y, cover, rotY, w = 1.5) => {
    const b = new T.Group();
    b.add(mesh(T, rbox(T, w, 0.22, 1.05, 0.02), cover));
    b.add(mesh(T, new T.BoxGeometry(w - 0.06, 0.17, 1.0), M.paper, [0.03, 0, 0.02]));
    b.add(mesh(T, new T.BoxGeometry(0.02, 0.18, 0.5), M.gold, [-w / 2 - 0.005, 0, 0]));
    b.position.y = y; b.rotation.y = rotY; g.add(b);
  };
  book(0.11, M.navy, 0.08);
  book(0.34, M.ice, -0.1, 1.35);
  const h = helmet(T, M); h.scale.setScalar(0.55); h.position.set(-0.05, 0.47, -0.02); h.rotation.y = 0.5; g.add(h);
  // диплом
  const d = new T.Group();
  d.add(mesh(T, new T.CylinderGeometry(0.11, 0.11, 1.1, 32), M.paper, [0, 0, 0], [0, 0, Math.PI / 2]));
  d.add(mesh(T, new T.TorusGeometry(0.115, 0.022, 10, 30), M.gold, [0.08, 0, 0], [0, Math.PI / 2, 0]));
  d.position.set(0.25, 0.12, 0.85); d.rotation.y = -0.35; g.add(d);
  return g;
}

/** Композиция для первого экрана: каска и инструменты вокруг. */
function heroSet(T, M) {
  const items = [];
  const add = (obj, pos, rot, sc, sp) => { obj.position.set(...pos); obj.rotation.set(...rot); obj.scale.setScalar(sc); items.push({ obj, base: pos.slice(), rot: rot.slice(), sp }); };
  add(helmet(T, M), [0, 0.15, 0], [0.18, -0.55, 0.05], 1.25, 0.9);
  add(wrench(T, M), [-1.95, 1.25, -0.4], [0.5, 0.3, 0.6], 0.62, 1.15);
  add(hammer(T, M), [2.05, 1.15, -0.2], [0.2, -0.6, -0.55], 0.62, 1.3);
  add(trowel(T, M), [-1.7, -1.05, 0.8], [0.5, 0.7, 0.2], 0.85, 1.05);
  add(level(T, M), [1.55, -1.15, 0.6], [0.15, -0.5, 0.25], 0.62, 0.95);
  return items;
}

const BUILD = { helmet, wrench, hammer, trowel, level, bucket, sling, rebar, carpentry, welding, electric, shovel, wheelbarrow, pallet, training, carabiner };

window.SRTools = {
  PAL, materials, env, heroSet,
  build(T, name, M) { const f = BUILD[name]; if (!f) throw new Error("нет модели " + name); return f(T, M || materials(T)); },
  get names() { return Object.keys(BUILD); },
  // для дополнительных модулей (workers3d.js — 3D-рабочие, только для рендера картинок)
  register(name, fn) { BUILD[name] = fn; },
  helpers: { mesh, rrect, extrude, rbox, tube, helmet, wrench, hammer, trowel, level, bucket, carabiner, shovel, wheelbarrow, pallet },
};
})();
