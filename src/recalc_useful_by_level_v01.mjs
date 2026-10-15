/**
 * Util SEPARAT parter / etaj (poligone diferite) + scriere în study JSON + raport.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DX = 1.3; // recentrare A2 pe x

function shoelaceM2(verts) {
  let a = 0;
  for (let i = 0; i < verts.length - 1; i++) {
    a += verts[i][0] * verts[i + 1][1] - verts[i + 1][0] * verts[i][1];
  }
  return Math.abs(a) / 2 / 10000;
}
function rectAreaM2(r) {
  return (r.dx * r.dy) / 10000;
}
function wallOnLevel(w, levelIdx) {
  if (!w.levels || !w.levels.length) return true;
  return w.levels.includes(levelIdx);
}
function intWallsNetM2(walls, openings, levelIdx) {
  let intM2 = 0;
  for (const w of walls || []) {
    if (w.kind !== "int" || w.removed) continue;
    if (!wallOnLevel(w, levelIdx)) continue;
    intM2 += rectAreaM2(w);
  }
  let voidM2 = 0;
  for (const o of openings || []) {
    if (o.removed) continue;
    if (!["baie_usa", "dorm_usa"].includes(o.id)) continue;
    if (o.levels && !o.levels.includes(levelIdx)) continue;
    voidM2 += rectAreaM2(o);
  }
  return Math.max(0, intM2 - voidM2);
}

/** Contururi încălzite (cm), origine după A2: +DX pe x față de schema 30/650/… */
function polyParter() {
  return [
    [30 + DX, 30],
    [650 + DX, 30],
    [650 + DX, 590],
    [565 + DX, 590],
    [565 + DX, 440],
    [535 + DX, 440],
    [535 + DX, 830],
    [360 + DX, 830],
    [360 + DX, 645],
    [30 + DX, 645],
    [30 + DX, 30],
  ];
}
function polyEtaj() {
  // studio: exclude palier scară rece X565–680 Y470–590
  return [
    [30 + DX, 30],
    [650 + DX, 30],
    [650 + DX, 470],
    [565 + DX, 470],
    [565 + DX, 590],
    [535 + DX, 590],
    [535 + DX, 830],
    [360 + DX, 830],
    [360 + DX, 645],
    [30 + DX, 645],
    [30 + DX, 30],
  ];
}

function thermalDeduction(walls, levelIdx) {
  let t = 0;
  for (const w of walls || []) {
    if (w.removed) continue;
    if (w.id !== "living_put_thermal_y590" && w.toward !== "shaft_cold") continue;
    if (!wallOnLevel(w, levelIdx)) continue;
    t += rectAreaM2(w);
  }
  return t;
}

function columnProtrusion(frame, levelKey) {
  if (!frame?.columns) return 0;
  let s = 0;
  for (const c of frame.columns) {
    const pin = c.protrusion_into_room_cm || 0;
    if (!(pin > 0)) continue;
    if (!(c.levels || []).includes(levelKey)) continue;
    const along = Math.max(c.dx, c.dy);
    s += (pin * Math.min(along, 40)) / 10000;
  }
  return s;
}

function compute(data, isFrame) {
  const walls = data.walls_cm || [];
  const openings = data.openings_cm || [];
  const polyP = polyParter();
  const polyE = polyEtaj();
  const grossP = shoelaceM2(polyP);
  const grossE = shoelaceM2(polyE);
  const wallsP = intWallsNetM2(walls, openings, 0);
  const wallsE = intWallsNetM2(walls, openings, 1);
  const thP = thermalDeduction(walls, 0);
  const thE = thermalDeduction(walls, 1);
  const fr = data.structure_frame_study_cm;
  const protrP = isFrame ? columnProtrusion(fr, "P") : 0;
  const protrE = isFrame ? columnProtrusion(fr, "E") : 0;
  const usefulP = +(grossP - wallsP - thP - protrP).toFixed(3);
  const usefulE = +(grossE - wallsE - thE - protrE).toFixed(3);
  const palier = { x: 565 + DX, y: 470, dx: 105, dy: 120 };
  return {
    method:
      "P/E separate: shoelace(contur încălzit) − pereți int net − thermal puț − (frame: proem. stâlpi). E = studio fără palier scară rece.",
    poly_parter_cm: polyP,
    poly_etaj_cm: polyE,
    gross_parter_m2: +grossP.toFixed(3),
    gross_etaj_m2: +grossE.toFixed(3),
    walls_int_net_P_m2: +wallsP.toFixed(3),
    walls_int_net_E_m2: +wallsE.toFixed(3),
    thermal_P_m2: +thP.toFixed(3),
    thermal_E_m2: +thE.toFixed(3),
    column_protrusion_P_m2: +protrP.toFixed(3),
    column_protrusion_E_m2: +protrE.toFixed(3),
    useful_parter_m2: usefulP,
    useful_etaj_studio_m2: usefulE,
    useful_etaj_m2: usefulE,
    palier_scara_rece_m2: +rectAreaM2(palier).toFixed(3),
    delta_E_minus_P_m2: +(usefulE - usefulP).toFixed(3),
    status: "CALCUL_STUDIU",
  };
}

