/**
 * Talpă perimetru pe GEOMETRIA DESENATĂ (A1.194/200):
 * excentrică inward — finit pe front, heel sub beci, FĂRĂ umplutură H pe heel.
 *
 * Calc vechi (stability_v01): toe 5 cm + heel cu γ·H umplutură → NOT pe desen.
 * Rulează: node src/calc_a1_footing_drawn_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const retain = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_retaining_seis_v01.json"), "utf8")
);
const geo = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_foundations_geo120_v01.json"), "utf8")
);
const a1p = path.join(root, "data/building/a1_architecture.json");
const a1 = JSON.parse(fs.readFileSync(a1p, "utf8"));
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

const H = retain.wall?.H_m ?? 2.5;
const t = (retain.wall?.t_cm ?? 30) / 100;
const gamma_c = 25;
const gamma_soil = retain.wall?.gamma_kNm3 ?? 18;
const adoptCase = retain.cases?.find((c) => c.id === retain.adopt_case) || retain.adopt;
const Pa =
  (adoptCase?.Pa_earth ?? 18.6) + (adoptCase?.Phydro ?? 5) + (adoptCase?.dPae ?? 2.5);
const mu = 0.55;
const gamma_slip = 1.1;
const FS_over_req = 1.5;
const q_allow = geo.q_allow_kPa ?? 221;
const h_foot = 0.4;
/** Placă beci pe heel (nu umplutură H) — ordin */
const h_slab = 0.15;
/** Sarcină utilă pe placă beci pe heel kN/m² — ordin */
const q_floor = 5.0;
const Kp_use = 3.0;

/**
 * Geometrie desenată:
 *  toe_out = 0 (față exterioară talpă = față zid)
 *  heel_in = B − t (sub beci)
 *  W_heel = placă + q pe heel (NU γ_soil·heel·H)
 */
function checkDrawn({ B, key_m = 0, id, label }) {
  const toe = 0;
  const heel = Math.max(0.02, B - t - toe);
  const W_wall = gamma_c * t * H;
  const W_footing = gamma_c * B * h_foot;
  const W_key = key_m > 0 ? gamma_c * 0.3 * key_m : 0;
  const W_slab = gamma_c * heel * h_slab;
  const W_floor = q_floor * heel;
  const W = W_wall + W_footing + W_key + W_slab + W_floor;
  const Rp = key_m > 0 ? 0.5 * Kp_use * gamma_soil * key_m ** 2 : 0;
  const FS_slip = (mu * W + Rp) / Pa;
  // răsturnare față de muchia EXTERIOARĂ (toe=0)
  const x_wall = toe + t / 2;
  const x_foot = B / 2;
  const x_heel = toe + t + heel / 2;
  const M_stab =
    W_wall * x_wall +
    W_footing * x_foot +
    (W_slab + W_floor) * x_heel +
    W_key * (toe + 0.15);
  const M_over = Pa * (H / 3);
  const FS_over = M_stab / M_over;
  const M_net =
    M_over -
    (W_wall * (x_wall - B / 2) + (W_slab + W_floor) * (x_heel - B / 2));
  const e_c = Math.abs(M_net) / W;
  const sigma =
    e_c <= B / 6
      ? (W / B) * (1 + (6 * e_c) / B)
      : (2 * W) / (3 * Math.max(0.05, B / 2 - e_c));
  const pass =
    FS_slip >= gamma_slip &&
    FS_over >= FS_over_req &&
    sigma > 0 &&
    sigma <= q_allow * 1.15;
  return {
    id,
    label,
    geometry: "inward_toe0_heel_under_slab",
    B_cm: Math.round(B * 100),
    heel_cm: Math.round(heel * 100),
    key_m,
    W_kNm: round(W, 1),
    W_breakdown: {
      wall: round(W_wall, 1),
      footing: round(W_footing, 1),
      slab_on_heel: round(W_slab, 1),
      floor_on_heel: round(W_floor, 1),
      key: round(W_key, 1),
    },
    Pa_kNm: round(Pa, 1),
    FS_slip: round(FS_slip, 2),
    FS_over: round(FS_over, 2),
    sigma_kPa: round(Math.max(0, sigma), 0),
    pass_slip: FS_slip >= gamma_slip,
    pass_over: FS_over >= FS_over_req,
    pass_sigma: sigma > 0 && sigma <= q_allow * 1.15,
    pass,
    fail_reason: !pass
      ? [
          FS_slip < gamma_slip ? "alunecare" : null,
          FS_over < FS_over_req ? "răsturnare" : null,
          !(sigma > 0 && sigma <= q_allow * 1.15) ? "σ" : null,
        ]
          .filter(Boolean)
          .join("+")
      : null,
  };
}

