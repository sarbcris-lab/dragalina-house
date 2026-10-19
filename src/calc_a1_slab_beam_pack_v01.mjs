/**
 * Comparație pachete placă/drop grindă la clear≥255 HARD.
 * 15/25 (adopt) vs 18/18 vs 20/15 (+ variante).
 * Rulează: node src/calc_a1_slab_beam_pack_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const calc = JSON.parse(fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), "utf8"));
const st = a1.structure_a1_study_cm;
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

const CLEAR = 255;
const BUILDUP = 12;
const Q_ED = calc.meta?.q_Ed ?? 11.78;
const Qk = 2.0;
const Ecm = 31e6;
const FYD = 500 / 1.15;
const FCD = 25 / 1.5;
const FCK = 25;

const box = st.structure_box_cm;
const area_m2 = ((box.x1 - box.x0) * (box.y1 - box.y0)) / 1e4; // cutie P ≈
const L_panel = Math.min((box.x1 - box.x0) / 200, 3.2);

const beamBX = (calc.beams || []).find((b) => b.id === "B_X_MID");
const beamBY = (calc.beams || []).find((b) => b.id === "B_Y410");
const L_BX = beamBX?.L_m ?? 6.052;
const q_BX = beamBX?.q_kNm ?? 18.85;
const L_BY = beamBY?.L_m ?? 5.988;
const q_BY = beamBY?.q_kNm ?? 18.85;

function slabCheck(hCm) {
  const h = hCm / 100;
  const d = h - 0.025;
  const Gk = h * 25 + 1.5;
  const Q_qp = Gk + 0.3 * Qk;
  const M = (Q_ED * L_panel * L_panel) / 8;
  const L_d = L_panel / d;
  const allow = 1.4 * 40 * 0.85;
  const I = d ** 3 / 12;
  const delta = ((5 * Q_qp * L_panel ** 4) / (384 * Ecm * I)) * 1000 * 2.5;
  const lim = (L_panel * 1000) / 250;
  return {
    h_cm: hCm,
    L_m: round(L_panel, 3),
    L_over_d: round(L_d, 1),
    allow: round(allow, 1),
    M_kNm_m: round(M, 1),
    delta_cr_mm: round(delta, 1),
    lim_mm: round(lim, 1),
    pass: L_d <= allow && delta <= lim,
    Gk_kNm2: round(Gk, 2),
  };
}

function beamCheck(L, q, bCm, hCm) {
  const b = bCm / 100;
  const h = hCm / 100;
  const d = Math.max(h - 0.05, 0.08);
  const M = (q * L * L) / 8;
  const V = (q * L) / 2;
  const As = (M * 1e6) / (0.9 * (d * 1000) * FYD);
  const mu = M / (b * d * d * FCD * 1000);
  const rho = Math.min(0.02, As / 1e6 / (b * d));
  const k = Math.min(2, 1 + Math.sqrt(200 / (d * 1000)));
  const Vrdc =
    (0.12 * k * Math.pow(100 * Math.max(rho, 0.002) * FCK, 1 / 3) * (b * 1000) * (d * 1000)) /
    1000;
  const I = (b * d ** 3) / 12;
  const delta_cr = ((5 * q * L ** 4) / (384 * Ecm * I)) * 1000 * 2.5;
  const lim = (L * 1000) / 250;
  return {
    h_cm: hCm,
    M_kNm: round(M, 1),
    V_kN: round(V, 1),
    mu: round(mu, 3),
    delta_cr_mm: round(delta_cr, 1),
    lim_mm: round(lim, 1),
    flex_ok: mu < 0.25,
    shear_ok: V <= Vrdc * 1.15,
    sls_ok: delta_cr <= lim,
    pass: mu < 0.25 && V <= Vrdc * 1.15 && delta_cr <= lim,
  };
}

const PACKS = [
  { id: "P15_D25", label: "15 + drop25 (ADOPT)", slab_cm: 15, drop_cm: 25 },
  { id: "P16_D20", label: "16 + drop20", slab_cm: 16, drop_cm: 20 },
  { id: "P18_D18", label: "18 + drop18", slab_cm: 18, drop_cm: 18 },
  { id: "P18_D20", label: "18 + drop20", slab_cm: 18, drop_cm: 20 },
  { id: "P20_D15", label: "20 + drop15", slab_cm: 20, drop_cm: 15 },
  { id: "P20_D20", label: "20 + drop20", slab_cm: 20, drop_cm: 20 },
];

const results = PACKS.map((p) => {
  const beam_h = p.slab_cm + p.drop_cm;
  const ff_to_ff = CLEAR + p.drop_cm + p.slab_cm + BUILDUP;
  const clear_under_slab = CLEAR + p.drop_cm;
  const slab = slabCheck(p.slab_cm);
  const bx = beamCheck(L_BX, q_BX, 40, beam_h); // B_X_MID 40×h
  const by = beamCheck(L_BY, q_BY, 40, beam_h); // B_Y410 40×h
  // volum ordin: placă pe cutie + 2 etaje approx + grinzi mid ca +8% pe placă
  const vol_slab_m3 = round(2 * area_m2 * (p.slab_cm / 100), 2);
  const vol_vs_adopt = round(vol_slab_m3 - 2 * area_m2 * 0.15, 2);
  const Gk_delta = round(slab.Gk_kNm2 - (0.15 * 25 + 1.5), 2);
  const nRisers = Math.ceil(ff_to_ff / 16); // max riser ~16
  const riser = round(ff_to_ff / nRisers, 2);
  const pass_all = slab.pass && bx.pass && by.pass;
  return {
    ...p,
    beam_h_cm: beam_h,
    ff_to_ff_cm: ff_to_ff,
    clear_under_beam_cm: CLEAR,
    clear_under_slab_cm: clear_under_slab,
    delta_ff_vs_adopt_cm: ff_to_ff - 307,
    slab,
    B_X_MID: bx,
    B_Y410: by,
    pass_all,
    vol_slab_2levels_m3: vol_slab_m3,
    vol_slab_delta_m3: vol_vs_adopt,
    Gk_delta_kNm2: Gk_delta,
    stair_risers: nRisers,
    stair_riser_cm: riser,
    efficiency_note:
      ff_to_ff < 307 && pass_all
        ? "mai scund + PASS"
        : ff_to_ff === 307 && pass_all
          ? "aceeași înălțime"
          : ff_to_ff > 307
            ? "mai înalt — fără câștig cotă"
            : "FAIL pe ordin",
  };
});

const passing = results.filter((r) => r.pass_all);
const bestHeight = [...passing].sort((a, b) => a.ff_to_ff_cm - b.ff_to_ff_cm)[0];
const lightest = [...passing].sort((a, b) => a.vol_slab_2levels_m3 - b.vol_slab_2levels_m3)[0];
const stiffestSlab = [...passing].sort((a, b) => a.slab.delta_cr_mm - b.slab.delta_cr_mm)[0];

const verdict = {
  keep_adopt_if: "Prioritate minim beton + clear 255 deja lock → P15_D25 OK",
  switch_if_height: bestHeight
    ? `${bestHeight.id}: FF→FF ${bestHeight.ff_to_ff_cm} (Δ ${bestHeight.delta_ff_vs_adopt_cm} cm)`
    : null,
  switch_if_comfort_slab: stiffestSlab?.id,
  not_recommended: results.filter((r) => !r.pass_all).map((r) => r.id),
};

const out = {
  meta: {
    id: "s1_a1_slab_beam_pack_v01",
    generated: new Date().toISOString(),
    status: "comparație_ordin_nu_adopt_auto",
    clear_hard_cm: CLEAR,
    buildup_cm: BUILDUP,
    L_panel_m: round(L_panel, 3),
    area_box_m2: round(area_m2, 2),
    disclaimer: "Nu schimbă lock-ul. Beneficiar/structurist alege. FE confirmă.",
  },
  packs: results,
  ranking: {
    lowest_ff: bestHeight?.id,
    lightest_slab: lightest?.id,
    stiffest_slab: stiffestSlab?.id,
    current_adopt: "P15_D25",
  },
  verdict,
};

const md = `# S1 A1 — Comparație pachete placă / drop grindă

**Status:** sensibilitate · **NU** schimbă automat adoptul  
**Clear sub grindă:** **${CLEAR}** cm HARD · buildup **${BUILDUP}** cm  
**Generat:** ${out.meta.generated.slice(0, 16)}

FF→FF = ${CLEAR} + drop + placă + ${BUILDUP}

## Tabel

| Pachet | Placă | Drop | h grindă | FF→FF | Δ vs 307 | Placă δ | B_X_MID | B_Y410 | Vol placă×2 | PASS |
|--------|------:|-----:|---------:|------:|---------:|--------:|:-------:|:------:|------------:|:----:|
${results
  .map(
    (r) =>
      `| **${r.id}** ${r.label} | ${r.slab_cm} | ${r.drop_cm} | ${r.beam_h_cm} | **${r.ff_to_ff_cm}** | ${r.delta_ff_vs_adopt_cm >= 0 ? "+" : ""}${r.delta_ff_vs_adopt_cm} | ${r.slab.delta_cr_mm}/${r.slab.lim_mm} ${r.slab.pass ? "✓" : "✗"} | ${r.B_X_MID.pass ? "✓" : "✗"} δ${r.B_X_MID.delta_cr_mm} | ${r.B_Y410.pass ? "✓" : "✗"} δ${r.B_Y410.delta_cr_mm} | ${r.vol_slab_2levels_m3} (Δ${r.vol_slab_delta_m3 >= 0 ? "+" : ""}${r.vol_slab_delta_m3}) | **${r.pass_all}** |`
  )
  .join("\n")}

## Ranking (doar PASS)

| Criteriu | Pachet |
|----------|--------|
| Cel mai scund (FF→FF) | **${bestHeight?.id}** (${bestHeight?.ff_to_ff_cm} cm) |
| Cel mai puțin beton placă | **${lightest?.id}** |
| Placă cea mai rigidă (δ min) | **${stiffestSlab?.id}** (δ=${stiffestSlab?.slab.delta_cr_mm} mm) |
| Adopt curent | **P15_D25** |

## Detaliu grinzi critice

### B_X_MID (L=${L_BX} m, q=${q_BX})

| Pachet | h | δ_cr/lim | PASS |
|--------|--:|---------|:----:|
${results.map((r) => `| ${r.id} | ${r.beam_h_cm} | ${r.B_X_MID.delta_cr_mm}/${r.B_X_MID.lim_mm} | **${r.B_X_MID.pass}** |`).join("\n")}

### B_Y410 (L=${L_BY} m, q=${q_BY})

| Pachet | h | δ_cr/lim | PASS |
|--------|--:|---------|:----:|
${results.map((r) => `| ${r.id} | ${r.beam_h_cm} | ${r.B_Y410.delta_cr_mm}/${r.B_Y410.lim_mm} | **${r.B_Y410.pass}** |`).join("\n")}

## Verdict

- **Păstrează P15_D25** dacă vrei minim beton și accepti FF→FF 307.  
- **Treci la ${bestHeight?.id}** dacă vrei clădire mai scundă (${bestHeight?.delta_ff_vs_adopt_cm} cm) fără a pierde PASS pe ordin.  
- **${stiffestSlab?.id}** dacă prioritatea e confort SLS placă (mai greu).  
- Nu recomandat: ${verdict.not_recommended.join(", ") || "—"}.

> Schimbarea pachetului = FF etaj + scară P→E + 3D — doar după decizie explicită.

JSON: \`s1_a1_slab_beam_pack_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_slab_beam_pack_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_slab_beam_pack_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      ranking: out.ranking,
      packs: results.map((r) => ({
        id: r.id,
        ff: r.ff_to_ff_cm,
        pass: r.pass_all,
        note: r.efficiency_note,
      })),
    },
    null,
    2
  )
);
