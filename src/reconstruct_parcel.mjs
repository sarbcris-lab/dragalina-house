/**
 * Sursă adevăr: plan amplasament + CF.
 *
 * Orientare confirmată de beneficiar:
 *   DRAGALINA = DREAPTA (est) — latura lungă 1-2-3-4-5; C1 pe limită
 *   CLOȘCA    = JOS (sud)     — latura 10-1; curtea către Cloșca
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SEGMENTS = [
  { from: 1, to: 2, length: 0.418 },
  { from: 2, to: 3, length: 10.051 },
  { from: 3, to: 4, length: 0.278 },
  { from: 4, to: 5, length: 7.791 },
  { from: 5, to: 6, length: 0.226 },
  { from: 6, to: 7, length: 7.825 },
  { from: 7, to: 8, length: 0.23 },
  { from: 8, to: 9, length: 12.393 },
  { from: 9, to: 10, length: 5.335 },
  { from: 10, to: 1, length: 7.933 },
];
const L = SEGMENTS.map((s) => s.length);

// Laturi cumulate pe cele 4 fronturi vizuale din plan
const SIDE_DRAGALINA = 0.418 + 10.051 + 0.278 + 7.791; // 1→5 = 18.538 (DREAPTA)
const SIDE_NORD = 0.226 + 7.825; // 5→7 = 8.051
const SIDE_VEST = 0.23 + 12.393 + 5.335; // 7→10 = 17.958
const SIDE_CLOSCA = 7.933; // 10→1 (JOS)

function area(pts) {
  const p = pts.slice(0, -1);
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const j = (i + 1) % p.length;
    a += p[i].x * p[j].y - p[j].x * p[i].y;
  }
  return a / 2;
}

function bbox(pts) {
  const p = pts.slice(0, -1);
  const xs = p.map((q) => q.x);
  const ys = p.map((q) => q.y);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    depth: Math.max(...ys) - Math.min(...ys),
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function circleIntersect(p0, r0, p1, r1) {
  const d = dist(p0, p1);
  if (d > r0 + r1 || d < Math.abs(r0 - r1) || d === 0) return null;
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r0 * r0 - a * a));
  const xm = p0.x + (a * (p1.x - p0.x)) / d;
  const ym = p0.y + (a * (p1.y - p0.y)) / d;
  return [
    { x: xm + (h * (p1.y - p0.y)) / d, y: ym - (h * (p1.x - p0.x)) / d },
    { x: xm - (h * (p1.y - p0.y)) / d, y: ym + (h * (p1.x - p0.x)) / d },
  ];
}

/**
 * Patrulater cu laturi exacte.
 * Orientare țintă: Cloșca (10-1) pe y=0 orizontal; Dragalina (1-5) pe dreapta (+X).
 */
function buildQuad() {
  // Cloșca jos: 10 → 1 pe +X
  const C10 = { x: 0, y: 0 };
  const C1 = { x: SIDE_CLOSCA, y: 0 };

  let best = null;
  // unghiul Dragalina față de Cloșca (în sus / interior parcelă)
  for (let deg = 75; deg <= 105; deg += 0.05) {
    const th = (deg * Math.PI) / 180;
    const C5 = {
      x: C1.x + SIDE_DRAGALINA * Math.cos(th),
      y: C1.y + SIDE_DRAGALINA * Math.sin(th),
    };
    const hits = circleIntersect(C5, SIDE_NORD, C10, SIDE_VEST);
    if (!hits) continue;
    for (const C7 of hits) {
      if (C5.y < 2 || C7.y < 2) continue;
      // Dragalina pe dreapta: C5 și C1 ar trebui să aibă X mare
      const ring = [
        { id: 10, ...C10 },
        { id: 1, ...C1 },
        { id: 5, ...C5 },
        { id: 7, ...C7 },
        { id: 10, ...C10 },
      ];
      const A = Math.abs(area(ring));
      const bb = bbox(ring);
      // preferă C5 la dreapta față de C7 (Dragalina = est)
      if (C5.x < C7.x) continue;
      const aspect = bb.depth / Math.max(0.1, bb.width);
      const score = Math.abs(A - 147) + Math.abs(aspect - 2.1) * 2;
      if (!best || score < best.score) best = { C10, C1, C5, C7, A, bb, deg, score };
    }
  }
  if (!best) throw new Error("no quad");
  return best;
}

