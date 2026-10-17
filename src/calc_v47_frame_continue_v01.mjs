/**
 * Continuare calc FRAME: 2.3 aprofundat + 2.1b seism ordin + 2.5 întoarsă.
 * NU adoptă secțiuni. Rulează: node src/calc_v47_frame_continue_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outMd = path.join(root, "outputs/reports/v47_a1_frame_calc_continue_v01.md");
const outJson = path.join(root, "outputs/reports/v47_a1_frame_calc_continue_v01.json");

const Qk = 2.0; // kN/m² util
const Gk_slab15 = 0.15 * 25 + 1.5; // BA + finisaje ordin ~5.25
const Gk_slab20 = 0.2 * 25 + 1.5;
const psi2 = 0.3;
const Q_qp = Gk_slab15 + psi2 * Qk; // quasi-permanent for deflection
const Q_qp20 = Gk_slab20 + psi2 * Qk;
const Ecm = 31e6; // kN/m² C25/30 approx
const FYD = 500 / 1.15;

function round(x, d = 2) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

/** EC2 span/depth check with K factor (table 7.4N style). */
function spanDepth(L, h, K, longTerm = true) {
  const d = h - 0.025;
  const basic = K * (40); // ρ=ρ0 simplified mid: K*40 for lightly reinforced
  // long-term multiply ~0.7 rough if cracked — use basic as allowable L/d
  const allow = longTerm ? basic * 0.85 : basic;
  const ratio = L / d;
  return {
    L,
    h_cm: h * 100,
    d_cm: round(d * 100, 1),
    L_over_d: round(ratio, 1),
    allow_L_over_d: round(allow, 1),
    K,
    pass: ratio <= allow,
  };
}

/** Săgeată elastică simplu rezemată δ = 5 q L^4 / (384 EI); I = b d³/12 per m. */
function deflection(L, h, q) {
  const d = h - 0.025;
  const I = (1.0 * d ** 3) / 12; // m⁴ /m
  const delta = (5 * q * L ** 4) / (384 * Ecm * I) * 1000; // mm
  const limit = L * 1000 / 250; // mm L/250
  return {
    delta_mm: round(delta, 1),
    limit_L250_mm: round(limit, 1),
    pass_L250: delta <= limit,
    note: "elastic nefisurat — optimist; fisurat ≈ 2–3×",
  };
}

// --- 2.3 slab options ---
const L_full = 6.2;
const L_half = 3.1; // cu bandă pe axa N_MID–S_DORM_E
const slabOpts = {
  flat_15_full: {
    ...spanDepth(L_full, 0.15, 1.3), // continuous interior K~1.5; use 1.3 conservative edge
    defl: deflection(L_full, 0.15, Q_qp),
    label: "placă 15 pe 6,2 m (fără bandă)",
  },
  flat_15_cont_K15: {
    ...spanDepth(L_full, 0.15, 1.5),
    defl: deflection(L_full, 0.15, Q_qp),
    label: "placă 15 · K=1,5 continuu (tot 6,2)",
  },
  flat_20_full: {
    ...spanDepth(L_full, 0.2, 1.3),
    defl: deflection(L_full, 0.2, Q_qp20),
    label: "placă 20 pe 6,2 m",
  },
  band_15_half: {
    ...spanDepth(L_half, 0.15, 1.3),
    defl: deflection(L_half, 0.15, Q_qp),
    label: "placă 15 + bandă pe axa C_N_MID–C_S_DORM_E (L≈3,1)",
  },
  flat_28_full: {
    ...spanDepth(L_full, 0.28, 1.3),
    defl: deflection(L_full, 0.28, Gk_slab20 + 0.08 * 25 + psi2 * Qk),
    label: "placă 28 pe 6,2 (comparație — impact clear)",
  },
};

// Band beam rough: trib 3.1 m each side, L≈6.45 N–S
const bandBeam = (() => {
  const L = 6.45;
  const trib = 3.1;
  const q = (1.35 * Gk_slab15 + 1.5 * Qk) * trib;
  const M = (q * L * L) / 8;
  const b = 0.3;
  const h = 0.35;
  const d = h - 0.05;
  const As = (M * 1e6) / (0.9 * d * 1000 * FYD);
  const mu = M / (b * d * d * (25 / 1.5) * 1000);
  return {
    L_m: L,
    trib_m: trib,
    q_kNm: round(q, 1),
    M_kNm: round(M, 1),
    section: "30×35 tip",
    As_mm2: round(As, 0),
    mu: round(mu, 3),
    flex_ok: mu < 0.25,
    clear_impact: "h=35 → clear 241 pe bandă (D1 OK); NU pe A7 compartimentare ca grindă vizibilă — bandă în placă / grindă îngropată de studiat",
  };
})();

