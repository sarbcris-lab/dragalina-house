/**
 * Acoperiș D3a: încărcări PV+zăpadă, audit reazeme stâlpișori, inel centuri E, plăci.
 * Ordin de studiu — NU FE semnat / NU autorizabil.
 * Rulează: node src/calc_v47_frame_roof_pv_snow_bearing_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const study = JSON.parse(
  fs.readFileSync(path.join(root, "data/building/v47_a1_frame_study.json"), "utf8")
);
const outMd = path.join(root, "outputs/reports/v47_a1_frame_roof_pv_snow_bearing_v01.md");
const outJson = path.join(root, "outputs/reports/v47_a1_frame_roof_pv_snow_bearing_v01.json");

const f = study.structure_frame_study_cm;
const roof = study.roof_cm;
const ht = study.heights_cm || {};
const lv = f.levels_cm || {};
const fp = f.structural_footprint_cm || {};
const cover = roof.covers_cm || {};
const eBeams = (f.beams || []).filter((b) => (b.levels || []).includes("E"));
const pBeams = (f.beams || []).filter((b) => (b.levels || []).includes("P"));
const cols = f.columns || [];

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/** Turda / Cluj — CR 1-1-3/2012: sk tipic 1,5 kN/m² (A<1000 m); sensibilitate 2,0. */
const SK = 1.5;
const SK_SENS = 2.0;
/** Acoperiș 2 ape ~30°: μ1 = 0,8 (nedriftat, CR). */
const MU1 = 0.8;
const CE = 1.0;
const CT = 1.0;

const areaPlan =
  ((cover.x1 - cover.x0) * (cover.y1 - cover.y0)) / 10000; // m² plan
const pitchRad = Math.atan2((roof.rise_cm || 248) / 100, ((cover.y1 - cover.y0) / 2) / 100);
const areaSlope = areaPlan / Math.cos(pitchRad);

/** Greutăți caracteristice Gk (kN/m² pe plan înclinat, ordin). */
const Gk = {
  sarpanta_usoara: 0.55, // căpriori + OSB/învelitoare ușoară
  solbanc_coama_share: 0.1,
  pv_panels_rails: 0.2, // PV pe ambele ape (decis)
  misc: 0.05,
};
const Gk_tot = Object.values(Gk).reduce((a, b) => a + b, 0);

const snowRoof = (sk) => round(MU1 * CE * CT * sk, 2);
const qEd = (gk, qk) => round(1.35 * gk + 1.5 * qk, 2);

const cases = {
  D3a_PV_sk15: {
    label: "D3a + PV · sk=1,5",
    Gk: Gk_tot,
    Qk_snow: snowRoof(SK),
    q_Ed: qEd(Gk_tot, snowRoof(SK)),
  },
  D3a_PV_sk20: {
    label: "D3a + PV · sk=2,0 (sens.)",
    Gk: Gk_tot,
    Qk_snow: snowRoof(SK_SENS),
    q_Ed: qEd(Gk_tot, snowRoof(SK_SENS)),
  },
  D3a_noPV_sk15: {
    label: "D3a fără PV · sk=1,5",
    Gk: round(Gk_tot - Gk.pv_panels_rails, 2),
    Qk_snow: snowRoof(SK),
    q_Ed: null,
  },
};
cases.D3a_noPV_sk15.q_Ed = qEd(cases.D3a_noPV_sk15.Gk, cases.D3a_noPV_sk15.Qk_snow);

for (const c of Object.values(cases)) {
  c.W_plan_kN = round(c.q_Ed * areaPlan, 0);
  c.W_slope_kN = round(c.q_Ed * areaSlope, 0);
}

/** Ordin pe căprior: spațiu 1,2 m, deschidere max ~ run = 4,3 m. */
const spacing = 1.2; // m
const L_rafter = Math.hypot((roof.rise_cm || 248) / 100, ((cover.y1 - cover.y0) / 2) / 100);
const qLine = cases.D3a_PV_sk15.q_Ed * spacing; // kN/m pe căprior
const M_Ed_simply = round((qLine * L_rafter ** 2) / 8, 2); // kNm
const W_req_cm3 = round((M_Ed_simply * 1e6) / 14e6, 0); // σ≤14 MPa lemn C24 ordin
const section_12x25 = { b: 12, h: 25, W: round((12 * 25 ** 2) / 6, 0) };