function placeOnEdge(start, end, lens, ids) {
  const len = dist(start, end);
  const ux = (end.x - start.x) / len;
  const uy = (end.y - start.y) / len;
  const pts = [{ id: ids[0], x: start.x, y: start.y }];
  let acc = 0;
  for (let i = 0; i < lens.length; i++) {
    acc += lens[i];
    pts.push({ id: ids[i + 1], x: start.x + ux * acc, y: start.y + uy * acc });
  }
  return pts;
}

function buildRing(q) {
  // sens CF: 1→2→3→4→5→6→7→8→9→10→1
  const right = placeOnEdge(q.C1, q.C5, [0.418, 10.051, 0.278, 7.791], [1, 2, 3, 4, 5]); // Dragalina
  const top = placeOnEdge(q.C5, q.C7, [0.226, 7.825], [5, 6, 7]);
  const left = placeOnEdge(q.C7, q.C10, [0.23, 12.393, 5.335], [7, 8, 9, 10]);
  const bot = placeOnEdge(q.C10, q.C1, [7.933], [10, 1]); // Cloșca

  const byId = {};
  for (const p of [...right, ...top, ...left, ...bot]) byId[p.id] = p;

  let ring = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => ({
    id,
    x: byId[id].x,
    y: byId[id].y,
  }));
  ring.push({ ...ring[0] });

  // Normalize: Cloșca pe y=0, Dragalina la +X (dreapta)
  let bb = bbox(ring);
  ring = ring.map((p) => ({ id: p.id, x: p.x - bb.minX, y: p.y - bb.minY }));

  // Cloșca (10-1) trebuie jos: y mic
  const yClosca = (ring.find((p) => p.id === 10).y + ring.find((p) => p.id === 1).y) / 2;
  const yNord = (ring.find((p) => p.id === 5).y + ring.find((p) => p.id === 7).y) / 2;
  if (yClosca > yNord) {
    const maxY = Math.max(...ring.map((p) => p.y));
    ring = ring.map((p) => ({ id: p.id, x: p.x, y: maxY - p.y }));
  }

  // Dragalina (1-5) la dreapta: x mare
  const xDrag = (ring.find((p) => p.id === 1).x + ring.find((p) => p.id === 5).x) / 2;
  const xVest = (ring.find((p) => p.id === 7).x + ring.find((p) => p.id === 10).x) / 2;
  if (xDrag < xVest) {
    const maxX = Math.max(...ring.map((p) => p.x));
    ring = ring.map((p) => ({ id: p.id, x: maxX - p.x, y: p.y }));
  }

  bb = bbox(ring);
  ring = ring.map((p) => ({
    id: p.id,
    x: +(p.x - bb.minX).toFixed(3),
    y: +(p.y - bb.minY).toFixed(3),
  }));
  // re-close
  ring[ring.length - 1] = { ...ring[0] };
  return ring;
}

/**
 * C1 pe Dragalina (dreapta, până la 3) + nord (5-7) + vest până la 9.
 * Trepte spre curte / Cloșca (jos): din 3 spre interior, coborând spre 9.
 */
function buildC1(ring) {
  const id = Object.fromEntries(ring.slice(0, -1).map((v) => [v.id, v]));
  const p3 = id[3];
  const p4 = id[4];
  const p5 = id[5];
  const p6 = id[6];
  const p7 = id[7];
  const p8 = id[8];
  const p9 = id[9];

  // vest = spre interior de pe Dragalina (de la 5 către 7)
  const west = {
    x: (p7.x - p5.x) / dist(p5, p7),
    y: (p7.y - p5.y) / dist(p5, p7),
  };
  // sud = spre Cloșca (de la 5 către 3 / în jos pe Dragalina invers… de la 3 mai departe în curte)
  // direcție din 3 către curte: către 9 / Cloșca
  const towardYard = {
    x: (p9.x - p3.x) / (dist(p3, p9) || 1),
    y: (p9.y - p3.y) / (dist(p3, p9) || 1),
  };
  // pe plan: trepte = orizontal (vest) + vertical (sud/curte)
  const south = {
    x: (id[1].x + id[10].x) / 2 - (p5.x + p7.x) / 2,
    y: (id[1].y + id[10].y) / 2 - (p5.y + p7.y) / 2,
  };
  const sLen = Math.hypot(south.x, south.y) || 1;
  const S = { x: south.x / sLen, y: south.y / sLen };

  let best = null;
  for (const sw of [1.4, 1.8, 2.2, 2.6, 3.0]) {
    for (const ss of [1.3, 1.7, 2.1, 2.5, 2.9]) {
      const D = { x: p3.x + west.x * sw, y: p3.y + west.y * sw };
      const C = { x: D.x + S.x * ss, y: D.y + S.y * ss };
      const B = { x: C.x + west.x * sw, y: C.y + west.y * sw };
      const c1 = [
        { id: "5", ...p5 },
        { id: "6", ...p6 },
        { id: "7", ...p7 },
        { id: "8", ...p8 },
        { id: "9", ...p9 },
        { id: "B", ...B },
        { id: "C", ...C },
        { id: "D", ...D },
        { id: "3", ...p3 },
        { id: "4", ...p4 },
        { id: "5", ...p5 },
      ];
      const a = Math.abs(area(c1));
      const err = Math.abs(a - 76);
      const towardClosca = B.y < p3.y; // treptele coboară spre Cloșca (jos)
      const score = err + (towardClosca ? 0 : 20) + Math.hypot(B.x - p9.x, B.y - p9.y) * 0.3;
      if (!best || score < best.score) best = { c1, a, score };
    }
  }

  // închidere pe 9: B → 9
  const c1 = best.c1;
  // asigură ordinea pe contur C1
  return {
    vertices_m: c1.map((p) => ({ id: p.id, x: +p.x.toFixed(3), y: +p.y.toFixed(3) })),
    area_m2: +best.a.toFixed(2),
    area_cf_m2: 76,
    note: "C1 pe Dragalina (dreapta) + N + V; trepte către Cloșca (jos).",
    status: "DIN_PLAN_AMPLASAMENT",
  };
}

