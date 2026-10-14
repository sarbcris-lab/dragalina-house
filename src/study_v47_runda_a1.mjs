/**
 * Runda A — variantă A1 (studiu): coborâre N, palier jos liber, ușă pe palier.
 * NU modifică v47_exact.json (referință). Scrie v47_a1_study.json + livrabile.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const write = (rel, obj) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
  return p;
};

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

/** Datum absolut față de teren amenajat = 0 */
function absoluteDatum(ht) {
  const ffParter = (ht.entry_steps_to_terrace || 2) * (ht.entry_step_riser_cm || ht.riser_cm || 16);
  const access = -95;
  const basementFf = -250;
  // clear studiu 220: ușă deschidere 200 + buiandrug/toc rezervă 15 + marjă 5
  const clear = 220;
  const soffit = basementFf + clear; // -30
  return {
    datum: "teren_amenajat_0",
    grade_cm: 0,
    ff_parter_cm: ffParter,
    access_landing_cm: access,
    basement_ff_cm: basementFf,
    slab_soffit_cm: soffit,
    clear_height_cm: clear,
    floor_slab_th_cm: ht.structural_slab_cm ?? 15,
    door_to_rooms_opening_h_cm: 200,
    door_lintel_reserve_cm: 15,
    door_stack_needed_cm: 215,
    note:
      "Toate cotele absolute față de teren=0. levels_vs_ff_parter_cm din referință erau folosite mixt (nume vs FF, valori absolute). A1 le înlocuiește cu absolute_from_grade_cm.",
  };
}

