/**
 * A0 — amplasament: corp finit 680×860 pe sit CF.
 * Rulează: node src/build_a0_site.mjs
 * Nu atinge V47 FRAME.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const BODY_EW_CM = 680;
const BODY_NS_CM = 860;
/** Teren canonic = 147 m² (ridicare topo 2011). 172 din acte vechi = eronat, scos. */
const PARCEL_M2 = 147;

const parcel = JSON.parse(
  fs.readFileSync(path.join(root, "data/site/parcel_polygon_cf.json"), "utf8")
);
const verts = parcel.vertices_m;

function shoelace(pts) {
  let a = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    a += pts[i].x * pts[i + 1].y - pts[i + 1].x * pts[i].y;
  }
  return Math.abs(a) / 2;
}

function insideParcel(pt) {
  const pts = verts.slice(0, -1);
  let odd = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const yi = pts[i].y;
    const yj = pts[j].y;
    const xi = pts[i].x;
    const xj = pts[j].x;
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi)
      odd = !odd;
  }
  return odd;
}

/** Dragalina N→S = pct 5→4→3→2→1 (ca V47); EST pe limită; curte sud → Cloșca. */
const byId = Object.fromEntries(verts.filter((v) => v.id != null).map((v) => [v.id, v]));
const drag = [5, 4, 3, 2, 1].map((id) => byId[id]);
function pointAlong(chain, dist) {
  let left = dist;
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const b = chain[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= len) {
      const t = left / len;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    left -= len;
  }
  return { ...chain[chain.length - 1] };
}
const dragLen = drag.slice(0, -1).reduce((s, a, i) => {
  const b = drag[i + 1];
  return s + Math.hypot(b.x - a.x, b.y - a.y);
}, 0);

/** Inward = spre vest (interior), perp. pe tangentă N→S la pct 5. */
const t0 = { x: drag[1].x - drag[0].x, y: drag[1].y - drag[0].y };
const tLen = Math.hypot(t0.x, t0.y) || 1;
const Tx = t0.x / tLen;
const Ty = t0.y / tLen;
let Ix = -Ty;
let Iy = Tx;
const P5 = drag[0];
if (P5.x + Ix * 2 > P5.x) {
  Ix = -Ix;
  Iy = -Iy;
}

const ew = BODY_EW_CM / 100;
const ns = BODY_NS_CM / 100;

function cornerAt(along0) {
  const to = (lx, ly) => {
    const on = pointAlong(drag, along0 + ly);
    const depth = ew - lx;
    return { x: on.x + Ix * depth, y: on.y + Iy * depth };
  };
  return { NW: to(0, 0), NE: to(ew, 0), SE: to(ew, ns), SW: to(0, ns), to };
}

let along0 = 0;
for (let a = 0; a <= 2.0; a += 0.05) {
  const c = cornerAt(a);
  if ([c.NW, c.NE, c.SE, c.SW].every((pt) => insideParcel(pt))) {
    along0 = a + 0.05;
    break;
  }
  along0 = a;
}
const placed = cornerAt(along0);
const footprint_m2 = +(ew * ns).toFixed(4);
const pot147 = footprint_m2 / PARCEL_M2;

const site = {
  meta: {
    id: "a0_site",
    version: "0.1",
    status: "AMPLASAMENT_STUDIU",
    generated: new Date().toISOString(),
    brief: "decisions/brief_A0_v01.md",
    note: "Corp finit 680×860 · fără pilastri afară · pe limită Dragalina + N · curte sud Cloșca",
  },
  parcel: {
    cf: "54602 Turda",
    area_m2: PARCEL_M2,
    area_basis: "ridicare_topo_2011",
    area_note: "147 m² = teren canonic. 172 m² din acte/CF vechi = eronat — nu se folosește.",
    polygon_reconstructed_m2: parcel.metrics.area_m2,
    streets: parcel.meta.streets,
  },
  body_cm: {
    ew: BODY_EW_CM,
    ns: BODY_NS_CM,
    pilasters_outside: false,
    excess_absorbed: "interior",
  },
  footprint: {
    area_m2: footprint_m2,
    pot_pct: +(pot147 * 100).toFixed(2),
    pot_pct_147: +(pot147 * 100).toFixed(2),
    pot_basis: "finit_680x860_on_147_topo_2011",
    corners_site_m: {
      NW: { x: +placed.NW.x.toFixed(4), y: +placed.NW.y.toFixed(4) },
      NE: { x: +placed.NE.x.toFixed(4), y: +placed.NE.y.toFixed(4) },
      SE: { x: +placed.SE.x.toFixed(4), y: +placed.SE.y.toFixed(4) },
      SW: { x: +placed.SW.x.toFixed(4), y: +placed.SW.y.toFixed(4) },
    },
    along0_m_from_dragalina_N: +along0.toFixed(3),
    dragalina_edge_length_m: +dragLen.toFixed(3),
    placement: {
      east: "pe limita Dragalina",
      north: "spre vecin N (along minim în parcelă)",
      west: "în parcelă",
      south: "curte către Cloșca",
    },
  },
  constraints_from_brief: {
    clear_min_cm: 255,
    riser_max_cm: 16,
    useful_min_m2: 37,
    basement: "necessary_form_free",
    keep_layout: "mostly_v47_intent",
  },
  next: "Etapa 2/3 — planuri ARH A1 pe acest corp (nu structură încă)",
};

