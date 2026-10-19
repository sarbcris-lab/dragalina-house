/**
 * BOM șarpantă A1 D3a — piese + fixări tip (studiu, nu listă de cumpărături semnată).
 * Rulează: node src/calc_a1_roof_bom_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const v47 = JSON.parse(fs.readFileSync(path.join(root, "data/building/v47_a1_study.json"), "utf8"));
const wind = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_wind_buckling_ec5_v01.json"), "utf8")
);
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

const roof = v47.roof_cm || {};
const rs = roof.structure_cm || {};
const cover = roof.covers_cm || {};
const x0 = cover.x0 ?? 0;
const x1 = cover.x1 ?? 682.6;
const y0 = cover.y0 ?? 0;
const y1 = cover.y1 ?? 861.3;
const ridgeY = roof.ridge?.y_cm ?? (y0 + y1) / 2;

const rafSec = rs.rafter?.section_cm || [12, 25];
const spacingNom = rs.rafter?.spacing_cm || 120;
const ridgeSec = rs.ridge_beam?.section_cm || [20, 35];
const plateSec = rs.wall_plate?.section_cm || [20, 25];
const postSec = rs.gable_posts?.section_cm || [20, 20];

const clearW = Math.max(rafSec[0], x1 - x0 - rafSec[0]);
const nBay = Math.max(1, Math.ceil(clearW / spacingNom));
const step = clearW / nBay;
const nRaftersPerPitch = nBay + 1;
const L_rafter = wind.rafter_ec5?.L_rafter ?? Math.hypot(Math.abs(ridgeY - y0), roof.rise_cm ?? 248.6) / 100;
const L_ridge = (x1 - x0) / 100;
const L_plate = L_ridge;
const runN = Math.abs(ridgeY - y0) / 100;
const runS = Math.abs(y1 - ridgeY) / 100;
const rise_m = (roof.rise_cm ?? 248.6) / 100;
const L_raf_N = Math.hypot(runN, rise_m);
const L_raf_S = Math.hypot(runS, rise_m);
const H_gable = rise_m; // ordin pe fronton

const pieces = [
  {
    id: "RIDGE",
    name: "Coamă",
    section_cm: `${ridgeSec[0]}×${ridgeSec[1]}`,
    qty: 1,
    length_m: round(L_ridge),
    material: "lemn C24 studiu",
    note: "pe lungimea CONC E–W",
  },
  {
    id: "PLATE_N",
    name: "Solbanc N",
    section_cm: `${plateSec[0]}×${plateSec[1]}`,
    qty: 1,
    length_m: round(L_plate),
    material: "lemn C24 studiu",
    note: "pe centură/CONC nord",
  },
  {
    id: "PLATE_S",
    name: "Solbanc S",
    section_cm: `${plateSec[0]}×${plateSec[1]}`,
    qty: 1,
    length_m: round(L_plate),
    material: "lemn C24 studiu",
    note: "pe centură/CONC sud",
  },
  {
    id: "RAFTER_N",
    name: "Căpriori ape N",
    section_cm: `${rafSec[0]}×${rafSec[1]}`,
    qty: nRaftersPerPitch,
    length_m: round(L_raf_N),
    material: "lemn C24 studiu",
    note: `pas egal ${round(step, 1)} cm (≤${spacingNom}); nBay=${nBay}`,
  },
  {
    id: "RAFTER_S",
    name: "Căpriori ape S",
    section_cm: `${rafSec[0]}×${rafSec[1]}`,
    qty: nRaftersPerPitch,
    length_m: round(L_raf_S),
    material: "lemn C24 studiu",
    note: `pas egal ${round(step, 1)} cm; EC5 util=${wind.rafter_ec5?.util_ec5 ?? "—"}`,
  },
  {
    id: "GABLE_W",
    name: "Stâlpișor fronton W",
    section_cm: `${postSec[0]}×${postSec[1]}`,
    qty: 1,
    length_m: round(H_gable),
    material: "lemn C24 studiu",
    note: "pe B_W",
  },
  {
    id: "GABLE_E",
    name: "Stâlpișor fronton E",
    section_cm: `${postSec[0]}×${postSec[1]}`,
    qty: 1,
    length_m: round(H_gable),
    material: "lemn C24 studiu",
    note: "pe B_E",
  },
];

const vol_m3 = round(
  pieces.reduce((s, p) => {
    const [a, b] = p.section_cm.split("×").map(Number);
    return s + p.qty * p.length_m * (a / 100) * (b / 100);
  }, 0),
  3
);

const fasteners = [
  {
    id: "RAFTER_PLATE",
    joint: "Căprior ↔ solbanc",
    type: "șuruburi lemn Ø8×120 sau cuie 4,0×100",
    qty_per_joint: 3,
    joints: nRaftersPerPitch * 2,
    note: "min 2+1; we streșină → preferă șurub + colțar",
  },
  {
    id: "RAFTER_RIDGE",
    joint: "Căprior ↔ coamă",
    type: "șuruburi Ø8×140 sau cuie 4,0×120 + placă metalică",
    qty_per_joint: 2,
    joints: nRaftersPerPitch * 2,
    note: "sau asamblare cuțit/coamă tip studiu",
  },
  {
    id: "PLATE_CONC",
    joint: "Solbanc ↔ centură BA",
    type: "ancoră chimică M12 / bolt M12 @ ≤80 cm",
    qty_per_joint: 1,
    joints: Math.ceil(L_plate / 0.8) * 2,
    note: "ancorare uplift we streșină — FE confirmă",
  },
  {
    id: "GABLE_BEAM",
    joint: "Stâlpișor ↔ grindă B_W/B_E",
    type: "șuruburi Ø10×160 + saboți metal",
    qty_per_joint: 4,
    joints: 2,
    note: "pe ax grindă",
  },
  {
    id: "BRACE_OPT",
    joint: "Contravântuire ape (opțional studiu)",
    type: "scândură 2,5×15 sau bandă metalică",
    qty_per_joint: 1,
    joints: 4,
    note: "dacă FE cere diafragmă suplimentară pe învelitoare",
  },
];

const fastenersTotal = fasteners.map((f) => ({
  ...f,
  qty_total: f.qty_per_joint * f.joints,
}));

const out = {
  meta: {
    id: "s1_a1_roof_bom_v01",
    generated: new Date().toISOString(),
    status: "BOM_studiu_nu_lista_cumparaturi",
    roof: "D3a_2ape_30_PV",
    pitch_deg: roof.pitch_deg_approx ?? 30,
    disclaimer: "Cantități tip din geometrie 3D. Structurist / dulgher confirmă la detaliere.",
  },
  geometry: {
    clearW_cm: round(clearW, 1),
    nBay,
    step_cm: round(step, 1),
    n_rafters_per_pitch: nRaftersPerPitch,
    L_rafter_ec5_m: round(L_rafter),
    we_eaves: wind.wind?.we?.eaves_F ?? -1.63,
    q_Ed_design: wind.q_Ed_design,
  },
  pieces,
  volume_timber_m3: vol_m3,
  fasteners: fastenersTotal,
};

const md = `# S1 A1 — BOM șarpantă D3a (studiu)

**Status:** listă piese + fixări tip · **NU** listă de cumpărături semnată  
**Generat:** ${out.meta.generated.slice(0, 16)}  
**Geometrie:** 2 ape · ${out.meta.pitch_deg}° · pas egal **${out.geometry.step_cm}** cm (${nRaftersPerPitch} căpriori/apă)

## Piese

| ID | Piesă | Secțiune | Buc | L (m) | Material | Notă |
|----|-------|----------|----:|------:|----------|------|
${pieces.map((p) => `| ${p.id} | ${p.name} | ${p.section_cm} | ${p.qty} | ${p.length_m} | ${p.material} | ${p.note} |`).join("\n")}

**Volum lemn ordin:** ~**${vol_m3}** m³ (fără pierderi / îmbinări)

## Fixări tip

| Nod | Tip | ×/nod | Noduri | Total | Notă |
|-----|-----|------:|-------:|------:|------|
${fastenersTotal
  .map(
    (f) =>
      `| ${f.joint} | ${f.type} | ${f.qty_per_joint} | ${f.joints} | **${f.qty_total}** | ${f.note} |`
  )
  .join("\n")}

## Verificare legată

- EC5 căprior: util **${wind.rafter_ec5?.util_ec5 ?? "—"}** · PASS \`${wind.rafter_ec5?.ec5_pass}\`
- we streșină: **${out.geometry.we_eaves}** kN/m² → ancorare solbanc critică
- PV pe ambele ape: greutate inclusă în Gk studiu (vezi wind pack)

## Nu e în BOM

- Învelitoare / membrană / OSB  
- Șipci / contra-șipci  
- Cadre PV / șine  
- Detalii streșină / jgheaburi  

JSON: \`s1_a1_roof_bom_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_roof_bom_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_roof_bom_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      n_rafters: nRaftersPerPitch * 2,
      step_cm: round(step, 1),
      vol_m3,
      fastener_lines: fastenersTotal.length,
    },
    null,
    2
  )
);
