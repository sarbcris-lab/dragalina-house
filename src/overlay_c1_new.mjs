/**
 * Suprapunere C1 existent vs amprentă casă nouă — plan + arii.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCALE = 32;
const MARGIN = 70;

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function ring(pts) {
  const p = pts.map((v) => ({ x: v.x, y: v.y }));
  if (p.length && (p[0].x !== p[p.length - 1].x || p[0].y !== p[p.length - 1].y)) {
    p.push({ ...p[0] });
  }
  return p;
}

function area(pts) {
  const p = ring(pts).slice(0, -1);
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const j = (i + 1) % p.length;
    a += p[i].x * p[j].y - p[j].x * p[i].y;
  }
  return Math.abs(a / 2);
}

function bbox(pts) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** Test punct în poligon (ray cast) */
function inside(pt, poly) {
  const p = ring(poly).slice(0, -1);
  let odd = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const yi = p[i].y,
      yj = p[j].y,
      xi = p[i].x,
      xj = p[j].x;
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi) {
      odd = !odd;
    }
  }
  return odd;
}

/** Arie intersecție / diferență prin grilă (suficient pentru studiu) */
function gridAreas(c1, neu, step = 0.1) {
  const b = bbox([...c1, ...neu]);
  let both = 0,
    onlyC1 = 0,
    onlyNew = 0,
    n = 0;
  for (let x = b.minX; x <= b.maxX; x += step) {
    for (let y = b.minY; y <= b.maxY; y += step) {
      const pt = { x, y };
      const inC = inside(pt, c1);
      const inN = inside(pt, neu);
      if (inC && inN) both++;
      else if (inC) onlyC1++;
      else if (inN) onlyNew++;
      n++;
    }
  }
  const cell = step * step;
  return {
    overlap_m2: +(both * cell).toFixed(1),
    only_c1_m2: +(onlyC1 * cell).toFixed(1),
    only_new_m2: +(onlyNew * cell).toFixed(1),
    c1_covered_pct: +((100 * both) / (both + onlyC1 || 1)).toFixed(0),
    new_on_c1_pct: +((100 * both) / (both + onlyNew || 1)).toFixed(0),
  };
}

function polyPts(arr, P) {
  return ring(arr)
    .map((v) => `${P(v.x, v.y).x},${P(v.x, v.y).y}`)
    .join(" ");
}

