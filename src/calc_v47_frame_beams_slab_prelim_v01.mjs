/**
 * Predimensionare 2.3 placă + 2.4 grinzi perimetrale (ordin).
 * Rulează: node src/calc_v47_frame_beams_slab_prelim_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "outputs/reports/v47_a1_frame_calc_2_3_2_4_slab_beams_v01.md");
const jsonOut = path.join(root, "outputs/reports/v47_a1_frame_calc_2_3_2_4_slab_beams_v01.json");

const Q = 11.78;
const FYD = 500 / 1.15;
const FCD = 25 / 1.5;

function round(x, d = 1) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

/** Placă bidirectională simplificată: M ≈ q L²/8 pe deschiderea critică. */
function slab(L, hCm) {
  const h = hCm / 100;
  const d = h - 0.025;
  const M = (Q * L * L) / 8;
  const L_over_d = L / d;
  const As = (M * 1e6) / (0.9 * d * FYD * 1e3);
  // EC2 span/depth rough limit for simply supported ~20–26 (with ψ); continuous higher
  const limitSimple = 26;
  const sls_signal = L_over_d > limitSimple ? "SLS_semnal_fail_ordin" : "SLS_ordin_OK";
  return {
    L_m: L,
    h_cm: hCm,
    M_kNm_m: round(M),
    L_over_d: round(L_over_d, 1),
    As_mm2_m: round(As),
    sls_signal,
  };
}

/** Grindă: trib b, L între reazeme, secțiune b×h. */
function beam(id, L, trib, bCm, hCm) {
  const b = bCm / 100;
  const h = hCm / 100;
  const d = h - 0.05;
  const q = Q * trib;
  const M = (q * L * L) / 8;
  const V = (q * L) / 2;
  // As: M[kNm] → Nmm; d[m]; fyd[MPa] → As[mm²]
  const As = (M * 1e6) / (0.9 * (d * 1000) * FYD);
  // μ = M / (b d² fcd); M[kNm], b,d[m], fcd[MPa] → factor 1000 (1 MPa·m³ = 1000 kNm)
  const mu = M / (b * d * d * FCD * 1000);
  const okFlex = mu < 0.25;
  const k = Math.min(2, 1 + Math.sqrt(200 / (d * 1000)));
  const rho = Math.min(0.02, As / 1e6 / (b * d));
  // Vrd,c [kN]: 0.12 k (100 ρ fck)^(1/3) b_mm d_mm / 1000
  const vRdc =
    (0.12 *
      k *
      Math.pow(100 * Math.max(rho, 0.002) * 25, 1 / 3) *
      (b * 1000) *
      (d * 1000)) /
    1000;
  return {
    id,
    L_m: L,
    trib_m: trib,
    section: `${bCm}×${hCm}`,
    M_kNm: round(M),
    V_kN: round(V),
    As_mm2: round(As),
    mu: round(mu, 3),
    flex_ok_ordin: okFlex,
    V_vs_Vrdc_ordin: `${round(V)} / ~${round(vRdc)}`,
    note: okFlex ? "flexiune ordin OK @35" : "μ mare — mărește h sau reduce trib",
  };
}

// Living fără X320: deschidere critică ~6,2 m (audit)
const slab15 = slab(6.2, 15);
const slab20 = slab(6.2, 20);

const beams = [
  beam("B_N_span_NW_MID", 3.2, 1.6, 30, 35),
  beam("B_N_span_MID_NE", 3.3, 1.6, 30, 35),
  beam("B_W_span_NW_WMID", 4.0, 1.5, 30, 35),
  beam("B_W_span_WMID_WDORM", 2.45, 1.5, 30, 35),
  beam("B_E_span_NE_GEAM", 3.1, 1.5, 30, 35),
  beam("B_E_span_GEAM_PAL", 1.4, 1.5, 30, 35),
  beam("B_Y645", 3.6, 1.5, 30, 35),
  beam("B_Y830", 1.75, 1.2, 30, 35),
  beam("B_min_b20_test_Y645", 3.6, 1.5, 20, 35),
];

const result = {
  status: "preliminar_ordin — nu adoptare",
  slab: { L_crit_m: 6.2, h15: slab15, h20: slab20 },
  beams,
  decisions: {
    slab_15: "păstrează țintă; SLS semnal → FE obligatoriu (nu îngroșa acum)",
    beams_b30_h35: "ordin flexiune OK pe deschideri perimetrale",
    beams_b20: "test Y645 — verifică mu; noduri pe stâlpi 30 cer b≥30 la față stâlp preferabil",
  },
};

const md = `# V47 A1 FRAME — Calc 2.3 placă + 2.4 grinzi (preliminar)

**Status:** ordin · **NU** proiect semnat · **NU** adoptare  
**q_Ed:** ${Q} kN/m²

## 2.3 Placă living (fără X320) — L ≈ 6,2 m

| h | L/d | M (kNm/m) | Semnal SLS (L/d vs ~26) |
|--:|----:|----------:|-------------------------|
| **15** | ${slab15.L_over_d} | ${slab15.M_kNm_m} | **${slab15.sls_signal}** |
| 20 | ${slab20.L_over_d} | ${slab20.M_kNm_m} | **${slab20.sls_signal}** |

Citire: ambele au L/d **peste** limita ordin simplu rezemat → **calcul_lipsă FE** (continuu / bandă / PT).  
**Nu** adoptăm 25–28 acum (lock proiect). Clear 255 cere **15** ca țintă.

## 2.4 Grinzi perimetrale (b=30 · h=35)

| ID | L (m) | trib | M (kNm) | V (kN) | μ | Flexiune |
|----|------:|-----:|--------:|-------:|--:|----------|
${beams
  .filter((b) => !b.id.includes("b20"))
  .map(
    (b) =>
      `| ${b.id} | ${b.L_m} | ${b.trib_m} | ${b.M_kNm} | ${b.V_kN} | ${b.mu} | ${b.flex_ok_ordin ? "OK ordin" : "RISK"} |`
  )
  .join("\n")}

### Test b=20 pe B_Y645

| | |
|--|--|
| Secțiune | 20×35 |
| M / μ | ${beams.find((b) => b.id.includes("b20")).M_kNm} / ${beams.find((b) => b.id.includes("b20")).mu} |
| Citire | Flexiune poate trece ordin; **nod pe stâlp 30** → preferă **b=30** la față (nu reduce b sub thru fără detaliu) |

## Decizie model (acum)

| Element | Acțiune |
|---------|---------|
| Placă 15 | **păstrează** țintă; FE SLS = următorul blocant pe planșeu |
| Grinzi b×h | **păstrează 30×35**; nu reduce b la 20 în mesh |
| Clear 241 sub grindă | lock D1 — OK |

JSON: \`outputs/reports/v47_a1_frame_calc_2_3_2_4_slab_beams_v01.json\`
`;

fs.writeFileSync(outPath, md);
fs.writeFileSync(jsonOut, JSON.stringify(result, null, 2));
console.log(
  JSON.stringify(
    {
      ok: true,
      slab15: slab15.sls_signal,
      slab20: slab20.sls_signal,
      beams_ok: beams.filter((b) => b.flex_ok_ordin && !b.id.includes("b20")).length,
    },
    null,
    2
  )
);
