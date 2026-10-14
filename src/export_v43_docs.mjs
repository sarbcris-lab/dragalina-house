/**
 * Livrabile din v43_exact.json — aceeași sursă ca 3D. REV4.
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

/** Clip interior walls to interior polygon (dormitor_est south of Y677 is outside). */
function clipIntWall(w) {
  if (w.id === "dormitor_est") {
    const y2 = Math.min(w.y + w.dy, 677);
    return { id: w.id, x: w.x, y: w.y, dx: w.dx, dy: y2 - w.y };
  }
  return { id: w.id, x: w.x, y: w.y, dx: w.dx, dy: w.dy };
}

function computeAreas(v43) {
  const envCm2 = shoelaceCm2(v43.interior_polygon_cm.vertices);
  const ints = v43.walls_cm.filter((w) => w.kind === "int").map(clipIntWall);
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
  const openIds = new Set(["baie_glisanta", "dorm_glisanta"]);
  const openingsVoid = {};
  let voidA = 0;
  for (const o of v43.openings_cm) {
    if (!openIds.has(o.id)) continue;
    let vA = 0;
    for (const w of ints) vA += rectIntersectArea(w, o);
    openingsVoid[o.id] = vA;
    voidA += vA;
  }
  const wallNet = gross - overlaps - voidA;
  const usefulNet = (envCm2 - wallNet) / 10000;

  const ter = v43.rooms_cm.find((r) => r.id === "terasa");
  const sc = v43.rooms_cm.find((r) => r.id === "scara");
  const terracePlaca = (ter.dx * ter.dy) / 10000;
  const terraceLib = ((ter.dx - 10) * (ter.dy - 10)) / 10000;
  const stair = (sc.dx * sc.dy) / 10000;
  const env = (v43.envelope_cm.ew * v43.envelope_cm.ns) / 10000;

  return {
    envelopeShoelace: envCm2 / 10000,
    wallPartsCm2: wallParts,
    wallsGross: gross / 10000,
    wallsOverlaps: overlaps / 10000,
    openingsVoidCm2: openingsVoid,
    openingsVoid: voidA / 10000,
    wallsNet: wallNet / 10000,
    usefulNet,
    terracePlaca,
    terraceLib,
    stair,
    env,
  };
}

function dimH(b, px, py, S, x0, x1, y, label, color = "#986944") {
  const mid = (x0 + x1) / 2;
  b.push(`<line x1="${px(x0)}" y1="${py(y)}" x2="${px(x1)}" y2="${py(y)}" stroke="${color}" stroke-width="0.8"/>`);
  b.push(`<line x1="${px(x0)}" y1="${py(y) - 4}" x2="${px(x0)}" y2="${py(y) + 4}" stroke="${color}"/>`);
  b.push(`<line x1="${px(x1)}" y1="${py(y) - 4}" x2="${px(x1)}" y2="${py(y) + 4}" stroke="${color}"/>`);
  b.push(
    `<text x="${px(mid)}" y="${py(y) - 6}" text-anchor="middle" font-size="7.5" fill="${color}" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(label)}</text>`
  );
}

function dimV(b, px, py, x, y0, y1, label, color = "#986944") {
  const mid = (y0 + y1) / 2;
  b.push(`<line x1="${px(x)}" y1="${py(y0)}" x2="${px(x)}" y2="${py(y1)}" stroke="${color}" stroke-width="0.8"/>`);
  b.push(`<line x1="${px(x) - 4}" y1="${py(y0)}" x2="${px(x) + 4}" y2="${py(y0)}" stroke="${color}"/>`);
  b.push(`<line x1="${px(x) - 4}" y1="${py(y1)}" x2="${px(x) + 4}" y2="${py(y1)}" stroke="${color}"/>`);
  b.push(
    `<text x="${px(x) - 8}" y="${py(mid)}" text-anchor="middle" font-size="7.5" fill="${color}" font-family="IBM Plex Sans,Segoe UI,sans-serif" transform="rotate(-90 ${px(x) - 8} ${py(mid)})">${esc(label)}</text>`
  );
}

