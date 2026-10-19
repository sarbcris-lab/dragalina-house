/**
 * Plan situație A1 — două variante:
 *  - a1_plan_situatie.svg (arhitectură / sit)
 *  - a1_plan_situatie_fundatii.svg (subsol + tălpi vs hotar)
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

const padL = 56;
const padR = 72;
const padT = 52;
const padB = 108;
const scale = 36;

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

function localToSite(lcmX, lcmY) {
  const on = pointAlong(dragChain, (along0 || 0) + lcmY / 100);
  const depth = (ew || 6.8) - lcmX / 100;
  return { x: on.x + Ix * depth, y: on.y + Iy * depth };
}

const xs = cf.map((v) => v.x);
const ys = cf.map((v) => v.y);
const xmin = Math.min(...xs);
const xmax = Math.max(...xs);
const ymin = Math.min(...ys);
const ymax = Math.max(...ys);
const W = (xmax - xmin) * scale + padL + padR;
const H = (ymax - ymin) * scale + padT + padB;

function sx(x) {
  return padL + (x - xmin) * scale;
}
function sy(y) {
  return padT + (ymax - y) * scale;
}

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
  const q = { x: a.x + t * abx, y: a.y + t * aby };
  return { d: Math.hypot(p.x - q.x, p.y - q.y), q, t };
}
function closestOnParcel(pt) {
  const verts = cf[0] && cf[cf.length - 1] && cf[0].x === cf[cf.length - 1].x ? cf.slice(0, -1) : cf;
  let best = { d: Infinity, q: pt };
  for (let i = 0; i < verts.length; i++) {
    const r = distPointToSegment(pt, verts[i], verts[(i + 1) % verts.length]);
    if (r.d < best.d) best = r;
  }
  return best;
}
function minDistToEdges(pt) {
  return closestOnParcel(pt).d;
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

function wrapText(parts, x, y0, lines, opts = {}) {
  const fs = opts.fontSize || 11;
  const lh = opts.lineHeight || fs + 4;
  const weight = opts.fontWeight || "400";
  const fill = opts.fill || "#111";
  lines.forEach((line, i) => {
    parts.push(
      `<text x="${x}" y="${y0 + i * lh}" font-size="${fs}" font-weight="${weight}" fill="${fill}" font-family="${font}">${line}</text>`
    );
  });
}

function drawNorth(parts) {
  // colț dreapta-sus, în afara amprentei — nu peste casă
  const nx = W - 36;
  const ny = padT + 28;
  parts.push(`<g id="north">`);
  parts.push(
    `<polygon points="${nx},${ny - 16} ${nx - 7},${ny + 4} ${nx + 7},${ny + 4}" fill="#111"/>`
  );
  parts.push(
    `<text x="${nx}" y="${ny + 18}" text-anchor="middle" font-size="12" font-weight="700" fill="#111" font-family="${font}">N</text>`
  );
  parts.push(`</g>`);
}

function drawSetbackDims(parts) {
  for (const [k, pt] of Object.entries(corners)) {
    const cm = setbacksCm[k];
    const hit = closestOnParcel(pt);
    const x0 = sx(pt.x);
    const y0 = sy(pt.y);
    const x1 = sx(hit.q.x);
    const y1 = sy(hit.q.y);
    parts.push(
      `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#c62828" stroke-width="1.2"/>`
    );
    parts.push(`<circle cx="${x0.toFixed(1)}" cy="${y0.toFixed(1)}" r="3" fill="#111"/>`);
    parts.push(`<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="2.5" fill="#c62828"/>`);
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const offX = k.includes("E") ? 10 : -10;
    const offY = k.includes("N") ? -8 : 12;
    parts.push(
      `<text x="${(mx + offX).toFixed(1)}" y="${(my + offY).toFixed(1)}" text-anchor="${k.includes("E") ? "start" : "end"}" font-size="10" font-weight="700" fill="#b71c1c" font-family="${font}">${k} ${cm}</text>`
    );
  }
}

function drawCartouche(parts, title, lines) {
  const fy = H - padB + 10;
  const boxW = W - padL - padR + 16;
  const boxH = padB - 22;
  parts.push(
    `<rect x="${padL - 8}" y="${fy}" width="${boxW.toFixed(1)}" height="${boxH}" rx="5" fill="#f5f3ee" stroke="#bbb" stroke-width="1"/>`
  );
  parts.push(
    `<text x="${padL}" y="${fy + 16}" font-size="12" font-weight="700" fill="#111" font-family="${font}">${title}</text>`
  );
  wrapText(parts, padL, fy + 32, lines, { fontSize: 10, lineHeight: 13, fill: "#222" });
  // scară grafică ~5 m
  const barX = padL + boxW - 110;
  const barY = fy + boxH - 18;
  const barLen = 5 * scale;
  parts.push(
    `<line x1="${barX}" y1="${barY}" x2="${barX + barLen}" y2="${barY}" stroke="#111" stroke-width="2.5"/>`
  );
  parts.push(
    `<text x="${barX + barLen / 2}" y="${barY - 5}" text-anchor="middle" font-size="9" fill="#333" font-family="${font}">5 m</text>`
  );
  parts.push(
    `<text x="${barX + barLen / 2}" y="${barY + 12}" text-anchor="middle" font-size="8" fill="#666" font-family="${font}">rev. A1.204 · studiu</text>`
  );
}

function drawCommonBase(parts, opts = {}) {
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">`
  );
  parts.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);
  parts.push(
    `<text x="${padL}" y="28" font-size="16" font-weight="700" fill="#111" font-family="${font}">${opts.title}</text>`
  );
  parts.push(
    `<text x="${padL}" y="44" font-size="11" fill="#444" font-family="${font}">CF 54602 Turda · Dragalina=E · Cloșca=S · neautorizabil</text>`
  );

  // parcel
  parts.push(
    `<polygon points="${polyPoints(cf)}" fill="#e8f0e0" stroke="#1a3d1a" stroke-width="2.2" stroke-dasharray="9 4"/>`
  );

  if (opts.arch) {
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
        `<text x="${sx(a1c.x + 2.5).toFixed(1)}" y="${sy(2.5).toFixed(1)}" text-anchor="middle" font-size="10" fill="#445" font-family="${font}">2× auto</text>`
      );
    }
    const alee = meshById("alee_langa_scari");
    if (alee?.polygon) {
      parts.push(
        `<polygon points="${polyPoints(alee.polygon)}" fill="#c5b89a" fill-opacity="0.55" stroke="#8a7a5a" stroke-width="1"/>`
      );
    }
  }

  // footprint
  if (fp.length) {
    parts.push(
      `<polygon points="${polyPoints(fp)}" fill="${opts.arch ? "#4a453f" : "none"}" fill-opacity="${opts.arch ? "0.92" : "1"}" stroke="#111" stroke-width="2"${opts.arch ? "" : ' stroke-dasharray="5 3"'}/>`
    );
  }
  if (opts.arch) {
    const midFp = fp[0] && fp[2] ? { x: (fp[0].x + fp[2].x) / 2, y: (fp[0].y + fp[2].y) / 2 } : null;
    if (midFp) {
      parts.push(
        `<text x="${sx(midFp.x).toFixed(1)}" y="${sy(midFp.y).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="${font}">${ewCm}×${nsCm}</text>`
      );
    }
  }

  if (box) {
    parts.push(
      `<polygon points="${rectLocal(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0)}" fill="none" stroke="#b55238" stroke-width="1.5" stroke-dasharray="6 3"/>`
    );
  }
  if (pit) {
    parts.push(
      `<polygon points="${rectLocal(pit.x0, pit.y0, pit.x1 - pit.x0, pit.y1 - pit.y0)}" fill="#7eb6d9" fill-opacity="0.45" stroke="#1565c0" stroke-width="1.4"/>`
    );
    const pc = localToSite((pit.x0 + pit.x1) / 2, (pit.y0 + pit.y1) / 2);
    parts.push(
      `<text x="${sx(pc.x).toFixed(1)}" y="${sy(pc.y).toFixed(1)}" text-anchor="middle" font-size="9" fill="#0d47a1" font-family="${font}">puț</text>`
    );
  }
  if (opts.arch && terrace) {
    parts.push(
      `<polygon points="${rectLocal(terrace.x, terrace.y, terrace.dx, terrace.dy)}" fill="#dfe8d8" fill-opacity="0.5" stroke="#5a6b4a" stroke-width="1.1"/>`
    );
  }
}

function drawFenceAndGates(parts) {
  for (const id of ["gard_vest", "gard_nord_vest_colt", "gard_dragalina_sud_casa", "gard_dragalina_s", "gard_closca_est"]) {
    const m = meshById(id);
    const line = m?.centerline || m?.polygon;
    if (!line || line.length < 2) continue;
    parts.push(
      `<polyline points="${linePoints(line)}" fill="none" stroke="#6b5e4e" stroke-width="3" stroke-linecap="round"/>`
    );
  }
  for (const id of ["limit_est_zid", "limit_nord_zid"]) {
    const m = meshById(id);
    if (!m?.polygon) continue;
    parts.push(
      `<polygon points="${polyPoints(m.polygon)}" fill="#9a9080" fill-opacity="0.85" stroke="#5a5348" stroke-width="1"/>`
    );
  }
  const gateAuto = meshById("poarta_inchisa");
  if (gateAuto?.centerline) {
    parts.push(
      `<polyline points="${linePoints(gateAuto.centerline)}" fill="none" stroke="#2e7d32" stroke-width="5" stroke-linecap="round"/>`
    );
    const g = gateAuto.centerline[0];
    parts.push(
      `<text x="${sx(g.x + 3.5).toFixed(1)}" y="${sy(g.y) + 16}" text-anchor="middle" font-size="10" font-weight="700" fill="#2e7d32" font-family="${font}">poartă auto</text>`
    );
  }
  const gatePed = meshById("poarta_pietonala_dragalina");
  if (gatePed?.centerline) {
    parts.push(
      `<polyline points="${linePoints(gatePed.centerline)}" fill="none" stroke="#2e7d32" stroke-width="4" stroke-linecap="round"/>`
    );
    const g = gatePed.centerline[0];
    parts.push(
      `<text x="${sx(g.x) + 12}" y="${sy(g.y)}" font-size="9" font-weight="700" fill="#2e7d32" font-family="${font}">pietonal</text>`
    );
  }
}

function drawStreets(parts) {
  parts.push(
    `<text x="${(W - 22).toFixed(1)}" y="${(H / 2).toFixed(1)}" font-size="12" font-weight="700" fill="#0d3d0d" font-family="${font}" transform="rotate(90 ${(W - 22).toFixed(1)} ${(H / 2).toFixed(1)})">DRAGALINA</text>`
  );
  parts.push(
    `<text x="${(W / 2).toFixed(1)}" y="${(H - 14).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#0d3d0d" font-family="${font}">CLOȘCA</text>`
  );
}

function drawFoundations(parts) {
  for (const m of vol.meshes || []) {
    const id = m.id || "";
    if (!(id.startsWith("subsol_fg_") || id.startsWith("fundatie_"))) continue;
    if (m.polygon?.length >= 3) {
      const isPad = id.includes("pad_");
      parts.push(
        `<polygon points="${polyPoints(m.polygon)}" fill="${isPad ? "#8d6e63" : "#5d4037"}" fill-opacity="0.55" stroke="#3e2723" stroke-width="0.9"/>`
      );
    } else if (m.centerline?.length >= 2) {
      parts.push(
        `<polyline points="${linePoints(m.centerline)}" fill="none" stroke="#5d4037" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`
      );
    }
  }
  for (const id of ["subsol_reten_n", "subsol_reten_s", "subsol_reten_w", "subsol_reten_e", "put_reten_n", "put_reten_e"]) {
    const m = meshById(id);
    if (!m?.polygon) continue;
    parts.push(
      `<polygon points="${polyPoints(m.polygon)}" fill="#90caf9" fill-opacity="0.35" stroke="#1565c0" stroke-width="1.2"/>`
    );
  }
}

// —— Situație arhitectură ——
{
  const parts = [];
  drawCommonBase(parts, { title: "A1 · Plan situație (arhitectură)", arch: true });
  drawFenceAndGates(parts);
  drawStreets(parts);
  drawNorth(parts);
  drawSetbackDims(parts);
  drawCartouche(parts, `Amprentă ${areaFoot} m² · POT ${pot}% / ${areaParcel} m²`, [
    "Hotar CF (întrerupt) ≠ gard/zid · puț scară · cutie beci (roșu)",
    "Acces: Cloșca auto · Dragalina pietonal → alee → −95 → beci −250",
    "Apă curte = REZERVĂ · retrageri (cm) pe linii roșii colț→hotar",
  ]);
  parts.push(`</svg>`);
  fs.writeFileSync(path.join(root, "outputs/plans/a1_plan_situatie.svg"), parts.join("\n"));
}

// —— Situație fundații ——
{
  const parts = [];
  drawCommonBase(parts, { title: "A1 · Situație fundații / subsol", arch: false });
  drawFoundations(parts);
  drawStreets(parts);
  drawNorth(parts);
  drawSetbackDims(parts);
  drawCartouche(parts, `Tălpi + retenții vs hotar CF · B200 studiu`, [
    "Pad-uri / grinzi fundație (brun) · retenții (albastru) · cutie (roșu)",
    "Fără parcări/mobilier — verificare retrageri față de hotar",
    "Nu e plan de armare · nu autorizabil · rev. A1.204",
  ]);
  parts.push(`</svg>`);
  fs.writeFileSync(path.join(root, "outputs/plans/a1_plan_situatie_fundatii.svg"), parts.join("\n"));
}

const md = `# S1 A1 — Plan situație (A1.204)

**Fișiere:**
- [\`a1_plan_situatie.svg\`](../plans/a1_plan_situatie.svg) — arhitectură / sit
- [\`a1_plan_situatie_fundatii.svg\`](../plans/a1_plan_situatie_fundatii.svg) — tălpi + retenții vs hotar

| Metrică | Valoare |
|---------|---------|
| Amprentă | **${areaFoot}** m² |
| Teren | **${areaParcel}** m² |
| POT anvelopă ref. | **${pot}%** |
| Retrageri (cm) | NW ${setbacksCm.NW} · NE ${setbacksCm.NE} · SE ${setbacksCm.SE} · SW ${setbacksCm.SW} |

## Compunere A1.204
- Nord în colț dreapta-sus (nu peste casă)
- Retrageri cu **linie de cotă** colț→hotar
- Cartuș scurt + scară 5 m
- Două planșe: sit vs fundații

\`\`\`
node src/export_a1_site_plan_v01.mjs
\`\`\`
`;
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_site_plan_v01.md"), md);
console.log(
  JSON.stringify(
    { ok: true, pot, setbacksCm, areaFoot, areaParcel, W: +W.toFixed(0), H: +H.toFixed(0) },
    null,
    2
  )
);
