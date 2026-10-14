/**
 * Livrabile V45 + comparație V44. Surse: v45_exact.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const write = (rel, content) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof content === "string" ? content : JSON.stringify(content, null, 2));
  return p;
};
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function shoelaceCm2(verts) {
  const v =
    verts[0][0] === verts[verts.length - 1][0] && verts[0][1] === verts[verts.length - 1][1]
      ? verts.slice(0, -1)
      : verts;
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    const [x1, y1] = v[i];
    const [x2, y2] = v[(i + 1) % v.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}
function rectArea(r) {
  return r.dx * r.dy;
}
function rectIntersectArea(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.dx, b.x + b.dx);
  const y1 = Math.min(a.y + a.dy, b.y + b.dy);
  if (x1 <= x0 || y1 <= y0) return 0;
  return (x1 - x0) * (y1 - y0);
}
function clipIntWall(w) {
  if (w.id === "perete_comun_est") {
    const y2 = Math.min(w.y + w.dy, 645);
    return { id: w.id, x: w.x, y: w.y, dx: w.dx, dy: Math.max(0, y2 - w.y) };
  }
  return { id: w.id, x: w.x, y: w.y, dx: w.dx, dy: w.dy };
}

function computeAreas(v45) {
  const envCm2 = shoelaceCm2(v45.interior_polygon_cm.vertices);
  const ints = v45.walls_cm.filter((w) => w.kind === "int").map(clipIntWall);
  const wallParts = {};
  let gross = 0;
  for (const w of ints) {
    wallParts[w.id] = rectArea(w);
    gross += wallParts[w.id];
  }
  let overlaps = 0;
  for (let i = 0; i < ints.length; i++) {
    for (let j = i + 1; j < ints.length; j++) overlaps += rectIntersectArea(ints[i], ints[j]);
  }
  const voidIds = new Set(["baie_usa", "dorm_usa"]);
  const openingsVoid = {};
  let voidA = 0;
  for (const o of v45.openings_cm) {
    if (!voidIds.has(o.id)) continue;
    let vA = 0;
    for (const w of ints) vA += rectIntersectArea(w, o);
    openingsVoid[o.id] = vA;
    voidA += vA;
  }
  const wallNet = gross - overlaps - voidA;
  const usefulGeom = (envCm2 - wallNet) / 10000;

  const dorm = v45.rooms_cm.find((r) => r.id === "dormitor");
  const nisa = v45.rooms_cm.find((r) => r.id === "nisa_dulap");
  const ter = v45.rooms_cm.find((r) => r.id === "terasa");
  const sc = v45.rooms_cm.find((r) => r.id === "scara");

  // baie: poligon aproximativ — bază până la Y270 X30–347.5 minus nișă cut
  const bathBase = (317.5 * 240) / 10000; // rooms baie rect
  const nicheCut = ((162.5 - 30) * (270 - 187.5)) / 10000;
  const bathNet = bathBase - nicheCut;

  const dormPrincipal = (dorm.dx * dorm.dy) / 10000;
  const dormNisa = (nisa.dx * nisa.dy) / 10000;
  const terracePlaca = (ter.dx * ter.dy) / 10000;
  const terraceLib = ((ter.dx - 10) * (ter.dy - 10)) / 10000;

  return {
    envelopeShoelace: envCm2 / 10000,
    wallPartsCm2: wallParts,
    wallsGross: gross / 10000,
    wallsOverlaps: overlaps / 10000,
    openingsVoidCm2: openingsVoid,
    openingsVoid: voidA / 10000,
    wallsNet: wallNet / 10000,
    usefulGeom,
    // utilă „după reguli aplicabile” — aici = geometrică netă; NU e certificat autorizare
    usefulRegulatoryNote: "egală cu util geometric din model; reguli autorizare (POT pe 147 etc.) separate",
    dormPrincipal,
    dormNisa,
    bathBase,
    nicheCut,
    bathNet,
    terracePlaca,
    terraceLib,
    stair: (sc.dx * sc.dy) / 10000,
    env: (v45.envelope_cm.ew * v45.envelope_cm.ns) / 10000,
  };
}

function dimH(parts, px, py, x0, x1, y, label, color = "#986944") {
  const mid = (x0 + x1) / 2;
  parts.push(`<line x1="${px(x0)}" y1="${py(y)}" x2="${px(x1)}" y2="${py(y)}" stroke="${color}" stroke-width="0.8"/>`);
  parts.push(`<line x1="${px(x0)}" y1="${py(y) - 4}" x2="${px(x0)}" y2="${py(y) + 4}" stroke="${color}"/>`);
  parts.push(`<line x1="${px(x1)}" y1="${py(y) - 4}" x2="${px(x1)}" y2="${py(y) + 4}" stroke="${color}"/>`);
  parts.push(
    `<text x="${px(mid)}" y="${py(y) - 6}" text-anchor="middle" font-size="7.5" fill="${color}" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(label)}</text>`
  );
}
function dimV(parts, px, py, x, y0, y1, label, color = "#986944") {
  const mid = (y0 + y1) / 2;
  parts.push(`<line x1="${px(x)}" y1="${py(y0)}" x2="${px(x)}" y2="${py(y1)}" stroke="${color}" stroke-width="0.8"/>`);
  parts.push(
    `<text x="${px(x) - 8}" y="${py(mid)}" text-anchor="middle" font-size="7.5" fill="${color}" font-family="IBM Plex Sans,Segoe UI,sans-serif" transform="rotate(-90 ${px(x) - 8} ${py(mid)})">${esc(label)}</text>`
  );
}

function doorArc(parts, px, py, S, o) {
  const leaf = o.leaf;
  if (leaf?.hinge_x == null) return;
  const hx = leaf.hinge_x;
  const hy = leaf.hinge_y;
  const R = leaf.width_cm;
  const open = leaf.open_leaf;
  parts.push(`<circle cx="${px(hx)}" cy="${py(hy)}" r="2.5" fill="#1d4f91"/>`);
  // closed stub
  if (leaf.swing === "into_terrace_west" || leaf.swing === "into_kitchen_west") {
    parts.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx)}" y2="${py(hy + R)}" stroke="#1d4f91" stroke-width="1.4"/>`);
    parts.push(`<line x1="${px(open.x0)}" y1="${py(open.y0)}" x2="${px(open.x1)}" y2="${py(open.y1)}" stroke="#1d4f91" stroke-width="2"/>`);
    parts.push(
      `<path d="M ${px(hx)} ${py(hy + R)} A ${R * S} ${R * S} 0 0 1 ${px(open.x1)} ${py(open.y1)}" fill="none" stroke="#1d4f91" stroke-dasharray="3 2"/>`
    );
  } else if (leaf.swing === "into_bedroom_west") {
    parts.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx)}" y2="${py(hy + R)}" stroke="#1d4f91" stroke-width="1.4"/>`);
    parts.push(`<line x1="${px(open.x0)}" y1="${py(open.y0)}" x2="${px(open.x1)}" y2="${py(open.y1)}" stroke="#1d4f91" stroke-width="2"/>`);
    parts.push(
      `<path d="M ${px(hx)} ${py(hy + R)} A ${R * S} ${R * S} 0 0 1 ${px(open.x1)} ${py(open.y1)}" fill="none" stroke="#1d4f91" stroke-dasharray="3 2"/>`
    );
  } else if (leaf.swing === "into_bath_west") {
    // hinge south: closed north along -Y from hinge, open west
    parts.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx)}" y2="${py(hy - R)}" stroke="#1d4f91" stroke-width="1.4"/>`);
    parts.push(`<line x1="${px(open.x0)}" y1="${py(open.y0)}" x2="${px(open.x1)}" y2="${py(open.y1)}" stroke="#1d4f91" stroke-width="2"/>`);
    parts.push(
      `<path d="M ${px(hx)} ${py(hy - R)} A ${R * S} ${R * S} 0 0 0 ${px(open.x1)} ${py(open.y1)}" fill="none" stroke="#1d4f91" stroke-dasharray="3 2"/>`
    );
  }
}

function drawStairs(parts, px, py, S, v) {
  const st = v.stair_cm;
  const tread = st.tread_cm;
  const f180 = st.flight_180;
  const r2 = st.ramp2;
  const pod = st.podest_se;
  const pal = st.palier_superior;
  parts.push(
    `<defs><marker id="arr45" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2d5a27"/></marker></defs>`
  );
  for (let i = 0; i < 7; i++) {
    const x = f180.x + i * tread;
    const fill = i % 2 ? "#c4b090" : "#b8a480";
    parts.push(
      `<rect x="${px(x)}" y="${py(f180.y + 10)}" width="${tread * S}" height="${st.width_clear_cm * S}" fill="${fill}" stroke="#444" stroke-width="0.5"/>`
    );
  }
  parts.push(
    `<rect x="${px(pod.x)}" y="${py(pod.y)}" width="${pod.dx * S}" height="${pod.dy * S}" fill="#c4b496" stroke="#444"/>`
  );
  const ySouthEdge = r2.y + r2.dy;
  for (let i = 0; i < 9; i++) {
    const yS = ySouthEdge - (i + 1) * tread;
    const fill = i % 2 ? "#8a93a0" : "#9aa3ad";
    parts.push(
      `<rect x="${px(r2.x + 10)}" y="${py(yS)}" width="${st.width_clear_cm * S}" height="${tread * S}" fill="${fill}" stroke="#333" stroke-width="0.5"/>`
    );
  }
  parts.push(
    `<rect x="${px(pal.x)}" y="${py(pal.y)}" width="${pal.dx * S}" height="${pal.dy * S}" fill="#9aa3ad" stroke="#222"/>`
  );
  parts.push(
    `<text x="${px(pal.x + 55)}" y="${py(pal.y + 55)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">PALIER +288</text>`
  );
}

function planSvg(v45, areas) {
  const S = 0.55;
  const M = 90;
  const W = v45.envelope_cm.ew;
  const L = v45.envelope_cm.ns;
  const px = (x) => M + x * S;
  const py = (y) => M + y * S;
  const svgW = M * 2 + W * S + 400;
  const svgH = M * 2 + L * S + 140;
  const parts = [];

  parts.push(
    `<text x="${svgW / 2}" y="22" text-anchor="middle" font-size="15" font-family="IBM Plex Sans,Segoe UI,sans-serif">V45 · plan cotat (capturi + brief)</text>`
  );
  parts.push(
    `<text x="${svgW / 2}" y="40" text-anchor="middle" font-size="10" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">util geom. ${areas.usefulGeom.toFixed(4)} m² · baie net ~${areas.bathNet.toFixed(2)} · terasă liberă ${areas.terraceLib.toFixed(2)} · V44 păstrat</text>`
  );
  parts.push(
    `<rect x="${px(0)}" y="${py(0)}" width="${W * S}" height="${L * S}" fill="#f7f4ef" stroke="#222" stroke-width="2"/>`
  );
  const poly = v45.interior_polygon_cm.vertices;
  parts.push(
    `<polygon points="${poly.map(([x, y]) => `${px(x)},${py(y)}`).join(" ")}" fill="#e8efe4" fill-opacity="0.28" stroke="#2d5a27" stroke-width="1.2" stroke-dasharray="6 3"/>`
  );

  for (const r of v45.rooms_cm) {
    if (r.id === "scara") continue;
    parts.push(
      `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="${r.floor || "#fff"}" stroke="#666" stroke-width="0.7" opacity="${r.outdoor ? 0.75 : 0.5}"/>`
    );
    if (r.dx * S > 30) {
      parts.push(
        `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy / 2)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(r.label)}</text>`
      );
    }
  }
  drawStairs(parts, px, py, S, v45);

  for (const w of v45.walls_cm) {
    parts.push(
      `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="${w.kind === "ext" ? "#333" : "#777"}"/>`
    );
  }
  for (const p of v45.parapets_cm || []) {
    parts.push(
      `<rect x="${px(p.x)}" y="${py(p.y)}" width="${p.dx * S}" height="${p.dy * S}" fill="#5a6570" opacity="0.85"/>`
    );
  }
  for (const o of v45.openings_cm) {
    parts.push(
      `<rect x="${px(o.x)}" y="${py(o.y)}" width="${Math.max(o.dx, 6) * S}" height="${Math.max(o.dy, 6) * S}" fill="#9ec5e8" stroke="#1d4f91"/>`
    );
    if (o.leaf) doorArc(parts, px, py, S, o);
  }

  const furn = [...v45.furniture_cm].sort((a, b) => (a.draw_order || 0) - (b.draw_order || 0));
  for (const f of furn) {
    if (f.id === "cuptor") continue; // same footprint as plita in plan
    parts.push(
      `<rect x="${px(f.x)}" y="${py(f.y)}" width="${f.dx * S}" height="${f.dy * S}" fill="${f.color || "#aaa"}" stroke="#222" stroke-width="0.5"/>`
    );
    if (f.glass) {
      const g = f.glass;
      parts.push(
        `<rect x="${px(g.x)}" y="${py(g.y)}" width="${Math.max(g.dx, 3) * S}" height="${g.dy * S}" fill="#a8d4e8" opacity="0.7" stroke="#4a7a90"/>`
      );
    }
    if (f.use_zone) {
      const u = f.use_zone;
      parts.push(
        `<rect x="${px(u.x)}" y="${py(u.y)}" width="${u.dx * S}" height="${u.dy * S}" fill="none" stroke="#c44" stroke-dasharray="2 2"/>`
      );
    }
    if (f.niche_clear_cm) {
      const n = f.niche_clear_cm;
      parts.push(
        `<rect x="${px(n.x)}" y="${py(n.y)}" width="${n.dx * S}" height="${n.dy * S}" fill="none" stroke="#2d5a27" stroke-dasharray="3 2"/>`
      );
    }
    if (f.dx * S > 14) {
      parts.push(
        `<text x="${px(f.x + f.dx / 2)}" y="${py(f.y + f.dy / 2) + 3}" text-anchor="middle" font-size="6" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(f.id)}</text>`
      );
    }
  }

  // warn: chair vs sofa
  parts.push(
    `<rect x="${px(465)}" y="${py(215)}" width="${110 * S}" height="${50 * S}" fill="#e8a0a0" opacity="0.25" stroke="#a33" stroke-dasharray="3 2"/>`
  );

  dimH(parts, px, py, 0, W, -18, `${W}`);
  dimV(parts, px, py, -22, 0, L, `${L}`);
  dimH(parts, px, py, 30, 347.5, 20, "baie→347.5");
  dimH(parts, px, py, 30, 150, 195, "nișă 120");
  dimV(parts, px, py, 18, 282.5, 645, "362.5");
  dimH(parts, px, py, 30, 347.5, 635, "317.5");
  dimH(parts, px, py, 0, 330, 665, "terasă 330");
  dimV(parts, px, py, 340, 675, 860, "185");
  dimV(parts, px, py, 525, 485, 575, "intrare 90");
  dimV(parts, px, py, 370, 680, 770, "buc 90");
  dimH(parts, px, py, 450, 590, 270, "masă 140");
  dimH(parts, px, py, 360, 650, 50, "living 290");

  const lx = svgW - 370;
  parts.push(`<rect x="${lx}" y="52" width="350" height="580" fill="#fff" stroke="#333"/>`);
  const lines = [
    ["V45 — suprafețe (fără preluare V44)", 11, "#111"],
    [`Anvelopă: ${areas.envelopeShoelace.toFixed(4)} m²`, 10, "#333"],
    [`− pereți int net: ${areas.wallsNet.toFixed(4)}`, 10, "#333"],
    [`= util geom.: ${areas.usefulGeom.toFixed(4)} m²`, 12, "#2d5a27"],
    [`Dorm 317.5×362.5: ${areas.dormPrincipal.toFixed(4)}`, 10, "#333"],
    [`+ nișă 120×70: ${areas.dormNisa.toFixed(4)}`, 10, "#333"],
    [`Baie net ≈ ${areas.bathNet.toFixed(4)}`, 10, "#333"],
    [`Terasă placă/liber: ${areas.terracePlaca.toFixed(3)} / ${areas.terraceLib.toFixed(2)}`, 10, "#333"],
    ["", 6, "#333"],
    ["Intrare pe VEST palier Y485–575", 10, "#1d4f91"],
    ["Frigider mutat Y590 (vs ușă)", 10, "#986944"],
    ["MS EW7W368SI sub blat baie", 10, "#333"],
    ["Fără culoar 40 / nișă MS living", 10, "#2d5a27"],
    ["⚠ scaun N ↔ canapea 5 cm", 10, "#a33"],
    ["⚠ canapea desfăcută neconfirmată", 10, "#a33"],
    ["⚠ gol buc–terasă montaj TBD", 10, "#986944"],
    ["Ipoteze: placă15 · +32 · WC15", 9, "#666"],
  ];
  let yy = 74;
  for (const [t, fs, c] of lines) {
    if (!t) {
      yy += 6;
      continue;
    }
    parts.push(
      `<text x="${lx + 12}" y="${yy}" font-size="${fs}" fill="${c}" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(t)}</text>`
    );
    yy += fs + 5;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  ${parts.join("\n  ")}
</svg>`;
}

function surfacesMd(v45, areas, v44a) {
  let md = `# V45 — suprafețe\n\n`;
  md += `Recalculate din poligoane V45 — **fără preluare V44**.\n\n`;
  md += `## Util geometric vs utilă\n\n`;
  md += `| Tip | Valoare |\n|-----|--------|\n`;
  md += `| Anvelopă shoelace | ${areas.envelopeShoelace.toFixed(6)} m² |\n`;
  md += `| Pereți int net | ${areas.wallsNet.toFixed(6)} m² |\n`;
  md += `| **Util geometric (model)** | **${areas.usefulGeom.toFixed(6)} m²** |\n`;
  md += `| Utilă după reguli autorizare | *nu substituită aici*; POT pe teren CF **147 m²** |\n\n`;
  md += `${areas.usefulRegulatoryNote}\n\n`;
  md += `## Camere\n\n`;
  md += `| | V45 | V44 |\n|--|-----|-----|\n`;
  md += `| Dorm principal | ${areas.dormPrincipal.toFixed(4)} | ${Number(v44a?.dorm_principal_m2 ?? 11.5094).toFixed(4)} |\n`;
  md += `| Nișă dulap | ${areas.dormNisa.toFixed(4)} (120×70) | ${Number(v44a?.dorm_nisa_m2 ?? 0.72).toFixed(4)} (120×60) |\n`;
  md += `| Baie net | ${areas.bathNet.toFixed(4)} | ${Number(v44a?.bath_net_m2 ?? 5.0019).toFixed(4)} |\n`;
  md += `| Terasă placă | ${areas.terracePlaca.toFixed(3)} | ${Number(v44a?.terrace_placa_m2 ?? 6.6).toFixed(3)} |\n`;
  md += `| Terasă liberă | **${areas.terraceLib.toFixed(2)}** (320×175) | ${Number(v44a?.terrace_libera_m2 ?? 6.08).toFixed(2)} (nu 320×190) |\n`;
  md += `| Util geom. | **${areas.usefulGeom.toFixed(4)}** | ${Number(v44a?.useful_interior_net_m2 ?? 37.6181).toFixed(4)} |\n\n`;
  md += `\`\`\`\nPereți cm²: ${JSON.stringify(areas.wallPartsCm2, null, 2)}\nGoluri: ${JSON.stringify(areas.openingsVoidCm2)}\n\`\`\`\n`;
  return md;
}

function reportMd(v45, areas, v44a) {
  const corr = (v45.corrections_applied || []).map((c) => `- **${c.id}**: ${c.change}`).join("\n");
  const warns = (v45.warnings_cm || []).map((w) => `- **${w.id}** (${w.severity}): ${w.note}`).join("\n");
  const cl = v45.clearances_cm || {};
  return `# V45 — raport + comparație V44

## Stabilizat față de V44
- Baie comună pe X347,5 cu uși separate (fără culoar 40 cm / nișă MS living)
- Terasă **330×185** placă / **320×175** liber (nu 320×190 V44)
- Intrare pe **vest palier** Y485–575 (nu nord ca V44)
- Masă **140×80** + 4 scaune N/S
- MS **EW7W368SI** sub blat baie

## Util
| | V45 | V44 |
|--|-----|-----|
| Anvelopă | ${areas.envelopeShoelace.toFixed(4)} | ${Number(v44a?.envelope_interior_shoelace_m2 ?? 38.8025).toFixed(4)} |
| Util geom. | **${areas.usefulGeom.toFixed(4)}** | ${Number(v44a?.useful_interior_net_m2 ?? 37.6181).toFixed(4)} |
| Δ | **${(areas.usefulGeom - Number(v44a?.useful_interior_net_m2 ?? 37.6181)).toFixed(4)}** | |

## Corecție minimă aplicată
${corr}

## Clearances (geometrice)
- Pat ↔ foaie dorm: ${cl.bed_to_door_leaf_cm} cm
- Scaun N ↔ canapea: **${cl.chair_n_to_sofa_cm} cm**
- Intrare ↔ frigider (după mutare): ${cl.entry_to_fridge_after_fix_cm} cm
- WC use frontal: ${cl.wc_front_use_depth_cm} cm
- Duș acces: ${cl.shower_access_width_cm} cm

## Avertismente / ipoteze
${warns}

## Ipoteze păstrate
Placă 15 · elevație +32 · cadastru 147 (POT) / poligon ≈145,7 · amplasare neschimbată · WC cadru 15

## Nu s-a declarat «verificat»
Elemente schematice: tâmplărie dorm–terasă, montaj gol buc–terasă, canapea desfăcută, conformitate WC cu mâner, fronturi dulap vs adâncime haine.
`;
}

function main() {
  const v45 = read("data/building/v45_exact.json");
  const v44 = read("data/building/v44_exact.json");
  const areas = computeAreas(v45);
  const v44a = v44.areas_cm;

  v45.areas_cm.envelope_interior_shoelace_m2 = areas.envelopeShoelace;
  v45.areas_cm.interior_walls_gross_m2 = areas.wallsGross;
  v45.areas_cm.interior_walls_overlaps_m2 = areas.wallsOverlaps;
  v45.areas_cm.interior_walls_openings_void_m2 = areas.openingsVoid;
  v45.areas_cm.interior_walls_net_m2 = areas.wallsNet;
  v45.areas_cm.useful_geometric_m2 = areas.usefulGeom;
  v45.areas_cm.useful_interior_m2 = areas.usefulGeom;
  v45.areas_cm.useful_interior_net_m2 = areas.usefulGeom;
  v45.areas_cm.decomposition = `${areas.envelopeShoelace.toFixed(4)} − ${areas.wallsNet.toFixed(4)} = ${areas.usefulGeom.toFixed(4)} m²`;
  v45.areas_cm.dorm_principal_m2 = areas.dormPrincipal;
  v45.areas_cm.dorm_nisa_m2 = areas.dormNisa;
  v45.areas_cm.bath_base_m2 = areas.bathBase;
  v45.areas_cm.bath_niche_cut_m2 = areas.nicheCut;
  v45.areas_cm.bath_net_m2 = areas.bathNet;
  v45.areas_cm.terrace_placa_m2 = areas.terracePlaca;
  v45.areas_cm.terrace_libera_m2 = areas.terraceLib;
  v45.areas_cm.stair_band_m2 = areas.stair;
  v45.areas_cm.envelope_gross_m2 = areas.env;
  v45.areas_cm.wall_parts_cm2 = areas.wallPartsCm2;
  v45.areas_cm.openings_void_cm2 = areas.openingsVoidCm2;
  v45.areas_cm.method =
    "shoelace(anvelopă) − reuniune pereți int (−goluri); util geometric ≠ certificat autorizare";

  write("data/building/v45_exact.json", JSON.stringify(v45, null, 2) + "\n");
  write("viewer/data/v45_exact.json", JSON.stringify(v45, null, 2) + "\n");
  write("outputs/plans/10_v45_exact_plan.svg", planSvg(v45, areas));
  write("outputs/reports/v45_exact_surfaces.md", surfacesMd(v45, areas, v44a));
  write(
    "outputs/reports/v45_exact_surfaces.json",
    JSON.stringify(
      {
        ...areas,
        comparison_v44: {
          useful_net_m2: v44a.useful_interior_net_m2,
          terrace_libera_m2: v44a.terrace_libera_m2,
          bath_net_m2: v44a.bath_net_m2,
        },
        corrections: v45.corrections_applied,
        warnings: v45.warnings_cm,
        generated: new Date().toISOString(),
      },
      null,
      2
    )
  );
  write("outputs/reports/v45_vs_v44.md", reportMd(v45, areas, v44a));
  write("outputs/reports/v45_exact_changelog.md", reportMd(v45, areas, v44a));

  console.log(
    JSON.stringify(
      {
        ok: true,
        rev: "v45",
        useful_geom_m2: areas.usefulGeom,
        bath_net_m2: areas.bathNet,
        terrace_libera_m2: areas.terraceLib,
        delta_vs_v44: areas.usefulGeom - (v44a.useful_interior_net_m2 || 37.6181),
        correction: "frigider → Y590",
        plan: "outputs/plans/10_v45_exact_plan.svg",
      },
      null,
      2
    )
  );
}

main();