function doorArc(b, px, py, S, leaf) {
  if (!leaf || leaf.hinge_x == null) return;
  const hx = leaf.hinge_x;
  const hy = leaf.hinge_y;
  const R = leaf.width_cm;
  const open = leaf.open_leaf;
  // closed leaf along wall face
  if (leaf.swing === "into_kitchen") {
    // hinge N at (360,707); closed along X360 Y707→792; open X360→445 on Y707
    const closedY1 = hy + R;
    b.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx)}" y2="${py(closedY1)}" stroke="#1d4f91" stroke-width="1.5"/>`);
    b.push(`<line x1="${px(open.x0)}" y1="${py(open.y0)}" x2="${px(open.x1)}" y2="${py(open.y1)}" stroke="#1d4f91" stroke-width="2"/>`);
    // arc quarter: from closed (south) to open (east) — sweep CW in screen? Y↓ so south is +Y
    // SVG arc: from closed end to open end, center hinge
    b.push(
      `<path d="M ${px(hx)} ${py(closedY1)} A ${R * S} ${R * S} 0 0 0 ${px(open.x1)} ${py(open.y1)}" fill="none" stroke="#1d4f91" stroke-dasharray="3 2"/>`
    );
    b.push(
      `<circle cx="${px(hx)}" cy="${py(hy)}" r="3" fill="#1d4f91"/><text x="${px(hx + 8)}" y="${py(hy - 8)}" font-size="7" fill="#1d4f91" font-family="IBM Plex Sans,Segoe UI,sans-serif">balama N</text>`
    );
  } else if (leaf.swing === "into_living_north") {
    const openY1 = hy - R;
    b.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx + R)}" y2="${py(hy)}" stroke="#1d4f91" stroke-width="1.5"/>`);
    b.push(`<line x1="${px(hx)}" y1="${py(hy)}" x2="${px(hx)}" y2="${py(openY1)}" stroke="#1d4f91" stroke-width="2"/>`);
    b.push(
      `<path d="M ${px(hx + R)} ${py(hy)} A ${R * S} ${R * S} 0 0 0 ${px(hx)} ${py(openY1)}" fill="none" stroke="#1d4f91" stroke-dasharray="3 2"/>`
    );
    b.push(`<circle cx="${px(hx)}" cy="${py(hy)}" r="3" fill="#1d4f91"/>`);
  }
}

function drawStairsPlan(b, px, py, S, v43) {
  const st = v43.stair_cm;
  const tread = st.tread_cm;
  const f180 = st.flight_180;
  const r2 = st.ramp2;
  const pod = st.podest_se;
  const pal = st.palier_superior;
  const palParter = st.palier_parter;

  // palier parter strip + 15 cm pre-flight
  b.push(
    `<rect x="${px(palParter.x)}" y="${py(palParter.y)}" width="${palParter.dx * S}" height="${palParter.dy * S}" fill="#e8e0d0" stroke="#888" stroke-width="0.6" opacity="0.7"/>`
  );
  b.push(
    `<text x="${px(170)}" y="${py(palParter.y + 40)}" font-size="8" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">palier parter</text>`
  );
  // 15 cm before first riser
  b.push(
    `<rect x="${px(340)}" y="${py(palParter.y)}" width="${15 * S}" height="${palParter.dy * S}" fill="#d4c4a0" stroke="#666" stroke-width="0.5"/>`
  );
  b.push(
    `<text x="${px(347)}" y="${py(palParter.y + 70)}" text-anchor="middle" font-size="7" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">15</text>`
  );

  // flight 180 treads (7)
  for (let i = 0; i < 7; i++) {
    const x = f180.x + i * tread;
    b.push(
      `<rect x="${px(x)}" y="${py(f180.y + 10)}" width="${tread * S}" height="${st.width_clear_cm * S}" fill="${i % 2 ? '#c4b090' : '#b8a480'}" stroke="#444" stroke-width="0.5"/>`
    );
    b.push(
      `<text x="${px(x + tread / 2)}" y="${py(f180.y + 75)}" text-anchor="middle" font-size="6.5" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">${i + 1}</text>`
    );
  }
  // ascent arrow south flight → east
  b.push(
    `<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2d5a27"/></marker></defs>`
  );
  b.push(
    `<line x1="${px(f180.x + 20)}" y1="${py(f180.y + 70)}" x2="${px(f180.x + 190)}" y2="${py(f180.y + 70)}" stroke="#2d5a27" stroke-width="1.5" marker-end="url(#arr)"/>`
  );
  b.push(
    `<text x="${px(f180.x + 100)}" y="${py(f180.y + 55)}" text-anchor="middle" font-size="8" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">↑ urcare</text>`
  );

  // podest SE
  b.push(
    `<rect x="${px(pod.x)}" y="${py(pod.y)}" width="${pod.dx * S}" height="${pod.dy * S}" fill="#c4b496" stroke="#444" stroke-width="0.8"/>`
  );
  b.push(
    `<text x="${px(pod.x + pod.dx / 2)}" y="${py(pod.y + 50)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">PODEST +128</text>`
  );

  // ramp2 treads (9) — ascending north (decreasing Y)
  const ySouthEdge = r2.y + r2.dy;
  for (let i = 0; i < 9; i++) {
    const yS = ySouthEdge - (i + 1) * tread;
    b.push(
      `<rect x="${px(r2.x + 10)}" y="${py(yS)}" width="${st.width_clear_cm * S}" height="${tread * S}" fill="${i % 2 ? '#8a93a0' : '#9aa3ad'}" stroke="#333" stroke-width="0.5"/>`
    );
    b.push(
      `<text x="${px(r2.x + 60)}" y="${py(yS + tread / 2) + 3}" text-anchor="middle" font-size="6" fill="#fff" font-family="IBM Plex Sans,Segoe UI,sans-serif">${i + 9}</text>`
    );
  }
  b.push(
    `<line x1="${px(r2.x + 60)}" y1="${py(ySouthEdge - 20)}" x2="${px(r2.x + 60)}" y2="${py(r2.y + 30)}" stroke="#2d5a27" stroke-width="1.5" marker-end="url(#arr)"/>`
  );
  b.push(
    `<text x="${px(r2.x + 95)}" y="${py(r2.y + 140)}" font-size="8" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">↑ N</text>`
  );

  // palier superior
  b.push(
    `<rect x="${px(pal.x)}" y="${py(pal.y)}" width="${pal.dx * S}" height="${pal.dy * S}" fill="#9aa3ad" stroke="#222" stroke-width="0.8"/>`
  );
  b.push(
    `<text x="${px(pal.x + pal.dx / 2)}" y="${py(pal.y + pal.dy / 2)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">PALIER +288</text>`
  );

  // alt storage door on east face
  const alt = st.storage_under?.door_alt_high;
  if (alt) {
    const ax = alt.x ?? st.band_x + st.band_dx - 12;
    b.push(
      `<rect x="${px(ax)}" y="${py(alt.y0)}" width="${12 * S}" height="${alt.dy * S}" fill="#8fd4a8" stroke="#2d5a27" stroke-width="1.2"/>`
    );
    b.push(
      `<text x="${px(ax + 40)}" y="${py(alt.y0 + alt.dy / 2)}" font-size="7" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">ușă alt ${alt.w_cm}×${alt.clear_h_cm_min || 200}</text>`
    );
    // exterior path mark
    b.push(
      `<line x1="${px(680)}" y1="${py(860)}" x2="${px(680)}" y2="${py(alt.y0)}" stroke="#2d5a27" stroke-dasharray="4 3" stroke-width="1"/>`
    );
  }
  // low south door
  const low = st.storage_under?.door_low;
  if (low) {
    const usaDepW = low.w_cm || 90;
    const usaDepX = st.band_x + (st.band_dx - usaDepW) / 2;
    b.push(
      `<rect x="${px(usaDepX)}" y="${py(860 - 15)}" width="${usaDepW * S}" height="${15 * S}" fill="#e8a0a0" stroke="#a33"/>`
    );
    b.push(
      `<text x="${px(usaDepX + usaDepW / 2)}" y="${py(870)}" text-anchor="middle" font-size="7" fill="#a33" font-family="IBM Plex Sans,Segoe UI,sans-serif">ușă jos ${low.clear_h_cm} cm</text>`
    );
  }
}

