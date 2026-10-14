/**
 * Runda A — A1 corectat: puț coordonat cu palier Y520–600, gol ușă 70 cm,
 * clear prin intersecții reale, sandwich −30…+32, fundații + parcelă, arii recalculate.
 * NU modifică v47_exact.json.
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
const clone = (o) => JSON.parse(JSON.stringify(o));

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

/** Recalcul independent util studii (aceeași metodă ca export_v47_docs) */
function computeStudioAreas(v47) {
  const envCm2 = shoelaceCm2(v47.interior_polygon_cm.vertices);
  const ints = v47.walls_cm.filter((w) => w.kind === "int").map(clipIntWall);
  let gross = 0;
  for (const w of ints) gross += rectArea(w);
  let overlaps = 0;
  for (let i = 0; i < ints.length; i++) {
    for (let j = i + 1; j < ints.length; j++) overlaps += rectIntersectArea(ints[i], ints[j]);
  }
  const voidIds = new Set(["baie_usa", "dorm_usa"]);
  let voidA = 0;
  for (const o of v47.openings_cm || []) {
    if (!voidIds.has(o.id)) continue;
    for (const w of ints) voidA += rectIntersectArea(w, o);
  }
  const wallNet = gross - overlaps - voidA;
  const usefulGeom = (envCm2 - wallNet) / 10000;
  return {
    envelope_shoelace_m2: +(envCm2 / 10000).toFixed(6),
    walls_net_m2: +(wallNet / 10000).toFixed(6),
    useful_geometric_m2: +usefulGeom.toFixed(6),
    method: "shoelace(interior_polygon) − reuniune pereți int (−goluri baie/dorm)",
  };
}

function computeBasementAreas(bm) {
  const wt = bm.wall_thickness_study_cm;
  const rooms = {};
  let brut = 0;
  for (const r of bm.rooms) {
    const a = (r.dx * r.dy) / 10000;
    rooms[r.id] = { brut_m2: +a.toFixed(4), x: r.x, y: r.y, dx: r.dx, dy: r.dy };
    brut += a;
  }
  // util aproximativ: brut − jumătate din grosimea pereților pe laturi comune (studiu)
  const part = wt.partition_cm ?? 12.5;
  const perim = wt.perimeter_structure_cm ?? 30;
  const deduceri = {
    ct_sud_half: (505 * part) / 2 / 10000,
    dep_hol_half: (200 * part) / 2 / 10000,
    perim_note: "deduceri studiu pe fețe comune — nu certificat",
  };
  const utilEst =
    brut - deduceri.ct_sud_half - deduceri.dep_hol_half - (2 * (505 + 400) * perim) / 4 / 10000;
  return {
    rooms,
    total_brut_rooms_m2: +brut.toFixed(4),
    util_estimat_m2: +Math.max(0, utilEst).toFixed(4),
    wall_thickness_used_cm: { partition: part, perimeter: perim },
    note: "recalculate din geometria A1 finală; util = estimat pe fețe",
  };
}

/** Sandwich explicit −30 → +32 (62 cm) — modelat, nu doar FF−soffit */
function floorSandwich(d) {
  const layers = [
    { id: "intrados_finish", th_cm: 2, color: "#cfc8bc" },
    { id: "services_plenum", th_cm: 8, color: "#aeb8c4" },
    { id: "structural_slab", th_cm: 20, color: "#8b8680" },
    { id: "insulation", th_cm: 5, color: "#d4c49a" },
    { id: "heating_screed_finish", th_cm: 12, color: "#c4b8a0" },
    {
      id: "residual_level_to_ff",
      th_cm: 15,
      color: "#b0a898",
      note: "rest până la FF+32 — de confirmat structurist/finisaj",
    },
  ];
  let z = d.slab_soffit_cm;
  const out = [];
  for (const L of layers) {
    const z0 = z;
    const z1 = z + L.th_cm;
    out.push({ ...L, z0_cm: z0, z1_cm: z1 });
    z = z1;
  }
  const sum = layers.reduce((s, L) => s + L.th_cm, 0);
  const span = d.ff_parter_cm - d.slab_soffit_cm;
  return {
    layers: out,
    sum_th_cm: sum,
    span_soffit_to_ff_cm: span,
    closes_span: Math.abs(sum - span) < 0.01,
    note:
      sum === span
        ? `straturi sumă ${sum} cm = FF(${d.ff_parter_cm}) − intrados(${d.slab_soffit_cm})`
        : `straturi ${sum} ≠ span ${span} — inconsistent`,
  };
}

function absoluteDatum(ht) {
  const ffParter = (ht.entry_steps_to_terrace || 2) * (ht.entry_step_riser_cm || ht.riser_cm || 16);
  const access = -95;
  const basementFf = -250;
  const clearTarget = 220;
  const soffit = basementFf + clearTarget; // -30
  const d = {
    datum: "teren_amenajat_0",
    grade_cm: 0,
    ff_parter_cm: ffParter,
    access_landing_cm: access,
    basement_ff_cm: basementFf,
    slab_soffit_cm: soffit,
    clear_height_declared_cm: clearTarget,
    floor_slab_th_cm: ht.structural_slab_cm ?? 15,
    door_to_rooms_opening_h_cm: 200,
    door_lintel_reserve_cm: 15,
    door_stack_needed_cm: 215,
    note:
      "clear_declared = 220 e ȚINTĂ de studiu; validarea = intersecții cu scară etaj / grinzi / planșeu, nu FF−soffit.",
  };
  const sand = floorSandwich(d);
  d.floor_sandwich_cm = sand;
  return d;
}

/**
 * Clear pe traseu: z_obstacol − z_cale.
 * Obstacole: structură rampă2, intrados palier etaj, intrados placă, cer deschis.
 */