/** Calc vechi (heel+umplutură) — doar comparație */
function checkClassicHeelFill(B) {
  const toe = 0.05;
  const heel = Math.max(0.05, B - t - toe);
  const W_wall = gamma_c * t * H;
  const W_footing = gamma_c * B * h_foot;
  const W_backfill = gamma_soil * heel * H;
  const W = W_wall + W_footing + W_backfill;
  const FS_slip = (mu * W) / Pa;
  const x_wall = toe + t / 2;
  const x_foot = B / 2;
  const x_bf = toe + t + heel / 2;
  const M_stab = W_wall * x_wall + W_footing * x_foot + W_backfill * x_bf;
  const M_over = Pa * (H / 3);
  const FS_over = M_stab / M_over;
  return {
    geometry: "classic_toe5_heel_backfill_H",
    B_cm: Math.round(B * 100),
    FS_slip: round(FS_slip, 2),
    FS_over: round(FS_over, 2),
    pass: FS_slip >= gamma_slip && FS_over >= FS_over_req,
    note: "NU e geometria desenată — doar referință A1.188",
  };
}

function minBDrawn(key_m = 0) {
  for (let b = 0.8; b <= 2.5; b += 0.05) {
    const r = checkDrawn({ B: b, key_m, id: "scan", label: "scan" });
    if (r.pass) return Math.ceil((b * 100) / 5) * 5;
  }
  return null;
}

const B_drawn_now = (a1.structure_a1_study_cm?.foundations_study_cm?.perimeter_strip_width_cm ?? 115) / 100;

const variants = [
  checkDrawn({ id: "D0_B115_drawn", label: "B115 desen actual · inward · fără umplutură heel", B: 1.15 }),
  checkDrawn({ id: "D1_B130_drawn", label: "B130 inward · slab pe heel", B: 1.3 }),
  checkDrawn({ id: "D2_B150_drawn", label: "B150 inward · slab pe heel", B: 1.5 }),
  checkDrawn({ id: "D3_B180_drawn", label: "B180 inward · slab pe heel", B: 1.8 }),
  checkDrawn({
    id: "D4_B115_key40",
    label: "B115 + pinten 40 cm · inward",
    B: 1.15,
    key_m: 0.4,
  }),
  checkDrawn({
    id: "D5_B130_key40",
    label: "B130 + pinten 40 cm · inward",
    B: 1.3,
    key_m: 0.4,
  }),
  checkDrawn({
    id: "D6_B150_key40",
    label: "B150 + pinten 40 cm · inward",
    B: 1.5,
    key_m: 0.4,
  }),
];

const B_min_plain = minBDrawn(0);
const B_min_key40 = minBDrawn(0.4);
const at_now = checkDrawn({ id: "now", label: "desen acum", B: B_drawn_now });
const classic_ref = checkClassicHeelFill(1.15);

/** Verdict: cea mai îngustă variantă PASS pe geometrie desenată */
let adopt = null;
if (B_min_plain != null) {
  adopt = {
    id: `D_B${B_min_plain}_drawn`,
    B_cm: B_min_plain,
    key_m: 0,
    reason: "B minim pe geometrie inward + placă pe heel (fără pinten)",
    ...checkDrawn({ B: B_min_plain / 100, id: "adopt", label: "adopt" }),
  };
} else if (B_min_key40 != null) {
  adopt = {
    id: `D_B${B_min_key40}_key40`,
    B_cm: B_min_key40,
    key_m: 0.4,
    reason: "B minim + pinten 40 cm (plain nu trece ≤250 cm)",
    ...checkDrawn({ B: B_min_key40 / 100, key_m: 0.4, id: "adopt", label: "adopt" }),
  };
}

const out = {
  meta: {
    id: "s1_a1_footing_drawn_v01",
    generated: new Date().toISOString(),
    status: "ordin_nu_semnat",
    case: adoptCase?.id ?? "hw10",
    disclaimer:
      "Schema pe ml pe geometria 3D desenată (toe0 inward). Geo 131 + FE confirmă μ/apă/pinten/q pe placă.",
  },
  problem: {
    drawn: "inward_no_heel_backfill — finit pe front, heel sub beci",
    old_calc: "toe5 + heel cu γ·H umplutură — NU e pe desen → NOT_VALIDATED",
    fix: "recalc pe toe=0 + W_heel = placă 15 cm + q=5 kPa (nu umplutură H)",
  },
  loads: { Pa_kNm: round(Pa, 1), mu, gamma_slip, FS_over_req, q_allow_kPa: q_allow, q_floor_kPa: q_floor, h_slab_m: h_slab },
  classic_B115_ref: classic_ref,
  drawn_B115_now: at_now,
  B_min_plain_cm: B_min_plain,
  B_min_key40_cm: B_min_key40,
  variants,
  adopt,
};

