/**
 * Plan situație A1 — parcelă + casă + beci/puț + accese + POT.
 * node src/export_a1_site_plan_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const vol = JSON.parse(fs.readFileSync(path.join(root, "viewer/data/volume_a1.json"), "utf8"));
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));

const site = vol.site || {};
const cf = site.cf_vertices || [];
const fp = site.footprint_vertices || [];
const transform = site.transform || {};
const corners = site.v44_corners || {};

const pad = 72;
const scale = 36; // px / m

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

const byId = Object.fromEntries(cf.filter((v) => v.id != null).map((v) => [v.id, v]));
const dragChain = [5, 4, 3, 2, 1].map((id) => byId[id]).filter(Boolean);
const { Ix, Iy, along0, ew } = transform;

/** Local cm → site m (same convention as build_v47_3d). */
function localToSite(lcmX, lcmY) {
  const on = pointAlong(dragChain, (along0 || 0) + lcmY / 100);
  const depth = (ew || 6.8) - lcmX / 100;
  return { x: on.x + Ix * depth, y: on.y + Iy * depth };
}

function sx(x) {
  return pad + x * scale;
}
function sy(y) {
  const ys = cf.map((v) => v.y);
  const ymax = Math.max(...ys);
  return pad + (ymax - y) * scale;
}

const xs = cf.map((v) => v.x);
const ys = cf.map((v) => v.y);
const W = (Math.max(...xs) - Math.min(...xs)) * scale + pad * 2 + 40;
const H = (Math.max(...ys) - Math.min(...ys)) * scale + pad * 2 + 140;

function polyPoints(verts) {
  return verts.map((v) => `${sx(v.x).toFixed(1)},${sy(v.y).toFixed(1)}`).join(" ");
}
function linePoints(verts) {
  return verts.map((v) => `${sx(v.x).toFixed(1)},${sy(v.y).toFixed(1)}`).join(" ");
}
function rectLocal(x0, y0, dx, dy) {
  return polyPoints([
    localToSite(x0, y0),
    localToSite(x0 + dx, y0),
    localToSite(x0 + dx, y0 + dy),
    localToSite(x0, y0 + dy),
  ]);
}

function distPointToSegment(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby || 1e-12;
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
}
function minDistToEdges(pt) {
  const verts = cf.slice(0, -1);
  let dMin = Infinity;
  for (let i = 0; i < verts.length; i++) {
    dMin = Math.min(dMin, distPointToSegment(pt, verts[i], verts[(i + 1) % verts.length]));
  }
  return dMin;
}

const box = a1.basement_cm?.structure_box;
const pit = a1.basement_cm?.stair?.pit;
const terrace = (a1.rooms_cm || []).find((r) => r.id === "terasa_p");
const ewCm = a1.envelope_cm?.ew ?? 680;
const nsCm = a1.envelope_cm?.ns ?? 860;

const areaParcel = site.confirmed_areas?.measured_m2 ?? 147;
const areaFoot = vol.building_summary?.footprint_gross_m2 ?? 58.48;
const pot = ((areaFoot / areaParcel) * 100).toFixed(2);

const setbacksCm = Object.fromEntries(
  Object.entries(corners).map(([k, pt]) => [k, Math.round(minDistToEdges(pt) * 100)])
);

function meshById(id) {
  return (vol.meshes || []).find((m) => m.id === id);
}

const font = "IBM Plex Sans,Segoe UI,Arial,sans-serif";
const parts = [];
parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">`
);
parts.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);
parts.push(
  `<text x="${pad}" y="36" font-size="18" font-weight="700" fill="#111" font-family="${font}">A1 · Plan situație</text>`
);
parts.push(
  `<text x="${pad}" y="56" font-size="13" fill="#222" font-family="${font}">CF 54602 Turda · Dragalina = EST · Cloșca = SUD · studiu neautorizabil</text>`
);
parts.push(
  `<text x="${pad}" y="74" font-size="12" fill="#444" font-family="${font}">Hotar CF ≠ gard construit · acces auto Cloșca · pietonal Dragalina</text>`
);

// parcel (hotar)
parts.push(
  `<polygon points="${polyPoints(cf)}" fill="#e8f0e0" stroke="#1a3d1a" stroke-width="2.4" stroke-dasharray="10 4"/>`
);
parts.push(
  `<text x="${sx(cf[0].x) - 8}" y="${sy(cf[0].y) - 8}" font-size="10" fill="#1a3d1a" font-family="${font}">hotar CF</text>`
);