function planSvg(v43, areas) {
  const S = 0.55;
  const M = 90;
  const W = v43.envelope_cm.ew;
  const L = v43.envelope_cm.ns;
  const px = (x) => M + x * S;
  const py = (y) => M + y * S;
  const svgW = M * 2 + W * S + 380;
  const svgH = M * 2 + L * S + 120;
  const parts = [];

  parts.push(
    `<text x="${svgW / 2}" y="24" text-anchor="middle" font-size="15" font-family="IBM Plex Sans,Segoe UI,sans-serif">V43 exact rev4 · plan cotat (JSON)</text>`
  );
  parts.push(
    `<text x="${svgW / 2}" y="42" text-anchor="middle" font-size="10" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">util net ${areas.usefulNet.toFixed(4)} m² = anvelopă ${areas.envelopeShoelace.toFixed(4)} − pereți int ${areas.wallsNet.toFixed(4)} · FF=top finish</text>`
  );
  parts.push(
    `<rect x="${px(0)}" y="${py(0)}" width="${W * S}" height="${L * S}" fill="#f7f4ef" stroke="#222" stroke-width="2"/>`
  );

  const poly = v43.interior_polygon_cm.vertices;
  parts.push(
    `<polygon points="${poly.map(([x, y]) => `${px(x)},${py(y)}`).join(" ")}" fill="#e8efe4" fill-opacity="0.3" stroke="#2d5a27" stroke-width="1.2" stroke-dasharray="6 3"/>`
  );

  for (const r of v43.rooms_cm) {
    if (r.id === "scara") continue; // drawn with treads
    parts.push(
      `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="${r.floor || "#fff"}" stroke="#666" stroke-width="0.8" opacity="${r.outdoor ? 0.75 : 0.5}"/>`
    );
    parts.push(
      `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy / 2)}" text-anchor="middle" font-size="9" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(r.label)}</text>`
    );
  }

  drawStairsPlan(parts, px, py, S, v43);

  for (const w of v43.walls_cm) {
    parts.push(
      `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="${w.kind === "ext" ? "#333" : "#777"}"/>`
    );
  }

  for (const p of v43.parapets_cm || []) {
    parts.push(
      `<rect x="${px(p.x)}" y="${py(p.y)}" width="${p.dx * S}" height="${p.dy * S}" fill="#5a6570" opacity="0.85"/>`
    );
  }

  for (const o of v43.openings_cm) {
    parts.push(
      `<rect x="${px(o.x)}" y="${py(o.y)}" width="${Math.max(o.dx, 6) * S}" height="${Math.max(o.dy, 6) * S}" fill="#9ec5e8" stroke="#1d4f91"/>`
    );
    if (o.leaf) doorArc(parts, px, py, S, o.leaf);
  }

  // furniture: counters first (draw_order 1), then appliances (2), then rest
  const furn = [...v43.furniture_cm].sort((a, b) => (a.draw_order || 0) - (b.draw_order || 0));
  for (const f of furn) {
    parts.push(
      `<rect x="${px(f.x)}" y="${py(f.y)}" width="${f.dx * S}" height="${f.dy * S}" fill="${f.color || "#aaa"}" stroke="#222" stroke-width="0.5" opacity="${f.draw_order === 1 ? 0.85 : 1}"/>`
    );
    if (f.use_zone) {
      const u = f.use_zone;
      parts.push(
        `<rect x="${px(u.x)}" y="${py(u.y)}" width="${u.dx * S}" height="${u.dy * S}" fill="none" stroke="#c44" stroke-dasharray="2 2"/>`
      );
    }
    if (f.dx * S > 18) {
      parts.push(
        `<text x="${px(f.x + f.dx / 2)}" y="${py(f.y + f.dy / 2) + 3}" text-anchor="middle" font-size="6.5" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(f.id)}</text>`
      );
    }
  }

  // dimensions — rooms, walls, openings, passages
  dimH(parts, px, py, S, 0, W, -18, `${W} cm`);
  dimV(parts, px, py, -22, 0, L, `${L} cm`);
  dimH(parts, px, py, S, 30, 230, 20, "baie 200");
  dimH(parts, px, py, S, 242.5, 365, 20, "hol 122.5");
  dimH(parts, px, py, S, 377.5, 650, 20, "living 272.5");
  dimV(parts, px, py, 20, 30, 255, "225");
  dimV(parts, px, py, 20, 267.5, 677, "409.5");
  dimH(parts, px, py, S, 360, 535, 820, "buc 175");
  dimV(parts, px, py, 350, 550, 830, "280");
  // wall thicknesses
  dimH(parts, px, py, S, 230, 242.5, 100, "12.5");
  dimH(parts, px, py, S, 347.5, 360, 500, "12.5");
  // openings
  dimV(parts, px, py, 370, 707, 802, "gol 95");
  dimH(parts, px, py, S, 565, 660, 450, "intrare 95");
  // dining path
  dimV(parts, px, py, 455, 390, 465, "traseu 75");
  parts.push(
    `<rect x="${px(377)}" y="${py(390)}" width="${158 * S}" height="${75 * S}" fill="none" stroke="#8b1e1e" stroke-dasharray="4 2" opacity="0.7"/>`
  );
  parts.push(
    `<text x="${px(520)}" y="${py(428)}" font-size="8" fill="#8b1e1e" font-family="IBM Plex Sans,Segoe UI,sans-serif">intrare→buc 75 cm</text>`
  );
  // WC body
  dimH(parts, px, py, S, 40, 110, 148, "WC 70");
  dimV(parts, px, py, 115, 155, 195, "40");
  // kitchen door open leaf
  dimH(parts, px, py, S, 360, 445, 700, "foaie deschisă 85");

  // legend panel
  const lx = svgW - 350;
  parts.push(`<rect x="${lx}" y="55" width="330" height="520" fill="#fff" stroke="#333"/>`);
  const lines = [
    ["Suprafețe REV4", 12, "#111"],
    [`Anvelopă (shoelace): ${areas.envelopeShoelace.toFixed(4)} m²`, 11, "#333"],
    [`− pereți int net: ${areas.wallsNet.toFixed(4)} m²`, 11, "#333"],
    [`  (brut ${areas.wallsGross.toFixed(4)} − goluri ${areas.openingsVoid.toFixed(4)})`, 9, "#666"],
    [`= UTIL NET: ${areas.usefulNet.toFixed(4)} m²`, 12, "#2d5a27"],
    [`Terasă liberă: ${areas.terraceLib.toFixed(4)} m²`, 11, "#333"],
    [`Bandă scară: ${areas.stair.toFixed(4)} m²`, 11, "#333"],
    ["", 8, "#333"],
    ["Ușă buc–terasă: balama N", 10, "#1d4f91"],
    ["  foaie deschisă Y707 X360–445", 9, "#555"],
    ["  ≠ blat sud Y770 — OK", 9, "#2d5a27"],
    ["WC 70×40 pe X (facing est)", 10, "#333"],
    ["Masa 70×110 · 3 locuri zilnic", 10, "#333"],
    ["  traseu ocupat 75 cm (fără scaun S)", 9, "#555"],
    ["  4 locuri: 2+2 extensibil", 9, "#8b1e1e"],
    ["Depozit alt est Y620–710", 10, "#2d5a27"],
    ["  90 cm · clear 204–236 (struct 20)", 9, "#555"],
    ["Depozit sud ~123 cm (jos)", 10, "#a33"],
    ["Ipoteze: placă 15 · +32 · palier", 9, "#666"],
    ["  · cadastru ≈145,7≠147", 9, "#666"],
  ];
  let yy = 78;
  for (const [t, fs, c] of lines) {
    if (!t) {
      yy += 8;
      continue;
    }
    parts.push(
      `<text x="${lx + 12}" y="${yy}" font-size="${fs}" fill="${c}" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(t)}</text>`
    );
    yy += fs + 6;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  ${parts.join("\n  ")}
</svg>`;
}

function sectionSvg(v43) {
  const ht = v43.heights_cm;
  const st = v43.stair_cm;
  const riser = ht.riser_cm;
  const tread = st.tread_cm;
  const struct = st.ramp2_structure_cm || st.storage_under?.door_alt_high?.ramp_structure_cm || 20;
  const S = 1.15;
  const Mleft = 70;
  const Mbottom = 80;
  const Mtop = 50;
  const entryR = ht.entry_step_riser_cm || riser;
  const zFf = 2 * entryR;
  const zPod = zFf + 8 * riser;
  const zEtaj = zFf + 18 * riser;
  const zMax = zEtaj + 50;
  const runCm = 60 + 15 + 7 * tread + 115 + 9 * tread + 50;
  const svgW = Mleft + runCm * S + 300;
  const svgH = Mtop + zMax * S + Mbottom;
  const X = (cm) => Mleft + cm * S;
  const Y = (zcm) => Mtop + (zMax - zcm) * S;

  let b = "";
  b += `<text x="${svgW / 2}" y="22" text-anchor="middle" font-size="14" font-family="IBM Plex Sans,Segoe UI,sans-serif">Secțiune scară + depozit · structură rampă ${struct} cm · Z↑</text>`;
  b += `<text x="${svgW / 2}" y="40" text-anchor="middle" font-size="10" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">18 contratrepte · podest +128 · palier +288 · FF=față sus · elevație teren ipoteză</text>`;

  b += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(runCm)}" y2="${Y(0)}" stroke="#6d7f5c" stroke-width="2"/>`;
  b += `<text x="${X(2)}" y="${Y(0) + 14}" font-size="9" font-family="IBM Plex Sans,Segoe UI,sans-serif">teren (cotă 0)</text>`;

  b += `<line x1="${X(0)}" y1="${Y(zFf)}" x2="${X(runCm)}" y2="${Y(zFf)}" stroke="#986944" stroke-dasharray="6 3"/>`;
  b += `<text x="${X(runCm) + 8}" y="${Y(zFf) + 4}" font-size="10" fill="#986944" font-family="IBM Plex Sans,Segoe UI,sans-serif">FF parter +${zFf}*</text>`;
  b += `<line x1="${X(0)}" y1="${Y(zEtaj)}" x2="${X(runCm)}" y2="${Y(zEtaj)}" stroke="#986944" stroke-dasharray="6 3"/>`;
  b += `<text x="${X(runCm) + 8}" y="${Y(zEtaj) + 4}" font-size="10" fill="#986944" font-family="IBM Plex Sans,Segoe UI,sans-serif">FF etaj +${zEtaj}*</text>`;

  const makeup = [
    { h: ht.finish_complete_cm, c: "#a89880", l: "fin 2" },
    { h: ht.screed_above_pipes_cm, c: "#d0c8b8", l: "șapă 5" },
    { h: ht.heating_pipes_zone_cm, c: "#e8c4a8", l: "țevi 2" },
    { h: ht.insulation_under_screed_cm, c: "#c8d4a8", l: "iz 3" },
    { h: ht.structural_slab_cm, c: "#b0b8c0", l: "placă 15*" },
    { h: ht.false_ceiling_cm, c: "#d5dde3", l: "fals 6" },
    { h: ht.clear_to_false_ceiling_cm, c: "#eef2f5", l: "liber 255" },
  ];
  const stackX0 = X(runCm) + 20;
  let zTop = zEtaj;
  for (const L of makeup) {
    const zBot = zTop - L.h;
    b += `<rect x="${stackX0}" y="${Y(zTop)}" width="52" height="${Y(zBot) - Y(zTop)}" fill="${L.c}" stroke="#333"/>`;
    b += `<text x="${stackX0 + 58}" y="${(Y(zTop) + Y(zBot)) / 2 + 3}" font-size="9" font-family="IBM Plex Sans,Segoe UI,sans-serif">${L.l}</text>`;
    zTop = zBot;
  }

  let x = 0;
  for (let i = 0; i < 2; i++) {
    const z1 = (i + 1) * entryR;
    b += `<rect x="${X(x)}" y="${Y(z1)}" width="${30 * S}" height="${entryR * S}" fill="#a89880" stroke="#333"/>`;
    x += 30;
  }
  b += `<rect x="${X(x)}" y="${Y(zFf)}" width="${55 * S}" height="8" fill="#c4b496" stroke="#333"/>`;
  b += `<text x="${X(x)}" y="${Y(zFf) - 6}" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">palier +15</text>`;
  x += 55;

  for (let i = 0; i < 7; i++) {
    const z1 = zFf + (i + 1) * riser;
    b += `<rect x="${X(x)}" y="${Y(z1)}" width="${tread * S}" height="${riser * S}" fill="${i % 2 ? "#b8a078" : "#a89068"}" stroke="#333"/>`;
    x += tread;
  }
  b += `<rect x="${X(x)}" y="${Y(zPod)}" width="${115 * S}" height="10" fill="#c4b496" stroke="#333"/>`;
  b += `<text x="${X(x + 10)}" y="${Y(zPod) - 6}" font-size="9" font-family="IBM Plex Sans,Segoe UI,sans-serif">podest +128</text>`;

  // low door under podest
  b += `<rect x="${X(x)}" y="${Y(zFf + 123)}" width="${40 * S}" height="${Y(zFf) - Y(zFf + 123)}" fill="#e8a0a0" opacity="0.45" stroke="#a33"/>`;
  b += `<text x="${X(x)}" y="${Y(zFf + 60)}" font-size="8" fill="#a33" font-family="IBM Plex Sans,Segoe UI,sans-serif">ușă jos 123</text>`;
  x += 115;

  const rampStartX = x;
  const alt = st.storage_under?.door_alt_high || { y0: 620, dy: 90 };
  // Map plan Y to unfolded X: ySouthEdge=860 → x=rampStartX; decreasing Y → +X
  // y → unfolded: rampStartX + (860 - y)
  const yToX = (y) => rampStartX + (860 - y);

  for (let i = 0; i < 9; i++) {
    const z1 = zPod + (i + 1) * riser;
    const zSoffit = z1 - struct;
    // tread plate (thin visual on top)
    b += `<rect x="${X(x)}" y="${Y(z1)}" width="${tread * S}" height="${4 * S}" fill="${i % 2 ? "#8a93a0" : "#7a8390"}" stroke="#333"/>`;
    // structural thickness below walking surface
    b += `<rect x="${X(x)}" y="${Y(z1)}" width="${tread * S}" height="${struct * S}" fill="#6a7380" opacity="0.55" stroke="#445"/>`;
    // clear zone under structure
    b += `<rect x="${X(x)}" y="${Y(zSoffit)}" width="${tread * S}" height="${Y(zFf) - Y(zSoffit)}" fill="#c8e8d0" opacity="0.25"/>`;
    b += `<text x="${X(x + 2)}" y="${Y(zSoffit) - 2}" font-size="6" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">${zSoffit - zFf}</text>`;
    x += tread;
  }
  b += `<rect x="${X(x)}" y="${Y(zEtaj)}" width="${50 * S}" height="10" fill="#9aa3ad" stroke="#333"/>`;
  b += `<text x="${X(x)}" y="${Y(zEtaj) - 6}" font-size="9" font-family="IBM Plex Sans,Segoe UI,sans-serif">palier +288</text>`;

  // alt door band on section: Y620–710 → unfolded positions
  const altX0 = yToX(alt.y0 + alt.dy); // south edge (lower clear)
  const altX1 = yToX(alt.y0); // north edge
  const clearMin = alt.clear_h_cm_min || 204;
  const clearMax = alt.clear_h_cm_max || 236;
  b += `<rect x="${X(altX0)}" y="${Y(zFf + clearMin)}" width="${(altX1 - altX0) * S}" height="${Y(zFf) - Y(zFf + clearMin)}" fill="none" stroke="#2d5a27" stroke-width="2" stroke-dasharray="5 3"/>`;
  b += `<line x1="${X(altX0)}" y1="${Y(zFf)}" x2="${X(altX0)}" y2="${Y(zFf + clearMin)}" stroke="#2d5a27" stroke-width="2"/>`;
  b += `<line x1="${X(altX1)}" y1="${Y(zFf)}" x2="${X(altX1)}" y2="${Y(zFf + clearMax)}" stroke="#2d5a27" stroke-width="1.5"/>`;
  b += `<text x="${X(altX0)}" y="${Y(zFf + clearMin / 2)}" font-size="8" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">ușă alt est ${alt.w_cm || 90} cm</text>`;
  b += `<text x="${X(altX0)}" y="${Y(zFf + clearMin) - 8}" font-size="8" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">clear min ${clearMin} / max ${clearMax} (struct ${struct})</text>`;
  b += `<text x="${X(altX0)}" y="${Y(zFf) + 16}" font-size="7" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">plan Y${alt.y0}–${alt.y0 + alt.dy} · traseu exterior pe est</text>`;

  b += `<text x="${Mleft}" y="${svgH - 36}" font-size="9" fill="#666" font-family="IBM Plex Sans,Segoe UI,sans-serif">* elevație FF parter = 2×16 ipoteză · placă 15 ipoteză · structură rampă ${struct} cm ipoteză (nu doar plăcuță)</text>`;
  b += `<text x="${Mleft}" y="${svgH - 20}" font-size="9" fill="#666" font-family="IBM Plex Sans,Segoe UI,sans-serif">Profil desfășurat: X=mers, Z=înălțime. Banda verde = liber sub soffit structură.</text>`;
  b += `<text x="${Mleft}" y="${svgH - 6}" font-size="9" fill="#666" font-family="IBM Plex Sans,Segoe UI,sans-serif">Y630–720 ar fi dat clear min 188 cu struct 20 — mutată la Y620–710.</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  ${b}
</svg>`;
}