// —— Scrie adopt în structure dacă avem verdict ——
const st = a1.structure_a1_study_cm || {};
st.foundations_study_cm = {
  ...(st.foundations_study_cm || {}),
  perimeter_strip_width_cm: adopt?.B_cm ?? st.foundations_study_cm?.perimeter_strip_width_cm ?? 115,
  perimeter_strip_drawn: "inward_toe0_heel_under_slab",
  perimeter_strip_calc_status: adopt?.pass
    ? "VALIDATED_ON_DRAWN_GEOMETRY_ORDIN"
    : "FAIL_ON_DRAWN_GEOMETRY",
  perimeter_strip_key_cm: adopt?.key_m ? Math.round(adopt.key_m * 100) : 0,
  perimeter_strip_calc_ref: "outputs/reports/s1_a1_footing_drawn_v01",
  status: "ipoteză_studiu_A1_200",
  note: adopt
    ? `A1.200: B=${adopt.B_cm} cm pe geometrie inward (FS_s=${adopt.FS_slip} FS_o=${adopt.FS_over}). ${adopt.reason}`
    : "A1.200: niciun B≤250 cu/fara pinten pe geometrie desenată — FE/geo",
};
if (Array.isArray(st.open_items)) {
  st.open_items = st.open_items.filter((x) => x !== "footing_115_recalc_on_drawn_inward_geometry");
  if (!adopt?.pass) st.open_items.push("footing_drawn_geometry_needs_FE_or_wider_B");
}
a1.structure_a1_study_cm = st;
fs.writeFileSync(a1p, JSON.stringify(a1, null, 2));
fs.writeFileSync(
  path.join(root, "data/building/a1_structure_study.json"),
  JSON.stringify(st, null, 2)
);

const md = `# S1 A1 — Talpă pe geometria DESENATĂ (A1.200)

**Status:** ordin pe ml · **NU** semnat  
**Caz:** ${out.meta.case} · inward toe=0 · heel sub placă beci  
**Generat:** ${out.meta.generated.slice(0, 16)}

## Problema

| | |
|--|--|
| **Desen 3D** | Talpă excentrică **inward** — finit pe front, heel sub beci |
| **Calc vechi** | toe 5 cm + umplutură γ·H pe heel → **nu e pe desen** |
| **Fix** | toe=0 · W_heel = placă 15 cm + q 5 kPa |

## B115 acum (desen)

| Verificare | Valoare | Cerință | PASS |
|------------|--------:|--------:|:----:|
| Alunecare FS | **${at_now.FS_slip}** | ≥ ${gamma_slip} | **${at_now.pass_slip}** |
| Răsturnare FS | **${at_now.FS_over}** | ≥ ${FS_over_req} | **${at_now.pass_over}** |
| σ max | **${at_now.sigma_kPa}** kPa | ≤ ${q_allow} | **${at_now.pass_sigma}** |

**PASS @115 desen:** **${at_now.pass}**  
(Referință calc vechi B115 heel+fill: FS_s ${classic_ref.FS_slip} / FS_o ${classic_ref.FS_over} — înșelător pe desen.)

## B minim pe geometrie desenată

| | cm |
|--|--:|
| Fără pinten | **${B_min_plain ?? "—"}** |
| + pinten 40 cm | **${B_min_key40 ?? "—"}** |

## Variante

| ID | B | Key | FS_s | FS_o | σ | PASS | Fail |
|----|--:|----:|-----:|-----:|--:|:----:|------|
${variants
  .map(
    (v) =>
      `| \`${v.id}\` | ${v.B_cm} | ${v.key_m ? v.key_m * 100 : "—"} | ${v.FS_slip} | ${v.FS_over} | ${v.sigma_kPa} | **${v.pass}** | ${v.fail_reason || "—"} |`
  )
  .join("\n")}

## Adopt A1.200

${
  adopt
    ? `| | |
|--|--:|
| **B** | **${adopt.B_cm}** cm |
| Pinten | ${adopt.key_m ? adopt.key_m * 100 + " cm" : "nu"} |
| FS alunecare | **${adopt.FS_slip}** |
| FS răsturnare | **${adopt.FS_over}** |
| σ | **${adopt.sigma_kPa}** kPa |
| PASS | **${adopt.pass}** |

${adopt.reason}`
    : "_Niciun B≤250 cm nu trece — cere FE / geo / drenaj._"
}

JSON: \`s1_a1_footing_drawn_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_footing_drawn_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_footing_drawn_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      drawn_B115: { FS_slip: at_now.FS_slip, FS_over: at_now.FS_over, pass: at_now.pass },
      classic_B115: classic_ref,
      B_min_plain_cm: B_min_plain,
      B_min_key40_cm: B_min_key40,
      adopt_cm: adopt?.B_cm,
      adopt_key: adopt?.key_m,
      adopt_pass: adopt?.pass,
    },
    null,
    2
  )
);
