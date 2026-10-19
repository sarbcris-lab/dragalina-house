/**
 * Runda 1 — audit overflow fundații/puț + clear acces beci.
 * node src/audit_a1_r1_parcel_basement_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

const a1 = read("data/building/a1_architecture.json");
const polygon = read("data/site/parcel_polygon_cf.json");
const st = a1.structure_a1_study_cm;
const bm = a1.basement_cm;
const ew = a1.envelope_cm?.ew ?? 680;
const ns = a1.envelope_cm?.ns ?? 860;

// Same placement heuristic as build_v47_3d (simplified copy)
const byId = Object.fromEntries(
  polygon.vertices_m.filter((v, i, a) => i < a.length - 1).map((v) => [v.id, v])
);
const dragChain = [5, 4, 3, 2, 1].map((id) => byId[id]);
const P5 = byId[5];
function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function pointAlong(chain, s) {
  let rem = s;
  for (let i = 0; i < chain.length - 1; i++) {
    const len = dist(chain[i], chain[i + 1]);
    if (rem <= len) return lerp(chain[i], chain[i + 1], rem / len);
    rem -= len;
  }
  return { ...chain[chain.length - 1] };
}
const t0 = { x: dragChain[1].x - dragChain[0].x, y: dragChain[1].y - dragChain[0].y };
const tLen = Math.hypot(t0.x, t0.y) || 1;
const Tx = t0.x / tLen;
const Ty = t0.y / tLen;
let Ix = -Ty;
let Iy = Tx;
if (P5.x + Ix * 2 > P5.x) {
  Ix = -Ix;
  Iy = -Iy;
}
const ewM = ew / 100;
const nsM = ns / 100;
function cornerAt(along0) {
  const to = (lx, ly) => {
    const on = pointAlong(dragChain, along0 + ly);
    const depth = ewM - lx;
    return { x: on.x + Ix * depth, y: on.y + Iy * depth };
  };
  return { NW: to(0, 0), NE: to(ewM, 0), SE: to(ewM, nsM), SW: to(0, nsM), to };
}
let along0 = 0;
for (let a = 0; a <= 1.2; a += 0.05) {
  const c = cornerAt(a);
  if ([c.NW, c.NE, c.SE, c.SW].every((pt) => insideParcel(pt))) {
    along0 = a;
    break;
  }
  along0 = a;
}
along0 = Math.min(along0 + 0.05, 1.0);
const toSiteXY = cornerAt(along0).to;
function toSite(lcmX, lcmY) {
  return toSiteXY(lcmX / 100, lcmY / 100);
}
function insideParcel(pt) {
  const pts = polygon.vertices_m.slice(0, -1);
  let odd = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const yi = pts[i].y,
      yj = pts[j].y,
      xi = pts[i].x,
      xj = pts[j].x;
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi) odd = !odd;
  }
  return odd;
}
function distPointToSegment(p, a, b) {
  const abx = b.x - a.x,
    aby = b.y - a.y;
  const len2 = abx * abx + aby * aby || 1e-12;
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
}
function overflowDistanceM(pt) {
  if (insideParcel(pt)) return 0;
  const pts = polygon.vertices_m.slice(0, -1);
  let dMin = Infinity;
  for (let i = 0; i < pts.length; i++) {
    dMin = Math.min(dMin, distPointToSegment(pt, pts[i], pts[(i + 1) % pts.length]));
  }
  return dMin;
}

function rectCorners(x, y, dx, dy) {
  return [
    [x, y],
    [x + dx, y],
    [x + dx, y + dy],
    [x, y + dy],
  ];
}
function auditRect(id, x, y, dx, dy) {
  const corners = rectCorners(x, y, dx, dy).map(([lx, ly]) => {
    const site = toSite(lx, ly);
    const ov = overflowDistanceM(site);
    return { lx: round(lx), ly: round(ly), inside: insideParcel(site), overflow_cm: round(ov * 100) };
  });
  const bad = corners.filter((c) => !c.inside && c.overflow_cm >= 2);
  return {
    id,
    x: round(x),
    y: round(y),
    dx: round(dx),
    dy: round(dy),
    max_overflow_cm: bad.length ? Math.max(...bad.map((c) => c.overflow_cm)) : 0,
    overflow_corners: bad,
    pass: bad.length === 0,
  };
}

const fg = st.foundations_study_cm || {};
const padBy = st.foundation_pad_adopt_cm || fg.pad_by_column_cm || {};
const padDef = fg.pad_side_cm ?? 80;
const strip = fg.perimeter_strip_width_cm ?? 115;
const northIn = fg.north_eccentric_inward === true;
const eastIn = fg.east_eccentric_inward !== false;

function padRect(c) {
  const padSide = padBy[c.id] ?? padDef;
  const cx = c.x + c.dx / 2;
  const cy = c.y + c.dy / 2;
  const eastish = /C_E_|C_NE|C_S_INTRARE_E|C_CASA_SCARA|C_SHAFT/.test(c.id);
  const northish = /C_N|C_NW|C_NE/.test(c.id) && !/C_S_/.test(c.id);
  let px, py;
  if (eastIn && eastish) px = c.x + c.dx - padSide;
  else px = cx - padSide / 2;
  if (northIn && northish) py = c.y; // flush N → south (interior)
  else if (/C_S_INTRARE|C_S_DORM/.test(c.id) && fg.south_eccentric_inward)
    py = c.y + c.dy - padSide; // flush S → north
  else py = cy - padSide / 2;
  return { x: px, y: py, dx: padSide, dy: padSide };
}

function perimFooting(w) {
  const id = w.id || "";
  let outward;
  if (/reten_n|_n$|put_reten_n/i.test(id)) outward = "north";
  else if (/reten_s|_s$|put_reten_s/i.test(id)) outward = "south";
  else if (/reten_e|_e$|put_reten_e/i.test(id)) outward = "east";
  else if (/reten_w|_w$|put_reten_w/i.test(id)) outward = "west";
  else if (w.dx >= w.dy) outward = w.y < 400 ? "north" : "south";
  else outward = w.x > 400 ? "east" : "west";
  if (outward === "east") return { x: w.x + w.dx - strip, y: w.y, dx: strip, dy: w.dy, outward };
  if (outward === "west") return { x: w.x, y: w.y, dx: strip, dy: w.dy, outward };
  if (outward === "north") return { x: w.x, y: w.y, dx: w.dx, dy: strip, outward };
  return { x: w.x, y: w.y + w.dy - strip, dx: w.dx, dy: strip, outward };
}

const padAudits = (st.columns || [])
  .filter((c) => (c.levels || []).includes("S"))
  .map((c) => {
    const r = padRect(c);
    return auditRect(`pad_${c.id}`, r.x, r.y, r.dx, r.dy);
  });

const wallList = [...(bm.walls || []), ...(bm.stair?.pit?.walls || [])];
const wallAudits = wallList
  .filter((w) => w.role === "retaining" || w.role === "stair_pit")
  .map((w) => auditRect(`wall_${w.id}`, w.x, w.y, w.dx, w.dy));
const footAudits = wallList
  .filter((w) => w.role === "retaining" || w.role === "stair_pit")
  .map((w) => {
    const f = perimFooting(w);
    return { ...auditRect(`foot_${w.id}`, f.x, f.y, f.dx, f.dy), outward: f.outward };
  });

const pier = (st.columns || []).find((c) => c.id === "C_SHAFT_E_PIER");
const shaftWest = bm.stair?.open_shaft?.x ?? 564.3;
const shaftClearNeed = bm.stair?.fit?.stair_clear_need ?? 100;
const pierClear =
  pier != null ? round(pier.x - shaftWest) : null; // clear west of pier in shaft

const lv = st.levels_cm || {};
const clearSlab = round((lv.basement_soffit_cm ?? -30) - (lv.basement_ff_cm ?? -250));
const beamH = lv.basement_beam_h_cm ?? 40;
const slabTh = lv.slab_th_hypothesis ?? 15;
const beamDrop = Math.max(0, beamH - slabTh);
const beamSoffit = (lv.basement_soffit_cm ?? -30) - beamDrop;
const clearBeam = round(beamSoffit - (lv.basement_ff_cm ?? -250));

const doors = {
  usa_beci_magazie: !!bm.stair?.door_to_magazie,
  usa_magazie_ct: !!(bm.doors || []).find((d) => d.id === "usa_magazie_ct"),
  usa_magazie_depozit: !!(bm.doors || []).find((d) => d.id === "usa_magazie_depozit"),
  usa_ct_depozit: !!(bm.doors || []).find((d) => /ct.*dep|dep.*ct/i.test(d.id)),
};

const fails = [...padAudits, ...wallAudits, ...footAudits].filter((a) => !a.pass);
const out = {
  meta: {
    id: "s1_a1_r1_parcel_basement_v01",
    generated: new Date().toISOString(),
    along0_m: along0,
    north_eccentric_inward: northIn,
    east_eccentric_inward: eastIn,
    perimeter_strip_cm: strip,
  },
  pads: padAudits,
  walls: wallAudits,
  footings: footAudits,
  access: {
    pier_id: pier?.id ?? null,
    pier_xy: pier ? { x: pier.x, y: pier.y, dx: pier.dx, dy: pier.dy } : null,
    shaft_west_x: shaftWest,
    clear_west_of_pier_cm: pierClear,
    clear_need_cm: shaftClearNeed,
    pier_strangle: pierClear != null && pierClear < shaftClearNeed,
  },
  clear_basement: {
    target_under_slab_cm: bm.clear_target_cm ?? 220,
    clear_under_slab_cm: clearSlab,
    beam_h_cm: beamH,
    beam_soffit_cm: beamSoffit,
    clear_under_beam_cm: clearBeam,
    beam_clear_fail: clearBeam < (bm.clear_target_cm ?? 220),
  },
  doors,
  summary: {
    overflow_fail_count: fails.length,
    worst_overflow_cm: fails.length ? Math.max(...fails.map((f) => f.max_overflow_cm)) : 0,
    worst_ids: fails
      .sort((a, b) => b.max_overflow_cm - a.max_overflow_cm)
      .slice(0, 12)
      .map((f) => `${f.id}:${f.max_overflow_cm}`),
  },
};

const md = `# S1 A1 — Runda 1 audit parcelă / beci

**Generat:** ${out.meta.generated}
**north_eccentric_inward:** ${northIn} · strip **${strip}** cm

## Overflow (fail ≥2 cm)

| ID | max overflow cm | PASS |
|----|----------------:|:----:|
${[...padAudits, ...wallAudits, ...footAudits]
  .map((a) => `| ${a.id} | ${a.max_overflow_cm} | ${a.pass ? "✓" : "**✗**"} |`)
  .join("\n")}

## Acces

| Check | Valoare |
|-------|---------|
| Clear vest de pier | **${pierClear}** cm (need ${shaftClearNeed}) |
| Strangulare | **${out.access.pier_strangle}** |
| Uși CT/dep | ${JSON.stringify(doors)} |

## Clear beci

| | cm |
|--|---:|
| Sub placă | ${clearSlab} |
| Sub grindă | **${clearBeam}** |
| Țintă | ${bm.clear_target_cm ?? 220} |

## Worst

${out.summary.worst_ids.join(", ") || "(none)"}

JSON: \`s1_a1_r1_parcel_basement_v01.json\`
`;

fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_r1_parcel_basement_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_r1_parcel_basement_v01.md"), md);
console.log(JSON.stringify(out.summary, null, 2));
console.log("access", out.access);
console.log("clear", out.clear_basement);
