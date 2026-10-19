/**
 * Retenție BA: împingere + hidrostatică + seism (Seed / kh ordin).
 * Rulează: node src/calc_a1_retaining_seis_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const calc100 = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), "utf8")
);
const gaps = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_gaps_v01.json"), "utf8")
);
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

const FYD = 500 / 1.15;
const H = 2.5;
const gamma = 18; // kN/m³
const Ka = 0.33;
const t_wall = 0.3; // A1 retenție ~30 cm
const d = t_wall - 0.04;

const Pa = 0.5 * Ka * gamma * H ** 2;
const M_earth = (Pa * H) / 3;

// Hidrostatică — scenarii
const hydroScenarios = [
  { id: "dry", hw: 0, label: "fără apă (ca geo120 citat)" },
  { id: "hw05", hw: 0.5, label: "apă 0,5 m" },
  { id: "hw10", hw: 1.0, label: "apă 1,0 m (conservator studiu)" },
];

function hydro(hw) {
  const Ph = 0.5 * 10 * hw ** 2;
  const Mh = hw > 0 ? (Ph * hw) / 3 : 0;
  return { Ph: round(Ph, 2), Mh: round(Mh, 2) };
}

// Seism pe zid — Seed-Whitman ΔPae = (3/8)·kh·γ·H², braț ~0,6H
const ag = calc100.seismic?.ag ?? 0.1;
const S = calc100.seismic?.S ?? 1.2;
const kh = round(0.5 * ag * S, 3); // tipic retenție
const dPae = (3 / 8) * kh * gamma * H ** 2;
const M_seis = dPae * 0.6 * H;

const cases = hydroScenarios.map((sc) => {
  const h = hydro(sc.hw);
  const M = M_earth + h.Mh + M_seis;
  const As = (M * 1e6) / (0.9 * d * FYD * 1e3);
  const As_min = 0.0013 * 1000 * d * 100; // mm²/m
  const As_use = Math.max(As, As_min);
  const s12 = Math.floor((113 * 1000) / As_use); // φ12 spacing cm
  const s_adopt = Math.min(15, Math.max(10, Math.floor(s12 / 5) * 5));
  return {
    id: sc.id,
    label: sc.label,
    hw_m: sc.hw,
    Pa_earth: round(Pa, 1),
    Phydro: h.Ph,
    dPae: round(dPae, 1),
    M_earth: round(M_earth, 1),
    M_hydro: h.Mh,
    M_seis: round(M_seis, 1),
    M_tot_kNm_m: round(M, 1),
    As_mm2_m: round(As_use, 0),
    hint: `φ12 @ ${s_adopt} cm vertical interior + φ10 @ 20 oriz.`,
    pass_flex: As_use <= 2500,
  };
});

const adopt = cases.find((c) => c.id === "hw10");
const base_gaps = gaps.calc_2_6_retaining || {};

const out = {
  meta: {
    id: "s1_a1_retaining_seis_v01",
    generated: new Date().toISOString(),
    status: "ordin_extins_nu_semnat",
    disclaimer: "Mononobe-Okabe simplificat (Seed). Geo 131 + FE retenție înlocuiesc.",
  },
  wall: { H_m: H, t_cm: t_wall * 100, Ka, gamma_kNm3: gamma },
  seismic: { ag, S, kh, method: "Seed-Whitman_dPae", dPae_kNm: round(dPae, 1) },
  cases,
  adopt_case: "hw10",
  adopt,
  vs_gaps_simple: {
    M_old: base_gaps.M_kNm_m,
    M_new: adopt?.M_tot_kNm_m,
    As_old: base_gaps.As_mm2_m,
    As_new: adopt?.As_mm2_m,
  },
  strip_check: {
    note: "Reacție la talpă ≈ Pa_tot; talpa 80 deja PASS pe q221 pentru N gravitațional — FE verifică excentricitate + seism",
  },
};

const md = `# S1 A1 — Retenție: pământ + apă + seism

**Status:** ordin extins · **NU** semnat · fără geo 131  
**Generat:** ${out.meta.generated.slice(0, 16)}

## Ipoteze

| | |
|--|--:|
| H zid | **${H}** m |
| Grosime | **${t_wall * 100}** cm |
| Ka / γ | ${Ka} / ${gamma} kN/m³ |
| ag / S | ${ag}g / ${S} |
| kh | **${kh}** |
| ΔPae (Seed) | **${round(dPae, 1)}** kN/m |
| M seism | **${round(M_seis, 1)}** kNm/m |

## Scenarii

| Caz | hw | Pa | Ph | ΔPae | M tot | As mm²/m | Hint | PASS |
|-----|---:|---:|---:|-----:|------:|---------:|------|:----:|
${cases
  .map(
    (c) =>
      `| **${c.id}** ${c.label} | ${c.hw_m} | ${c.Pa_earth} | ${c.Phydro} | ${c.dPae} | **${c.M_tot_kNm_m}** | ${c.As_mm2_m} | ${c.hint} | **${c.pass_flex}** |`
  )
  .join("\n")}

**Adopt studiu (conservator):** \`${out.adopt_case}\` → M=**${adopt.M_tot_kNm_m}** kNm/m · ${adopt.hint}

## Față de calc simplu (gaps 2.6)

| | Vechi (doar Ka) | Nou (apă 1 m + seism) |
|--|----------------:|----------------------:|
| M kNm/m | ${base_gaps.M_kNm_m ?? "—"} | **${adopt.M_tot_kNm_m}** |
| As mm²/m | ${base_gaps.As_mm2_m ?? "—"} | **${adopt.As_mm2_m}** |

## FE

- Nivel apă real din geo 131  
- Mononobe-Okabe pe φ teren + δ interfață  
- Verificare alunecare / răsturnare pe talpa 80  
- Armare DT pe As de mai sus ca temă  

JSON: \`s1_a1_retaining_seis_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_retaining_seis_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_retaining_seis_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      adopt: adopt.id,
      M: adopt.M_tot_kNm_m,
      As: adopt.As_mm2_m,
      hint: adopt.hint,
      pass: adopt.pass_flex,
    },
    null,
    2
  )
);