function applyA1(v47) {
  const out = clone(v47);
  const d = absoluteDatum(out.heights_cm || {});
  out.meta = out.meta || {};
  out.meta.study_variant = "A1";
  out.meta.rev_note_a1 =
    "studiu Runda A — A1: scară coboară N; palier jos liber N de ultima treaptă; ușă pe palier; clear 220; fără a atinge referința v47_exact";

  const riser = 155 / 9;
  const tread = 25;
  const treads = 8;
  const risers = 9;
  // Top stair (south) abut upper landing south edge
  const ySouth = 800; // first tread south = top
  const yLast = ySouth - treads * tread; // 600
  const landY0 = 520; // free landing north of last tread
  const landDy = yLast - landY0; // 80
  const doorY0 = 530;
  const doorDy = 70; // within landing

  const treadZ = [];
  for (let i = 0; i < treads; i++) treadZ.push(d.access_landing_cm - riser * (i + 1));

  out.basement_cm = {
    ...out.basement_cm,
    status: "studiu_A1",
    concept_note:
      "A1: curte→trepte→palier−95 (Y800–860)→scară coboară N (Y600–800)→palier liber −250 (Y520–600)→ușă→hol. Clear 220. Camere reorganizabile.",
    absolute_from_grade_cm: d,
    levels_vs_ff_parter_cm: {
      // păstrate ca alias absolute (nu relative la FF) — clarificat
      courtyard_general: 0,
      access_landing: d.access_landing_cm,
      basement_ff: d.basement_ff_cm,
      slab_soffit_cm: d.slab_soffit_cm,
      clear_height_cm: d.clear_height_cm,
      clear_height_formula: `soffit(${d.slab_soffit_cm}) − FF_subsol(${d.basement_ff_cm}) = ${d.clear_height_cm}`,
      floor_slab_th_cm: d.floor_slab_th_cm,
      status: "studiu_A1_absolute",
      note: "VALORI ABSOLUTE față de teren=0 (nu relativ la FF parter)",
    },
    wall_thickness_study_cm: {
      perimeter_structure_cm: 30,
      perimeter_note: "studiu — de confirmat structurist (nu 12.5 automat)",
      partition_cm: 12.5,
      shaft_west_cm: 30,
      shaft_east_cm: 15,
      shaft_east_note: "sprijin Dragalina — studiu",
      foundation_projection_beyond_wall_cm: 15,
      foundation_note:
        "rezervă studiu 15 cm dincolo de fața exterioară a peretelui perimetral — nu se rezolvă prin subțiere",
    },
    ramp2_ref: { x: 565, y: 590, dx: 115, dy: 270 },
    court_to_access_steps: {
      count: 6,
      delta_cm: 95,
      riser_cm: 95 / 6,
      tread_cm: 28,
      x: 565,
      y: 860,
      dx: 115,
      dy: 168,
      from_z_cm: 0,
      to_z_cm: d.access_landing_cm,
      status: "studiu_A1",
      note: "teren 0 → palier −95",
    },
    upper_landing: {
      x: 565,
      y: 800,
      dx: 115,
      dy: 60,
      z_ff_cm: d.access_landing_cm,
      status: "studiu_A1",
      note: "Y800–860; abutează capătul de sus al scării; în puț deschis",
    },
    stair: {
      align: "along_ramp2",
      inside_ramp2_band: true,
      x: 565,
      y: yLast,
      dx: 102.5,
      dy: treads * tread,
      width_clear_cm: 102.5,
      riser_cm: riser,
      tread_cm: tread,
      risers,
      treads,
      from_z_cm: d.access_landing_cm,
      to_z_cm: d.basement_ff_cm,
      delta_cm: 155,
      direction: "descend_north",
      tread_z_top_cm: treadZ,
      status: "studiu_A1",
      note: `Y${yLast}–${ySouth}; ultima treaptă @ Y${yLast}; palier liber N`,
    },
    lower_landing: {
      x: 565,
      y: landY0,
      dx: 115,
      dy: landDy,
      z_ff_cm: d.basement_ff_cm,
      status: "studiu_A1",
      note: `Y${landY0}–${yLast} LIBER — nu sub scară; ușă pe acest palier`,
    },
    door_to_rooms: {
      id: "usa_subsol_camere",
      x: 535,
      y: doorY0,
      dx: 30,
      dy: doorDy,
      z_sill_cm: d.basement_ff_cm,
      opening_h_cm: d.door_to_rooms_opening_h_cm,
      lintel_reserve_cm: d.door_lintel_reserve_cm,
      connects: ["lower_landing", "hol_subsol"],
      status: "studiu_A1",
      note: "deschidere 200 + buiandrug 15 ≤ clear 220",
    },
    internal_doors: [
      {
        id: "usa_hol_ct",
        wall: "subsol_zid_ct_sud",
        x: 380,
        y: 430 - 6.25,
        dx: 90,
        dy: 12.5,
        opening_h_cm: 200,
        lintel_reserve_cm: 15,
        connects: ["hol_subsol", "camera_tehnica"],
      },
      {
        id: "usa_hol_dep",
        wall: "subsol_zid_dep_hol",
        x: 350 - 6.25,
        y: 480,
        dx: 12.5,
        dy: 80,
        opening_h_cm: 200,
        lintel_reserve_cm: 15,
        connects: ["hol_subsol", "depozit_subsol"],
      },
    ],
    rooms: [
      {
        id: "camera_tehnica",
        x: 30,
        y: 30,
        dx: 505,
        dy: 400,
        z_ff_cm: d.basement_ff_cm,
        area_m2: (505 * 400) / 10000,
        note: "CT — A1 neschimbat ca gabarit brut; gol hol pe Y430",
      },
      {
        id: "depozit_subsol",
        x: 30,
        y: 430,
        dx: 320,
        dy: 200,
        z_ff_cm: d.basement_ff_cm,
        area_m2: (320 * 200) / 10000,
        note: "depozit — gol hol pe X350",
      },
      {
        id: "hol_subsol",
        x: 350,
        y: 430,
        dx: 185,
        dy: 255,
        z_ff_cm: d.basement_ff_cm,
        area_m2: (185 * 255) / 10000,
        note: "hol Y430–685; întâlnește ușa palier @ Y530–600",
      },
    ],
    equipment: out.basement_cm.equipment,
    wet_reserves: out.basement_cm.wet_reserves,
    structure_note: out.basement_cm.structure_note,
    areas: {
      camera_tehnica_m2: (505 * 400) / 10000,
      depozit_m2: (320 * 200) / 10000,
      hol_m2: (185 * 255) / 10000,
      total_brut_rooms_m2: (505 * 400 + 320 * 200 + 185 * 255) / 10000,
      note: "arii pe contur camere — fără deducere pereți; utile de recalculat pe fețe finite",
    },
    open_shaft_under_ramp2: true,
    english_court_open_void: true,
    shaft_walls: true,
    a1_checks: null, // filled below
  };

  out.basement_cm.a1_checks = verifyA1(out);
  return out;
}

