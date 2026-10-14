/**
 * Livrabile V44 + comparație cu V43. Aceeași geometrie ca 3D.
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

/** Clip int walls to interior polygon (south of dorm Y630 outside). */
function clipIntWall(w) {
  if (w.id === "dormitor_est") {
    const y2 = Math.min(w.y + w.dy, 630);
    return { id: w.id, x: w.x, y: w.y, dx: w.dx, dy: Math.max(0, y2 - w.y) };
  }
  return { id: w.id, x: w.x, y: w.y, dx: w.dx, dy: w.dy };
}

function computeAreas(v44) {
  const envCm2 = shoelaceCm2(v44.interior_polygon_cm.vertices);
  const ints = v44.walls_cm.filter((w) => w.kind === "int").map(clipIntWall);
  const wallParts = {};
  let gross = 0;
  for (const w of ints) {
    const a = rectArea(w);
    wallParts[w.id] = a;
    gross += a;
  }
  let overlaps = 0;
  for (let i = 0; i < ints.length; i++) {
    for (let j = i + 1; j < ints.length; j++) {
      overlaps += rectIntersectArea(ints[i], ints[j]);
    }
  }
  // openings that void int walls
  const voidIds = new Set(["baie_usa", "dorm_usa"]);
  const openingsVoid = {};
  let voidA = 0;
  for (const o of v44.openings_cm) {
    if (!voidIds.has(o.id)) continue;
    let vA = 0;
    for (const w of ints) vA += rectIntersectArea(w, o);
    openingsVoid[o.id] = vA;
    voidA += vA;
  }
  const wallNet = gross - overlaps - voidA;
  const usefulNet = (envCm2 - wallNet) / 10000;

  // Room breakdowns (explicit, not inherited)
  const dormP = v44.rooms_cm.find((r) => r.id === "dormitor");
  const nisa = v44.rooms_cm.find((r) => r.id === "nisa_dulap");
  const baie = v44.rooms_cm.find((r) => r.id === "baie");
  const ter = v44.rooms_cm.find((r) => r.id === "terasa");
  const sc = v44.rooms_cm.find((r) => r.id === "scara");

  const dormPrincipal = (dormP.dx * dormP.dy) / 10000;
  const dormNisa = (nisa.dx * nisa.dy) / 10000;
  // walls of niche (structure touching dorm/bath)
  const nisaSpate = v44.walls_cm.find((w) => w.id === "nisa_dulap_spate");
  const nisaEst = v44.walls_cm.find((w) => w.id === "nisa_dulap_est");
  const nisaWalls = (rectArea(nisaSpate) + rectArea(nisaEst)) / 10000;

  // bath: base rect minus niche cut (X30–162.5, Y182.5–255)
  const bathBase = (baie.dx * baie.dy) / 10000;
  const nicheCut = ((162.5 - 30) * (255 - 182.5)) / 10000;
  const bathNet = bathBase - nicheCut;

  const terracePlaca = (ter.dx * ter.dy) / 10000;
  const terraceLib = ((ter.dx - 10) * (ter.dy - 10)) / 10000;
  const stair = (sc.dx * sc.dy) / 10000;
  const env = (v44.envelope_cm.ew * v44.envelope_cm.ns) / 10000;

  return {
    envelopeShoelace: envCm2 / 10000,
    wallPartsCm2: wallParts,
    wallsGross: gross / 10000,
    wallsOverlaps: overlaps / 10000,
    openingsVoidCm2: openingsVoid,
    openingsVoid: voidA / 10000,
    wallsNet: wallNet / 10000,
    usefulNet,
    dormPrincipal,
    dormNisa,
    dormNisaWalls: nisaWalls,
    dormNetApprox: dormPrincipal + dormNisa,
    bathBase,
    nicheCut,
    bathNet,
    terracePlaca,
    terraceLib,
    stair,
    env,
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
  parts.push(`<line x1="${px(x) - 4}" y1="${py(y0)}" x2="${px(x) + 4}" y2="${py(y0)}" stroke="${color}"/>`);
  parts.push(`<line x1="${px(x) - 4}" y1="${py(y1)}" x2="${px(x) + 4}" y2="${py(y1)}" stroke="${color}"/>`);
  parts.push(
    `<text x="${px(x) - 8}" y="${py(mid)}" text-anchor="middle" font-size="7.5" fill="${color}" font-family="IBM Plex Sans,Segoe UI,sans-serif" transform="rotate(-90 ${px(x) - 8} ${py(mid)})">${esc(label)}</text>`
  );
}

function doorArc(parts, px, py, S, o) {
  const leaf = o.leaf;
  if (!leaf || leaf.hinge_x == null) return;
  const hx = leaf.hinge_x;
  const hy = leaf.hinge_y;
  const R = leaf.width_cm;
  const open = leaf.open_leaf;
  parts.push(`<circle cx="${px(hx)}" cy="${py(hy)}" r="2.5" fill="#1d4f91"/>`);
  if (leaf.swing === "into_kitchen") {
    parts.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx)}" y2="${py(hy + R)}" stroke="#1d4f91" stroke-width="1.5"/>`);
    parts.push(`<line x1="${px(open.x0)}" y1="${py(open.y0)}" x2="${px(open.x1)}" y2="${py(open.y1)}" stroke="#1d4f91" stroke-width="2"/>`);
    parts.push(
      `<path d="M ${px(hx)} ${py(hy + R)} A ${R * S} ${R * S} 0 0 0 ${px(open.x1)} ${py(open.y1)}" fill="none" stroke="#1d4f91" stroke-dasharray="3 2"/>`
    );
  } else if (leaf.swing === "into_living_north") {
    parts.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx + R)}" y2="${py(hy)}" stroke="#1d4f91" stroke-width="1.5"/>`);
    parts.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx)}" y2="${py(hy - R)}" stroke="#1d4f91" stroke-width="2"/>`);
    parts.push(
      `<path d="M ${px(hx + R)} ${py(hy)} A ${R * S} ${R * S} 0 0 0 ${px(hx)} ${py(hy - R)}" fill="none" stroke="#1d4f91" stroke-dasharray="3 2"/>`
    );
  } else if (leaf.swing === "into_bedroom_west" || leaf.swing === "into_bath_west") {
    parts.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx)}" y2="${py(hy + R)}" stroke="#1d4f91" stroke-width="1.5"/>`);
    parts.push(`<line x1="${px(open.x0)}" y1="${py(open.y0)}" x2="${px(open.x1)}" y2="${py(open.y1)}" stroke="#1d4f91" stroke-width="2"/>`);
    parts.push(
      `<path d="M ${px(hx)} ${py(hy + R)} A ${R * S} ${R * S} 0 0 1 ${px(open.x1)} ${py(open.y1)}" fill="none" stroke="#1d4f91" stroke-dasharray="3 2"/>`
    );
  }
}