const rafterCheck = {
  L_m: round(L_rafter, 2),
  spacing_m: spacing,
  q_line_kN_m: round(qLine, 2),
  M_Ed_simply_kNm: M_Ed_simply,
  W_req_cm3,
  section_assumed_cm: "12×25",
  W_prov_cm3: section_12x25.W,
  verdict:
    section_12x25.W >= W_req_cm3
      ? "ordin_OK_pe_simplu_rezemat — FE/înnădiri/ancorare lipsă"
      : "ordin_SUCCEDE — mărește secțiune sau densitate",
};

/** Stâlpișori fronton — poziții mesh (înainte de fix: inset pe finit). */
const ps = [20, 20];
const inset = 25;
const ridgeY = roof.ridge?.y_cm ?? 430;
const postsOld = [
  {
    tag: "W",
    x0: cover.x0 + inset,
    x1: cover.x0 + inset + ps[0],
    y0: ridgeY - ps[1] / 2,
    y1: ridgeY + ps[1] / 2,
  },
  {
    tag: "E",
    x0: cover.x1 - inset - ps[0],
    x1: cover.x1 - inset,
    y0: ridgeY - ps[1] / 2,
    y1: ridgeY + ps[1] / 2,
  },
];

function overlapArea(a, b) {
  const ox = Math.max(0, Math.min(a.x1, b.x + b.dx) - Math.max(a.x0, b.x));
  const oy = Math.max(0, Math.min(a.y1, b.y + b.dy) - Math.max(a.y0, b.y));
  return ox * oy;
}

const bearingAudit = postsOld.map((p) => {
  const hits = eBeams
    .map((b) => ({ id: b.id, area: overlapArea(p, b) }))
    .filter((h) => h.area > 0);
  const full = ps[0] * ps[1];
  const best = hits.sort((a, b) => b.area - a.area)[0];
  const frac = best ? best.area / full : 0;
  return {
    ...p,
    overlaps: hits,
    cover_frac: round(frac, 2),
    verdict:
      frac >= 0.95
        ? "pe_grindă"
        : frac > 0
          ? "pe_muchie_sau_partial"
          : "fara_reazem_grindă",
  };
});

/** Inel E: probe pe contur CONC. */
const CONC = {
  x0: fp.x0 ?? 0,
  y0: fp.y0 ?? 0,
  x1: fp.x1 ?? 672.1,
  y1: fp.y1 ?? 850.8,
};
function beamsAt(x, y) {
  return eBeams
    .filter((b) => x >= b.x && x <= b.x + b.dx && y >= b.y && y <= b.y + b.dy)
    .map((b) => b.id);
}
const ringSamples = [
  [15, 15, "NW"],
  [336, 15, "N mid"],
  [657, 15, "NE"],
  [15, 400, "W mid"],
  [657, 400, "E mid"],
  [657, 700, "E sud scară"],
  [657, 835, "SE colț"],
  [450, 835, "S intrare"],
  [180, 650, "S dorm"],
  [15, 650, "SW dorm"],
  [600, 485, "consolă palier B_Y470"],
].map(([x, y, note]) => ({
  x,
  y,
  note,
  beams: beamsAt(x, y),
  status: beamsAt(x, y).length ? "covered" : "GAP",
}));

const cantileversInAir = eBeams
  .filter((b) => b.cantilever_west_of_B_E_cm || b.cantilever_south_of_C_E_PAL_cm)
  .map((b) => ({
    id: b.id,
    cantilever_west_cm: b.cantilever_west_of_B_E_cm || null,
    cantilever_south_cm: b.cantilever_south_of_C_E_PAL_cm || null,
    note: b.note,
    status: "intenție_LOCK-1R_consolă — nu e bug; legare = stâlp nou în living (retras)",
  }));

const slabs = {
  etaj_structural_cm: lv.slab_th_hypothesis ?? ht.structural_slab_cm ?? 20,
  etaj_soffit_top: `${lv.slab_soffit_etaj}→${lv.slab_top_etaj}`,
  parter_over_basement_cm: 20,
  basement_note: "subsol_intrados_placa 20 cm pe footprint CONC",
  centura_under_each: {
    subsol: "grinzi pe axe P+E / S (FG+grindă)",
    parter: "beams levels P (= centură sub placă etaj / peste P)",
    etaj: "beams levels E (= centură sub acoperiș / pe placă E)",
    complete_ring_E: ringSamples.some((s) => s.status === "GAP") ? false : true,
  },
};