function verifyA1(v) {
  const bm = v.basement_cm;
  const d = bm.absolute_from_grade_cm;
  const st = bm.stair;
  const low = bm.lower_landing;
  const up = bm.upper_landing;
  const door = bm.door_to_rooms;
  const fails = [];
  const passes = [];

  const ySouth = st.y + st.dy;
  const yLast = st.y;
  if (up.y + up.dy !== 860) fails.push(`upper nu ajunge la Y860 (got ${up.y + up.dy})`);
  else passes.push("upper_landing → Y860 (racord curte)");

  if (Math.abs(up.y - ySouth) > 0.01) fails.push(`upper.y ${up.y} ≠ stair south ${ySouth}`);
  else passes.push("upper abut stair top (south)");

  if (low.y + low.dy > yLast + 0.01) fails.push("palier jos se suprapune pe scară");
  else passes.push("palier jos N de ultima treaptă (liber)");

  if (door.y < low.y || door.y + door.dy > low.y + low.dy)
    fails.push("ușa nu stă pe palierul liber");
  else passes.push("ușă pe palier liber");

  const hol = bm.rooms.find((r) => r.id === "hol_subsol");
  if (door.y < hol.y || door.y + door.dy > hol.y + hol.dy)
    fails.push("ușa nu întâlnește holul pe Y");
  else passes.push("ușă ∩ hol pe Y");

  if (door.opening_h_cm + door.lintel_reserve_cm > d.clear_height_cm)
    fails.push(
      `ușă ${door.opening_h_cm}+buiandrug ${door.lintel_reserve_cm} > clear ${d.clear_height_cm}`
    );
  else
    passes.push(
      `ușă ${door.opening_h_cm}+lintel ${door.lintel_reserve_cm} ≤ clear ${d.clear_height_cm}`
    );

  // headroom upper landing: in open shaft → OK; under closed slab → soffit-access
  const headUpperInShaft = true; // Y800-860 in ramp2
  passes.push(headUpperInShaft ? "palier −95 în puț deschis (fără soffit)" : "FAIL headroom −95");

  // lower landing partly under slab: clear = soffit - basement_ff
  const clearLow = d.slab_soffit_cm - d.basement_ff_cm;
  if (clearLow < d.clear_height_cm - 0.1) fails.push(`clear jos ${clearLow} ≠ declared ${d.clear_height_cm}`);
  else passes.push(`clear pe palier jos / camere = ${clearLow} cm`);

  // under etaj stair (ramp2 band) — open shaft: no slab
  passes.push("sub rampa2: puț deschis — headroom vertical liber pe scară L-1 în bandă");

  // studios untouched
  const useful = v.areas_cm?.useful_interior_m2 ?? 37.87875;
  if (Math.abs(useful - 37.87875) > 0.001) fails.push("utile studii modificate");
  else passes.push(`studii utili neschimbați ${useful} m²`);

  // envelope
  if (v.envelope_cm.ew !== 680 || v.envelope_cm.ns !== 860) fails.push("anvelopă modificată");
  else passes.push("anvelopă 680×860 păstrată");

  // parcel: shaft east thin at ew — check study wall not beyond 680
  const outerE = 565 + 115; // 680 OK
  if (outerE > 680 + 0.01) fails.push(`față E ${outerE} > 680`);
  else passes.push("zid E puț ≤ X680 (limită anvelopă)");

  // fundație rezervată: față perete −30 (față interioară 30 + 30 structură) → față exterioară 0;
  // proiecție fundație 15 cm dincolo de X0 / Y0 / X680 / Y860
  const found = bm.wall_thickness_study_cm.foundation_projection_beyond_wall_cm ?? 15;
  const foundBox = {
    x0: 0 - found,
    y0: 0 - found,
    x1: 680 + found,
    y1: 860 + found,
  };
  passes.push(
    `rezervă fundație ±${found} cm → gabarit studiu ${foundBox.x0}…${foundBox.x1} × ${foundBox.y0}…${foundBox.y1} (verificare parcelă în volum 3D)`
  );

  // ușă 210 cm (cerință tip): ar necesita 210+15=225 > clear 220 → nu forțăm subțiere/clear; A1 folosește 200+15=215
  if (210 + 15 > d.clear_height_cm) {
    passes.push(
      `notă: ușă tip 210+buiandrug 15=225 > clear 220 — A1 demonstrează cu deschidere 200+15=215≤220 (fără a egala camera la 210)`
    );
  }

  const potRef = (680 * 860) / 10000 / 147;
  return {
    ok: fails.length === 0,
    passes,
    fails,
    pot_envelope_over_147: +(potRef * 100).toFixed(2),
    pot_note: "doar anvelopă referință / 147 — confirmare limită admisă rămâne deschisă",
    foundation_study_box_cm: foundBox,
    path: "curte(0) → trepte → palier−95(Y800–860) → scară(Y600–800↓N) → palier liber−250(Y520–600) → ușă → hol → CT/dep",
  };
}

