/**
 * Opțiuni B_BAND_X320: 1-way · 2-way · + reazem Y400 (respins — dorm LOCK).
 * Rulează: node src/calc_v47_frame_band_options_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outMd = path.join(root, "outputs/reports/v47_a1_frame_band_options_v01.md");
const outJson = path.join(root, "outputs/reports/v47_a1_frame_band_options_v01.json");

const Q = 11.78;
const FYD = 500 / 1.15;
const FCD = 25 / 1.5;
const b = 0.4;
const h = 0.35;
const d = h - 0.05;
const round = (x, n = 1) => Math.round(x * 10 ** n) / 10 ** n;

function bandCase(id, L, trib, note) {
  const q = Q * trib;
  const M = 0.9 * ((q * L * L) / 8); // continuous factor
  const V = (q * L) / 2;
  const As = (M * 1e6) / (0.9 * d * 1000 * FYD);
  const mu = M / (b * d * d * FCD * 1000);
  let bars;
  if (As < 450) bars = "≈4φ12";
  else if (As < 650) bars = "≈4φ14";
  else if (As < 900) bars = "≈4φ16";
  else if (As < 1200) bars = "≈6φ16 / 4φ18";
  else bars = "≈6φ18+ — reconsideră";
  return {
    id,
    L_m: L,
    trib_m: trib,
    q_kNm: round(q, 1),
    M_kNm: round(M, 1),
    V_kN: round(V, 1),
    mu: round(mu, 3),
    As_mm2: round(As, 0),
    bars,
    flex_ok: mu < 0.25,
    note,
  };
}

const cases = [
  bandCase("A_1way_full", 6.45, 3.1, "Un traveu N–S · trib 1-way complet — bound superior"),
  bandCase("B_2way_red", 6.45, 2.0, "Un traveu · trib redus 2-way — ȚINTĂ (dorm LOCK: fără Y400)"),
  bandCase(
    "C_Y400_support",
    4.0,
    3.1,
    "RESPINS amenajare: Y400 prin dorm — LOCK neatins"
  ),
  bandCase(
    "D_Y400_plus_2way",
    4.0,
    2.0,
    "RESPINS amenajare: Y400 prin dorm — LOCK neatins"
  ),
];

const pick = cases.find((c) => c.id === "B_2way_red");
const rejectY400 = cases.find((c) => c.id === "D_Y400_plus_2way");

const result = {
  status: "opțiuni studiu pe R — dorm LOCK",
  dorm_lock: "fără grindă transversală în dormitor — B_Y400 retras",
  cases,
  recommended_calc: pick.id,
  recommended_geo: "B_BAND_X320 only (N_MID–S_DORM_E)",
  adopt: {
    keep_band: "B_BAND_X320",
    remove_beam: "B_Y400_BAND_TIE",
    expect_As: pick.As_mm2,
    expect_bars: pick.bars,
    rejected_amenajare: rejectY400.id,
  },
};

const rows = cases
  .map(
    (c) =>
      `| ${c.id === pick.id ? "**" + c.id + "**" : c.id} | ${c.L_m} | ${c.trib_m} | ${c.M_kNm} | ${c.As_mm2} | ${c.bars} | ${c.flex_ok ? "OK" : "RISK"} |`
  )
  .join("\n");

const md = `# B_BAND_X320 — opțiuni (1-way / 2-way / Y400)

**Context:** pe ipoteză 1-way full, As≈1450 mm² e greu. Căutăm reducere **fără** grindă prin dorm.

**LOCK:** \`în dormitor nu modificăm\` — \`B_Y400_BAND_TIE\` **retras**.

## Comparație

| Caz | L (m) | trib | M (kNm) | As | Bare | Flex |
|-----|------:|-----:|--------:|---:|------|------|
${rows}

## Recomandare pe R (post LOCK dorm)

1. **Geo:** \`B_BAND_X320\` pe \`C_N_MID\`–\`C_S_DORM_E\` — **fără** Y400.  
2. **Calc FE:** placă **2-way** + bandă → țintă caz **B** (As≈${pick.As_mm2}, ${pick.bars}).  
3. Cazurile **C/D** (Y400) = doar istoric / bound; **respins** amenajare.  
4. Cazul **A** (1-way full) = bound superior, nu țintă.

JSON: \`outputs/reports/v47_a1_frame_band_options_v01.json\`
`;

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(
  JSON.stringify(
    {
      ok: true,
      recommended: pick.id,
      As: pick.As_mm2,
      bars: pick.bars,
      dorm_lock: true,
    },
    null,
    2
  )
);