fs.mkdirSync(path.join(root, "data/building"), { recursive: true });
fs.writeFileSync(path.join(root, "data/building/a0_site.json"), JSON.stringify(site, null, 2));

/** SVG — canvas lat, texte mari, etichete în afara formelor */
const padL = 72;
const padR = 130;
const padT = 100;
const padB = 110;
const scale = 36;
const allX = [...verts.map((p) => p.x), placed.NW.x, placed.NE.x, placed.SE.x, placed.SW.x];
const allY = [...verts.map((p) => p.y), placed.NW.y, placed.NE.y, placed.SE.y, placed.SW.y];
const minX = Math.min(...allX);
const maxX = Math.max(...allX);
const minY = Math.min(...allY);
const maxY = Math.max(...allY);
const W = (maxX - minX) * scale + padL + padR;
const H = (maxY - minY) * scale + padT + padB;
const sx = (x) => padL + (x - minX) * scale;
const sy = (y) => padT + (maxY - y) * scale;
const font = "IBM Plex Sans,Segoe UI,Arial,sans-serif";

const polyPts = verts.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
const housePts = [placed.NW, placed.NE, placed.SE, placed.SW, placed.NW]
  .map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
  .join(" ");

const hx = (placed.NW.x + placed.SE.x) / 2;
const hy = (placed.NW.y + placed.SE.y) / 2;
const dragLabelX = sx(Math.max(...drag.map((p) => p.x))) + 18;
const dragLabelY = sy((drag[0].y + drag[drag.length - 1].y) / 2);
const closcaLabelX = sx((byId[10].x + byId[1].x) / 2);
const closcaLabelY = sy(Math.min(byId[10].y, byId[1].y)) + 32;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W)}" height="${Math.round(H)}" viewBox="0 0 ${W} ${H}">
<rect width="100%" height="100%" fill="#ffffff"/>
<text x="${padL}" y="36" font-size="18" font-weight="700" fill="#111111" font-family="${font}">A0 · Plan situație</text>
<text x="${padL}" y="58" font-size="14" fill="#222222" font-family="${font}">Corp finit 680 × 860 cm · fără pilastri afară</text>
<text x="${padL}" y="78" font-size="13" fill="#333333" font-family="${font}">CF 54602 Turda · Dragalina = EST · Cloșca = SUD</text>
<polygon points="${polyPts}" fill="#e8f0e0" stroke="#1a3d1a" stroke-width="2.2"/>
<polygon points="${housePts}" fill="#4a453f" stroke="#111111" stroke-width="2.5"/>
<rect x="${sx(hx) - 62}" y="${sy(hy) - 18}" width="124" height="32" rx="4" fill="#000000" fill-opacity="0.8"/>
<text x="${sx(hx)}" y="${sy(hy) + 6}" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff" font-family="${font}">680 × 860</text>
<text x="${dragLabelX}" y="${dragLabelY}" font-size="15" font-weight="700" fill="#0d3d0d" font-family="${font}" transform="rotate(90 ${dragLabelX} ${dragLabelY})">DRAGALINA</text>
<text x="${closcaLabelX}" y="${closcaLabelY}" text-anchor="middle" font-size="15" font-weight="700" fill="#0d3d0d" font-family="${font}">CLOȘCA</text>
<text x="${sx((placed.NW.x + placed.NE.x) / 2)}" y="${sy(Math.max(placed.NW.y, placed.NE.y)) - 12}" text-anchor="middle" font-size="13" font-weight="700" fill="#111111" font-family="${font}">N ↑</text>
<rect x="${padL - 8}" y="${H - 92}" width="400" height="76" rx="6" fill="#f5f3ee" stroke="#bbbbbb" stroke-width="1"/>
<text x="${padL}" y="${H - 66}" font-size="14" font-weight="700" fill="#111111" font-family="${font}">Amprentă ${footprint_m2} m²</text>
<text x="${padL}" y="${H - 46}" font-size="14" fill="#111111" font-family="${font}">POT = ${site.footprint.pot_pct}% pe teren 147 m² (topo 2011)</text>
<text x="${padL}" y="${H - 26}" font-size="12" fill="#333333" font-family="${font}">Curte sud liberă · studiu neconstruibil</text>
</svg>
`;

fs.mkdirSync(path.join(root, "outputs/plans"), { recursive: true });
const svgPath = path.join(root, "outputs/plans/a0_plan_situatie.svg");
fs.writeFileSync(svgPath, svg);

console.log(
  JSON.stringify(
    {
      ok: true,
      footprint_m2,
      pot_pct_147: site.footprint.pot_pct_147,
      along0,
      corners: site.footprint.corners_site_m,
      files: ["data/building/a0_site.json", "outputs/plans/a0_plan_situatie.svg"],
    },
    null,
    2
  )
);
