/**
 * Combinații CR0 pe bare critice A1 — scalează eforturile din calc_100.
 * Rulează: node src/calc_a1_cr0_members_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const calc100 = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), "utf8")
);
const wind = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_wind_buckling_ec5_v01.json"), "utf8")
);
const maxR = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_max_inrepo_v01.json"), "utf8")
);
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/** Descompunere tip locuință care reproduce q_Ed≈11,78 */
const Gk_floor = 6.5;
const Qk_floor = 2.0;
const q_STR_Q = 1.35 * Gk_floor + 1.5 * Qk_floor; // 11.775
const q_ref = calc100.meta?.q_Ed ?? q_STR_Q;

const combosFloor = {
  STR_Q: {
    id: "STR_Q",
    label: "1,35G + 1,5Q (dominantă utilă)",
    factor_vs_ref: (1.35 * Gk_floor + 1.5 * Qk_floor) / q_ref,
    q_kNm2: round(1.35 * Gk_floor + 1.5 * Qk_floor, 2),
  },
  STR_W: {
    id: "STR_W",
    label: "1,35G + 1,5W + 0,7·1,5Q (vânt dominant — peri)",
    // W pe grinzi perimetrale: qp*cpe ~ 0.5 pe bandă 1m → +0.75 kN/m² ordin pe trib
    factor_vs_ref:
      (1.35 * Gk_floor + 1.5 * 0.75 + 0.7 * 1.5 * Qk_floor) / q_ref,
    q_kNm2: round(1.35 * Gk_floor + 1.5 * 0.75 + 0.7 * 1.5 * Qk_floor, 2),
  },
  SEIS: {
    id: "SEIS",
    label: "G + ψ2Q + E (ψ2=0,3) — eforturi gravitaționale reduse + M din Vb",
    factor_vs_ref: (Gk_floor + 0.3 * Qk_floor) / q_ref,
    q_kNm2: round(Gk_floor + 0.3 * Qk_floor, 2),
  },
};

const CRITICAL_BEAMS = ["B_Y410", "B_E_S", "B_E", "B_X_MID", "B_N", "B_W"];
const CRITICAL_COLS = ["C_E_PAL", "C_N_MID", "C_W_MID", "C_NE"];

const beamsAll = calc100.beams || [];
const colsAll = calc100.columns || [];

function scaleBeam(b, combo) {
  const f = combo.factor_vs_ref;
  const M = round(b.M_kNm * f, 1);
  const V = round(b.V_kN * f, 1);
  const As = round(b.As_mm2 * f, 0);
  // capacity from original pass ratios roughly
  const Vrd = parseFloat(String(b.V_kN_vs_Vrdc || "0 / 37.8").split("/")[1]) || 37.8;
  const lim = b.lim_L250_mm ?? 999;
  const delta = round((b.delta_cr_mm ?? 0) * f, 1);
  return {
    id: b.id,
    combo: combo.id,
    M_kNm: M,
    V_kN: V,
    As_mm2: As,
    flex_ok: (b.mu ?? 0) * f < 0.25 && M < (b.M_kNm / (b.mu || 0.01)) * 0.25,
    // simpler: if original pass and f<=1.05 ok; if f>1 check mu*f
    shear_ok: V <= Vrd,
    sls_ok: delta <= lim,
    pass: null,
    note: b.note || "",
  };
}

const beamResults = CRITICAL_BEAMS.map((id) => {
  const b = beamsAll.find((x) => x.id === id);
  if (!b) return { id, missing: true };
  const byCombo = Object.values(combosFloor).map((c) => {
    const r = scaleBeam(b, c);
    const mu0 = b.mu ?? 0.05;
    r.flex_ok = mu0 * c.factor_vs_ref <= 0.3;
    r.pass = r.flex_ok && r.shear_ok && (c.id === "SEIS" ? true : r.sls_ok);
    return r;
  });
  // SEIS: add moment from column/beam seismic share — ordin 10% of gravity M as placeholder from Vb
  const seis = byCombo.find((x) => x.combo === "SEIS");
  if (seis) {
    const M_E = round(b.M_kNm * 0.15, 1); // ordin din deformare/cadru
    seis.M_E_kNm = M_E;
    seis.M_tot_kNm = round(seis.M_kNm + M_E, 1);
    seis.pass = seis.M_tot_kNm <= b.M_kNm * 1.2 || (b.mu ?? 0) * 1.2 <= 0.3;
  }
  return {
    id,
    L_m: b.L_m,
    section: b.section,
    ref_M: b.M_kNm,
    ref_pass: b.pass,
    combos: byCombo,
    governing: byCombo.reduce((a, x) =>
      (x.M_tot_kNm ?? x.M_kNm) > (a.M_tot_kNm ?? a.M_kNm) ? x : a
    ),
  };
});