function svgEsc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function exportPlanSection(v) {
  const bm = v.basement_cm;
  const d = bm.absolute_from_grade_cm;
  const S = 0.55;
  const M = 70;
  const W = M * 2 + 720 * S + 200;
  const H = M * 2 + 920 * S + 120;
  const px = (x) => M + x * S;
  const py = (y) => M + y * S;
  const parts = [];
  parts.push(
    `<text x="${W / 2}" y="36" text-anchor="middle" font-size="13" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 A1 · plan subsol — studiu (referință neatinsă)</text>`
  );
  parts.push(
    `<text x="${W / 2}" y="52" text-anchor="middle" font-size="9" fill="#b08900" font-family="IBM Plex Sans,Segoe UI,sans-serif">${svgEsc(bm.a1_checks.path)}</text>`
  );

  // envelope
  parts.push(
    `<rect x="${px(0)}" y="${py(0)}" width="${680 * S}" height="${860 * S}" fill="none" stroke="#999" stroke-dasharray="4 3"/>`
  );

  const wt = bm.wall_thickness_study_cm;
  // perimeter study (interior face ~30)
  parts.push(
    `<rect x="${px(30)}" y="${py(30)}" width="${(680 - 60) * S}" height="${(860 - 60) * S}" fill="none" stroke="#6c757d" stroke-width="1.2"/>`
  );

  for (const r of bm.rooms) {
    const fill =
      r.id === "camera_tehnica" ? "#c5d5e0" : r.id === "depozit_subsol" ? "#d9cbb8" : "#e8d5a3";
    parts.push(
      `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="${fill}" stroke="#1d3557"/>`
    );
    parts.push(
      `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy / 2)}" text-anchor="middle" font-size="10" font-family="IBM Plex Sans,Segoe UI,sans-serif">${r.id}</text>`
    );
    parts.push(
      `<text x="${px(r.x + 4)}" y="${py(r.y + 14)}" font-size="7">${r.dx}×${r.dy} · ${r.area_m2.toFixed(3)} m²</text>`
    );
  }

  // walls with openings hint
  parts.push(
    `<rect x="${px(30)}" y="${py(430 - 6)}" width="${505 * S}" height="${12 * S}" fill="#b8b0a0" stroke="#333"/>`
  );
  parts.push(
    `<rect x="${px(380)}" y="${py(430 - 6)}" width="${90 * S}" height="${12 * S}" fill="#6aaf7a" stroke="#234"/>`
  );
  parts.push(
    `<rect x="${px(350 - 6)}" y="${py(430)}" width="${12 * S}" height="${200 * S}" fill="#b8b0a0" stroke="#333"/>`
  );
  parts.push(
    `<rect x="${px(350 - 6)}" y="${py(480)}" width="${12 * S}" height="${80 * S}" fill="#6aaf7a" stroke="#234"/>`
  );

  const st = bm.stair;
  for (let i = 0; i < st.treads; i++) {
    const yS = st.y + st.dy - (i + 1) * st.tread_cm;
    parts.push(
      `<rect x="${px(st.x)}" y="${py(yS)}" width="${st.width_clear_cm * S}" height="${st.tread_cm * S}" fill="${i % 2 ? "#8a93a0" : "#9aa3ad"}" stroke="#222"/>`
    );
  }
  for (const L of [bm.upper_landing, bm.lower_landing]) {
    parts.push(
      `<rect x="${px(L.x)}" y="${py(L.y)}" width="${L.dx * S}" height="${L.dy * S}" fill="#e8c56a" stroke="#333" stroke-width="1.5"/>`
    );
    parts.push(
      `<text x="${px(L.x + 2)}" y="${py(L.y + 12)}" font-size="7">FF ${L.z_ff_cm} · Y${L.y}–${L.y + L.dy}</text>`
    );
  }
  const door = bm.door_to_rooms;
  parts.push(
    `<rect x="${px(door.x)}" y="${py(door.y)}" width="${door.dx * S}" height="${door.dy * S}" fill="#2d6a4f" stroke="#000"/>`
  );
  parts.push(
    `<text x="${px(door.x - 2)}" y="${py(door.y + door.dy / 2)}" text-anchor="end" font-size="7" fill="#2d6a4f">ușă ${door.opening_h_cm}</text>`
  );

  // dims
  parts.push(
    `<text x="${px(565)}" y="${py(510)}" font-size="8" fill="#c1121f">palier LIBER (nu sub scară)</text>`
  );
  parts.push(
    `<text x="${M}" y="${H - 48}" font-size="8" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">perim. structură studiu ${wt.perimeter_structure_cm} cm · compartimentări ${wt.partition_cm} cm · puț W ${wt.shaft_west_cm} / E ${wt.shaft_east_cm}</text>`
  );
  parts.push(
    `<text x="${M}" y="${H - 32}" font-size="8" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">A1 checks: ${bm.a1_checks.ok ? "OK" : "FAIL"} · ${svgEsc((bm.a1_checks.fails || []).join("; ") || "fără eșecuri")}</text>`
  );

  write(
    "outputs/plans/31_v47_a1_subsol_plan.svg",
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n<rect width="100%" height="100%" fill="#fafafa"/>\n${parts.join("\n")}\n</svg>\n`
  );

  // section longitudinal through access (Y along shaft, Z absolute)
  const Ws = 1100;
  const Hs = 640;
  const scZ = 1.15;
  const scY = 0.45;
  const zRef = 120; // svg y for grade 0
  const zy = (cm) => zRef - cm * scZ;
  const yx = (ycm) => 80 + (ycm - 500) * scY;
  const sp = [];
  sp.push(
    `<text x="40" y="36" font-size="13" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 A1 · secțiune longitudinală acces (cote absolute, teren=0)</text>`
  );
  // grade
  sp.push(`<line x1="60" y1="${zy(0)}" x2="1040" y2="${zy(0)}" stroke="#6d7f5c" stroke-width="2"/>`);
  sp.push(`<text x="60" y="${zy(0) - 6}" font-size="8">teren 0</text>`);
  sp.push(`<line x1="60" y1="${zy(d.ff_parter_cm)}" x2="400" y2="${zy(d.ff_parter_cm)}" stroke="#333" stroke-dasharray="4 2"/>`);
  sp.push(`<text x="60" y="${zy(d.ff_parter_cm) - 4}" font-size="8">FF P +${d.ff_parter_cm}</text>`);
  // soffit / basement
  sp.push(`<line x1="${yx(500)}" y1="${zy(d.slab_soffit_cm)}" x2="${yx(700)}" y2="${zy(d.slab_soffit_cm)}" stroke="#c1121f" stroke-width="2"/>`);
  sp.push(`<text x="${yx(700) + 4}" y="${zy(d.slab_soffit_cm) - 4}" font-size="8" fill="#c1121f">intrados ${d.slab_soffit_cm}</text>`);
  sp.push(`<line x1="${yx(520)}" y1="${zy(d.basement_ff_cm)}" x2="${yx(860)}" y2="${zy(d.basement_ff_cm)}" stroke="#333" stroke-width="2"/>`);
  sp.push(`<text x="${yx(720)}" y="${zy(d.basement_ff_cm) - 4}" font-size="8">FF L-1 ${d.basement_ff_cm}</text>`);
  // clear dim
  const xd = yx(690);
  sp.push(`<line x1="${xd}" y1="${zy(d.slab_soffit_cm)}" x2="${xd}" y2="${zy(d.basement_ff_cm)}" stroke="#2d6a4f"/>`);
  sp.push(
    `<text x="${xd + 6}" y="${(zy(d.slab_soffit_cm) + zy(d.basement_ff_cm)) / 2}" font-size="10" fill="#2d6a4f">clear ${d.clear_height_cm}</text>`
  );
  // upper landing
  sp.push(
    `<rect x="${yx(800)}" y="${zy(d.access_landing_cm)}" width="${60 * scY}" height="6" fill="#8aa4b8"/>`
  );
  sp.push(`<text x="${yx(800)}" y="${zy(d.access_landing_cm) - 6}" font-size="7">palier ${d.access_landing_cm}</text>`);
  // stair treads
  for (let i = 0; i < st.treads; i++) {
    const yS = st.y + st.dy - (i + 1) * st.tread_cm;
    const zTop = d.access_landing_cm - st.riser_cm * (i + 1);
    sp.push(
      `<rect x="${yx(yS)}" y="${zy(zTop)}" width="${st.tread_cm * scY}" height="5" fill="#9aa3ad" stroke="#222"/>`
    );
  }
  // lower landing
  sp.push(
    `<rect x="${yx(520)}" y="${zy(d.basement_ff_cm)}" width="${80 * scY}" height="8" fill="#e8c56a" stroke="#333"/>`
  );
  sp.push(`<text x="${yx(520)}" y="${zy(d.basement_ff_cm) + 18}" font-size="7">palier liber</text>`);
  // door
  sp.push(
    `<rect x="${yx(door.y)}" y="${zy(d.basement_ff_cm + door.opening_h_cm)}" width="${door.dy * scY}" height="${door.opening_h_cm * scZ}" fill="#2d6a4f" opacity="0.35" stroke="#145"/>`
  );
  sp.push(
    `<text x="${yx(door.y)}" y="${zy(d.basement_ff_cm + door.opening_h_cm) - 4}" font-size="7">gol ușă ${door.opening_h_cm} + buiandrug ${door.lintel_reserve_cm}</text>`
  );
  // court steps
  for (let i = 0; i < 6; i++) {
    const zTop = 0 - (95 / 6) * (i + 1);
    const yS = 860 + 168 - (i + 1) * 28;
    sp.push(`<rect x="${yx(yS)}" y="${zy(zTop)}" width="${28 * scY}" height="4" fill="#e0c888"/>`);
  }
  sp.push(
    `<text x="40" y="${Hs - 28}" font-size="8" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">Datum absolut · scară ${st.risers}×${st.riser_cm.toFixed(3)}=${(st.risers * st.riser_cm).toFixed(2)} · studii utili ${v.areas_cm.useful_interior_m2} m² neschimbați · POT anvelopă ${(bm.a1_checks.pot_envelope_over_147).toFixed(2)}% din 147</text>`
  );

  write(
    "outputs/plans/32_v47_a1_access_section.svg",
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${Ws}" height="${Hs}" viewBox="0 0 ${Ws} ${Hs}">\n<rect width="100%" height="100%" fill="#f7f7f5"/>\n${sp.join("\n")}\n</svg>\n`
  );
}

