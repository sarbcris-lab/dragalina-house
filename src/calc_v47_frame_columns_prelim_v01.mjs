/**
 * Predimensionare stâlpi FRAME V47 A1 — ordin de mărime (NU proiect semnat).
 * 2.1: N din arii tributare + q_Ed · Nrd brut C25/30 · flag along 40→30.
 *
 * Rulează: node src/calc_v47_frame_columns_prelim_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const studyPath = path.join(root, "data/building/v47_a1_frame_study.json");
const outPath = path.join(root, "outputs/reports/v47_a1_frame_calc_2_1_columns_v01.md");
const jsonOut = path.join(root, "outputs/reports/v47_a1_frame_calc_2_1_columns_v01.json");

const study = JSON.parse(fs.readFileSync(studyPath, "utf8"));
const frame = study.structure_frame_study_cm;
const cols = frame.columns.filter((c) => (c.levels || []).includes("P"));

/** ULS factored floor load — din audit v04 (locuință). */
const Q_ED_FLOOR = 11.78; // kN/m²
const Q_ED_LANDING = 11.93;
/** Acoperiș ușor (D3a) — ordin; BA acoperiș = sensibilitate +30%. */
const Q_ED_ROOF_LIGHT = 4.5;
const Q_ED_ROOF_BA = 7.0;

/** C25/30 · fcd = 25/1.5 · Nrd ≈ α·Ac·fcd (α=0.8 EC2 scour); fără flambaj. */
const FCD = 25 / 1.5; // MPa = N/mm²
function nrdKn(dxCm, dyCm) {
  const Ac = (dxCm / 100) * (dyCm / 100); // m²
  return 0.8 * Ac * FCD * 1000; // kN
}

/** Arii tributare aproximative (m²) pe plan — half-span pe grila de cadru. */
function tribAreas(c) {
  const id = c.id;
  // Heated + scară footprint ordin (cm → m²)
  // Deschideri tipice din poziții stâlpi
  const map = {
    C_NW: { floor: 2.4 * 3.2, roof: 2.4 * 3.2, note: "colț N/W" },
    C_N_MID: { floor: 3.3 * 3.2, roof: 3.3 * 3.2, note: "nord mid; fără el → redistribuie pe NW+NE" },
    C_NE: { floor: 2.0 * 3.2, roof: 2.0 * 3.2, note: "colț N/E" },
    C_W_MID: { floor: 2.4 * 3.2, roof: 2.4 * 3.2, note: "vest mid" },
    C_W_DORM: { floor: 2.4 * 2.0, roof: 2.4 * 2.0, note: "colț S/W dorm" },
    C_S_DORM_E: { floor: 2.0 * 2.0, roof: 2.0 * 2.0, note: "sud dorm E — 30×30" },
    C_E_GEAM_S: { floor: 1.8 * 2.2, roof: 1.8 * 2.2, note: "est geam" },
    C_E_PAL: {
      floor: 1.6 * 2.0,
      landing: 1.05 * 1.2,
      roof: 1.6 * 2.0,
      note: "est palier — +consolă palier pe trib",
    },
    C_CASA_SCARA: { floor: 1.5 * 2.2, roof: 1.5 * 2.2, note: "separator scară" },
    C_S_INTRARE_W: { floor: 2.0 * 1.5, roof: 2.0 * 1.5, note: "sud intrare W" },
    C_S_INTRARE_E: { floor: 1.5 * 1.5, roof: 1.5 * 1.5, note: "sud intrare E — 30×30" },
  };
  return map[id] || { floor: 2.5, roof: 2.5, note: "default" };
}

function levelsCount(c) {
  const L = c.levels || [];
  // S: retenție/greutate proprie — nu numărăm etaj util; P+E = 2 planșee + acoperiș
  const floors = L.includes("E") ? 2 : L.includes("P") ? 1 : 0;
  return { floors, hasRoof: L.includes("E") || L.includes("P") };
}

function axialFor(c, roofQ) {
  const t = tribAreas(c);
  const { floors, hasRoof } = levelsCount(c);
  const nFloor = floors * (t.floor || 0) * Q_ED_FLOOR;
  const nLand = (t.landing || 0) * Q_ED_LANDING;
  const nRoof = hasRoof ? (t.roof || 0) * roofQ : 0;
  // Greutate proprie stâlp ~25 kN/m³ · secțiune · H≈ 3 nivele × ~3 m ≈ 9 m (S–E)
  const H = 9;
  const self = 25 * (c.dx / 100) * (c.dy / 100) * H;
  const N = nFloor + nLand + nRoof + self;
  return { N, nFloor, nLand, nRoof, self, t };
}

