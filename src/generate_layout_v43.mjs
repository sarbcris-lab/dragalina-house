/**
 * Layout V43 parametric → plan SVG + JSON geometrie + amplasare pe sit.
 * Editează data/building/layout_v43.json → npm run layout
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof content === "string" ? content : JSON.stringify(content, null, 2));
  return p;
}

const cm = (v) => v / 100;
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildGeometry(tune) {
  const W = cm(tune.envelope_ew_cm);
  const L = cm(tune.envelope_ns_cm);
  const we = cm(tune.wall_ext_cm);
  const wi = cm(tune.wall_int_cm);
  const stair = cm(tune.stair_band_cm);
  const terrD = cm(tune.terrace_depth_cm);

  const dormW = cm(tune.dorm_w_cm);
  const dormD = cm(tune.dorm_d_cm);
  const bathW = cm(tune.bath_w_cm);
  const bathD = cm(tune.bath_d_cm);
  const kitW = cm(tune.kitchen_w_cm);
  const kitD = cm(tune.kitchen_d_cm);

  // Origine NV: X est, Y sud — ca în audit
  // Corp închis (fără terasă): L - terrD pe vest; pe est scara ocupă bandă
  const bodyClearX0 = we;
  const bodyClearY0 = we;

  // Baie: NV interior
  const bath = {
    id: "baie",
    label: "BAIE",
    x0: bodyClearX0,
    y0: bodyClearY0,
    x1: bodyClearX0 + bathW,
    y1: bodyClearY0 + bathD,
  };

  // Hol lângă baie (est)
  const hallX0 = bath.x1 + wi;
  const hall = {
    id: "hol",
    label: "HOL",
    x0: hallX0,
    y0: bodyClearY0,
    x1: hallX0 + cm(tune.hall_clear_cm),
    y1: bodyClearY0 + bathD,
    note: `${tune.hall_clear_cm} cm liber`,
  };

  // Dormitor sub baie (sud de baie)
  const dorm = {
    id: "dormitor",
    label: "DORMITOR",
    x0: bodyClearX0,
    y0: bath.y1 + wi,
    x1: bodyClearX0 + dormW,
    y1: bath.y1 + wi + dormD,
  };

  // Terasă sud de dormitor
  const terrace = {
    id: "terasa",
    label: "TERASĂ",
    x0: 0,
    y0: L - terrD,
    x1: dorm.x1 + wi, // ~345 cm gabarit în audit
    y1: L,
    clear: {
      x0: wi * 0.5,
      y0: L - terrD + wi * 0.5,
      x1: dorm.x1 + wi - wi * 0.5,
      y1: L - wi * 0.5,
    },
  };
  // Force terrace width from dorm+wall like audit 345
  terrace.x1 = dorm.x1 + wi;

  // Living: est de hol — lățime principală din tune (270), până la peretele scării
  // În V43 livingul e open cu circulație; dreptunghiul principal = living_main_* 
  const livingX0 = hall.x1 + wi;
  const livingClearW = cm(tune.living_main_w_cm);
  const living = {
    id: "living",
    label: "LIVING",
    x0: livingX0,
    y0: bodyClearY0,
    x1: livingX0 + livingClearW,
    y1: bodyClearY0 + cm(tune.living_main_d_cm),
    note: `principal ${tune.living_main_w_cm}×${tune.living_main_d_cm} (+ extensii / circulație)`,
  };

  // Bucătărie: lanț sud = dorm + wi + kit + wi + stair
  const kitX0 = dorm.x1 + wi;
  const kitchen = {
    id: "bucatarie",
    label: "BUCĂTĂRIE",
    x0: kitX0,
    y0: L - terrD - we - kitD,
    x1: kitX0 + kitW,
    y1: L - terrD - we,
  };

  // Bandă scară est (130 cm) — pe toată adâncimea sudică + palier
  const stairZone = {
    id: "scara",
    label: "SCARĂ + PALIER",
    x0: W - stair,
    y0: living.y1 - cm(15),
    x1: W,
    y1: L,
    palier: {
      w: cm(110),
      d: cm(115),
      note: "110×115 liber (audit)",
    },
  };

  const rooms = [bath, hall, dorm, living, kitchen, terrace, stairZone];

  function roomArea(r) {
    return +((r.x1 - r.x0) * (r.y1 - r.y0)).toFixed(3);
  }

  // Lanțuri de control
  const chainS =
    tune.wall_ext_cm +
    tune.dorm_w_cm +
    tune.wall_int_cm +
    tune.kitchen_w_cm +
    tune.wall_int_cm +
    tune.stair_band_cm;
  const chainW =
    tune.wall_ext_cm +
    tune.bath_d_cm +
    tune.wall_int_cm +
    tune.dorm_d_cm +
    tune.wall_ext_cm +
    tune.terrace_depth_cm;

  return {
    envelope_m: { ew: W, ns: L, area_m2: +(W * L).toFixed(2) },
    walls_m: { ext: we, int: wi },
    level_height_m: cm(tune.level_height_cm),
    rooms: rooms.map((r) => ({
      ...r,
      x0: +r.x0.toFixed(3),
      y0: +r.y0.toFixed(3),
      x1: +r.x1.toFixed(3),
      y1: +r.y1.toFixed(3),
      area_m2: roomArea(r),
    })),
    checks: {
      chain_south_cm: chainS,
      chain_south_ok: chainS === tune.envelope_ew_cm,
      chain_west_cm: chainW,
      chain_west_ok: chainW === tune.envelope_ns_cm,
      useful_hint_m2: "Audit V43: 38.56 m² util model — recalculat la regenerare aproximativ din camere",
    },
    openings: {
      entry_cm: tune.entry_clear_cm,
      doors_cm: tune.door_clear_cm,
      terrace_dorm_cm: tune.terrace_door_dorm_cm,
      terrace_kitchen_cm: tune.terrace_door_kitchen_cm,
      east_window_cm: tune.east_window_cm,
    },
  };
}

function renderPlanSvg(layout, geom) {
  const SCALE = 55; // px/m
  const M = 80;
  const W = geom.envelope_m.ew;
  const L = geom.envelope_m.ns;
  // SVG: X right = est, Y down = sud (same as V43 drawing)
  const P = (x, y) => ({ x: M + x * SCALE, y: M + y * SCALE });
  const svgW = M * 2 + W * SCALE + 320;
  const svgH = M * 2 + L * SCALE + 100;

  const fills = {
    baie: "#d4e6e9",
    hol: "#e8e8e4",
    dormitor: "#e9e0d5",
    living: "#e8efe4",
    bucatarie: "#efe4d8",
    terasa: "#dfe8d8",
    scara: "#dde6e9",
  };

  let body = "";
  body += `<text x="${svgW / 2}" y="28" text-anchor="middle" font-size="15" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(layout.meta.id.toUpperCase())} · plan parametric</text>`;
  body += `<text x="${svgW / 2}" y="48" text-anchor="middle" font-size="11" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">N↑ · Dragalina→est · Cloșca↓ · ${layout.tune.envelope_ew_cm}×${layout.tune.envelope_ns_cm} cm · ext ${layout.tune.wall_ext_cm} / int ${layout.tune.wall_int_cm}</text>`;

  // envelope
  const o = P(0, 0);
  body += `<rect x="${o.x}" y="${o.y}" width="${W * SCALE}" height="${L * SCALE}" fill="#f7f4ef" stroke="#222" stroke-width="2.5"/>`;

  for (const r of geom.rooms) {
    const p0 = P(r.x0, r.y0);
    const w = (r.x1 - r.x0) * SCALE;
    const h = (r.y1 - r.y0) * SCALE;
    body += `<rect x="${p0.x}" y="${p0.y}" width="${w}" height="${h}" fill="${fills[r.id] || "#fff"}" stroke="#333" stroke-width="1.2"/>`;
    body += `<text x="${p0.x + w / 2}" y="${p0.y + h / 2 - 6}" text-anchor="middle" font-size="12" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(r.label)}</text>`;
    body += `<text x="${p0.x + w / 2}" y="${p0.y + h / 2 + 10}" text-anchor="middle" font-size="11" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">${r.area_m2.toFixed(2)} m²</text>`;
  }

  // dims
  body += `<text x="${P(W / 2, -0.35).x}" y="${P(W / 2, -0.35).y}" text-anchor="middle" font-size="12" fill="#986944" font-family="IBM Plex Sans,Segoe UI,sans-serif">${layout.tune.envelope_ew_cm} cm</text>`;
  body += `<text x="${P(-0.45, L / 2).x}" y="${P(-0.45, L / 2).y}" text-anchor="middle" font-size="12" fill="#986944" font-family="IBM Plex Sans,Segoe UI,sans-serif" transform="rotate(-90 ${P(-0.45, L / 2).x} ${P(-0.45, L / 2).y})">${layout.tune.envelope_ns_cm} cm</text>`;

  body += `<text x="${P(W + 0.25, L * 0.2).x}" y="${P(W + 0.25, L * 0.2).y}" font-size="12" fill="#8b1e1e" font-family="IBM Plex Sans,Segoe UI,sans-serif">EST / DRAGALINA</text>`;
  body += `<text x="${P(W / 2, L + 0.4).x}" y="${P(W / 2, L + 0.4).y}" text-anchor="middle" font-size="12" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">→ CLOȘCA (sud)</text>`;
  body += `<text x="${P(0.1, -0.15).x}" y="${P(0.1, -0.15).y}" font-size="11" font-family="IBM Plex Sans,Segoe UI,sans-serif">↑ NORD</text>`;

  // side panel checks
  const lx = svgW - 290;
  const t = layout.tune;
  body += `
  <rect x="${lx}" y="70" width="270" height="320" fill="#fff" stroke="#333"/>
  <text x="${lx + 12}" y="92" font-size="12" font-family="IBM Plex Sans,Segoe UI,sans-serif">TUNE (editează JSON)</text>
  <text x="${lx + 12}" y="118" font-size="11" font-family="IBM Plex Sans,Segoe UI,sans-serif">Gabarit: ${t.envelope_ew_cm}×${t.envelope_ns_cm} → ${geom.envelope_m.area_m2} m²</text>
  <text x="${lx + 12}" y="140" font-size="11" font-family="IBM Plex Sans,Segoe UI,sans-serif">Pereți: ext ${t.wall_ext_cm} / int ${t.wall_int_cm}</text>
  <text x="${lx + 12}" y="162" font-size="11" font-family="IBM Plex Sans,Segoe UI,sans-serif">Nivel: ${t.level_height_cm} cm</text>
  <text x="${lx + 12}" y="184" font-size="11" font-family="IBM Plex Sans,Segoe UI,sans-serif">Bandă scară: ${t.stair_band_cm} cm</text>
  <text x="${lx + 12}" y="210" font-size="11" font-family="IBM Plex Sans,Segoe UI,sans-serif">Lanț sud: ${geom.checks.chain_south_cm} ${geom.checks.chain_south_ok ? "✓" : "⚠ ≠ " + t.envelope_ew_cm}</text>
  <text x="${lx + 12}" y="232" font-size="11" font-family="IBM Plex Sans,Segoe UI,sans-serif">Lanț vest: ${geom.checks.chain_west_cm} ${geom.checks.chain_west_ok ? "✓" : "⚠ ≠ " + t.envelope_ns_cm}</text>
  <text x="${lx + 12}" y="262" font-size="10" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">Sursă: Audit_V43_dimensiuni_si_cazare.html</text>
  <text x="${lx + 12}" y="284" font-size="10" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">npm run layout → refresh</text>
  <text x="${lx + 12}" y="310" font-size="10" fill="#666" font-family="IBM Plex Sans,Segoe UI,sans-serif">IPOTEZĂ — nu autorizabil</text>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  <rect x="8" y="8" width="${svgW - 16}" height="52" fill="#e5ece1" stroke="#6a7f62"/>
  ${body}
</svg>`;
}

function placeOnParcel(geom, polygon) {
  // Map V43 local (x east, y south from NW) onto site (x east, y north from Closca)
  const byId = Object.fromEntries(
    polygon.vertices_m.filter((v, i, a) => i < a.length - 1).map((v) => [v.id, v])
  );
  const NW = byId[7];
  const NE = byId[5];
  // local y south → site y decreases from north
  const northY = (NW.y + NE.y) / 2;
  const outer = [
    { id: "NW", x: NW.x, y: NW.y },
    { id: "NE", x: NW.x + geom.envelope_m.ew, y: northY },
    {
      id: "SE",
      x: NW.x + geom.envelope_m.ew,
      y: northY - geom.envelope_m.ns,
    },
    { id: "SW", x: NW.x, y: NW.y - geom.envelope_m.ns },
    { id: "NW", x: NW.x, y: NW.y },
  ].map((p) => ({ id: p.id, x: +p.x.toFixed(3), y: +p.y.toFixed(3) }));

  return {
    note: "Amplasare schematică: origine V43 ≈ pct 7 (NV), X→Dragalina, Y→Cloșca",
    outer,
  };
}

function main() {
  const layout = read("data/building/layout_v43.json");
  const polygon = read("data/site/parcel_polygon_cf.json");
  const geom = buildGeometry(layout.tune);
  const site = placeOnParcel(geom, polygon);

  const out = {
    meta: layout.meta,
    tune: layout.tune,
    geometry: geom,
    site_placement: site,
    generated: new Date().toISOString(),
  };

  write("data/building/layout_v43_geometry.json", out);
  write("viewer/data/layout_v43.json", out);
  write("outputs/plans/07_layout_v43.svg", renderPlanSvg(layout, geom));

  // index page linking audit + plan + how to tune
  const html = `<!doctype html>
<html lang="ro">
<meta charset="utf-8"/>
<title>Dragalina · Layout V43 iterativ</title>
<style>
  body{font:15px/1.5 "IBM Plex Sans",Segoe UI,sans-serif;margin:0;background:#f7f5ef;color:#26383c}
  header{padding:1rem 1.25rem;background:#e5ece1;border-bottom:1px solid #c5d0bf}
  main{display:grid;grid-template-columns:1fr 1fr;gap:0;height:calc(100vh - 64px)}
  iframe,object{width:100%;height:100%;border:0;background:#fff}
  .panel{overflow:auto;border-right:1px solid #ccc;padding:0}
  .side{overflow:auto}
  code{background:#eee;padding:0.1em 0.35em;border-radius:3px}
  ol{margin:0.5rem 0 0 1.2rem}
  .hint{padding:0.75rem 1.25rem;font-size:0.9rem;background:#fff8e7;border-bottom:1px solid #e8d9a8}
</style>
<header>
  <strong>Layout V43 — iterare dimensiuni</strong>
  · sursă <a href="../inputs/Audit_V43_dimensiuni_si_cazare.html" target="_blank">Audit_V43</a>
  · plan regenerat <code>outputs/plans/07_layout_v43.svg</code>
</header>
<div class="hint">
  <b>Cum modificăm:</b> editezi <code>data/building/layout_v43.json</code> → secțiunea <code>tune</code>
  (ex. <code>envelope_ew_cm</code>, <code>dorm_d_cm</code>, <code>wall_ext_cm</code>) →
  <code>npm run layout</code> → refresh aici.
  Lanțurile sud/vest trebuie să închidă gabaritul (verificare pe plan).
</div>
<main>
  <div class="panel"><object data="./07_layout_v43.svg" type="image/svg+xml">plan</object></div>
  <div class="side"><iframe src="../inputs/Audit_V43_dimensiuni_si_cazare.html" title="Audit V43"></iframe></div>
</main>
</html>`;
  write("outputs/plans/07_layout_v43_studio.html", html);

  // Update footprint sketch dims from V43 envelope for volume alignment option
  const footprint = read("data/building/footprint_v01.json");
  footprint.meta.layout_v43_ref = "data/building/layout_v43.json";
  footprint.sketch.v43_envelope_ew_m = geom.envelope_m.ew;
  footprint.sketch.v43_envelope_ns_m = geom.envelope_m.ns;
  footprint.sketch.v43_note =
    "V43: 6.80 m E–V × 8.60 m N–S (include terasă pe vest). Diferit de schița 9.30×7.80.";
  write("data/building/footprint_v01.json", footprint);

  console.log(
    JSON.stringify(
      {
        ok: true,
        envelope_m2: geom.envelope_m.area_m2,
        chain_south: geom.checks.chain_south_cm,
        chain_south_ok: geom.checks.chain_south_ok,
        chain_west: geom.checks.chain_west_cm,
        chain_west_ok: geom.checks.chain_west_ok,
        files: [
          "outputs/plans/07_layout_v43.svg",
          "outputs/plans/07_layout_v43_studio.html",
          "data/building/layout_v43_geometry.json",
        ],
      },
      null,
      2
    )
  );
}

main();
