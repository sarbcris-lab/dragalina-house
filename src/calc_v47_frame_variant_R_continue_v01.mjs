/**
 * Continuare pe varianta R: bandă detaliată · împingere retenție · sensibilitate C_N_MID · brief FE.
 * Rulează: node src/calc_v47_frame_variant_R_continue_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const cols = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/v47_a1_frame_calc_2_1_columns_v01.json"), "utf8")
).columns;
const outMd = path.join(root, "outputs/reports/v47_a1_frame_variant_R_continue_v01.md");
const outJson = path.join(root, "outputs/reports/v47_a1_frame_variant_R_continue_v01.json");
const briefMd = path.join(root, "outputs/reports/v47_a1_frame_fe_brief_variant_R_v01.md");

const Q = 11.78;
const FYD = 500 / 1.15;
const FCD = 25 / 1.5;
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

// —— Band B_BAND_X320
const band = (() => {
  const L = 6.45; // N→S dorm
  const trib = 3.1; // half spans each side after split
  const b = 0.4; // dx 40 cm in model
  const h = 0.35;
  const d = h - 0.05;
  const q = Q * trib;
  const M = (q * L * L) / 8;
  const V = (q * L) / 2;
  const As = (M * 1e6) / (0.9 * d * 1000 * FYD);
  const mu = M / (b * d * d * FCD * 1000);
  // continuous end spans ~0.07–0.1 less M — use 0.9 factor
  const M_cont = M * 0.9;
  const As_cont = (M_cont * 1e6) / (0.9 * d * 1000 * FYD);
  return {
    id: "B_BAND_X320",
    L_m: L,
    trib_m: trib,
    section: "40×35",
    q_kNm: round(q, 1),
    M_ss_kNm: round(M, 1),
    M_cont_kNm: round(M_cont, 1),
    V_kN: round(V, 1),
    mu: round(mu, 3),
    As_ss_mm2: round(As, 0),
    As_cont_mm2: round(As_cont, 0),
    bars_hint:
      As_cont < 450
        ? "≈4φ12"
        : As_cont < 650
          ? "≈4φ14"
          : As_cont < 1200
            ? "≈4φ18 / 6φ16"
            : "≈6φ18+ — bandă grea ca grindă 1-way; FE 2-way sau al 3-lea reazem",
    clear_under_cm: 241,
    D1: "OK",
    flex_ok: mu < 0.25,
    supports: ["C_N_MID", "C_S_DORM_E"],
    load_assumption: "1-way trib 3,1 m pe L=6,45 — conservator; placă 2-way reduce M pe bandă",
    note: "As ordin mare dacă trib 1-way e real. FE: (a) placă 2-way cu bandă rigidă, (b) reazem intermediar pe Y≈400 dacă e necesar — fără stâlp nou în cameră dacă se poate pe zid.",
  };
})();

// —— Slab panels with band
const slabPanels = [
  { id: "W_of_band", L: 3.1, label: "vest de bandă (baie/dorm side)" },
  { id: "E_of_band", L: 3.1, label: "est de bandă (living side)" },
].map((p) => {
  const h = 0.15;
  const d = h - 0.025;
  const M = (Q * p.L * p.L) / 8;
  const Ld = p.L / d;
  return {
    ...p,
    h_cm: 15,
    M_kNm_m: round(M, 1),
    L_over_d: round(Ld, 1),
    pass_span_depth: Ld <= 44,
    As_mm2_m: round((M * 1e6) / (0.9 * d * 1000 * FYD), 0),
  };
});

// —— Retaining pressure (Rankine rough, dry)
const retaining = (() => {
  const H = 2.5; // m basement clear-ish to grade
  const gamma = 18; // kN/m³
  const phi = 25; // deg clayey — hypothesis
  const Ka = (1 - Math.sin((phi * Math.PI) / 180)) / (1 + Math.sin((phi * Math.PI) / 180));
  const pa = Ka * gamma * H; // kPa at base
  const E_a = 0.5 * Ka * gamma * H * H; // kN/m
  const th = 0.2;
  // vertical strip wall: M at base ≈ E_a * H/3
  const M_base = (E_a * H) / 3;
  const d = th - 0.04;
  const As_vert = (M_base * 1e6) / (0.9 * d * 1000 * FYD); // per m
  return {
    hypothesis: "γ=18 · φ=25° · H=2,5 m · uscat — NU geo 131",
    Ka: round(Ka, 3),
    pa_base_kPa: round(pa, 1),
    E_a_kN_m: round(E_a, 1),
    M_base_kNm_m: round(M_base, 1),
    wall_th_cm: 20,
    As_vert_mm2_m: round(As_vert, 0),
    bars_hint: As_vert < 250 ? "φ10@15 / φ12@20 ordin" : "φ12@15 ordin",
    verdict:
      "BA 20 plauzibil pe împingere uscată ordin; cu apă/hidro → crește E. Geo 131 obligatoriu înainte de armare finală.",
  };
})();

// —— Sensitivity C_N_MID
const nMid = cols.find((c) => c.id === "C_N_MID");
const nW = cols.find((c) => c.id === "C_NW");
const nE = cols.find((c) => c.id === "C_NE");
const sensNmid = {
  with_N_MID: {
    band_north_support: "C_N_MID",
    B_N_spans: "NW–MID ~3,2 + MID–NE ~3,3",
    N_MID_kN: nMid?.N_Ed_roof_light_kN,
    ok_for_variant_R: true,
  },
  without_N_MID: {
    band_north_support: "LIPSĂ — bandă consolă/încastrare slabă în B_N",
    B_N_span: "NW–NE ~6,5 m pe un traveu",
    N_extra_on_NW: round((nMid?.N_Ed_roof_light_kN || 0) * 0.5, 0),
    N_extra_on_NE: round((nMid?.N_Ed_roof_light_kN || 0) * 0.5, 0),
    N_NW_then: round((nW?.N_Ed_roof_light_kN || 0) + (nMid?.N_Ed_roof_light_kN || 0) * 0.5, 0),
    N_NE_then: round((nE?.N_Ed_roof_light_kN || 0) + (nMid?.N_Ed_roof_light_kN || 0) * 0.5, 0),
    ok_for_variant_R: false,
    reason: "R cere reazem N pentru B_BAND_X320; fără MID bandă și B_N se degradează simultan",
  },
  verdict: "Păstrează C_N_MID pe R. Eliminare = doar dacă abandonezi banda (și atunci placă 15 e riscantă).",
};

const result = {
  variant: "R",
  band,
  slabPanels,
  retaining,
  sensNmid,
  fe_priority: [
    "1. Placă 15 + B_BAND_X320 (P+E) — SLS/ULS",
    "2. Nod C_E_PAL + consolă B_E / B_Y470",
    "3. Cadre P100 stâlpi (along 40→30 candidați)",
    "4. Retenție + hidro pe geo 131",
    "5. D3a acoperiș pe același model",
  ],
};

const md = `# Variantă R — continuare calc (bandă · retenție · C_N_MID)

**Status:** ordin pe R · **NU** FE semnat  
**Dată:** 2026-10-16

## 1. \`B_BAND_X320\`

| | |
|--|--|
| Secțiune model | ${band.section} · L=${band.L_m} m · trib=${band.trib_m} m |
| q / M_ss / M_cont | ${band.q_kNm} kN/m · ${band.M_ss_kNm} / ${band.M_cont_kNm} kNm |
| V / μ | ${band.V_kN} kN · ${band.mu} |
| As (cont) | **${band.As_cont_mm2}** mm² → ${band.bars_hint} |
| Clear sub bandă | **${band.clear_under_cm}** cm (D1 ${band.D1}) |
| Flexiune | ${band.flex_ok ? "OK ordin" : "RISK"} |
| Reazeme | ${band.supports.join(", ")} |

${band.note}

## 2. Panouri placă 15 (cu bandă)

| Panou | L | L/d | M | Span/depth |
|-------|--:|----:|--:|------------|
${slabPanels.map((p) => `| ${p.label} | ${p.L} | ${p.L_over_d} | ${p.M_kNm_m} | ${p.pass_span_depth ? "OK" : "fail"} |`).join("\n")}

## 3. Retenție BA 20 — împingere ordin

| | |
|--|--|
| Ipoteză | ${retaining.hypothesis} |
| Ka / p_bază / E_a | ${retaining.Ka} · ${retaining.pa_base_kPa} kPa · ${retaining.E_a_kN_m} kN/m |
| M bază / As vert | ${retaining.M_base_kNm_m} kNm/m · ${retaining.As_vert_mm2_m} mm²/m (${retaining.bars_hint}) |
| Verdict | ${retaining.verdict} |

## 4. Sensibilitate \`C_N_MID\`

| | Cu MID | Fără MID |
|--|--------|----------|
| Bandă N | pe C_N_MID | **fără reazem** |
| B_N | 2 travee ~3,2+3,3 | 1 traveu ~6,5 |
| N pe NW/NE | ${nW?.N_Ed_roof_light_kN} / ${nE?.N_Ed_roof_light_kN} | ~${sensNmid.without_N_MID.N_NW_then} / ~${sensNmid.without_N_MID.N_NE_then} |
| OK pe R? | **da** | **nu** |

${sensNmid.verdict}

## 5. Prioritate FE (neschimbată)

${result.fe_priority.map((x) => `- ${x}`).join("\n")}

JSON: \`outputs/reports/v47_a1_frame_variant_R_continue_v01.json\`  
Brief structurist: \`outputs/reports/v47_a1_frame_fe_brief_variant_R_v01.md\`
`;

const brief = `# Brief FE — Dragalina V47 A1 FRAME · Varianta R

**Pentru:** structurist / model FE  
**De la:** studiu geometric + predimensionare (Cursor)  
**Data:** 2026-10-16  
**\`declared_buildable\`:** false

## Geometrie de modelat (sursă)

| Fișier | Rol |
|--------|-----|
| \`data/building/v47_a1_frame_study.json\` | schema |
| \`outputs/plans/38_*.svg\` \`39_*.svg\` \`40_*.svg\` | planuri |
| \`outputs/reports/v47_a1_frame_fe_input_pack_v01.md\` | pachet input |
| \`decisions/frame_recommended_variant_v01.md\` | lock R |

## Ce e înghețat

- Cadre BA · stâlpi thru ≥30 flush int. · ETICS pe stâlp  
- Placă **15** · **B_BAND_X320** · clear 255 sub placă / 241 sub grindă (D1)  
- Consolă palier LOCK-1R (fără stâlp living)  
- Retenție BA 20 · FG pad 80 + strip 60  
- Util E **37,469** (nu redesign amenajare)  
- Acoperiș: **D3a** întâi  

## Ce cerem de la FE (ordine)

1. **Placă 15 + bandă** P și E — SLS săgeți + ULS; comparație **fără** bandă ca dovadă.  
2. **Nod C_E_PAL** — M/T/ridicare consolă 101+105.  
3. **Stâlpi** CR0+P100 — secțiune min; candidați along 40→30 **exceptând C_E_PAL**.  
4. **Grinzi** perimetrale b×h.  
5. **Retenție + fundații** pe geo 131 (nu 310 kPa vecin).  
6. **D3a** load path; sensibilitate D3b.  

## Ordin deja pe masă (nu înlocuiește FE)

| Element | Ordin |
|---------|-------|
| Bandă | M_cont≈${band.M_cont_kNm} kNm · As≈${band.As_cont_mm2} (${band.bars_hint}) |
| Placă panou L=3,1 | L/d≈${slabPanels[0].L_over_d} · OK span/depth ordin |
| Consolă | M~6 kNm · T~7 · nod~10 (calc_2_2) |
| Retenție uscat | E_a≈${retaining.E_a_kN_m} kN/m pe H=2,5 |
| Stâlpi axial | Nrd/N ≥3 pe 30×30 — fără M seismic |

## Livrabil așteptat

\`\`\`
element | start | min_care_trece | adoptat | status
\`\`\`

Apoi: adoptare în \`study_v47_frame_schema.mjs\` (Faza 3).
`;

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
fs.writeFileSync(briefMd, brief);
console.log(
  JSON.stringify(
    {
      ok: true,
      band_M: band.M_cont_kNm,
      band_As: band.As_cont_mm2,
      retain_Ea: retaining.E_a_kN_m,
      keep_N_MID: true,
      briefMd,
    },
    null,
    2
  )
);