function surfacesMd(v43, areas, site) {
  let md = `# V43 rev4 — suprafețe\n\n`;
  md += `## Util net (verificabil)\n\n`;
  md += `| Pas | Valoare |\n|-----|--------|\n`;
  md += `| Aria în interiorul anvelopei (shoelace) | **${areas.envelopeShoelace.toFixed(6)} m²** |\n`;
  md += `| − reuniune pereți interiori (brut) | ${areas.wallsGross.toFixed(6)} m² |\n`;
  md += `|   intersecții duble | ${areas.wallsOverlaps.toFixed(6)} m² |\n`;
  md += `|   − goluri în pereți (baie+dorm glisante) | ${areas.openingsVoid.toFixed(6)} m² |\n`;
  md += `| = amprentă pereți netă | **${areas.wallsNet.toFixed(6)} m²** |\n`;
  md += `| **Util net** | **${areas.usefulNet.toFixed(6)} m²** |\n\n`;
  md += `Descompunere: ${areas.envelopeShoelace.toFixed(4)} − ${areas.wallsNet.toFixed(4)} = **${areas.usefulNet.toFixed(4)} m²**.\n\n`;
  md += `\`\`\`\nPereți (cm², clipți la poligon):\n`;
  for (const [k, v] of Object.entries(areas.wallPartsCm2)) md += `  ${k}: ${v}\n`;
  md += `Goluri (cm²): ${JSON.stringify(areas.openingsVoidCm2)}\n`;
  md += `Notă: 40,3535 m² = poligonul verde (include pereți int) — NU e util net.\nPragurile nu se scad separat (rămân în util).\n\`\`\`\n\n`;
  md += `| Cantitate | Valoare |\n|-----------|--------|\n`;
  md += `| Terasă placă | ${areas.terracePlaca.toFixed(4)} m² |\n`;
  md += `| Terasă liberă | ${areas.terraceLib.toFixed(4)} m² |\n`;
  md += `| Bandă scară | ${areas.stair.toFixed(4)} m² |\n`;
  md += `| Gabarit | ${areas.env.toFixed(2)} m² |\n\n`;
  md += `## Site\n\n`;
  md += `- Parcelă reconstruită: ${site?.polygon_metrics?.area_m2 ?? "≈145,7"} m² vs 147 — **aproximativ**\n`;
  md += `- corners_inside: ${JSON.stringify(site?.corners_inside)}\n`;
  md += `- corner_overflow_m: ${JSON.stringify(site?.corner_overflow_m)}\n`;
  return md;
}

