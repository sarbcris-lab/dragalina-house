/**
 * Predimensionare 2.2 — consolă palier pe B_E + nod C_E_PAL (ordin).
 * LOCK-1R: consolă sud 101 cm din C_E_PAL; bordură N B_Y470 ~105 cm vest.
 *
 * Rulează: node src/calc_v47_frame_cantilever_prelim_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "outputs/reports/v47_a1_frame_calc_2_2_cantilever_v01.md");
const jsonOut = path.join(root, "outputs/reports/v47_a1_frame_calc_2_2_cantilever_v01.json");

const Q_ED = 11.93; // kN/m² palier (audit)
const L_S = 1.01; // m consolă sud (101 cm)
const L_W = 1.05; // m bordură vest pe B_Y470
const W_LAND = 1.05; // m lățime tip palier X565–670
const H_BEAM = 0.35; // m
const B_BEAM = 0.3; // m
const FCK = 25;
const FCD = FCK / 1.5;
const FYD = 500 / 1.15;

/** Placă consolă: bandă 1 m lățime · M = q L²/2 */
function plateStrip(L, q = Q_ED) {
  const M = (q * L * L) / 2; // kNm/m
  const V = q * L; // kN/m
  // d ≈ 15 - 2.5 cover ≈ 12 cm for slab 15
  const d = 0.12;
  const As = (M * 1e6) / (0.9 * d * FYD * 1e3); // mm²/m  (M in kNm)
  const AsMin = 0.0013 * 1000 * d * 1e4; // rough 0.13% · b · d → mm²/m
  return {
    L_m: L,
    M_kNm_per_m: round(M),
    V_kN_per_m: round(V),
    As_req_mm2_m: round(As),
    As_min_mm2_m: round(AsMin),
    governs: As > AsMin ? "flexiune" : "As_min",
  };
}

/** Grindă B_E consolă sud: trib ~ lățime palier/2 + grindă */
function beamCantilever() {
  const trib = W_LAND; // m — conservator pe toată lățimea
  const q = Q_ED * trib; // kN/m pe grindă
  const M = (q * L_S * L_S) / 2;
  const V = q * L_S;
  const d = H_BEAM - 0.05;
  const As = (M * 1e6) / (0.9 * d * FYD * 1e3);
  const AsMin = Math.max(0.0013 * B_BEAM * d * 1e6, 0.26 * 1.0 /*fctm rough*/ * B_BEAM * d * 1e4);
  return {
    trib_m: trib,
    q_kN_m: round(q),
    M_kNm: round(M),
    V_kN: round(V),
    As_req_mm2: round(As),
    note: "ordin; torsiune din B_Y470 neinclusă în M",
  };
}

/** Torsiune ordin pe B_E din bordură vest: T ≈ V_bordură × excentricitate */
function torsionFromWestEdge() {
  const strip = plateStrip(L_W);
  // Forță pe bordură ~ V * lungime ancorare pe B_E (~0.3–1.0 m) — ia 1,0 m
  const F = strip.V_kN_per_m * 1.0;
  const e = L_W / 2; // m — braț aproximativ până la ax B_E
  const T = F * e; // kNm
  return {
    F_kN: round(F),
    e_m: round(e, 2),
    T_kNm: round(T),
    note: "ordin pe nod C_E_PAL — cere FE / detaliu etrieri+bare longitudinale",
  };
}

/** Ridicare / moment pe C_E_PAL din consolă */
function columnNode() {
  const beam = beamCantilever();
  const tor = torsionFromWestEdge();
  // Moment transmis la stâlp ≈ M grindă + efect torsiune (conservator adună)
  const M_col = beam.M_kNm + tor.T_kNm * 0.5;
  const Nrd = 0.8 * 0.3 * 0.4 * FCD * 1000; // 30×40
  const Nrd33 = 0.8 * 0.3 * 0.3 * FCD * 1000;
  return {
    M_node_ord_kNm: round(M_col),
    T_ord_kNm: tor.T_kNm,
    Nrd_30x40_kN: round(Nrd),
    Nrd_30x30_kN: round(Nrd33),
    verdict:
      "M+T pe nod = tipic dominante vs N; NU reduce C_E_PAL la 30×30 fără FE interacțiune",
  };
}