function computeHeadroomSamples(v) {
  const bm = v.basement_cm;
  const d = bm.absolute_from_grade_cm;
  const ht = v.heights_cm;
  const st = v.stair_cm;
  const r2 = st.ramp2;
  const riser = ht.riser_cm || 16;
  const tread = st.tread_cm || 30;
  const n180 = st.risers_flight_180;
  const n330 = st.risers_flight_330;
  const zParter = d.ff_parter_cm;
  const zPod = zParter + riser * n180;
  const rampStruct = st.ramp2_structure_cm || 20;
  const floorTh = ht.floor_buildup_below_ff_cm ?? 12;
  const zEtaj = zParter + (ht.ff_to_ff_cm ?? 288);
  const shaft = bm.open_shaft_cm;
  const bst = bm.stair;
  const x = bst.x + bst.dx / 2;

  function undersideRamp2(y) {
    const ySouthEdge = r2.y + r2.dy;
    const nTread = n330 - 1;
    for (let i = 0; i < nTread; i++) {
      const yS = ySouthEdge - (i + 1) * tread;
      const yN = yS + tread;
      if (y >= yS - 0.01 && y < yN + 0.01) {
        const zTop = zPod + riser * (i + 1);
        return {
          z_cm: zTop - rampStruct,
          element: `structura_r2_${i}`,
          z_top_tread_cm: zTop,
        };
      }
    }
    return null;
  }

  function walkZ(y) {
    if (y >= bm.upper_landing.y) return d.access_landing_cm;
    if (y >= bst.y && y < bst.y + bst.dy) {
      const fromSouth = bst.y + bst.dy - y;
      const i = Math.min(bst.treads, Math.max(1, Math.ceil(fromSouth / bst.tread_cm)));
      return d.access_landing_cm - bst.riser_cm * i;
    }
    return d.basement_ff_cm;
  }

  const samples = [];
  for (let y = shaft.y; y <= 860; y += 5) {
    const zWalk = walkZ(y);
    const inShaft =
      y >= shaft.y && y <= shaft.y + shaft.dy && x >= shaft.x && x <= shaft.x + shaft.dx;
    let zObs = null;
    let element = null;
    let open = false;

    const underR2 = y >= r2.y && y <= r2.y + r2.dy ? undersideRamp2(y) : null;
    if (underR2) {
      zObs = underR2.z_cm;
      element = underR2.element;
    } else if (inShaft && y < r2.y) {
      // puț extins sub palierul superior etaj
      zObs = zEtaj - floorTh;
      element = "intrados_palier_superior_etaj";
    } else if (!inShaft) {
      zObs = d.slab_soffit_cm;
      element = "intrados_placa_parter_sandwich";
    } else {
      open = true;
      element = "cer_deschis_puț";
    }

    const clear = open ? null : +(zObs - zWalk).toFixed(2);
    samples.push({
      x_cm: +x.toFixed(2),
      y_cm: y,
      z_walk_cm: +zWalk.toFixed(2),
      z_obstacle_cm: zObs,
      clear_cm: clear,
      element,
      open,
      kind: "access_path",
    });
  }

  // camere (sub placă)
  for (const r of bm.rooms) {
    const cx = r.x + r.dx / 2;
    const cy = r.y + r.dy / 2;
    samples.push({
      x_cm: cx,
      y_cm: cy,
      z_walk_cm: d.basement_ff_cm,
      z_obstacle_cm: d.slab_soffit_cm,
      clear_cm: +(d.slab_soffit_cm - d.basement_ff_cm).toFixed(2),
      element: `intrados_placa_parter@${r.id}`,
      open: false,
      kind: "room",
    });
  }

  const finite = samples.filter((s) => s.clear_cm != null && Number.isFinite(s.clear_cm));
  finite.sort((a, b) => a.clear_cm - b.clear_cm);
  const min = finite[0] || null;
  const pathOnly = samples.filter(
    (s) => s.kind === "access_path" && s.clear_cm != null && Number.isFinite(s.clear_cm)
  );
  pathOnly.sort((a, b) => a.clear_cm - b.clear_cm);
  const minPath = pathOnly[0] || null;
  return {
    samples_count: samples.length,
    samples_path: samples.filter((s) => s.y_cm >= shaft.y && s.y_cm <= 860),
    min_clear_cm: min?.clear_cm ?? null,
    min_at: min
      ? {
          x_cm: min.x_cm,
          y_cm: min.y_cm,
          element: min.element,
          z_walk_cm: min.z_walk_cm,
          z_obstacle_cm: min.z_obstacle_cm,
        }
      : null,
    min_on_access_path_cm: minPath?.clear_cm ?? null,
    min_on_access_path_at: minPath
      ? {
          x_cm: minPath.x_cm,
          y_cm: minPath.y_cm,
          element: minPath.element,
          z_walk_cm: minPath.z_walk_cm,
          z_obstacle_cm: minPath.z_obstacle_cm,
        }
      : null,
    door_stack_vs_clear_at_door: null, // filled below
  };
}

/** Transport echipamente: clear efectiv după toc ≥90; gol montaj = clear + 2×toc */
function transportAudit(bm) {
  const jamb = bm.transport_cm?.frame_jamb_each_side_cm ?? 5;
  const clearMin = bm.transport_cm?.clear_effective_min_cm ?? 90;
  const roughNeeded = clearMin + 2 * jamb;
  const g = bm.transport_cm?.gabarit_cm;
  const low = bm.lower_landing;
  const st = bm.stair;
  const door = bm.door_to_rooms;
  const landClearX = st.width_clear_cm;
  const landClearY = low.dy;
  const diag = Math.hypot(g.length_along_approach_cm, g.width_across_cm);

  function doorClear(roughAlong) {
    return roughAlong - 2 * jamb;
  }

  const doors = [
    {
      id: door.id,
      role: "scară→hol",
      rough_cm: door.dy,
      clear_after_frame_cm: doorClear(door.dy),
      along: "Y",
    },
    ...bm.internal_doors.map((d) => ({
      id: d.id,
      role: d.id === "usa_hol_ct" ? "hol→CT" : "hol→depozit",
      rough_cm: d.id === "usa_hol_ct" ? d.dx : d.dy,
      clear_after_frame_cm: doorClear(d.id === "usa_hol_ct" ? d.dx : d.dy),
      along: d.id === "usa_hol_ct" ? "X" : "Y",
    })),
  ];

  const fails = [];
  const passes = [];

  // scară
  if (st.width_clear_cm + 0.01 < clearMin)
    fails.push(`scară clear ${st.width_clear_cm} < ${clearMin}`);
  else passes.push(`scară clear ${st.width_clear_cm} ≥ ${clearMin}`);

  for (const d of doors) {
    if (d.rough_cm + 0.01 < roughNeeded)
      fails.push(`${d.id} gol montaj ${d.rough_cm} < necesar ${roughNeeded} (pt clear ${clearMin})`);
    else if (d.clear_after_frame_cm + 0.01 < clearMin)
      fails.push(`${d.id} clear după toc ${d.clear_after_frame_cm} < ${clearMin}`);
    else
      passes.push(
        `${d.id} (${d.role}): gol ${d.rough_cm} → clear ${d.clear_after_frame_cm} după toc ${jamb}+${jamb}`
      );
  }

  // gabarit trece prin clear-uri
  const maxAcross = Math.max(g.width_across_cm, Math.min(g.length_along_approach_cm, g.width_across_cm));
  if (g.width_across_cm > clearMin + 0.01)
    fails.push(`gabarit lățime ${g.width_across_cm} > clear min ${clearMin}`);
  else passes.push(`gabarit lățime ${g.width_across_cm} ≤ clear ${clearMin}`);

  // Întoarcere pe palier: de pe scară (N) către ușă vest
  // 1) rotație liberă în dreptunghiul liber: diagonală ≤ min(Dx,Dy)
  const freeRotate = diag <= Math.min(landClearX, landClearY) + 0.01;
  // 2) pivot în golul ușii: dacă clear_ușă ≥ lungime, adâncime palier ≥ lățime + marjă manevră
  const doorClearY = doorClear(door.dy);
  const maneuverMargin = bm.transport_cm?.turn_maneuver_margin_cm ?? 15;
  const pivotDepthNeeded =
    doorClearY + 0.01 >= g.length_along_approach_cm
      ? g.width_across_cm + maneuverMargin
      : g.length_along_approach_cm - doorClearY + g.width_across_cm + maneuverMargin;
  const pivotOk = landClearY + 0.01 >= pivotDepthNeeded;

  const turn = {
    landing_clear_x_cm: landClearX,
    landing_clear_y_cm: landClearY,
    gabarit_diagonal_cm: +diag.toFixed(2),
    free_rotation_ok: freeRotate,
    free_rotation_rule: `diag(${g.length_along_approach_cm}×${g.width_across_cm}=${diag.toFixed(1)}) ≤ min(${landClearX},${landClearY})`,
    pivot_into_door_ok: pivotOk,
    pivot_depth_needed_cm: +pivotDepthNeeded.toFixed(2),
    pivot_rule:
      doorClearY >= g.length_along_approach_cm
        ? `clear_ușă ${doorClearY} ≥ L ${g.length_along_approach_cm} → Dy ≥ W+marjă = ${g.width_across_cm}+${maneuverMargin}`
        : `clear_ușă ${doorClearY} < L → Dy ≥ L−C+W+marjă = ${pivotDepthNeeded.toFixed(1)}`,
    note_80cm_legacy:
      "Palierul vechi dy=80: pivot necesita ≥ W+15; cu W=70 → 85 > 80 → EȘEC întoarcere (chiar dacă golul trecea obiectul).",
  };

  if (!freeRotate && !pivotOk) {
    fails.push(
      `întoarcere pe palier EȘUATĂ: free_rot=${freeRotate}, pivot=${pivotOk} (Dy ${landClearY} < necesar pivot ${pivotDepthNeeded.toFixed(1)})`
    );
  } else if (pivotOk) {
    passes.push(
      `întoarcere pivot scară→ușă OK: Dy ${landClearY} ≥ ${pivotDepthNeeded.toFixed(1)} (gabarit ${g.length_along_approach_cm}×${g.width_across_cm})`
    );
    if (!freeRotate)
      passes.push(
        `rotație liberă NU (diag ${diag.toFixed(1)} > min latură); acceptat doar pivot în gol`
      );
  } else {
    passes.push(`rotație liberă OK pe palier ${landClearX}×${landClearY}`);
  }

  // hol clear toward CT / dep (bandă)
  const hol = bm.rooms.find((r) => r.id === "hol_subsol");
  const holClearX = hol.dx; // până la fața zidului
  if (holClearX < clearMin) fails.push(`hol lățime ${holClearX} < ${clearMin}`);
  else passes.push(`hol lățime ${holClearX} ≥ ${clearMin} (către CT/depozit)`);

  return {
    clear_effective_min_cm: clearMin,
    frame_jamb_each_side_cm: jamb,
    rough_opening_needed_cm: roughNeeded,
    gabarit_cm: g,
    doors,
    turn,
    ok: fails.length === 0,
    passes,
    fails,
  };
}

