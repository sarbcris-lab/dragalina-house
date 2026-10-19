/**
 * Sensibilitate fundații A1: q_allow = 180 / 221 / 250 kPa.
 * Nu rescrie pad-urile adoptate (rămân pe lock 221); doar tabel comparație.
 * Rulează: node src/calc_a1_foundations_sens_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const calc100 = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), "utf8")
);
const geo120 = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_foundations_geo120_v01.json"), "utf8")
);
const st = a1.structure_a1_study_cm;
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;

const SCENARIOS = [
  { id: "q180", q_allow: 180, label: "pesimist (geo mai slab)" },
  { id: "q221", q_allow: 221, label: "lock studiu 310/1,4 (adoptat)" },
  { id: "q250", q_allow: 250, label: "optimist (aproape Pconv/1,24)" },
];

function padSide(N, q) {
  const sideMin = Math.ceil((Math.sqrt(N / q) * 100) / 5) * 5;
  return Math.max(80, sideMin);
}

const columns = (calc100.columns || [])
  .map((c) => {
    const col = (st.columns || []).find((x) => x.id === c.id);
    if (!col) return null;
    if (!(col.levels || []).some((l) => l === "S" || l === "P")) return null;
    return { id: c.id, N_kN: c.N_kN ?? 200 };
  })
  .filter(Boolean);

const byScenario = SCENARIOS.map((sc) => {
  const pads = columns.map((c) => {
    const side = padSide(c.N_kN, sc.q_allow);
    const sigma = c.N_kN / (side / 100) ** 2;
    return {
      id: c.id,
      N_kN: c.N_kN,
      pad_cm: side,
      sigma_kPa: round(sigma),
      pass: sigma <= sc.q_allow + 1,
    };
  });
  const N_wall = geo120.perimeter_strip?.N_ordin_kN_m ?? 40.2;
  const stripW = geo120.perimeter_strip?.width_cm ?? 80;
  const sigma_strip = N_wall / (stripW / 100);
  // dacă strip 80 nu trece, lățimea minimă tip 5 cm
  const stripNeed = Math.ceil((N_wall / sc.q_allow) * 100 / 5) * 5;
  return {
    ...sc,
    pads,
    pad_max_cm: Math.max(...pads.map((p) => p.pad_cm)),
    pad_sum_m2: round(
      pads.reduce((s, p) => s + (p.pad_cm / 100) ** 2, 0),
      2
    ),
    all_pads_pass: pads.every((p) => p.pass),
    strip_80_sigma_kPa: round(sigma_strip),
    strip_80_pass: sigma_strip <= sc.q_allow + 1,
    strip_need_cm: Math.max(60, stripNeed),
  };
});

const adopt = byScenario.find((s) => s.id === "q221");
const vsAdopt = byScenario.map((sc) => ({
  id: sc.id,
  q_allow: sc.q_allow,
  delta_pad_max_cm: sc.pad_max_cm - adopt.pad_max_cm,
  delta_pad_sum_m2: round(sc.pad_sum_m2 - adopt.pad_sum_m2, 2),
  strip_ok_at_80: sc.strip_80_pass,
}));

const out = {
  meta: {
    id: "s1_a1_foundations_sens_v01",
    generated: new Date().toISOString(),
    status: "sensibilitate_studiu_nu_semnat",
    adopt_lock: "q221 = 310/1,4",
    disclaimer:
      "Nu schimbă pad-urile din a1. Doar arată ce s-ar întâmpla dacă Rc e 180 sau 250.",
  },
  scenarios: byScenario,
  vs_adopt: vsAdopt,
  recommendation: {
    keep_lock_q221: true,
    if_geo_180:
      "Mărește pad-uri (max → " +
      byScenario.find((s) => s.id === "q180").pad_max_cm +
      " cm) și verifică talpa 80; posibil ≥" +
      byScenario.find((s) => s.id === "q180").strip_need_cm +
      " cm pe retenție.",
    if_geo_250: "Pad-urile actuale rămân confortabile; poți micșora ușor la FE dacă Rc confirmat.",
  },
};

const md = `# S1 A1 — Sensibilitate fundații q = 180 / 221 / 250

**Status:** studiu · **NU** semnat · nu rescrie lock-ul q=221  
**Generat:** ${out.meta.generated.slice(0, 16)}

## Rezumat

| Scenariu | q_allow | Pad max | Σ pad m² | Δ vs 221 | Talpă 80 PASS | Talpă nec. |
|----------|--------:|--------:|---------:|---------:|:-------------:|-----------:|
${byScenario
  .map((s) => {
    const d = vsAdopt.find((v) => v.id === s.id);
    return `| **${s.id}** ${s.label} | ${s.q_allow} | ${s.pad_max_cm} | ${s.pad_sum_m2} | ${d.delta_pad_max_cm >= 0 ? "+" : ""}${d.delta_pad_max_cm} cm max / ${d.delta_pad_sum_m2 >= 0 ? "+" : ""}${d.delta_pad_sum_m2} m² | **${s.strip_80_pass}** | ${s.strip_need_cm} |`;
  })
  .join("\n")}

**Adoptat rămâne q=221** (A1.185). Geo 131 înlocuiește.

## Pad-uri pe stâlp

${byScenario
  .map(
    (s) => `### ${s.id} — q=${s.q_allow} kPa

| ID | N kN | Pad cm | σ | PASS |
|----|-----:|-------:|--:|:----:|
${s.pads.map((p) => `| ${p.id} | ${p.N_kN} | ${p.pad_cm}×${p.pad_cm} | ${p.sigma_kPa} | **${p.pass}** |`).join("\n")}
`
  )
  .join("\n")}

## Recomandare

- Lock curent **221** e echilibrat față de 180 (pad max +${vsAdopt.find((v) => v.id === "q180").delta_pad_max_cm} cm) și 250 (${vsAdopt.find((v) => v.id === "q250").delta_pad_max_cm} cm).
- ${out.recommendation.if_geo_180}
- ${out.recommendation.if_geo_250}

JSON: \`s1_a1_foundations_sens_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_foundations_sens_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_foundations_sens_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      scenarios: byScenario.map((s) => ({
        id: s.id,
        pad_max: s.pad_max_cm,
        strip_80: s.strip_80_pass,
      })),
    },
    null,
    2
  )
);
