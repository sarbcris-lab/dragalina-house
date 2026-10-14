/**
 * Volum 3D din: poligon CF + footprint + program sit v05 (parcări + poartă).
 * Output: outputs/plans/04_volume_concept_v01.json + viewer/data/volume.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function write(rel, obj) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function pointAlong(chain, s) {
  let rem = s;
  for (let i = 0; i < chain.length - 1; i++) {
    const len = dist(chain[i], chain[i + 1]);
    if (rem <= len) return lerp(chain[i], chain[i + 1], rem / len);
    rem -= len;
  }
  return { ...chain[chain.length - 1] };
}

function chainLen(chain) {
  let s = 0;
  for (let i = 0; i < chain.length - 1; i++) s += dist(chain[i], chain[i + 1]);
  return s;
}

function offsetPolyline(pts, leftDist) {
  // offset 2D polyline to the "left" when walking the chain
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[i];
    const c = pts[Math.min(pts.length - 1, i + 1)];
    const dx = c.x - a.x;
    const dy = c.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    out.push({ x: b.x + nx * leftDist, y: b.y + ny * leftDist });
  }
  return out;
}

function sampleArc(center, r, a0, a1, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    pts.push({ x: center.x + r * Math.cos(t), y: center.y + r * Math.sin(t) });
  }
  return pts;
}

function polyArea(pts) {
  const p = pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y
    ? pts.slice(0, -1)
    : pts;
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const j = (i + 1) % p.length;
    a += p[i].x * p[j].y - p[j].x * p[i].y;
  }
  return Math.abs(a / 2);
}

function extrude(id, polygon, z0, z1, color, meta = {}) {
  const ring = polygon.map((p) => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3) }));
  if (ring.length && (ring[0].x !== ring[ring.length - 1].x || ring[0].y !== ring[ring.length - 1].y)) {
    ring.push({ ...ring[0] });
  }
  return {
    id,
    type: "extrude",
    polygon: ring,
    z0_m: z0,
    z1_m: z1,
    color,
    area_m2: +polyArea(ring).toFixed(2),
    ...meta,
  };
}

function ribbon(id, centerline, width, z0, z1, color, meta = {}) {
  return {
    id,
    type: "ribbon",
    centerline: centerline.map((p) => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3) })),
    width_m: width,
    z0_m: z0,
    z1_m: z1,
    color,
    ...meta,
  };
}

function slab(id, polygon, z, thickness, color, meta = {}) {
  return extrude(id, polygon, z, z + thickness, color, meta);
}

function main() {
  const parcel = read("data/site/parcel.json");
  const polygon = read("data/site/parcel_polygon_cf.json");
  const footprint = read("data/building/footprint_v01.json");
  const program = read("data/building/site_program_v05.json");
  const gate = read("data/site/gate_poarta_v05.json");

  const byId = Object.fromEntries(
    polygon.vertices_m.filter((v, i, a) => i < a.length - 1).map((v) => [v.id, v])
  );

  const meshes = [];

  // --- teren (slab subțire pe poligon CF) ---
  meshes.push(
    slab("teren_cf", polygon.vertices_m, -0.05, 0.06, "#7a8f6a", {
      label: "Parcelă CF 54602",
    })
  );

  // --- amprentă clădire: corp + bandă acces extrudate ---
  const bodyPoly = footprint.footprint.body;
  const accessPoly = footprint.footprint.access_band;
  const hP = program.building.levels[0].height_m;
  const hE = program.building.levels[1].height_m;

  meshes.push(extrude("corp_parter", bodyPoly, 0, hP, "#cfd8e6", { level: "parter" }));
  meshes.push(extrude("corp_etaj", bodyPoly, hP, hP + hE, "#b0bec9", { level: "etaj" }));
  meshes.push(extrude("acoperis", bodyPoly, hP + hE, hP + hE + 0.25, "#6b6358"));

  // bandă acces: scară / palier / terasă — volume joase distincte
  const acc = accessPoly.slice(0, -1);
  // split access band W→E by program ratios on average chord
  const SW = acc.find((p) => p.id === "SW_west") || acc[2];
  const SE = acc.find((p) => p.id === "SE_drag") || acc[1];
  const AccSW = acc.find((p) => p.id === "AccSW") || acc[3];
  const AccSE = acc.find((p) => p.id === "AccSE") || acc[0];

  const zones = program.building.access_zones_ew;
  const totalEw = zones.terasa_m + zones.acces_m + zones.scara_m;
  const tTer = zones.terasa_m / totalEw;
  const tAcc = (zones.terasa_m + zones.acces_m) / totalEw;

  const splitQuad = (t0, t1) => {
    const a = lerp(SW, SE, t0);
    const b = lerp(SW, SE, t1);
    const c = lerp(AccSW, AccSE, t1);
    const d = lerp(AccSW, AccSE, t0);
    return [a, b, c, d, a];
  };

  meshes.push(extrude("terasa_p", splitQuad(0, tTer), 0.05, 0.35, "#9cbb8a", { label: "Terasă" }));
  meshes.push(extrude("palier_p", splitQuad(tTer, tAcc), 0.05, 0.35, "#d5dde8", { label: "Acces" }));
  meshes.push(extrude("scara_vol", splitQuad(tAcc, 1), 0.05, hP + 0.15, "#8a93a3", { label: "Scară L" }));
  // terasă etaj (placă)
  meshes.push(extrude("terasa_e", splitQuad(0, tTer), hP, hP + 0.2, "#8faf7a", { label: "Terasă etaj" }));

  // --- parcări pe Cloșca ---
  const closca = [byId[10], byId[1]];
  const westChain = [byId[7], byId[8], byId[9], byId[10]];
  const park = program.parking;
  const tech = park.clearance_west_tech_m;
  const stallW = park.stall_w_m;
  const stallD = park.stall_d_m;

  // origine SV: de la pct 10 pe Cloșca spre est, cu retractare tehn. vest
  const c0 = byId[10];
  const c1 = byId[1];
  const alongClosca = { x: c1.x - c0.x, y: c1.y - c0.y };
  const closcaLen = Math.hypot(alongClosca.x, alongClosca.y);
  const Tx = alongClosca.x / closcaLen;
  const Ty = alongClosca.y / closcaLen;
  // inward (nord) = left of Closca walking 10→1 (est)
  let Nx = -Ty;
  let Ny = Tx;
  if (Ny < 0) {
    Nx = -Nx;
    Ny = -Ny;
  }

  const parkOrigin = {
    x: c0.x + Tx * tech + Nx * 0.15,
    y: c0.y + Ty * tech + Ny * 0.15,
  };

  function stallPoly(index) {
    const ox = parkOrigin.x + Tx * index * (stallW + 0.35);
    const oy = parkOrigin.y + Ty * index * (stallW + 0.35);
    const p0 = { x: ox, y: oy };
    const p1 = { x: ox + Tx * stallW, y: oy + Ty * stallW };
    const p2 = { x: p1.x + Nx * stallD, y: p1.y + Ny * stallD };
    const p3 = { x: p0.x + Nx * stallD, y: p0.y + Ny * stallD };
    return [p0, p1, p2, p3, p0];
  }

  meshes.push(slab("auto_1", stallPoly(0), 0.02, 0.04, "#4a5562", { label: "Auto 1 2.5×5" }));
  meshes.push(slab("auto_2", stallPoly(1), 0.02, 0.04, "#4a5562", { label: "Auto 2 2.5×5" }));

  // zonă manevră (slab transparent între parcări și bandă acces)
  const fpMinY = Math.min(...footprint.footprint.outer.map((p) => p.y));
  const manY1 = stallD + 0.3;
  const manPoly = [
    { x: c0.x + Nx * manY1, y: c0.y + Ny * manY1 },
    { x: c1.x + Nx * manY1, y: c1.y + Ny * manY1 },
    { x: c1.x + Nx * (fpMinY - 0.2), y: Math.min(c1.y + Ny * (fpMinY - 0.2), fpMinY - 0.1) },
    { x: c0.x + Nx * (fpMinY - 0.2), y: Math.min(c0.y + Ny * (fpMinY - 0.2), fpMinY - 0.1) },
    { x: c0.x + Nx * manY1, y: c0.y + Ny * manY1 },
  ];
  // simpler axis-ish maneuver slab
  const manSimple = [
    { x: 0.3, y: stallD + 0.2 },
    { x: 8.5, y: stallD + 0.2 },
    { x: 8.5, y: fpMinY - 0.15 },
    { x: 0.3, y: fpMinY - 0.15 },
    { x: 0.3, y: stallD + 0.2 },
  ];
  meshes.push(slab("manevra", manSimple, 0.01, 0.03, "#5c6b52", { label: "Manevră", opacity: 0.55 }));

  // --- poartă: închisă pe Cloșca + deschisă pe vest (ghost) ---
  const gH = gate.height_m;
  const gT = gate.thickness_m;
  const R = gate.corner_radius_m;

  // closed centerline: along Closca, inset
  const closedLine = [
    { x: c0.x + Tx * 0.15 + Nx * gate.closed.y_offset_m, y: c0.y + Ty * 0.15 + Ny * gate.closed.y_offset_m },
    { x: c1.x - Tx * 0.15 + Nx * gate.closed.y_offset_m, y: c1.y - Ty * 0.15 + Ny * gate.closed.y_offset_m },
  ];
  meshes.push(
    ribbon("poarta_inchisa", closedLine, gT, 0, gH, "#c4a35a", {
      label: "Poartă ÎNCHISĂ (Cloșca)",
      state: "closed",
    })
  );

  // open path: curve at SW + along west
  const corner = {
    x: c0.x + Tx * R + Nx * R,
    y: c0.y + Ty * R + Ny * R,
  };
  // arc from Closca direction to west (northward)
  // Closca walks east; open gate goes north along west → arc from angle facing south-ish to west
  const arc = sampleArc(corner, R, -Math.PI / 2, Math.PI, 14);
  // west retract: from end of arc northward along west
  const westDir = { x: byId[9].x - byId[10].x, y: byId[9].y - byId[10].y };
  const wLen = Math.hypot(westDir.x, westDir.y) || 1;
  const Wx = westDir.x / wLen;
  const Wy = westDir.y / wLen;
  // start open line near SW on west, going north
  const openStart = {
    x: c0.x + Tx * gate.open.x_offset_m + Nx * 0.05 + Wx * (R * 0.2),
    y: c0.y + Ty * gate.open.x_offset_m + Ny * 0.05 + Wy * (R * 0.2),
  };
  const openEnd = {
    x: openStart.x + Wx * gate.retract_along_west_m,
    y: openStart.y + Wy * gate.retract_along_west_m,
  };
  const openLine = [openStart, openEnd];
  meshes.push(
    ribbon("poarta_deschisa", openLine, gT, 0, gH, "#e8d5a3", {
      label: "Poartă DESCHISĂ (vest) — poziție alternativă",
      state: "open",
      opacity: 0.55,
    })
  );
  // șină curbă (marcaj jos)
  meshes.push(
    ribbon("sina_curba", arc, 0.12, 0.02, 0.08, "#888888", {
      label: `Șină R=${R} m`,
    })
  );

  // bandă tehnică vest (slab)
  const techPoly = [
    { x: 0.0, y: 0.0 },
    { x: tech, y: 0.0 },
    { x: tech, y: gate.retract_along_west_m + 0.5 },
    { x: 0.0, y: gate.retract_along_west_m + 0.5 },
    { x: 0.0, y: 0.0 },
  ];
  meshes.push(slab("banda_tehnica_vest", techPoly, 0.015, 0.025, "#6d5c4d", { label: "Bandă tehnică 0.35" }));

  // gard / calcan vest scurt vizual (perete foc)
  const westFence = [byId[10], byId[9], byId[8], byId[7]];
  meshes.push(
    ribbon("calcan_vest", westFence, 0.12, 0, 2.2, "#9a8b7a", {
      label: "Limită vest / perete foc",
      opacity: 0.35,
    })
  );

  const volume = {
    meta: {
      id: "volume_v05_integrat",
      generated: new Date().toISOString(),
      status: "CONCEPT_3D_DIN_PLAN_V05",
      source_plan: "inputs/Plan_integrat_poarta_v05.png",
      warning:
        "3D din poligon CF + footprint pe 3 limite + poartă/parcări din planul integrat v05. Nu e proiect autorizabil.",
      units: "meters",
      coords: "x est, y nord pe plan; z sus. Viewer: Three y=up → (x,z,y).",
      gate_default_state: "closed",
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
      program: program.meta,
      gate: gate.meta,
    },
    building_summary: {
      footprint_gross_m2: footprint.areas.footprint_gross_m2,
      body_m2: footprint.areas.body_m2,
      access_band_m2: footprint.areas.access_band_m2,
      parking: "2 × 2.50×5.00 pe Cloșca",
      gate: gate.meta.title,
    },
    meshes,
  };

  write("outputs/plans/04_volume_concept_v01.json", volume);
  write("viewer/data/volume.json", volume);

  console.log(
    JSON.stringify(
      {
        ok: true,
        meshes: meshes.map((m) => m.id),
        footprint_m2: footprint.areas.footprint_gross_m2,
        gate: gate.type,
      },
      null,
      2
    )
  );
}

main();