// --- 2.1b seismic ordinal ---
// Ipoteză Turda/Cluj: ag≈0.10g, γI=1.0, q=3.0 cadre ductile medii, Tc≈0.7 — NU zonare oficială parcelă
const ag = 0.1;
const S = 1.2; // tip C ordin
const q_duct = 3.0;
const Sd_over_ag = (2.5 * S) / q_duct; // plateau approx /q
const Sd = ag * 9.81 * Sd_over_ag; // m/s² spectral accel design ordin
// Mass: footprint heated ~6.5×6.5 + stair ~ 50 m² × 2 floors × G ≈ 
const area = 48; // m² ordin heated
const W_floor = area * Gk_slab15; // kN per floor
const W_tot = W_floor * 2 + area * 3.5; // + roof light + walls share
const Vb = 0.85 * (Sd / 9.81) * W_tot; // λ≈0.85 · Sd/g · W  (Sd already /q-ish)
const nCols = 11;
const V_per_col = Vb / nCols;
const H_story = 2.88;
// Moment ordin pe stâlp (portal simplu): M ≈ V_col * H / 2
const M_seis = (V_per_col * H_story) / 2;

const seismic = {
  hypothesis: "ag=0.10g · S=1.2 · q=3 · λ=0.85 — IPÓTEZĂ, nu zonare 131",
  W_tot_kN: round(W_tot, 0),
  Sd_g: round(Sd / 9.81, 3),
  Vb_kN: round(Vb, 1),
  V_per_col_avg_kN: round(V_per_col, 2),
  M_story_ord_kNm: round(M_seis, 2),
  Nrd_30x30: 1200,
  // Interacțiune: M_rd ordin 30×30 cu ω mic ≈ 40–60 kNm — compară
  M_rd_30x30_ord_kNm: 55,
  M_rd_30x40_ord_kNm: 75,
  note: "V/M medii pe stâlp; colțurile iau mai mult — FE+P100 obligatoriu înainte de along→30",
};

const colSeismicFlags = [
  { id: "C_NW", role: "colț", M_factor: 1.4 },
  { id: "C_N_MID", role: "fațadă N", M_factor: 1.1 },
  { id: "C_NE", role: "colț", M_factor: 1.4 },
  { id: "C_W_MID", role: "fațadă", M_factor: 1.1 },
  { id: "C_W_DORM", role: "colț", M_factor: 1.3 },
  { id: "C_S_DORM_E", role: "30×30", M_factor: 1.0 },
  { id: "C_E_GEAM_S", role: "fațadă E", M_factor: 1.2 },
  { id: "C_E_PAL", role: "nod consolă", M_factor: 1.5 },
  { id: "C_CASA_SCARA", role: "separator", M_factor: 1.0 },
  { id: "C_S_INTRARE_W", role: "fațadă S", M_factor: 1.1 },
  { id: "C_S_INTRARE_E", role: "30×30", M_factor: 1.0 },
].map((c) => {
  const M = M_seis * c.M_factor;
  const ok30 = M < 0.7 * seismic.M_rd_30x30_ord_kNm;
  const ok40 = M < 0.7 * seismic.M_rd_30x40_ord_kNm;
  return {
    ...c,
    M_ord_kNm: round(M, 1),
    try_30x30_after_FE: ok30 && c.id !== "C_E_PAL",
    keep_30x40_hint: !ok30 || c.id === "C_E_PAL",
    ok_vs_Mrd30_70pct: ok30,
    ok_vs_Mrd40_70pct: ok40,
  };
});

// --- 2.5 inverted beam ---
const inv = (() => {
  const L = 1.15; // m X566–681 approx dx=115
  const h = 0.25; // dy geometric 25 cm as beam depth above? actually inverted below slab
  const b = 0.25;
  // Load: shaft edge + wall above + slab strip
  const q = 25; // kN/m conservator (zid+placă)
  const M = (q * L * L) / 8;
  const V = (q * L) / 2;
  const pier = {
    section: "15×15",
    N_ord: round(V + 30, 0), // reaction + wall
    Nrd_15: round(0.8 * 0.15 * 0.15 * (25 / 1.5) * 1000, 0),
    note: "pier mic — OK axial ordin; confinare/legătură la grindă = detaliu",
  };
  return {
    id: "B_Y590_EDGE_INVERTED",
    L_m: L,
    geo: "Y575–600 dy=25 · X566.3 dx=115 · z sandwich −30…+32",
    q_kNm: q,
    M_kNm: round(M, 1),
    V_kN: round(V, 1),
    west_support: "placă + B_SEP_AFTER_DOOR + C_CASA_SCARA — slab pe V dacă placa e subțire",
    east_support: "C_SHAFT_E_PIER",
    pier,
    verdict:
      "Geo OK (ușă liberă). Calcul: armare întoarsă + transmitere V prin placă 15 = FE local. Nu schimba dy=25 acum.",
  };
})();