function round(x, d = 1) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

const southPlate = plateStrip(L_S);
const westPlate = plateStrip(L_W);
const beam = beamCantilever();
const tor = torsionFromWestEdge();
const node = columnNode();

const result = {
  status: "preliminar_ordin — nu adoptare",
  locks: { L_S_m: L_S, L_W_m: L_W, no_column_in_living: true },
  q_Ed: Q_ED,
  south_plate_strip: southPlate,
  west_plate_strip: westPlate,
  B_E_cantilever: beam,
  torsion_ord: tor,
  C_E_PAL_node: node,
};

const md = `# V47 A1 FRAME — Calc 2.2 consolă palier / C_E_PAL (preliminar)

**Status:** ordin de mărime · **NU** proiect semnat  
**Schema:** LOCK-1R — consolă sud **${L_S * 100} cm** · bordură N **${L_W * 100} cm** · fără stâlp în living  
**q_Ed palier:** ${Q_ED} kN/m²

## Placă consolă (bandă 1 m)

| Direcție | L (m) | M (kNm/m) | V (kN/m) | As cerut | Guvernează |
|----------|------:|----------:|---------:|---------:|------------|
| Sud (din C_E_PAL) | ${L_S} | ${southPlate.M_kNm_per_m} | ${southPlate.V_kN_per_m} | ${southPlate.As_req_mm2_m} mm²/m | ${southPlate.governs} |
| Vest (B_Y470) | ${L_W} | ${westPlate.M_kNm_per_m} | ${westPlate.V_kN_per_m} | ${westPlate.As_req_mm2_m} mm²/m | ${westPlate.governs} |

Citire: flexiune placă **plauzibilă** @15 cm pe L≈1,0 m (As_min sau As mic). **Nu** demonstrează SLS pe planșeul living 6 m.

## B_E consolă sud

| Mărime | Valoare |
|--------|--------:|
| trib | ${beam.trib_m} m |
| q pe grindă | ${beam.q_kN_m} kN/m |
| M | **${beam.M_kNm}** kNm |
| V | **${beam.V_kN}** kN |
| As flexiune ordin | ${beam.As_req_mm2} mm² |

## Torsiune / nod C_E_PAL

| Mărime | Valoare |
|--------|--------:|
| T ordin (din bordură W) | **${tor.T_kNm}** kNm |
| M nod ordin (M+0,5T) | **${node.M_node_ord_kNm}** kNm |
| Nrd 30×40 / 30×30 | ${node.Nrd_30x40_kN} / ${node.Nrd_30x30_kN} kN |

**Verdict:** eforturile pe consolă sunt **modeste**; riscul real = **torsiune + ancorare + ridicare** pe \`C_E_PAL\`, nu secțiunea axială.  
→ **Nu** reduce \`C_E_PAL\` 30×40 → 30×30 în această rundă.  
→ FE obligatoriu: model cu B_E + B_Y470 + placă palier + stâlp continuu S–P–E.

## Decizie model (acum)

| Acțiune | |
|---------|--|
| Păstrează C_E_PAL **30×40** | Da |
| Păstrează B_E b=30 · h=35 | Da (până la FE grindă) |
| Adaugă stâlp în living | **Nu** (LOCK-1R) |
| Status registru \`east_landing_span\` | rămâne **calcul_lipsă** (FE nod), geo OK |

JSON: \`outputs/reports/v47_a1_frame_calc_2_2_cantilever_v01.json\`
`;

fs.writeFileSync(outPath, md);
fs.writeFileSync(jsonOut, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ok: true, outPath, M_beam: beam.M_kNm, T: tor.T_kNm, M_node: node.M_node_ord_kNm }, null, 2));