const seCornerCol = cols.find((c) => /S_INTRARE_E|SE/.test(c.id));
const missingRing = {
  gap_E_south_of_Y590: true,
  gap_SE_corner: true,
  C_S_INTRARE_E_x: seCornerCol?.x,
  note:
    "Pe EST sud de Y590 (după B_E) nu există grindă pe CONC_E; colțul SE structural (672/851) nu are stâlp — C_S_INTRARE_E e la X536. Inel E incomplet.",
  proposed_study:
    "C_SE @ CONC_E×CONC_S + B_E_S (Y590→S) + B_S_SE (de la C_S_INTRARE_E la C_SE) — debate înainte de mesh",
};

const result = {
  status: "preliminar — nu FE semnat",
  site: { locality: "Turda", sk_kN_m2: SK, sk_sensitivity: SK_SENS, code: "CR 1-1-3/2012" },
  areas: { plan_m2: round(areaPlan, 2), slope_m2: round(areaSlope, 2), pitch_deg: round((pitchRad * 180) / Math.PI, 1) },
  Gk_breakdown: Gk,
  Gk_tot,
  cases,
  rafterCheck,
  bearingAudit_pre_fix: bearingAudit,
  ringSamples,
  cantileversInAir,
  slabs,
  missingRing,
  verdict: {
    posts: "Stâlpișorii W/E stăteau pe muchie (W ~5 cm overlap) / parțial pe B_E — nu centrați pe grindă.",
    ring: "Da — centura E trebuie închisă pe EST-sud; cele 2 segmente în aer = console LOCK-1R (B_Y470 + B_E sud C_E_PAL), nu aceleași cu golul SE.",
    capacity:
      cases.D3a_PV_sk15.q_Ed <= 4.5 && rafterCheck.verdict.startsWith("ordin_OK")
        ? "D3a+PV+zăpadă sk1,5: ordin pe căprior OK; stâlpi/ancorare/inel = calcul_lipsă FE"
        : "verifică secțiuni / densitate",
    holds_question:
      "Nu putem afirma „ține” fără FE pe stâlpi+centuri+ancorare seism. Ordin încărcări: da, în plaja D3a studiată (+PV).",
  },
};

