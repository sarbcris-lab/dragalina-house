/**
 * Dragalina 131 — generator parametric
 * Citește data/ → scrie outputs/ (SVG planuri + mesh JSON pentru viewer)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SCALE = 40; // px per meter for plans
const MARGIN = 80;

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function ensureDir(rel) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
  return p;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dimLine(x1, y1, x2, y2, label, offset = 18) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * offset;
  const ny = (dx / len) * offset;
  const ax1 = x1 + nx;
  const ay1 = y1 + ny;
  const ax2 = x2 + nx;
  const ay2 = y2 + ny;
  const mx = (ax1 + ax2) / 2;
  const my = (ay1 + ay2) / 2;
  return `
  <g class="dim" stroke="#1a1a1a" fill="#1a1a1a" stroke-width="0.8">
    <line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" />
    <line x1="${x1}" y1="${y1}" x2="${ax1}" y2="${ay1}" stroke-dasharray="2 2" />
    <line x1="${x2}" y1="${y2}" x2="${ax2}" y2="${ay2}" stroke-dasharray="2 2" />
    <text x="${mx}" y="${my - 4}" text-anchor="middle" font-size="11" font-family="IBM Plex Sans, Segoe UI, sans-serif">${esc(label)}</text>
  </g>`;
}

function rect(x, y, w, h, attrs = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${attrs} />`;
}

function label(x, y, lines, opts = {}) {
  const size = opts.size || 12;
  const anchor = opts.anchor || "middle";
  const fill = opts.fill || "#111";
  const tspan = lines
    .map(
      (l, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : size * 1.25}">${esc(l)}</tspan>`
    )
    .join("");
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${fill}" font-family="IBM Plex Sans, Segoe UI, sans-serif">${tspan}</text>`;
}

/** Plan coord: building local (x right, y north/up in meters) → SVG (y down) */
function toSvg(bx, by, flipYMax) {
  return {
    x: MARGIN + bx * SCALE,
    y: MARGIN + (flipYMax - by) * SCALE,
  };
}

