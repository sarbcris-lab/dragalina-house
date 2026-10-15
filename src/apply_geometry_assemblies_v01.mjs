/**
 * Update geometric: A2 +13 mm spre exterior (păstrează fețele interioare),
 * A8 baie 12.5 → 15 cm, envelope + note arii.
 * Recentrează x astfel încât fața vest finită = 0.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const write = (rel, obj) => {
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + "\n");
};

const A2_DELTA_CM = 1.3;
const A8_TH_CM = 15;

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

function shiftRect(o, dx, dy) {
  if (!o || typeof o !== "object") return;
  if (typeof o.x === "number") o.x = +(o.x + dx).toFixed(4);
  if (typeof o.y === "number") o.y = +(o.y + dy).toFixed(4);
}

function shiftList(arr, dx, dy) {
  for (const o of arr || []) shiftRect(o, dx, dy);
}

function shiftDeepBuilding(data, dx, dy) {
  const keys = [
    "walls_cm",
    "furniture_cm",
    "openings_cm",
    "parapets_cm",
    "rooms_cm",
    "path_overlays_cm",
    "columns_cm",
    "beams_cm",
  ];
  for (const k of keys) shiftList(data[k], dx, dy);

  if (data.interior_polygon_cm?.vertices) {
    data.interior_polygon_cm.vertices = data.interior_polygon_cm.vertices.map((p) =>
      Array.isArray(p) ? [+(p[0] + dx).toFixed(4), +(p[1] + dy).toFixed(4), ...p.slice(2)] : p
    );
  }
  if (data.roof_cm?.covers_cm) shiftRect(data.roof_cm.covers_cm, dx, dy);
  if (data.roof_cm?.ridge && typeof data.roof_cm.ridge.y_cm === "number") {
    data.roof_cm.ridge.y_cm = +(data.roof_cm.ridge.y_cm + dy).toFixed(4);
  }
  // nested MEP / hydro points
  for (const block of [data.mep_cm, data.hydro_cm, data.electrical_cm, data.basement_cm]) {
    if (!block) continue;
    JSON.stringify(block); // no-op keep ref
    const walk = (o, d = 0) => {
      if (!o || typeof o !== "object" || d > 10) return;
      if (Array.isArray(o)) return o.forEach((e) => walk(e, d + 1));
      if (typeof o.x === "number" && typeof o.y === "number") shiftRect(o, dx, dy);
      for (const v of Object.values(o)) walk(v, d + 1);
    };
    walk(block);
  }
  if (data.structure_frame_study_cm) {
    const walk = (o, d = 0) => {
      if (!o || typeof o !== "object" || d > 10) return;
      if (Array.isArray(o)) return o.forEach((e) => walk(e, d + 1));
      if (typeof o.x === "number") o.x = +(o.x + dx).toFixed(4);
      if (typeof o.y === "number") o.y = +(o.y + dy).toFixed(4);
      if (typeof o.x0 === "number") o.x0 = +(o.x0 + dx).toFixed(4);
      if (typeof o.y0 === "number") o.y0 = +(o.y0 + dy).toFixed(4);
      if (typeof o.x1 === "number") o.x1 = +(o.x1 + dx).toFixed(4);
      if (typeof o.y1 === "number") o.y1 = +(o.y1 + dy).toFixed(4);
      for (const v of Object.values(o)) {
        if (v && typeof v === "object") walk(v, d + 1);
      }
    };
    walk(data.structure_frame_study_cm);
  }
}

function expandA2Walls(walls) {
  for (const w of walls) {
    if (w.removed) continue;
    if ((w.catalog_id || w.assembly) !== "A2") continue;
    if (w.id === "vest") {
      w.x = +(w.x - A2_DELTA_CM).toFixed(4);
      w.dx = +(w.dx + A2_DELTA_CM).toFixed(4);
    } else if (w.id === "est_living" || w.id === "est_recuperat_p") {
      w.dx = +(w.dx + A2_DELTA_CM).toFixed(4);
    } else if (w.id === "sud_bucatarie" || w.id === "dormitor_sud") {
      w.dy = +(w.dy + A2_DELTA_CM).toFixed(4);
    }
    w.thickness_finished_mm = 312;
    w.geometry_note = `A2 +${A2_DELTA_CM} cm spre exterior`;
  }
}

function thickenA8(walls) {
  for (const w of walls) {
    if (w.removed) continue;
    if ((w.catalog_id || w.assembly) !== "A8") continue;
    const old = Math.max(w.dx, w.dy) >= Math.min(w.dx, w.dy) ? (w.dx <= w.dy ? w.dx : w.dy) : w.dy;
    // thickness along thin axis
    const thinIsDx = w.dx <= w.dy;
    const oldTh = thinIsDx ? w.dx : w.dy;
    const grow = A8_TH_CM - oldTh;
    if (grow < 0.05) {
      w.thickness_finished_mm = 150;
      continue;
    }
    if (w.id === "dorm_baie_nord") {
      w.y = +(w.y - grow).toFixed(4);
      w.dy = A8_TH_CM;
    } else if (w.id === "nisa_dulap_spate") {
      w.dy = A8_TH_CM;
    } else if (w.id === "nisa_dulap_est") {
      w.x = +(w.x - grow).toFixed(4);
      w.dx = A8_TH_CM;
    } else if (thinIsDx) {
      w.dx = A8_TH_CM;
    } else {
      w.dy = A8_TH_CM;
    }
    w.thickness_finished_mm = 150;
    w.geometry_note = `A8 → ${A8_TH_CM} cm`;
  }
}

function patchStudy(rel) {
  const data = read(rel);
  if (data.meta?.geometry_assemblies_applied === "v01") {
    console.log("skip (already applied)", rel);
    return;
  }
  const before = {
    ew: data.envelope_cm.ew,
    ns: data.envelope_cm.ns,
  };

  expandA2Walls(data.walls_cm || []);
  thickenA8(data.walls_cm || []);
  shiftDeepBuilding(data, A2_DELTA_CM, 0);

  const ew = +(before.ew + 2 * A2_DELTA_CM).toFixed(4);
  const ns = +(before.ns + A2_DELTA_CM).toFixed(4);
  data.envelope_cm = { ew, ns };
  data.meta = {
    ...data.meta,
    geometry_assemblies_applied: "v01",
    envelope_preserved: `${ew} × ${ns} cm — A2 +${A2_DELTA_CM} cm E/S/V`,
    rev_note_geometry_assemblies: `A2 +${A2_DELTA_CM}cm exterior; A8 ${A8_TH_CM}cm; x recentrat pe vest finit=0`,
  };

  if (data.roof_cm) {
    data.roof_cm.covers_cm = data.roof_cm.covers_cm || {};
    data.roof_cm.covers_cm.x0 = 0;
    data.roof_cm.covers_cm.y0 = 0;
    data.roof_cm.covers_cm.x1 = ew;
    data.roof_cm.covers_cm.y1 = ns;
    if (data.roof_cm.ridge) {
      data.roof_cm.ridge.length_cm = ew;
      data.roof_cm.ridge.on_side_m = +(ew / 100).toFixed(3);
    }
  }

  const footprint = +((ew * ns) / 10000).toFixed(4);
  const beforeFp = +((before.ew * before.ns) / 10000).toFixed(4);
  const areas = data.areas_cm || {};
  areas.envelope_gross_m2 = footprint;
  areas.envelope_before_A2_m2 = beforeFp;
  areas.envelope_delta_A2_m2 = +(footprint - beforeFp).toFixed(4);
  areas.pot_candidate_pct_on_147 = +((footprint / 147) * 100).toFixed(2);
  areas.pot_note = `amprentă ${footprint} m² (înainte ${beforeFp}); A2 +${A2_DELTA_CM}cm E/S/V; POT pe 147 ≈ ${areas.pot_candidate_pct_on_147}% — neconfirmat`;
  if (data.interior_polygon_cm?.vertices) {
    areas.envelope_interior_shoelace_m2 = +(
      shoelaceCm2(data.interior_polygon_cm.vertices) / 10000
    ).toFixed(6);
  }
  areas.geometry_assemblies_v01 = {
    A2_delta_cm: A2_DELTA_CM,
    A8_cm: A8_TH_CM,
    envelope_cm: { ew, ns },
    useful_note: "A2 exterior → util uscat ≈ neschimbat; A8 reduce clar baie",
  };
  data.areas_cm = areas;

  if (data.construction_assemblies?.facade_cladding) {
    data.construction_assemblies.facade_cladding.pot_sensitivity = {
      A2_delta_mm_per_face: 13,
      envelope_cm: { ew, ns },
      footprint_m2: footprint,
      footprint_before_m2: beforeFp,
      delta_m2: areas.envelope_delta_A2_m2,
      status: "geometry_updated",
    };
  }

  write(rel, data);
  console.log(JSON.stringify({ file: rel, before, after: { ew, ns, footprint, delta: areas.envelope_delta_A2_m2 } }, null, 2));
}

patchStudy("data/building/v47_a1_study.json");
patchStudy("data/building/v47_a1_frame_study.json");
console.log("geometry assemblies applied");
