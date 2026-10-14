/**
 * 3D EXACT din Audit V45 — pereți, camere, mobilier, P+1 pe poligon CF.
 * Local V45 (cm): NV origine, X→est, Y→sud.
 * Sit: x est, y nord.
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

const m = (cm) => cm / 100;

function main() {
  const v45 = read("data/building/v45_exact.json");
  const polygon = read("data/site/parcel_polygon_cf.json");
  const parcel = read("data/site/parcel.json");
  const gate = read("data/site/gate_poarta_v05.json");
  const program = read("data/building/site_program_v05.json");

  const byId = Object.fromEntries(
    polygon.vertices_m.filter((v, i, a) => i < a.length - 1).map((v) => [v.id, v])
  );
  // Front pe Dragalina: axa Y locală urmează lanțul 5→1; X spre vest (în lot).
  // Fațada est (X = ew) stă pe limita Dragalina. Mic offset de la pct 5 ca NV să rămână în parcelă.
  const P5 = byId[5];
  const P7 = byId[7];
  const dragChain = [5, 4, 3, 2, 1].map((id) => byId[id]);

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

  // tangent Dragalina la nord (N→S)
  const t0 = {
    x: dragChain[1].x - dragChain[0].x,
    y: dragChain[1].y - dragChain[0].y,
  };
  const tLen = Math.hypot(t0.x, t0.y) || 1;
  const Tx = t0.x / tLen;
  const Ty = t0.y / tLen;
  // inward = spre vest / interior
  let Ix = -Ty;
  let Iy = Tx;
  if (P5.x + Ix * 2 > P5.x) {
    Ix = -Ix;
    Iy = -Iy;
  }

  const ew = m(v45.envelope_cm.ew);
  const ns = m(v45.envelope_cm.ns);

  function insideParcel(pt) {
    const pts = polygon.vertices_m.slice(0, -1);
    let odd = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const yi = pts[i].y;
      const yj = pts[j].y;
      const xi = pts[i].x;
      const xj = pts[j].x;
      if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi)
        odd = !odd;
    }
    return odd;
  }

  function distPointToSegment(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const len2 = abx * abx + aby * aby || 1e-12;
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = a.x + t * abx;
    const qy = a.y + t * aby;
    return Math.hypot(p.x - qx, p.y - qy);
  }

  function overflowDistanceM(pt) {
    if (insideParcel(pt)) return 0;
    const pts = polygon.vertices_m.slice(0, -1);
    let dMin = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      dMin = Math.min(dMin, distPointToSegment(pt, a, b));
    }
    return dMin;
  }

  function cornerAt(along0) {
    const to = (lx, ly) => {
      const on = pointAlong(dragChain, along0 + ly);
      const depth = ew - lx;
      return { x: on.x + Ix * depth, y: on.y + Iy * depth };
    };
    return {
      NW: to(0, 0),
      NE: to(ew, 0),
      SE: to(ew, ns),
      SW: to(0, ns),
      to,
    };
  }

  // cel mai mic offset pe Dragalina (de la pct 5) ca toate colțurile să fie în parcelă
  let along0 = 0;
  for (let a = 0; a <= 1.2; a += 0.05) {
    const c = cornerAt(a);
    if ([c.NW, c.NE, c.SE, c.SW].every((pt) => insideParcel(pt))) {
      along0 = a;
      break;
    }
    along0 = a;
  }
  // mic buffer
  along0 = Math.min(along0 + 0.05, 1.0);
  const placed = cornerAt(along0);
  const toSiteXY = placed.to;

  /** local cm → site meters (X vest→est, Y nord→sud; est = pe Dragalina) */
  function toSite(lcmX, lcmY) {
    const p = toSiteXY(m(lcmX), m(lcmY));
    return { x: +p.x.toFixed(4), y: +p.y.toFixed(4) };
  }

  function rectPoly(x, y, dx, dy) {
    const a = toSite(x, y);
    const b = toSite(x + dx, y);
    const c = toSite(x + dx, y + dy);
    const d = toSite(x, y + dy);
    return [a, b, c, d, a];
  }

  // FF = fața SUPERIOARĂ a pardoselii finite; grosimi sub FF. 288 = 18×16.
  const ht = v45.heights_cm;
  const st = v45.stair_cm;
  const riser = m(ht.riser_cm);
  const ffToFf = m(ht.ff_to_ff_cm);
  const wallH = m(
    ht.wall_to_soffit_cm ??
      ((ht.clear_to_false_ceiling_cm || 0) + (ht.false_ceiling_cm || 0) ||
        ht.ff_to_ff_cm)
  );
  const floorTh = m(ht.floor_buildup_below_ff_cm || 12);
  const treadTh = Math.min(riser, 0.06);
  // Elevație FF parter = ipoteză (2 trepte × riser); nu cotă teren confirmată
  const zParter = (ht.entry_steps_to_terrace || 2) * (m(ht.entry_step_riser_cm || ht.riser_cm));
  const zEtaj = zParter + ffToFf;
  const H = wallH;
  const meshes = [];

  // Teren CF
  meshes.push({
    id: "teren_cf",
    type: "extrude",
    polygon: polygon.vertices_m,
    z0_m: -0.05,
    z1_m: 0.02,
    color: "#6d7f5c",
    label: "Parcelă CF",
  });

  const env = rectPoly(0, 0, v45.envelope_cm.ew, v45.envelope_cm.ns);
  meshes.push({
    id: "amprenta_v44",
    type: "extrude",
    polygon: env,
    z0_m: 0.02,
    z1_m: 0.04,
    color: "#9aa7b5",
    label: `Amprentă V45 ${v45.envelope_cm.ew / 100}×${v45.envelope_cm.ns / 100} m`,
    opacity: 0.35,
  });

  // 2 trepte ⊥ pe palier: de pe alee (sud) → urcă spre nord pe palierul la elevație
  {
    const es = st.entry_steps;
    const stepDy = es.dy / es.steps;
    // Y crește spre sud: treapta cea mai sudică = cotă 0, urcă spre nord (spre palier)
    for (let i = 0; i < es.steps; i++) {
      const ySouth = es.y + es.dy - (i + 1) * stepDy;
      const z0s = riser * i;
      meshes.push({
        id: `acces_treapta_${i}`,
        type: "extrude",
        polygon: rectPoly(es.x, ySouth, es.dx, stepDy),
        z0_m: z0s,
        z1_m: z0s + Math.max(riser, 0.05),
        color: i % 2 === 0 ? "#a89880" : "#9a8a70",
        label: "2 trepte de pe alee → palier",
      });
    }
  }

  // Palier: față sus = FF
  {
    const pal = st.palier_parter;
    meshes.push({
      id: "palier_parter",
      type: "extrude",
      polygon: rectPoly(pal.x, pal.y, pal.dx, pal.dy),
      z0_m: zParter - floorTh,
      z1_m: zParter,
      color: "#c4b496",
      label: "Palier FF (față sus = FF parter)",
    });
  }

  for (let level = 0; level < v45.levels; level++) {
    const zFf = level === 0 ? zParter : zEtaj;
    const z1 = zFf + H;
    const suffix = level === 0 ? "p" : "e";

    for (const r of v45.rooms_cm) {
      if (r.id === "scara") continue;
      if (r.outdoor) {
        meshes.push({
          id: `${r.id}_${suffix}`,
          type: "extrude",
          polygon: rectPoly(r.x, r.y, r.dx, r.dy),
          z0_m: zFf - floorTh,
          z1_m: zFf,
          color: r.floor,
          label: level === 0 ? "TERASĂ parter FF" : "TERASĂ etaj FF",
        });
        continue;
      }
      meshes.push({
        id: `pardoseala_${r.id}_${suffix}`,
        type: "extrude",
        polygon: rectPoly(r.x, r.y, r.dx, r.dy),
        z0_m: zFf - floorTh,
        z1_m: zFf,
        color: r.floor,
        label: `${r.label} ${suffix} (FF=sus)`,
        opacity: 0.92,
      });
    }

    for (const w of v45.walls_cm) {
      if (w.kind === "parapet") continue;
      const isExt = w.kind === "ext";
      meshes.push({
        id: `zid_${w.id}_${suffix}`,
        type: "extrude",
        polygon: rectPoly(w.x, w.y, w.dx, w.dy),
        z0_m: zFf,
        z1_m: z1,
        color: isExt ? "#d8d2c6" : "#ebe6dc",
        label: w.id,
        kind: w.kind,
      });
    }

    for (const f of v45.furniture_cm) {
      meshes.push({
        id: `mob_${f.id}_${suffix}`,
        type: "extrude",
        polygon: rectPoly(f.x, f.y, f.dx, f.dy),
        z0_m: zFf,
        z1_m: zFf + m(f.h || 40),
        color: f.color,
        label: f.id,
      });
    }

    // Parapete terasă (doar laturi libere)
    if (v45.parapets_cm) {
      for (const p of v45.parapets_cm) {
        meshes.push({
          id: `parapet_${p.id}_${suffix}`,
          type: "extrude",
          polygon: rectPoly(p.x, p.y, p.dx, p.dy),
          z0_m: zFf,
          z1_m: zFf + m(p.h || 105),
          color: "#8a939e",
          label: p.id,
        });
      }
    }
  }

  // Acoperiș corp + terasă + bucătărie (fără placă planșeu pe golul scării)
  const roofZ0 = zEtaj + H;
  const roofZ1 = roofZ0 + 0.22;
  const bandX = st.band_x;
  meshes.push({
    id: "acoperis_vest",
    type: "extrude",
    polygon: rectPoly(0, 0, bandX, v45.envelope_cm.ns),
    z0_m: roofZ0,
    z1_m: roofZ1,
    color: "#5c564e",
    label: "Acoperiș corp / terasă / bucătărie",
  });
  meshes.push({
    id: "acoperis_est_nord",
    type: "extrude",
    polygon: rectPoly(bandX, 0, st.band_dx, st.ramp2.y),
    z0_m: roofZ0,
    z1_m: roofZ1,
    color: "#5c564e",
    label: "Acoperiș est nord",
  });

  const r2 = st.ramp2;
  const f180 = st.flight_180;
  const pod = st.podest_se;
  const palSup = st.palier_superior;
  const n180 = st.risers_flight_180;
  const n330 = st.risers_flight_330;

  // Parapet pe muchia liberă — urcă odată cu fiecare treaptă (nu zid plin pe toată înălțimea)
  const parapetH = m(st.parapet_h_cm || 105);
  const parapetT = st.parapet_thick_cm || 10;

  // Rampă sud: 8 ridicări → 7 călcări × 30; față sus treaptă = cotă de mers
  const tread = st.tread_cm || 30;
  const nTread180 = n180 - 1;
  for (let i = 0; i < nTread180; i++) {
    const xWest = f180.x + i * tread;
    const zTop = zParter + riser * (i + 1);
    meshes.push({
      id: `treapta_rampa180_${i}`,
      type: "extrude",
      polygon: rectPoly(xWest, f180.y + 10, tread, st.width_clear_cm),
      z0_m: zTop - treadTh,
      z1_m: zTop,
      color: i % 2 === 0 ? "#b8a078" : "#a89068",
      label: "Rampă sud (FF treaptă = sus)",
    });
    meshes.push({
      id: `parapet_r180_${i}`,
      type: "extrude",
      polygon: rectPoly(xWest, f180.y + f180.dy - parapetT, tread, parapetT),
      z0_m: zTop,
      z1_m: zTop + parapetH,
      color: "#8a939e",
      label: "Parapet rampa 1",
    });
  }

  // Podest SE: față sus = FF + 128 cm (8×16)
  const zPod = zParter + riser * n180;
  meshes.push({
    id: "podest_se_130",
    type: "extrude",
    polygon: rectPoly(pod.x, pod.y, pod.dx, pod.dy),
    z0_m: zPod - floorTh,
    z1_m: zPod,
    color: "#c4b496",
    label: "Podest SE (FF=+128 cm)",
  });
  meshes.push({
    id: "parapet_podest_sud",
    type: "extrude",
    polygon: rectPoly(pod.x, pod.y + pod.dy - parapetT, pod.dx, parapetT),
    z0_m: zPod,
    z1_m: zPod + parapetH,
    color: "#8a939e",
    label: "Parapet podest SE",
  });
  meshes.push({
    id: "parapet_podest_est",
    type: "extrude",
    polygon: rectPoly(pod.x + pod.dx - parapetT, pod.y, parapetT, pod.dy - parapetT),
    z0_m: zPod,
    z1_m: zPod + parapetH,
    color: "#8a939e",
    label: "Parapet podest SE",
  });

  // Rampă est: 10 ridicări → 9 călcări × 30; FF treaptă = sus
  // Structură rampă (talpă+finisaj) — nu doar plăcuța: determină clear depozit
  const rampStruct = m(st.ramp2_structure_cm || st.storage_under?.door_alt_high?.ramp_structure_cm || 20);
  {
    const nTread330 = n330 - 1;
    const ySouthEdge = r2.y + r2.dy;
    for (let i = 0; i < nTread330; i++) {
      const ySouth = ySouthEdge - (i + 1) * tread;
      const zTopStep = zPod + riser * (i + 1);
      // plăcuță vizibilă pe față
      meshes.push({
        id: `treapta_r2_${i}`,
        type: "extrude",
        polygon: rectPoly(r2.x + 10, ySouth, st.width_clear_cm, tread),
        z0_m: zTopStep - treadTh,
        z1_m: zTopStep,
        color: i % 2 === 0 ? "#8a93a0" : "#7a8390",
        label: "Rampă est (FF treaptă = sus)",
      });
      // structură sub față de mers
      meshes.push({
        id: `structura_r2_${i}`,
        type: "extrude",
        polygon: rectPoly(r2.x, ySouth, r2.dx, tread),
        z0_m: zTopStep - rampStruct,
        z1_m: zTopStep - treadTh,
        color: "#5a6570",
        label: `Structură rampă ${st.ramp2_structure_cm || 20} cm`,
        opacity: 0.9,
      });
      meshes.push({
        id: `parapet_r2_${i}`,
        type: "extrude",
        polygon: rectPoly(r2.x + r2.dx - parapetT, ySouth, parapetT, tread),
        z0_m: zTopStep,
        z1_m: zTopStep + parapetH,
        color: "#8a939e",
        label: "Parapet rampa 2",
      });
      // umplutură depozit până la soffit structură
      const zFill = Math.max(zParter, zTopStep - rampStruct);
      if (zFill > zParter + 0.05) {
        meshes.push({
          id: `depozit_sub_r2_${i}`,
          type: "extrude",
          polygon: rectPoly(r2.x, ySouth, r2.dx, tread),
          z0_m: zParter,
          z1_m: zFill,
          color: i % 2 === 0 ? "#c4b8a0" : "#b8ac94",
          label: "Depozit sub rampă 2 (până la soffit structură)",
          opacity: 0.92,
        });
      }
    }
  }
  // Copertină pe rampa 2 (acoperită) — nu e placă de planșeu
  meshes.push({
    id: "copertina_rampa2",
    type: "extrude",
    polygon: rectPoly(r2.x, r2.y, r2.dx, r2.dy),
    z0_m: roofZ0,
    z1_m: roofZ1,
    color: "#7a7368",
    label: "Copertină rampă 2 (acoperită)",
    opacity: 0.88,
  });

  // Palier superior în puțul scării — NU pe colț exterior în aer
  meshes.push({
    id: "palier_superior",
    type: "extrude",
    polygon: rectPoly(palSup.x, palSup.y, palSup.dx, palSup.dy),
    z0_m: zEtaj - floorTh,
    z1_m: zEtaj,
    color: "#9aa3ad",
    label: "Palier superior FF etaj (față sus)",
  });
  meshes.push({
    id: "parapet_palier_sup_est",
    type: "extrude",
    polygon: rectPoly(r2.x + r2.dx - parapetT, palSup.y, parapetT, palSup.dy),
    z0_m: zEtaj,
    z1_m: zEtaj + parapetH,
    color: "#8a939e",
    label: "Parapet palier superior",
  });

  const depY0 = 465;
  const depY1 = r2.y + r2.dy;
  const depDy = depY1 - depY0;
  meshes.push({
    id: "depozit_pardoseala",
    type: "extrude",
    polygon: rectPoly(st.band_x, depY0, st.band_dx, depDy),
    z0_m: zParter - floorTh,
    z1_m: zParter,
    color: "#d5c9b0",
    label: "Depozit — pardoseală FF",
  });
  meshes.push({
    id: "depozit_sub_palier_intrare",
    type: "extrude",
    polygon: rectPoly(st.band_x, depY0, st.band_dx, r2.y - depY0),
    z0_m: zParter,
    z1_m: zEtaj - floorTh,
    color: "#cfc3ab",
    label: "Depozit sub podest intrare",
    opacity: 0.94,
  });

  // Ușă JOSĂ sud — sub podest: clear ≈ 123 cm — NU acces normal în picioare
  const usaDepW = 90;
  const usaDepX = st.band_x + (st.band_dx - usaDepW) / 2;
  const zidSudY = depY1 - 15;
  const zUsaH = Math.min(1.23, zPod - zParter - 0.05);
  meshes.push({
    id: "depozit_zid_sud_st",
    type: "extrude",
    polygon: rectPoly(st.band_x, zidSudY, usaDepX - st.band_x, 15),
    z0_m: zParter,
    z1_m: zPod,
    color: "#d8d2c6",
    label: "Depozit — zid sud",
  });
  meshes.push({
    id: "depozit_zid_sud_dr",
    type: "extrude",
    polygon: rectPoly(usaDepX + usaDepW, zidSudY, st.band_x + st.band_dx - (usaDepX + usaDepW), 15),
    z0_m: zParter,
    z1_m: zPod,
    color: "#d8d2c6",
    label: "Depozit — zid sud",
  });
  meshes.push({
    id: "depozit_zid_sud_buiandrug",
    type: "extrude",
    polygon: rectPoly(usaDepX, zidSudY, usaDepW, 15),
    z0_m: zParter + zUsaH,
    z1_m: zPod,
    color: "#d8d2c6",
    label: "Depozit — buiandrug (ușă joasă)",
  });
  meshes.push({
    id: "gol_usa_depozit",
    type: "extrude",
    polygon: rectPoly(usaDepX, zidSudY, usaDepW, 15),
    z0_m: zParter,
    z1_m: zParter + zUsaH,
    color: "#e8a0a0",
    opacity: 0.45,
    label: "Ușă depozit JOSĂ ~123 cm (sub podest) — nu acces în picioare",
  });

  // Acces alternativ ÎNALT pe est — Y620–710, clear min cu structură rampă
  {
    const alt = st.storage_under?.door_alt_high || { y0: 620, dy: 90, w_cm: 90, clear_h_cm_min: 204 };
    const altY = alt.y0;
    const altDy = alt.dy;
    const altH = m(alt.clear_h_cm_min || 204);
    const altX = alt.x ?? st.band_x + st.band_dx - 12;
    const wallThick = st.band_x + st.band_dx - altX;
    // zid est: sud de gol (Y710→860), nord de gol (Y590→620), buiandrug deasupra
    const yDoorS = altY + altDy;
    meshes.push({
      id: "depozit_zid_est_sud",
      type: "extrude",
      polygon: rectPoly(altX, yDoorS, wallThick, r2.y + r2.dy - yDoorS),
      z0_m: zParter,
      z1_m: zPod + riser * 5,
      color: "#d8d2c6",
      label: "Depozit — zid est (sud de ușă)",
    });
    meshes.push({
      id: "depozit_zid_est_nord",
      type: "extrude",
      polygon: rectPoly(altX, r2.y, wallThick, altY - r2.y),
      z0_m: zParter,
      z1_m: zPod + riser * 10,
      color: "#d8d2c6",
      label: "Depozit — zid est (nord de ușă)",
    });
    meshes.push({
      id: "depozit_zid_est_buiandrug",
      type: "extrude",
      polygon: rectPoly(altX, altY, wallThick, altDy),
      z0_m: zParter + altH,
      z1_m: zPod + riser * 8,
      color: "#d8d2c6",
      label: "Depozit — buiandrug alt est",
    });
    meshes.push({
      id: "gol_usa_depozit_alt",
      type: "extrude",
      polygon: rectPoly(altX, altY, wallThick, altDy),
      z0_m: zParter,
      z1_m: zParter + altH,
      color: "#8fd4a8",
      opacity: 0.45,
      label: `Ușă depozit ALT est ${alt.w_cm || 90}×${alt.clear_h_cm_min || 204} cm (Y${altY}–${altY + altDy}, struct ${st.ramp2_structure_cm || 20})`,
    });
    // marker traseu exterior pe fața est
    meshes.push({
      id: "traseu_ext_depozit_alt",
      type: "extrude",
      polygon: rectPoly(st.band_x + st.band_dx, altY, 25, altDy),
      z0_m: zParter - 0.02,
      z1_m: zParter + 0.02,
      color: "#4a9e6a",
      opacity: 0.7,
      label: "Traseu exterior → ușă alt depozit",
    });
  }

  // Opening markers (față jos pe FF)
  for (const o of v45.openings_cm) {
    const poly = rectPoly(o.x, o.y, Math.max(o.dx, 8), Math.max(o.dy, 8));
    const sill = o.id.includes("geam") ? 0.9 : 0;
    const oh = o.id.includes("geam") ? 1.5 : 2.1;
    for (let level = 0; level < v45.levels; level++) {
      if (o.id === "intrare" && level === 1) continue;
      const zBase = level === 0 ? zParter : zEtaj;
      meshes.push({
        id: `gol_${o.id}_L${level}`,
        type: "extrude",
        polygon: poly,
        z0_m: zBase + sill,
        z1_m: zBase + sill + oh,
        color: o.id.includes("geam") ? "#8ecae6" : "#c9e4ef",
        opacity: 0.45,
        label: o.id,
      });
    }
  }

  // --- parcări + poartă (din v05, pe Cloșca) ---
  const c0 = byId[10];
  const c1 = byId[1];
  const alongC = { x: c1.x - c0.x, y: c1.y - c0.y };
  const cLen = Math.hypot(alongC.x, alongC.y);
  const Cx = alongC.x / cLen;
  const Cy = alongC.y / cLen;
  let Nx = -Cy;
  let Ny = Cx;
  if (Ny < 0) {
    Nx = -Nx;
    Ny = -Ny;
  }
  const tech = program.parking.clearance_west_tech_m;
  const sw = program.parking.stall_w_m;
  const sd = program.parking.stall_d_m;
  const origin = {
    x: c0.x + Cx * tech + Nx * 0.15,
    y: c0.y + Cy * tech + Ny * 0.15,
  };
  function stall(i) {
    const ox = origin.x + Cx * i * (sw + 0.35);
    const oy = origin.y + Cy * i * (sw + 0.35);
    return [
      { x: ox, y: oy },
      { x: ox + Cx * sw, y: oy + Cy * sw },
      { x: ox + Cx * sw + Nx * sd, y: oy + Cy * sw + Ny * sd },
      { x: ox + Nx * sd, y: oy + Ny * sd },
      { x: ox, y: oy },
    ];
  }
  meshes.push({
    id: "auto_1",
    type: "extrude",
    polygon: stall(0),
    z0_m: 0.02,
    z1_m: 0.06,
    color: "#3d4450",
    label: "Auto 1",
  });
  meshes.push({
    id: "auto_2",
    type: "extrude",
    polygon: stall(1),
    z0_m: 0.02,
    z1_m: 0.06,
    color: "#3d4450",
    label: "Auto 2",
  });

  const closedLine = [
    { x: c0.x + Tx * 0.2 + Nx * 0.12, y: c0.y + Ty * 0.2 + Ny * 0.12 },
    { x: c1.x - Tx * 0.2 + Nx * 0.12, y: c1.y - Ty * 0.2 + Ny * 0.12 },
  ];
  meshes.push({
    id: "poarta_inchisa",
    type: "ribbon",
    centerline: closedLine,
    width_m: gate.thickness_m,
    z0_m: 0,
    z1_m: gate.height_m,
    color: "#c4a35a",
    state: "closed",
    label: "Poartă închisă",
  });
  const openStart = { x: c0.x + 0.2, y: c0.y + 0.3 };
  const openEnd = { x: c0.x + 0.2, y: c0.y + gate.retract_along_west_m };
  meshes.push({
    id: "poarta_deschisa",
    type: "ribbon",
    centerline: [openStart, openEnd],
    width_m: gate.thickness_m,
    z0_m: 0,
    z1_m: gate.height_m,
    color: "#e8d5a3",
    state: "open",
    opacity: 0.6,
    label: "Poartă deschisă",
  });

  const corners = {
    NW: toSite(0, 0),
    NE: toSite(v45.envelope_cm.ew, 0),
    SE: toSite(v45.envelope_cm.ew, v45.envelope_cm.ns),
    SW: toSite(0, v45.envelope_cm.ns),
  };
  const cornersInside = Object.fromEntries(
    Object.entries(corners).map(([k, pt]) => [k, insideParcel(pt)])
  );
  const cornerOverflow_m = Object.fromEntries(
    Object.entries(corners).map(([k, pt]) => {
      const inside = insideParcel(pt);
      const d = overflowDistanceM(pt);
      // PIP false cu d≈0 → pe contur / eroare numerică — raportat explicit
      return [k, { inside, dist_m: +d.toFixed(3), note: !inside && d < 0.02 ? "PIP=false, dist≈0 (contur/numeric)" : null }];
    })
  );
  // anexă scară SE (podest) — punct exterior local
  const stairSeLocal = {
    x: st.band_x + st.band_dx,
    y: st.podest_se.y + st.podest_se.dy,
  };
  const stairSeSite = toSite(stairSeLocal.x, stairSeLocal.y);
  const stairSeInside = insideParcel(stairSeSite);
  const stairSeOverflow_m = +overflowDistanceM(stairSeSite).toFixed(3);

  const volume = {
    meta: {
      id: "volume_v45_exact",
      generated: new Date().toISOString(),
      status: "3D_EXACT_V44",
      source_plan: "inputs/Audit_V43_base_dimensiuni_si_cazare.html",
      warning:
        "FF=față sus pardoseală. 288=255+6+15+3+2+5+2. Util net=shoelace−pereți int. Depozit sud~123; alt est Y620–710 clear≥204 (struct rampă 20cm). Elevație +32=ipoteză.",
      gate_default_state: "closed",
      units: "meters",
      ff_definition: "top_of_finished_floor",
      level_height_m: H,
      floor_buildup_below_ff_m: floorTh,
      z_parter_ff_m: zParter,
      z_etaj_ff_m: zEtaj,
      z_parter_status: "ipoteză (2×riser), nu măsurătoare teren",
      stair: {
        risers_from_ff: 18,
        flight_180: st.risers_flight_180,
        flight_330: st.risers_flight_330,
        riser_cm: ht.riser_cm,
        entry: "2 trepte ⊥ pe palier, de pe aleea pietonală",
        palier_parter: "la cota elevației, pe lângă terasă",
        layout: "L: 8 sud (start vest) + podest SE → 10 est → palier/ușă (+60 sud)",
        covers: "buc+terasă+rampă2 acoperite; 2 trepte+palier elevație+180 descoperite",
      },
      envelope_m: {
        ew: m(v45.envelope_cm.ew),
        ns: m(v45.envelope_cm.ns),
        area_m2: m(v45.envelope_cm.ew) * m(v45.envelope_cm.ns),
      },
    },
    site: {
      polygon_metrics: polygon.metrics,
      confirmed_areas: {
        measured_m2: parcel.confirmed.area_measured_m2,
        from_acts_m2: parcel.confirmed.area_from_acts_m2,
        existing_built_m2: parcel.confirmed.existing_built_ground_m2,
      },
      cf_vertices: polygon.vertices_m,
      footprint_vertices: env,
      v44_corners: corners,
      origin_local: "EST pe Dragalina (lanț 5→1); adâncime spre vest",
      along_dragalina_from_pct5_m: +along0.toFixed(3),
      corners_inside: cornersInside,
      corner_overflow_m: cornerOverflow_m,
      stair_se_site: stairSeSite,
      stair_se_inside: stairSeInside,
      stair_se_overflow_m: stairSeOverflow_m,
      parcel_area_status: "aproximativ (reconstruit ≠ 147 m² declarați)",
      transform: { P5, P7, Ix, Iy, Tx, Ty, along0, ew, ns },
    },
    building_summary: {
      footprint_gross_m2: +(m(v45.envelope_cm.ew) * m(v45.envelope_cm.ns)).toFixed(2),
      useful_interior_m2: v45.areas_cm?.useful_interior_m2 ?? null,
      terrace_libera_m2: v45.areas_cm?.terrace_libera_m2 ?? null,
      useful_note: "shoelace pe interior_polygon_cm — vezi docs:v45",
      walls: "ext 30 / int 12.5 / palier 12.5 neconfirmat",
      levels: "P+1 @ 288 cm FF→FF; FF=top finish",
      parking: "2 × 2.50×5.00 pe Cloșca",
      gate: gate.meta.title,
      source: "V45 exact rev3",
      covers: "corp+buc+terasă+rampă2 acoperite; rampă1+podest SE neacoperite",
      heights: "255+6+15+3+2+5+2; elevație teren ipoteză",
    },
    meshes,
  };

  write("outputs/plans/04_volume_concept_v01.json", volume);
  write("viewer/data/volume_v45.json", volume);
  write("viewer/data/volume.json", volume);
  write("viewer/data/v45_exact.json", v45);

  // footprint sync
  const fp = read("data/building/footprint_v01.json");
  fp.meta.active_layout = "v45_exact";
  fp.sketch.along_dragalina_m = m(v45.envelope_cm.ns);
  fp.sketch.depth_into_lot_m = m(v45.envelope_cm.ew);
  fp.areas.footprint_gross_m2 = volume.meta.envelope_m.area_m2;
  fp.footprint.outer = env;
  write("data/building/footprint_v01.json", fp);
  write("viewer/data/footprint.json", fp);

  console.log(
    JSON.stringify(
      {
        ok: true,
        id: volume.meta.id,
        envelope_m2: volume.building_summary.footprint_gross_m2,
        meshes: meshes.length,
        corners,
      },
      null,
      2
    )
  );
}

main();
