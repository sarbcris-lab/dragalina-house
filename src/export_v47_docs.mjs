/**
 * Livrabile V47 — planuri 21–25 + rapoarte v47_*. Surse: v47_exact.json
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

function computeAreas(v47) {
  const envCm2 = shoelaceCm2(v47.interior_polygon_cm.vertices);
  const ints = v47.walls_cm.filter((w) => w.kind === "int").map(clipIntWall);
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
  for (const o of v47.openings_cm) {
    if (!voidIds.has(o.id)) continue;
    let vA = 0;
    for (const w of ints) vA += rectIntersectArea(w, o);
    openingsVoid[o.id] = vA;
    voidA += vA;
  }
  const wallNet = gross - overlaps - voidA;
  const usefulGeom = (envCm2 - wallNet) / 10000;

  const dorm = v47.rooms_cm.find((r) => r.id === "dormitor");
  const nisa = v47.rooms_cm.find((r) => r.id === "nisa_dulap");
  const ter = v47.rooms_cm.find((r) => r.id === "terasa");
  const sc = v47.rooms_cm.find((r) => r.id === "scara");

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
    env: (v47.envelope_cm.ew * v47.envelope_cm.ns) / 10000,
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
  } else if (leaf.swing === "into_kitchen_east") {
    parts.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx)}" y2="${py(hy + R)}" stroke="#2d5a27" stroke-width="1.4"/>`);
    parts.push(`<line x1="${px(open.x0)}" y1="${py(open.y0)}" x2="${px(open.x1)}" y2="${py(open.y1)}" stroke="#2d5a27" stroke-width="2"/>`);
    parts.push(
      `<path d="M ${px(hx)} ${py(hy + R)} A ${R * S} ${R * S} 0 0 0 ${px(open.x1)} ${py(open.y1)}" fill="none" stroke="#2d5a27" stroke-dasharray="3 2"/>`
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
  const clearW = st.width_clear_cm; // 105
  const parapetT = st.parapet_thick_cm || 10;
  const f180 = st.flight_180;
  const r2 = st.ramp2;
  const pod = st.podest_se;
  const pal = st.palier_superior;
  parts.push(
    `<defs><marker id="arr46" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2d5a27"/></marker></defs>`
  );

  // Band fill (elimină dungile albe de background)
  parts.push(
    `<rect x="${px(st.band_x)}" y="${py(pal.y)}" width="${st.band_dx * S}" height="${(860 - pal.y) * S}" fill="#d8dde2" stroke="#888" stroke-width="0.4"/>`
  );

  // flight 180: trepte pe lățime liberă, flush la nordul benzii; parapet pe sud
  for (let i = 0; i < 7; i++) {
    const x = f180.x + i * tread;
    const fill = i % 2 ? "#c4b090" : "#b8a480";
    parts.push(
      `<rect x="${px(x)}" y="${py(f180.y)}" width="${tread * S}" height="${clearW * S}" fill="${fill}" stroke="#444" stroke-width="0.5"/>`
    );
  }
  parts.push(
    `<rect x="${px(f180.x)}" y="${py(f180.y + clearW)}" width="${f180.dx * S}" height="${parapetT * S}" fill="#5a6570" stroke="#333" stroke-width="0.4"/>`
  );
  parts.push(
    `<text x="${px(f180.x + 40)}" y="${py(f180.y + clearW + 8)}" font-size="6" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">parapet 10</text>`
  );

  parts.push(
    `<rect x="${px(pod.x)}" y="${py(pod.y)}" width="${pod.dx * S}" height="${pod.dy * S}" fill="#c4b496" stroke="#444"/>`
  );

  // ramp2: trepte X565–670 (clear), parapet est X670–680 — FĂRĂ offset +10 vest
  const ySouthEdge = r2.y + r2.dy;
  for (let i = 0; i < 9; i++) {
    const yS = ySouthEdge - (i + 1) * tread;
    const fill = i % 2 ? "#8a93a0" : "#9aa3ad";
    parts.push(
      `<rect x="${px(r2.x)}" y="${py(yS)}" width="${clearW * S}" height="${tread * S}" fill="${fill}" stroke="#333" stroke-width="0.5"/>`
    );
    parts.push(
      `<rect x="${px(r2.x + clearW)}" y="${py(yS)}" width="${parapetT * S}" height="${tread * S}" fill="#5a6570" stroke="#333" stroke-width="0.3"/>`
    );
  }
  parts.push(
    `<text x="${px(r2.x + clearW + 2)}" y="${py(r2.y + 40)}" font-size="6" fill="#222" font-family="IBM Plex Sans,Segoe UI,sans-serif" transform="rotate(-90 ${px(r2.x + clearW + 2)} ${py(r2.y + 40)})">parapet 10</text>`
  );
  // cotă lățime liberă
  parts.push(
    `<text x="${px(r2.x + 50)}" y="${py(r2.y + 20)}" font-size="7" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">liber 105</text>`
  );

  parts.push(
    `<rect x="${px(pal.x)}" y="${py(pal.y)}" width="${pal.dx * S}" height="${pal.dy * S}" fill="#9aa3ad" stroke="#222"/>`
  );
  // rest band east of palier (115-110=5 cm) — identificat, nu ascuns
  if (st.band_dx > pal.dx) {
    parts.push(
      `<rect x="${px(pal.x + pal.dx)}" y="${py(pal.y)}" width="${(st.band_dx - pal.dx) * S}" height="${pal.dy * S}" fill="#b0b8c0" stroke="#555" stroke-width="0.4"/>`
    );
    parts.push(
      `<text x="${px(pal.x + pal.dx + 1)}" y="${py(pal.y + 60)}" font-size="6" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">5</text>`
    );
  }
  parts.push(
    `<text x="${px(pal.x + pal.dx / 2)}" y="${py(pal.y + pal.dy / 2)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">PALIER 120 +288</text>`
  );

  // 2 trepte acces terasă (sud de placă)
  const es = st.entry_steps;
  if (es?.steps) {
    const stepDy = es.dy / es.steps;
    for (let i = 0; i < es.steps; i++) {
      const yS = es.y + es.dy - (i + 1) * stepDy;
      const fill = i % 2 ? "#c4a060" : "#b09050";
      parts.push(
        `<rect x="${px(es.x)}" y="${py(yS)}" width="${es.dx * S}" height="${stepDy * S}" fill="${fill}" stroke="#5a4010" stroke-width="0.8"/>`
      );
    }
    parts.push(
      `<text x="${px(es.x + es.dx / 2)}" y="${py(es.y + es.dy / 2)}" text-anchor="middle" font-size="7" fill="#3a2808" font-family="IBM Plex Sans,Segoe UI,sans-serif">2 trepte</text>`
    );
  }
}

function planSvg(v47, areas) {
  const S = 0.55;
  const M = 90;
  const W = v47.envelope_cm.ew;
  // include terasa extinsă + trepte sud (dincolo de anvelopă 860)
  const L = Math.max(
    v47.envelope_cm.ns,
    (v47.rooms_cm.find((r) => r.id === "terasa")?.y || 0) +
      (v47.rooms_cm.find((r) => r.id === "terasa")?.dy || 0) +
      80
  );
  const px = (x) => M + x * S;
  const py = (y) => M + y * S;
  const svgW = M * 2 + W * S + 400;
  const svgH = M * 2 + L * S + 140;
  const parts = [];

  parts.push(
    `<text x="${svgW / 2}" y="22" text-anchor="middle" font-size="15" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 rev.${v47.meta?.rev || 1} · plan cotat (fitout + rezerve MEP)</text>`
  );
  parts.push(
    `<text x="${svgW / 2}" y="40" text-anchor="middle" font-size="10" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">util geom. ${areas.usefulGeom.toFixed(4)} m² · baie net ~${areas.bathNet.toFixed(2)} · terasă liberă ${areas.terraceLib.toFixed(2)} · V45 păstrat</text>`
  );
  parts.push(
    `<rect x="${px(0)}" y="${py(0)}" width="${W * S}" height="${L * S}" fill="#f7f4ef" stroke="#222" stroke-width="2"/>`
  );
  const poly = v47.interior_polygon_cm.vertices;
  parts.push(
    `<polygon points="${poly.map(([x, y]) => `${px(x)},${py(y)}`).join(" ")}" fill="#e8efe4" fill-opacity="0.28" stroke="#2d5a27" stroke-width="1.2" stroke-dasharray="6 3"/>`
  );

  for (const r of v47.rooms_cm) {
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
  drawStairs(parts, px, py, S, v47);

  for (const w of v47.walls_cm) {
    parts.push(
      `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="${w.kind === "ext" ? "#333" : "#777"}"/>`
    );
  }
  for (const p of v47.parapets_cm || []) {
    if (p.gap || !(p.h > 0)) {
      // gol acces — marcaj plan, fără parapet
      parts.push(
        `<rect x="${px(p.x)}" y="${py(p.y)}" width="${p.dx * S}" height="${p.dy * S}" fill="none" stroke="#5a7a40" stroke-width="1.2" stroke-dasharray="3 2"/>`
      );
      parts.push(
        `<text x="${px(p.x + p.dx / 2)}" y="${py(p.y + p.dy / 2 + 2)}" text-anchor="middle" font-size="5.5" fill="#3a5a20" font-family="IBM Plex Sans,Segoe UI,sans-serif">acces scări</text>`
      );
      continue;
    }
    parts.push(
      `<rect x="${px(p.x)}" y="${py(p.y)}" width="${p.dx * S}" height="${p.dy * S}" fill="#5a6570" opacity="0.85"/>`
    );
  }
  // Terasă neacoperită (parter)
  const unc = v47.rooms_cm.find((r) => r.id === "terasa")?.parts?.uncovered_south;
  if (unc) {
    parts.push(
      `<rect x="${px(unc.x)}" y="${py(unc.y)}" width="${unc.dx * S}" height="${unc.dy * S}" fill="#c8d8a0" opacity="0.45" stroke="#5a7a40" stroke-dasharray="4 2"/>`
    );
    parts.push(
      `<text x="${px(unc.x + unc.dx / 2)}" y="${py(unc.y + 20)}" text-anchor="middle" font-size="7" fill="#3a5a20" font-family="IBM Plex Sans,Segoe UI,sans-serif">terasă NEACOPERITĂ</text>`
    );
  }
  const land = v47.rooms_cm.find((r) => r.id === "terasa")?.parts?.entry_landing;
  if (land) {
    parts.push(
      `<rect x="${px(land.x)}" y="${py(land.y)}" width="${land.dx * S}" height="${land.dy * S}" fill="#e8e0c8" opacity="0.55" stroke="#8a7040"/>`
    );
    parts.push(
      `<text x="${px(land.x + land.dx / 2)}" y="${py(land.y + land.dy / 2)}" text-anchor="middle" font-size="6" fill="#5a4020" font-family="IBM Plex Sans,Segoe UI,sans-serif">palier intrare</text>`
    );
  }

  for (const o of v47.openings_cm) {
    const feas = o.feasibility?.status;
    const isEntry = o.role === "entrance" || (o.id && o.id.includes("intrare"));
    const fill = isEntry
      ? "#6aaf7a"
      : feas === "NOT_FEASIBLE_AS_DRAWN" || feas === "NOT_FEASIBLE_POCKET_WITH_WC_APPROVED"
        ? "#e8a0a0"
        : feas === "CONDITIONAL"
          ? "#f0d090"
          : "#9ec5e8";
    parts.push(
      `<rect x="${px(o.x)}" y="${py(o.y)}" width="${Math.max(o.dx, 6) * S}" height="${Math.max(o.dy, 6) * S}" fill="${fill}" stroke="#1d4f91"/>`
    );
    if (o.pocket?.cassette) {
      const c = o.pocket.cassette;
      const cassFill = feas === "NOT_FEASIBLE_AS_DRAWN" ? "#c07070" : "#c4a060";
      parts.push(
        `<rect x="${px(c.x)}" y="${py(c.y)}" width="${Math.max(c.dx, 4) * S}" height="${Math.max(c.dy, 4) * S}" fill="${cassFill}" fill-opacity="0.55" stroke="#8a5a20" stroke-dasharray="3 2"/>`
      );
      parts.push(
        `<text x="${px(c.x + c.dx / 2)}" y="${py(c.y + c.dy / 2) + 3}" text-anchor="middle" font-size="5.5" fill="#5a3010" font-family="IBM Plex Sans,Segoe UI,sans-serif">casetă</text>`
      );
    }
    if (o.leaf && (o.leaf.swing || o.leaf.open_leaf)) doorArc(parts, px, py, S, o);
  }

  // Path overlays (circulații)
  for (const p of v47.path_overlays_cm || []) {
    parts.push(
      `<rect x="${px(p.x)}" y="${py(p.y)}" width="${p.dx * S}" height="${p.dy * S}" fill="#c8e8d0" opacity="0.22" stroke="#2d5a27" stroke-dasharray="4 2"/>`
    );
    parts.push(
      `<text x="${px(p.x + 4)}" y="${py(p.y + 12)}" font-size="5.5" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(p.label || p.id)}</text>`
    );
  }

  // MEP study overlays
  if (v47.mep_cm?.prana?.positions) {
    for (const p of v47.mep_cm.prana.positions) {
      parts.push(
        `<rect x="${px(p.x)}" y="${py(p.y)}" width="${p.dx * S}" height="${p.dy * S}" fill="#6ab0c8" opacity="0.7" stroke="#1a5a70"/>`
      );
      parts.push(
        `<text x="${px(p.x + p.dx / 2)}" y="${py(p.y + p.dy / 2) + 3}" text-anchor="middle" font-size="5.5" fill="#063040" font-family="IBM Plex Sans,Segoe UI,sans-serif">PRANA</text>`
      );
    }
  }
  if (v47.mep_cm?.ac?.indoor) {
    for (const a of v47.mep_cm.ac.indoor) {
      parts.push(
        `<rect x="${px(a.x)}" y="${py(a.y)}" width="${a.dx * S}" height="${a.dy * S}" fill="#a8c8e8" opacity="0.65" stroke="#3a6a9a"/>`
      );
      parts.push(
        `<text x="${px(a.x + a.dx / 2)}" y="${py(a.y + a.dy / 2) + 3}" text-anchor="middle" font-size="5.5" fill="#1a3a5a" font-family="IBM Plex Sans,Segoe UI,sans-serif">AC</text>`
      );
    }
  }
  if (v47.mep_cm?.ac?.outdoor) {
    for (const a of v47.mep_cm.ac.outdoor) {
      parts.push(
        `<rect x="${px(a.x)}" y="${py(a.y)}" width="${a.dx * S}" height="${a.dy * S}" fill="#8aa0b0" opacity="0.55" stroke="#334"/>`
      );
      parts.push(
        `<text x="${px(a.x + 4)}" y="${py(a.y + 14)}" font-size="5.5" fill="#222" font-family="IBM Plex Sans,Segoe UI,sans-serif">AC out</text>`
      );
    }
  }
  const be = v47.mep_cm?.bath_extract?.position_study || v47.mep_cm?.bath_extract?.route_study?.vertical_chase;
  if (be?.dx) {
    parts.push(
      `<rect x="${px(be.x)}" y="${py(be.y)}" width="${be.dx * S}" height="${be.dy * S}" fill="#90c8a8" opacity="0.7" stroke="#2d5a27"/>`
    );
    parts.push(
      `<text x="${px(be.x + be.dx / 2)}" y="${py(be.y + be.dy / 2) + 3}" text-anchor="middle" font-size="5" fill="#163020" font-family="IBM Plex Sans,Segoe UI,sans-serif">extract</text>`
    );
  }
  for (const key of ["stack_bath", "stack_kitchen"]) {
    const s = v47.mep_cm?.risers_p_plus_1?.water_sewer?.[key];
    if (!s) continue;
    parts.push(
      `<rect x="${px(s.x)}" y="${py(s.y)}" width="${s.dx * S}" height="${s.dy * S}" fill="#a08060" opacity="0.55" stroke="#5a4030"/>`
    );
  }
  const panel = v47.mep_cm?.risers_p_plus_1?.electrical?.panel_study;
  if (panel) {
    parts.push(
      `<rect x="${px(panel.x)}" y="${py(panel.y)}" width="${panel.dx * S}" height="${panel.dy * S}" fill="#e8d060" opacity="0.7" stroke="#886600"/>`
    );
    parts.push(
      `<text x="${px(panel.x + 2)}" y="${py(panel.y + 10)}" font-size="5" fill="#443300" font-family="IBM Plex Sans,Segoe UI,sans-serif">Tablou</text>`
    );
  }
  for (const e of v47.electrical_cm?.points || []) {
    parts.push(
      `<circle cx="${px(e.x)}" cy="${py(e.y)}" r="3" fill="#f0c040" stroke="#886600"/>`
    );
  }

  const furn = [...v47.furniture_cm].sort((a, b) => (a.draw_order || 0) - (b.draw_order || 0));
  for (const f of furn) {
    if (f.id === "cuptor") continue;
    if (f.status === "overlay" || f.not_furniture_count) {
      parts.push(
        `<rect x="${px(f.x)}" y="${py(f.y)}" width="${f.dx * S}" height="${f.dy * S}" fill="${f.color || "#aaa"}" opacity="0.2" stroke="#5a7a50" stroke-dasharray="3 2"/>`
      );
      parts.push(
        `<text x="${px(f.x + 4)}" y="${py(f.y + 12)}" font-size="5.5" fill="#3a5a30" font-family="IBM Plex Sans,Segoe UI,sans-serif">desfăcut (gabarit)</text>`
      );
      continue;
    }
    if (f.shape === "circle") {
      parts.push(
        `<circle cx="${px(f.cx)}" cy="${py(f.cy)}" r="${(f.diameter_cm / 2) * S}" fill="${f.color || "#aaa"}" stroke="#222" stroke-width="0.8"/>`
      );
      parts.push(
        `<text x="${px(f.cx)}" y="${py(f.cy) + 3}" text-anchor="middle" font-size="7" font-family="IBM Plex Sans,Segoe UI,sans-serif">Ø${f.diameter_cm}</text>`
      );
    } else if (f.polygon_cm?.length) {
      const pts = f.polygon_cm.map((p) => `${px(p.x)},${py(p.y)}`).join(" ");
      parts.push(
        `<polygon points="${pts}" fill="${f.color || "#aaa"}" stroke="#222" stroke-width="0.6" opacity="0.9"/>`
      );
    } else {
      parts.push(
        `<rect x="${px(f.x)}" y="${py(f.y)}" width="${f.dx * S}" height="${f.dy * S}" fill="${f.color || "#aaa"}" stroke="#222" stroke-width="0.5"/>`
      );
    }
    if (f.screen) {
      const s = f.screen;
      parts.push(
        `<rect x="${px(s.x)}" y="${py(s.y)}" width="${s.dx * S}" height="${s.dy * S}" fill="#1a1e22" stroke="#000"/>`
      );
    }
    if (f.retreat) {
      const r = f.retreat;
      if (r.polygon_cm?.length) {
        const pts = r.polygon_cm.map((p) => `${px(p.x)},${py(p.y)}`).join(" ");
        parts.push(
          `<polygon points="${pts}" fill="none" stroke="#986944" stroke-dasharray="2 2"/>`
        );
      } else {
        parts.push(
          `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="none" stroke="#986944" stroke-dasharray="2 2"/>`
        );
      }
    }
    if (f.bowl) {
      const b = f.bowl;
      parts.push(
        `<rect x="${px(b.x)}" y="${py(b.y)}" width="${b.dx * S}" height="${b.dy * S}" fill="#8ecae6" stroke="#1d4f91" stroke-width="0.6"/>`
      );
    }
    if (f.enclosure) {
      const e = f.enclosure;
      const fixed = e.fixed_panel;
      const slidOpen = e.sliding_panel_open || e.sliding_panel;
      const slidClosed = e.sliding_panel_closed;
      if (fixed) {
        parts.push(
          `<rect x="${px(fixed.x)}" y="${py(fixed.y)}" width="${Math.max(fixed.dx, 3) * S}" height="${fixed.dy * S}" fill="#a8d4e8" stroke="#4a7a90"/>`
        );
      }
      // show open position (dashed) + closed outline
      if (slidClosed) {
        parts.push(
          `<rect x="${px(slidClosed.x)}" y="${py(slidClosed.y)}" width="${Math.max(slidClosed.dx, 3) * S}" height="${slidClosed.dy * S}" fill="none" stroke="#4a7a90" stroke-dasharray="2 2"/>`
        );
      }
      if (slidOpen) {
        parts.push(
          `<rect x="${px(slidOpen.x)}" y="${py(slidOpen.y)}" width="${Math.max(slidOpen.dx, 3) * S}" height="${slidOpen.dy * S}" fill="#7eb8d4" opacity="0.85" stroke="#4a7a90"/>`
        );
      }
      const c = e.clear_passage_open || e.clear_passage;
      if (c) {
        parts.push(
          `<rect x="${px(c.x)}" y="${py(c.y)}" width="${c.dx * S}" height="${c.dy * S}" fill="#c8e8d0" opacity="0.45" stroke="#2d5a27" stroke-dasharray="2 2"/>`
        );
        parts.push(
          `<text x="${px(c.x + c.dx / 2)}" y="${py(c.y + c.dy / 2)}" text-anchor="middle" font-size="6" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">gol ${(c.clear_width_cm || c.dy).toFixed?.(1) || c.dy}</text>`
        );
      }
      if (e.arrow) {
        const [x0, y0] = e.arrow.from;
        const [x1, y1] = e.arrow.to;
        parts.push(
          `<line x1="${px(x0)}" y1="${py(y0)}" x2="${px(x1)}" y2="${py(y1)}" stroke="#2d5a27" stroke-width="1.5" marker-end="url(#arr46)"/>`
        );
        parts.push(
          `<text x="${px(x0 + 8)}" y="${py((y0 + y1) / 2)}" font-size="6" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(e.arrow.label || "glisare → sud")}</text>`
        );
      }
    }
    if (f.use_zone) {
      const u = f.use_zone;
      parts.push(
        `<rect x="${px(u.x)}" y="${py(u.y)}" width="${u.dx * S}" height="${u.dy * S}" fill="none" stroke="#c44" stroke-dasharray="2 2"/>`
      );
    }
    if (f.drawers?.pull_zone) {
      const u = f.drawers.pull_zone;
      parts.push(
        `<rect x="${px(u.x)}" y="${py(u.y)}" width="${u.dx * S}" height="${u.dy * S}" fill="none" stroke="#986944" stroke-dasharray="2 2"/>`
      );
    }
    if (f.drain?.sifon) {
      const s = f.drain.sifon;
      parts.push(
        `<rect x="${px(s.x)}" y="${py(s.y)}" width="${s.dx * S}" height="${s.dy * S}" fill="#5a8aaa" stroke="#234"/>`
      );
    }
    if (f.mount?.door_swing?.open_leaf) {
      const o = f.mount.door_swing.open_leaf;
      parts.push(
        `<rect x="${px(o.x)}" y="${py(o.y)}" width="${o.dx * S}" height="${o.dy * S}" fill="none" stroke="#666" stroke-dasharray="2 2"/>`
      );
    }
    if (f.niche_clear_cm) {
      const n = f.niche_clear_cm;
      parts.push(
        `<rect x="${px(n.x)}" y="${py(n.y)}" width="${n.dx * S}" height="${n.dy * S}" fill="none" stroke="#2d5a27" stroke-dasharray="3 2"/>`
      );
    }
    if (f.shape !== "circle" && f.dx * S > 14) {
      parts.push(
        `<text x="${px(f.x + f.dx / 2)}" y="${py(f.y + f.dy / 2) + 3}" text-anchor="middle" font-size="6" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(f.id)}</text>`
      );
    }
  }

  parts.push(
    `<rect x="${px(460)}" y="${py(195)}" width="${100 * S}" height="${30 * S}" fill="#e8a0a0" opacity="0.25" stroke="#a33" stroke-dasharray="3 2"/>`
  );

  dimH(parts, px, py, 0, W, -18, `${W}`);
  dimV(parts, px, py, -22, 0, L, `${L}`);
  dimH(parts, px, py, 30, 347.5, 20, "baie→347.5");
  dimV(parts, px, py, 18, 282.5, 645, "362.5");
  dimH(parts, px, py, 0, 330, 665, "terasă 330");
  dimV(parts, px, py, 340, 675, 860, "185");
  dimV(parts, px, py, 525, 475, 565, "intrare 90");
  dimV(parts, px, py, 370, 680, 770, "primire 90");
  dimH(parts, px, py, 460, 560, 265, "Ø100");
  dimH(parts, px, py, 360, 650, 50, "living 290");
  dimV(parts, px, py, 690, 470, 590, "palier 120");
  dimH(parts, px, py, 565, 670, 500, "liber 105");
  dimH(parts, px, py, 670, 680, 500, "10");

  const lx = svgW - 370;
  parts.push(`<rect x="${lx}" y="52" width="350" height="600" fill="#fff" stroke="#333"/>`);
  const din = v47.dining_check_r5?.occupied || {};
  const lines = [
    [`V47 rev.${v47.meta?.rev || 1} · concept`, 11, "#111"],
    [`Util geom./nivel: ${areas.usefulGeom.toFixed(4)} m²`, 11, "#2d5a27"],
    ["P: terasă→Y1035 + parapet est (gol ușă)", 10, "#2d5a27"],
    ["P: buc N; sofa sub podest; corp lipit", 10, "#2d5a27"],
    ["E: buc V46r7 → terasă (înghețat)", 10, "#2d5a27"],
    ["L-1: 3 trepte curte −48→−95", 10, "#333"],
    ["L-1: scară 9×17,22 → −250", 10, "#333"],
    ["TV centrate + întărire", 10, "#333"],
    ["AC out = fațadă VEST", 10, "#333"],
    [`Dining →dorm ${din.path_dorm_free_cm ?? "—"} occ.`, 9, "#333"],
    ["Urbanism terasă: deschis", 9, "#a33"],
    ["Alcătuiri NECONFIRMATE", 9, "#666"],
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

const PLAN_S = 0.45;
const PLAN_M = 70;

function etajPlanSvg(v47) {
  const S = PLAN_S;
  const M = PLAN_M;
  const W = M * 2 + v47.envelope_cm.ew * S + 200;
  const H = M * 2 + v47.envelope_cm.ns * S + 120;
  const px = (x) => M + x * S;
  const py = (y) => M + y * S;
  const parts = [];
  parts.push(
    `<text x="${W / 2}" y="48" text-anchor="middle" font-size="11" fill="#2d6a4f" font-family="IBM Plex Sans,Segoe UI,sans-serif">etaj înghețat · terasă ${v47.terrace_by_level?.[1]?.dx || 330}×${v47.terrace_by_level?.[1]?.dy || 185} · intrare buc_est</text>`
  );
  for (const r of v47.rooms_cm) {
    if (r.id === "scara" || r.id === "primire") continue;
    if (r.id === "terasa") {
      const t = v47.terrace_by_level?.[1] || r;
      parts.push(
        `<rect x="${px(t.x)}" y="${py(t.y)}" width="${t.dx * S}" height="${t.dy * S}" fill="#dfe8d8" stroke="#4a7c40"/>`
      );
      parts.push(
        `<text x="${px(t.x + t.dx / 2)}" y="${py(t.y + t.dy / 2)}" text-anchor="middle" font-size="9" font-family="IBM Plex Sans,Segoe UI,sans-serif">TERASĂ E</text>`
      );
      continue;
    }
    parts.push(
      `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="${r.floor || "#eee"}" stroke="#666" opacity="0.9"/>`
    );
    parts.push(
      `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy / 2)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(r.label || r.id)}</text>`
    );
  }
  for (const w of v47.walls_cm) {
    parts.push(
      `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="${w.kind === "ext" ? "#333" : "#777"}"/>`
    );
  }
  for (const p of v47.parapets_cm || []) {
    if (p.levels && !p.levels.includes(1)) continue;
    if (p.gap || !(p.h > 0)) continue;
    parts.push(
      `<rect x="${px(p.x)}" y="${py(p.y)}" width="${p.dx * S}" height="${p.dy * S}" fill="#5a6570"/>`
    );
  }
  for (const o of v47.openings_cm) {
    if (o.levels?.length && !o.levels.includes(1)) continue;
    const isEntry = o.id?.includes("intrare");
    parts.push(
      `<rect x="${px(o.x)}" y="${py(o.y)}" width="${Math.max(o.dx, 6) * S}" height="${Math.max(o.dy, 6) * S}" fill="${isEntry ? "#6aaf7a" : "#9ec5e8"}" stroke="#1d4f91"/>`
    );
  }
  for (const f of v47.furniture_cm) {
    if (f.levels && !f.levels.includes(1)) continue;
    if (f.zone === "primire") continue;
    parts.push(
      `<rect x="${px(f.x)}" y="${py(f.y)}" width="${(f.dx || 10) * S}" height="${(f.dy || 10) * S}" fill="${f.color || "#ccc"}" opacity="0.85" stroke="#444"/>`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  <text x="${W / 2}" y="22" text-anchor="middle" font-size="15" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 rev.${v47.meta?.rev || 1} · plan ETAJ (înghețat r7g)</text>
  ${parts.join("\n  ")}
</svg>`;
}

function furniturePlanSvg(v47) {
  const S = PLAN_S;
  const M = PLAN_M;
  const W = M * 2 + v47.envelope_cm.ew * S + 200;
  const L = Math.max(
    v47.envelope_cm.ns,
    (v47.rooms_cm.find((r) => r.id === "terasa")?.y || 0) +
      (v47.rooms_cm.find((r) => r.id === "terasa")?.dy || 0) +
      80
  );
  const H = M * 2 + L * S + 100;
  const px = (x) => M + x * S;
  const py = (y) => M + y * S;
  const parts = [];
  for (const r of v47.rooms_cm) {
    if (r.id === "scara") continue;
    const t = r.id === "terasa" ? v47.terrace_by_level?.[0] || r : r;
    parts.push(
      `<rect x="${px(t.x)}" y="${py(t.y)}" width="${t.dx * S}" height="${t.dy * S}" fill="#f0eee8" stroke="#aaa"/>`
    );
  }
  for (const w of v47.walls_cm) {
    parts.push(
      `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="#444"/>`
    );
  }
  for (const f of v47.furniture_cm) {
    if (f.levels && !f.levels.includes(0)) continue;
    parts.push(
      `<rect x="${px(f.x)}" y="${py(f.y)}" width="${(f.dx || 10) * S}" height="${(f.dy || 10) * S}" fill="${f.color || "#bbb"}" stroke="#222"/>`
    );
    parts.push(
      `<text x="${px(f.x + (f.dx || 10) / 2)}" y="${py(f.y + (f.dy || 10) / 2)}" text-anchor="middle" font-size="6" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(f.id)}</text>`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  <text x="${W / 2}" y="22" text-anchor="middle" font-size="15" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 rev.${v47.meta?.rev || 1} · plan mobilier PARTER</text>
  ${parts.join("\n  ")}
</svg>`;
}

function mepPlanSvg(v47) {
  const S = PLAN_S;
  const M = PLAN_M;
  const W = M * 2 + v47.envelope_cm.ew * S + 200;
  const H = M * 2 + v47.envelope_cm.ns * S + 120;
  const px = (x) => M + x * S;
  const py = (y) => M + y * S;
  const parts = [];
  for (const r of v47.rooms_cm) {
    if (r.outdoor || r.id === "scara" || r.id === "primire") continue;
    parts.push(
      `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="#f8f9fa" stroke="#adb5bd"/>`
    );
  }
  for (const w of v47.walls_cm) {
    parts.push(
      `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="#495057"/>`
    );
  }
  const mep = v47.mep_cm || {};
  const items = [];
  const pushPos = (arr, kind) => {
    for (const p of arr || []) {
      if (p && p.x != null) items.push({ ...p, kind });
    }
  };
  pushPos(mep.prana?.positions, "PRANA");
  pushPos(mep.ac?.indoor, "AC");
  pushPos(mep.ac?.outdoor, "AC_out");
  if (mep.bath_extract?.position_study) pushPos([mep.bath_extract.position_study], "extract");
  for (const it of items) {
    parts.push(
      `<rect x="${px(it.x)}" y="${py(it.y)}" width="${(it.dx || 20) * S}" height="${(it.dy || 20) * S}" fill="#74c0fc" stroke="#1864ab"/>`
    );
    parts.push(
      `<text x="${px(it.x)}" y="${py(it.y) - 2}" font-size="7" fill="#1864ab" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(it.id || it.kind)}</text>`
    );
  }
  parts.push(
    `<text x="40" y="${H - 30}" font-size="9" fill="#b08900" font-family="IBM Plex Sans,Segoe UI,sans-serif">MEP = rezerve din JSON — nu proiect autorizat</text>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  <text x="${W / 2}" y="22" text-anchor="middle" font-size="15" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 rev.${v47.meta?.rev || 1} · plan instalații (rezerve)</text>
  ${parts.join("\n  ")}
</svg>`;
}

function v47ReportMd(v47, areas) {
  const warns = (v47.warnings_cm || []).map((w) => `- **${w.id}** (${w.severity}): ${w.note}`).join("\n");
  return `# V47 — raport concept

## Față de v46 r7g
- Intrare prin **primire** (nu linia buc–terasă).
- Terasă unită + **paravan** (\`terrace_guards_cm\`).
- **Subsol** studiu sub rampă2 + curte locală.
- Etaj **înghețat** (terasă level 1 din \`terrace_by_level[1]\`).

## Util geometric
**${areas.usefulGeom.toFixed(4)} m²** · terasă liberă ~**${areas.terraceLib.toFixed(2)} m²**

## Avertismente
${warns || "—"}

## Open issues
${(v47.open_issues || []).map((x) => `- ${x}`).join("\n")}
`;
}

function surfacesMd(v47, areas, v46a) {
  let md = `# V47 — suprafețe\n\n`;
  md += `Recalculate din poligoane V47 — baseline comparativ **v46 r7g**.\n\n`;
  md += `## Util geometric vs utilă\n\n`;
  md += `| Tip | Valoare |\n|-----|--------|\n`;
  md += `| Anvelopă shoelace | ${areas.envelopeShoelace.toFixed(6)} m² |\n`;
  md += `| Pereți int net | ${areas.wallsNet.toFixed(6)} m² |\n`;
  md += `| **Util geometric (model)** | **${areas.usefulGeom.toFixed(6)} m²** |\n`;
  md += `| Utilă după reguli autorizare | *nu substituită aici*; POT pe teren CF **147 m²** |\n\n`;
  md += `${areas.usefulRegulatoryNote}\n\n`;
  md += `## Camere\n\n`;
  md += `| | V47 | V46 r7g |\n|--|-----|-----|\n`;
  md += `| Dorm principal | ${areas.dormPrincipal.toFixed(4)} | ${Number(v46a?.dorm_principal_m2 ?? 0).toFixed(4)} |\n`;
  md += `| Nișă dulap | ${areas.dormNisa.toFixed(4)} | ${Number(v46a?.dorm_nisa_m2 ?? 0).toFixed(4)} |\n`;
  md += `| Baie net | ${areas.bathNet.toFixed(4)} | ${Number(v46a?.bath_net_m2 ?? 0).toFixed(4)} |\n`;
  md += `| Terasă placă | ${areas.terracePlaca.toFixed(3)} | ${Number(v46a?.terrace_placa_m2 ?? 0).toFixed(3)} |\n`;
  md += `| Terasă liberă | **${areas.terraceLib.toFixed(2)}** | ${Number(v46a?.terrace_libera_m2 ?? 0).toFixed(2)} |\n`;
  md += `| Util geom. | **${areas.usefulGeom.toFixed(4)}** | ${Number(v46a?.useful_interior_net_m2 ?? 0).toFixed(4)} |\n\n`;
  md += `\`\`\`\nPereți cm²: ${JSON.stringify(areas.wallPartsCm2, null, 2)}\nGoluri: ${JSON.stringify(areas.openingsVoidCm2)}\n\`\`\`\n`;
  return md;
}

function reportMd(v47, areas, v45a) {
  const corr = (v47.corrections_applied || []).map((c) => `- **${c.id}**: ${c.change}`).join("\n");
  const warns = (v47.warnings_cm || []).map((w) => `- **${w.id}** (${w.severity}): ${w.note}`).join("\n");
  const cl = v47.clearances_cm || {};
  const diag = v47.stair_cm?.white_stripes_diagnosis || {};
  const din = v47.dining_check || {};
  return `# V46 — raport + comparație V45

## Modificări față de V45
1. Palier superior **Y470–590** (120 cm); perete living–palier **Y440–470**
2. Intrare **Y475–565** pe vest palier (balama N păstrată)
3. Buc est: frigider Y580–645 · MSV 645–705 · chiuvetă corp 60×60 Y705–765 (+5 cm la colț)
4. **Ecran frigider** X475–535 Y565–577,5 (60×12,5) — mascare laterală, fără vestibul
5. Duș: închidere **glisantă** pe est; «dreapta» = spre nord, privit din baie spre est
6. Masă **Ø100** @ X510,Y320 + 4 scaune cu rezervă retragere
7. Dungi albe scară: identificate și corectate (vezi mai jos)

## Dungi albe de lângă scară
- **Cauză:** ${diag.cause || "—"}
- **Corecție:** ${diag.fix || "—"}
- Nu erau rosturi între trepte; erau **goluri de reprezentare** (background SVG / spațiu nedesenat în bandă).

## Util
| | V46 | V45 |
|--|-----|-----|
| Anvelopă | ${areas.envelopeShoelace.toFixed(4)} | ${Number(v45a?.envelope_interior_shoelace_m2 ?? 39.125).toFixed(4)} |
| Util geom. | **${areas.usefulGeom.toFixed(4)}** | ${Number(v45a?.useful_interior_net_m2 ?? 38.0688).toFixed(4)} |
| Δ | **${(areas.usefulGeom - Number(v45a?.useful_interior_net_m2 ?? 38.0688)).toFixed(4)}** | |

## Corecții aplicate
${corr}

## Dining (Ø100)
- Poziție finală: ${din.final_position || "X510 Y320"}
- Table→canapea: ${din.min_clearances_cm?.table_n_to_sofa_closed ?? "—"} cm
- Scaun N în folosire→canapea: **${din.min_clearances_cm?.chair_n_in_use_to_sofa ?? "—"} cm**
- ${din.chair_n_sofa || ""}
- 290 cm = lățime living, **nu** circulație liberă

## Clearances
- Intrare↔frigider: ${cl.entry_to_fridge_cm ?? cl.entry_to_fridge_after_fix_cm} cm (+ mâner ${cl.entry_handle_allowance_cm || 8} cm)
- Ecran↔frigider: **${cl.screen_to_fridge_cm ?? 2.5} cm** (montaj/aerisire de confirmat)
- Vest ecran→perete dorm: **${cl.screen_west_to_dorm_wall_cm ?? 115} cm**
- Pat↔foaie dorm: ${cl.bed_to_door_leaf_cm} cm
- Dacă montajul cere gap 5 cm: mutare frigider +2,5 sud și MSV+chiuv +2,5 sud (gap colț 5→2,5); **modulele 60 cm neschimbate** — neaplicat

## Avertismente / ipoteze
${warns}

## Ipoteze păstrate
Placă 15 · elevație +32 · cadastru 147 (POT) · amplasare neschimbată · WC cadru 15 · canapea desfăcută neconfirmată

## Nu «verificat»
Tâmplărie dorm–terasă, montaj gol buc–terasă, mecanism glisant duș (schematic), fronturi dulap.
`;
}

function main() {
  const v47 = read("data/building/v47_exact.json");
  const v46Baseline = read("data/building/v46_exact.json");
  const areas = computeAreas(v47);
  const v46a = v46Baseline.areas_cm;

  v47.areas_cm.envelope_interior_shoelace_m2 = areas.envelopeShoelace;
  v47.areas_cm.interior_walls_gross_m2 = areas.wallsGross;
  v47.areas_cm.interior_walls_overlaps_m2 = areas.wallsOverlaps;
  v47.areas_cm.interior_walls_openings_void_m2 = areas.openingsVoid;
  v47.areas_cm.interior_walls_net_m2 = areas.wallsNet;
  v47.areas_cm.useful_geometric_m2 = areas.usefulGeom;
  v47.areas_cm.useful_interior_m2 = areas.usefulGeom;
  v47.areas_cm.useful_interior_net_m2 = areas.usefulGeom;
  v47.areas_cm.decomposition = `${areas.envelopeShoelace.toFixed(4)} − ${areas.wallsNet.toFixed(4)} = ${areas.usefulGeom.toFixed(4)} m²`;
  v47.areas_cm.dorm_principal_m2 = areas.dormPrincipal;
  v47.areas_cm.dorm_nisa_m2 = areas.dormNisa;
  v47.areas_cm.bath_base_m2 = areas.bathBase;
  v47.areas_cm.bath_niche_cut_m2 = areas.nicheCut;
  v47.areas_cm.bath_net_m2 = areas.bathNet;
  v47.areas_cm.terrace_placa_m2 = areas.terracePlaca;
  v47.areas_cm.terrace_libera_m2 = areas.terraceLib;
  v47.areas_cm.stair_band_m2 = areas.stair;
  v47.areas_cm.envelope_gross_m2 = areas.env;
  v47.areas_cm.wall_parts_cm2 = areas.wallPartsCm2;
  v47.areas_cm.openings_void_cm2 = areas.openingsVoidCm2;
  v47.areas_cm.method =
    "shoelace(anvelopă) − reuniune pereți int (−goluri); util geometric ≠ certificat autorizare";

  write("data/building/v47_exact.json", JSON.stringify(v47, null, 2) + "\n");
  write("viewer/data/v47_exact.json", JSON.stringify(v47, null, 2) + "\n");
  write("outputs/plans/21_v47_exact_plan.svg", planSvg(v47, areas));
  write("outputs/plans/22_v47_furniture_plan.svg", furniturePlanSvg(v47));
  write("outputs/plans/23_v47_mep_plan.svg", mepPlanSvg(v47));
  write("outputs/plans/24_v47_etaj_plan.svg", etajPlanSvg(v47));
  write("outputs/plans/25_v47_sections.svg", sectionsSvg(v47));
  write("outputs/reports/v47_exact_surfaces.md", surfacesMd(v47, areas, v46a));
  write(
    "outputs/reports/v47_exact_surfaces.json",
    JSON.stringify(
      {
        ...areas,
        comparison_v46_r7g: {
          useful_net_m2: v46a?.useful_interior_net_m2,
          terrace_libera_m2: v46a?.terrace_libera_m2,
          bath_net_m2: v46a?.bath_net_m2,
        },
        corrections: v47.corrections_applied,
        warnings: v47.warnings_cm,
        open_issues: v47.open_issues,
        generated: new Date().toISOString(),
      },
      null,
      2
    )
  );
  write("outputs/reports/v47_vs_v46_r7g.md", v47ReportMd(v47, areas));
  write("outputs/reports/v47_report.md", v47ReportMd(v47, areas));
  write("outputs/reports/v47_sections_reserves.md", sectionsMd(v47));

  console.log(
    JSON.stringify(
      {
        ok: true,
        rev: v47.meta?.rev,
        useful_geom_m2: areas.usefulGeom,
        bath_net_m2: areas.bathNet,
        terrace_libera_m2: areas.terraceLib,
        furniture_count: v47.furniture_cm.length,
        plan: "outputs/plans/21_v47_exact_plan.svg",
        sections: "outputs/plans/25_v47_sections.svg",
        report: "outputs/reports/v47_report.md",
      },
      null,
      2
    )
  );
}

function sectionsSvg(v47) {
  const S = 1.2;
  const W = 1100;
  const H = 980;
  const parts = [];
  parts.push(
    `<text x="550" y="28" text-anchor="middle" font-size="14" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 rev.${v47.meta?.rev || 1} · secțiuni (parter/etaj + subsol)</text>`
  );
  parts.push(
    `<text x="550" y="46" text-anchor="middle" font-size="10" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">P: terasă→PRIMIRE→living · L-1: −48→−95→scară→−250 · clear 208 · poartă 6 m</text>`
  );
  // Sec A — bath E-W
  const ax = 40;
  const ay = 60;
  parts.push(`<text x="${ax}" y="${ay - 8}" font-size="11">Sec A — baie E–W @ Y100</text>`);
  parts.push(`<rect x="${ax}" y="${ay}" width="${360 * S}" height="${220 * S}" fill="#f7f4ef" stroke="#333"/>`);
  const elA = v47.sections_cm?.A_bath_ew?.elements || [];
  for (const e of elA) {
    const x = ax + e.x0 * S;
    const y = ay + (220 - e.z1) * S;
    const w = (e.x1 - e.x0) * S;
    const h = Math.max((e.z1 - e.z0) * S, 2);
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c4b090" stroke="#333"/>`);
    parts.push(
      `<text x="${x + 2}" y="${y + 10}" font-size="7" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(e.id)}</text>`
    );
  }
  parts.push(
    `<text x="${ax}" y="${ay + 240 * S}" font-size="8" fill="#555">șine distincte X118 / X121 · blat X135+ · perete 347.5</text>`
  );

  // Sec B — living N-S
  const bx = 500;
  const by = 60;
  parts.push(`<text x="${bx}" y="${by - 8}" font-size="11">Sec B — living N–S @ X400</text>`);
  parts.push(`<rect x="${bx}" y="${by}" width="${280 * S}" height="${220 * S}" fill="#f7f4ef" stroke="#333"/>`);
  for (const e of v47.sections_cm?.B_living_ns?.elements || []) {
    const x = bx + e.y0 * S * 0.5;
    const y = by + (220 - e.z1) * S;
    const w = (e.y1 - e.y0) * S * 0.5;
    const h = Math.max((e.z1 - e.z0) * S, 2);
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#8a9a78" stroke="#333"/>`);
    parts.push(
      `<text x="${x + 2}" y="${y + 10}" font-size="7">${esc(e.id)}</text>`
    );
  }

  // Sec C — stair schematic
  const cx = 40;
  const cy = 360;
  parts.push(`<text x="${cx}" y="${cy - 8}" font-size="11">Sec C — scară (schema)</text>`);
  const st = v47.sections_cm?.C_stair || {};
  let zx = cx;
  for (let i = 0; i < 8; i++) {
    parts.push(
      `<rect x="${zx}" y="${cy + 80 - i * 12}" width="28" height="12" fill="#b8a480" stroke="#333"/>`
    );
    zx += 28;
  }
  parts.push(
    `<text x="${cx}" y="${cy + 120}" font-size="8" fill="#333">riser ${st.riser_cm || 16} · tread ${st.tread_cm || 30} · clear ${st.clear_cm || 105} · parapet ${st.parapet_cm || 10} · FF→FF ${st.ff_to_ff_cm || 288}</text>`
  );
  parts.push(
    `<text x="${cx}" y="${cy + 140}" font-size="8" fill="#a33">Performanțe / alcătuiri = NECONFIRMATE</text>`
  );

  // Sec D — subsol cotat (încadrat în pagină)
  const bm = v47.basement_cm;
  const dx0 = 40;
  const dy0 = 560;
  parts.push(
    `<rect x="${dx0 - 10}" y="${dy0 - 24}" width="1020" height="400" fill="#fff" stroke="#333"/>`
  );
  parts.push(
    `<text x="${dx0}" y="${dy0 - 8}" font-size="11" font-family="IBM Plex Sans,Segoe UI,sans-serif">Sec D — subsol: curte −48 → racord → palier −95 → scară (8×19,375) → palier −250 · intrados −42 · clear 208</text>`
  );
  if (bm?.stair) {
    const lv = bm.levels_vs_ff_parter_cm || {};
    const scZ = 1.05;
    const zRef = dy0 + 40;
    const zSvg = (cm) => zRef - cm * scZ; // cm față de FF parter; negativ = mai jos pe pagină
    const xCourt = dx0 + 20;
    const xAcc = dx0 + 160;
    const xStair = dx0 + 320;
    const xRoom = dx0 + 560;
    // curte
    parts.push(`<line x1="${xCourt}" y1="${zSvg(-48)}" x2="${xAcc + 40}" y2="${zSvg(-48)}" stroke="#888" stroke-width="1.5"/>`);
    parts.push(`<text x="${xCourt}" y="${zSvg(-48) - 4}" font-size="8">curte −48</text>`);
    const cts = bm.court_to_access_steps;
    for (let i = 0; i < (cts?.count || 0); i++) {
      const z = -48 - cts.riser_cm * (i + 1);
      parts.push(
        `<rect x="${xCourt + 80 + i * 22}" y="${zSvg(z)}" width="20" height="${cts.riser_cm * scZ}" fill="#b09050" stroke="#333"/>`
      );
    }
    // palier −95
    parts.push(`<line x1="${xAcc}" y1="${zSvg(-95)}" x2="${xStair + 20}" y2="${zSvg(-95)}" stroke="#1d3557" stroke-width="2"/>`);
    parts.push(`<text x="${xAcc}" y="${zSvg(-95) - 4}" font-size="8">palier −95</text>`);
    // scară 7 călcări
    for (let i = 0; i < bm.stair.treads; i++) {
      const zT = -95 - bm.stair.riser_cm * (i + 1);
      parts.push(
        `<rect x="${xStair + i * 28}" y="${zSvg(zT)}" width="24" height="5" fill="#8a93a0" stroke="#333"/>`
      );
      parts.push(
        `<text x="${xStair + i * 28}" y="${zSvg(zT) - 2}" font-size="5.5">${zT.toFixed(1)}</text>`
      );
    }
    // FF −250 + cameră + intrados
    parts.push(`<line x1="${xStair}" y1="${zSvg(-250)}" x2="${xRoom + 320}" y2="${zSvg(-250)}" stroke="#333" stroke-width="2"/>`);
    parts.push(`<text x="${xRoom}" y="${zSvg(-250) - 4}" font-size="8">FF subsol −250</text>`);
    const soff = lv.slab_soffit_cm ?? -42;
    parts.push(`<line x1="${xRoom}" y1="${zSvg(soff)}" x2="${xRoom + 320}" y2="${zSvg(soff)}" stroke="#c1121f" stroke-width="2"/>`);
    parts.push(`<text x="${xRoom + 200}" y="${zSvg(soff) - 4}" font-size="8" fill="#c1121f">intrados ${soff}</text>`);
    parts.push(
      `<rect x="${xRoom}" y="${zSvg(soff)}" width="200" height="${(soff - -250) * scZ}" fill="#dce4ec" opacity="0.55" stroke="#1d3557"/>`
    );
    parts.push(`<text x="${xRoom + 20}" y="${zSvg(-140)}" font-size="9">camere L-1</text>`);
    const xDim = xRoom + 280;
    parts.push(`<line x1="${xDim}" y1="${zSvg(soff)}" x2="${xDim}" y2="${zSvg(-250)}" stroke="#2d6a4f" stroke-width="1.5"/>`);
    parts.push(
      `<text x="${xDim + 6}" y="${(zSvg(soff) + zSvg(-250)) / 2}" font-size="10" fill="#2d6a4f">clear ${lv.clear_height_cm ?? 208}</text>`
    );
    parts.push(
      `<text x="${dx0}" y="${dy0 + 360}" font-size="8" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">${bm.stair.risers}×${bm.stair.riser_cm.toFixed(3)}=${(bm.stair.risers * bm.stair.riser_cm).toFixed(3)} cm · ${bm.stair.treads} călcări · planșeu ${lv.floor_slab_th_cm ?? 15} cm · P10: terasă→PRIMIRE→living</text>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  ${parts.join("\n  ")}
</svg>`;
}

function sectionsMd(v47) {
  return `# V46 — secțiuni / rezerve

Vezi și \`outputs/plans/25_v47_sections.svg\`.

## Date
\`\`\`json
${JSON.stringify(v47.sections_cm || {}, null, 2)}
\`\`\`

## Construcție
\`\`\`json
${JSON.stringify(v47.construction_assemblies || {}, null, 2)}
\`\`\`
`;
}

function rev7ReportRestored(v47, areas) {
  return `# V46 rev. 7 (r7g) — restaurat

## Parter
- **Intrare** = fostul gol bucătărie–terasă: **X330–360 Y680–770**.
- **Terasă** X0–565 Y675–975; sud neacoperit; **2 trepte vizibile** Y975–1035.
- **Parapet** sud cu gol pe latimea treptelor; stânga+dreapta.

## Etaj
- **Înghețat** — terasă 330×185; intrare pe \`buc_est\`.

## Util
- **${areas.usefulGeom.toFixed(4)} m²** · terasă liberă ~**${areas.terraceLib.toFixed(2)} m²**.

> Varianta r8 (sit/subsol/primire) a fost anulată — nu e sursă.
`;
}

function rev6Report(v47, areas) {
  const ac = v47.mep_cm?.ac?.outdoor?.[0];
  const st = v47.stair_cm || {};
  return `# V46 rev. 6 — feedback

## AC outdoor
- Mutat pe fațada **VEST** @ X${ac?.x} Y${ac?.y} (${ac?.dx}×${ac?.dy}) — nu pe est/Dragalina.

## TV și casete
- **Nu** se prinde TV în casetă (dibluri/prize adânci interzise în volumul foii).
- Living: consolă (soluția A).
- Dorm: pe solid Y500–580; dacă trebuie ecran mai mare pe același perete → îngroșare locală 15 cm (opțiunea C, neaplicată).

## WC
- Readus pe peretele sud baie (X170–230 cadru). Pocket baie←dorm **nefezabil** cu această poziție; accesul 2 = **batantă** pe același gol (studiu).

## Bagaje / intrare
- Bagaje colț **sud-vest** dorm X30 Y605.
- Pantofar scos; **dulap_intrare** 30×70 pe prelungirea buc_est (vest de peretele gros), sud de ușă.

## Podest vs scară
- Cauză: zbor sud/podest aveau **130** cm, rampa **115** (105+10).
- Corecție: podest și zbor sud = **115** = clear 105 + parapet 10 — aceeași bandă ca scara.
- Palier superior pe clear **105**.

Util: **${areas.usefulGeom.toFixed(4)} m²**
`;
}

function rev5Report(v47, areas) {
  const tv = v47.furniture_cm.find((f) => f.id === "tv");
  const dus = v47.furniture_cm.find((f) => f.id === "dus");
  const od = v47.openings_cm.find((o) => o.id === "baie_usa_dorm");
  const din = v47.dining_check_r5 || {};
  return `# V46 rev. 5 — conflicte corectate

## 1. TV living
- **Înainte:** Y200–300 peste gol baie Y180–260 și aproape de gol dorm.
- **Acum:** consolă **X375–415 Y55–145** (nord de gol); priză pe solid Y30–95.
- Vizualizare: distanță **${tv?.viewing?.distance_cm} cm**, unghi față de vest **${tv?.viewing?.angle_from_sofa_west_facing_deg}°**.

## 2. Noptiere
- **noptiera_n** X40 Y370 — sertare nord.
- **noptiera_s** X40 Y573 — sertare sud.
- Prize/lumini mutate corespunzător.

## 3. Duș
- Glisare **→ nord**; gol utilizabil **${dus?.enclosure?.clear_passage_open?.clear_width_cm} cm** pe **SUD** (Y112.5–187.5).
- Șine distincte X118 (fix) / X121 (mobil).
- Accesul nord lângă blat (13 cm) **nu** mai e declarat funcțional.

## 4. Mobilier baie / acces
- Dulap înalt → **X155–195 Y100–155** (nu spatele ușii).
- Uscător separat X320; suport prosoape pe solid **Y260–292.5**.

## 5. Baie ← dorm
- WC/cadru mutați vest (cadru X90–145).
- Casetă X177.5–262.5; gol X262.5–342.5.
- Overlap volumetric casetă↔cadru: **${od?.feasibility?.physical_overlap_cassette_vs_wc_frame}**.
- Status: **CONDITIONAL** (instalații/fonic/kit — nu declared_buildable).
- Corecție text: Y180–260 = gol, nu solid; solid între goluri = 32.5 cm.

## 6. TV dorm / AC
- TV pe fața dorm **X339.5** Y500–580.
- AC dorm pe perete N **Y282.5** X180–270 (în cameră).

## 7. Intrare
- Cuier X525–535 Y570+ (apartament); pantofar X480 Y568; tablou bucătărie X505 Y655.
- Palier: liber 105 + parapet 10 neschimbat de aceste piese.

## 8. Bucătărie
- Aparate mici X480–530 în blat; sertar în modul est; cuptor ref. ~56 în corp 60.

## 9. Dining (AABB rotit)
| | Ocupate | Retrase |
|--|---------|---------|
| →dorm | ${din.occupied?.path_dorm_free_cm} | ${din.retreated?.path_dorm_free_cm} |
| →baie | ${din.occupied?.path_bath_free_cm} | ${din.retreated?.path_bath_free_cm} |
| →intrare | ${din.occupied?.path_entry_free_cm} | ${din.retreated?.path_entry_free_cm} |
| Canapea desf. ∩ masă | ${din.sofa_open_vs_table} | |

## 10. Suprafețe
- Îngroșare 12.5→15: **0.15375 m²** brut (2.5×615/10000); neaplicată.
- Dulap util **63 cm** (eliminat 55).
- Util geom.: **${areas.usefulGeom.toFixed(4)} m²**

## Rămase
${(v47.open_issues || []).map((x) => `- ${x}`).join("\n")}
`;
}

main();