function generateFloorPlan(building, levelId) {
  const env = building.envelope;
  const W = env.overall_width_m;
  const D = env.overall_depth_m;
  const svgW = MARGIN * 2 + W * SCALE + 120;
  const svgH = MARGIN * 2 + D * SCALE + 140;
  const P = (x, y) => toSvg(x, y, D);

  const band = building.bands;
  const zones = building.zones;
  const rooms = building.interior.rooms;

  let body = "";

  // Title + warning banner
  body += label(svgW / 2, 28, [
    `DRAGALINA 131 — PLAN ${levelId.toUpperCase()} · ${building.meta.id}`,
    "IPOTEZĂ DE LUCRU din schiță — NU geometrie cadastrală",
  ], { size: 13 });

  // Outer envelope
  const o0 = P(0, 0);
  const o1 = P(W, D);
  body += rect(o0.x, o1.y, W * SCALE, D * SCALE, `fill="#f7f4ef" stroke="#222" stroke-width="2.5"`);

  // Access band
  const a0 = P(band.access.x0, band.access.y0);
  const a1 = P(band.access.x1, band.access.y1);
  body += rect(
    a0.x,
    a1.y,
    (band.access.x1 - band.access.x0) * SCALE,
    (band.access.y1 - band.access.y0) * SCALE,
    `fill="#e8eef5" stroke="#445" stroke-width="1.2"`
  );

  // Zones in band
  for (const z of Object.values(zones)) {
    const p0 = P(z.x0, z.y0);
    const p1 = P(z.x1, z.y1);
    const fill =
      z.label.startsWith("TERAS") ? "#d7e8d3" :
      z.label.startsWith("SCAR") ? "#d9dce3" : "#eef2f7";
    body += rect(
      p0.x,
      p1.y,
      (z.x1 - z.x0) * SCALE,
      (z.y1 - z.y0) * SCALE,
      `fill="${fill}" stroke="#333" stroke-width="1"`
    );
    const cx = (p0.x + p0.x + (z.x1 - z.x0) * SCALE) / 2;
    const cy = (p1.y + p0.y) / 2;
    const area = z.area_net_m2 ?? z.area_m2;
    body += label(cx, cy, [z.label, `${area.toFixed(2)} m²`], { size: 11 });
  }

  // Body outline
  const b0 = P(band.body.x0, band.body.y0);
  const b1 = P(band.body.x1, band.body.y1);
  body += rect(
    b0.x,
    b1.y,
    (band.body.x1 - band.body.x0) * SCALE,
    (band.body.y1 - band.body.y0) * SCALE,
    `fill="none" stroke="#111" stroke-width="2.2"`
  );

  // Rooms
  for (const r of rooms) {
    const p0 = P(r.x0, r.y0);
    const p1 = P(r.x1, r.y1);
    body += rect(
      p0.x,
      p1.y,
      (r.x1 - r.x0) * SCALE,
      (r.y1 - r.y0) * SCALE,
      `fill="#fffdf8" stroke="#222" stroke-width="1.4"`
    );
    const cx = p0.x + ((r.x1 - r.x0) * SCALE) / 2;
    const cy = p1.y + ((r.y1 - r.y0) * SCALE) / 2;
    body += label(cx, cy - 6, [r.label, `${r.area_m2.toFixed(2)} m²`], { size: 11 });
  }

  // Street / alignment labels
  const s = P(W / 2, -0.55);
  body += label(s.x, s.y, ["STR. DRAGALINA — pe limita de proprietate / aliniament vecini"], { size: 11, fill: "#8b1e1e" });
  body += label(P(-0.15, D / 2).x, P(-0.15, D / 2).y, ["→ Cloșca / CURTE"], { size: 10, fill: "#2d5a27", anchor: "end" });


  // Dimensions
  const dA = P(0, 0);
  const dB = P(W, 0);
  const dC = P(0, D);
  body += dimLine(dA.x, dA.y, dB.x, dB.y, `${W.toFixed(2)} m`, 28);
  body += dimLine(dA.x, dA.y, dC.x, dC.y, `${D.toFixed(2)} m`, -36);

  const e0 = P(0, -0.15);
  const e1 = P(2.4, -0.15);
  const e2 = P(9.3, -0.15);
  // secondary dims above north
  const n0 = P(0, D);
  const n1 = P(2.4, D);
  const n2 = P(9.3, D);
  body += dimLine(n0.x, n0.y, n1.x, n1.y, "2.40", -22);
  body += dimLine(n1.x, n1.y, n2.x, n2.y, "6.90", -22);

  // North arrow
  const nx = svgW - 50;
  const ny = 70;
  body += `
  <g transform="translate(${nx},${ny})">
    <polygon points="0,-22 6,8 -6,8" fill="#111"/>
    <text y="22" text-anchor="middle" font-size="11" font-family="IBM Plex Sans, Segoe UI, sans-serif">N</text>
  </g>`;

  // Legend
  body += label(MARGIN, svgH - 50, [
    `Status: ${building.meta.status} · sursă schiță · amplasare: limită Dragalina + curte Cloșca`,
    `Pereți ext. ${env.wall_ext_m} m · int. ${env.wall_int_m} m · nivel ${levelId} h=${env.levels.find((l) => l.id === levelId)?.height_m ?? "?"} m`,
    building.placement?.width_conflict
      ? `⚠ Cote plan = schiță ${env.overall_width_m} m; pe sit FIT ${building.placement.fit_width_m} m (front ~${building.placement.site_front_width_m} m). Redimensionare necesară.`
      : "Două apt. independente · terasă privată ≠ curtea de pe Cloșca",
  ], { size: 10, anchor: "start", fill: "#333" });


  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#fafafa"/>
  <rect x="8" y="8" width="${svgW - 16}" height="44" fill="#fff3cd" stroke="#c9a227" stroke-width="1"/>
  ${body}
</svg>`;
}

function polyPoints(arr, P) {
  return arr
    .slice(0, -1)
    .map((v) => `${P(v.x, v.y).x},${P(v.x, v.y).y}`)
    .join(" ");
}

function generateSitePlan(parcel, building, polygon, footprint) {
  const W = polygon.metrics.bbox_m.width;
  const D = polygon.metrics.bbox_m.depth;
  const verts = polygon.vertices_m;
  const SITE_SCALE = Math.min(28, 560 / Math.max(W, D));
  const svgW = MARGIN * 2 + W * SITE_SCALE + 300;
  const svgH = MARGIN * 2 + D * SITE_SCALE + 220;
  const P = (x, y) => ({
    x: MARGIN + 90 + x * SITE_SCALE,
    y: MARGIN + 28 + (D - y) * SITE_SCALE,
  });

  let body = "";
  body += label(svgW / 2, 18, [
    "PLAN SITUAȚIE · casă NOUĂ pe 3 limite (N + Dragalina + Vest)",
    `Amprentă ${footprint.sketch.along_dragalina_m}×${footprint.sketch.depth_into_lot_m} m · ${footprint.areas.footprint_gross_m2} m² · curte → Cloșca`,
  ], { size: 11 });

  // Parcel
  body += `<polygon points="${polyPoints(verts, P)}" fill="#f4f7f2" stroke="#000" stroke-width="2.2" />`;

  // Curte zone label
  body += label(P(W * 0.4, D * 0.18).x, P(W * 0.4, D * 0.18).y, ["CURTE", "→ Cloșca"], {
    size: 12,
    fill: "#2d5a27",
  });

  // New footprint
  if (footprint?.footprint) {
    body += `<polygon points="${polyPoints(footprint.footprint.outer, P)}" fill="#b8c7db" stroke="#111" stroke-width="2.4" />`;
    body += `<polygon points="${polyPoints(footprint.footprint.access_band, P)}" fill="#8fa3bc" stroke="#111" stroke-width="1.2" opacity="0.95" />`;
    const o = footprint.footprint.outer;
    const cx = o.slice(0, -1).reduce((s, v) => s + v.x, 0) / 4;
    const cy = o.slice(0, -1).reduce((s, v) => s + v.y, 0) / 4;
    body += label(P(cx, cy).x, P(cx, cy).y, [
      "CASĂ NOUĂ P+1",
      `${footprint.sketch.along_dragalina_m} × ${footprint.sketch.depth_into_lot_m} m`,
      "bandă scară/terasă 2.40",
    ], { size: 10 });
  }

  // Vertex ids
  for (const v of verts.slice(0, -1)) {
    const p = P(v.x, v.y);
    body += `<circle cx="${p.x}" cy="${p.y}" r="2.8" fill="#000"/>`;
    body += label(p.x + 5, p.y + 3, [`${v.id}`], { size: 10, anchor: "start" });
  }

  body += label(P(W + 0.45, D * 0.55).x, P(W + 0.45, D * 0.55).y, [
    "STR. DRAGALINA",
    "casă pe limită",
  ], { size: 12, fill: "#000", anchor: "start" });
  body += label(P(W * 0.5, -0.75).x, P(W * 0.5, -0.75).y, ["STR. CLOȘCA"], {
    size: 12,
    fill: "#000",
  });

  const c = parcel.confirmed;
  body += `
  <rect x="12" y="${svgH - 95}" width="${svgW - 24}" height="82" fill="#fff" stroke="#333"/>
  ${label(22, svgH - 78, [
    `Demolare C1 (76 m²) + casă nouă ${footprint.areas.footprint_gross_m2} m² pe Dragalina (dreapta) · curte sud / Cloșca`,
    `Schiță: ${footprint.sketch.along_dragalina_m} m pe Dragalina (disponibil ~${footprint.placement.dragalina_length_m} m) · adâncime ${footprint.sketch.depth_into_lot_m} m în lot`,
    footprint.checks.depth_vs_parcel_width_note,
    `Parcelă CF măsurată ${c.area_measured_m2} m² · concept IPOTEZĂ — de verificat pe poligon.`,
  ], { size: 9, anchor: "start" })}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#fff"/>
  <rect x="8" y="8" width="${svgW - 16}" height="36" fill="#e3f2fd" stroke="#1565c0" stroke-width="1"/>
  ${body}
</svg>`;
}

function boxMesh(id, x0, y0, z0, x1, y1, z1, color) {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const cz = (z0 + z1) / 2;
  return {
    id,
    type: "box",
    center: [cx, cz, cy], // Three.js: y up → map building y→z, building z→y
    size: [x1 - x0, z1 - z0, y1 - y0],
    color,
  };
}

function generateVolume(parcel, building, polygon, footprint) {
  const meshes = [];
  const bb = polygon.metrics.bbox_m;
  meshes.push(boxMesh("parcel_bbox_cf", 0, 0, -0.06, bb.width, bb.depth, 0.02, "#8fa67a"));

  // Courtyard toward Closca (south strip)
  const fp = footprint.footprint.outer;
  const fpYs = fp.map((p) => p.y);
  const fpMinY = Math.min(...fpYs);
  meshes.push(boxMesh("curte_closca", 0, 0, 0.02, bb.width, Math.max(0.3, fpMinY), 0.05, "#6f9a5e"));

  // Extrude new building from footprint bbox aligned to axes (approx); better: use OBB from frame
  const xs = fp.map((p) => p.x);
  const ys = fp.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);

  for (const level of footprint.levels) {
    const z0 = level.z0_m;
    const z1 = z0 + level.height_m;
    meshes.push(
      boxMesh(
        `new_${level.id}`,
        x0, y0, z0,
        x1, y1, z1,
        level.id === "parter" ? "#cfd8e6" : "#b0bec9"
      )
    );
  }
  const topZ = footprint.levels[1].z0_m + footprint.levels[1].height_m;
  meshes.push(boxMesh("new_roof", x0, y0, topZ, x1, y1, topZ + 0.25, "#6b6358"));

  // Access band highlight (south part of footprint)
  const acc = footprint.footprint.access_band;
  const axs = acc.map((p) => p.x);
  const ays = acc.map((p) => p.y);
  meshes.push(
    boxMesh(
      "access_band",
      Math.min(...axs), Math.min(...ays), 0.05,
      Math.max(...axs), Math.max(...ays), 0.2,
      "#7a93b0"
    )
  );

  return {
    meta: {
      id: "footprint_v01_volume",
      generated: new Date().toISOString(),
      status: "CONCEPT_NOU_PE_CF",
      warning: "Volum axis-aligned aproximativ pe bbox amprentă. Dragalina dreapta, Cloșca jos.",
      placement: footprint.placement,
      units: "meters",
      coords: "center=[x, z_up, y_north]; size=[sx, sz, sy]",
    },
    site: {
      polygon_metrics: polygon.metrics,
      confirmed_areas: {
        measured_m2: parcel.confirmed.area_measured_m2,
        from_acts_m2: parcel.confirmed.area_from_acts_m2,
        existing_built_m2: parcel.confirmed.existing_built_ground_m2,
      },
      cf_vertices: polygon.vertices_m,
      footprint_vertices: footprint.footprint.outer,
    },
    building_summary: {
      footprint_gross_m2: footprint.areas.footprint_gross_m2,
      footprint_fit_on_site_m2: footprint.areas.footprint_gross_m2,
      access_band_m2: footprint.areas.access_band_m2,
      note: footprint.checks.sketch_9_30_on_dragalina,
    },
    meshes,
  };
}

function generateProposalPlan(proposals, variantKey, levelId) {
  const env = proposals.envelope;
  const W = env.depth_ew_m;
  const L = env.length_ns_m;
  const variant = proposals.variants[variantKey];
  const zones = proposals.access_zones;
  const svgW = MARGIN * 2 + W * SCALE + 160;
  const svgH = MARGIN * 2 + L * SCALE + 160;
  const P = (x, y) => toSvg(x, y, L);

  let body = "";
  body += label(svgW / 2, 22, [
    `DRAGALINA 131 — ${variant.title}`,
    `PLAN ${levelId.toUpperCase()} · propunere ${variantKey} · N↑ Dragalina→ Cloșca↓`,
  ], { size: 12 });

  // Outer
  const o0 = P(0, 0);
  body += rect(o0.x, P(0, L).y, W * SCALE, L * SCALE, `fill="#f7f4ef" stroke="#222" stroke-width="2.5"`);

  // Access band strip
  body += rect(
    P(0, 0).x,
    P(0, env.access_ns_m).y,
    W * SCALE,
    env.access_ns_m * SCALE,
    `fill="#e8eef5" stroke="#445" stroke-width="1"`
  );

  for (const z of Object.values(zones)) {
    const fill =
      z.label.startsWith("TERAS") ? "#d7e8d3" :
      z.label.startsWith("SCAR") ? "#d9dce3" : "#eef2f7";
    body += rect(
      P(z.x0, z.y0).x,
      P(z.x0, z.y1).y,
      (z.x1 - z.x0) * SCALE,
      (z.y1 - z.y0) * SCALE,
      `fill="${fill}" stroke="#333" stroke-width="1"`
    );
    const cx = P((z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2).x;
    const cy = P((z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2).y;
    const area = z.area_net_m2 ?? z.area_m2;
    body += label(cx, cy, [z.label, `${area.toFixed(1)} m²`], { size: 10 });
  }

  for (const r of variant.rooms) {
    body += rect(
      P(r.x0, r.y0).x,
      P(r.x0, r.y1).y,
      (r.x1 - r.x0) * SCALE,
      (r.y1 - r.y0) * SCALE,
      `fill="#fffdf8" stroke="#222" stroke-width="1.4"`
    );
    const cx = P((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2).x;
    const cy = P((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2).y;
    body += label(cx, cy - 4, [r.label, `${r.area_m2.toFixed(1)} m²`], { size: 11 });
  }

  // Door marks (simple ticks)
  for (const d of variant.doors) {
    if (d.to === "terasa") {
      const t = zones.terasa;
      const x = (t.x0 + t.x1) / 2;
      const y = env.access_ns_m;
      const p = P(x, y);
      body += `<line x1="${p.x - 14}" y1="${p.y}" x2="${p.x + 14}" y2="${p.y}" stroke="#1b5e20" stroke-width="3"/>`;
      body += label(p.x, p.y - 10, [`ușă terasă ← ${d.from}`], { size: 9, fill: "#1b5e20" });
    }
  }

  // Street labels
  body += label(P(W + 0.35, L / 2).x, P(W + 0.35, L / 2).y, ["DRAGALINA", "pe limită"], {
    size: 11,
    fill: "#8b1e1e",
    anchor: "start",
  });
  body += label(P(W / 2, -0.55).x, P(W / 2, -0.55).y, ["→ CURTE / CLOȘCA"], {
    size: 11,
    fill: "#2d5a27",
  });
  body += label(P(W / 2, L + 0.45).x, P(W / 2, L + 0.45).y, ["NORD — limita vecin (calcan)"], {
    size: 10,
    fill: "#333",
  });
  body += label(P(-0.2, L / 2).x, P(-0.2, L / 2).y, ["VEST", "pe limită"], {
    size: 10,
    fill: "#333",
    anchor: "end",
  });

  // Dims
  body += dimLine(P(0, 0).x, P(0, 0).y, P(W, 0).x, P(W, 0).y, `${W.toFixed(2)} m (E–V)`, 26);
  body += dimLine(P(0, 0).x, P(0, 0).y, P(0, L).x, P(0, L).y, `${L.toFixed(2)} m (N–S)`, -32);
  body += dimLine(P(0, L).x, P(0, L).y, P(0, env.access_ns_m).x, P(0, env.access_ns_m).y, "6.90 corp", 22);
  body += dimLine(P(0, env.access_ns_m).x, P(0, env.access_ns_m).y, P(0, 0).x, P(0, 0).y, "2.40", 22);

  // North
  body += `
  <g transform="translate(${svgW - 48},70)">
    <polygon points="0,-22 6,8 -6,8" fill="#111"/>
    <text y="22" text-anchor="middle" font-size="11" font-family="IBM Plex Sans, Segoe UI, sans-serif">N</text>
  </g>`;

  body += label(MARGIN, svgH - 42, [
    `Terasă din: ${variant.terrace_from} · apt. independent · scară fără traversarea terasei`,
    variant.summary,
  ], { size: 9, anchor: "start", fill: "#333" });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#fafafa"/>
  <rect x="8" y="8" width="${svgW - 16}" height="40" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1"/>
  ${body}
</svg>`;
}