function applyA1(v47) {
  const out = clone(v47);
  const d = absoluteDatum(out.heights_cm || {});
  out.meta = out.meta || {};
  out.meta.study_variant = "A1";
  out.meta.rev_note_a1 =
    "A1 transport: clear 90 după toc; goluri 100; palier ≥ pivot; gabarit explicit";

  const riser = 155 / 9;
  const tread = 25;
  const treads = 8;
  const risers = 9;
  const ySouth = 800;
  const yLast = ySouth - treads * tread; // 600
  // toc 5+5 → clear 90 cere gol montaj 100; palier trebuie ≥ gol + pivot (W+15)
  const jamb = 5;
  const clearEff = 90;
  const roughDoor = clearEff + 2 * jamb; // 100
  const gabaritW = 70; // baterie / modul CT
  const gabaritL = 80;
  const turnMargin = 15;
  const pivotNeed = gabaritW + turnMargin; // 85 când clear_ușă ≥ L
  const landDy = Math.max(roughDoor, pivotNeed, 110); // 110: gol 100 + rezervă N + pivot
  const landY0 = yLast - landDy; // 490
  const doorDy = roughDoor; // 100
  const doorY0 = yLast - doorDy; // 500 — pe tot golul până la baza scării
  const shaftEast = 15;
  const shaftWest = 30;
  const clearDx = 680 - shaftEast - 565; // 100
  const shaftNorth = 12.5;

  const treadZ = [];
  for (let i = 0; i < treads; i++) treadZ.push(d.access_landing_cm - riser * (i + 1));

  out.basement_cm = {
    ...out.basement_cm,
    status: "studiu_A1_transport",
    concept_note:
      `A1 transport: palier Y${landY0}–${yLast} (${landDy} cm); gol scară→hol ${roughDoor}→clear ${clearEff}; CT/dep idem.`,
    transport_cm: {
      clear_effective_min_cm: clearEff,
      frame_jamb_each_side_cm: jamb,
      rough_opening_needed_cm: roughDoor,
      turn_maneuver_margin_cm: turnMargin,
      gabarit_cm: {
        id: "gabarit_transport_beci",
        length_along_approach_cm: gabaritL,
        width_across_cm: gabaritW,
        height_cm: 180,
        based_on: "baterie 70×25×110 + marjă manipulare; L=80 pe direcția de coborâre",
        note: "gabarit EXPLICIT de dimensionare traseu — nu doar „încape prin ușă”",
      },
      path: "curte→scară L-1→palier→ușă(clear90)→hol→usa_hol_ct|usa_hol_dep",
    },
    absolute_from_grade_cm: {
      ...d,
      clear_height_cm: d.clear_height_declared_cm, // alias pentru build
    },
    floor_sandwich_cm: d.floor_sandwich_cm.layers,
    levels_vs_ff_parter_cm: {
      courtyard_general: 0,
      access_landing: d.access_landing_cm,
      basement_ff: d.basement_ff_cm,
      slab_soffit_cm: d.slab_soffit_cm,
      clear_height_cm: d.clear_height_declared_cm,
      clear_height_formula: `ȚINTĂ: soffit(${d.slab_soffit_cm}) − FF(${d.basement_ff_cm}) = ${d.clear_height_declared_cm}; validare = headroom samples`,
      floor_slab_th_cm: d.floor_slab_th_cm,
      status: "studiu_A1_absolute",
      note: "VALORI ABSOLUTE față de teren=0",
    },
    wall_thickness_study_cm: {
      perimeter_structure_cm: 30,
      perimeter_note: "studiu — de confirmat structurist",
      partition_cm: 12.5,
      shaft_west_cm: shaftWest,
      shaft_east_cm: shaftEast,
      shaft_east_note: "sprijin Dragalina — JSON 15 cm",
      shaft_north_cm: shaftNorth,
      foundation_projection_beyond_wall_cm: 15,
      foundation_note: "proiecție 15 cm; verificare parcelă pe colțuri transformate",
    },
    ramp2_ref: { x: 565, y: 590, dx: 115, dy: 270 },
    open_shaft_cm: {
      x: 565,
      y: landY0,
      dx: 115,
      dy: 860 - landY0,
      note: `puț deschis coordonat cu palier jos Y${landY0}–860`,
    },
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
    },
    upper_landing: {
      x: 565,
      y: 800,
      dx: 115,
      dy: 60,
      z_ff_cm: d.access_landing_cm,
      status: "studiu_A1",
    },
    stair: {
      align: "along_ramp2",
      inside_ramp2_band: true,
      x: 565,
      y: yLast,
      dx: clearDx,
      dy: treads * tread,
      width_clear_cm: clearDx,
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
      note: `clear ${clearDx} cm (est ${shaftEast}); Y${yLast}–${ySouth}`,
    },
    lower_landing: {
      x: 565,
      y: landY0,
      dx: 115,
      dy: landDy,
      z_ff_cm: d.basement_ff_cm,
      status: "studiu_A1_transport",
      note: `Y${landY0}–${yLast} (${landDy} cm) — extins față de 80: gol 100 + pivot W+${turnMargin}; zid N @ Y${landY0 - shaftNorth}`,
    },
    door_to_rooms: {
      id: "usa_subsol_camere",
      x: 535,
      y: doorY0,
      dx: shaftWest,
      dy: doorDy,
      z_sill_cm: d.basement_ff_cm,
      opening_h_cm: d.door_to_rooms_opening_h_cm,
      lintel_reserve_cm: d.door_lintel_reserve_cm,
      frame_jamb_each_side_cm: jamb,
      clear_after_frame_cm: clearEff,
      rough_opening_cm: roughDoor,
      connects: ["lower_landing", "hol_subsol"],
      status: "studiu_A1_transport",
      note: `gol montaj ${roughDoor} cm Y${doorY0}–${doorY0 + doorDy} → clear ${clearEff} după toc ${jamb}+${jamb}`,
    },
    internal_doors: [
      {
        id: "usa_hol_ct",
        wall: "subsol_zid_ct_sud",
        x: 375,
        y: 430 - 6.25,
        dx: roughDoor,
        dy: 12.5,
        opening_h_cm: 200,
        lintel_reserve_cm: 15,
        frame_jamb_each_side_cm: jamb,
        clear_after_frame_cm: clearEff,
        rough_opening_cm: roughDoor,
        connects: ["hol_subsol", "camera_tehnica"],
        note: `gol montaj ${roughDoor} → clear ${clearEff} către CT`,
      },
      {
        id: "usa_hol_dep",
        wall: "subsol_zid_dep_hol",
        x: 350 - 6.25,
        y: 470,
        dx: 12.5,
        dy: roughDoor,
        opening_h_cm: 200,
        lintel_reserve_cm: 15,
        frame_jamb_each_side_cm: jamb,
        clear_after_frame_cm: clearEff,
        rough_opening_cm: roughDoor,
        connects: ["hol_subsol", "depozit_subsol"],
        note: `gol montaj ${roughDoor} → clear ${clearEff} către depozit`,
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
      },
      {
        id: "depozit_subsol",
        x: 30,
        y: 430,
        dx: 320,
        dy: 200,
        z_ff_cm: d.basement_ff_cm,
        area_m2: (320 * 200) / 10000,
      },
      {
        id: "hol_subsol",
        x: 350,
        y: 430,
        dx: 185,
        dy: 255,
        z_ff_cm: d.basement_ff_cm,
        area_m2: (185 * 255) / 10000,
        note: `față E = zid gros puț X535; ușă Y${doorY0}–${doorY0 + doorDy}`,
      },
    ],
    equipment: out.basement_cm.equipment,
    wet_reserves: out.basement_cm.wet_reserves,
    structure_note: out.basement_cm.structure_note,
    open_shaft_under_ramp2: true,
    english_court_open_void: true,
    shaft_walls: true,
    a1_checks: null,
  };

  // arii
  const studio = computeStudioAreas(out);
  const refUseful = v47.areas_cm?.useful_interior_m2 ?? null;
  out.areas_cm = {
    ...out.areas_cm,
    useful_interior_m2: studio.useful_geometric_m2,
    useful_geometric_m2: studio.useful_geometric_m2,
    useful_recalc_a1: studio,
    useful_ref_copied_was: refUseful,
    useful_delta_vs_ref_m2:
      refUseful != null ? +(studio.useful_geometric_m2 - refUseful).toFixed(6) : null,
  };
  out.basement_cm.areas = computeBasementAreas(out.basement_cm);
  out.basement_cm.transport_audit = transportAudit(out.basement_cm);

  const head = computeHeadroomSamples(out);
  const door = out.basement_cm.door_to_rooms;
  const clearAtDoorSample = head.samples_path.find(
    (s) => s.y_cm >= door.y && s.y_cm <= door.y + door.dy && !s.open
  );
  const clearAtDoor =
    clearAtDoorSample?.clear_cm ??
    head.samples_path.find((s) => s.y_cm === 560)?.clear_cm ??
    null;
  head.door_stack_vs_clear_at_door = {
    opening_plus_lintel_cm: door.opening_h_cm + door.lintel_reserve_cm,
    clear_at_door_zone_cm: clearAtDoor,
    ok:
      clearAtDoor != null &&
      door.opening_h_cm + door.lintel_reserve_cm <= clearAtDoor + 0.01,
  };
  out.basement_cm.headroom_audit = head;

  out.basement_cm.a1_checks = verifyA1(out, null);
  return out;
}

