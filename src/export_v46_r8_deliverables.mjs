/**
 * V46r8 deliverables: sit, subsol, etaj real, mobilier, MEP, suprafețe, changelog, secțiuni beci.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const write = (rel, text) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
  return rel;
};

const S = 0.45;
const M = 70;

function svgWrap(w, h, title, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#f7f5f0"/>
  <text x="${w / 2}" y="28" text-anchor="middle" font-size="15" font-family="IBM Plex Sans,Segoe UI,sans-serif">${title}</text>
  ${body}
</svg>`;
}

function statusColor(st) {
  if (st === "stabilit") return "#2d6a4f";
  if (st === "ipoteza_studiu" || st === "ipoteză_studiu") return "#b08900";
  if (st === "de_verificat" || st === "de_verificat_produs") return "#9b2226";
  if (st === "conflict_masurat") return "#d00000";
  return "#333";
}

function main() {
  const v = read("data/building/v46_exact.json");
  const parcel = read("data/site/parcel.json");
  const poly = read("data/site/parcel_polygon_cf.json");
  const gate = read("data/site/gate_poarta_v05.json");
  const rev = v.meta?.rev || 8;

  // ── Site plan ──
  {
    const W = 900;
    const H = 1100;
    const scale = 28; // m → px roughly for parcel bbox
    const bb = parcel.metrics?.bbox_m || { width: 9, depth: 19 };
    const ox = 80;
    const oy = 60;
    // site Y north-up in SVG: flip parcel y
    const pts = poly.vertices_m.filter((p, i, a) => i < a.length - 1);
    const ys = pts.map((p) => p.y);
    const xs = pts.map((p) => p.x);
    const minX = Math.min(...xs);
    const maxY = Math.max(...ys);
    const px = (x) => ox + (x - minX) * scale;
    const py = (y) => oy + (maxY - y) * scale; // N up
    const parts = [];
    parts.push(
      `<text x="${W / 2}" y="48" text-anchor="middle" font-size="11" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">N↑ · Dragalina EST · Cloșca SUD · teren 147 m² măsurat / 172 acte / 145,7 poligon — POT/CUT neconfirmate</text>`
    );
    // parcel
    const d = pts.map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ") + " Z";
    parts.push(`<path d="${d}" fill="#e8efe0" stroke="#2d5a27" stroke-width="2"/>`);
    parts.push(
      `<text x="${ox + 10}" y="${oy + 20}" font-size="12" fill="#1b4332" font-family="IBM Plex Sans,Segoe UI,sans-serif">Parcelă CF 54602</text>`
    );
    // streets labels
    parts.push(
      `<text x="${W - 120}" y="${H / 2}" font-size="13" fill="#1d3557" transform="rotate(90 ${W - 120} ${H / 2})" font-family="IBM Plex Sans,Segoe UI,sans-serif">str. Gen. Dragalina</text>`
    );
    parts.push(
      `<text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-size="13" fill="#1d3557" font-family="IBM Plex Sans,Segoe UI,sans-serif">str. Cloșca</text>`
    );

    // building envelope in local cm — approximate place north of parcel using volume corners if present
    const env = v.envelope_cm;
    // local schematic inset (not georef exact — note)
    const bx = ox + 40;
    const by = oy + 40;
    const bS = 0.35;
    parts.push(
      `<rect x="${bx}" y="${by}" width="${env.ew * bS}" height="${env.ns * bS}" fill="#d8d2c6" stroke="#333" stroke-width="1.5"/>`
    );
    parts.push(
      `<text x="${bx + 8}" y="${by + 18}" font-size="10" font-family="IBM Plex Sans,Segoe UI,sans-serif">casă 6,80×8,60 — nord parcelă · ipoteză amplasare</text>`
    );

    // terrace
    const ter = v.terrace_by_level?.[0];
    if (ter) {
      parts.push(
        `<rect x="${bx + ter.x * bS}" y="${by + ter.y * bS}" width="${ter.dx * bS}" height="${ter.dy * bS}" fill="#c8d8b0" opacity="0.7" stroke="#4a7c40"/>`
      );
      parts.push(
        `<text x="${bx + ter.x * bS + 20}" y="${by + ter.y * bS + 20}" font-size="9" fill="#2d5a27" font-family="IBM Plex Sans,Segoe UI,sans-serif">terasă P unită</text>`
      );
    }

    // parking
    const stalls = v.site_access_cm?.auto?.parking?.stalls || [];
    for (const s of stalls) {
      parts.push(
        `<rect x="${bx + s.x * bS * 0.5}" y="${by + 320}" width="${s.dx * bS}" height="${s.dy * bS * 0.55}" fill="#3d4450" opacity="0.85" stroke="#111"/>`
      );
      parts.push(
        `<text x="${bx + s.x * bS * 0.5 + 20}" y="${by + 340}" font-size="9" fill="#fff" font-family="IBM Plex Sans,Segoe UI,sans-serif">${s.id} 2,5×5</text>`
      );
    }

    // gate closed / open schematic on Closca
    parts.push(
      `<rect x="${bx}" y="${by + 420}" width="${6.0 * 100 * bS}" height="10" fill="#c4a35a" stroke="#333"/>`
    );
    parts.push(
      `<text x="${bx}" y="${by + 450}" font-size="9" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">poartă auto ÎNCHISĂ — studiu clear 4/5/6 m (v05 clear~7,1 m)</text>`
    );
    parts.push(
      `<rect x="${bx - 14}" y="${by + 200}" width="10" height="${7.5 * 100 * bS * 0.35}" fill="#e8d5a3" opacity="0.7" stroke="#333"/>`
    );
    parts.push(
      `<text x="${bx - 8}" y="${by + 190}" font-size="9" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">poartă DESCHISĂ pe vest (articulată/telescopic — nu pivot rigid 90°)</text>`
    );

    // pedestrian gate Dragalina
    const ped = v.site_access_cm?.pedestrian?.gate;
    if (ped) {
      parts.push(
        `<rect x="${bx + env.ew * bS}" y="${by + 80}" width="12" height="40" fill="#6aaf7a" stroke="#234"/>`
      );
      parts.push(
        `<text x="${bx + env.ew * bS + 18}" y="${by + 100}" font-size="9" fill="#234" font-family="IBM Plex Sans,Segoe UI,sans-serif">poartă pietonală Dragalina</text>`
      );
    }

    // english court
    const ec = v.basement_cm?.english_court;
    if (ec) {
      parts.push(
        `<rect x="${bx + ec.x * bS}" y="${by + ec.y * bS}" width="${ec.dx * bS}" height="${ec.dy * bS}" fill="#8aa4b8" opacity="0.55" stroke="#1d3557" stroke-dasharray="4 2"/>`
      );
      parts.push(
        `<text x="${bx + ec.x * bS}" y="${by + ec.y * bS - 4}" font-size="8" fill="#1d3557" font-family="IBM Plex Sans,Segoe UI,sans-serif">curte engleză −95 (studiu)</text>`
      );
    }

    // legend status
    parts.push(
      `<text x="40" y="${H - 90}" font-size="10" fill="#2d6a4f" font-family="IBM Plex Sans,Segoe UI,sans-serif">■ stabilit</text>`
    );
    parts.push(
      `<text x="140" y="${H - 90}" font-size="10" fill="#b08900" font-family="IBM Plex Sans,Segoe UI,sans-serif">■ ipoteză studiu</text>`
    );
    parts.push(
      `<text x="280" y="${H - 90}" font-size="10" fill="#9b2226" font-family="IBM Plex Sans,Segoe UI,sans-serif">■ de verificat</text>`
    );
    parts.push(
      `<text x="40" y="${H - 70}" font-size="9" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">Gate v05: ${gate.type}; clear ${gate.clear_opening_m} m; retract ${gate.retract_along_west_m} m — mecanism rigid 90° = respins</text>`
    );

    write(
      "outputs/plans/16_v46_site_plan.svg",
      svgWrap(W, H, `V46 rev.${rev} · plan situație / accese (studiu coordonat)`, parts.join("\n"))
    );
  }

  // ── Basement plan ──
  {
    const bm = v.basement_cm;
    const W = 900;
    const H = 700;
    const px = (x) => M + x * S;
    const py = (y) => M + y * S;
    const parts = [];
    parts.push(
      `<text x="${W / 2}" y="48" text-anchor="middle" font-size="11" fill="#b08900" font-family="IBM Plex Sans,Segoe UI,sans-serif">STATUS: ipoteză de studiu — cote din brief; verificare obligatorie structurist / S09</text>`
    );
    for (const r of bm.rooms || []) {
      parts.push(
        `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="#dce4ec" stroke="#1d3557"/>`
      );
      parts.push(
        `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy / 2)}" text-anchor="middle" font-size="10" font-family="IBM Plex Sans,Segoe UI,sans-serif">${r.id}</text>`
      );
    }
    const land = bm.lower_landing;
    if (land) {
      parts.push(
        `<rect x="${px(land.x)}" y="${py(land.y)}" width="${land.dx * S}" height="${land.dy * S}" fill="#c4b496" stroke="#333"/>`
      );
      parts.push(
        `<text x="${px(land.x + land.dx / 2)}" y="${py(land.y + 20)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">palier 95×90 @ −250</text>`
      );
    }
    const st = bm.stair_to_basement;
    if (st) {
      for (let i = 0; i < st.treads; i++) {
        parts.push(
          `<rect x="${px(st.x)}" y="${py(st.y + i * st.tread_cm)}" width="${st.width_clear_cm * S}" height="${st.tread_cm * S}" fill="${i % 2 ? "#8a93a0" : "#9aa3ad"}" stroke="#333"/>`
        );
      }
    }
    const ec = bm.english_court;
    if (ec) {
      parts.push(
        `<rect x="${px(ec.x)}" y="${py(ec.y)}" width="${ec.dx * S}" height="${ec.dy * S}" fill="#8aa4b8" opacity="0.5" stroke="#1d3557" stroke-dasharray="3 2"/>`
      );
    }
    for (const eq of bm.equipment_placeholder || []) {
      const room = (bm.rooms || []).find((r) => r.id === eq.room);
      if (!room) continue;
      parts.push(
        `<rect x="${px(room.x + 10)}" y="${py(room.y + 10)}" width="${eq.w_cm * S}" height="${eq.d_cm * S}" fill="#adb5bd" stroke="#212529"/>`
      );
      parts.push(
        `<text x="${px(room.x + 12)}" y="${py(room.y + 22)}" font-size="7" font-family="IBM Plex Sans,Segoe UI,sans-serif">${eq.id}</text>`
      );
    }
    parts.push(
      `<text x="40" y="${H - 40}" font-size="9" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">curte −48 · engleză −95 · subsol −250 (provizoriu) · țintă liber ≥210 · echipamente = placeholder până la lista beneficiarului</text>`
    );
    write(
      "outputs/plans/17_v46_subsol_plan.svg",
      svgWrap(W, H, `V46 rev.${rev} · plan subsol tehnic (studiu)`, parts.join("\n"))
    );
  }

  // ── Basement sections ──
  {
    const bm = v.basement_cm;
    const W = 1000;
    const H = 520;
    const parts = [];
    // Section A longitudinal
    const z0 = 200; // ground line in svg
    const scZ = 0.9;
    const scX = 0.55;
    const x0 = 60;
    parts.push(`<text x="40" y="70" font-size="12" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">A — longitudinal: curte → engleză → scară beci → palier −250 → fundație</text>`);
    parts.push(`<line x1="${x0}" y1="${z0}" x2="920" y2="${z0}" stroke="#888" stroke-dasharray="4 2"/>`);
    parts.push(`<text x="920" y="${z0 - 4}" font-size="8" fill="#666">FF curte ≈ −48</text>`);
    // english
    const zEng = z0 - (bm.levels_vs_ff_parter_cm.english_court_corridor - bm.levels_vs_ff_parter_cm.courtyard_general) * scZ;
    parts.push(`<rect x="${x0 + 120}" y="${zEng}" width="${160 * scX}" height="${(z0 - zEng) + 2}" fill="#8aa4b8" opacity="0.5"/>`);
    parts.push(`<text x="${x0 + 120}" y="${zEng - 6}" font-size="8">engleză −95</text>`);
    // 3 steps
    for (let i = 0; i < 3; i++) {
      const zh = z0 - ((i + 1) * 16) * scZ;
      parts.push(`<rect x="${x0 + 80 + i * 12}" y="${zh}" width="12" height="${z0 - zh}" fill="#b09050"/>`);
    }
    // basement stair
    const zB = z0 - (bm.levels_vs_ff_parter_cm.basement_ff - bm.levels_vs_ff_parter_cm.courtyard_general) * scZ;
    for (let i = 0; i < 8; i++) {
      const zh = zEng - ((i + 1) * (155 / 9)) * scZ;
      parts.push(`<rect x="${x0 + 300 + i * 16}" y="${zh}" width="16" height="4" fill="#8a93a0"/>`);
    }
    parts.push(`<line x1="${x0 + 300}" y1="${zB}" x2="${x0 + 500}" y2="${zB}" stroke="#333" stroke-width="2"/>`);
    parts.push(`<text x="${x0 + 300}" y="${zB - 6}" font-size="8">FF subsol −250 (provizoriu)</text>`);
    parts.push(`<rect x="${x0 + 520}" y="${zB - 210 * scZ}" width="40" height="${210 * scZ}" fill="none" stroke="#d00000"/>`);
    parts.push(`<text x="${x0 + 565}" y="${zB - 100}" font-size="8" fill="#d00000">țintă liber 210</text>`);
    // foundation conflict box
    parts.push(`<rect x="${x0 + 480}" y="${zB - 40}" width="30" height="80" fill="#555" opacity="0.4"/>`);
    parts.push(`<text x="${x0 + 480}" y="${zB + 55}" font-size="8" fill="#9b2226">fundație parter — palier în afara proiecției (ipoteză)</text>`);

    parts.push(`<text x="40" y="380" font-size="12" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">B — transversal scară / hidro / limita est</text>`);
    parts.push(`<rect x="80" y="400" width="20" height="80" fill="#d8d2c6"/>`);
    parts.push(`<rect x="100" y="410" width="90" height="60" fill="#9aa3ad"/>`);
    parts.push(`<rect x="190" y="400" width="20" height="80" fill="#d8d2c6"/>`);
    parts.push(`<text x="100" y="495" font-size="8">lățime liberă scară ~90 · pereți+hidro = de verificat</text>`);

    parts.push(`<text x="400" y="380" font-size="12" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">C — vestibul + camere tehnice</text>`);
    parts.push(`<rect x="400" y="400" width="80" height="60" fill="#dce4ec" stroke="#333"/>`);
    parts.push(`<text x="410" y="430" font-size="8">vestibul</text>`);
    parts.push(`<rect x="490" y="400" width="70" height="60" fill="#ced4da" stroke="#333"/>`);
    parts.push(`<text x="495" y="430" font-size="8">electric</text>`);
    parts.push(`<rect x="400" y="470" width="80" height="40" fill="#adb5bd" stroke="#333"/>`);
    parts.push(`<text x="405" y="492" font-size="8">apă/termic</text>`);
    parts.push(`<text x="400" y="525" font-size="8" fill="#b08900">uși separate din vestibul — nu în serie prin umed</text>`);

    write(
      "outputs/plans/18_v46_subsol_sections.svg",
      svgWrap(W, H, `V46 rev.${rev} · secțiuni subsol (studiu cotat)`, parts.join("\n"))
    );
  }

  // ── Etaj plan real (filter L1 terrace + openings) ──
  {
    const W = M * 2 + v.envelope_cm.ew * S + 200;
    const H = M * 2 + v.envelope_cm.ns * S + 120;
    const px = (x) => M + x * S;
    const py = (y) => M + y * S;
    const parts = [];
    parts.push(
      `<text x="${W / 2}" y="48" text-anchor="middle" font-size="11" fill="#2d6a4f" font-family="IBM Plex Sans,Segoe UI,sans-serif">etaj înghețat · terasă 330×185 · intrare pe buc_est</text>`
    );
    for (const r of v.rooms_cm) {
      if (r.id === "scara" || r.id === "primire") continue;
      if (r.id === "terasa") {
        const t = v.terrace_by_level?.[1] || r;
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
        `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy / 2)}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">${r.label || r.id}</text>`
      );
    }
    for (const w of v.walls_cm) {
      parts.push(
        `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="${w.kind === "ext" ? "#333" : "#777"}"/>`
      );
    }
    for (const p of v.parapets_cm || []) {
      if (p.levels && !p.levels.includes(1)) continue;
      if (p.gap || !(p.h > 0)) continue;
      parts.push(
        `<rect x="${px(p.x)}" y="${py(p.y)}" width="${p.dx * S}" height="${p.dy * S}" fill="#5a6570"/>`
      );
    }
    for (const o of v.openings_cm) {
      if (o.levels && !o.levels.includes(1)) continue;
      // openings without levels drawn on both — skip pure L0
      if (o.levels?.length === 1 && o.levels[0] === 0) continue;
      const isEntry = o.id?.includes("intrare");
      parts.push(
        `<rect x="${px(o.x)}" y="${py(o.y)}" width="${Math.max(o.dx, 6) * S}" height="${Math.max(o.dy, 6) * S}" fill="${isEntry ? "#6aaf7a" : "#9ec5e8"}" stroke="#1d4f91"/>`
      );
    }
    for (const f of v.furniture_cm) {
      if (f.levels && !f.levels.includes(1)) continue;
      if (f.zone === "primire") continue;
      parts.push(
        `<rect x="${px(f.x)}" y="${py(f.y)}" width="${(f.dx || 10) * S}" height="${(f.dy || 10) * S}" fill="${f.color || "#ccc"}" opacity="0.85" stroke="#444"/>`
      );
    }
    write(
      "outputs/plans/14_v46_etaj_plan.svg",
      svgWrap(W, H, `V46 rev.${rev} · plan ETAJ (înghețat)`, parts.join("\n"))
    );
  }

  // ── Furniture-only plan (parter) ──
  {
    const W = M * 2 + v.envelope_cm.ew * S + 200;
    const L = Math.max(
      v.envelope_cm.ns,
      (v.rooms_cm.find((r) => r.id === "terasa")?.y || 0) +
        (v.rooms_cm.find((r) => r.id === "terasa")?.dy || 0) +
        80
    );
    const H = M * 2 + L * S + 100;
    const px = (x) => M + x * S;
    const py = (y) => M + y * S;
    const parts = [];
    for (const r of v.rooms_cm) {
      if (r.id === "scara") continue;
      const t = r.id === "terasa" ? v.terrace_by_level?.[0] || r : r;
      parts.push(
        `<rect x="${px(t.x)}" y="${py(t.y)}" width="${t.dx * S}" height="${t.dy * S}" fill="#f0eee8" stroke="#aaa"/>`
      );
    }
    for (const w of v.walls_cm) {
      parts.push(
        `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="#444"/>`
      );
    }
    for (const f of v.furniture_cm) {
      if (f.levels && !f.levels.includes(0)) continue;
      parts.push(
        `<rect x="${px(f.x)}" y="${py(f.y)}" width="${(f.dx || 10) * S}" height="${(f.dy || 10) * S}" fill="${f.color || "#bbb"}" stroke="#222"/>`
      );
      parts.push(
        `<text x="${px(f.x + (f.dx || 10) / 2)}" y="${py(f.y + (f.dy || 10) / 2)}" text-anchor="middle" font-size="6" font-family="IBM Plex Sans,Segoe UI,sans-serif">${f.id}</text>`
      );
    }
    write(
      "outputs/plans/12_v46_furniture_plan.svg",
      svgWrap(W, H, `V46 rev.${rev} · plan mobilier PARTER`, parts.join("\n"))
    );
  }

  // ── MEP plan ──
  {
    const W = M * 2 + v.envelope_cm.ew * S + 200;
    const H = M * 2 + v.envelope_cm.ns * S + 120;
    const px = (x) => M + x * S;
    const py = (y) => M + y * S;
    const parts = [];
    for (const r of v.rooms_cm) {
      if (r.outdoor || r.id === "scara" || r.id === "primire") continue;
      parts.push(
        `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="#f8f9fa" stroke="#adb5bd"/>`
      );
    }
    for (const w of v.walls_cm) {
      parts.push(
        `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="#495057"/>`
      );
    }
    const mep = v.mep_cm || {};
    const items = [];
    const pushPos = (arr, kind) => {
      for (const p of arr || []) {
        if (p && p.x != null) items.push({ ...p, kind });
      }
    };
    pushPos(mep.prana?.positions, "PRANA");
    pushPos(mep.ac?.indoor, "AC");
    pushPos(mep.ac?.outdoor, "AC_out");
    pushPos(mep.bath_extract?.positions || (mep.bath_extract?.x != null ? [mep.bath_extract] : []), "extract");
    if (mep.kitchen_hood?.x != null) items.push({ ...mep.kitchen_hood, kind: "hood" });
    for (const [k, val] of Object.entries(mep)) {
      if (val && typeof val === "object" && val.x != null) items.push({ ...val, id: k, kind: k });
      if (val?.positions) pushPos(val.positions, k);
    }
    for (const it of items) {
      if (it.x == null) continue;
      parts.push(
        `<rect x="${px(it.x)}" y="${py(it.y)}" width="${(it.dx || 20) * S}" height="${(it.dy || 20) * S}" fill="#74c0fc" stroke="#1864ab"/>`
      );
      parts.push(
        `<text x="${px(it.x)}" y="${py(it.y) - 2}" font-size="7" fill="#1864ab" font-family="IBM Plex Sans,Segoe UI,sans-serif">${it.id || it.kind}</text>`
      );
    }
    parts.push(
      `<text x="40" y="${H - 30}" font-size="9" fill="#b08900" font-family="IBM Plex Sans,Segoe UI,sans-serif">MEP = rezerve din JSON — nu proiect autorizat</text>`
    );
    write(
      "outputs/plans/13_v46_mep_plan.svg",
      svgWrap(W, H, `V46 rev.${rev} · plan instalații (rezerve)`, parts.join("\n"))
    );
  }

  // ── Surfaces table ──
  const ter0 = v.terrace_by_level?.[0];
  const ter1 = v.terrace_by_level?.[1];
  const useful = v.areas_cm?.useful_interior_m2 ?? 37.87875;
  const terraceLib =
    ter0 ? ((ter0.dx - 10) * (ter0.dy - 10)) / 10000 : v.areas_cm?.terrace_libera_m2;
  const built = (v.envelope_cm.ew * v.envelope_cm.ns) / 10000;
  const parcelM = parcel.confirmed?.area_measured_m2 ?? 147;
  const parcelActs = parcel.confirmed?.area_from_acts_m2 ?? 172;
  const pot = built / parcelM;
  const cut = (built * (v.levels || 2)) / parcelM;

  const surfacesMd = `# V46 rev.${rev} — tabel suprafețe

| Mărime | Valoare | Metodă | Status |
|--------|---------|--------|--------|
| Teren măsurat/CF | **${parcelM} m²** | CF / măsurătoare declarată | de verificat vs acte |
| Teren acte | **${parcelActs} m²** | acte | neclarificat față de ${parcelM} |
| Poligon reconstruit | ${parcel.metrics?.area_m2 ?? 145.741} m² | shoelace vertices CF | aproximativ |
| Construită amprentă (P) | **${built.toFixed(2)} m²** | ${v.envelope_cm.ew / 100}×${v.envelope_cm.ns / 100} m | ipoteză amplasare |
| Utilă geometrică / nivel | **${Number(useful).toFixed(4)} m²** | shoelace interior − pereți | calcul geometric |
| Terasă liberă parter | **${Number(terraceLib).toFixed(3)} m²** | (${ter0?.dx}-10)×(${ter0?.dy}-10)/10000 | studiu; urbanism deschis |
| Terasă etaj (amprentă) | **${(((ter1?.dx || 330) * (ter1?.dy || 185)) / 10000).toFixed(3)} m²** | terrace_by_level[1] | înghețat |
| Subsol | n/a util confirmat | studiu S09/brief | ipoteză — fără arie autorizabilă |
| POT (pe ${parcelM} m²) | **${pot.toFixed(3)}** | construit/teren măsurat | **neconfirmat** — nu pentru autorizare |
| CUT (P+E pe ${parcelM} m²) | **${cut.toFixed(3)}** | 2×amprentă/teren măsurat | **neconfirmat** |

## Conflicte deschise
${(v.conflicts_open || []).map((c) => `- **${c.id}** [${c.status}]: ${c.ask || ""} — ${c.note || ""}`).join("\n")}
`;
  write("outputs/reports/v46_rev8_surfaces.md", surfacesMd);
  write(
    "outputs/reports/v46_exact_surfaces.json",
    JSON.stringify(
      {
        rev,
        parcel_measured_m2: parcelM,
        parcel_acts_m2: parcelActs,
        built_footprint_m2: built,
        useful_geom_m2: useful,
        terrace_parter_libera_m2: terraceLib,
        terrace_etaj_placa_m2: ((ter1?.dx || 330) * (ter1?.dy || 185)) / 10000,
        POT_on_measured: pot,
        CUT_on_measured: cut,
        POT_CUT_status: "neconfirmat",
        conflicts: v.conflicts_open || [],
      },
      null,
      2
    )
  );

  // ── Changelog ──
  const changelog = `# V46 rev.${rev} — changelog față de Cursor r7g

## Păstrat
- Envelope 680×860; etaj înghețat (terasă 330×185, intrare buc_est).
- Terasă parter unită până Y975; 2 trepte vizibile Y975–1035; parapet cu gol pe scări.
- Pocket doors: statusurile de fezabilitate neschimbate (1× NOT_FEASIBLE, 2× CONDITIONAL).

## Modificat / adăugat
- Zonă **PRIMIRE** + cuier + corp jos la \`intrare_parter\` (nu linia de lucru).
- \`terrace_guards_cm\`: parapet / paravan / balustradă tipizate.
- \`site_access_cm\`: pietonal Dragalina, auto Cloșca, parcări 2×2,5×5, variante poartă 4/5/6 m, mecanism articulat vs pivot rigid.
- \`basement_cm\`: curte engleză, scară, vestibul, electric / apă / depozit, echipamente placeholder.
- Planșe noi: \`16_v46_site_plan.svg\`, \`17_v46_subsol_plan.svg\`, \`18_v46_subsol_sections.svg\`.
- \`14_v46_etaj_plan.svg\` regenerat ca plan etaj real; \`12\`/\`13\` nu mai sunt copii oarbe ale parterului.
- Tabel suprafețe cu status POT/CUT neconfirmat.

## Rămâne de decis (arhitect / structurist / beneficiară)
- Front bucătărie 290 nord (C2) — nu încape în 175.
- Confirmare primire ca bandă vs hol zidit (C1).
- Cote subsol vs fundații / H liber 210.
- Poartă produs real (telescopic/segmentat) pe front Cloșca.
- 147 vs 172 m² teren; POT/CUT autorizabile.
- Urbanism terasă pe zona scării.
`;
  write("outputs/reports/v46_rev8_changelog.md", changelog);
  write("outputs/reports/v46_exact_changelog.md", changelog);

  console.log(
    JSON.stringify(
      {
        ok: true,
        rev,
        plans: [
          "outputs/plans/16_v46_site_plan.svg",
          "outputs/plans/17_v46_subsol_plan.svg",
          "outputs/plans/18_v46_subsol_sections.svg",
          "outputs/plans/14_v46_etaj_plan.svg",
          "outputs/plans/12_v46_furniture_plan.svg",
          "outputs/plans/13_v46_mep_plan.svg",
        ],
        reports: [
          "outputs/reports/v46_rev8_surfaces.md",
          "outputs/reports/v46_rev8_changelog.md",
          "outputs/reports/v46_rev8_startup.md",
        ],
      },
      null,
      2
    )
  );
}

main();
