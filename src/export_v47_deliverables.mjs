/**
 * V47 deliverables: sit, subsol plan+secțiune, suprafețe pe nivel, checks geometrice.
 * Nu atinge V46.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const write = (rel, text) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof text === "string" ? text : JSON.stringify(text, null, 2));
  return rel;
};

function svgWrap(w, h, title, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#f7f5f0"/>
  <text x="${w / 2}" y="26" text-anchor="middle" font-size="14" font-family="IBM Plex Sans,Segoe UI,sans-serif">${title}</text>
  ${body}
</svg>`;
}

function rectsOverlap(a, b) {
  return !(a.x + a.dx <= b.x || b.x + b.dx <= a.x || a.y + a.dy <= b.y || b.y + b.dy <= a.y);
}

function runGeometricChecks(v47, volume) {
  const checks = [];
  const pass = (id, note, method) => checks.push({ id, result: "pass", note, method });
  const fail = (id, note, method) => checks.push({ id, result: "fail", note, method });
  const unk = (id, note, method) => checks.push({ id, result: "unknown", note, method });

  const bm = v47.basement_cm;
  const st = bm?.stair;
  const lv = bm?.levels_vs_ff_parter_cm;

  // 1) Stair mesh Z links −95 → −250 (geometric, not text)
  const treadMeshes = (volume?.meshes || []).filter((m) => /^subsol_scara_\d+$/.test(m.id || ""));
  const finalRiser = (volume?.meshes || []).find((m) => m.id === "subsol_scara_riser_final");
  if (treadMeshes.length && st) {
    const sorted = [...treadMeshes].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    const zTops = sorted.map((m) => m.z1_m);
    const expectTops = Array.from({ length: st.treads }, (_, i) => (st.from_z_cm - st.riser_cm * (i + 1)) / 100);
    const topsOk = expectTops.every((e, i) => Math.abs(zTops[i] - e) < 0.015);
    const firstOk = Math.abs(zTops[0] - (st.from_z_cm - st.riser_cm) / 100) < 0.015;
    const lastTopOk = Math.abs(zTops[zTops.length - 1] - (st.from_z_cm - st.riser_cm * st.treads) / 100) < 0.015;
    const botMesh = finalRiser || sorted[sorted.length - 1];
    const botOk = Math.abs(botMesh.z0_m - st.to_z_cm / 100) < 0.02;
    const goesDown = zTops[0] > zTops[zTops.length - 1] && zTops[0] < st.from_z_cm / 100;
    const notUpToPositive = Math.max(...zTops) < 0;
    const sumRisers = +(st.risers * st.riser_cm).toFixed(3);
    const deltaOk = Math.abs(sumRisers - Math.abs(st.from_z_cm - st.to_z_cm)) < 0.01;
    if (topsOk && firstOk && lastTopOk && botOk && goesDown && notUpToPositive && deltaOk && sorted.length === st.treads) {
      pass(
        "stair_z_links_95_to_250",
        `călcări z1=[${zTops[0].toFixed(3)}…${zTops.at(-1).toFixed(3)}] → bot ${botMesh.z0_m.toFixed(3)}; ${st.risers}×${st.riser_cm}=${sumRisers}`,
        "z1 trepte = from−(i+1)×riser; z0 final = to_z; sumă = |from−to|"
      );
    } else {
      fail(
        "stair_z_links_95_to_250",
        `topsOk=${topsOk} botOk=${botOk} goesDown=${goesDown} up+=${!notUpToPositive} n=${sorted.length} sum=${sumRisers}`,
        "z1 trepte vs from/to; anti-urcare"
      );
    }
  } else {
    fail("stair_z_links_95_to_250", "lipsește mesh scară sau stair JSON", "prezență mesh subsol_scara_*");
  }

  // 2) Stair inside ramp2 band + connected to landings/door/rooms
  const r2 = bm?.ramp2_ref || v47.stair_cm?.ramp2;
  if (st && r2) {
    const inBand =
      st.x >= r2.x - 1 &&
      st.x + (st.width_clear_cm || st.dx) <= r2.x + r2.dx + 1 &&
      st.y >= r2.y - 5 &&
      st.y + st.dy <= r2.y + r2.dy + 5;
    if (inBand) pass("stair_in_ramp2_band", `scară X${st.x} Y${st.y} ⊆ ramp2`, "AABB scară ⊆ ramp2±tol (nu doar align string)");
    else fail("stair_in_ramp2_band", `scară în afara benzii ramp2`, "AABB");
  }

  const low = bm?.lower_landing;
  const up = bm?.upper_landing;
  const door = bm?.door_to_rooms;
  const hol = (bm?.rooms || []).find((r) => r.id === "hol_subsol");
  // Scară atinge palierul inferior pe latura nord (Y scării = Y palier) sau sud
  const stairTouchesLow =
    st &&
    low &&
    (Math.abs(low.y - (st.y + st.dy)) <= 5 ||
      Math.abs(st.y - (low.y + low.dy)) <= 5 ||
      Math.abs(st.y + st.dy - low.y) <= 5 ||
      rectsOverlap(
        { x: st.x, y: st.y, dx: st.width_clear_cm || st.dx, dy: st.dy },
        low
      ));
  if (low && door && hol) {
    const touchDoorLanding =
      rectsOverlap(low, door) ||
      Math.abs(door.x + door.dx - low.x) < 5 ||
      Math.abs(low.x - door.x) < 5;
    const touchDoorRoom =
      rectsOverlap(door, hol) ||
      Math.abs(door.x - (hol.x + hol.dx)) < 40 ||
      Math.abs(hol.x + hol.dx - door.x) < 40;
    if (touchDoorLanding && (touchDoorRoom || stairTouchesLow)) {
      pass(
        "stair_landing_door_rooms",
        "palier−250 ↔ ușă; scară pe bandă rampă2",
        "AABB adjacency (P10)"
      );
    } else {
      fail(
        "stair_landing_door_rooms",
        `door-land=${touchDoorLanding} door-hol=${touchDoorRoom} st-low=${stairTouchesLow}`,
        "AABB adjacency"
      );
    }
  } else {
    fail("stair_landing_door_rooms", "lipsește lower_landing / door_to_rooms / hol", "prezență JSON");
  }

  // 3) Clear height
  if (lv?.clear_height_cm != null && lv.slab_soffit_cm != null && lv.basement_ff != null) {
    const calc = lv.slab_soffit_cm - lv.basement_ff;
    if (Math.abs(calc - lv.clear_height_cm) < 0.1) {
      pass("clear_height_matches", `${lv.slab_soffit_cm}−(${lv.basement_ff})=${calc} = ${lv.clear_height_cm}`, "soffit − FF_subsol");
    } else {
      fail("clear_height_matches", `calc ${calc} ≠ declared ${lv.clear_height_cm}`, "soffit − FF");
    }
  } else {
    fail("clear_height_matches", "cote clear/soffit/FF lipsă", "JSON levels");
  }

  // Room mesh height vs clear
  const volRoom = (volume?.meshes || []).find((m) => m.id?.startsWith("subsol_vol_"));
  if (volRoom && lv) {
    const h = volRoom.z1_m - volRoom.z0_m;
    const expect = lv.clear_height_cm / 100;
    if (Math.abs(h - expect) < 0.03) pass("room_mesh_clear_height", `vol h=${h.toFixed(3)} m`, "z1−z0 mesh cameră");
    else fail("room_mesh_clear_height", `vol h=${h.toFixed(3)} vs ${expect}`, "z1−z0 mesh");
  }

  // 4) Equipment overlaps
  const eqs = bm?.equipment || [];
  let eqOverlap = false;
  for (let i = 0; i < eqs.length; i++) {
    for (let j = i + 1; j < eqs.length; j++) {
      const a = { x: eqs[i].x, y: eqs[i].y, dx: eqs[i].w_cm, dy: eqs[i].d_cm };
      const b = { x: eqs[j].x, y: eqs[j].y, dx: eqs[j].w_cm, dy: eqs[j].d_cm };
      if (rectsOverlap(a, b)) eqOverlap = true;
    }
  }
  if (eqs.length && !eqOverlap) pass("equipment_no_overlap", `${eqs.length} echipamente fără overlap gabarit`, "AABB pair");
  else if (eqOverlap) fail("equipment_no_overlap", "gabarite echipamente se suprapun", "AABB");
  else unk("equipment_no_overlap", "fără listă echipamente", "n/a");

  // Service front zones vs other equipment bodies (geometric)
  let serviceHit = false;
  const hits = [];
  for (let i = 0; i < eqs.length; i++) {
    const front = {
      x: eqs[i].x,
      y: eqs[i].y + eqs[i].d_cm,
      dx: eqs[i].w_cm,
      dy: eqs[i].service_front_cm || 0,
    };
    if (!front.dy) continue;
    for (let j = 0; j < eqs.length; j++) {
      if (i === j) continue;
      const body = { x: eqs[j].x, y: eqs[j].y, dx: eqs[j].w_cm, dy: eqs[j].d_cm };
      if (rectsOverlap(front, body)) {
        serviceHit = true;
        hits.push(`${eqs[i].id}→${eqs[j].id}`);
      }
    }
  }
  if (!eqs.length) unk("equipment_service_clearance", "fără echipamente", "n/a");
  else if (!serviceHit) pass("equipment_service_clearance", "fronturi service fără overlap pe alte gabarite", "AABB service_front vs body");
  else fail("equipment_service_clearance", `overlap: ${hits.slice(0, 5).join(", ")}`, "AABB service_front vs body");

  // 5) Gate width consistency — JSON + volume meta + site SVG (clear ≈ tot frontul Cloșca)
  const gJson = v47.site_access_cm?.auto?.gate?.clear_opening_m;
  const gVol = volume?.meta?.gate_clear_m;
  let gSvg = null;
  try {
    const svg26 = fs.readFileSync(path.join(ROOT, "outputs/plans/26_v47_site_plan.svg"), "utf8");
    const m7 = svg26.match(/7[,.]1\s*m/);
    const m6 = svg26.match(/clear\s+\*{0,2}6(?:[,.]0+)?\s*m/i) || svg26.match(/poartă[^\n]{0,40}6\s*m/i);
    gSvg = m7 ? 7.1 : m6 ? 6 : null;
  } catch {
    gSvg = null;
  }
  if (gJson === 7.1 && gVol === 7.1 && gSvg === 7.1) {
    pass("gate_width_consistent", "JSON=7.1 · volume.meta=7.1 · plan26=7.1 (≈front Cloșca)", "egalitate numerică JSON/meta/SVG");
  } else {
    fail("gate_width_consistent", `JSON=${gJson} volume=${gVol} svgGuess=${gSvg}`, "comparație JSON/meta/SVG");
  }

  // 6) Entry description consistency — openings + scheme + path overlay + plan21 cartouche
  const o = v47.openings_cm?.find((x) => x.id === "intrare_parter");
  const scheme = v47.parter_entry_scheme?.approach || "";
  const lands = o?.lands_in;
  const pathLab = (v47.path_overlays_cm || []).find((p) => p.id === "path_entry_parter")?.label || "";
  let plan21 = "";
  try {
    plan21 = fs.readFileSync(path.join(ROOT, "outputs/plans/21_v47_exact_plan.svg"), "utf8");
  } catch {
    plan21 = "";
  }
  const planSaysPrimire = /PRIMIRE/i.test(plan21) && !/intrare P → buc/i.test(plan21);
  const planSaysV47 = /V47 rev/i.test(plan21) && !/V46 rev\.1/i.test(plan21);
  const planSaysHol =
    (/HOL|PRIMIRE/i.test(plan21) || /terasă → HOL|→ HOL/i.test(plan21)) &&
    !/intrare P → buc/i.test(plan21);
  const okEntry =
    (lands === "hol_intrare" || lands === "primire") &&
    (/hol|primire/i.test(scheme) || /HOL/i.test(scheme)) &&
    !/ușă\s*→\s*bucătărie/i.test(scheme) &&
    !/intrare P → buc/i.test(pathLab) &&
    (/HOL|PRIMIRE/i.test(pathLab) || /hol/i.test(pathLab)) &&
    planSaysHol &&
    planSaysV47;
  if (okEntry) {
    pass("entry_description_consistent", "lands_in+scheme+path+plan21 = HOL/PRIMIRE", "cross-check openings/scheme/path/SVG");
  } else {
    fail(
      "entry_description_consistent",
      `lands=${lands}; path=${pathLab}; planHol=${planSaysHol}; planV47=${planSaysV47}`,
      "cross-check (nu doar metadata note)"
    );
  }

  // 7) Surfaces by level — must exist separately (not only 37.87 as house total)
  if (
    bm?.areas?.total_brut_rooms_m2 > 10 &&
    v47.areas_cm?.useful_interior_m2 &&
    bm.areas.camera_tehnica_m2 > 0 &&
    bm.areas.depozit_m2 > 0
  ) {
    pass(
      "surfaces_per_level_data",
      `subsol ${bm.areas.total_brut_rooms_m2} · P/E util ${v47.areas_cm.useful_interior_m2} (pe nivel)`,
      "basement.areas pe camere + areas_cm util/nivel"
    );
  } else {
    fail("surfaces_per_level_data", "arii pe nivel incomplete", "basement.areas + areas_cm");
  }

  // Envelope / etaj frozen geometric
  if (v47.envelope_cm?.ew === 680 && v47.envelope_cm?.ns === 860) {
    pass("envelope_680x860", "680×860", "egalitate");
  } else fail("envelope_680x860", "modificat", "egalitate");

  const t1 = v47.terrace_by_level?.[1];
  if (t1?.dx === 330 && t1?.dy === 185) pass("terrace_L1_frozen", "330×185", "egalitate");
  else fail("terrace_L1_frozen", JSON.stringify(t1), "egalitate");

  // Court connection steps
  const cts = bm?.court_to_access_steps;
  if (cts && Math.abs(cts.from_z_cm - cts.to_z_cm) - Math.abs(cts.delta_cm) < 0.1) {
    pass("court_to_access_link", `−48→−95 via ${cts.count} trepte`, "delta = from−to");
  } else fail("court_to_access_link", "racord curte−palier lipsă/incoerent", "JSON court_to_access_steps");

  unk("structural_basement", "fundații/subzidiri — structurist", "în afara modelului");
  unk("pot_cut_authorization", "POT/CUT neconfirmate", "cadastru deschis");

  return checks;
}

function main() {
  const v = read("data/building/v47_exact.json");
  // Prefer freshly built volume if present
  let volume = null;
  try {
    volume = read("viewer/data/volume_v47.json");
  } catch {
    volume = null;
  }
  const parcel = read("data/site/parcel.json");
  const poly = read("data/site/parcel_polygon_cf.json");
  const rev = v.meta?.rev || 1;
  const bm = v.basement_cm;
  const gateClear = v.site_access_cm?.auto?.gate?.clear_opening_m ?? 6;

  // ── 26 site ──
  {
    const W = 920;
    const H = 1080;
    const scale = 26;
    const ox = 70;
    const oy = 55;
    const pts = poly.vertices_m.filter((p, i, a) => i < a.length - 1);
    const minX = Math.min(...pts.map((p) => p.x));
    const maxY = Math.max(...pts.map((p) => p.y));
    const px = (x) => ox + (x - minX) * scale;
    const py = (y) => oy + (maxY - y) * scale;
    const parts = [];
    parts.push(
      `<text x="${W / 2}" y="46" text-anchor="middle" font-size="10" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">N↑ · Dragalina E · Cloșca S · poartă clear **${gateClear} m** (consecvent JSON/3D)</text>`
    );
    const d = pts.map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ") + " Z";
    parts.push(`<path d="${d}" fill="#e8efe0" stroke="#2d5a27" stroke-width="2"/>`);
    const bx = ox + 36;
    const by = oy + 36;
    const bS = 0.32;
    parts.push(
      `<rect x="${bx}" y="${by}" width="${v.envelope_cm.ew * bS}" height="${v.envelope_cm.ns * bS}" fill="#d8d2c6" stroke="#333"/>`
    );
    parts.push(
      `<text x="${bx}" y="${by - 4}" font-size="9" font-family="IBM Plex Sans,Segoe UI,sans-serif">casă + subsol sub amprentă (studiu)</text>`
    );
    // gate closed 6m
    parts.push(`<rect x="${bx}" y="${by + 400}" width="${gateClear * 100 * bS}" height="10" fill="#c4a35a" stroke="#333"/>`);
    parts.push(
      `<text x="${bx}" y="${by + 430}" font-size="9" font-family="IBM Plex Sans,Segoe UI,sans-serif">poartă ÎNCHISĂ clear ${gateClear} m</text>`
    );
    parts.push(`<rect x="${bx - 12}" y="${by + 180}" width="10" height="${gateClear * 100 * bS * 0.45}" fill="#e8d5a3" opacity="0.75" stroke="#333"/>`);
    parts.push(
      `<text x="${bx - 8}" y="${by + 170}" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">DESCHISĂ pe vest</text>`
    );
    // parcări studiu (schematic, departate)
    const park = v.site_access_cm?.auto?.parking || {};
    const stalls = park.stalls || [];
    stalls.forEach((s, i) => {
      const px0 = bx + 40 + i * ((s.w_cm || 250) * bS + 28);
      const py0 = by + 320;
      parts.push(
        `<rect x="${px0}" y="${py0}" width="${(s.w_cm || 250) * bS}" height="${(s.d_cm || 500) * bS * 0.45}" fill="#5a6570" opacity="0.4" stroke="#333" stroke-dasharray="4 3"/>`
      );
      parts.push(
        `<text x="${px0}" y="${py0 - 4}" font-size="8" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">${s.id || "P"} studiu</text>`
      );
    });
    // poartă pietonală + alee
    const ped = v.site_access_cm?.pedestrian;
    if (ped?.gate) {
      parts.push(
        `<rect x="${bx + v.envelope_cm.ew * bS}" y="${by + v.envelope_cm.ns * bS * 0.85}" width="10" height="36" fill="#6aaf7a" stroke="#234"/>`
      );
      parts.push(
        `<text x="${bx + v.envelope_cm.ew * bS + 14}" y="${by + v.envelope_cm.ns * bS * 0.85 + 14}" font-size="8" fill="#234" font-family="IBM Plex Sans,Segoe UI,sans-serif">poartă pietonală Dragalina</text>`
      );
      parts.push(
        `<rect x="${bx + 60}" y="${by + v.envelope_cm.ns * bS + 8}" width="${v.envelope_cm.ew * bS * 0.7}" height="14" fill="#c5b89a" opacity="0.7"/>`
      );
      parts.push(
        `<text x="${bx + 60}" y="${by + v.envelope_cm.ns * bS + 36}" font-size="8" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">alee → scări</text>`
      );
    }
    if (v.site_access_cm?.fence) {
      parts.push(
        `<text x="${bx}" y="${by + 470}" font-size="9" fill="#6b5d4d" font-family="IBM Plex Sans,Segoe UI,sans-serif">împrejmuire contur (goluri: auto Cloșca ${gateClear} m + pietonală Dragalina)</text>`
      );
    }
    write(
      "outputs/plans/26_v47_site_plan.svg",
      svgWrap(W, H, `V47 · plan situație (porți + împrejmuire)`, parts.join("\n"))
    );
  }

  // ── 29 împrejmuire (view separat) ──
  {
    const W = 920;
    const H = 1000;
    const scale = 26;
    const ox = 70;
    const oy = 70;
    const pts = poly.vertices_m.filter((p, i, a) => i < a.length - 1);
    const minX = Math.min(...pts.map((p) => p.x));
    const maxY = Math.max(...pts.map((p) => p.y));
    const px = (x) => ox + (x - minX) * scale;
    const py = (y) => oy + (maxY - y) * scale;
    const parts = [];
    parts.push(
      `<text x="${W / 2}" y="42" text-anchor="middle" font-size="11" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">EST + NORD = zid casă (front Dragalina / vecin) · VEST + Cloșca + Dragalina S = gard + porți</text>`
    );
    const d = pts.map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ") + " Z";
    parts.push(`<path d="${d}" fill="#eef3ea" stroke="#2d5a27" stroke-width="1.5" stroke-dasharray="6 4"/>`);
    const bx = ox + 36;
    const by = oy + 36;
    const bS = 0.32;
    const ew = v.envelope_cm.ew * bS;
    const ns = v.envelope_cm.ns * bS;
    // amprentă
    parts.push(`<rect x="${bx}" y="${by}" width="${ew}" height="${ns}" fill="#ddd6ca" stroke="#555" stroke-width="1"/>`);
    // EST + NORD = zid (gros)
    parts.push(`<rect x="${bx + ew - 4}" y="${by}" width="5" height="${ns}" fill="#9a9080" stroke="#333"/>`);
    parts.push(`<rect x="${bx}" y="${by}" width="${ew}" height="5" fill="#9a9080" stroke="#333"/>`);
    parts.push(
      `<text x="${bx + ew + 10}" y="${by + ns * 0.4}" font-size="9" fill="#5a5248" font-family="IBM Plex Sans,Segoe UI,sans-serif">EST = zid (Dragalina)</text>`
    );
    parts.push(
      `<text x="${bx + ew * 0.25}" y="${by - 8}" font-size="9" fill="#5a5248" font-family="IBM Plex Sans,Segoe UI,sans-serif">NORD = zid (vecin)</text>`
    );
    // gard vest → colț NV + bandă scurtă NV (închidere)
    parts.push(`<rect x="${bx - 14}" y="${by}" width="6" height="${ns}" fill="#8a7d6b" stroke="#333"/>`);
    parts.push(`<rect x="${bx - 14}" y="${by - 6}" width="${18}" height="6" fill="#8a7d6b" stroke="#333"/>`);
    parts.push(
      `<text x="${bx - 52}" y="${by + ns * 0.5}" font-size="9" fill="#6b5d4d" font-family="IBM Plex Sans,Segoe UI,sans-serif">gard vest</text>`
    );
    parts.push(
      `<text x="${bx - 8}" y="${by - 10}" font-size="8" fill="#6b5d4d" font-family="IBM Plex Sans,Segoe UI,sans-serif">colt NV</text>`
    );
    // Cloșca poartă auto
    parts.push(
      `<rect x="${bx}" y="${by + ns + 100}" width="${gateClear * 100 * bS}" height="10" fill="#c4a35a" stroke="#333"/>`
    );
    parts.push(
      `<text x="${bx}" y="${by + ns + 130}" font-size="9" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">poartă auto Cloșca ~${gateClear} m</text>`
    );
    // Dragalina S gard + poartă pietonală
    parts.push(
      `<rect x="${bx + ew}" y="${by + ns + 8}" width="8" height="70" fill="#8a7d6b" stroke="#333"/>`
    );
    parts.push(
      `<rect x="${bx + ew}" y="${by + ns + 82}" width="10" height="48" fill="#6aaf7a" stroke="#234"/>`
    );
    parts.push(
      `<text x="${bx + ew + 16}" y="${by + ns + 100}" font-size="8" fill="#234" font-family="IBM Plex Sans,Segoe UI,sans-serif">poartă pietonală 150</text>`
    );
    parts.push(
      `<text x="40" y="${H - 50}" font-size="10" fill="#6b5d4d" font-family="IBM Plex Sans,Segoe UI,sans-serif">■ zid casă = împrejmuire pe EST/NORD &nbsp;&nbsp; ■ gard &nbsp;&nbsp; ■ poartă auto &nbsp;&nbsp; ■ poartă pietonală</text>`
    );
    parts.push(
      `<text x="40" y="${H - 30}" font-size="9" fill="#888" font-family="IBM Plex Sans,Segoe UI,sans-serif">Viewer: buton Împrejmuire · plan 29 · rev ${rev}</text>`
    );
    write(
      "outputs/plans/29_v47_imprejmuire.svg",
      svgWrap(W, H, `V47 · împrejmuire (view separat)`, parts.join("\n"))
    );
  }

  // ── 30 curte / curte engleză ──
  {
    const W = 920;
    const H = 1040;
    const S = 0.42;
    const M = 70;
    const cy = v.courtyard_cm;
    const bm = v.basement_cm;
    const cts = bm?.court_to_access_steps;
    const parts = [];
    const px = (x) => M + x * S;
    const py = (y) => M + y * S;
    parts.push(
      `<text x="${W / 2}" y="40" text-anchor="middle" font-size="11" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">Curte sud + curte engleză (−48 → −95 → beci −250) · studiu</text>`
    );
    // amprentă casă
    parts.push(
      `<rect x="${px(0)}" y="${py(0)}" width="${v.envelope_cm.ew * S}" height="${v.envelope_cm.ns * S}" fill="#ddd6ca" stroke="#555" opacity="0.7"/>`
    );
    parts.push(
      `<text x="${px(20)}" y="${py(40)}" font-size="9" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">casă</text>`
    );
    for (const z of cy?.zones || []) {
      const fill = z.kind === "green" ? "#6a8f5a" : "#b8b09a";
      parts.push(
        `<rect x="${px(z.x)}" y="${py(z.y)}" width="${z.dx * S}" height="${z.dy * S}" fill="${fill}" opacity="0.55" stroke="#444"/>`
      );
      parts.push(
        `<text x="${px(z.x + 4)}" y="${py(z.y + 14)}" font-size="8" fill="#222" font-family="IBM Plex Sans,Segoe UI,sans-serif">${z.id}</text>`
      );
    }
    // alee
    for (const seg of v.site_access_cm?.pedestrian?.path?.segments_cm || []) {
      parts.push(
        `<rect x="${px(seg.x)}" y="${py(seg.y)}" width="${seg.dx * S}" height="${seg.dy * S}" fill="#c5b89a" opacity="0.8" stroke="#666"/>`
      );
    }
    // curte engleză — IN LIMITA est X≤680
    if (cts) {
      const ec = cy?.english_court;
      const eastLim = v.envelope_cm.ew;
      let ex = ec?.x ?? cts.x;
      let edx = ec?.dx ?? cts.dx;
      if (ex + edx > eastLim) edx = eastLim - ex;
      const ey = ec?.y ?? cts.y - 10;
      const edy = ec?.dy ?? cts.dy + 30;
      parts.push(
        `<rect x="${px(ex)}" y="${py(ey)}" width="${edx * S}" height="${edy * S}" fill="#4a5540" opacity="0.7" stroke="#1d3557" stroke-width="2"/>`
      );
      parts.push(
        `<text x="${px(ex)}" y="${py(ey) - 4}" font-size="9" fill="#1d3557" font-family="IBM Plex Sans,Segoe UI,sans-serif">curte engleză X≤${eastLim} · 3 trepte</text>`
      );
      // 3 trepte schematic (călcări)
      const stepDy = cts.tread_cm || cts.dy / cts.count;
      for (let i = 0; i < (cts.count || 3); i++) {
        const yS = cts.y + cts.dy - (i + 1) * stepDy;
        parts.push(
          `<rect x="${px(cts.x)}" y="${py(yS)}" width="${Math.min(cts.dx, eastLim - cts.x) * S}" height="${stepDy * S}" fill="${i % 2 ? "#c4b496" : "#b5a484"}" stroke="#333"/>`
        );
        parts.push(
          `<text x="${px(cts.x + 4)}" y="${py(yS + stepDy * 0.65)}" font-size="7" fill="#222">T${i + 1}</text>`
        );
      }
      const up = bm.upper_landing;
      if (up) {
        parts.push(
          `<rect x="${px(up.x)}" y="${py(up.y)}" width="${up.dx * S}" height="${up.dy * S}" fill="#8aa4b8" opacity="0.85" stroke="#1d3557"/>`
        );
        parts.push(
          `<text x="${px(up.x)}" y="${py(up.y + up.dy / 2)}" font-size="8" fill="#1d3557" font-family="IBM Plex Sans,Segoe UI,sans-serif">palier −95</text>`
        );
      }
    }
    // parcări schematic
    parts.push(
      `<text x="${M}" y="${H - 60}" font-size="10" fill="#5a5248" font-family="IBM Plex Sans,Segoe UI,sans-serif">■ paving &nbsp; ■ verde &nbsp; ■ curte engleză &nbsp; ■ trepte −48→−95 &nbsp; ■ palier −95 → scară beci</text>`
    );
    parts.push(
      `<text x="${M}" y="${H - 40}" font-size="9" fill="#888" font-family="IBM Plex Sans,Segoe UI,sans-serif">Viewer: buton Curte · plan 30 · rev ${rev} · status ipoteză studiu</text>`
    );
    write(
      "outputs/plans/30_v47_curte.svg",
      svgWrap(W, H, `V47 · curte + curte engleză`, parts.join("\n"))
    );
  }

  // ── 27 subsol plan ──
  {
    const S = 0.5;
    const M = 60;
    const maxX = 700;
    const maxY = 900;
    const W = M * 2 + maxX * S + 80;
    const H = M * 2 + maxY * S + 80;
    const px = (x) => M + x * S;
    const py = (y) => M + y * S;
    const parts = [];
    parts.push(
      `<text x="${W / 2}" y="48" text-anchor="middle" font-size="10" fill="#b08900" font-family="IBM Plex Sans,Segoe UI,sans-serif">STATUS: ipoteză studiu — scară −95→−250 · clear 208 · sub rampă2</text>`
    );
    // ramp2 outline
    const r2 = bm.ramp2_ref;
    parts.push(
      `<rect x="${px(r2.x)}" y="${py(r2.y)}" width="${r2.dx * S}" height="${r2.dy * S}" fill="none" stroke="#c1121f" stroke-dasharray="4 2"/>`
    );
    parts.push(`<text x="${px(r2.x)}" y="${py(r2.y) - 4}" font-size="8" fill="#c1121f">rampă2</text>`);
    for (const r of bm.rooms || []) {
      parts.push(
        `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="#dce4ec" stroke="#1d3557"/>`
      );
      parts.push(
        `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy / 2)}" text-anchor="middle" font-size="9" font-family="IBM Plex Sans,Segoe UI,sans-serif">${r.id}</text>`
      );
      parts.push(
        `<text x="${px(r.x + 4)}" y="${py(r.y + 14)}" font-size="7" fill="#333">${r.dx}×${r.dy} · ${r.area_m2} m²</text>`
      );
      // cotă lățime
      parts.push(
        `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy) + 10}" text-anchor="middle" font-size="6" fill="#555">${r.dx}</text>`
      );
    }
    // envelope dashed
    parts.push(
      `<rect x="${px(0)}" y="${py(0)}" width="${680 * S}" height="${860 * S}" fill="none" stroke="#888" stroke-dasharray="3 2"/>`
    );
    const st = bm.stair;
    for (let i = 0; i < st.treads; i++) {
      const yS = st.y + st.dy - (i + 1) * st.tread_cm;
      parts.push(
        `<rect x="${px(st.x)}" y="${py(yS)}" width="${st.width_clear_cm * S}" height="${st.tread_cm * S}" fill="${i % 2 ? "#8a93a0" : "#9aa3ad"}" stroke="#222"/>`
      );
    }
    parts.push(
      `<text x="${px(st.x)}" y="${py(st.y) - 6}" font-size="8">scară ${st.risers}×${st.riser_cm.toFixed(3)} cm</text>`
    );
    for (const L of [bm.upper_landing, bm.lower_landing]) {
      if (!L) continue;
      parts.push(
        `<rect x="${px(L.x)}" y="${py(L.y)}" width="${L.dx * S}" height="${L.dy * S}" fill="#c4b496" stroke="#333"/>`
      );
      parts.push(
        `<text x="${px(L.x + 2)}" y="${py(L.y + 12)}" font-size="7">@ ${L.z_ff_cm}</text>`
      );
    }
    for (const d of [bm.entry_door, bm.door_to_rooms]) {
      if (!d) continue;
      parts.push(
        `<rect x="${px(d.x)}" y="${py(d.y)}" width="${d.dx * S}" height="${d.dy * S}" fill="#6aaf7a" stroke="#234"/>`
      );
    }
    for (const eq of bm.equipment || []) {
      parts.push(
        `<rect x="${px(eq.x)}" y="${py(eq.y)}" width="${eq.w_cm * S}" height="${eq.d_cm * S}" fill="#adb5bd" stroke="#212"/>`
      );
      if (eq.service_front_cm) {
        parts.push(
          `<rect x="${px(eq.x)}" y="${py(eq.y + eq.d_cm)}" width="${eq.w_cm * S}" height="${eq.service_front_cm * S}" fill="#f4a261" opacity="0.2" stroke="#e76f51" stroke-dasharray="2 2"/>`
        );
      }
      parts.push(
        `<text x="${px(eq.x)}" y="${py(eq.y) - 2}" font-size="5.5" font-family="IBM Plex Sans,Segoe UI,sans-serif">${eq.label || eq.id}</text>`
      );
      parts.push(
        `<text x="${px(eq.x)}" y="${py(eq.y + eq.d_cm) + 8}" font-size="5" fill="#a33">${eq.datasheet || "fișă?"}</text>`
      );
    }
    if (bm.court_to_access_steps) {
      const c = bm.court_to_access_steps;
      parts.push(
        `<rect x="${px(c.x)}" y="${py(c.y)}" width="${c.dx * S}" height="${c.dy * S}" fill="#b09050" opacity="0.5" stroke="#333"/>`
      );
      parts.push(`<text x="${px(c.x)}" y="${py(c.y) - 4}" font-size="7">racord −48→−95</text>`);
    }
    write("outputs/plans/27_v47_subsol_plan.svg", svgWrap(W, H, `V47 · plan subsol cotat`, parts.join("\n")));
  }

  // ── 28 section ──
  {
    const W = 1100;
    const H = 620;
    const parts = [];
    const lv = bm.levels_vs_ff_parter_cm;
    const scZ = 1.1;
    const x0 = 80;
    const zRef = 280; // SVG y for FF parter = 0
    const zy = (cm) => zRef - cm * scZ; // cm relative to FF parter (negative down = larger y in svg? wait)
    // FF parter at zRef. basement -250 should be lower on page = larger y
    // zy(-250) = 280 - (-250)*1.1 = 280+275 = 555
    // zy(-95) = 280+104.5 = 384.5
    // zy(-42) = 280+46 = 326
    // zy(-48) = 280+52.8 = 332.8

    parts.push(
      `<text x="40" y="50" font-size="12" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">Secțiune: curte → racord → palier −95 → scară → palier −250 → cameră · intrados · clear</text>`
    );
    // ground courtyard
    parts.push(`<line x1="${x0}" y1="${zy(-48)}" x2="420" y2="${zy(-48)}" stroke="#888"/>`);
    parts.push(`<text x="${x0}" y="${zy(-48) - 4}" font-size="8">curte −48</text>`);
    // access
    parts.push(`<line x1="300" y1="${zy(-95)}" x2="520" y2="${zy(-95)}" stroke="#1d3557" stroke-width="2"/>`);
    parts.push(`<text x="300" y="${zy(-95) - 4}" font-size="8">palier −95</text>`);
    // court steps
    const cts = bm.court_to_access_steps;
    for (let i = 0; i < (cts?.count || 0); i++) {
      const z = -48 - cts.riser_cm * (i + 1);
      parts.push(`<rect x="${200 + i * 28}" y="${zy(z)}" width="26" height="${cts.riser_cm * scZ}" fill="#b09050"/>`);
    }
    // stair descending
    const st = bm.stair;
    for (let i = 0; i < st.treads; i++) {
      const zTop = -95 - st.riser_cm * (i + 1);
      parts.push(
        `<rect x="${480 + i * 22}" y="${zy(zTop)}" width="20" height="5" fill="#8a93a0" stroke="#333"/>`
      );
    }
    parts.push(`<line x1="480" y1="${zy(-250)}" x2="900" y2="${zy(-250)}" stroke="#333" stroke-width="2"/>`);
    parts.push(`<text x="700" y="${zy(-250) - 4}" font-size="8">FF subsol −250</text>`);
    // soffit
    parts.push(`<line x1="560" y1="${zy(-42)}" x2="980" y2="${zy(-42)}" stroke="#c1121f" stroke-width="2"/>`);
    parts.push(`<text x="820" y="${zy(-42) - 4}" font-size="8" fill="#c1121f">intrados −42</text>`);
    // clear dimension
    const xDim = 960;
    parts.push(`<line x1="${xDim}" y1="${zy(-42)}" x2="${xDim}" y2="${zy(-250)}" stroke="#2d6a4f" stroke-width="1.5"/>`);
    parts.push(
      `<text x="${xDim + 6}" y="${(zy(-42) + zy(-250)) / 2}" font-size="10" fill="#2d6a4f" font-family="IBM Plex Sans,Segoe UI,sans-serif">clear ${lv.clear_height_cm} cm</text>`
    );
    // room block
    parts.push(
      `<rect x="700" y="${zy(-42)}" width="180" height="${(-42 - -250) * scZ}" fill="#dce4ec" opacity="0.5" stroke="#1d3557"/>`
    );
    parts.push(`<text x="720" y="${zy(-140)}" font-size="9">camera_tehnica</text>`);
    parts.push(
      `<text x="40" y="${H - 30}" font-size="9" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">${st.risers}×${st.riser_cm.toFixed(3)}=${(st.risers * st.riser_cm).toFixed(3)} cm = delta ${st.delta_cm ?? 155} · ${st.treads} călcări · ipoteză studiu</text>`
    );
    write("outputs/plans/28_v47_subsol_section.svg", svgWrap(W, H, `V47 · secțiune subsol cotată`, parts.join("\n")));
  }

  // surfaces
  const useful = v.areas_cm?.useful_interior_m2 ?? 37.87875;
  const ter0 = v.terrace_by_level?.[0];
  const ter1 = v.terrace_by_level?.[1];
  const cov = v.rooms_cm.find((r) => r.id === "terasa")?.parts?.covered_north;
  const unc = v.rooms_cm.find((r) => r.id === "terasa")?.parts?.uncovered_south;
  const built = (v.envelope_cm.ew * v.envelope_cm.ns) / 10000;
  const surfaces = {
    footprint_m2: built,
    parter_util_geom_m2: useful,
    etaj_util_geom_m2: useful,
    note_util: "37,8787 m² = util geometric PE UN NIVEL (nu total casă)",
    subsol_brut_rooms_m2: bm.areas?.total_brut_rooms_m2,
    subsol_tehnica_m2: bm.areas?.camera_tehnica_m2,
    subsol_depozit_m2: bm.areas?.depozit_m2,
    subsol_hol_m2: bm.areas?.hol_m2,
    terrace_covered_m2: cov ? (cov.dx * cov.dy) / 10000 : null,
    terrace_uncovered_m2: unc ? (unc.dx * unc.dy) / 10000 : null,
    terrace_etaj_m2: ter1 ? (ter1.dx * ter1.dy) / 10000 : null,
    parking_m2: 2 * 2.5 * 5.0,
    status: "concept — POT/CUT neconfirmate",
    uncovered_terrace_m2: v.areas_cm?.uncovered_terrace_m2 ?? null,
    uncovered_in_pot: v.areas_cm?.uncovered_in_pot === true,
    pot_note: v.pot_study?.note || v.areas_cm?.pot_note || "neacoperit marcat exclude_from_pot; amprentă = anvelopă",
  };
  const surfacesMd = `# V47 — suprafețe pe nivel

| Nivel / element | m² | Status |
|-----------------|-----|--------|
| Amprentă P | **${surfaces.footprint_m2.toFixed(2)}** | 6,80×8,60 |
| Parter util geom. | **${Number(surfaces.parter_util_geom_m2).toFixed(4)}** | un nivel — nu total casă |
| Etaj util geom. | **${Number(surfaces.etaj_util_geom_m2).toFixed(4)}** | înghețat = același calcul |
| Subsol brut camere | **${surfaces.subsol_brut_rooms_m2}** | studiu (tehnică+depozit+hol) |
| — cameră tehnică | ${surfaces.subsol_tehnica_m2} | |
| — depozit | ${surfaces.subsol_depozit_m2} | |
| — hol | ${surfaces.subsol_hol_m2} | |
| Terasă P acoperită | **${surfaces.terrace_covered_m2?.toFixed(3)}** | contur covered_north |
| Terasă P neacoperită | **${surfaces.terrace_uncovered_m2?.toFixed(3)}** | uncovered_south |
| Terasă etaj | **${surfaces.terrace_etaj_m2?.toFixed(3)}** | înghețat 330×185 |
| Parcare (2×2,5×5) | **${surfaces.parking_m2.toFixed(1)}** | studiu |

${surfaces.note_util}
`;
  write("outputs/reports/v47_surfaces.md", surfacesMd);
  write("outputs/reports/v47_surfaces.json", surfaces);

  // checks — need volume after rebuild; if stale, still run JSON parts
  const checks = runGeometricChecks(v, volume);
  let md = `# V47 — verificări geometrice\n\n| ID | Rezultat | Metodă | Notă |\n|----|----------|--------|------|\n`;
  for (const c of checks) {
    md += `| ${c.id} | **${c.result}** | ${c.method || "—"} | ${c.note} |\n`;
  }
  const nPass = checks.filter((c) => c.result === "pass").length;
  const nFail = checks.filter((c) => c.result === "fail").length;
  const nUnk = checks.filter((c) => c.result === "unknown").length;
  md += `\n**Rezumat:** ${nPass} pass · ${nFail} fail · ${nUnk} unknown\n`;
  write("outputs/reports/v47_checks.md", md);
  write("outputs/reports/v47_checks.json", { checks, generated: new Date().toISOString() });

  write("outputs/reports/v47_changelog.md", `# V47 — changelog

## Rev 4 — P10 parter
- Bucătărie **NORD** front 290 (X360–650 Y30–90); mobilier FR/MSV/chiuv/plită/blat.
- Canapea pe **limită est** (10 cm de X650); living recuperat **115×120** sub platformă.
- Intrare: terasă → **PRIMIRE** (corp 130×30) → living; etaj **înghețat** r7g.
- Scară beci P10/S09: **9×17,222**=155; 8×25; Y595–795 → palier −250.
- V46 r7g **neatins**.

## Anterior (fix subsol)
- Scară mesh coboară −95→−250; clear 208; poartă 6 m; checks geometrice.
`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        gateClear,
        basement_m2: surfaces.subsol_brut_rooms_m2,
        checks: checks.map((c) => `${c.id}:${c.result}`),
      },
      null,
      2
    )
  );
}

main();