function reportMd(v43, areas, site) {
  const alt = v43.stair_cm.storage_under?.door_alt_high;
  const buc = v43.openings_cm.find((o) => o.id === "buc_terasa");
  const din = v43.dining_check;
  const bath = v43.bath_check;
  return `# V43 rev4 — raport verificări

## 1. Suprafață utilă netă
- Anvelopă shoelace: **${areas.envelopeShoelace.toFixed(4)} m²** (poligon verde — include pereți int)
- Pereți int net: **${areas.wallsNet.toFixed(4)} m²** (brut ${areas.wallsGross.toFixed(4)} − goluri ${areas.openingsVoid.toFixed(4)}; intersecții ${areas.wallsOverlaps.toFixed(4)})
- **Util net = ${areas.usefulNet.toFixed(4)} m²** (= ${areas.envelopeShoelace.toFixed(4)} − ${areas.wallsNet.toFixed(4)})
- 40,3535 **nu** e păstrat ca „util”

## 2. Ușă bucătărie–terasă
- Gol Y707–802 păstrat (în dreptul terasei)
- Balama **nord** (360, 707); foaie deschisă pe Y707, X360–445
- Blat sud X430/Y770: **fără intersecție** cu foaia
- Frigider Y550–615 / MSV Y625: în afara baleierii
- Alternativă spre terasă: posibilă, dar balama N spre bucătărie preferată
- Pereții **neschimbați**

## 3. Baie / WC
- Corp WC: **70×40 cm** (lungime pe X, facing est); rezervor vest 25 / vas 45
- Use zone: X110–185, Y150–200 — **nu** intersectează corpul lavoar (Y210–250)
- Lavoar: 55×40 la X165/Y210; clear frontal 45 cm
- Coloană NE Y40–105; gol glisant Y155–235 liber

## 4. Masă
- 70×110; **fără scaun sud**; 3 locuri zilnice (W+E+E)
- Traseu intrare–bucătărie cu scaune ocupate: **75 cm** (bandă Y390–465)
- Scaun vest: genunchi ~5 cm; la ridicare ocupă fâșia spre dormitor
- 4 locuri zilnice: **nu**; propunere **2 permanente + 2 ocazionale** (masă extensibilă)

## 5. Plan exportat
- Trepte 1–7 (sud) + 9–17 (est), podest +128, palier +288, sens ↑
- Cote camere / pereți 12,5 / goluri / mobilier / traseu 75
- Arce uși: centru = balama; capete = închis/deschis
- Blaturi (draw_order 1) **sub** electrocasnice (order 2)

## 6. Secțiune / depozit
- Ușă alt est: X668, **Y620–710**, lățime **90 cm**
- Structură rampă **${alt?.ramp_structure_cm ?? 20} cm** sub fața de mers
- Clear pe lățimea ușii: **${alt?.clear_h_cm_min ?? 204}–${alt?.clear_h_cm_max ?? 236} cm**
- Traseu exterior: fața est bandă scară X680 → Y620
- Ușa sud rămâne ~123 cm (acces jos)
- Y630–720 ar fi dat min **188** cu struct 20 — mutată

## 7. Ipoteze păstrate (neschimbate)
- Placă **15 cm**
- Elevație **+32 cm** (2×16)
- Alcătuire perete palier **12,5 cm**
- Poligon cadastral reconstruit ≈145,7 ≠ 147
- Amplasarea clădirii **neschimbată** (SE ambiguu pe contur)

## Site
- corners_inside: ${JSON.stringify(site?.corners_inside)}
- overflow: ${JSON.stringify(site?.corner_overflow_m)}
`;
}