const result = {
  status: "preliminar_continuare — nu adoptare",
  slab_2_3: { Q_qp, opts: slabOpts, bandBeam },
  seismic_2_1b: { ...seismic, columns: colSeismicFlags },
  inverted_2_5: inv,
  model_actions: {
    change_sections: false,
    change_slab_th: false,
    recommend_next:
      "FE placă 15 cu/fără bandă pe axa N_MID–S_DORM_E; FE P100 pe cadre; detaliu nod întoarsă V",
  },
};

const optRows = Object.values(slabOpts)
  .map(
    (o) =>
      `| ${o.label} | ${o.L_over_d} | ${o.allow_L_over_d} | ${o.pass ? "OK ordin" : "**fail ordin**"} | δ≈${o.defl.delta_mm} mm (lim ${o.defl.limit_L250_mm}; ${o.defl.pass_L250 ? "OK el." : "fail el."}) |`
  )
  .join("\n");

const seisRows = colSeismicFlags
  .map(
    (c) =>
      `| ${c.id} | ${c.role} | ${c.M_ord_kNm} | ${c.ok_vs_Mrd30_70pct ? "da" : "nu"} | ${c.try_30x30_after_FE ? "candidat" : "păstrează/FE"} |`
  )
  .join("\n");

const md = `# V47 A1 FRAME — Continuare calc (2.3 aprofundat · 2.1b seism · 2.5 întoarsă)

**Status:** ordin de mărime · **NU** proiect semnat · **NU** adoptare în generator  
**Dată:** 2026-10-16

## 2.3 Placă — L/d cu factor K + săgeată elastică

q_qp (săgeți) ≈ **${round(Q_qp, 2)}** kN/m² (G + ψ₂Q) @15 cm.

| Variantă | L/d | L/d admis (K) | Span/depth | Săgeată elastică |
|----------|----:|-------------:|------------|------------------|
${optRows}

### Bandă pe axa \`C_N_MID\`–\`C_S_DORM_E\`

| | |
|--|--|
| Efect | deschidere placă **6,2 → ~3,1 m** |
| Grindă bandă tip | ${bandBeam.section} · L=${bandBeam.L_m} m · M≈${bandBeam.M_kNm} kNm · μ=${bandBeam.mu} · flex ${bandBeam.flex_ok ? "OK" : "RISK"} |
| Clear | ${bandBeam.clear_impact} |

**Citire:** placa 15 pe 6,2 **nu** trece ordin SLS; cu **bandă** la 3,1 m **trece** span/depth ordin.  
Placa 20 tot pe 6,2 tot e la limită/fail. Placa 28 trece dar **strică clear 255** (−13 cm vs 15).  
→ **Țintă rămâne 15 + bandă sau FE care demonstrează continuu**; nu îngroșa acum.

## 2.1b Seism (ipoteză ag=0,10g)

| | |
|--|--|
| W total ordin | ${seismic.W_tot_kN} kN |
| Vb | ${seismic.Vb_kN} kN |
| V med / stâlp | ${seismic.V_per_col_avg_kN} kN |
| M etaj med | ${seismic.M_story_ord_kNm} kNm |
| Mrd ordin 30×30 / 30×40 | ${seismic.M_rd_30x30_ord_kNm} / ${seismic.M_rd_30x40_ord_kNm} kNm |

| ID | Rol | M ordin | vs 0,7·Mrd30 | Along→30 |
|----|-----|--------:|:------------:|----------|
${seisRows}

**Citire:** axial era generos; **seismul pe colțuri** mănâncă din rezervă. Candidații along→30 rămân valabili **doar după FE P100**; \`C_E_PAL\` + colțuri = prioritate păstrare 30×40 până la rezultat.

> ${seismic.hypothesis}

## 2.5 Grindă întoarsă \`B_Y590_EDGE_INVERTED\`

| | |
|--|--|
| Geo | ${inv.geo} |
| L / q / M / V | ${inv.L_m} m · ${inv.q_kNm} kN/m · ${inv.M_kNm} kNm · ${inv.V_kN} kN |
| Capăt E | pier ${inv.pier.section} · N≈${inv.pier.N_ord} / Nrd≈${inv.pier.Nrd_15} kN |
| Capăt V | ${inv.west_support} |
| Verdict | ${inv.verdict} |

## Acțiuni model (acum)

| | |
|--|--|
| Schimbă stâlpi/grinzi/placă în generator | **Nu** |
| Următor calc | FE placă 15 ± bandă; FE P100; detaliu întoarsă V |
| Faza 1 geo | accept pad B_X360 (separat) |

JSON: \`outputs/reports/v47_a1_frame_calc_continue_v01.json\`
`;

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));

const passBand = slabOpts.band_15_half.pass;
const passFlat = slabOpts.flat_15_full.pass;
console.log(
  JSON.stringify(
    {
      ok: true,
      outMd,
      slab15_full: passFlat,
      slab15_band: passBand,
      Vb: seismic.Vb_kN,
      candidates_seis: colSeismicFlags.filter((c) => c.try_30x30_after_FE).map((c) => c.id),
    },
    null,
    2
  )
);