// parking
for (const id of ["auto_1", "auto_2"]) {
  const m = meshById(id);
  if (m?.polygon) {
    parts.push(
      `<polygon points="${polyPoints(m.polygon)}" fill="#d0d5cf" fill-opacity="0.7" stroke="#5a6358" stroke-width="1" stroke-dasharray="4 2"/>`
    );
  }
}
const a1c = meshById("auto_1")?.polygon?.[0];
if (a1c) {
  parts.push(
    `<text x="${sx((a1c.x + 2.5)).toFixed(1)}" y="${sy(2.5).toFixed(1)}" text-anchor="middle" font-size="11" fill="#445" font-family="${font}">2× auto</text>`
  );
}

// alee
const alee = meshById("alee_langa_scari");
if (alee?.polygon) {
  parts.push(
    `<polygon points="${polyPoints(alee.polygon)}" fill="#c5b89a" fill-opacity="0.55" stroke="#8a7a5a" stroke-width="1"/>`
  );
}

// footprint house
if (fp.length) {
  parts.push(
    `<polygon points="${polyPoints(fp)}" fill="#4a453f" fill-opacity="0.92" stroke="#111" stroke-width="2.2"/>`
  );
}
const midFp = fp[0] && fp[2] ? { x: (fp[0].x + fp[2].x) / 2, y: (fp[0].y + fp[2].y) / 2 } : null;
if (midFp) {
  parts.push(
    `<text x="${sx(midFp.x).toFixed(1)}" y="${sy(midFp.y).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="${font}">${ewCm}×${nsCm}</text>`
  );
}

// basement box
if (box) {
  parts.push(
    `<polygon points="${rectLocal(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0)}" fill="none" stroke="#b55238" stroke-width="1.6" stroke-dasharray="6 3"/>`
  );
}
// pit
if (pit) {
  parts.push(
    `<polygon points="${rectLocal(pit.x0, pit.y0, pit.x1 - pit.x0, pit.y1 - pit.y0)}" fill="#7eb6d9" fill-opacity="0.4" stroke="#1565c0" stroke-width="1.5"/>`
  );
  const pc = localToSite((pit.x0 + pit.x1) / 2, (pit.y0 + pit.y1) / 2);
  parts.push(
    `<text x="${sx(pc.x).toFixed(1)}" y="${sy(pc.y).toFixed(1)}" text-anchor="middle" font-size="10" fill="#0d47a1" font-family="${font}">puț</text>`
  );
}
// terrace
if (terrace) {
  parts.push(
    `<polygon points="${rectLocal(terrace.x, terrace.y, terrace.dx, terrace.dy)}" fill="#dfe8d8" fill-opacity="0.5" stroke="#5a6b4a" stroke-width="1.2"/>`
  );
}

// fence constructed (gard) vs limit wall on facade
for (const id of ["gard_vest", "gard_nord_vest_colt", "gard_dragalina_sud_casa", "gard_dragalina_s", "gard_closca_est"]) {
  const m = meshById(id);
  const line = m?.centerline || m?.polygon;
  if (!line || line.length < 2) continue;
  parts.push(
    `<polyline points="${linePoints(line)}" fill="none" stroke="#6b5e4e" stroke-width="3.2" stroke-linecap="round"/>`
  );
}
for (const id of ["limit_est_zid", "limit_nord_zid"]) {
  const m = meshById(id);
  if (!m?.polygon) continue;
  parts.push(
    `<polygon points="${polyPoints(m.polygon)}" fill="#9a9080" fill-opacity="0.85" stroke="#5a5348" stroke-width="1"/>`
  );
}

// gates
const gateAuto = meshById("poarta_inchisa");
if (gateAuto?.centerline) {
  parts.push(
    `<polyline points="${linePoints(gateAuto.centerline)}" fill="none" stroke="#2e7d32" stroke-width="5" stroke-linecap="round"/>`
  );
  const g = gateAuto.centerline[0];
  parts.push(
    `<text x="${sx(g.x + 3.5).toFixed(1)}" y="${sy(g.y) + 18}" text-anchor="middle" font-size="11" font-weight="700" fill="#2e7d32" font-family="${font}">poartă auto</text>`
  );
}
const gatePed = meshById("poarta_pietonala_dragalina");
if (gatePed?.centerline) {
  parts.push(
    `<polyline points="${linePoints(gatePed.centerline)}" fill="none" stroke="#2e7d32" stroke-width="4" stroke-linecap="round"/>`
  );
  const g = gatePed.centerline[0];
  parts.push(
    `<text x="${sx(g.x) + 14}" y="${sy(g.y)}" font-size="10" font-weight="700" fill="#2e7d32" font-family="${font}">pietonal</text>`
  );
}