function main() {
  const q = buildQuad();
  console.log("quad", q.A.toFixed(2), "deg", q.deg.toFixed(2));

  const ring = buildRing(q);
  const c1 = buildC1(ring);
  const bb = bbox(ring);

  const edges = [];
  for (let i = 0; i < 10; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    const drawn = dist(a, b);
    let role = null;
    if (i <= 3) role = "DRAGALINA"; // 1-2-3-4-5
    else if (i === 4 || i === 5) role = "NORD"; // 5-6-7
    else if (i >= 6 && i <= 8) role = "VEST"; // 7-8-9-10
    else if (i === 9) role = "CLOSCA"; // 10-1
    edges.push({
      from: a.id,
      to: b.id,
      length_cf_m: L[i],
      length_drawn_m: +drawn.toFixed(3),
      length_error_m: +Math.abs(drawn - L[i]).toFixed(4),
      role,
      a: { x: a.x, y: a.y },
      b: { x: b.x, y: b.y },
    });
  }

  const out = {
    meta: {
      source_plan: "inputs/cadastru/plan_amplasament_54602.png",
      source_cf: "inputs/cadastru/CF_54602_Turda_extras_2026-10-07.pdf",
      streets: {
        dragalina: "DREAPTA (est) — latura 1-2-3-4-5; C1 pe limită",
        closca: "JOS (sud) — latura 10-1; curte către Cloșca",
      },
      generated: new Date().toISOString(),
    },
    metrics: {
      area_m2: +Math.abs(area(ring)).toFixed(3),
      area_error_m2: +Math.abs(Math.abs(area(ring)) - 147).toFixed(3),
      close_error_m: 0,
      bbox_m: { width: +bb.width.toFixed(3), depth: +bb.depth.toFixed(3) },
      dragalina_edge: "1-2-3-4-5",
      dragalina_length_m: SIDE_DRAGALINA,
      closca_edge: "10-1",
      closca_length_m: SIDE_CLOSCA,
      max_edge_length_error_m: +Math.max(...edges.map((e) => e.length_error_m)).toFixed(4),
    },
    neighbors_from_plan: {
      51827: "NV",
      62808: "lângă Dragalina / E",
      66033: "lângă Cloșca / S",
    },
    vertices_m: ring,
    edges,
    existing_building_c1: c1,
  };

  fs.writeFileSync(path.join(ROOT, "data/site/parcel_polygon_cf.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(
    path.join(ROOT, "data/site/parcel.json"),
    JSON.stringify(
      {
        meta: { version: "1.0", status: "streets_dragalina_right_closca_bottom" },
        confirmed: {
          cf: "54602 Turda",
          area_from_acts_m2: 172,
          area_measured_m2: 147,
          existing_built_ground_m2: 76,
          perimeter_segments_m: SEGMENTS,
        },
        streets: out.meta.streets,
        metrics: out.metrics,
        neighbors_from_plan: out.neighbors_from_plan,
      },
      null,
      2
    )
  );

  console.log(JSON.stringify(out.metrics, null, 2));
  console.log("C1", c1.area_m2);
  console.log(ring.map((v) => `${v.id}:(${v.x},${v.y})`).join(" → "));
  console.log("STREETS: Dragalina=DREAPTA | Cloșca=JOS");
}

main();