function verifyA1(v, volume) {
  const bm = v.basement_cm;
  const d = bm.absolute_from_grade_cm;
  const st = bm.stair;
  const low = bm.lower_landing;
  const up = bm.upper_landing;
  const door = bm.door_to_rooms;
  const fails = [];
  const passes = [];
  const notes = [];

  const ySouth = st.y + st.dy;
  const yLast = st.y;
  if (Math.abs(up.y + up.dy - 860) > 0.01) fails.push(`upper nu ajunge la Y860 (got ${up.y + up.dy})`);
  else passes.push("upper_landing → Y860");

  if (Math.abs(up.y - ySouth) > 0.01) fails.push(`upper.y ${up.y} ≠ stair south ${ySouth}`);
  else passes.push("upper abut stair top");

  if (low.y + low.dy > yLast + 0.01) fails.push("palier jos se suprapune pe scară");
  else passes.push("palier jos N de ultima treaptă");

  if (door.y < low.y || door.y + door.dy > low.y + low.dy) fails.push("ușa nu stă pe palier");
  else passes.push(`ușă pe palier Y${door.y}–${door.y + door.dy} (dy=${door.dy})`);

  const hol = bm.rooms.find((r) => r.id === "hol_subsol");
  if (door.y < hol.y || door.y + door.dy > hol.y + hol.dy) fails.push("ușa nu întâlnește holul pe Y");
  else passes.push("ușă ∩ hol pe Y");

  // puț coordonat
  const shaft = bm.open_shaft_cm;
  if (Math.abs(shaft.y - low.y) > 0.01) fails.push(`open_shaft.y ${shaft.y} ≠ lower_landing.y ${low.y}`);
  else passes.push(`puț deschis începe la Y${shaft.y} (= palier)`);

  const northWallY1 = low.y;
  const northWallY0 = low.y - (bm.wall_thickness_study_cm.shaft_north_cm ?? 12.5);
  if (northWallY1 > low.y + 0.01) fails.push("zid N invadează palierul");
  else passes.push(`zid N @ Y${northWallY0}–${northWallY1} (N de palier, nu Y590)`);

  // est 15
  if (bm.wall_thickness_study_cm.shaft_east_cm !== 15) fails.push("shaft_east ≠ 15");
  else passes.push("zid EST puț = 15 cm (JSON)");

  // sandwich
  const sand = d.floor_sandwich_cm;
  if (!sand?.closes_span) fails.push(`sandwich nu închide span −30…+32 (sum=${sand?.sum_th_cm})`);
  else
    passes.push(
      `sandwich modelat: ${sand.sum_th_cm} cm = FF(+${d.ff_parter_cm}) − intrados(${d.slab_soffit_cm})`
    );
  notes.push(
    "clear_declared 220 NU e validat doar prin scădere; vezi headroom_audit.min_clear_cm"
  );

  // headroom real
  const hr = bm.headroom_audit;
  if (!hr?.min_clear_cm && hr?.min_clear_cm !== 0) fails.push("lipsește calcul headroom");
  else {
    passes.push(
      `gabarit minim global = ${hr.min_clear_cm} cm @ Y${hr.min_at.y_cm} X${hr.min_at.x_cm} (${hr.min_at.element})`
    );
    passes.push(
      `gabarit minim pe traseu acces = ${hr.min_on_access_path_cm} cm @ Y${hr.min_on_access_path_at?.y_cm} (${hr.min_on_access_path_at?.element})`
    );
    if (hr.min_clear_cm < 200)
      fails.push(`gabarit minim ${hr.min_clear_cm} < 200 cm`);
    if (hr.door_stack_vs_clear_at_door && !hr.door_stack_vs_clear_at_door.ok) {
      fails.push(
        `ușă+buiandrug ${hr.door_stack_vs_clear_at_door.opening_plus_lintel_cm} > clear zonă ușă ${hr.door_stack_vs_clear_at_door.clear_at_door_zone_cm}`
      );
    } else if (hr.door_stack_vs_clear_at_door) {
      passes.push(
        `ușă+buiandrug ${hr.door_stack_vs_clear_at_door.opening_plus_lintel_cm} ≤ clear zonă ușă ${hr.door_stack_vs_clear_at_door.clear_at_door_zone_cm}`
      );
    }
  }

  // transport echipamente
  const tr = bm.transport_audit;
  if (!tr) fails.push("lipsește transport_audit");
  else {
    for (const p of tr.passes) passes.push(`transport: ${p}`);
    for (const f of tr.fails) fails.push(`transport: ${f}`);
    notes.push(
      `gabarit ${tr.gabarit_cm.length_along_approach_cm}×${tr.gabarit_cm.width_across_cm}×${tr.gabarit_cm.height_cm}; ` +
        `întoarcere: free=${tr.turn.free_rotation_ok} pivot=${tr.turn.pivot_into_door_ok} ` +
        `(Dy ${tr.turn.landing_clear_y_cm}, necesar pivot ${tr.turn.pivot_depth_needed_cm})`
    );
    notes.push(tr.turn.note_80cm_legacy);
  }

  // arii recalculate
  const studio = v.areas_cm?.useful_recalc_a1;
  if (!studio) fails.push("lipsește recalcul util studii");
  else {
    passes.push(
      `util studii recalculat ${studio.useful_geometric_m2} m² (Δ vs ref ${v.areas_cm.useful_delta_vs_ref_m2})`
    );
    if (Math.abs(v.areas_cm.useful_delta_vs_ref_m2 || 0) > 0.05)
      fails.push("util studii diferă >5 cm² față de referință — anvelopă P/E modificată?");
  }
  const ba = bm.areas;
  passes.push(`arii subsol brut recalculate ${ba.total_brut_rooms_m2} m²`);

  // envelope P/E
  if (v.envelope_cm.ew !== 680 || v.envelope_cm.ns !== 860) fails.push("anvelopă supraterană modificată");
  else passes.push("anvelopă 680×860 păstrată");

  // fundație + parcelă din volum
  if (volume?.site?.foundation_corners) {
    const clip = volume.site.foundation_clip_cm;
    const badTarget = (volume.site.foundation_corners_target_15 || []).filter((c) => !c.inside);
    if (badTarget.length) {
      notes.push(
        `țintă fundație uniformă ${volume.site.foundation_projection_cm} cm EȘUEAZĂ PIP: ${badTarget
          .map((b) => `${b.id} +${b.overflow_m}m`)
          .join("; ")}`
      );
    } else {
      passes.push(`țintă fundație ±${volume.site.foundation_projection_cm} cm: toate punctele în parcelă`);
    }
    const numericEdge = volume.site.foundation_corners.filter(
      (c) => !c.inside && c.overflow_m < 0.02
    );
    const bad = volume.site.foundation_corners.filter((c) => !c.inside && c.overflow_m >= 0.02);
    if (bad.length) {
      fails.push(
        `fundație clipată în afara parcelei: ${bad.map((b) => `${b.id} overflow ${b.overflow_m}m`).join("; ")}`
      );
    } else {
      passes.push(
        `fundație MODELATĂ (clip N/E/S/W=${clip?.N}/${clip?.E}/${clip?.S}/${clip?.W} cm): fără overflow ≥2 cm`
      );
      if (numericEdge.length) {
        notes.push(
          `PIP=false dist≈0 pe ${numericEdge.map((n) => n.id).join(", ")} — același artefact numeric ca SE anvelopă`
        );
      }
      if (
        clip &&
        (clip.E < clip.target_cm ||
          clip.N < clip.target_cm ||
          clip.S < clip.target_cm ||
          clip.W < clip.target_cm)
      ) {
        notes.push(
          `proiecție redusă față de ținta ${clip.target_cm} cm (est/Dragalina tipic limitat de contur CF)`
        );
      }
    }
    const se = volume.site.corner_overflow_m?.SE;
    if (se && !se.inside && se.dist_m < 0.02) {
      notes.push("colț SE anvelopă: PIP=false dist≈0 (numeric contur) — neschimbat vs referință");
    }
  } else {
    notes.push("verificare parcelă fundație: după build volum");
  }

  const potRef = (680 * 860) / 10000 / 147;
  return {
    ok: fails.length === 0,
    passes,
    fails,
    notes,
    pot_envelope_over_147: +(potRef * 100).toFixed(2),
    pot_note: "anvelopă/147 — confirmare limită admisă deschisă",
    headroom_min: hr?.min_at || null,
    path: "curte(0) → trepte → palier−95(Y800–860) → scară(Y600–800↓N) → palier liber−250 → ușă (clear 90) → hol → CT/dep",
    transport: tr
      ? {
          ok: tr.ok,
          clear_min: tr.clear_effective_min_cm,
          rough: tr.rough_opening_needed_cm,
          gabarit: tr.gabarit_cm,
          turn: tr.turn,
        }
      : null,
  };
}

