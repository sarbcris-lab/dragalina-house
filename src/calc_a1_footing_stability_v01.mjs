/**
 * Alunecare + răsturnare talpă perimetru (retenție) — ordin + sizing B.
 * Rulează: node src/calc_a1_footing_stability_v01.mjs
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

const B0 = (geo.perimeter_strip?.width_cm ?? 80) / 100;
const H = retain.wall?.H_m ?? 2.5;
const t = (retain.wall?.t_cm ?? 30) / 100;
const gamma_c = 25;
const gamma_soil = retain.wall?.gamma_kNm3 ?? 18;
const adopt = retain.cases?.find((c) => c.id === retain.adopt_case) || retain.adopt;
const Pa = (adopt?.Pa_earth ?? 18.6) + (adopt?.Phydro ?? 5) + (adopt?.dPae ?? 2.5);
const mu = 0.55;
const gamma_slip = 1.1;
const FS_over_req = 1.5;
const q_allow = geo.q_allow_kPa ?? 221;
const h_foot = 0.4;

function check(B) {
  // zid pe talpă: toe mic 5 cm, restul heel cu umplutură plină H
  const toe = 0.05;
  const heel = Math.max(0.05, B - t - toe);
  const W_wall = gamma_c * t * H;
  const W_footing = gamma_c * B * h_foot;
  const W_backfill = gamma_soil * heel * H;
  const W = W_wall + W_footing + W_backfill;
  const R_slip = mu * W;
  const FS_slip = R_slip / Pa;
  // răsturnare față de muchia toe: brațe față de toe
  const x_wall = toe + t / 2;
  const x_foot = B / 2;
  const x_bf = toe + t + heel / 2;
  const M_stab = W_wall * x_wall + W_footing * x_foot + W_backfill * x_bf;
  const M_over = Pa * (H / 3);
  const FS_over = M_stab / M_over;
  const e = Math.abs(M_stab - M_over) / W; // față de rezultat — simplificat
  const sigma_max = W / B * (1 + Math.min(1, (6 * (B / 2 - Math.min(B / 2, M_stab / W))) / B));
  // σ pe talpă: N/B * (1+6e/B) cu e din moment net față de centru
  const M_net = M_over - (W_wall * (x_wall - B / 2) + W_backfill * (x_bf - B / 2));
  const e_c = Math.abs(M_net) / W;
  const sigma = e_c <= B / 6 ? (W / B) * (1 + (6 * e_c) / B) : (2 * W) / (3 * (B / 2 - e_c));
  return {
    B_m: B,
    B_cm: Math.round(B * 100),
    heel_m: round(heel, 2),
    W_kNm: round(W, 1),
    Pa_kNm: round(Pa, 1),
    FS_slip: round(FS_slip, 2),
    FS_over: round(FS_over, 2),
    sigma_max_kPa: round(sigma, 0),
    pass_slip: FS_slip >= gamma_slip,
    pass_over: FS_over >= FS_over_req,
    pass_sigma: sigma <= q_allow * 1.15,
    pass: FS_slip >= gamma_slip && FS_over >= FS_over_req && sigma <= q_allow * 1.15,
  };
}

const at80 = check(B0);
let B_need = B0;
let sized = at80;
for (let b = 0.8; b <= 2.0; b += 0.05) {
  const r = check(b);
  if (r.pass) {
    B_need = b;
    sized = r;
    break;
  }
}
const B_adopt_cm = Math.ceil(B_need * 100 / 5) * 5;
const adopted = check(B_adopt_cm / 100);

const out = {
  meta: {
    id: "s1_a1_footing_stability_v01",
    generated: new Date().toISOString(),
    status: "ordin_nu_semnat",
    case: adopt?.id ?? "hw10",
    disclaimer: "Schema 2D pe ml, umplutură pe heel. Geo 131 + FE confirmă μ / apă / pinten.",
  },
  loads: { Pa_kNm: round(Pa, 1), mu, gamma_slip, FS_over_req, q_allow_kPa: q_allow },
  at_B80: at80,
  sized_min: sized,
  adopt: {
    B_cm: B_adopt_cm,
    ...adopted,
    note:
      B_adopt_cm > 80
        ? `Talpa 80 pică alunecare/răsturnare la ${adopt?.id}; adopt studiu **${B_adopt_cm} cm** (sau pinten + drenaj).`
        : "Talpa 80 OK pe ordin.",
  },
  pass_all: adopted.pass,
};

// A1.200: nu suprascrie B din footing_drawn (geometrie inward reală).
// Acest script rămâne referință „heel+umplutură” — NU e desenul 3D.
const st = a1.structure_a1_study_cm;
const drawnOk =
  st?.foundations_study_cm?.perimeter_strip_calc_status ===
  "VALIDATED_ON_DRAWN_GEOMETRY_ORDIN";
if (st.foundations_study_cm && !drawnOk) {
  st.foundations_study_cm.perimeter_strip_width_cm = B_adopt_cm;
  st.foundations_study_cm.perimeter_strip_note =
    B_adopt_cm > 80
      ? `mărit din 80 pentru FS alunecare/răsturnare caz ${adopt?.id} (heel+fill — nu desen)`
      : st.foundations_study_cm.note;
  a1.structure_a1_study_cm = st;
  fs.writeFileSync(a1p, JSON.stringify(a1, null, 2));
  fs.writeFileSync(
    path.join(root, "data/building/a1_structure_study.json"),
    JSON.stringify(st, null, 2)
  );
}

const md = `# S1 A1 — Stabilitate talpă perimetru (alunecare / răsturnare)

**Status:** ordin pe ml · **NU** semnat  
**Caz:** ${out.meta.case} (retenție + apă + seism)  
**Generat:** ${out.meta.generated.slice(0, 16)}

## La B = 80 cm (lock vechi)

| Verificare | Valoare | Cerință | PASS |
|------------|--------:|--------:|:----:|
| Alunecare FS | **${at80.FS_slip}** | ≥ ${gamma_slip} | **${at80.pass_slip}** |
| Răsturnare FS | **${at80.FS_over}** | ≥ ${FS_over_req} | **${at80.pass_over}** |
| σ max | **${at80.sigma_max_kPa}** kPa | ≤ ${q_allow} | **${at80.pass_sigma}** |

**PASS @80:** **${at80.pass}**

## Adopt studiu

| | |
|--|--:|
| **B adopt** | **${B_adopt_cm}** cm |
| FS alunecare | **${adopted.FS_slip}** |
| FS răsturnare | **${adopted.FS_over}** |
| σ max | **${adopted.sigma_max_kPa}** kPa |
| PASS | **${adopted.pass}** |

${out.adopt.note}

> **A1.200:** desenul 3D e **inward fără umplutură pe heel** — folosește \`s1_a1_footing_drawn_v01\` (B pe desen, nu acest adopt heel+fill).

Alternative: pinten sub talpă · drenaj (↓ hw) · μ mai bun din geo.

JSON: \`s1_a1_footing_stability_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_footing_stability_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_footing_stability_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      at80: { FS_slip: at80.FS_slip, FS_over: at80.FS_over, pass: at80.pass },
      adopt_cm: B_adopt_cm,
      FS_slip: adopted.FS_slip,
      FS_over: adopted.FS_over,
      pass: adopted.pass,
    },
    null,
    2
  )
);