function drawStairs(parts, px, py, S, v44) {
  const st = v44.stair_cm;
  const tread = st.tread_cm;
  const f180 = st.flight_180;
  const r2 = st.ramp2;
  const pod = st.podest_se;
  const pal = st.palier_superior;
  parts.push(
    `<defs><marker id="arr44" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2d5a27"/></marker></defs>`
  );
  for (let i = 0; i < 7; i++) {
    const x = f180.x + i * tread;
    const fill = i % 2 ? "#c4b090" : "#b8a480";
    parts.push(
      `<rect x="${px(x)}" y="${py(f180.y + 10)}" width="${tread * S}" height="${st.width_clear_cm * S}" fill="${fill}" stroke="#444" stroke-width="0.5"/>`
    );
  }
  parts.push(
    `<line x1="${px(f180.x + 20)}" y1="${py(f180.y + 70)}" x2="${px(f180.x + 190)}" y2="${py(f180.y + 70)}" stroke="#2d5a27" stroke-width="1.5" marker-end="url(#arr44)"/>`
  );
  parts.push(
    `<rect x="${px(pod.x)}" y="${py(pod.y)}" width="${pod.dx * S}" height="${pod.dy * S}" fill="#c4b496" stroke="#444"/>`
  );
  parts.push(
    `<text x="${px(pod.x + 55)}" y="${py(pod.y + 50)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">PODEST +128</text>`
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

function planSvg(v44, areas) {
  const S = 0.55;
  const M = 90;
  const W = v44.envelope_cm.ew;
  const L = v44.envelope_cm.ns;
  const px = (x) => M + x * S;
  const py = (y) => M + y * S;
  const svgW = M * 2 + W * S + 400;
  const svgH = M * 2 + L * S + 130;
  const parts = [];

  parts.push(
    `<text x="${svgW / 2}" y="24" text-anchor="middle" font-size="15" font-family="IBM Plex Sans,Segoe UI,sans-serif">V44 · plan cotat (vs V43 păstrat)</text>`
  );
  parts.push(
    `<text x="${svgW / 2}" y="42" text-anchor="middle" font-size="10" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">util net ${areas.usefulNet.toFixed(4)} m² · baie net ~${areas.bathNet.toFixed(2)} · terasă liberă ${areas.terraceLib.toFixed(2)} · FF→FF 288</text>`
  );
  parts.push(
    `<rect x="${px(0)}" y="${py(0)}" width="${W * S}" height="${L * S}" fill="#f7f4ef" stroke="#222" stroke-width="2"/>`
  );

  const poly = v44.interior_polygon_cm.vertices;
  parts.push(
    `<polygon points="${poly.map(([x, y]) => `${px(x)},${py(y)}`).join(" ")}" fill="#e8efe4" fill-opacity="0.28" stroke="#2d5a27" stroke-width="1.2" stroke-dasharray="6 3"/>`
  );

  for (const r of v44.rooms_cm) {
    if (r.id === "scara") continue;
    const op = r.outdoor ? 0.75 : r.id === "culoar_baie" ? 0.7 : 0.5;
    parts.push(
      `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="${r.floor || "#fff"}" stroke="#666" stroke-width="0.7" opacity="${op}"/>`
    );
    if (r.dx * S > 28) {
      parts.push(
        `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy / 2)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(r.label)}</text>`
      );
    }
  }

  drawStairs(parts, px, py, S, v44);

  for (const w of v44.walls_cm) {
    parts.push(
      `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="${w.kind === "ext" ? "#333" : "#777"}"/>`
    );
  }
  for (const p of v44.parapets_cm || []) {
    parts.push(
      `<rect x="${px(p.x)}" y="${py(p.y)}" width="${p.dx * S}" height="${p.dy * S}" fill="#5a6570" opacity="0.85"/>`
    );
  }

  for (const o of v44.openings_cm) {
    parts.push(
      `<rect x="${px(o.x)}" y="${py(o.y)}" width="${Math.max(o.dx, 6) * S}" height="${Math.max(o.dy, 6) * S}" fill="#9ec5e8" stroke="#1d4f91"/>`
    );
    if (o.leaf) doorArc(parts, px, py, S, o);
  }

  const furn = [...v44.furniture_cm].sort((a, b) => (a.draw_order || 0) - (b.draw_order || 0));
  for (const f of furn) {
    parts.push(
      `<rect x="${px(f.x)}" y="${py(f.y)}" width="${f.dx * S}" height="${f.dy * S}" fill="${f.color || "#aaa"}" stroke="#222" stroke-width="0.5"/>`
    );
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
    if (f.dx * S > 16) {
      parts.push(
        `<text x="${px(f.x + f.dx / 2)}" y="${py(f.y + f.dy / 2) + 3}" text-anchor="middle" font-size="6" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(f.id)}</text>`
      );
    }
  }

  // warning hatches
  parts.push(
    `<rect x="${px(307.5)}" y="${py(105)}" width="${40 * S}" height="${150 * S}" fill="#e8a0a0" opacity="0.35" stroke="#a33" stroke-dasharray="4 2"/>`
  );
  parts.push(
    `<text x="${px(327)}" y="${py(180)}" text-anchor="middle" font-size="7" fill="#a33" font-family="IBM Plex Sans,Segoe UI,sans-serif">40 cm!</text>`
  );

  // dimensions
  dimH(parts, px, py, 0, W, -18, `${W}`);
  dimV(parts, px, py, -22, 0, L, `${L}`);
  dimH(parts, px, py, 30, 295, 18, "baie 265");
  dimH(parts, px, py, 30, 150, 190, "nișă 120");
  dimV(parts, px, py, 18, 267.5, 630, "dorm 362.5");
  dimH(parts, px, py, 30, 347.5, 620, "317.5");
  dimH(parts, px, py, 0, 330, 650, "terasă 330");
  dimV(parts, px, py, 340, 660, 860, "200");
  dimV(parts, px, py, 370, 670, 760, "gol 90");
  dimH(parts, px, py, 360, 535, 800, "blat 175");
  dimV(parts, px, py, 340, 277, 367, "ușă 90");
  dimH(parts, px, py, 307.5, 372.5, 25, "MS 65");

  const lx = svgW - 370;
  parts.push(`<rect x="${lx}" y="55" width="350" height="560" fill="#fff" stroke="#333"/>`);
  const lines = [
    ["V44 — suprafețe verificate", 12, "#111"],
    [`Anvelopă shoelace: ${areas.envelopeShoelace.toFixed(4)} m²`, 10, "#333"],
    [`− pereți int net: ${areas.wallsNet.toFixed(4)} m²`, 10, "#333"],
    [`= UTIL NET: ${areas.usefulNet.toFixed(4)} m²`, 12, "#2d5a27"],
    ["", 6, "#333"],
    [`Dorm principal 317.5×362.5: ${areas.dormPrincipal.toFixed(4)}`, 10, "#333"],
    [`+ nișă dulap 120×60: ${areas.dormNisa.toFixed(4)}`, 10, "#333"],
    [`  (pereți nișă ${areas.dormNisaWalls.toFixed(4)} în util−)`, 9, "#666"],
    [`Baie bază 265×225: ${areas.bathBase.toFixed(4)}`, 10, "#333"],
    [`− tăietură nișă: ${areas.nicheCut.toFixed(4)}`, 10, "#333"],
    [`= baie net ≈ ${areas.bathNet.toFixed(4)} m²`, 11, "#2d5a27"],
    [`Terasă placă: ${areas.terracePlaca.toFixed(2)} (=6,60)`, 10, "#333"],
    [`Terasă liberă: ${areas.terraceLib.toFixed(2)} (=6,08)`, 10, "#333"],
    ["", 6, "#333"],
    ["⚠ Culoar→baie 40 cm", 11, "#a33"],
    ["⚠ Gap MS–TV 10 cm (nu traseu)", 10, "#a33"],
    ["⚠ Clear dulap față 12,5 cm", 10, "#986944"],
    ["Gol buc 90 → trecere ~80", 10, "#555"],
    ["hol_ne eliminat · TV pe X347.5", 10, "#333"],
    ["MS+US: aparat, nu depozit", 10, "#333"],
    ["Ipoteze: placă15 · +32 · cadastru", 9, "#666"],
  ];
  let yy = 78;
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

function surfacesMd(v44, areas, v43areas) {
  let md = `# V44 — suprafețe verificate\n\n`;
  md += `Metodă: shoelace(anvelopă interioară) − reuniune pereți int (−goluri). Nu se preiau valori V43 contradictorii.\n\n`;
  md += `## Util global\n\n`;
  md += `| Pas | V44 | V43 (ref) |\n|-----|-----|----------|\n`;
  md += `| Anvelopă shoelace | **${areas.envelopeShoelace.toFixed(4)}** | ${v43areas?.envelope_interior_shoelace_m2?.toFixed?.(4) ?? v43areas?.envelopeShoelace?.toFixed?.(4) ?? "40,3535"} |\n`;
  md += `| Pereți int net | **${areas.wallsNet.toFixed(4)}** | ${v43areas?.interior_walls_net_m2?.toFixed?.(4) ?? "1,1338"} |\n`;
  md += `| **Util net** | **${areas.usefulNet.toFixed(4)}** | ${v43areas?.useful_interior_net_m2?.toFixed?.(4) ?? "39,2197"} |\n\n`;

  md += `## Dormitor (descompunere)\n\n`;
  md += `| Element | m² |\n|---------|-----|\n`;
  md += `| Dreptunghi principal 317,5×362,5 | **${areas.dormPrincipal.toFixed(6)}** |\n`;
  md += `| Nișă dulap 120×60 (pardoseală) | **${areas.dormNisa.toFixed(6)}** |\n`;
  md += `| Pereți nișă (în scăderea globală util) | ${areas.dormNisaWalls.toFixed(6)} |\n`;
  md += `| Sumă principal+nișă (orientativ) | ${areas.dormNetApprox.toFixed(6)} |\n\n`;
  md += `Nu se folosesc 12,23 / 12,36 m².\n\n`;

  md += `## Baie\n\n`;
  md += `| Element | m² |\n|---------|-----|\n`;
  md += `| Bază 265×225 | ${areas.bathBase.toFixed(6)} |\n`;
  md += `| − tăietură nișă (132,5×72,5) | ${areas.nicheCut.toFixed(6)} |\n`;
  md += `| **Net baie** | **${areas.bathNet.toFixed(6)}** (~5,00) |\n\n`;

  md += `## Terasă\n\n`;
  md += `- Placă 330×200 = **${areas.terracePlaca.toFixed(2)} m²** (țintă 6,60)\n`;
  md += `- Liber (parapet V+S 10): 320×190 = **${areas.terraceLib.toFixed(2)} m²** (țintă 6,08)\n\n`;

  md += `## Pereți int (cm²)\n\n\`\`\`\n${JSON.stringify(areas.wallPartsCm2, null, 2)}\nGoluri: ${JSON.stringify(areas.openingsVoidCm2)}\nOverlaps: ${areas.wallsOverlaps}\n\`\`\`\n`;
  return md;
}

function reportMd(v44, areas, v43areas) {
  const warns = (v44.warnings_cm || []).map((w) => `- **${w.id}** (${w.severity}): ${w.note}`).join("\n");
  return `# V44 — raport + comparație V43

## Contur și înălțimi (fixe)
- Gabarit **680×860** neschimbat
- FF→FF **288** = 255+6+15+3+2+5+2
- V43 păstrat în \`data/building/v43_exact.json\` + \`viewer/data/volume_v43.json\`

## Util
| | V44 | V43 |
|--|-----|-----|
| Anvelopă | ${areas.envelopeShoelace.toFixed(4)} | ${Number(v43areas?.envelope_interior_shoelace_m2 ?? 40.3535).toFixed(4)} |
| Util net | **${areas.usefulNet.toFixed(4)}** | ${Number(v43areas?.useful_interior_net_m2 ?? 39.21975).toFixed(4)} |
| Δ util | **${(areas.usefulNet - Number(v43areas?.useful_interior_net_m2 ?? 39.21975)).toFixed(4)}** | |

## Camere cheie
| | V44 | Notă |
|--|-----|------|
| Dorm principal | ${areas.dormPrincipal.toFixed(4)} m² (317,5×362,5) | lățime 317,5 păstrată |
| + nișă dulap | ${areas.dormNisa.toFixed(4)} m² | 120×60 |
| Baie net | **${areas.bathNet.toFixed(4)} m²** | ~5,00 țintă |
| Terasă placă / liber | ${areas.terracePlaca.toFixed(2)} / ${areas.terraceLib.toFixed(2)} | 6,60 / 6,08 |
| Hol | **eliminat** | hol_ne scos |

## Layout
1. dormitor_sud Y630; terasă Y660×200; dormitor_est scurtat la Y630
2. Nișă dulap în fosta baie; coloană MS eliminată din baie
3. Baie lărgită la X295 (265×225 bază); ușă pe est
4. MS+US în nișă 65×75 (aparat, nu depozit)
5. TV pe X347,5 Y115–255; fără hol_ne
6. Ușă dormitor pe est Y277–367; vechi gol N eliminat
7. Ușă buc–terasă Y670–760; blat sud 360–535×770

## Avertismente (nescrise)
${warns}

## Ipoteze păstrate
Placă 15 · elevație +32 · palier 12,5 · cadastru ≈145,7≠147 · amplasare neschimbată
`;
}

function main() {
  const v44 = read("data/building/v44_exact.json");
  const v43 = read("data/building/v43_exact.json");
  const areas = computeAreas(v44);
  const v43areas = v43.areas_cm;

  v44.areas_cm.envelope_interior_shoelace_m2 = areas.envelopeShoelace;
  v44.areas_cm.interior_walls_gross_m2 = areas.wallsGross;
  v44.areas_cm.interior_walls_overlaps_m2 = areas.wallsOverlaps;
  v44.areas_cm.interior_walls_openings_void_m2 = areas.openingsVoid;
  v44.areas_cm.interior_walls_net_m2 = areas.wallsNet;
  v44.areas_cm.useful_interior_net_m2 = areas.usefulNet;
  v44.areas_cm.useful_interior_m2 = areas.usefulNet;
  v44.areas_cm.decomposition = `${areas.envelopeShoelace.toFixed(4)} − ${areas.wallsNet.toFixed(4)} = ${areas.usefulNet.toFixed(4)} m²`;
  v44.areas_cm.dorm_principal_m2 = areas.dormPrincipal;
  v44.areas_cm.dorm_nisa_m2 = areas.dormNisa;
  v44.areas_cm.bath_base_m2 = areas.bathBase;
  v44.areas_cm.bath_niche_cut_m2 = areas.nicheCut;
  v44.areas_cm.bath_net_m2 = areas.bathNet;
  v44.areas_cm.terrace_placa_m2 = areas.terracePlaca;
  v44.areas_cm.terrace_libera_m2 = areas.terraceLib;
  v44.areas_cm.stair_band_m2 = areas.stair;
  v44.areas_cm.envelope_gross_m2 = areas.env;
  v44.areas_cm.wall_parts_cm2 = areas.wallPartsCm2;
  v44.areas_cm.openings_void_cm2 = areas.openingsVoidCm2;
  write("data/building/v44_exact.json", JSON.stringify(v44, null, 2) + "\n");
  write("viewer/data/v44_exact.json", JSON.stringify(v44, null, 2) + "\n");

  write("outputs/plans/09_v44_exact_plan.svg", planSvg(v44, areas));
  write("outputs/reports/v44_exact_surfaces.md", surfacesMd(v44, areas, v43areas));
  write(
    "outputs/reports/v44_exact_surfaces.json",
    JSON.stringify(
      {
        ...areas,
        comparison_v43: {
          useful_net_m2: v43areas.useful_interior_net_m2,
          envelope_m2: v43areas.envelope_interior_shoelace_m2,
          terrace_libera_m2: v43areas.terrace_libera_m2,
        },
        generated: new Date().toISOString(),
      },
      null,
      2
    )
  );
  write("outputs/reports/v44_vs_v43.md", reportMd(v44, areas, v43areas));
  write("outputs/reports/v44_exact_changelog.md", reportMd(v44, areas, v43areas));

  console.log(
    JSON.stringify(
      {
        ok: true,
        rev: "v44",
        useful_net_m2: areas.usefulNet,
        bath_net_m2: areas.bathNet,
        dorm_principal_m2: areas.dormPrincipal,
        terrace_libera_m2: areas.terraceLib,
        delta_util_vs_v43: areas.usefulNet - (v43areas.useful_interior_net_m2 || 39.21975),
        warnings: (v44.warnings_cm || []).map((w) => w.id),
        plan: "outputs/plans/09_v44_exact_plan.svg",
      },
      null,
      2
    )
  );
}

main();