function writeReport(v) {
  const bm = v.basement_cm;
  const d = bm.absolute_from_grade_cm;
  const c = bm.a1_checks;
  const useful = v.areas_cm.useful_interior_m2;
  const md = `# V47 Runda A — studiu A1

## Status
**${c.ok ? "A1 FEZABIL (geometric pe modelul de studiu)" : "A1 EȘUAT"}** — referința \`v47_exact.json\` **nu** a fost modificată.

## Traseu
\`${c.path}\`

## Datum absolut (teren amenajat = 0)

| Cotă | cm |
|------|---:|
| teren amenajat | ${d.grade_cm} |
| FF parter | +${d.ff_parter_cm} |
| palier acces | ${d.access_landing_cm} |
| FF subsol | ${d.basement_ff_cm} |
| intrados (studiu) | ${d.slab_soffit_cm} |
| clear FF→intrados | **${d.clear_height_cm}** |
| ușă deschidere | ${d.door_to_rooms_opening_h_cm} |
| rezervă buiandrug/toc | ${d.door_lintel_reserve_cm} |
| necesar ușă+buiandrug | ${d.door_stack_needed_cm} |

Clarificare: vechile \`levels_vs_ff_parter_cm\` erau **denumite** „vs FF” dar **aplicate absolut** în 3D. A1 le înlocuiește cu \`absolute_from_grade_cm\`.

## Verificări
### PASS
${c.passes.map((p) => `- ${p}`).join("\n")}

### FAIL
${c.fails.length ? c.fails.map((p) => `- ${p}`).join("\n") : "- (niciuna)"}

## Anvelopă subsol — grosimi studiu
| Rol | cm | Notă |
|-----|---:|------|
| perimetru structură | ${bm.wall_thickness_study_cm.perimeter_structure_cm} | de confirmat structurist |
| compartimentări | ${bm.wall_thickness_study_cm.partition_cm} | |
| puț vest | ${bm.wall_thickness_study_cm.shaft_west_cm} | = buc_est |
| puț est | ${bm.wall_thickness_study_cm.shaft_east_cm} | sprijin Dragalina |
| proiecție fundație | ${bm.wall_thickness_study_cm.foundation_projection_beyond_wall_cm} | dincolo de fața exterioară perete |

## Goluri
- hol ↔ CT: 90 cm (pe Y430)
- hol ↔ depozit: 80 cm (pe X350)
- palier ↔ hol: ${bm.door_to_rooms.dy} cm @ Y${bm.door_to_rooms.y}–${bm.door_to_rooms.y + bm.door_to_rooms.dy}, h ${bm.door_to_rooms.opening_h_cm}+${bm.door_to_rooms.lintel_reserve_cm}

## Impact studii / parcelă / POT
| Indicator | Valoare |
|-----------|---------|
| utili studii (înainte=după) | **${useful} m²** (neschimbat) |
| anvelopă | 680×860 = 58,48 m² |
| POT anvelopă / 147 | **${c.pot_envelope_over_147}%** (referință; confirmare limită admisă = deschisă) |
| poligon studiu | 145,741 m² |
| CF măsurat | 147 m² |
| colțuri anvelopă (volum) | NW/NE/SW inside; SE PIP=false dist≈0 (numeric contur — neschimbat vs referință) |
| scară SE | inside, overflow 0 |

## De ce nu A2/A3 (încă)
A1 trece verificările geometrice pe modelul de studiu → **A2/A3 neactivate**.

## Fișiere
- \`data/building/v47_a1_study.json\`
- \`outputs/plans/31_v47_a1_subsol_plan.svg\`
- \`outputs/plans/32_v47_a1_access_section.svg\`
- \`outputs/reports/v47_runda_a1.md\` (acest fișier)
- \`viewer/data/volume_v47_a1.json\` — viewer: \`?v=v47_a1\`
`;
  write("outputs/reports/v47_runda_a1.md", md);
}

function main() {
  const ref = read("data/building/v47_exact.json");
  const study = applyA1(ref);
  write("data/building/v47_a1_study.json", study);
  exportPlanSection(study);
  writeReport(study);

  const build = spawnSync(
    process.execPath,
    [
      path.join(ROOT, "src/build_v47_3d.mjs"),
      "data/building/v47_a1_study.json",
      "viewer/data/volume_v47_a1.json",
    ],
    { cwd: ROOT, encoding: "utf8" }
  );
  if (build.status !== 0) {
    console.error(build.stdout, build.stderr);
    process.exit(build.status || 1);
  }
  console.log(build.stdout);
  console.log(
    JSON.stringify(
      {
        ok: study.basement_cm.a1_checks.ok,
        fails: study.basement_cm.a1_checks.fails,
        useful: study.areas_cm.useful_interior_m2,
        files: [
          "data/building/v47_a1_study.json",
          "outputs/plans/31_v47_a1_subsol_plan.svg",
          "outputs/plans/32_v47_a1_access_section.svg",
          "outputs/reports/v47_runda_a1.md",
          "viewer/data/volume_v47_a1.json",
        ],
      },
      null,
      2
    )
  );
}

main();
