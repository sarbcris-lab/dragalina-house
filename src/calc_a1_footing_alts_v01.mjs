/**
 * Variante rezervă talpă retenție: B lat / drenaj / pinten.
 * Rulează: node src/calc_a1_footing_alts_v01.mjs
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
const stab = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_footing_stability_v01.json"), "utf8")
);
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

const H = retain.wall?.H_m ?? 2.5;
const t = (retain.wall?.t_cm ?? 30) / 100;
const gamma_c = 25;
const gamma_soil = retain.wall?.gamma_kNm3 ?? 18;
const Ka = retain.wall?.Ka ?? 0.33;
const Kp_use = 3.0;
const dPae = retain.seismic?.dPae_kNm ?? 2.5;
const Pa_earth = 0.5 * Ka * gamma_soil * H ** 2;
const mu = 0.55;
const gamma_slip = 1.1;
const FS_over_req = 1.5;
const q_allow = geo.q_allow_kPa ?? 221;
const h_foot = 0.4;

function Pa_for(hw, withSeis = true) {
  const Ph = 0.5 * 10 * hw ** 2;
  return Pa_earth + Ph + (withSeis ? dPae : 0);
}

function check({ B, hw, key_m = 0, withSeis = true, label, id }) {
  const Pa = Pa_for(hw, withSeis);
  const toe = 0.05;
  const heel = Math.max(0.05, B - t - toe);
  const W_wall = gamma_c * t * H;
  const W_footing = gamma_c * B * h_foot;
  const W_key = key_m > 0 ? gamma_c * 0.3 * key_m : 0;
  const W_backfill = gamma_soil * heel * H;
  const W = W_wall + W_footing + W_backfill + W_key;
  const Rp = key_m > 0 ? 0.5 * Kp_use * gamma_soil * key_m ** 2 : 0;
  const R_slip = mu * W + Rp;
  const FS_slip = R_slip / Pa;
  const x_wall = toe + t / 2;
  const x_foot = B / 2;
  const x_bf = toe + t + heel / 2;
  const M_stab = W_wall * x_wall + W_footing * x_foot + W_backfill * x_bf + W_key * (toe + 0.15);
  const M_over = Pa * (H / 3);
  const FS_over = M_stab / M_over;
  const M_net = M_over - (W_wall * (x_wall - B / 2) + W_backfill * (x_bf - B / 2));
  const e_c = Math.abs(M_net) / W;
  const sigma =
    e_c <= B / 6 ? (W / B) * (1 + (6 * e_c) / B) : (2 * W) / (3 * Math.max(0.05, B / 2 - e_c));
  const pass =
    FS_slip >= gamma_slip && FS_over >= FS_over_req && sigma > 0 && sigma <= q_allow * 1.15;
  return {
    id,
    label,
    B_cm: Math.round(B * 100),
    hw_m: hw,
    key_m,
    withSeis,
    Pa_kNm: round(Pa, 1),
    W_kNm: round(W, 1),
    Rp_kNm: round(Rp, 1),
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

function minB({ hw, key_m = 0, withSeis = true }) {
  for (let b = 0.8; b <= 1.8; b += 0.05) {
    const r = check({ B: b, hw, key_m, withSeis, id: "scan", label: "scan" });
    if (r.pass) return Math.ceil((b * 100) / 5) * 5;
  }
  return null;
}

const variants = [
  check({
    id: "V0_B80_hw10",
    label: "B80 · hw=1 m · seism — eșec referință",
    B: 0.8,
    hw: 1.0,
  }),
  check({
    id: "V1_B115_hw10",
    label: "B115 · hw=1 m · seism — ADOPT model",
    B: 1.15,
    hw: 1.0,
  }),
  check({
    id: "V2_B80_dry_seis",
    label: "B80 · drenaj hw=0 · tot cu seism",
    B: 0.8,
    hw: 0,
  }),
  check({
    id: "V2b_B_min_dry_seis",
    label: `B min la drenaj hw=0 + seism (=${minB({ hw: 0 })} cm)`,
    B: (minB({ hw: 0 }) || 115) / 100,
    hw: 0,
  }),
  check({
    id: "V3_B80_hw05",
    label: "B80 · hw=0,5 m · seism",
    B: 0.8,
    hw: 0.5,
  }),
  check({
    id: "V3b_B_min_hw05",
    label: `B min la hw=0,5 + seism (=${minB({ hw: 0.5 })} cm)`,
    B: (minB({ hw: 0.5 }) || 115) / 100,
    hw: 0.5,
  }),
  check({
    id: "V4_B80_key40_hw10",
    label: "B80 · pinten 40 cm · hw=1 — ajută alunecarea",
    B: 0.8,
    hw: 1.0,
    key_m: 0.4,
  }),
  check({
    id: "V5_B80_key60_hw10",
    label: "B80 · pinten 60 cm · hw=1",
    B: 0.8,
    hw: 1.0,
    key_m: 0.6,
  }),
  check({
    id: "V5b_B_min_key40_hw10",
    label: `B min + pinten 40 · hw=1 (=${minB({ hw: 1, key_m: 0.4 })} cm)`,
    B: (minB({ hw: 1, key_m: 0.4 }) || 115) / 100,
    hw: 1.0,
    key_m: 0.4,
  }),
  check({
    id: "V6_B100_key40_hw10",
    label: "B100 · pinten 40 · hw=1 (compromis)",
    B: 1.0,
    hw: 1.0,
    key_m: 0.4,
  }),
  check({
    id: "V7_B90_dry_noSeis",
    label: "B90 · hw=0 · FĂRĂ seism (doar comparație)",
    B: 0.9,
    hw: 0,
    withSeis: false,
  }),
];

const sizing = {
  hw0_seis_Bcm: minB({ hw: 0 }),
  hw05_seis_Bcm: minB({ hw: 0.5 }),
  hw10_seis_Bcm: minB({ hw: 1 }),
  hw10_key40_Bcm: minB({ hw: 1, key_m: 0.4 }),
  hw10_key60_Bcm: minB({ hw: 1, key_m: 0.6 }),
};

const passing = variants.filter((v) => v.pass);

const decision = {
  keep_adopt: "V1_B115_hw10",
  keep_reason:
    "La hw=1+seism, B min ≈ 110–115. Modelul e deja pe 115 — robust fără a miza pe drenaj.",
  insight:
    "Pintenul salvează ALUNECAREA, nu răsturnarea. Drenajul reduce Pa, dar cu seism tot trebuie B≳100 cm pe ordin.",
  if_geo_dry: `B min ≈ ${sizing.hw0_seis_Bcm} cm (tot cu seism) — nu neapărat 80`,
  if_drain_hw05: `B min ≈ ${sizing.hw05_seis_Bcm} cm`,
  if_want_narrower: `B${sizing.hw10_key40_Bcm} + pinten 40 cm @ hw=1, sau B100+pinten (V6)`,
  if_115_fails: "B 130–150 cm, sau FE cu μ/heel reale + drenaj dovedit",
};

const out = {
  meta: {
    id: "s1_a1_footing_alts_v01",
    generated: new Date().toISOString(),
    status: "variante_studiu_nu_semnat",
    disclaimer: "Ordin 2D. Geo 131 = hw real; FE = pinten/μ.",
    adopt_current_B_cm: stab.adopt?.B_cm ?? 115,
  },
  sizing_Bmin_cm: sizing,
  variants,
  passing_ids: passing.map((v) => v.id),
  decision,
};

const md = `# S1 A1 — Variante talpă retenție (dacă 80 / 115 „pică”)

**Status:** meniu de soluții · **NU** semnat  
**Generat:** ${out.meta.generated.slice(0, 16)}  
**Adopt model:** B=**${out.meta.adopt_current_B_cm}** cm

## Insight

${decision.insight}

## B minim pe scenariu (cu seism)

| Scenariu | B min |
|----------|------:|
| hw=0 (drenaj bun) | **${sizing.hw0_seis_Bcm}** cm |
| hw=0,5 m | **${sizing.hw05_seis_Bcm}** cm |
| hw=1,0 m | **${sizing.hw10_seis_Bcm}** cm |
| hw=1 + pinten 40 | **${sizing.hw10_key40_Bcm}** cm |
| hw=1 + pinten 60 | **${sizing.hw10_key60_Bcm}** cm |

## Variante

| ID | Descriere | B | hw | Key | FS_s | FS_o | PASS | Dacă nu |
|----|-----------|--:|---:|----:|-----:|-----:|:----:|---------|
${variants
  .map(
    (v) =>
      `| \`${v.id}\` | ${v.label} | ${v.B_cm} | ${v.hw_m} | ${v.key_m ? v.key_m * 100 : "—"} | ${v.FS_slip} | ${v.FS_over} | **${v.pass}** | ${v.fail_reason || "—"} |`
  )
  .join("\n")}

## Decizie

| Situație | Alege |
|----------|-------|
| Acum / fără geo | **\`${decision.keep_adopt}\`** — ${decision.keep_reason} |
| Geo uscat + drenaj | ${decision.if_geo_dry} |
| Drenaj mediu hw≈0,5 | ${decision.if_drain_hw05} |
| Vrei mai îngust @ apă | ${decision.if_want_narrower} |
| FE respinge 115 | ${decision.if_115_fails} |

JSON: \`s1_a1_footing_alts_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_footing_alts_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_footing_alts_v01.md"), md);

console.log(JSON.stringify({ ok: true, sizing, pass: passing.map((v) => v.id), adopt: decision.keep_adopt }, null, 2));