function svgEsc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function exportPlan(v) {
  const bm = v.basement_cm;
  const wt = bm.wall_thickness_study_cm;
  const S = 0.55;
  const M = 70;
  const W = M * 2 + 720 * S + 220;
  const H = M * 2 + 920 * S + 140;
  const px = (x) => M + x * S;
  const py = (y) => M + y * S;
  const parts = [];
  parts.push(
    `<text x="${W / 2}" y="28" text-anchor="middle" font-size="13" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 A1 · plan subsol + traseu transport</text>`
  );
  parts.push(
    `<text x="${W / 2}" y="44" text-anchor="middle" font-size="8" fill="#b08900">${svgEsc(bm.a1_checks.path)}</text>`
  );
  parts.push(
    `<rect x="${px(0)}" y="${py(0)}" width="${680 * S}" height="${860 * S}" fill="none" stroke="#999" stroke-dasharray="4 3"/>`
  );
  // fundație
  const fp = wt.foundation_projection_beyond_wall_cm;
  parts.push(
    `<rect x="${px(-fp)}" y="${py(-fp)}" width="${(680 + 2 * fp) * S}" height="${(860 + 2 * fp) * S}" fill="none" stroke="#6e6a62" stroke-dasharray="2 2"/>`
  );
  for (const r of bm.rooms) {
    const fill =
      r.id === "camera_tehnica" ? "#c5d5e0" : r.id === "depozit_subsol" ? "#d9cbb8" : "#e8d5a3";
    parts.push(
      `<rect x="${px(r.x)}" y="${py(r.y)}" width="${r.dx * S}" height="${r.dy * S}" fill="${fill}" stroke="#1d3557"/>`
    );
    parts.push(
      `<text x="${px(r.x + r.dx / 2)}" y="${py(r.y + r.dy / 2)}" text-anchor="middle" font-size="9">${r.id}</text>`
    );
    parts.push(
      `<text x="${px(r.x + 4)}" y="${py(r.y + 14)}" font-size="7">${bm.areas.rooms[r.id].brut_m2} m² brut</text>`
    );
  }
  // zid N puț
  const nY0 = bm.lower_landing.y - wt.shaft_north_cm;
  parts.push(
    `<rect x="${px(535)}" y="${py(nY0)}" width="${145 * S}" height="${wt.shaft_north_cm * S}" fill="#a89880" stroke="#333"/>`
  );
  parts.push(
    `<text x="${px(600)}" y="${py(nY0 - 4)}" font-size="7" fill="#c1121f">zid N @ Y${nY0}–${bm.lower_landing.y}</text>`
  );
  // est / vest puț (de la palier)
  const shY0 = bm.open_shaft_cm.y;
  const shDy = bm.open_shaft_cm.dy;
  parts.push(
    `<rect x="${px(535)}" y="${py(shY0)}" width="${wt.shaft_west_cm * S}" height="${shDy * S}" fill="#b8b0a0" opacity="0.55" stroke="#333"/>`
  );
  parts.push(
    `<rect x="${px(680 - wt.shaft_east_cm)}" y="${py(shY0)}" width="${wt.shaft_east_cm * S}" height="${shDy * S}" fill="#b8b0a0" opacity="0.55" stroke="#333"/>`
  );
  // gol ușă scară→hol
  const door = bm.door_to_rooms;
  parts.push(
    `<rect x="${px(door.x)}" y="${py(door.y)}" width="${door.dx * S}" height="${door.dy * S}" fill="#2d6a4f" stroke="#000"/>`
  );
  parts.push(
    `<text x="${px(door.x - 2)}" y="${py(door.y + door.dy / 2)}" text-anchor="end" font-size="7" fill="#2d6a4f">gol ${door.rough_opening_cm}→clear ${door.clear_after_frame_cm}</text>`
  );
  // gabarit pe palier (întoarcere)
  const g = bm.transport_cm.gabarit_cm;
  const gx = 565 + (bm.stair.width_clear_cm - g.width_across_cm) / 2;
  const gy = bm.lower_landing.y + 8;
  parts.push(
    `<rect x="${px(gx)}" y="${py(gy)}" width="${g.width_across_cm * S}" height="${g.length_along_approach_cm * S}" fill="#e63946" fill-opacity="0.25" stroke="#c1121f" stroke-dasharray="3 2"/>`
  );
  parts.push(
    `<text x="${px(gx)}" y="${py(gy) - 3}" font-size="7" fill="#c1121f">gabarit ${g.length_along_approach_cm}×${g.width_across_cm} · pivot ${bm.transport_audit?.turn.pivot_into_door_ok ? "OK" : "FAIL"}</text>`
  );
  // goluri interne din JSON
  for (const id of bm.internal_doors) {
    parts.push(
      `<rect x="${px(id.x)}" y="${py(id.y)}" width="${id.dx * S}" height="${id.dy * S}" fill="#6aaf7a" stroke="#234"/>`
    );
    parts.push(
      `<text x="${px(id.x + id.dx / 2)}" y="${py(id.y) - 2}" text-anchor="middle" font-size="6" fill="#1b4332">${id.id} clear ${id.clear_after_frame_cm}</text>`
    );
  }
  const st = bm.stair;
  for (let i = 0; i < st.treads; i++) {
    const yS = st.y + st.dy - (i + 1) * st.tread_cm;
    parts.push(
      `<rect x="${px(st.x)}" y="${py(yS)}" width="${st.width_clear_cm * S}" height="${st.tread_cm * S}" fill="${i % 2 ? "#8a93a0" : "#9aa3ad"}" stroke="#222"/>`
    );
  }
  for (const L of [bm.upper_landing, bm.lower_landing]) {
    parts.push(
      `<rect x="${px(L.x)}" y="${py(L.y)}" width="${L.dx * S}" height="${L.dy * S}" fill="#e8c56a" stroke="#333" stroke-width="1.5" fill-opacity="0.55"/>`
    );
  }
  const hr = bm.headroom_audit?.min_at;
  if (hr) {
    parts.push(
      `<circle cx="${px(hr.x_cm)}" cy="${py(hr.y_cm)}" r="4" fill="#c1121f"/>`
    );
    parts.push(
      `<text x="${px(hr.x_cm + 8)}" y="${py(hr.y_cm)}" font-size="7" fill="#c1121f">min clear ${bm.headroom_audit.min_clear_cm} cm</text>`
    );
  }
  parts.push(
    `<text x="${M}" y="${H - 40}" font-size="8">perim ${wt.perimeter_structure_cm} · part ${wt.partition_cm} · puț W/E/N ${wt.shaft_west_cm}/${wt.shaft_east_cm}/${wt.shaft_north_cm} · fundație +${fp}</text>`
  );
  parts.push(
    `<text x="${M}" y="${H - 24}" font-size="8">A1: ${bm.a1_checks.ok ? "OK" : "FAIL"} · ${svgEsc((bm.a1_checks.fails || []).join("; ") || "fără eșecuri")}</text>`
  );
  write(
    "outputs/plans/31_v47_a1_subsol_plan.svg",
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n<rect width="100%" height="100%" fill="#fafafa"/>\n${parts.join("\n")}\n</svg>\n`
  );
}

/** Secțiune din geometria modelului (scară etaj + sandwich + acces subsol) */
function exportSectionFromModel(v, volume) {
  const bm = v.basement_cm;
  const d = bm.absolute_from_grade_cm;
  const ht = v.heights_cm;
  const st = v.stair_cm;
  const Ws = 1200;
  const Hs = 720;
  const scZ = 1.05;
  const scY = 0.42;
  const zRef = 160;
  const zy = (cm) => zRef - cm * scZ;
  const yx = (ycm) => 60 + (ycm - 480) * scY;
  const sp = [];
  sp.push(
    `<text x="40" y="28" font-size="13" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 A1 · secțiune din model (acces + scară etaj + sandwich)</text>`
  );

  // grade / FF
  sp.push(`<line x1="40" y1="${zy(0)}" x2="1160" y2="${zy(0)}" stroke="#6d7f5c" stroke-width="2"/>`);
  sp.push(`<text x="40" y="${zy(0) - 5}" font-size="8">teren 0</text>`);
  sp.push(
    `<line x1="40" y1="${zy(d.ff_parter_cm)}" x2="500" y2="${zy(d.ff_parter_cm)}" stroke="#333" stroke-dasharray="4 2"/>`
  );
  sp.push(`<text x="40" y="${zy(d.ff_parter_cm) - 4}" font-size="8">FF P +${d.ff_parter_cm}</text>`);
  const zEtaj = d.ff_parter_cm + (ht.ff_to_ff_cm || 288);
  sp.push(
    `<line x1="40" y1="${zy(zEtaj)}" x2="400" y2="${zy(zEtaj)}" stroke="#555" stroke-dasharray="3 2"/>`
  );
  sp.push(`<text x="40" y="${zy(zEtaj) - 4}" font-size="8">FF E +${zEtaj}</text>`);

  // sandwich layers (în afara puțului — reprezentare pe stânga)
  for (const L of bm.floor_sandwich_cm || []) {
    sp.push(
      `<rect x="40" y="${zy(L.z1_cm)}" width="70" height="${(L.z1_cm - L.z0_cm) * scZ}" fill="${L.color || "#bbb"}" stroke="#444" opacity="0.85"/>`
    );
    sp.push(
      `<text x="115" y="${(zy(L.z0_cm) + zy(L.z1_cm)) / 2}" font-size="6">${svgEsc(L.id)} ${L.th_cm}</text>`
    );
  }
  sp.push(
    `<text x="40" y="${zy(d.slab_soffit_cm) + 12}" font-size="7" fill="#c1121f">intrados ${d.slab_soffit_cm}</text>`
  );

  // FF subsol
  sp.push(
    `<line x1="${yx(520)}" y1="${zy(d.basement_ff_cm)}" x2="${yx(1028)}" y2="${zy(d.basement_ff_cm)}" stroke="#333" stroke-width="2"/>`
  );

  // scară etaj rampă2 — din stair_cm (aceeași formulă ca build)
  const r2 = st.ramp2;
  const riser = ht.riser_cm || 16;
  const tread = st.tread_cm || 30;
  const n180 = st.risers_flight_180;
  const n330 = st.risers_flight_330;
  const zPod = d.ff_parter_cm + riser * n180;
  const rampStruct = st.ramp2_structure_cm || 20;
  const nTread330 = n330 - 1;
  const ySouthEdge = r2.y + r2.dy;
  for (let i = 0; i < nTread330; i++) {
    const yS = ySouthEdge - (i + 1) * tread;
    const zTop = zPod + riser * (i + 1);
    sp.push(
      `<rect x="${yx(yS)}" y="${zy(zTop)}" width="${tread * scY}" height="${Math.max(2, rampStruct * scZ * 0.15)}" fill="#7a8390" stroke="#222"/>`
    );
    sp.push(
      `<rect x="${yx(yS)}" y="${zy(zTop - 0.01)}" width="${tread * scY}" height="${rampStruct * scZ}" fill="#5a6570" opacity="0.55"/>`
    );
  }
  // podest SE
  sp.push(
    `<rect x="${yx(st.podest_se.y)}" y="${zy(zPod)}" width="${st.podest_se.dy * scY}" height="6" fill="#c4b496"/>`
  );
  sp.push(`<text x="${yx(870)}" y="${zy(zPod) - 4}" font-size="7">podest SE +${zPod - d.ff_parter_cm} vs FF</text>`);

  // palier superior etaj
  const pal = st.palier_superior;
  const floorTh = ht.floor_buildup_below_ff_cm ?? 12;
  sp.push(
    `<rect x="${yx(pal.y)}" y="${zy(zEtaj)}" width="${pal.dy * scY}" height="${floorTh * scZ}" fill="#e4ddd0" stroke="#333"/>`
  );
  sp.push(`<text x="${yx(pal.y)}" y="${zy(zEtaj) - 4}" font-size="7">palier sup. etaj</text>`);

  // acces subsol
  const bst = bm.stair;
  for (let i = 0; i < bst.treads; i++) {
    const yS = bst.y + bst.dy - (i + 1) * bst.tread_cm;
    const zTop = d.access_landing_cm - bst.riser_cm * (i + 1);
    sp.push(
      `<rect x="${yx(yS)}" y="${zy(zTop)}" width="${bst.tread_cm * scY}" height="5" fill="#9aa3ad" stroke="#222"/>`
    );
  }
  sp.push(
    `<rect x="${yx(bm.upper_landing.y)}" y="${zy(d.access_landing_cm)}" width="${bm.upper_landing.dy * scY}" height="6" fill="#8aa4b8"/>`
  );
  sp.push(
    `<rect x="${yx(bm.lower_landing.y)}" y="${zy(d.basement_ff_cm)}" width="${bm.lower_landing.dy * scY}" height="8" fill="#e8c56a" stroke="#333"/>`
  );

  // ușă
  const door = bm.door_to_rooms;
  sp.push(
    `<rect x="${yx(door.y)}" y="${zy(d.basement_ff_cm + door.opening_h_cm)}" width="${door.dy * scY}" height="${door.opening_h_cm * scZ}" fill="#2d6a4f" opacity="0.3" stroke="#145"/>`
  );
  sp.push(
    `<text x="${yx(door.y)}" y="${zy(d.basement_ff_cm + door.opening_h_cm) - 3}" font-size="7">gol ${door.opening_h_cm}+${door.lintel_reserve_cm} pe Y${door.y}–${door.y + door.dy}</text>`
  );

  // trepte curte
  for (let i = 0; i < 6; i++) {
    const zTop = 0 - (95 / 6) * (i + 1);
    const yS = 860 + 168 - (i + 1) * 28;
    sp.push(`<rect x="${yx(yS)}" y="${zy(zTop)}" width="${28 * scY}" height="4" fill="#e0c888"/>`);
  }

  // min clear marker
  const hr = bm.headroom_audit;
  if (hr?.min_at) {
    const m = hr.min_at;
    sp.push(
      `<line x1="${yx(m.y_cm)}" y1="${zy(m.z_walk_cm)}" x2="${yx(m.y_cm)}" y2="${zy(m.z_obstacle_cm)}" stroke="#c1121f" stroke-width="2"/>`
    );
    sp.push(
      `<text x="${yx(m.y_cm) + 4}" y="${(zy(m.z_walk_cm) + zy(m.z_obstacle_cm)) / 2}" font-size="9" fill="#c1121f">min ${hr.min_clear_cm} cm @ Y${m.y_cm} (${svgEsc(m.element)})</text>`
    );
  }

  // meshes count from volume
  const nMesh = volume?.meshes?.length ?? 0;
  sp.push(
    `<text x="40" y="${Hs - 24}" font-size="8" fill="#444">model ${nMesh} mesh-uri · sandwich sum ${d.floor_sandwich_cm.sum_th_cm} cm · util recalculat ${v.areas_cm.useful_geometric_m2} m²</text>`
  );

  write(
    "outputs/plans/32_v47_a1_access_section.svg",
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${Ws}" height="${Hs}" viewBox="0 0 ${Ws} ${Hs}">\n<rect width="100%" height="100%" fill="#f7f7f5"/>\n${sp.join("\n")}\n</svg>\n`
  );
}