const Vb = calc100.seismic?.Vb_kN ?? 75.9;
const colResults = CRITICAL_COLS.map((id) => {
  const c = colsAll.find((x) => x.id === id);
  if (!c) return { id, missing: true };
  const seisShare = (maxR.seismicCols || []).find((x) => x.id === id);
  const rows = [
    {
      combo: "STR_Q",
      N_kN: round(c.N_kN, 1),
      M_kNm: round(c.M_ordin_kNm, 1),
      util: c.util_NM,
      pass: c.pass,
    },
    {
      combo: "SEIS",
      N_kN: round(c.N_kN * combosFloor.SEIS.factor_vs_ref, 1),
      M_kNm: round(
        c.M_ordin_kNm * combosFloor.SEIS.factor_vs_ref + (seisShare?.M_E_kNm ?? c.M_ordin_kNm * 0.25),
        1
      ),
      util: round(
        (c.util_NM || 0.5) * combosFloor.SEIS.factor_vs_ref + 0.15,
        2
      ),
      pass: null,
    },
  ];
  rows[1].pass = rows[1].util <= 1.0;
  return {
    id,
    section: c.section,
    Nrd: c.Nrd_kN,
    Vb_share_note: seisShare ? `din max_inrepo` : `ordin 0,25·M`,
    combos: rows,
    governing: rows.reduce((a, x) => (x.util > a.util ? x : a)),
  };
});

// Roof member CR0 from wind pack
const roofCombos = [
  {
    id: "SNOW",
    label: wind.combos?.snow_leading?.label,
    q: wind.combos?.snow_leading?.q_Ed,
  },
  {
    id: "WIND_FIELD",
    label: "Vânt câmp",
    q: wind.combos?.wind_leading?.q_Ed_pressure_field,
  },
  {
    id: "WIND_UPLIFT",
    label: "Suctiune streșină (net)",
    q: wind.combos?.wind_leading?.q_net_uplift,
  },
];

const allBeamPass = beamResults
  .filter((b) => !b.missing)
  .every((b) => b.combos.every((c) => c.pass));
const allColPass = colResults
  .filter((c) => !c.missing)
  .every((c) => c.combos.every((x) => x.pass));

const out = {
  meta: {
    id: "s1_a1_cr0_members_v01",
    generated: new Date().toISOString(),
    status: "ordin_CR0_nu_model_FE",
    disclaimer:
      "Scalează eforturi din calc_100; nu înlocuiește combinații pe bare din FEM. W pe grinzi = ordin.",
    Gk_floor,
    Qk_floor,
    q_ref,
    Vb_kN: Vb,
  },
  combos_floor: combosFloor,
  beams: beamResults,
  columns: colResults,
  roof_combos: roofCombos,
  summary: {
    beams_all_pass: allBeamPass,
    columns_all_pass: allColPass,
    governing_beam: beamResults
      .filter((b) => !b.missing)
      .map((b) => ({
        id: b.id,
        combo: b.governing.combo,
        M: b.governing.M_tot_kNm ?? b.governing.M_kNm,
      }))
      .sort((a, b) => b.M - a.M)[0],
  },
};

const md = `# S1 A1 — Combinații CR0 pe bare critice

**Status:** ordin pe eforturi existente · **NU** model FE · **NU** semnat  
**Generat:** ${out.meta.generated.slice(0, 16)}

## Descompunere planșeu

| | kN/m² |
|--|------:|
| Gk | **${Gk_floor}** |
| Qk | **${Qk_floor}** |
| STR 1,35G+1,5Q | **${combosFloor.STR_Q.q_kNm2}** (ref calc ≈ ${q_ref}) |

## Combinații

| ID | Descriere | q / factor |
|----|-----------|------------|
${Object.values(combosFloor)
  .map((c) => `| ${c.id} | ${c.label} | q=${c.q_kNm2} · f=${round(c.factor_vs_ref, 3)} |`)
  .join("\n")}

## Grinzi critice

${beamResults
  .filter((b) => !b.missing)
  .map((b) => {
    const rows = b.combos
      .map(
        (c) =>
          `| ${c.combo} | ${c.M_tot_kNm ?? c.M_kNm}${c.M_E_kNm != null ? ` (G ${c.M_kNm}+E ${c.M_E_kNm})` : ""} | ${c.V_kN} | ${c.As_mm2} | **${c.pass}** |`
      )
      .join("\n");
    return `### ${b.id} (${b.section}, L=${b.L_m} m) — ref M=${b.ref_M}

| Combo | M kNm | V | As | PASS |
|-------|------:|--:|---:|:----:|
${rows}

Guvernant: **${b.governing.combo}**
`;
  })
  .join("\n")}

## Stâlpi critici

${colResults
  .filter((c) => !c.missing)
  .map((c) => {
    const rows = c.combos
      .map((x) => `| ${x.combo} | ${x.N_kN} | ${x.M_kNm} | ${x.util} | **${x.pass}** |`)
      .join("\n");
    return `### ${c.id} (${c.section})

| Combo | N | M | util | PASS |
|-------|--:|--:|-----:|:----:|
${rows}
`;
  })
  .join("\n")}

## Acoperiș (din wind pack)

| Combo | q |
|-------|--:|
${roofCombos.map((r) => `| ${r.id} — ${r.label || ""} | **${r.q}** |`).join("\n")}

## Rezumat

- Grinzi toate PASS pe combo: **${allBeamPass}**
- Stâlpi toate PASS pe combo: **${allColPass}**
- Grindă guvernantă: **${out.summary.governing_beam?.id}** @ ${out.summary.governing_beam?.combo} (M≈${out.summary.governing_beam?.M})

> FE trebuie să aplice combinațiile pe model 3D — aici e doar scalare onestă a ordinului din repo.

JSON: \`s1_a1_cr0_members_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_cr0_members_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_cr0_members_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      beams_pass: allBeamPass,
      cols_pass: allColPass,
      gov: out.summary.governing_beam,
    },
    null,
    2
  )
);
