/**
 * Hint armare minimă A1 (EC2 / P100 ordin) — NU planuri dt, NU semnat.
 * Rulează: node src/calc_a1_rebar_hint_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const calc = JSON.parse(fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), "utf8"));
const st = a1.structure_a1_study_cm;
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;

const FCK = 25;
const FYK = 500;
const FYD = FYK / 1.15;

function bars(As, dia) {
  const a = (Math.PI * dia ** 2) / 4;
  return Math.max(4, Math.ceil(As / a));
}

const columns = (calc.columns || [])
  .filter((c) => c.id !== "C_SHAFT_E_PIER")
  .map((c) => {
    const col = (st.columns || []).find((x) => x.id === c.id);
    const b = col?.dx ?? 30;
    const h = col?.dy ?? 30;
    const Ac = b * h; // cm²
    const As_min = 0.002 * Ac * 100; // mm² EC2
    const As_p100 = 0.01 * Ac * 100; // hint zonă
    const n14 = bars(As_min, 14);
    const n16 = bars(As_p100, 16);
    // etrieri: s ≤ 8Ø / 20cm tipic zonă — hint
    const s_crit = Math.min(20, 8 * 1.4); // cm pe Ø14
    return {
      id: c.id,
      section: `${b}×${h}`,
      As_min_mm2: round(As_min),
      As_p100_hint_mm2: round(As_p100),
      long_EC2: `${n14}φ14`,
      long_P100_zona: `${Math.max(8, n16)}φ16`,
      stirrups_hint: `φ8 @ ${Math.round(s_crit)} cm zonă / @ 20 cm mijloc (ordin)`,
    };
  });

const beams = (calc.beams || []).map((b) => {
  const bb = 30;
  const h = b.h_cm || st.beam_height_adopt_cm?.[b.id] || 40;
  const d = h - 4;
  const M = b.M_kNm ?? 0;
  const As_calc = M > 0 ? (M * 1e6) / (0.9 * (d / 100) * FYD * 1e3) : 0;
  const As_min = 0.0013 * bb * 10 * d; // mm² pe lățime bb cm
  const As = Math.max(As_calc, As_min);
  const n16 = bars(As, 16);
  return {
    id: b.id,
    section: `${bb}×${h}`,
    M_kNm: M,
    As_mm2: round(As),
    bottom_hint: `${n16}φ16`,
    top_hint: `2φ16 (continuitate ordin)`,
    stirrups: `φ8 @ 15/25 cm (ordin)`,
  };
});

const slab = {
  h_cm: 15,
  As_min_mm2_m: round(0.0013 * 1000 * 120), // d≈12 cm
  mesh_hint: "φ10 @ 15 cm ambele direcții (sau plasa echivalent) — ordin",
  top_over_supports: "φ10 @ 15 cm pe reazeme / centuri",
};

const retaining = {
  t_cm: 30,
  H_m: 2.5,
  M_kNm_m: 18.9,
  As_vert_mm2_m: round((18.9 * 1e6) / (0.9 * 0.26 * FYD * 1e3)),
  hint: "φ12 @ 15 cm vertical interior + φ10 @ 20 orizontal — ordin",
};

const footing = {
  strip_cm: 80,
  As_bottom_hint: "φ12 @ 15 cm transversal + φ10 @ 20 longitudinal — ordin",
  pad_hint: "φ12 plasă inferioară ambele direcții @ 15 cm — ordin",
};

const out = {
  status: "hint_nu_dt",
  disclaimer: "Nu e plan de armare. Structurist confirmă / înlocuiește.",
  columns,
  beams,
  slab,
  retaining,
  footing,
};

const md = `# S1 A1 — Hint armare (ordin EC2/P100)

**Status:** sugestii cantitative · **NU** planuri dt · **NU** semnat  
**Generat:** ${new Date().toISOString().slice(0, 16)}

> Folosește ca temă pentru structurist / verificare; nu turna după aceste cifre fără proiect.

## Stâlpi

| ID | Secțiune | As min | EC2 | P100 zonă | Etrieri |
|----|----------|-------:|-----|-----------|---------|
${columns.map((c) => `| ${c.id} | ${c.section} | ${c.As_min_mm2} | ${c.long_EC2} | ${c.long_P100_zona} | ${c.stirrups_hint} |`).join("\n")}

## Grinzi / centuri

| ID | Secțiune | M | As | Inferior | Superior | Etrieri |
|----|----------|--:|---:|----------|----------|---------|
${beams.map((b) => `| ${b.id} | ${b.section} | ${b.M_kNm} | ${b.As_mm2} | ${b.bottom_hint} | ${b.top_hint} | ${b.stirrups} |`).join("\n")}

## Placă 15 cm
- As min ≈ **${slab.As_min_mm2_m}** mm²/m  
- ${slab.mesh_hint}  
- ${slab.top_over_supports}

## Retenție ~30 cm
- M ordin ≈ ${retaining.M_kNm_m} kNm/m → As ≈ **${retaining.As_vert_mm2_m}** mm²/m  
- ${retaining.hint}

## Fundații (geo120)
- Bandă 80: ${footing.As_bottom_hint}  
- Pad: ${footing.pad_hint}

JSON: \`s1_a1_rebar_hint_v01.json\`
`;

fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_rebar_hint_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_rebar_hint_v01.md"), md);
console.log(JSON.stringify({ ok: true, columns: columns.length, beams: beams.length }, null, 2));