function patch(rel, isFrame) {
  const p = path.join(ROOT, rel);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  const byLevel = compute(data, isFrame);

  data.interior_polygon_cm = {
    note: "Util PARTER: living sub palier inclus; exclude terasă/acces exterior",
    level: "parter",
    vertices: byLevel.poly_parter_cm,
    excludes: ["terasa", "uncovered_south", "entry_steps"],
  };
  data.interior_polygon_etaj_cm = {
    note: "Util ETAJ studio: exclude palier scară rece + exterior",
    level: "etaj",
    vertices: byLevel.poly_etaj_cm,
    excludes: ["terasa", "palier_scara_rece", "rampa_exterioara"],
  };

  data.areas_cm = {
    ...data.areas_cm,
    useful_by_level: byLevel,
    useful_parter_m2: byLevel.useful_parter_m2,
    useful_etaj_m2: byLevel.useful_etaj_m2,
    useful_etaj_studio_m2: byLevel.useful_etaj_studio_m2,
    // păstrează un „useful_geometric” = parter ca referință, dar nu egala nivelele
    useful_geometric_m2: byLevel.useful_parter_m2,
    useful_interior_m2: byLevel.useful_parter_m2,
    useful_note:
      "P ≠ E. Vezi areas_cm.useful_by_level. Etaj = studio fără palier scară rece.",
  };

  if (isFrame && data.areas_cm.frame_study_areas) {
    data.areas_cm.frame_study_areas = {
      ...data.areas_cm.frame_study_areas,
      ...byLevel,
      useful_parter_m2: byLevel.useful_parter_m2,
      useful_etaj_m2: byLevel.useful_etaj_m2,
      useful_etaj_studio_m2: byLevel.useful_etaj_studio_m2,
    };
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
  return byLevel;
}

const a1 = patch("data/building/v47_a1_study.json", false);
const fr = patch("data/building/v47_a1_frame_study.json", true);

const md = `# Util pe nivel — P ≠ E (2026-10-15)

Metodă: shoelace contur încălzit − pereți int. net − închidere termică puț${fr.column_protrusion_P_m2 || fr.column_protrusion_E_m2 ? " − proem. stâlpi (FRAME)" : ""}.

## A1 amenajare

| Nivel | Brut (shoelace) | Pereți int net | Thermal | **Util** |
|-------|----------------:|---------------:|--------:|---------:|
| **Parter** | ${a1.gross_parter_m2} | ${a1.walls_int_net_P_m2} | ${a1.thermal_P_m2} | **${a1.useful_parter_m2} m²** |
| **Etaj (studio)** | ${a1.gross_etaj_m2} | ${a1.walls_int_net_E_m2} | ${a1.thermal_E_m2} | **${a1.useful_etaj_m2} m²** |
| Δ E − P | | | | **${a1.delta_E_minus_P_m2} m²** |

Palier scară rece (exclus din etaj): ${a1.palier_scara_rece_m2} m²

## A1 FRAME (cu proeminențe stâlpi)

| Nivel | Brut | Pereți | Thermal | Proem. | **Util** |
|-------|-----:|-------:|--------:|-------:|---------:|
| **Parter** | ${fr.gross_parter_m2} | ${fr.walls_int_net_P_m2} | ${fr.thermal_P_m2} | ${fr.column_protrusion_P_m2} | **${fr.useful_parter_m2} m²** |
| **Etaj (studio)** | ${fr.gross_etaj_m2} | ${fr.walls_int_net_E_m2} | ${fr.thermal_E_m2} | ${fr.column_protrusion_E_m2} | **${fr.useful_etaj_m2} m²** |
| Δ E − P | | | | | **${fr.delta_E_minus_P_m2} m²** |

## De ce diferă

- **Parter:** include livingul de sub palierul scării (zona Y440–590 / X565–650 în contur).
- **Etaj:** studio — **fără** palierul scării reci (circulație scară, nu apartament).
- A8 (baie 15 cm) reduce utilul pe ambele nivele la fel (aceiași pereți int.).
`;

fs.writeFileSync(path.join(ROOT, "outputs/reports/v47_useful_by_level.md"), md);
console.log(
  JSON.stringify(
    {
      A1: {
        useful_P: a1.useful_parter_m2,
        useful_E: a1.useful_etaj_m2,
        delta: a1.delta_E_minus_P_m2,
      },
      FRAME: {
        useful_P: fr.useful_parter_m2,
        useful_E: fr.useful_etaj_m2,
        delta: fr.delta_E_minus_P_m2,
      },
      report: "outputs/reports/v47_useful_by_level.md",
    },
    null,
    2
  )
);