function generateCompareSvg(proposals) {
  const A = proposals.variants.A;
  const B = proposals.variants.B;
  const W = 720;
  const H = 520;
  let body = "";
  body += label(W / 2, 28, ["COMPARAȚIE PROPUNERI — aceeași amprentă pe 3 limite"], { size: 14 });

  const card = (x, y, v, key, accent) => {
    let s = "";
    s += rect(x, y, 320, 400, `fill="#fff" stroke="${accent}" stroke-width="2"`);
    s += label(x + 160, y + 28, [`${key}`, v.title.replace(/^[AB] — /, "")], { size: 13 });
    s += label(x + 20, y + 70, [
      `Terasă din: ${v.terrace_from}`,
      ...v.rooms.map((r) => `${r.label}: ${r.area_m2.toFixed(1)} m²`),
      "",
      "Plus:",
      ...v.pros.map((p) => `· ${p}`),
      "",
      "Minus:",
      ...v.cons.map((c) => `· ${c}`),
    ], { size: 10, anchor: "start" });
    return s;
  };

  body += card(40, 60, A, "A", "#1565c0");
  body += card(380, 60, B, "B", "#2e7d32");
  body += label(W / 2, H - 24, [
    "Ambele: scară pe Dragalina în bandă sud · palier → ușă living · terasă ≠ curte Cloșca",
  ], { size: 10 });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  ${body}
</svg>`;
}

function generateReport(parcel, building, polygon, footprint, proposals, files) {
  const A = proposals.variants.A;
  const B = proposals.variants.B;
  return `# Etapa 3 — Propuneri compartimentare

**Data:** ${new Date().toISOString()}
**Statut:** propuneri comparative pe amprentă confirmată (3 limite)

## Amplasare (fixirmată)
- **3 limite:** Nord (vecin) + Dragalina (dreapta) + Vest
- Cloșca jos — **curte** sud (nu terasă comună)
- Amprentă **${footprint.sketch.along_dragalina_m} × ${footprint.sketch.depth_into_lot_m} m** ≈ **${footprint.areas.footprint_gross_m2} m²**
- Bandă scară/terasă **2,40 m** pe sudul volumului

## Propunerea A — ${A.title}
- Terasă din **${A.terrace_from}**
- Camere: ${A.rooms.map((r) => `${r.label} ${r.area_m2} m²`).join(" · ")}
- Plus: ${A.pros.join("; ")}
- Minus: ${A.cons.join("; ")}

## Propunerea B — ${B.title}
- Terasă din **${B.terrace_from}**
- Camere: ${B.rooms.map((r) => `${r.label} ${r.area_m2} m²`).join(" · ")}
- Plus: ${B.pros.join("; ")}
- Minus: ${B.cons.join("; ")}

## Ce e comun
- Două apt. independente P / E
- Scară fără traversarea terasei celuilalt
- Terasă privată per nivel în semi-nișă
- Orientare: N↑ · Dragalina→ · Cloșca↓

## Fișiere
${files.map((f) => `- \`${f}\``).join("\n")}

## Următorul pas
Alege A sau B (sau hibrid) → detaliere mobilier + goluri fațadă + volum 3D pe varianta aleasă.
`;
}

function main() {
  const parcel = readJson("data/site/parcel.json");
  const polygon = readJson("data/site/parcel_polygon_cf.json");
  const building = readJson("data/building/concept_v01.json");
  const footprint = readJson("data/building/footprint_v01.json");
  const proposals = readJson("data/building/proposals_v01.json");

  ensureDir("outputs/plans");
  ensureDir("outputs/reports");
  ensureDir("viewer/data");

  const files = [];

  const siteSvg = generateSitePlan(parcel, building, polygon, footprint);
  files.push(path.relative(ROOT, write("outputs/plans/01_situatie_provisional.svg", siteSvg)));

  // Legacy sketch-oriented plans (kept for istoric)
  const parterSvg = generateFloorPlan(building, "parter");
  files.push(path.relative(ROOT, write("outputs/plans/02_parter_concept_v01.svg", parterSvg)));
  const etajSvg = generateFloorPlan(building, "etaj");
  files.push(path.relative(ROOT, write("outputs/plans/03_etaj_concept_v01.svg", etajSvg)));

  // New oriented proposals
  for (const key of ["A", "B"]) {
    for (const level of ["parter", "etaj"]) {
      const svg = generateProposalPlan(proposals, key, level);
      const rel = `outputs/plans/05_propunere_${key}_${level}.svg`;
      files.push(path.relative(ROOT, write(rel, svg)));
    }
  }
  files.push(
    path.relative(ROOT, write("outputs/plans/05_propuneri_comparatie.svg", generateCompareSvg(proposals)))
  );

  const volume = generateVolume(parcel, building, polygon, footprint);
  files.push(
    path.relative(ROOT, write("outputs/plans/04_volume_concept_v01.json", JSON.stringify(volume, null, 2)))
  );
  write("viewer/data/volume.json", JSON.stringify(volume, null, 2));
  write("viewer/data/building.json", JSON.stringify(building, null, 2));
  write("viewer/data/footprint.json", JSON.stringify(footprint, null, 2));
  write("viewer/data/proposals.json", JSON.stringify(proposals, null, 2));
  write("viewer/data/parcel.json", JSON.stringify(parcel, null, 2));
  write("viewer/data/parcel_polygon_cf.json", JSON.stringify(polygon, null, 2));

  const report = generateReport(parcel, building, polygon, footprint, proposals, files);
  files.push(path.relative(ROOT, write("outputs/reports/03_propuneri_compartimentare.md", report)));

  // refresh etapa 2 note
  write(
    "outputs/reports/02_volumetrie_footprint_v01.md",
    `# Amprentă confirmată — 3 limite\n\nNord + Dragalina + Vest · ${footprint.areas.footprint_gross_m2} m² · vezi etapa 3 propuneri.\n`
  );

  const manifest = {
    ok: true,
    stage: "etapa_3_propuneri",
    generated_at: new Date().toISOString(),
    files,
    footprint: footprint.areas,
    placement: footprint.placement,
    proposals: {
      A: { terrace_from: proposals.variants.A.terrace_from, rooms: proposals.variants.A.rooms.map((r) => ({ id: r.id, m2: r.area_m2 })) },
      B: { terrace_from: proposals.variants.B.terrace_from, rooms: proposals.variants.B.rooms.map((r) => ({ id: r.id, m2: r.area_m2 })) },
    },
  };
  write("outputs/reports/01_manifest.json", JSON.stringify(manifest, null, 2));

  // decisions log append hint written separately if needed
  console.log("GENERATE_OK");
  console.log(JSON.stringify(manifest, null, 2));
}

main();

