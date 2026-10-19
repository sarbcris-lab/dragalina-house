/**
 * Detaliu nod C_E_PAL + grindă întoarsă B_Y_EDGE — As / ancorare ordin.
 * NU plan dt · NU semnat. Rulează: node src/calc_a1_node_ce_pal_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const calc100 = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), "utf8")
);
const gaps = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_gaps_v01.json"), "utf8")
);
const rebar = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_rebar_hint_v01.json"), "utf8")
);
const st = a1.structure_a1_study_cm;
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

const FYD = 500 / 1.15;
const col = (st.columns || []).find((c) => c.id === "C_E_PAL");
const colCalc = (calc100.columns || []).find((c) => c.id === "C_E_PAL");
const beamsAt = (calc100.beams || []).filter(
  (b) =>
    b.id === "B_E" ||
    b.id === "B_E_S" ||
    b.id === "B_Y410" ||
    b.id === "B_S_SE" ||
    (b.note || "").includes("C_E_PAL")
);
const c22 = gaps.calc_2_2 || {};
const inv = calc100.inverted || {};

// Ancorare ordin EC2: lb,rqd ≈ (Ø/4)·(σsd/fbd); fbd C25 ≈ 2,25 MPa tipic
const fbd = 2.25;
function lbMm(dia) {
  return Math.ceil(((dia / 4) * (FYD / fbd)) / 10) * 10;
}

const As_from_M = (M, d_cm) => (M * 1e6) / (0.9 * (d_cm / 100) * FYD * 1e3);

const node = {
  id: "NODE_C_E_PAL",
  column: {
    id: "C_E_PAL",
    section_cm: col ? `${col.dx}×${col.dy}` : "30×40",
    N_kN: colCalc?.N_kN ?? 741.6,
    M_ordin_kNm: colCalc?.M_ordin_kNm ?? 58.2,
    util_NM: colCalc?.util_NM ?? 0.671,
    long_hint: rebar.columns?.find((c) => c.id === "C_E_PAL")?.long_P100_zona || "8φ16",
    stirrups: rebar.columns?.find((c) => c.id === "C_E_PAL")?.stirrups_hint || "φ8 @ 11/20",
  },
  beams_framing: [
    {
      id: "B_E",
      role: "centură E nord→PAL",
      M_kNm: beamsAt.find((b) => b.id === "B_E")?.M_kNm ?? 18.5,
      V_kN: beamsAt.find((b) => b.id === "B_E")?.V_kN ?? 20,
      As_mm2: beamsAt.find((b) => b.id === "B_E")?.As_mm2 ?? 135,
      bottom: "3φ16",
      top_into_node: "2φ16 continuitate + 2φ16 colț",
    },
    {
      id: "B_E_S",
      role: "centură E scară PAL→SE (NO_LAMELE)",
      M_kNm: beamsAt.find((b) => b.id === "B_E_S")?.M_kNm ?? 21.5,
      V_kN: beamsAt.find((b) => b.id === "B_E_S")?.V_kN ?? 21.5,
      As_mm2: beamsAt.find((b) => b.id === "B_E_S")?.As_mm2 ?? 157,
      bottom: "3φ16",
      top_into_node: "2φ16 + etrieri φ8@10 în zonă nod",
    },
    {
      id: "B_Y410",
      role: "grindă transversă / consolă ordin",
      M_kNm: c22.beam_cantilever?.M_kNm ?? 12,
      V_kN: c22.beam_cantilever?.V_kN ?? 17.3,
      As_mm2: round(As_from_M(c22.beam_cantilever?.M_kNm ?? 12, 36)),
      bottom: "2φ16",
      top_into_node: "3φ16 (negativ consolă) · lb≥" + lbMm(16) + " mm",
    },
  ],
  torsion_anchorage: {
    T_kNm: c22.torsion_T_kNm ?? 6.5,
    M_node_kNm: c22.M_node_kNm ?? 15.3,
    As_torsion_hint_mm2: round(((c22.torsion_T_kNm ?? 6.5) * 1e6) / (0.9 * 0.25 * FYD * 1e3)),
    closed_stirrups: "φ10 @ 10 cm pe 2×h de la față stâlp (ordin torsiune)",
    note: "Torsiune din consolă placă/grindă pe C_E_PAL — FE nod obligatoriu",
  },
  plate_cantilever: {
    L_S_m: c22.L_S_m,
    L_W_m: c22.L_W_m,
    As_top_S: "φ12 @ 12 cm pe L_S (As≥" + (c22.plate_S?.As_min ?? 1560) + " mm²/m min)",
    As_top_W: "φ12 @ 12 cm pe L_W",
    pass_ordin: c22.pass_ordin,
  },
  development: {
    phi16_lb_mm: lbMm(16),
    phi14_lb_mm: lbMm(14),
    hook: "cioc 10Ø sau ancoraj pe 1,5×h grindă în nod (ordin)",
    column_through: "bare longitudinale stâlp continue prin nod + etrieri confinare P100",
  },
};

const inverted = {
  id: "B_Y_EDGE_INVERTED",
  section: inv.section || "25×25",
  L_m: inv.L_m,
  M_kNm: inv.M_kNm,
  V_kN: inv.V_kN,
  As_mm2: inv.As_mm2,
  flex_ok: inv.flex_ok,
  shear_ok: inv.shear_ok,
  supports: ["C_CASA_SCARA", "C_SHAFT_E_PIER"],
  rebar: {
    bottom_at_mid: "2φ12 (flex ordin mic)",
    top_at_supports: "2φ14 în zone reazeme",
    stirrups: "φ8 @ 15 cm",
    into_pier: `ancorare ≥ ${lbMm(14)} mm în C_SHAFT_E_PIER + în C_CASA`,
    sandwich_note: "sandwich/placă: bare din întoarsă legate de plasa plăcii — FE local capăt",
  },
  pass_ordin: inv.pass,
};

const out = {
  meta: {
    id: "s1_a1_node_ce_pal_v01",
    generated: new Date().toISOString(),
    status: "ordin_detaliu_nu_dt",
    disclaimer: "Hint As/ancorare. Structurist confirmă la FE nod + P100 confinare.",
  },
  node,
  inverted,
  keep_C_E_PAL_30x40: c22.keep_C_E_PAL_30x40 !== false,
  fe_required: [
    "Model nod 3D: stâlp + B_E + B_E_S + B_Y410 + placă consolă",
    "Torsiune + transfer V în stâlp",
    "Lungimi reale de ancorare / ciocuri",
    "Întoarsă: FE capăt pe pier + legătură placă",
  ],
};

const md = `# S1 A1 — Nod C_E_PAL + întoarsă (As / ancorare ordin)

**Status:** detaliu de studiu · **NU** plan dt · **NU** semnat  
**Generat:** ${out.meta.generated.slice(0, 16)}

> Eforturi din \`calc_2_2\` + \`calc_100\`. FE nod rămâne obligatoriu.

## 1. Stâlp C_E_PAL

| | |
|--|--:|
| Secțiune | **${node.column.section_cm}** |
| N | ${node.column.N_kN} kN |
| M ordin | ${node.column.M_ordin_kNm} kNm |
| util N+M | ${node.column.util_NM} |
| Long. hint | ${node.column.long_hint} |
| Etrieri | ${node.column.stirrups} |

**Păstrează 30×40** — util ~0,67; nu reduce fără FE.

## 2. Grinzi în nod

| Grindă | Rol | M | V | As | Inferior | În nod |
|--------|-----|--:|--:|---:|----------|--------|
${node.beams_framing
  .map(
    (b) =>
      `| ${b.id} | ${b.role} | ${b.M_kNm} | ${b.V_kN} | ${b.As_mm2} | ${b.bottom} | ${b.top_into_node} |`
  )
  .join("\n")}

## 3. Torsiune / ancorare

| | |
|--|--:|
| T ordin | **${node.torsion_anchorage.T_kNm}** kNm |
| M nod | ${node.torsion_anchorage.M_node_kNm} kNm |
| As torsiune hint | ~${node.torsion_anchorage.As_torsion_hint_mm2} mm² |
| Etrieri închiși | ${node.torsion_anchorage.closed_stirrups} |
| lb φ16 | **${node.development.phi16_lb_mm}** mm |
| lb φ14 | **${node.development.phi14_lb_mm}** mm |

${node.torsion_anchorage.note}

## 4. Consolă placă (S / W)

- L_S = ${node.plate_cantilever.L_S_m} m → ${node.plate_cantilever.As_top_S}
- L_W = ${node.plate_cantilever.L_W_m} m → ${node.plate_cantilever.As_top_W}
- PASS ordin: **${node.plate_cantilever.pass_ordin}**

## 5. Grindă întoarsă B_Y_EDGE

| | |
|--|--:|
| Secțiune | ${inverted.section} |
| L / M / V | ${inverted.L_m} m / ${inverted.M_kNm} kNm / ${inverted.V_kN} kN |
| As flex | ${inverted.As_mm2} mm² |
| Reazeme | ${inverted.supports.join(", ")} |
| Inferior | ${inverted.rebar.bottom_at_mid} |
| Superior reazeme | ${inverted.rebar.top_at_supports} |
| Ancorare | ${inverted.rebar.into_pier} |
| Notă | ${inverted.rebar.sandwich_note} |
| PASS | **${inverted.pass_ordin}** |

## 6. Ce cere FE (nu e în acest fișier)

${out.fe_required.map((x) => `- ${x}`).join("\n")}

JSON: \`s1_a1_node_ce_pal_v01.json\`
`;

// Fix accidental syntax if any - rewrite lb function cleanly was wrong above
// Actually I had a bug: `return round(...)/10, 0); * 10` - let me fix the file

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_node_ce_pal_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_node_ce_pal_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      column: node.column.section_cm,
      T_kNm: node.torsion_anchorage.T_kNm,
      lb16: node.development.phi16_lb_mm,
      inverted_pass: inverted.pass_ordin,
    },
    null,
    2
  )
);