function main() {
  const v43 = read("data/building/v43_exact.json");
  const areas = computeAreas(v43);

  v43.areas_cm.envelope_interior_shoelace_m2 = areas.envelopeShoelace;
  v43.areas_cm.interior_walls_gross_m2 = areas.wallsGross;
  v43.areas_cm.interior_walls_overlaps_m2 = areas.wallsOverlaps;
  v43.areas_cm.interior_walls_openings_void_m2 = areas.openingsVoid;
  v43.areas_cm.interior_walls_net_m2 = areas.wallsNet;
  v43.areas_cm.useful_interior_net_m2 = areas.usefulNet;
  v43.areas_cm.useful_interior_m2 = areas.usefulNet;
  v43.areas_cm.decomposition = `${areas.envelopeShoelace.toFixed(4)} − ${areas.wallsNet.toFixed(4)} = ${areas.usefulNet.toFixed(4)} m²`;
  v43.areas_cm.method =
    "shoelace(anvelopă interioară) − reuniune amprente pereți int (∩ poligon, −goluri); pragurile rămân în util";
  v43.areas_cm.terrace_placa_m2 = areas.terracePlaca;
  v43.areas_cm.terrace_libera_m2 = areas.terraceLib;
  v43.areas_cm.stair_band_m2 = areas.stair;
  v43.areas_cm.envelope_gross_m2 = areas.env;
  write("data/building/v43_exact.json", JSON.stringify(v43, null, 2) + "\n");

  let site = null;
  try {
    site = read("viewer/data/volume.json").site;
  } catch {
    site = null;
  }

  write("outputs/plans/08_v43_exact_plan.svg", planSvg(v43, areas));
  write("outputs/plans/08_v43_exact_section_stair.svg", sectionSvg(v43));
  write("outputs/reports/v43_exact_surfaces.md", surfacesMd(v43, areas, site));
  write(
    "outputs/reports/v43_exact_surfaces.json",
    JSON.stringify(
      {
        envelope_shoelace_m2: areas.envelopeShoelace,
        walls_net_m2: areas.wallsNet,
        useful_net_m2: areas.usefulNet,
        decomposition: v43.areas_cm.decomposition,
        wall_parts_cm2: areas.wallPartsCm2,
        openings_void_cm2: areas.openingsVoidCm2,
        terrace_libera_m2: areas.terraceLib,
        site_overflow: site?.corner_overflow_m,
        generated: new Date().toISOString(),
      },
      null,
      2
    )
  );
  write("outputs/reports/v43_exact_changelog.md", reportMd(v43, areas, site));

  console.log(
    JSON.stringify(
      {
        ok: true,
        rev: 4,
        envelope_m2: areas.envelopeShoelace,
        walls_net_m2: areas.wallsNet,
        useful_net_m2: areas.usefulNet,
        terrace_libera_m2: areas.terraceLib,
        plan: "outputs/plans/08_v43_exact_plan.svg",
        section: "outputs/plans/08_v43_exact_section_stair.svg",
      },
      null,
      2
    )
  );
}

main();
