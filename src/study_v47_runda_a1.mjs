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
  const enc = bm.shaft_enclosure_cm || { y0: shaft.y, y1: shaft.y + shaft.dy };
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
  for (let y = enc.y0; y <= 860; y += 5) {
    const zWalk = walkZ(y);
    const inShaft =
      y >= shaft.y && y <= shaft.y + shaft.dy && x >= shaft.x && x <= shaft.x + shaft.dx;
    let zObs = null;
    let element = null;
    let open = false;

    const underR2 = y >= r2.y && y <= r2.y + r2.dy ? undersideRamp2(y) : null;
    const covered = bm.slab_coordination_cm?.covered_landing;
    const inCoveredLanding =
      covered &&
      y >= covered.y &&
      y < covered.y + covered.dy &&
      x >= covered.x &&
      x <= covered.x + covered.dx;

    if (underR2 && inShaft) {
      zObs = underR2.z_cm;
      element = underR2.element;
    } else if (inCoveredLanding) {
      // palier sub planșeu parter — NU gol către etaj
      zObs = covered.soffit_cm ?? d.slab_soffit_cm;
      element = "intrados_placa_peste_palier_acoperit";
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

  // Rampă curte sub podest_se (intrados = FF podest − floor_buildup)
  const cts = bm.court_to_access_steps;
  const pod = st.podest_se;
  const zPodWalk = zParter + riser * n180;
  const zPodIntrados = zPodWalk - floorTh; // tipic +148
  const courtSamples = [];
  if (cts?.count && pod) {
    const nRisers = cts.count;
    const riserC = Math.abs((cts.to_z_cm ?? -95) - (cts.from_z_cm ?? 0)) / nRisers;
    const stepDy = cts.tread_cm || 28;
    const stepsY0 = cts.y;
    const runDy = nRisers * stepDy;
    const clearX0 = cts.x;
    const clearX1 = cts.x + cts.dx;
    const usableInset = 5; // margini laterale — verifică pe lățimea utilizabilă, nu doar ax
    const xLo = clearX0 + usableInset;
    const xHi = clearX1 - usableInset;
    const xSamples = [xLo, (xLo + xHi) / 2, xHi];
    for (let i = 0; i < nRisers; i++) {
      const yS = stepsY0 + runDy - (i + 1) * stepDy;
      const yN = yS + stepDy;
      const zWalk = (cts.from_z_cm ?? 0) - riserC * (i + 1);
      const oy0 = Math.max(yS, pod.y);
      const oy1 = Math.min(yN, pod.y + pod.dy);
      if (oy1 <= oy0 + 0.01) continue; // fără suprapunere cu podest
      const yMid = (oy0 + oy1) / 2;
      for (const xS of xSamples) {
        const clear = +(zPodIntrados - zWalk).toFixed(3);
        courtSamples.push({
          x_cm: +xS.toFixed(2),
          y_cm: +yMid.toFixed(2),
          y_overlap_cm: [+oy0.toFixed(2), +oy1.toFixed(2)],
          tread_index: i + 1,
          z_walk_cm: +zWalk.toFixed(3),
          z_obstacle_cm: zPodIntrados,
          clear_cm: clear,
          element: `intrados_podest_se@călcare_${i + 1}`,
          open: false,
          kind: "court_under_podest",
        });
      }
    }
    // muchie sud podest (Y975): sample pe ax dacă treapta trece pe sub muchie
    for (let i = 0; i < nRisers; i++) {
      const yS = stepsY0 + runDy - (i + 1) * stepDy;
      const yN = yS + stepDy;
      const edgeY = pod.y + pod.dy;
      if (yS < edgeY && yN > edgeY - 0.01) {
        const zWalk = (cts.from_z_cm ?? 0) - riserC * (i + 1);
        courtSamples.push({
          x_cm: +(clearX0 + (clearX1 - clearX0) / 2).toFixed(2),
          y_cm: edgeY,
          tread_index: i + 1,
          z_walk_cm: +zWalk.toFixed(3),
          z_obstacle_cm: zPodIntrados,
          clear_cm: +(zPodIntrados - zWalk).toFixed(3),
          element: `intrados_podest_se_muchie_Y${edgeY}@călcare_${i + 1}`,
          open: false,
          kind: "court_under_podest",
        });
      }
    }
  }
  samples.push(...courtSamples);

  const finite = samples.filter((s) => s.clear_cm != null && Number.isFinite(s.clear_cm));
  finite.sort((a, b) => a.clear_cm - b.clear_cm);
  const min = finite[0] || null;
  const pathOnly = samples.filter(
    (s) => s.kind === "access_path" && s.clear_cm != null && Number.isFinite(s.clear_cm)
  );
  pathOnly.sort((a, b) => a.clear_cm - b.clear_cm);
  const minPath = pathOnly[0] || null;
  const finiteNoCourt = finite.filter((s) => s.kind !== "court_under_podest");
  const minNoCourt = finiteNoCourt[0] || null;
  courtSamples.sort((a, b) => a.clear_cm - b.clear_cm);
  const minCourt = courtSamples[0] || null;
  return {
    samples_count: samples.length,
    samples_path: samples.filter((s) => s.kind === "access_path"),
    samples_court_under_podest: courtSamples,
    podest_se_intrados_cm: zPodIntrados,
    podest_se_edge_y: pod?.y + pod?.dy,
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
    min_clear_excluding_court_podest_cm: minNoCourt?.clear_cm ?? null,
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
    court_under_podest: minCourt
      ? {
          min_clear_cm: minCourt.clear_cm,
          min_at: {
            x_cm: minCourt.x_cm,
            y_cm: minCourt.y_cm,
            element: minCourt.element,
            tread_index: minCourt.tread_index,
            z_walk_cm: minCourt.z_walk_cm,
            z_obstacle_cm: minCourt.z_obstacle_cm,
          },
          target_min_cm: 190,
          claims_200_cm: false,
          note: "țintă test deplasare +8 cm = ≥190 pe lățimea utilizabilă; nu se declară 200",
        }
      : { min_clear_cm: null, note: "fără suprapunere trepte/curte cu podest_se" },
    door_stack_vs_clear_at_door: null, // filled below
  };
}

function rectsOverlap(a, b) {
  return !(a.x + a.dx <= b.x || b.x + b.dx <= a.x || a.y + a.dy <= b.y || b.y + b.dy <= a.y);
}

/** Pose obiect L×W cu unghi (0° = L pe +Y / coborâre; 90° = L pe −X / prin ușă) */
function objectFootprint(cx, cy, L, W, angleDeg, inflate = 0) {
  const rad = (angleDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  // colțuri locale: L pe local-y, W pe local-x
  const corners = [
    [-W / 2, -L / 2],
    [W / 2, -L / 2],
    [W / 2, L / 2],
    [-W / 2, L / 2],
  ].map(([lx, ly]) => ({
    x: cx + lx * c - ly * s,
    y: cy + lx * s + ly * c,
  }));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  const x0 = Math.min(...xs) - inflate;
  const y0 = Math.min(...ys) - inflate;
  const x1 = Math.max(...xs) + inflate;
  const y1 = Math.max(...ys) + inflate;
  return { x: x0, y: y0, dx: x1 - x0, dy: y1 - y0, corners, angleDeg, cx, cy };
}

/**
 * Transport: goluri 100 / clear 90 păstrate ca studiu.
 * Verdict întoarcere = doar din poziții succesive vs obstacole (nu W+15).
 * Dacă secvența e incompletă / coliziune → status neconfirmat.
 */
function transportAudit(bm) {
  const jamb = bm.transport_cm?.frame_jamb_each_side_cm ?? 5;
  const clearMin = bm.transport_cm?.clear_effective_min_cm ?? 90;
  const roughNeeded = clearMin + 2 * jamb;
  const g = bm.transport_cm?.gabarit_cm;
  const handle = bm.transport_cm?.handling_inflate_cm ?? 5;
  const leafTh = bm.transport_cm?.door_leaf_thickness_cm ?? 4;
  const low = bm.lower_landing;
  const st = bm.stair;
  const door = bm.door_to_rooms;
  const L = g.length_along_approach_cm;
  const W = g.width_across_cm;

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

  const notes = [];
  const fails = [];
  const passes = [];

  if (st.width_clear_cm + 0.01 < clearMin) fails.push(`scară clear ${st.width_clear_cm} < ${clearMin}`);
  else passes.push(`scară clear ${st.width_clear_cm} ≥ ${clearMin} (studiu)`);

  for (const d of doors) {
    if (d.rough_cm + 0.01 < roughNeeded)
      fails.push(`${d.id} gol montaj ${d.rough_cm} < ${roughNeeded}`);
    else
      passes.push(
        `${d.id}: gol montaj ${d.rough_cm} → clear ${d.clear_after_frame_cm} (toc ${jamb}+${jamb}) — păstrat studiu`
      );
  }

  // Obstacole plan (cm): pereți puț, toc, foaie deschisă în hol, trepte
  const clearX0 = st.x;
  const clearX1 = st.x + st.width_clear_cm;
  const doorClearY0 = door.y + jamb;
  const doorClearY1 = door.y + door.dy - jamb;
  const obstacles = [
    { id: "zid_put_w_solid_n", x: 535, y: low.y, dx: 30, dy: Math.max(0, door.y - low.y) },
    { id: "zid_put_w_solid_s", x: 535, y: door.y + door.dy, dx: 30, dy: Math.max(0, 860 - (door.y + door.dy)) },
    { id: "toc_n", x: 535, y: door.y, dx: 30, dy: jamb },
    { id: "toc_s", x: 535, y: door.y + door.dy - jamb, dx: 30, dy: jamb },
    { id: "zid_put_e", x: 680 - 15, y: low.y, dx: 15, dy: 860 - low.y },
    { id: "zid_put_n", x: 535, y: low.y - 12.5, dx: 145, dy: 12.5 },
    // foaie deschisă 90° în hol (spre vest), balama pe toc sud
    {
      id: "foaie_deschisa_hol",
      x: 535 - (doorClearY1 - doorClearY0),
      y: doorClearY1 - leafTh,
      dx: doorClearY1 - doorClearY0,
      dy: leafTh,
    },
  ];
  for (let i = 0; i < st.treads; i++) {
    const yS = st.y + st.dy - (i + 1) * st.tread_cm;
    obstacles.push({
      id: `treapta_${i}`,
      x: st.x,
      y: yS,
      dx: st.width_clear_cm,
      dy: st.tread_cm,
      kind: "tread",
    });
  }

  // Poziții succesive (centru pe clar X; Y / unghi)
  const cx0 = (clearX0 + clearX1) / 2;
  const poses = [];
  // coborâre pe scară (unghi 0)
  for (let i = 0; i < st.treads; i++) {
    const yS = st.y + st.dy - (i + 0.5) * st.tread_cm;
    poses.push({
      id: `coborare_t${i + 1}`,
      phase: "descent",
      ...objectFootprint(cx0, yS, L, W, 0, handle),
    });
  }
  // pe palier, încă pe ax scară
  const landCy = low.y + low.dy / 2;
  poses.push({
    id: "palier_aliniat_scara",
    phase: "landing",
    ...objectFootprint(cx0, landCy, L, W, 0, handle),
  });
  // întoarcere: 0→90° pe palier (centru se mută spre ușă)
  for (const ang of [15, 30, 45, 60, 75, 90]) {
    const t = ang / 90;
    const cx = cx0 + t * ((535 + 15) - cx0); // spre fața est a zidului / prag
    const cy = door.y + door.dy / 2;
    poses.push({
      id: `intoarcere_${ang}`,
      phase: "turn",
      ...objectFootprint(cx, cy, L, W, ang, handle),
    });
  }
  // prin gol (centru în planul ușii, unghi 90)
  poses.push({
    id: "in_gol_usa",
    phase: "through_door",
    ...objectFootprint(535 + 15, door.y + door.dy / 2, L, W, 90, handle),
  });
  // în hol
  poses.push({
    id: "in_hol",
    phase: "hall",
    ...objectFootprint(535 - L / 2 - 10, door.y + door.dy / 2, L, W, 90, handle),
  });

  const poseResults = poses.map((p) => {
    const hits = [];
    for (const o of obstacles) {
      // pe coborâre, treapta curentă e „suport”, nu coliziune orizontală blocantă — ignorăm tread vs descent pe aceeași bandă
      if (o.kind === "tread" && p.phase === "descent") continue;
      if (o.kind === "tread" && p.phase === "landing") continue;
      if (rectsOverlap(p, o)) hits.push(o.id);
    }
    // în afara benzii clare pe scară/palier (except through door / hall)
    if (p.phase === "descent" || p.phase === "landing" || p.phase === "turn") {
      if (p.x < clearX0 - 0.5 || p.x + p.dx > clearX1 + 0.5) {
        // pe turn, obiectul poate intra în golul ușii (X<565)
        if (!(p.phase === "turn" && p.x < clearX0 && p.x + p.dx > 535)) {
          if (p.x + p.dx > clearX1 + 0.5) hits.push("iesire_est_clar");
          if (p.x < 535 - 0.5 && p.phase !== "turn") hits.push("iesire_vest_clar");
        }
      }
      if (p.phase === "turn" || p.phase === "landing") {
        if (p.y < low.y - 0.5 || p.y + p.dy > low.y + low.dy + 0.5) {
          // permite pătrundere în golul ușii pe Y în intervalul clear
          const inDoorY = p.y < doorClearY1 && p.y + p.dy > doorClearY0;
          if (!inDoorY) hits.push("iesire_palier_Y");
        }
      }
    }
    // prin ușă: trebuie să stea în banda clear a golului pe Y
    if (p.phase === "through_door") {
      if (p.y < doorClearY0 - 0.5 || p.y + p.dy > doorClearY1 + 0.5) hits.push("foaie_gol_Y");
    }
    return {
      id: p.id,
      phase: p.phase,
      angleDeg: p.angleDeg,
      cx: +p.cx.toFixed(1),
      cy: +p.cy.toFixed(1),
      aabb: { x: +p.x.toFixed(1), y: +p.y.toFixed(1), dx: +p.dx.toFixed(1), dy: +p.dy.toFixed(1) },
      collisions: hits,
      ok: hits.length === 0,
    };
  });

  const geomOk = poseResults.every((r) => r.ok);
  const geometric = {
    status: geomOk ? "confirmat_geometric" : "neconfirmat",
    method:
      "poziții succesive AABB 80×70 (+inflate manipulare) vs pereți/toc/foaie/trepte — nu formula W+15",
    handling_inflate_cm: handle,
    door_leaf: { thickness_cm: leafTh, swing: "90° în hol, balama sud" },
    poses: poseResults,
    ok: geomOk,
  };

  if (geomOk) passes.push("întoarcere confirmată geometric (toate pozițiile fără coliziune)");
  else {
    notes.push(
      "TRANSPORT NECONFIRMAT: există coliziuni în secvența geometrică sau spațiu manipulare insuficient — nu se folosește W+15 ca substitut"
    );
    const bad = poseResults.filter((r) => !r.ok);
    notes.push(
      `poziții în conflict: ${bad.map((b) => `${b.id}[${b.collisions.join(",")}]`).join("; ")}`
    );
  }

  const hol = bm.rooms.find((r) => r.id === "hol_subsol");
  if (hol.dx >= clearMin) passes.push(`hol lățime ${hol.dx} ≥ ${clearMin}`);

  return {
    clear_effective_min_cm: clearMin,
    frame_jamb_each_side_cm: jamb,
    rough_opening_needed_cm: roughNeeded,
    gabarit_cm: g,
    doors,
    geometric,
    // nu mai există turn.pivot W+15
    turn: null,
    confirmed: geomOk,
    ok: fails.length === 0 && geomOk,
    passes,
    fails,
    notes,
  };
}

function applyA1(v47) {
  const out = clone(v47);
  const d = absoluteDatum(out.heights_cm || {});
  out.meta = out.meta || {};
  out.meta.study_variant = "A1";
  out.meta.rev_note_a1 =
    "A1: goluri 100/palier 110; planșeu Y490–590; puț Y590–860; rampă curte Y868–1036 (+8 sud); alee/poartă racord Y1036; transport geometric";

  const riser = 155 / 9;
  const tread = 25;
  const treads = 8;
  const risers = 9;
  const ySouth = 800;
  const yLast = ySouth - treads * tread; // 600
  // Test H liber sub podest_se: deplasare rampă exterioară +8 cm sud
  const courtStepsY0 = 868;
  const courtTread = 28;
  const courtRisers = 6;
  const courtStepsDy = courtRisers * courtTread; // 168 → Y1036
  const courtStepsY1 = courtStepsY0 + courtStepsDy;
  const upperLandY0 = 800;
  const upperLandDy = courtStepsY0 - upperLandY0; // 68 — continuu până la trepte
  const alleyY0 = courtStepsY1; // racord continuu (fără gol 2 cm față de Y1038)
  const alleyDy = 150;
  // toc 5+5 → clear 90 cere gol montaj 100; palier trebuie ≥ gol + pivot (W+15)
  const jamb = 5;
  const clearEff = 90;
  const roughDoor = clearEff + 2 * jamb; // 100
  const gabaritW = 70; // baterie / modul CT
  const gabaritL = 80;
  // păstrate ca variantă de studiu (cerință)
  const landDy = 110;
  const landY0 = yLast - landDy; // 490
  const doorDy = roughDoor; // 100
  const doorY0 = yLast - doorDy; // 500
  const shaftEast = 15;
  const shaftWest = 30;
  const clearDx = 680 - shaftEast - 565; // 100
  const shaftNorth = 12.5;

  const treadZ = [];
  for (let i = 0; i < treads; i++) treadZ.push(d.access_landing_cm - riser * (i + 1));

  out.basement_cm = {
    ...out.basement_cm,
    status: "studiu_A1_slab_transport",
    concept_note:
      `A1: palier ${landDy} cm / goluri ${roughDoor} păstrate studiu; planșeu peste Y${landY0}–590; puț deschis Y590–860.`,
    transport_cm: {
      clear_effective_min_cm: clearEff,
      frame_jamb_each_side_cm: jamb,
      rough_opening_needed_cm: roughDoor,
      handling_inflate_cm: 5,
      door_leaf_thickness_cm: 4,
      gabarit_cm: {
        id: "gabarit_transport_beci",
        length_along_approach_cm: gabaritL,
        width_across_cm: gabaritW,
        height_cm: 180,
        based_on: "baterie 70×25×110 + marjă; L=80 pe coborâre",
        note: "verificare doar prin poziții succesive — fără W+15",
      },
      path: "curte→scară L-1→palier→ușă(clear90)→hol→usa_hol_ct|usa_hol_dep",
    },
    // Planșeu: puț deschis NU sub living / zona Y470–590 a benzii est
    slab_coordination_cm: {
      living_parter: { x: 360, y: 90, dx: 290, dy: 380, y1: 470 },
      conflict_zone_y: [470, 590],
      open_shaft_allowed_y0: 590,
      covered_landing: {
        x: 565,
        y: landY0,
        dx: 115,
        dy: Math.max(0, 590 - landY0),
        soffit_cm: d.slab_soffit_cm,
        clear_under_cm: d.clear_height_declared_cm,
        note: "palier inferior sub planșeu parter (sandwich) — nu gol structural",
      },
      open_shaft: {
        x: 565,
        y: 590,
        dx: 115,
        dy: 860 - 590,
        note: "doar sub rampă2 / curte engleză — fără pardoseală living deasupra",
      },
      edge_beam_y: 590,
      edge_beam_note: "reazem planșeu la sudul zonei acoperite / nordul puțului",
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
      // Casă încălzită: 20 sono (neumplutură) + 8 termo + 2 finisaj = 30 finit
      heated_finished_cm: 30,
      brick_sono_non_loadbearing_cm: 20,
      insulation_cm: 8,
      finish_cm: 2,
      structure: "beton_portant",
      perimeter_structure_cm: 30,
      perimeter_note:
        "30 = finit casă (20 sono umplutură + 8 termo + 2 finisaj). View Structură = doar beton (fundație/placă/grinzi/stâlpi), fără ziduri umplutură.",
      partition_cm: 12.5,
      shaft_west_cm: shaftWest,
      shaft_east_cm: shaftEast,
      shaft_east_note: "scară rece — fără termosistem; 15 cm studiu",
      shaft_north_cm: shaftNorth,
      // Fundație pe beton: termosistem 10 cm ÎN AFARA liniei de talpă
      foundation_thermosystem_outside_cm: 10,
      foundation_footing_beyond_structure_cm: 5,
      foundation_projection_beyond_wall_cm: 5,
      foundation_note:
        "talpă beton față de fața structură/umplutură (finit−10); +5 cm talpă tipică — NU +15 față de finit",
      cold_stair: true,
      cold_stair_note: "volum scară rece; casă izolată la buc_est",
    },
    ramp2_ref: { x: 565, y: 590, dx: 115, dy: 270 },
    // IMPORTANT: gol în planșeu = doar sub rampă2, NU pe tot palierul Y490+
    open_shaft_cm: {
      x: 565,
      y: 590,
      dx: 115,
      dy: 270,
      note: "puț deschis Y590–860 (=ramp2); palier Y490–590 sub planșeu",
    },
    shaft_enclosure_cm: {
      y0: landY0,
      y1: 860,
      note: "pereți puț/palier pe Y490–860; gol planșeu doar Y590+",
    },
    court_to_access_steps: {
      count: courtRisers,
      delta_cm: 95,
      riser_cm: 95 / courtRisers,
      tread_cm: courtTread,
      x: 565,
      y: courtStepsY0,
      dx: 115,
      dy: courtStepsDy,
      from_z_cm: 0,
      to_z_cm: d.access_landing_cm,
      status: "studiu_A1",
      note: `Y${courtStepsY0}–${courtStepsY1}: +8 cm sud vs Y860 (elimină H=179,7 sub muchia podest_se Y975)`,
    },
    local_court_drop: {
      x: 565,
      y: upperLandY0,
      dx: 115,
      dy: upperLandDy,
      z_ff_cm: d.access_landing_cm,
      status: "studiu_A1",
      note: `alias palier −95 Y${upperLandY0}–${courtStepsY0} (continuu cu trepte)`,
    },
    upper_landing: {
      x: 565,
      y: upperLandY0,
      dx: 115,
      dy: upperLandDy,
      z_ff_cm: d.access_landing_cm,
      status: "studiu_A1",
      note: `prelungit la Y${courtStepsY0} (dy=${upperLandDy}) — fără gol față de rampă`,
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
      note: `Y${landY0}–${yLast} (${landDy} cm) studiu; Y${landY0}–590 sub planșeu; Y590–${yLast} în puț; zid N @ Y${landY0 - shaftNorth}`,
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

  // Alee 150 + poartă pietonală: racord continuu la sudul rampei (Y1036), nu gol 2 cm
  {
    const ped = out.site_access_cm?.pedestrian;
    if (ped?.path?.segments_cm?.[0]) {
      for (const seg of ped.path.segments_cm) {
        if (/alee|langa_scari/i.test(seg.id || "") || seg === ped.path.segments_cm[0]) {
          seg.y = alleyY0;
          seg.dy = alleyDy;
          seg.note = `alee ${alleyDy}cm Y${alleyY0}–${alleyY0 + alleyDy} — racord la trepte Y${courtStepsY1}; aceeași bandă ca poarta`;
        }
      }
      ped.path.note =
        "alee + poartă aliniate pe banda Y a racordului la rampă curte (fără gol, fără palier de acces fictiv)";
      ped.path.connects_to = ["court_to_access_steps_south_face", "poarta_pietonala_dragalina"];
    }
    if (ped?.gate?.local_cm) {
      ped.gate.local_cm.y = alleyY0;
      ped.gate.local_cm.dy = alleyDy;
      ped.gate.note = `centrată pe alee Y${alleyY0}–${alleyY0 + alleyDy}; pe linia gardului Dragalina (inset interior)`;
    }
    if (out.site_access_cm) {
      out.site_access_cm.court_access_shift_cm = {
        stairs_y0_before: 860,
        stairs_y0_after: courtStepsY0,
        stairs_y1_after: courtStepsY1,
        alley_y0_after: alleyY0,
        alley_dy: alleyDy,
        justification:
          "Deplasare rampă +8 cm sud elimină punctul H=179,7 sub Y975; aleea coboară la Y1036 ca racord continuu (nu distanță arbitrară). Lățime 150 păstrată. Poarta pe aceeași bandă Y. Staționare/manevră = adâncimea aleii 150 cm înaintea coborârii. Parcări Cloșca neschimbate.",
      };
    }
  }
  // courtyard_cm.english_court — aliniat la court_to_access_steps
  if (out.courtyard_cm?.english_court) {
    const ec = out.courtyard_cm.english_court;
    ec.y = courtStepsY0 - 18;
    ec.dy = courtStepsDy + 18;
    if (ec.steps) {
      ec.steps.y = courtStepsY0;
      ec.steps.dy = courtStepsDy;
      ec.steps.from_z_cm = 0;
      ec.steps.to_z_cm = d.access_landing_cm;
    }
    if (ec.landing_access) {
      ec.landing_access.y = upperLandY0;
      ec.landing_access.dy = upperLandDy;
      ec.landing_access.z_ff_cm = d.access_landing_cm;
    }
  }

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
  const cts = bm.court_to_access_steps;
  const stepsY0 = cts?.y ?? 868;
  if (Math.abs(up.y + up.dy - stepsY0) > 0.01)
    fails.push(`upper nu ajunge la Y${stepsY0} origine trepte curte (got ${up.y + up.dy})`);
  else passes.push(`upper_landing → Y${stepsY0} (continuu cu rampă curte)`);

  if (Math.abs(up.y - ySouth) > 0.01) fails.push(`upper.y ${up.y} ≠ stair south ${ySouth}`);
  else passes.push("upper abut stair top");

  if (cts) {
    const runEnd = cts.y + cts.dy;
    if (Math.abs(cts.y - 868) > 0.01 || Math.abs(cts.dy - 168) > 0.01)
      fails.push(`court steps așteptat Y868 dy168 (got Y${cts.y} dy=${cts.dy})`);
    else passes.push(`trepte curte Y${cts.y}–${runEnd} (6×28, 0→−95)`);
    const alley = v.site_access_cm?.pedestrian?.path?.segments_cm?.find((s) =>
      /alee|langa_scari/i.test(s.id || "")
    );
    if (alley) {
      if (Math.abs(alley.y - runEnd) > 0.01)
        fails.push(`alee.y ${alley.y} ≠ sud trepte ${runEnd} (gol/racord)`);
      else passes.push(`alee racord continuu @ Y${alley.y} (dy=${alley.dy})`);
      if (Math.abs(alley.dy - 150) > 0.01) fails.push(`alee dy ${alley.dy} ≠ 150`);
      else passes.push("alee lățime 150 cm păstrată");
    }
  }

  if (low.y + low.dy > yLast + 0.01) fails.push("palier jos se suprapune pe scară");
  else passes.push("palier jos N de ultima treaptă");

  if (door.y < low.y || door.y + door.dy > low.y + low.dy) fails.push("ușa nu stă pe palier");
  else passes.push(`ușă pe palier Y${door.y}–${door.y + door.dy} (dy=${door.dy})`);

  const hol = bm.rooms.find((r) => r.id === "hol_subsol");
  if (door.y < hol.y || door.y + door.dy > hol.y + hol.dy) fails.push("ușa nu întâlnește holul pe Y");
  else passes.push("ușă ∩ hol pe Y");

  // planșeu / puț
  const shaft = bm.open_shaft_cm;
  const slab = bm.slab_coordination_cm;
  if (!slab) fails.push("lipsește slab_coordination_cm");
  else {
    if (Math.abs(shaft.y - 590) > 0.01 || shaft.dy !== 270)
      fails.push(`open_shaft trebuie Y590–860 (got Y${shaft.y} dy=${shaft.dy})`);
    else passes.push("puț deschis în planșeu: doar Y590–860 (sub rampă2)");
    const cov = slab.covered_landing;
    if (cov.y + cov.dy > 590 + 0.01) fails.push("covered_landing invadează zona puț");
    else
      passes.push(
        `palier acoperit de planșeu Y${cov.y}–${cov.y + cov.dy}: clear țintă ${cov.clear_under_cm} sub soffit ${cov.soffit_cm}`
      );
    // overlap living vs open shaft
    const liv = slab.living_parter;
    const ox0 = Math.max(liv.x, shaft.x);
    const oy0 = Math.max(liv.y, shaft.y);
    const ox1 = Math.min(liv.x + liv.dx, shaft.x + shaft.dx);
    const oy1 = Math.min(liv.y + liv.dy, shaft.y + shaft.dy);
    if (ox1 > ox0 && oy1 > oy0)
      fails.push(`puț deschis ∩ living P: X${ox0}–${ox1} Y${oy0}–${oy1}`);
    else passes.push("puț deschis nu intersectează poligonul living P");
    // zonă Y470–590 pe bandă est: trebuie acoperită de planșeu (nu gol)
    if (shaft.y <= 470) fails.push("puț deschis începe în Y470–590 (conflict studiu living/zonă est)");
    else notes.push("Y470–590 pe bandă est: planșeu/palier acoperit — nu gol ignorat sub pardoseală");
  }

  const northWallY1 = low.y;
  const northWallY0 = low.y - (bm.wall_thickness_study_cm.shaft_north_cm ?? 12.5);
  if (northWallY1 > low.y + 0.01) fails.push("zid N invadează palierul");
  else passes.push(`zid N @ Y${northWallY0}–${northWallY1} (N de palier)`);

  // est 15
  if (bm.wall_thickness_study_cm.shaft_east_cm !== 15) fails.push("shaft_east ≠ 15");
  else passes.push("zid EST puț = 15 cm (JSON)");

  // sandwich — modelat, dar residual_level_to_ff rămâne ipoteză → nu validează A1
  const sand = d.floor_sandwich_cm;
  if (!sand?.closes_span) fails.push(`sandwich nu închide span −30…+32 (sum=${sand?.sum_th_cm})`);
  else
    notes.push(
      `sandwich sumă ${sand.sum_th_cm} cm închide span numeric, dar stratul residual_level_to_ff e ipoteză — straturi NECONFIRMATE structural`
    );

  // headroom real
  const hr = bm.headroom_audit;
  if (!hr?.min_clear_cm && hr?.min_clear_cm !== 0) fails.push("lipsește calcul headroom");
  else {
    const minShaft = hr.min_clear_excluding_court_podest_cm ?? hr.min_clear_cm;
    passes.push(
      `gabarit minim (fără sub-podest curte) = ${minShaft} cm`
    );
    passes.push(
      `gabarit minim pe traseu acces puț = ${hr.min_on_access_path_cm} cm @ Y${hr.min_on_access_path_at?.y_cm} (${hr.min_on_access_path_at?.element})`
    );
    if (minShaft < 200) fails.push(`gabarit puț/camere ${minShaft} < 200 cm`);
    const courtHr = hr.court_under_podest;
    if (courtHr?.min_clear_cm != null) {
      const tMin = courtHr.target_min_cm ?? 190;
      if (courtHr.min_clear_cm + 0.01 < tMin) {
        fails.push(
          `sub podest_se pe rampă curte: ${courtHr.min_clear_cm} < ${tMin} cm @ Y${courtHr.min_at?.y_cm} (${courtHr.min_at?.element})`
        );
      } else {
        passes.push(
          `sub podest_se (lățime utilă): min ${courtHr.min_clear_cm} cm ≥ ${tMin} — NU se declară 200`
        );
      }
      notes.push(
        "Acoperirea fixă nouă se dimensionează ulterior, fără reintroducerea unei înălțimi insuficiente sub podest_se."
      );
    }
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

  // transport — doar geometric; fără W+15
  const tr = bm.transport_audit;
  if (!tr) fails.push("lipsește transport_audit");
  else {
    for (const p of tr.passes) passes.push(`transport: ${p}`);
    for (const f of tr.fails) fails.push(`transport: ${f}`);
    for (const n of tr.notes || []) notes.push(n);
    if (!tr.confirmed) {
      notes.push("TRANSPORT NECONFIRMAT — A1 nu poate fi declarată fezabilă pe transport");
    } else {
      passes.push("transport confirmat geometric (poziții succesive)");
    }
  }

  // fundație beton (termo 10 cm afară) — legacy +15 pe finit e greșit
  if (volume?.site?.foundation_all_inside) {
    passes.push(
      `fundație beton în parcelă (inset finit ${volume.site.foundation_inset_from_finished_cm} cm = termo−talpă)`
    );
  } else if (volume?.site?.foundation_corners) {
    notes.push("fundație beton: verificare PIP — vezi volume.site.foundation_corners");
  }
  if (volume?.site && volume.site.foundation_legacy_plus15_all_inside === false) {
    notes.push(
      "legacy +15 cm peste fața FINITE eșuează pe est — ipoteză greșită (termo nu stă pe talpă); nu cere mutarea casei"
    );
  }
  notes.push(
    "înălțime liberă 220 = țintă pe soffit studiu; validare structurală planșeu/grinzi = DESCHISĂ"
  );

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

  // A1 fezabilă doar dacă: fără fails + transport confirmat + fundație țintă OK + straturi confirmate
  // Momentan straturi/fundație rămân deschise → forțăm nefezabil
  const openIssues = [
    "straturi sandwich residual confirmate de structurist",
    "înălțime liberă validată pe geometrie structurală finală (nu doar soffit țintă)",
    ...(tr && !tr.confirmed ? ["transport geometric (opțional dacă orientare corectă de la intrare)"] : []),
  ];
  // fundație: nu mai blochează pe legacy +15 finit
  const feasible = false; // studiu deschis până confirmări structurale / transport dacă e cazul

  return {
    ok: fails.length === 0,
    feasible_a1: feasible,
    status_label: feasible ? "A1 FEZABIL" : "A1 NEFEZABIL / STUDIU DESCHIS",
    open_issues: openIssues,
    passes,
    fails,
    notes,
    pot_envelope_over_147: +(potRef * 100).toFixed(2),
    pot_note: "anvelopă/147 — confirmare limită admisă deschisă",
    headroom_min: hr?.min_at || null,
    headroom_covered_landing: hr?.samples_path
      ?.filter((s) => s.element === "intrados_placa_peste_palier_acoperit")
      ?.sort((a, b) => a.clear_cm - b.clear_cm)?.[0] || null,
    path: "curte→palier−95→scară↓N→palier(sub planșeu Y490–590 + puț Y590–600)→ușă→hol→CT/dep",
    transport: tr
      ? {
          confirmed: tr.confirmed,
          status: tr.geometric?.status,
          clear_min: tr.clear_effective_min_cm,
          rough: tr.rough_opening_needed_cm,
          gabarit: tr.gabarit_cm,
          geometric: tr.geometric,
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
  // zonă palier acoperit vs puț deschis
  const cov = bm.slab_coordination_cm.covered_landing;
  parts.push(
    `<rect x="${px(cov.x)}" y="${py(cov.y)}" width="${cov.dx * S}" height="${cov.dy * S}" fill="#4a6fa5" fill-opacity="0.2" stroke="#1d3557" stroke-dasharray="4 2"/>`
  );
  parts.push(
    `<text x="${px(cov.x + 2)}" y="${py(cov.y + 12)}" font-size="7" fill="#1d3557">palier sub planșeu clear≈${cov.clear_under_cm}</text>`
  );
  parts.push(
    `<rect x="${px(bm.open_shaft_cm.x)}" y="${py(bm.open_shaft_cm.y)}" width="${bm.open_shaft_cm.dx * S}" height="${bm.open_shaft_cm.dy * S}" fill="none" stroke="#c1121f" stroke-dasharray="3 2"/>`
  );
  parts.push(
    `<text x="${px(570)}" y="${py(bm.open_shaft_cm.y + 14)}" font-size="7" fill="#c1121f">puț deschis Y590–860</text>`
  );
  // pose-uri transport
  for (const p of bm.transport_audit?.geometric?.poses || []) {
    if (!["palier_aliniat_scara", "intoarcere_45", "intoarcere_90", "in_gol_usa", "in_hol"].includes(p.id))
      continue;
    parts.push(
      `<rect x="${px(p.aabb.x)}" y="${py(p.aabb.y)}" width="${p.aabb.dx * S}" height="${p.aabb.dy * S}" fill="${p.ok ? "#2d6a4f" : "#e63946"}" fill-opacity="0.2" stroke="${p.ok ? "#1b4332" : "#c1121f"}"/>`
    );
  }
  parts.push(
    `<text x="${px(400)}" y="${py(480)}" font-size="8" fill="#c1121f">transport: ${bm.transport_audit?.geometric?.status}</text>`
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

  // trepte curte din court_to_access_steps (origine = cts.y, nu Y860 fix)
  const cts = bm.court_to_access_steps;
  const stepsY0 = cts?.y ?? 868;
  const stepDy = cts?.tread_cm ?? 28;
  const nCourt = cts?.count ?? 6;
  const runDy = nCourt * stepDy;
  const riserC = Math.abs((cts?.to_z_cm ?? -95) - (cts?.from_z_cm ?? 0)) / nCourt;
  for (let i = 0; i < nCourt; i++) {
    const zTop = (cts?.from_z_cm ?? 0) - riserC * (i + 1);
    const yS = stepsY0 + runDy - (i + 1) * stepDy;
    sp.push(`<rect x="${yx(yS)}" y="${zy(zTop)}" width="${stepDy * scY}" height="4" fill="#e0c888"/>`);
    sp.push(
      `<text x="${yx(yS)}" y="${zy(zTop) - 2}" font-size="5" fill="#665">T${i + 1} z=${zTop.toFixed(1)}</text>`
    );
  }
  // muchie podest_se Y975 + intrados
  const podEdge = st.podest_se.y + st.podest_se.dy;
  const zPodIntr = zPod - floorTh;
  sp.push(
    `<line x1="${yx(podEdge)}" y1="${zy(-100)}" x2="${yx(podEdge)}" y2="${zy(zPod + 40)}" stroke="#c1121f" stroke-dasharray="3 2"/>`
  );
  sp.push(
    `<text x="${yx(podEdge) + 2}" y="${zy(zPodIntr)}" font-size="7" fill="#c1121f">muchie palier Y${podEdge} · intrados +${zPodIntr}</text>`
  );
  sp.push(
    `<line x1="${yx(st.podest_se.y)}" y1="${zy(zPodIntr)}" x2="${yx(podEdge)}" y2="${zy(zPodIntr)}" stroke="#a67c52" stroke-width="1.5"/>`
  );

  // min clear marker — preferă min sub podest pe rampă curte
  const hr = bm.headroom_audit;
  const courtMin = hr?.court_under_podest?.min_at;
  const mark = courtMin || hr?.min_at;
  const markClear = courtMin ? hr.court_under_podest.min_clear_cm : hr?.min_clear_cm;
  if (mark) {
    sp.push(
      `<line x1="${yx(mark.y_cm)}" y1="${zy(mark.z_walk_cm)}" x2="${yx(mark.y_cm)}" y2="${zy(mark.z_obstacle_cm)}" stroke="#c1121f" stroke-width="2"/>`
    );
    sp.push(
      `<text x="${yx(mark.y_cm) + 4}" y="${(zy(mark.z_walk_cm) + zy(mark.z_obstacle_cm)) / 2}" font-size="9" fill="#c1121f">min ${markClear} cm @ Y${mark.y_cm} (${svgEsc(mark.element)})</text>`
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

/** Plan + secțiune înainte/după deplasarea +8 cm (test H liber sub podest_se) */
function exportCourtAccessBeforeAfter(v) {
  const bm = v.basement_cm;
  const ht = v.heights_cm;
  const st = v.stair_cm;
  const ped = v.site_access_cm?.pedestrian;
  const alley = ped?.path?.segments_cm?.find((s) => /alee|langa_scari/i.test(s.id || "")) ||
    ped?.path?.segments_cm?.[0];
  const gate = ped?.gate;
  const park = v.site_access_cm?.auto?.parking;
  const riser = ht.riser_cm || 16;
  const n180 = st.risers_flight_180;
  const zPod = (bm.absolute_from_grade_cm?.ff_parter_cm ?? 32) + riser * n180;
  const floorTh = ht.floor_buildup_below_ff_cm ?? 12;
  const zIntr = zPod - floorTh;
  const pod = st.podest_se;
  const podEdge = pod.y + pod.dy;

  function treadGeom(y0, i) {
    const stepDy = 28;
    const runDy = 168;
    const yS = y0 + runDy - (i + 1) * stepDy;
    const zTop = 0 - (95 / 6) * (i + 1);
    return { yS, yN: yS + stepDy, zTop, clear: +(zIntr - zTop).toFixed(3) };
  }

  // —— PLAN cotat zonă acces
  const S = 0.42;
  const M = 50;
  const W = 900;
  const H = 720;
  const px = (x) => M + x * S;
  const py = (y) => 40 + (y - 820) * S;
  const pl = [];
  pl.push(
    `<text x="${W / 2}" y="22" text-anchor="middle" font-size="13" font-weight="600">V47 A1 · zonă acces beci — DUPĂ +8 cm sud (plan cotat)</text>`
  );
  pl.push(
    `<text x="${W / 2}" y="38" text-anchor="middle" font-size="8" fill="#666">poartă · alee 150 · trepte Y868–1036 · protecții · parcări Cloșca neschimbate</text>`
  );
  // casă SE
  pl.push(
    `<rect x="${px(355)}" y="${py(860)}" width="${325 * S}" height="${0}" stroke="#999"/>`
  );
  pl.push(
    `<rect x="${px(0)}" y="${py(0)}" width="${680 * S}" height="${860 * S}" fill="none" stroke="#bbb" stroke-dasharray="3 2"/>`
  );
  // podest_se
  pl.push(
    `<rect x="${px(pod.x)}" y="${py(pod.y)}" width="${pod.dx * S}" height="${pod.dy * S}" fill="#c4b496" fill-opacity="0.45" stroke="#8a7355"/>`
  );
  pl.push(
    `<line x1="${px(pod.x)}" y1="${py(podEdge)}" x2="${px(pod.x + pod.dx)}" y2="${py(podEdge)}" stroke="#c1121f" stroke-width="2"/>`
  );
  pl.push(
    `<text x="${px(pod.x + pod.dx + 4)}" y="${py(podEdge)}" font-size="8" fill="#c1121f">muchie palier Y${podEdge}</text>`
  );
  // trepte după
  const cts = bm.court_to_access_steps;
  for (let i = 0; i < 6; i++) {
    const t = treadGeom(cts.y, i);
    pl.push(
      `<rect x="${px(cts.x)}" y="${py(t.yS)}" width="${cts.dx * S}" height="${28 * S}" fill="${i % 2 ? "#e0c888" : "#f0e2b8"}" stroke="#333"/>`
    );
    pl.push(
      `<text x="${px(cts.x + 2)}" y="${py(t.yS + 14)}" font-size="6">T${i + 1} z=${t.zTop.toFixed(1)} H=${t.yN > pod.y && t.yS < podEdge ? t.clear : "—"}</text>`
    );
  }
  pl.push(
    `<text x="${px(cts.x)}" y="${py(cts.y) - 4}" font-size="7">trepte Y${cts.y}–${cts.y + cts.dy}</text>`
  );
  // palier −95
  const up = bm.upper_landing;
  pl.push(
    `<rect x="${px(up.x)}" y="${py(up.y)}" width="${up.dx * S}" height="${up.dy * S}" fill="#8aa4b8" fill-opacity="0.5" stroke="#1d3557"/>`
  );
  pl.push(
    `<text x="${px(up.x + 2)}" y="${py(up.y + 12)}" font-size="7">palier −95 L=${up.dy} cm → Y${up.y + up.dy}</text>`
  );
  // alee
  if (alley) {
    pl.push(
      `<rect x="${px(alley.x)}" y="${py(alley.y)}" width="${alley.dx * S}" height="${alley.dy * S}" fill="#c5b89a" fill-opacity="0.55" stroke="#6b5e45"/>`
    );
    pl.push(
      `<text x="${px(alley.x + 8)}" y="${py(alley.y + 20)}" font-size="8">alee ${alley.dy} cm Y${alley.y}–${alley.y + alley.dy}</text>`
    );
    // cotă racord
    pl.push(
      `<line x1="${px(cts.x + cts.dx)}" y1="${py(cts.y + cts.dy)}" x2="${px(alley.x + alley.dx)}" y2="${py(alley.y)}" stroke="#2d6a4f" stroke-width="1.5"/>`
    );
    pl.push(
      `<text x="${px(alley.x + alley.dx - 80)}" y="${py(alley.y) - 6}" font-size="7" fill="#2d6a4f">racord 0 cm (continuu)</text>`
    );
  }
  // poartă
  if (gate?.local_cm) {
    const g = gate.local_cm;
    pl.push(
      `<rect x="${px(g.x)}" y="${py(g.y)}" width="${g.dx * S}" height="${g.dy * S}" fill="#6aaf7a" stroke="#1b4332"/>`
    );
    pl.push(
      `<text x="${px(g.x - 4)}" y="${py(g.y + g.dy / 2)}" text-anchor="end" font-size="7">poartă ${gate.width_cm}×${gate.height_cm}</text>`
    );
  }
  // parcări — zone studiu pe sud (simbolic, cotate din site)
  if (park) {
    pl.push(
      `<text x="${px(40)}" y="${py(1180)}" font-size="8" fill="#555">parcări Cloșca: inset ${park.inset_from_closca_m} m · from_west ${park.from_west_m} m · gap ${park.stall_gap_m} m — neschimbate</text>`
    );
  }
  // cotă separare T2 față de muchie
  const t2 = treadGeom(cts.y, 1);
  pl.push(
    `<text x="${px(cts.x + cts.dx + 6)}" y="${py((t2.yS + podEdge) / 2)}" font-size="7" fill="#1d3557">T2 Y${t2.yS}–${t2.yN}: ${t2.yS - podEdge} cm S de muchie</text>`
  );
  const t3 = treadGeom(cts.y, 2);
  pl.push(
    `<text x="${px(cts.x + cts.dx + 6)}" y="${py(t3.yS + 10)}" font-size="7" fill="#c1121f">T3 sub palier parțial: H nom. ${t3.clear} cm (țintă ≥190, nu 200)</text>`
  );
  pl.push(
    `<text x="${M}" y="${H - 36}" font-size="7" fill="#444">Justificare alee @ Y${alley?.y}: fața sud rampă = Y${cts.y + cts.dy}; fără distanță arbitrară; staționare = dy alee ${alley?.dy} cm înaintea coborârii; poarta pe aceeași bandă Y.</text>`
  );
  pl.push(
    `<text x="${M}" y="${H - 20}" font-size="7" fill="#444">Înainte: T2 Y972–1000 sub muchie → H=179,667 pe 3 cm. După: T2 în afara palierului. Studii / scară etaj / parcelă = neschimbate.</text>`
  );
  write(
    "outputs/plans/33_v47_a1_court_access_plan_after.svg",
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n<rect width="100%" height="100%" fill="#fafafa"/>\n${pl.join("\n")}\n</svg>\n`
  );

  // —— SECȚIUNE înainte | după
  const Ws = 1100;
  const Hs = 520;
  const scZ = 0.9;
  const scY = 0.55;
  const zRef = 200;
  const zy = (cm) => zRef - cm * scZ;
  const yx = (ycm, ox) => ox + (ycm - 850) * scY;
  const sp = [];
  sp.push(
    `<text x="${Ws / 2}" y="22" text-anchor="middle" font-size="13" font-weight="600">V47 A1 · secțiune înainte / după (+8 cm sud)</text>`
  );
  function drawHalf(ox, y0, title, minClear, minY) {
    sp.push(`<text x="${ox + 40}" y="48" font-size="11" font-weight="600">${title}</text>`);
    sp.push(`<line x1="${ox}" y1="${zy(0)}" x2="${ox + 480}" y2="${zy(0)}" stroke="#6d7f5c"/>`);
    sp.push(
      `<rect x="${yx(pod.y, ox)}" y="${zy(zPod)}" width="${pod.dy * scY}" height="5" fill="#c4b496"/>`
    );
    sp.push(
      `<line x1="${yx(pod.y, ox)}" y1="${zy(zIntr)}" x2="${yx(podEdge, ox)}" y2="${zy(zIntr)}" stroke="#a67c52"/>`
    );
    sp.push(
      `<line x1="${yx(podEdge, ox)}" y1="${zy(-100)}" x2="${yx(podEdge, ox)}" y2="${zy(180)}" stroke="#c1121f" stroke-dasharray="3 2"/>`
    );
    sp.push(`<text x="${yx(podEdge, ox) + 2}" y="${zy(zIntr) - 4}" font-size="7" fill="#c1121f">Y${podEdge}</text>`);
    for (let i = 0; i < 6; i++) {
      const t = treadGeom(y0, i);
      sp.push(
        `<rect x="${yx(t.yS, ox)}" y="${zy(t.zTop)}" width="${28 * scY}" height="4" fill="#e0c888" stroke="#333"/>`
      );
    }
    if (minClear != null) {
      sp.push(
        `<line x1="${yx(minY, ox)}" y1="${zy(0 - (95 / 6) * (minY < y0 + 168 - 56 ? 2 : 3))}" x2="${yx(minY, ox)}" y2="${zy(zIntr)}" stroke="#c1121f" stroke-width="2"/>`
      );
      sp.push(
        `<text x="${yx(minY, ox) + 4}" y="${zy(40)}" font-size="9" fill="#c1121f">min ${minClear} cm</text>`
      );
    }
  }
  // înainte: T2 overlap → 179.667 @ ~Y973.5
  drawHalf(40, 860, "ÎNAINTE Y860–1028", 179.667, 973.5);
  // după: T3 partial → 195.5
  const afterMin = bm.headroom_audit?.court_under_podest?.min_clear_cm ?? 195.5;
  const afterY = bm.headroom_audit?.court_under_podest?.min_at?.y_cm ?? 963.5;
  drawHalf(560, 868, "DUPĂ Y868–1036", afterMin, afterY);
  sp.push(
    `<text x="40" y="${Hs - 24}" font-size="8" fill="#444">Intrados podest_se +${zIntr} cm · T2 înainte sub muchie (3 cm) · T2 după: 5 cm separare · T3 după: H nom. 195,5 pe lățimea utilă ≥190 · nu se declară 200</text>`
  );
  write(
    "outputs/plans/34_v47_a1_court_access_section_before_after.svg",
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
  const md = `# V47 Runda A — studiu A1

## Status
**${c.status_label || (c.feasible_a1 ? "A1 FEZABIL" : "A1 NEFEZABIL / STUDIU DESCHIS")}** — \`v47_exact.json\` **neatins**.

Checks geometrice fără eșecuri critice: ${c.ok ? "da" : "nu"} · Fezabilitate A1: **${c.feasible_a1 ? "da" : "nu"}**

### Observații deschise (blochează fezabilitatea)
${(c.open_issues || []).map((x) => `- ${x}`).join("\n") || "- (niciuna)"}

## Traseu
\`${c.path}\`

## Planșeu peste palierul inferior
- Puț deschis în planșeu: **Y${bm.open_shaft_cm.y}–${bm.open_shaft_cm.y + bm.open_shaft_cm.dy}** (sub rampă2)
- Palier acoperit: **Y${bm.slab_coordination_cm.covered_landing.y}–${bm.slab_coordination_cm.covered_landing.y + bm.slab_coordination_cm.covered_landing.dy}** sub soffit ${bm.slab_coordination_cm.covered_landing.soffit_cm} → clear țintă **${bm.slab_coordination_cm.covered_landing.clear_under_cm} cm**
- Gabarit real pe palier acoperit (sample): ${c.headroom_covered_landing ? `${c.headroom_covered_landing.clear_cm} cm @ Y${c.headroom_covered_landing.y_cm} (${c.headroom_covered_landing.element})` : "n/a"}
- Grindă reazem studiu @ Y${bm.slab_coordination_cm.edge_beam_y}


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
Gabarit: **${bm.transport_cm.gabarit_cm.length_along_approach_cm}×${bm.transport_cm.gabarit_cm.width_across_cm}×${bm.transport_cm.gabarit_cm.height_cm} cm** · Goluri montaj **100** / clear **90** (păstrate studiu)

| Prag | Gol montaj | Clear după toc |
|------|----------:|---:|
${(bm.transport_audit?.doors || []).map((xd) => `| ${xd.role} | ${xd.rough_cm} | **${xd.clear_after_frame_cm}** |`).join("\n")}

### Verificare geometrică (nu W+15)
- Status: **${bm.transport_audit?.geometric?.status || "neconfirmat"}** · confirmed=${bm.transport_audit?.confirmed}
- Metodă: ${bm.transport_audit?.geometric?.method}
- Inflate manipulare: ${bm.transport_audit?.geometric?.handling_inflate_cm} cm · foaie: ${JSON.stringify(bm.transport_audit?.geometric?.door_leaf)}

| Pose | unghi | AABB | coliziuni |
|------|------:|------|-----------|
${(bm.transport_audit?.geometric?.poses || []).map((p) => `| ${p.id} | ${p.angleDeg}° | ${p.aabb.dx.toFixed?.(0) ?? p.aabb.dx}×${p.aabb.dy.toFixed?.(0) ?? p.aabb.dy} @ (${p.aabb.x},${p.aabb.y}) | ${p.ok ? "—" : p.collisions.join(", ")} |`).join("\n")}

## Puț / goluri / grosimi
- open_shaft Y${bm.open_shaft_cm.y}–${bm.open_shaft_cm.y + bm.open_shaft_cm.dy}
- zid N @ Y${bm.lower_landing.y - bm.wall_thickness_study_cm.shaft_north_cm}–${bm.lower_landing.y}
- gol palier–hol: Y${bm.door_to_rooms.y}–${bm.door_to_rooms.y + bm.door_to_rooms.dy} (gol ${bm.door_to_rooms.rough_opening_cm} → clear ${bm.door_to_rooms.clear_after_frame_cm})
- EST puț: ${bm.wall_thickness_study_cm.shaft_east_cm} cm · VEST: ${bm.wall_thickness_study_cm.shaft_west_cm} cm

## Fundație / parcelă
Model: **talpă pe beton**; cărămidă sono = umplutură neportantă; **termosistem 8+2 în afara fundației**.

- Inset față de finit: **${volume?.site?.foundation_inset_from_finished_cm ?? "?"} cm**
- Clip: \`${JSON.stringify(volume?.site?.foundation_clip_cm)}\`
- Talpă beton all_inside=${volume?.site?.foundation_all_inside}
- Legacy greșit (+15 pe finit) all_inside=${volume?.site?.foundation_legacy_plus15_all_inside} — **nu mutați casa din cauza lui**

| Punct (talpă beton) | inside | overflow_m |
|-------|:------:|-----------:|
${found.map((f) => `| ${f.id} | ${f.inside} | ${f.overflow_m} |`).join("\n") || "| (volum lipsă) | | |"}

## Arii P/E (recalculate după coordonare planșeu)
Metodă: ${v.areas_cm.useful_recalc_a1?.method}

| | m² |
|--|---:|
| util geometric P/E (recalcul) | **${v.areas_cm.useful_geometric_m2}** |
| util ref anterior | ${v.areas_cm.useful_ref_copied_was} |
| Δ după coordonare planșeu | ${v.areas_cm.useful_delta_vs_ref_m2} |
| anvelopă shoelace | ${v.areas_cm.useful_recalc_a1?.envelope_shoelace_m2} |
| pereți int net | ${v.areas_cm.useful_recalc_a1?.walls_net_m2} |
| subsol brut camere | ${bm.areas.total_brut_rooms_m2} |
| subsol util estimat | ${bm.areas.util_estimat_m2} |
| POT anvelopă/147 | ${c.pot_envelope_over_147}% (limită admisă = deschisă) |

Notă: coordonarea planșeului (gol doar Y590–860) nu modifică poligonul interior P/E; utilul e reafirmat prin recalcul independent, nu prin copiere.

## Rampă curte + podest_se (test +8 cm sud)
- Trepte: Y${bm.court_to_access_steps.y}–${bm.court_to_access_steps.y + bm.court_to_access_steps.dy} (6×28, 0→−95)
- Palier −95: Y${bm.upper_landing.y}–${bm.upper_landing.y + bm.upper_landing.dy} (L=${bm.upper_landing.dy} cm, continuu)
- Alee/poartă: Y${v.site_access_cm?.pedestrian?.path?.segments_cm?.[0]?.y} (racord 0 cm)
- Min H sub podest_se (lățime utilă): **${hr?.court_under_podest?.min_clear_cm ?? "n/a"} cm** (țintă ≥190; **nu** se declară 200)
- Intrados podest_se: +${hr?.podest_se_intrados_cm} · muchie Y${hr?.podest_se_edge_y}

## Fișiere
- \`data/building/v47_a1_study.json\`
- \`outputs/plans/31_v47_a1_subsol_plan.svg\`
- \`outputs/plans/32_v47_a1_access_section.svg\`
- \`outputs/plans/33_v47_a1_court_access_plan_after.svg\`
- \`outputs/plans/34_v47_a1_court_access_section_before_after.svg\`
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
  exportCourtAccessBeforeAfter(study);
  writeReport(study, volume);

  console.log(
    JSON.stringify(
      {
        ok: study.basement_cm.a1_checks.ok,
        feasible_a1: study.basement_cm.a1_checks.feasible_a1,
        status: study.basement_cm.a1_checks.status_label,
        open_issues: study.basement_cm.a1_checks.open_issues,
        fails: study.basement_cm.a1_checks.fails,
        transport: study.basement_cm.a1_checks.transport?.status,
        covered_clear: study.basement_cm.a1_checks.headroom_covered_landing,
        shaft: study.basement_cm.open_shaft_cm,
        useful: study.areas_cm.useful_geometric_m2,
        court_under_podest: study.basement_cm.headroom_audit?.court_under_podest,
        court_steps: study.basement_cm.court_to_access_steps,
        alley_y: study.site_access_cm?.pedestrian?.path?.segments_cm?.[0]?.y,
        files: [
          "data/building/v47_a1_study.json",
          "outputs/plans/31_v47_a1_subsol_plan.svg",
          "outputs/plans/32_v47_a1_access_section.svg",
          "outputs/plans/33_v47_a1_court_access_plan_after.svg",
          "outputs/plans/34_v47_a1_court_access_section_before_after.svg",
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