function main() {
  const polygon = read("data/site/parcel_polygon_cf.json");
  const footprint = read("data/building/footprint_v01.json");
  const c1 = polygon.existing_building_c1.vertices_m;
  const neu = footprint.footprint.outer;
  const body = footprint.footprint.body;
  const access = footprint.footprint.access_band;

  const stats = gridAreas(c1, neu, 0.08);
  const c1Area = area(c1);
  const newArea = area(neu);
  const bodyArea = area(body);

  const W = polygon.metrics.bbox_m.width;
  const D = polygon.metrics.bbox_m.depth;
  const svgW = MARGIN * 2 + W * SCALE + 280;
  const svgH = MARGIN * 2 + D * SCALE + 160;
  const P = (x, y) => ({
    x: MARGIN + 40 + x * SCALE,
    y: MARGIN + 20 + (D - y) * SCALE,
  });

  let bodySvg = "";
  bodySvg += `<text x="${svgW / 2}" y="22" text-anchor="middle" font-size="13" font-family="IBM Plex Sans, Segoe UI, sans-serif">SUPRAPUNERE · C1 existent vs casă NOUĂ</text>`;
  bodySvg += `<text x="${svgW / 2}" y="40" text-anchor="middle" font-size="11" fill="#555" font-family="IBM Plex Sans, Segoe UI, sans-serif">N↑ · Dragalina→ · Cloșca↓ · demolare C1 + construire nouă</text>`;

  // parcel
  bodySvg += `<polygon points="${polyPts(polygon.vertices_m, P)}" fill="#f4f7f2" stroke="#000" stroke-width="2"/>`;

  // C1 (existent) — hatch red/orange
  bodySvg += `<polygon points="${polyPts(c1, P)}" fill="#e57373" fill-opacity="0.45" stroke="#b71c1c" stroke-width="2.2"/>`;

  // New outer
  bodySvg += `<polygon points="${polyPts(neu, P)}" fill="#64b5f6" fill-opacity="0.4" stroke="#0d47a1" stroke-width="2.4"/>`;
  bodySvg += `<polygon points="${polyPts(access, P)}" fill="#90caf9" fill-opacity="0.55" stroke="#1565c0" stroke-width="1.2" stroke-dasharray="4 3"/>`;

  // vertex labels parcel
  for (const v of polygon.vertices_m.slice(0, -1)) {
    const p = P(v.x, v.y);
    bodySvg += `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#000"/>`;
    bodySvg += `<text x="${p.x + 4}" y="${p.y + 3}" font-size="10" font-family="IBM Plex Sans, Segoe UI, sans-serif">${v.id}</text>`;
  }

  bodySvg += `<text x="${P(W + 0.3, D * 0.55).x}" y="${P(W + 0.3, D * 0.55).y}" font-size="12" fill="#8b1e1e" font-family="IBM Plex Sans, Segoe UI, sans-serif">DRAGALINA</text>`;
  bodySvg += `<text x="${P(W * 0.45, -0.6).x}" y="${P(W * 0.45, -0.6).y}" text-anchor="middle" font-size="12" font-family="IBM Plex Sans, Segoe UI, sans-serif">CLOȘCA</text>`;

  // legend + numbers
  const lx = svgW - 250;
  bodySvg += `
  <rect x="${lx}" y="70" width="230" height="280" fill="#fff" stroke="#333"/>
  <rect x="${lx + 12}" y="88" width="22" height="14" fill="#e57373" fill-opacity="0.55" stroke="#b71c1c"/>
  <text x="${lx + 42}" y="100" font-size="11" font-family="IBM Plex Sans, Segoe UI, sans-serif">C1 existent ≈ ${c1Area.toFixed(0)} m² (CF 76)</text>
  <rect x="${lx + 12}" y="118" width="22" height="14" fill="#64b5f6" fill-opacity="0.5" stroke="#0d47a1"/>
  <text x="${lx + 42}" y="130" font-size="11" font-family="IBM Plex Sans, Segoe UI, sans-serif">Casă nouă ≈ ${newArea.toFixed(0)} m²</text>
  <text x="${lx + 12}" y="160" font-size="11" font-family="IBM Plex Sans, Segoe UI, sans-serif">Suprapunere (intersecție):</text>
  <text x="${lx + 12}" y="178" font-size="14" font-weight="600" font-family="IBM Plex Sans, Segoe UI, sans-serif">${stats.overlap_m2} m²</text>
  <text x="${lx + 12}" y="204" font-size="11" font-family="IBM Plex Sans, Segoe UI, sans-serif">Doar C1 (dispare la demolare):</text>
  <text x="${lx + 12}" y="222" font-size="12" font-family="IBM Plex Sans, Segoe UI, sans-serif">${stats.only_c1_m2} m² — trepte sud spre curte</text>
  <text x="${lx + 12}" y="248" font-size="11" font-family="IBM Plex Sans, Segoe UI, sans-serif">Doar nou (în afara C1):</text>
  <text x="${lx + 12}" y="266" font-size="12" font-family="IBM Plex Sans, Segoe UI, sans-serif">${stats.only_new_m2} m²</text>
  <text x="${lx + 12}" y="292" font-size="10" fill="#444" font-family="IBM Plex Sans, Segoe UI, sans-serif">~${stats.new_on_c1_pct}% din amprenta nouă stă pe C1</text>
  <text x="${lx + 12}" y="310" font-size="10" fill="#444" font-family="IBM Plex Sans, Segoe UI, sans-serif">~${stats.c1_covered_pct}% din C1 e acoperit de nou</text>
  <text x="${lx + 12}" y="332" font-size="9" fill="#666" font-family="IBM Plex Sans, Segoe UI, sans-serif">Corp locuit nou ≈ ${bodyArea.toFixed(0)} m² (+ bandă 2,40)</text>
  `;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#fafafa"/>
  ${bodySvg}
</svg>`;

  const outSvg = path.join(ROOT, "outputs/plans/06_suprapunere_c1_nou.svg");
  const outJson = path.join(ROOT, "outputs/reports/04_suprapunere_c1_nou.json");
  fs.mkdirSync(path.dirname(outSvg), { recursive: true });
  fs.writeFileSync(outSvg, svg);

  const report = {
    meta: {
      generated: new Date().toISOString(),
      note: "C1 din plan amplasament; casă nouă = footprint_v01 pe 3 limite.",
    },
    c1_m2: +c1Area.toFixed(2),
    c1_cf_m2: 76,
    new_footprint_m2: +newArea.toFixed(2),
    new_body_m2: +bodyArea.toFixed(2),
    ...stats,
    reading: {
      geometry:
        "Ambele pe N+Dragalina+Vest. C1 coboară mai mult spre Cloșca (până la pct 9, trepte). Casa nouă e mai scurtă pe N–S (~9,3 m) și lasă curte mai mare sud.",
      strategy: "Demolare C1 integral → casă nouă pe nordul lotului, pe aceeași logică de 3 limite, dar amprentă mai compactă.",
    },
  };
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

  // ghost C1 în volume 3D
  const volumePath = path.join(ROOT, "viewer/data/volume.json");
  if (fs.existsSync(volumePath)) {
    const vol = JSON.parse(fs.readFileSync(volumePath, "utf8"));
    vol.meshes = (vol.meshes || []).filter((m) => m.id !== "c1_existent_ghost");
    vol.meshes.unshift({
      id: "c1_existent_ghost",
      type: "extrude",
      polygon: ring(c1).map((p) => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3) })),
      z0_m: 0.02,
      z1_m: 2.8,
      color: "#e57373",
      opacity: 0.28,
      label: "C1 existent (ghost — demolare)",
    });
    vol.site = vol.site || {};
    vol.site.c1_vertices = c1;
    vol.site.overlap = report;
    fs.writeFileSync(volumePath, JSON.stringify(vol, null, 2));
    fs.writeFileSync(path.join(ROOT, "outputs/plans/04_volume_concept_v01.json"), JSON.stringify(vol, null, 2));
  }

  console.log(JSON.stringify(report, null, 2));
  console.log("SVG", outSvg);
}

main();