// street labels
parts.push(
  `<text x="${(W - 28).toFixed(1)}" y="${(H / 2).toFixed(1)}" font-size="14" font-weight="700" fill="#0d3d0d" font-family="${font}" transform="rotate(90 ${(W - 28).toFixed(1)} ${(H / 2).toFixed(1)})">DRAGALINA</text>`
);
parts.push(
  `<text x="${(W / 2).toFixed(1)}" y="${(H - 48).toFixed(1)}" text-anchor="middle" font-size="14" font-weight="700" fill="#0d3d0d" font-family="${font}">CLOȘCA</text>`
);
parts.push(
  `<text x="${pad}" y="${pad + 4}" font-size="13" font-weight="700" fill="#111" font-family="${font}">N ↑</text>`
);

// setback callouts at corners
for (const [k, pt] of Object.entries(corners)) {
  const cm = setbacksCm[k];
  parts.push(
    `<circle cx="${sx(pt.x).toFixed(1)}" cy="${sy(pt.y).toFixed(1)}" r="3.5" fill="#111"/>`
  );
  parts.push(
    `<text x="${(sx(pt.x) + (k.includes("E") ? 8 : -8)).toFixed(1)}" y="${(sy(pt.y) + (k.includes("N") ? -6 : 14)).toFixed(1)}" text-anchor="${k.includes("E") ? "start" : "end"}" font-size="10" fill="#333" font-family="${font}">${k} ${cm} cm</text>`
  );
}

// legend / metrics footer
const fy = H - 118;
parts.push(
  `<rect x="${pad - 8}" y="${fy}" width="${(W - pad * 2 + 16).toFixed(1)}" height="100" rx="6" fill="#f5f3ee" stroke="#bbb" stroke-width="1"/>`
);
parts.push(
  `<text x="${pad}" y="${fy + 22}" font-size="13" font-weight="700" fill="#111" font-family="${font}">Amprentă ${areaFoot} m² · POT ${pot}% pe ${areaParcel} m² (topo) — anvelopă ref., nu verdict urbanism</text>`
);
parts.push(
  `<text x="${pad}" y="${fy + 42}" font-size="12" fill="#111" font-family="${font}">Legendă: — — hotar CF · ■ gard/zid construit · ■ puț scară beci · - - cutie beci · terasă vest</text>`
);
parts.push(
  `<text x="${pad}" y="${fy + 62}" font-size="12" fill="#1565c0" font-family="${font}">Acces: Cloșca auto → curte · Dragalina pietonal + alee → scări → palier −95 → beci −250</text>`
);
parts.push(
  `<text x="${pad}" y="${fy + 82}" font-size="12" fill="#b55238" font-family="${font}">Apă: pantă curte + drenaj put_reten — REZERVĂ proiect (nu detaliu hidraulic)</text>`
);

parts.push(`</svg>`);

const out = path.join(root, "outputs/plans/a1_plan_situatie.svg");
fs.writeFileSync(out, parts.join("\n"));

const md = `# S1 A1 — Plan situație v01 (A1.198)

**Fișier:** [\`outputs/plans/a1_plan_situatie.svg\`](../plans/a1_plan_situatie.svg)

| Metrică | Valoare |
|---------|---------|
| Amprentă | **${areaFoot}** m² |
| Teren (măsurat) | **${areaParcel}** m² |
| POT anvelopă ref. | **${pot}%** (nu e verdict urbanism) |
| Cutie beci | X ${box?.x0}–${box?.x1} × Y ${box?.y0}–${box?.y1} |
| Puț | X ${pit?.x0}–${pit?.x1} × Y ${pit?.y0}–${pit?.y1} |
| Retrageri colț (cm → hotar) | NW ${setbacksCm.NW} · NE ${setbacksCm.NE} · SE ${setbacksCm.SE} · SW ${setbacksCm.SW} |

## Accese / apă (studiu)
- Poartă auto Cloșca; pietonală Dragalina + alee → scări beci
- Puț + retenție pe plan; colectare ape = **REZERVĂ** proiect
- Hotar CF (linie întreruptă) ≠ gard/zid construit

\`\`\`
node src/export_a1_site_plan_v01.mjs
\`\`\`
`;
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_site_plan_v01.md"), md);
console.log(
  JSON.stringify({ ok: true, out, pot, setbacksCm, areaFoot, areaParcel, W: +W.toFixed(0), H: +H.toFixed(0) }, null, 2)
);
