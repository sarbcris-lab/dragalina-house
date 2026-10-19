/**
 * Confinare P100 — spațiere etrieri pe stâlpi (hint zonă critică).
 * Rulează: node src/calc_a1_p100_confinement_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const calc = JSON.parse(fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), "utf8"));
const rebar = JSON.parse(fs.readFileSync(path.join(root, "outputs/reports/s1_a1_rebar_hint_v01.json"), "utf8"));
const st = a1.structure_a1_study_cm;
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

const lv = st.levels_cm || {};
const clear = lv.clear_under_beam_cm ?? 255;
const h_storey = (lv.ff_to_ff_cm ?? 307) / 100; // m aproximativ etaj

const columns = (calc.columns || [])
  .filter((c) => c.id !== "C_SHAFT_E_PIER")
  .map((c) => {
    const col = (st.columns || []).find((x) => x.id === c.id);
    const b = col?.dx ?? 30;
    const h = col?.dy ?? 30;
    const bmin = Math.min(b, h); // cm
    const longDia = 16; // mm — P100 zonă hint
    const stirrupDia = 8; // mm

    // P100 / EC8 ordin: s ≤ min(b0/2, 8Ølong, 175mm) în zonă critică tip medium ductility
    const s_b0 = bmin / 2; // cm (b0≈bmin pe secțiune dreptunghiulară tip)
    const s_8d = (8 * longDia) / 10; // cm
    const s_175 = 17.5;
    const s_crit = Math.floor(Math.min(s_b0, s_8d, s_175));
    const s_mid = Math.min(20, Math.floor(Math.min(bmin, 20)));

    // Lungime zonă critică tip: max(h_c, lc/6, 0.45m) — lc ≈ clear storey
    const lc = clear / 100;
    const hc = Math.max(b, h) / 100;
    const l_crit = Math.max(hc, lc / 6, 0.45);
    const l_crit_cm = round(l_crit * 100, 0);

    const rb = (rebar.columns || []).find((x) => x.id === c.id);

    return {
      id: c.id,
      section: `${b}×${h}`,
      util_NM: c.util_NM,
      long_hint: rb?.long_P100_zona || "8φ16",
      stirrup: `φ${stirrupDia}`,
      s_crit_cm: s_crit,
      s_mid_cm: s_mid,
      l_crit_cm,
      s_limits: { b0_2: s_b0, d8: s_8d, cap175: s_175 },
      adopt: `φ${stirrupDia} @ ${s_crit} cm pe ${l_crit_cm} cm de la nod (sus+jos) / @ ${s_mid} cm mijloc`,
      note: c.flag === "REVIEW" ? "util ridicat — FE confinare prioritar" : "ordin",
    };
  });

const out = {
  meta: {
    id: "s1_a1_p100_confinement_v01",
    generated: new Date().toISOString(),
    status: "hint_P100_nu_dt",
    disclaimer: "Spațieri tip ductilitate medie. Structurist confirmă clasa de ductilitate + α pe amplasament.",
    clear_cm: clear,
    h_storey_m: round(h_storey, 2),
  },
  columns,
};

const md = `# S1 A1 — Confinare P100 (etrieri stâlpi, hint)

**Status:** spațiere ordin · **NU** plan dt · **NU** semnat  
**Generat:** ${out.meta.generated.slice(0, 16)}  
**Regulă tip:** s_crit ≤ min(b₀/2, 8Ø_long, 17,5 cm) · l_crit ≥ max(h_c, l_c/6, 45 cm)

## Stâlpi

| ID | Secțiune | util | Long. | s crit | s mijloc | l_crit | Adopt |
|----|----------|-----:|-------|-------:|---------:|-------:|-------|
${columns
  .map(
    (c) =>
      `| ${c.id} | ${c.section} | ${c.util_NM} | ${c.long_hint} | **${c.s_crit_cm}** | ${c.s_mid_cm} | ${c.l_crit_cm} | ${c.adopt} |`
  )
  .join("\n")}

## Note

- Etrier **închis** + ciocuri 135° în zonă critică (P100).  
- Stâlpi cu flag REVIEW (\`C_E_PAL\`, \`C_N_MID\`): prioritate FE.  
- Nu înlocuiește calculul α / ωwd — doar temă de detaliere.

JSON: \`s1_a1_p100_confinement_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_p100_confinement_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_p100_confinement_v01.md"), md);

console.log(
  JSON.stringify(
    {
      ok: true,
      n: columns.length,
      s_crit_range: [Math.min(...columns.map((c) => c.s_crit_cm)), Math.max(...columns.map((c) => c.s_crit_cm))],
    },
    null,
    2
  )
);