const md = `# V47 A1 FRAME — Acoperiș D3a: PV + zăpadă + reazeme + inel

**Status:** ordin de studiu · **NU** FE semnat · **NU** autorizabil  
**Amplasament:** Turda · sk=**${SK}** kN/m² (CR 1-1-3/2012) · sens. ${SK_SENS}

## Verdict

1. **Stâlpișori fronton:** pe **muchie / parțial** pe B_W / B_E — nu centrați (W overlap ~5 cm din 20).
2. **Plăci BA:** etaj **${slabs.etaj_structural_cm} cm** (${slabs.etaj_soffit_top}); peste subsol **20 cm** pe footprint CONC.
3. **Centură sub fiecare placă:** da pe nivelele P și E din \`beams[]\` — dar **inelul E nu e închis** pe EST sud de Y590 / colț SE.
4. **„2 segmente în aer”:** \`B_Y470_PALIER_EDGE\` (consolă V 105) + consolă \`B_E\` sud de C_E_PAL (~101) = **LOCK-1R**, nu bug. Legarea lor = **stâlp nou în living** (retras intenționat).
5. **PV + zăpadă:** q_Ed D3a+PV @ sk1,5 ≈ **${cases.D3a_PV_sk15.q_Ed} kN/m²** · W_plan ≈ **${cases.D3a_PV_sk15.W_plan_kN} kN**. Căprior 12×25 @1,2 m: **${rafterCheck.verdict}**. Afirmația „ține tot” = **calcul_lipsă FE** (stâlpi, inel, ancorare).

## Încărcări (pe m² plan)

| Caz | Gk | Qk zăpadă (μ=0,8·sk) | q_Ed | W pe amprentă ~${round(areaPlan, 1)} m² |
|-----|---:|---------------------:|-----:|---------------------------------------:|
| ${cases.D3a_PV_sk15.label} | ${cases.D3a_PV_sk15.Gk} | ${cases.D3a_PV_sk15.Qk_snow} | **${cases.D3a_PV_sk15.q_Ed}** | **${cases.D3a_PV_sk15.W_plan_kN}** |
| ${cases.D3a_PV_sk20.label} | ${cases.D3a_PV_sk20.Gk} | ${cases.D3a_PV_sk20.Qk_snow} | ${cases.D3a_PV_sk20.q_Ed} | ${cases.D3a_PV_sk20.W_plan_kN} |
| ${cases.D3a_noPV_sk15.label} | ${cases.D3a_noPV_sk15.Gk} | ${cases.D3a_noPV_sk15.Qk_snow} | ${cases.D3a_noPV_sk15.q_Ed} | ${cases.D3a_noPV_sk15.W_plan_kN} |

Gk: șarpantă ${Gk.sarpanta_usoara} + solbanc/coamă ${Gk.solbanc_coama_share} + **PV ${Gk.pv_panels_rails}** + misc ${Gk.misc} = **${Gk_tot}** kN/m².

### Căprior (ordin)

| L (m) | pas (m) | q linie | M_Ed L/8 | W nec (σ14) | 12×25 W | |
|------:|--------:|--------:|---------:|------------:|--------:|---|
| ${rafterCheck.L_m} | ${rafterCheck.spacing_m} | ${rafterCheck.q_line_kN_m} | ${rafterCheck.M_Ed_simply_kNm} | ${rafterCheck.W_req_cm3} | ${rafterCheck.W_prov_cm3} | ${rafterCheck.verdict} |

## Reazeme stâlpișori (pre-fix)

| Tag | Contur cm | Overlap | Fracție | Verdict |
|-----|-----------|---------|--------:|---------|
${bearingAudit.map((p) => `| ${p.tag} | X${p.x0}–${p.x1} Y${p.y0}–${p.y1} | ${p.overlaps.map((o) => o.id + ":" + o.area).join(", ") || "—"} | ${p.cover_frac} | **${p.verdict}** |`).join("\n")}

**Fix mesh:** centra pe B_W / B_E (față beton), nu pe inset față de finit.

## Inel centuri etaj

| Probă | Status | Grinzi |
|-------|--------|--------|
${ringSamples.map((s) => `| ${s.note} (${s.x},${s.y}) | **${s.status}** | ${s.beams.join(", ") || "—"} |`).join("\n")}

${missingRing.note}

**Propunere studiu (debate):** ${missingRing.proposed_study}

### Console „în aer” (nu golul SE)

${cantileversInAir.map((c) => `- **${c.id}**: west=${c.cantilever_west_cm ?? "—"} · south=${c.cantilever_south_cm ?? "—"} — ${c.status}`).join("\n")}

## Plăci + centuri

| Nivel | Placă structurală | Centură |
|-------|-------------------|---------|
| Peste subsol | 20 cm CONC | grinzi S / P+E |
| Etaj (peste P) | **${slabs.etaj_structural_cm} cm** | beams \`levels: P\` |
| Sub acoperiș | — (șarpantă D3a) | beams \`levels: E\` pe același traseu |

## Registru

| ID | Status |
|----|--------|
| \`roof_load_path\` | geo traseu OK · încărcări D3a+PV documentate · **FE lipsă** |
| \`gable_post_bearing\` | **conflict_geometric** (pre-fix) → centra pe B_W/B_E |
| \`ring_E_SE_gap\` | **conflict_geometric** — EST Y590→S + colț SE fără stâlp |
| \`cantilever_B_Y470\` / \`B_E_south\` | ipoteză LOCK-1R · calcul consolă lipsă |

JSON: \`outputs/reports/v47_a1_frame_roof_pv_snow_bearing_v01.json\`
`;

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(
  JSON.stringify(
    {
      ok: true,
      q_Ed_PV_sk15: cases.D3a_PV_sk15.q_Ed,
      W_kN: cases.D3a_PV_sk15.W_plan_kN,
      posts: bearingAudit.map((p) => p.verdict),
      ring_gaps: ringSamples.filter((s) => s.status === "GAP").map((s) => s.note),
      rafter: rafterCheck.verdict,
    },
    null,
    2
  )
);