const rows = cols.map((c) => {
  const light = axialFor(c, Q_ED_ROOF_LIGHT);
  const ba = axialFor(c, Q_ED_ROOF_BA);
  const nrd30 = nrdKn(30, 30);
  const nrdNow = nrdKn(c.dx, c.dy);
  const nrd3040 = nrdKn(30, 40);
  const util = Math.max(c.dx, c.dy) === 40 || (c.dx === 40 || c.dy === 40);
  const alongCandidate = util && c.dx >= 30 && c.dy >= 30;
  // Factor de rezervă: Nrd/N — fără M, fără P100. Prag conservator ≥ 3 pe axial pur (lasă loc M+V).
  const ratioLight30 = nrd30 / light.N;
  const ratioNow = nrdNow / light.N;
  // C_E_PAL: axial OK pe 30×30, dar nod consolă (2.2) blochează reducerea fără FE M+T.
  const blockReduce = c.id === "C_E_PAL";
  let verdict;
  if (blockReduce) verdict = "axial_OK_dar_pastreaza_30x40_nod_consola";
  else if (ratioLight30 >= 3) verdict = "axial_OK_incerc_30x30";
  else if (ratioNow >= 3) verdict = "axial_OK_pastreaza_secțiune";
  else if (ratioNow >= 1.5) verdict = "axial_marginal_necesita_M_V_FE";
  else verdict = "axial_risc_mareste_sau_FE";

  return {
    id: c.id,
    section_cm: `${c.dx}×${c.dy}`,
    levels: c.levels,
    trib_m2: light.t,
    N_Ed_roof_light_kN: round(light.N),
    N_Ed_roof_BA_kN: round(ba.N),
    Nrd_30x30_kN: round(nrd30),
    Nrd_actual_kN: round(nrdNow),
    Nrd_30x40_kN: round(nrd3040),
    ratio_Nrd30_over_N_light: round(ratioLight30, 2),
    ratio_Nrd_actual_over_N_light: round(ratioNow, 2),
    along_40_to_30_candidate: alongCandidate && ratioLight30 >= 3 && !blockReduce,
    verdict,
    note: light.t.note,
  };
});

function round(x, d = 1) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

const summary = {
  method:
    "tributar aproximativ × q_Ed audit v04; Nrd=0.8·Ac·fcd C25/30; FĂRĂ M/V/P100/flambaj",
  status: "preliminar_ordin — nu adoptare",
  q_Ed_floor: Q_ED_FLOOR,
  q_Ed_landing: Q_ED_LANDING,
  columns: rows,
  candidates_along_30: rows.filter((r) => r.along_40_to_30_candidate).map((r) => r.id),
  keep_or_fe: rows.filter((r) => !r.along_40_to_30_candidate).map((r) => r.id),
};

const md = `# V47 A1 FRAME — Calc 2.1 stâlpi (preliminar)

**Status:** ordin de mărime · **NU** proiect semnat · **NU** adoptare secțiuni  
**Dată:** 2026-10-16  
**Input:** \`v47_a1_frame_study.json\` + q_Ed din audit v04  
**Următor:** FE 3D / P100 cu M+V+confinare — abia atunci along 40→30 în generator

## Metodă

| Parametru | Valoare |
|-----------|---------|
| q_Ed planșeu | **${Q_ED_FLOOR}** kN/m² |
| q_Ed palier | **${Q_ED_LANDING}** kN/m² |
| q_Ed acoperiș ușor / BA | ${Q_ED_ROOF_LIGHT} / ${Q_ED_ROOF_BA} |
| Beton | C25/30 · fcd=${FCD.toFixed(2)} MPa |
| Nrd | 0,8 · Ac · fcd (**fără** flambaj, **fără** M) |
| Prag „încerc 30×30” | Nrd(30×30) / N_Ed ≥ **3** (rezervă pentru M+V) |

Ariile tributare = half-span pe grila de cadru (aproximare). Nu înlocuiesc model FE.

## Rezultate

| ID | Secțiune | N_Ed ușor (kN) | N_Ed BA (kN) | Nrd 30×30 | Nrd actual | Nrd/N (30) | Verdict |
|----|----------|---------------:|-------------:|----------:|-----------:|-----------:|---------|
${rows
  .map(
    (r) =>
      `| ${r.id} | ${r.section_cm} | ${r.N_Ed_roof_light_kN} | ${r.N_Ed_roof_BA_kN} | ${r.Nrd_30x30_kN} | ${r.Nrd_actual_kN} | ${r.ratio_Nrd30_over_N_light} | ${r.verdict} |`
  )
  .join("\n")}

## Candidați along 40 → 30 (doar axial)

${
  summary.candidates_along_30.length
    ? summary.candidates_along_30.map((id) => `- **${id}**`).join("\n")
    : "_niciunul sub pragul 3 — toți cer FE înainte de reducere_"
}

## Ce NU e demonstrat

- Combinații P100 (seism) + CR0
- Momente din cadre / excentricități / confinare zone critice
- Flambaj / lungimi de flambaj pe S–P–E
- Interacțiune N–M pe diagramă
- Pier \`C_SHAFT_E_PIER\` 15×15 (nu cadru)

## Decizie model (acum)

| Acțiune | Da/Nu |
|---------|-------|
| Păstrează secțiunile actuale în generator | **Da** |
| Reduce along la 30 în mesh | **Nu** — așteaptă FE cu M+V |
| Continuă 2.2 nod C_E_PAL | **Da** |

JSON: \`outputs/reports/v47_a1_frame_calc_2_1_columns_v01.json\`
`;

fs.writeFileSync(outPath, md);
fs.writeFileSync(jsonOut, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ok: true, outPath, candidates: summary.candidates_along_30, rows: rows.length }, null, 2));
