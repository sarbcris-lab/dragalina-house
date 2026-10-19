/**
 * Uplift streșină + PV pe solbanc — ancorare numerică ordin.
 * Rulează: node src/calc_a1_eaves_uplift_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const wind = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_wind_buckling_ec5_v01.json"), "utf8")
);
const bom = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_roof_bom_v01.json"), "utf8")
);
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

const we_F = Math.abs(wind.wind?.we?.eaves_F ?? 1.629);
const Gk = wind.Gk_tot ?? wind.gk_tot ?? 0.9; // D3a+PV din wind pack
const step_m = (bom.geometry?.step_cm ?? 111.8) / 100;
const L_plate = bom.pieces?.find((p) => p.id === "PLATE_N")?.length_m ?? 6.83;
const n_raf = bom.geometry?.n_rafters_per_pitch ?? 7;

/** Adâncime zonă F pe apă — ordin e/10…e/4; folosim 1,0 m pe streșină */
const zone_F_m = 1.0;

// ULS: vânt dominant suctiune — G favorabil (γG,inf=1,0)
const q_uplift_uls = 1.5 * we_F - 1.0 * Gk; // kN/m² net pe zonă F
const w_plate_kNm = q_uplift_uls * zone_F_m; // kN/m pe solbanc
const F_rafter_eave = w_plate_kNm * step_m; // kN pe căprior la streșină
const F_plate_total = w_plate_kNm * L_plate;

// PV pe primul rând (din wind pack) — adăugat pe streșină
const F_pv_panel = wind.wind?.F_uplift_panel_kN ?? 4.15;
const n_pv_on_eaves = 2; // ordin: ~2 panouri pe zonă F / apă
const F_pv_eaves = F_pv_panel * n_pv_on_eaves;
const F_plate_with_pv = F_plate_total + F_pv_eaves * 0.5; // 50% pe solbanc, rest pe căpriori/coamă

// Capacități tip (ordin — confirmă producător)
const Nrd_M12_chem = 18; // kN tipic C25/30, adâncime corectă
const Nrd_screw_8x120 = 2.5; // kN tipic lemn C24 (retragere)
const n_anchors_need = Math.ceil(F_plate_with_pv / (Nrd_M12_chem / 1.5)); // γ pe ancoră tip
const s_anchor_m = L_plate / Math.max(1, n_anchors_need);
const s_adopt_m = Math.min(0.8, s_anchor_m);
const n_adopt = Math.ceil(L_plate / s_adopt_m) + 1;
const util_anchor = F_plate_with_pv / (n_adopt * (Nrd_M12_chem / 1.5));

const n_screws_rafter = Math.ceil(F_rafter_eave / (Nrd_screw_8x120 / 1.3));
const screws_adopt = Math.max(3, n_screws_rafter);
const util_screw = F_rafter_eave / (screws_adopt * (Nrd_screw_8x120 / 1.3));

const out = {
  meta: {
    id: "s1_a1_eaves_uplift_v01",
    generated: new Date().toISOString(),
    status: "ordin_nu_dt",
    disclaimer: "Ipoteze we/vb0 din wind pack. Ancore — valori tip; FE + fișă producător.",
  },
  inputs: {
    we_F_kNm2: we_F,
    Gk_kNm2: Gk,
    zone_F_m,
    step_m: round(step_m, 3),
    L_plate_m: L_plate,
    n_rafters_per_pitch: n_raf,
  },
  uplift: {
    q_net_uls_kNm2: round(q_uplift_uls, 2),
    w_plate_kNm: round(w_plate_kNm, 2),
    F_rafter_eave_kN: round(F_rafter_eave, 2),
    F_plate_wind_kN: round(F_plate_total, 2),
    F_pv_eaves_share_kN: round(F_pv_eaves * 0.5, 2),
    F_plate_design_kN: round(F_plate_with_pv, 2),
  },
  anchors_plate: {
    type: "M12 chimică / bolt în centură C25",
    Nrd_kN_tip: Nrd_M12_chem,
    n_min_calc: n_anchors_need,
    s_adopt_m: round(s_adopt_m, 2),
    n_adopt,
    util: round(util_anchor, 2),
    pass: util_anchor <= 1.0,
    note: `solbanc N și S: câte ${n_adopt} ancore @ ≤${round(s_adopt_m * 100)} cm`,
  },
  rafter_plate_screws: {
    type: "Ø8×120 lemn + colțar metalic recomandat",
    F_kN: round(F_rafter_eave, 2),
    n_adopt: screws_adopt,
    util: round(util_screw, 2),
    pass: util_screw <= 1.0,
    joints: n_raf * 2,
  },
};

const md = `# S1 A1 — Uplift streșină + PV pe solbanc

**Status:** ordin · **NU** semnat · **NU** fișă producător  
**Generat:** ${out.meta.generated.slice(0, 16)}

## Încărcare

| | |
|--|--:|
| we zonă F | **${we_F}** kN/m² |
| Gk acoperiș | ${Gk} kN/m² |
| Adâncime zonă F | ${zone_F_m} m |
| q net ULS (1,5·we − G) | **${out.uplift.q_net_uls_kNm2}** kN/m² |
| w pe solbanc | **${out.uplift.w_plate_kNm}** kN/m |
| F pe căprior (pas ${round(step_m * 100, 1)} cm) | **${out.uplift.F_rafter_eave_kN}** kN |
| F solbanc vânt (L=${L_plate} m) | ${out.uplift.F_plate_wind_kN} kN |
| + cotă PV pe streșină | ${out.uplift.F_pv_eaves_share_kN} kN |
| **F design solbanc** | **${out.uplift.F_plate_design_kN}** kN |

## Ancorare solbanc ↔ centură BA

| | |
|--|--:|
| Tip | ${out.anchors_plate.type} |
| Nrd tip | ${out.anchors_plate.Nrd_kN_tip} kN |
| Spațiere adopt | **≤ ${round(s_adopt_m * 100)} cm** |
| Nr. / solbanc | **${n_adopt}** |
| util | **${out.anchors_plate.util}** |
| PASS | **${out.anchors_plate.pass}** |

${out.anchors_plate.note}

## Căprior ↔ solbanc

| | |
|--|--:|
| Tip | ${out.rafter_plate_screws.type} |
| F / nod | ${out.rafter_plate_screws.F_kN} kN |
| Șuruburi / nod | **${screws_adopt}** |
| util | **${out.rafter_plate_screws.util}** |
| PASS | **${out.rafter_plate_screws.pass}** |
| Noduri total | ${out.rafter_plate_screws.joints} |

## FE / DT

- Confirmă vb,0 / cpe pe hartă NA  
- Capacitate ancoră din fișa producătorului + adâncime în centură  
- Colțar metalic la streșină dacă util șurub > 0,7  

JSON: \`s1_a1_eaves_uplift_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_eaves_uplift_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_eaves_uplift_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      F_plate_kN: out.uplift.F_plate_design_kN,
      anchors: n_adopt,
      s_cm: round(s_adopt_m * 100),
      pass: out.anchors_plate.pass && out.rafter_plate_screws.pass,
    },
    null,
    2
  )
);