function writeReport(v, volume) {
  const bm = v.basement_cm;
  const d = bm.absolute_from_grade_cm;
  const c = bm.a1_checks;
  const hr = bm.headroom_audit;
  const sand = d.floor_sandwich_cm;
  const found = volume?.site?.foundation_corners || [];
  const md = `# V47 Runda A — studiu A1 (corectat)

## Status
**${c.ok ? "A1 FEZABIL (după corecții)" : "A1 EȘUAT / DESCHIS"}** — \`v47_exact.json\` **neatins**.

## Traseu
\`${c.path}\`

## Datum absolut (teren = 0)

| Cotă | cm |
|------|---:|
| teren | 0 |
| FF parter | +${d.ff_parter_cm} |
| palier acces | ${d.access_landing_cm} |
| FF subsol | ${d.basement_ff_cm} |
| intrados (țintă studiu) | ${d.slab_soffit_cm} |
| clear **declarat** (țintă) | ${d.clear_height_declared_cm} |
| clear **minim global** | **${hr.min_clear_cm}** @ Y${hr.min_at?.y_cm} / ${hr.min_at?.element} |
| clear **minim pe traseu acces** | **${hr.min_on_access_path_cm}** @ Y${hr.min_on_access_path_at?.y_cm} / ${hr.min_on_access_path_at?.element} |
| ușă + buiandrug | ${d.door_to_rooms_opening_h_cm}+${d.door_lintel_reserve_cm}=${d.door_stack_needed_cm} |

## Sandwich intrados ${d.slab_soffit_cm} → FF +${d.ff_parter_cm} (${sand.span_soffit_to_ff_cm} cm)

| Strat | cm | z0 → z1 |
|-------|---:|---------|
${sand.layers.map((L) => `| ${L.id} | ${L.th_cm} | ${L.z0_cm} → ${L.z1_cm} |`).join("\n")}

${sand.note}

**Clear-ul de 220 cm nu este validat prin scădere**; validarea e \`headroom_audit\` (intersecții cu \`structura_r2_*\`, intrados palier etaj, placă).

## Headroom (calcul)

- Minim: **${hr.min_clear_cm} cm** la X=${hr.min_at?.x_cm}, Y=${hr.min_at?.y_cm}, obstacol \`${hr.min_at?.element}\` (z_obs=${hr.min_at?.z_obstacle_cm}, z_cale=${hr.min_at?.z_walk_cm})
- Ușă vs clear zonă: ${JSON.stringify(hr.door_stack_vs_clear_at_door)}

## Verificări
### PASS
${c.passes.map((p) => `- ${p}`).join("\n")}

### FAIL
${c.fails.length ? c.fails.map((p) => `- ${p}`).join("\n") : "- (niciuna)"}

### Note
${(c.notes || []).map((p) => `- ${p}`).join("\n") || "-"}

## Transport echipamente
Gabarit explicit: **${bm.transport_cm.gabarit_cm.length_along_approach_cm}×${bm.transport_cm.gabarit_cm.width_across_cm}×${bm.transport_cm.gabarit_cm.height_cm} cm** — ${bm.transport_cm.gabarit_cm.based_on}

| Prag | Gol montaj | Clear după toc (${bm.transport_cm.frame_jamb_each_side_cm}+${bm.transport_cm.frame_jamb_each_side_cm}) |
|------|----------:|---:|
${(bm.transport_audit?.doors || []).map((xd) => `| ${xd.role} | ${xd.rough_cm} | **${xd.clear_after_frame_cm}** |`).join("\n")}

### Întoarcere pe palier
- Palier liber: **${bm.transport_audit?.turn.landing_clear_x_cm}×${bm.transport_audit?.turn.landing_clear_y_cm} cm** (fost 80 cm — insuficient pentru pivot)
- ${bm.transport_audit?.turn.free_rotation_rule} → free=${bm.transport_audit?.turn.free_rotation_ok}
- ${bm.transport_audit?.turn.pivot_rule} → pivot=**${bm.transport_audit?.turn.pivot_into_door_ok}**
- ${bm.transport_audit?.turn.note_80cm_legacy}
- Verdict transport: **${bm.transport_audit?.ok ? "OK" : "FAIL"}**

## Puț / goluri / grosimi
- open_shaft Y${bm.open_shaft_cm.y}–${bm.open_shaft_cm.y + bm.open_shaft_cm.dy}
- zid N @ Y${bm.lower_landing.y - bm.wall_thickness_study_cm.shaft_north_cm}–${bm.lower_landing.y}
- gol palier–hol: Y${bm.door_to_rooms.y}–${bm.door_to_rooms.y + bm.door_to_rooms.dy} (gol ${bm.door_to_rooms.rough_opening_cm} → clear ${bm.door_to_rooms.clear_after_frame_cm})
- EST puț: ${bm.wall_thickness_study_cm.shaft_east_cm} cm · VEST: ${bm.wall_thickness_study_cm.shaft_west_cm} cm

## Fundație / parcelă
Țintă ${volume?.site?.foundation_projection_cm ?? 15} cm · clip \`${JSON.stringify(volume?.site?.foundation_clip_cm)}\` · clip_all_inside=${volume?.site?.foundation_all_inside} · target_all_inside=${volume?.site?.foundation_target_all_inside}

| Punct (clip) | inside | overflow_m |
|-------|:------:|-----------:|
${found.map((f) => `| ${f.id} | ${f.inside} | ${f.overflow_m} |`).join("\n") || "| (volum lipsă) | | |"}

## Arii (recalculate, nu copiate)
| | m² |
|--|---:|
| util studii (recalcul) | **${v.areas_cm.useful_geometric_m2}** |
| util ref (înainte) | ${v.areas_cm.useful_ref_copied_was} |
| Δ | ${v.areas_cm.useful_delta_vs_ref_m2} |
| subsol brut camere | ${bm.areas.total_brut_rooms_m2} |
| subsol util estimat | ${bm.areas.util_estimat_m2} |
| POT anvelopă/147 | ${c.pot_envelope_over_147}% (limită admisă = deschisă) |

## Fișiere
- \`data/building/v47_a1_study.json\`
- \`outputs/plans/31_v47_a1_subsol_plan.svg\`
- \`outputs/plans/32_v47_a1_access_section.svg\`
- \`outputs/reports/v47_runda_a1.md\`
- \`viewer/data/volume_v47_a1.json\` → \`?v=v47_a1\`

Runda B: **neîncepută**.
`;
  write("outputs/reports/v47_runda_a1.md", md);
}

function main() {
  const ref = read("data/building/v47_exact.json");
  let study = applyA1(ref);
  write("data/building/v47_a1_study.json", study);

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

  const volume = read("viewer/data/volume_v47_a1.json");
  // re-verify cu parcelă din volum
  study.basement_cm.a1_checks = verifyA1(study, volume);
  write("data/building/v47_a1_study.json", study);

  exportPlan(study);
  exportSectionFromModel(study, volume);
  writeReport(study, volume);

  console.log(
    JSON.stringify(
      {
        ok: study.basement_cm.a1_checks.ok,
        fails: study.basement_cm.a1_checks.fails,
        min_clear_cm: study.basement_cm.headroom_audit.min_clear_cm,
        min_at: study.basement_cm.headroom_audit.min_at,
        useful: study.areas_cm.useful_geometric_m2,
        foundation_all_inside: volume.site.foundation_all_inside,
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
