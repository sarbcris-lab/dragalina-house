/**
 * Completează calculele care lipseau din „calc 100%” A1:
 * 2.2 consolă/nod C_E_PAL · 2.6 retenție · 2.7 acoperiș · pier/riser · matrice acoperire.
 *
 * Rulează: node src/calc_a1_structure_gaps_v01.mjs
 * (după calc_a1_structure_100_v01.mjs)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const st = a1.structure_a1_study_cm;
const prevPath = path.join(root, "outputs/reports/s1_a1_calc_100_v01.json");
const prev = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, "utf8")) : null;

const cols = Object.fromEntries((st?.columns || []).map((c) => [c.id, c]));
const box = st?.structure_box_cm || a1.basement_cm?.structure_box;
const stair = a1.basement_cm?.stair || {};
const fit = stair.fit || {};
const ePal = cols.C_E_PAL;
const shaft = stair.open_shaft;

const Q_ED = 11.78;
const Q_ED_LAND = 11.93;
const FYD = 500 / 1.15;
const FCD = 25 / 1.5;
const FCK = 25;

function round(x, d = 2) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

// ——— 2.2 Consolă / nod C_E_PAL pe geometrie A1
let calc22 = { status: "skip", reason: "lipsește C_E_PAL" };
if (ePal && box) {
  const L_W = Math.max(0.5, (ePal.x - box.x1) / 100); // bandă scară vest de stâlp → A6
  const yPalBot = ePal.y + ePal.dy;
  const yShaft = shaft?.y ?? 588.7;
  const L_S = Math.max(0.4, (yShaft - yPalBot) / 100); // sud spre puț/palier
  const plate = (L) => {
    const M = (Q_ED_LAND * L * L) / 2;
    const V = Q_ED_LAND * L;
    const d = 0.12;
    const As = (M * 1e6) / (0.9 * d * FYD * 1e3);
    const AsMin = 0.0013 * 1000 * d * 1e4;
    return {
      L_m: round(L, 3),
      M_kNm_m: round(M, 1),
      V_kN_m: round(V, 1),
      As_mm2_m: round(As, 0),
      As_min: round(AsMin, 0),
      pass_flex: As <= AsMin * 3 || M < 15,
    };
  };
  const pS = plate(L_S);
  const pW = plate(L_W);
  const trib = Math.max(L_W, 1.0);
  const qB = Q_ED_LAND * trib;
  const Mbeam = (qB * L_S * L_S) / 2;
  const Vbeam = qB * L_S;
  const T = pW.V_kN_m * 1.0 * (L_W / 2);
  const Mnode = Mbeam + 0.5 * T;
  const Nrd = 0.8 * 0.3 * 0.4 * FCD * 1000;
  calc22 = {
    status: "done_ordin",
    L_S_m: pS.L_m,
    L_W_m: pW.L_m,
    plate_S: pS,
    plate_W: pW,
    beam_cantilever: { M_kNm: round(Mbeam, 1), V_kN: round(Vbeam, 1), q: round(qB, 1) },
    torsion_T_kNm: round(T, 1),
    M_node_kNm: round(Mnode, 1),
    Nrd_30x40_kN: round(Nrd, 0),
    keep_C_E_PAL_30x40: true,
    pass_ordin: Mnode < 80 && pS.pass_flex && pW.pass_flex,
    note: "Eforturi modeste; riscul = detaliu torsiune/ancorare — FE nod obligatoriu (ca pe FRAME)",
  };
}

// ——— 2.6 Retenție — împingere activă pe H beci
const H = 2.5; // m FF −250 → teren 0
const gamma = 18; // kN/m³
const Ka = 0.33; // φ≈30°
const q_surcharge = 5; // kN/m²
const e_a = Ka * gamma; // kN/m³
const Pa = 0.5 * e_a * H * H + Ka * q_surcharge * H; // kN/m
const M_ret = Pa * (H / 3); // kNm/m pe consolă din talpă (ordin)
const tw = 0.326; // A11 ~32,6 cm
const d_w = tw - 0.05;
const As_ret = (M_ret * 1e6) / (0.9 * d_w * 1000 * FYD);
const mu_ret = M_ret / (1.0 * d_w * d_w * FCD * 1000);
const calc26_ret = {
  status: "done_ordin",
  H_m: H,
  Ka,
  Pa_kN_m: round(Pa, 1),
  M_kNm_m: round(M_ret, 1),
  wall_th_cm: 32.6,
  mu: round(mu_ret, 3),
  As_mm2_m: round(As_ret, 0),
  pass_flex_ordin: mu_ret < 0.25,
  note: "împingere activă simplă; fără apă/hidrostatic, fără seism pe zid — geo_131 deschis",
};

// Strip N pe cutie
const L_N = ((box?.x1 ?? 534) - (box?.x0 ?? 30)) / 100;
const N_strip = (prev?.columns || [])
  .filter((c) => /C_N|C_W_MID|C_NW/.test(c.id))
  .reduce((s, c) => s + (c.N_kN || 0), 0);
const calc26_fg = {
  status: "done_ordin",
  strip_N_m: round(L_N, 2),
  N_ser_approx_kN: round(N_strip / 1.4, 0),
  note: "pad-uri deja sized în calc_100; Rc parcelă = calcul_lipsă",
};

// ——— 2.7 Acoperiș D3a vs D3b
const area = 58.79;
const q_D3a = 3.4;
const q_D3b = 6.98;
const calc27 = {
  status: "done_ordin",
  area_m2: area,
  D3a_light: { q_Ed: q_D3a, W_kN: round(area * q_D3a, 0) },
  D3b_BA: { q_Ed: q_D3b, W_kN: round(area * q_D3b, 0) },
  delta_kN: round(area * (q_D3b - q_D3a), 0),
  recommendation: "FE întâi D3a (ușoară); D3b sensibilitate — lock D3",
  pass: true,
};

// ——— Pier clear + riser (geometrie / brief)
const calc_pier = {
  status: "done_audit",
  clear_at_pier_cm: fit.clear_at_pier ?? null,
  stair_clear_need_cm: fit.stair_clear_need ?? 100,
  pier_warn: !!fit.pier_warn,
  pass: fit.clear_at_pier == null ? null : fit.clear_at_pier >= (fit.stair_clear_need ?? 100),
  note: fit.pier_warn
    ? `clear ${fit.clear_at_pier} < ${fit.stair_clear_need} — acceptat ca avertisment sau mută pier`
    : "OK sau n/a",
};
const riser = stair.flight?.riser_cm ?? 17.22;
const calc_riser = {
  status: "done_audit",
  riser_cm: riser,
  brief_max_cm: 16,
  pass: riser <= 16,
  note: riser > 16 ? `DESCHIS — ${riser} > 16 brief; tradeoff: +1 treaptă / acceptare` : "OK vs brief",
};

// ——— Matrice acoperire (ce s-a putut face în repo)
const coverage = [
  { id: "2.1_stalp_N_M", done: true, where: "s1_a1_calc_100_v01", limit: "fără flambaj/P100 confinare detaliată" },
  { id: "2.2_consola_C_E_PAL", done: true, where: "acest fișier", limit: "ordin; FE nod rămâne" },
  { id: "2.3_placa", done: true, where: "s1_a1_calc_100_v01", limit: "L/d + δ fisurat ordin" },
  { id: "2.4_grinzi", done: true, where: "s1_a1_calc_100_v01", limit: "simplu rezemat; continuu ar reduce M" },
  { id: "2.5_intoarsa", done: true, where: "s1_a1_calc_100_v01", limit: "flex ordin; sandwich/ancorare FE" },
  { id: "2.6_fundatii_pad", done: true, where: "s1_a1_calc_100_v01", limit: "σ vs 200 kPa studiu" },
  { id: "2.6_retentie_impigere", done: true, where: "acest fișier", limit: "fără apă/seism pe zid" },
  { id: "2.7_acoperis_D3", done: true, where: "acest fișier", limit: "comparație greutate, nu FEM" },
  { id: "SE_LAMELE_decizie", done: true, where: "s1_a1_calc_100_v01", limit: "NO_LAMELE adoptat" },
  { id: "pier_clear", done: true, where: "acest fișier", limit: "audit geometric" },
  { id: "riser_beci", done: true, where: "acest fișier", limit: "vs brief — nu rezistență" },
  { id: "seism_Vb", done: true, where: "s1_a1_calc_100_v01", limit: "doar Vb global" },
  { id: "seism_pe_elemente", done: false, where: "—", limit: "cere model FEM / P100 complet" },
  { id: "P100_confinare_zone", done: false, where: "—", limit: "detaliu armare — proiectant" },
  { id: "geo_131_Rc", done: false, where: "—", limit: "lipsă studiu teren pe parcelă" },
  { id: "FEM_Robot_etc", done: false, where: "—", limit: "în afara acestui repo" },
  { id: "combinatii_CR0_oficial", done: false, where: "—", limit: "folosim q_Ed agregat 11.78" },
];

const doneN = coverage.filter((c) => c.done).length;
const missN = coverage.filter((c) => !c.done).length;

const out = {
  meta: {
    id: "s1_a1_calc_gaps_v01",
    generated: new Date().toISOString(),
    honest_title: "Maximul calculabil în repo pe schema A1 — NU proiect 100% semnat",
  },
  coverage,
  tallies: { done: doneN, not_in_repo: missN },
  calc_2_2: calc22,
  calc_2_6_retaining: calc26_ret,
  calc_2_6_fg: calc26_fg,
  calc_2_7_roof: calc27,
  pier_clear: calc_pier,
  riser: calc_riser,
  prior_decision: prev?.summary?.decision || null,
};

const md = `# S1 A1 — Acoperire calcule (gaps fill)

**Status:** ${out.meta.honest_title}  
**Generat:** ${out.meta.generated.slice(0, 19)}

## Răspuns scurt

Am putut face în repo **${doneN}** blocuri de calcul ordin.  
**Nu** am putut (și nu pretindem): **${missN}** — FEM, seism pe bare, confinare P100 detaliată, Rc pe 131, combinații CR0 oficial.

Decizia **NO_LAMELE** rămâne validă pe calculele de grindă SE; asta nu înseamnă „structura e 100% proiect”.

---

## Matrice

| ID | În repo? | Unde | Limită |
|----|:--------:|------|--------|
${coverage
  .map((c) => `| ${c.id} | ${c.done ? "**da**" : "nu"} | ${c.where} | ${c.limit} |`)
  .join("\n")}

---

## 2.2 Consolă / nod C_E_PAL (A1)

| | |
|--|--|
| L_S (spre puț) | **${calc22.L_S_m ?? "—"}** m |
| L_W (spre A6) | **${calc22.L_W_m ?? "—"}** m |
| Placă S M | ${calc22.plate_S?.M_kNm_m ?? "—"} kNm/m |
| Placă W M | ${calc22.plate_W?.M_kNm_m ?? "—"} kNm/m |
| B_E consolă M/V | ${calc22.beam_cantilever?.M_kNm ?? "—"} / ${calc22.beam_cantilever?.V_kN ?? "—"} |
| T / M_nod | ${calc22.torsion_T_kNm ?? "—"} / ${calc22.M_node_kNm ?? "—"} kNm |
| Păstrează 30×40 | **${calc22.keep_C_E_PAL_30x40}** |
| Pass ordin | **${calc22.pass_ordin}** |
| Notă | ${calc22.note || calc22.reason || ""} |

---

## 2.6 Retenție (împingere)

| | |
|--|--|
| H | ${calc26_ret.H_m} m |
| Pa | **${calc26_ret.Pa_kN_m}** kN/m |
| M | **${calc26_ret.M_kNm_m}** kNm/m |
| μ perete A11 | **${calc26_ret.mu}** → pass flex **${calc26_ret.pass_flex_ordin}** |
| Notă | ${calc26_ret.note} |

---

## 2.7 Acoperiș D3a vs D3b

| | D3a ușoară | D3b BA |
|--|----------:|---------:|
| q_Ed | ${calc27.D3a_light.q_Ed} | ${calc27.D3b_BA.q_Ed} |
| W pe ${area} m² | **${calc27.D3a_light.W_kN}** kN | **${calc27.D3b_BA.W_kN}** kN |
| Δ | | **+${calc27.delta_kN}** kN |

${calc27.recommendation}

---

## Pier clear / riser

| | Valoare | Pass |
|--|--------:|:----:|
| Clear @pier | ${calc_pier.clear_at_pier_cm ?? "—"} cm (țintă ${calc_pier.stair_clear_need_cm}) | **${calc_pier.pass}** |
| Riser beci | ${calc_riser.riser_cm} vs brief ${calc_riser.brief_max_cm} | **${calc_riser.pass}** |

${calc_pier.note}  
${calc_riser.note}

---

## Ce rămâne în afara repo-ului

1. Model FEM (Robot/Axis/…) pe schema \`structure_a1_study_cm\`  
2. Seism pe elemente + confinare P100  
3. Studiu geo **Rc pe 131**  
4. Detaliu nod C_E_PAL (torsiune) semnat  
5. Decizie brief riser 17,22 vs 16  

JSON: \`outputs/reports/s1_a1_calc_gaps_v01.json\`
`;

// Patch prior report honesty
if (prev) {
  prev.meta = prev.meta || {};
  prev.meta.status_clarified =
    "Ordin pe stâlpi/grinzi/placă/SE — vezi s1_a1_calc_gaps_v01 pentru acoperire reală; NU proiect 100%";
  prev.gaps_ref = "outputs/reports/s1_a1_calc_gaps_v01.md";
  fs.writeFileSync(prevPath, JSON.stringify(prev, null, 2) + "\n");
}

fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_calc_gaps_v01.json"), JSON.stringify(out, null, 2) + "\n");
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_calc_gaps_v01.md"), md);

// Append honesty banner to calc_100 md
const p100md = path.join(root, "outputs/reports/s1_a1_calc_100_v01.md");
if (fs.existsSync(p100md)) {
  let t = fs.readFileSync(p100md, "utf8");
  if (!t.includes("s1_a1_calc_gaps_v01")) {
    t = t.replace(
      "**Status:** ordin_complet_pe_schema — NU proiect semnat",
      "**Status:** ordin pe schemă (stâlpi/grinzi/placă/SE) — NU proiect semnat  \n**Acoperire reală:** vezi [`s1_a1_calc_gaps_v01.md`](s1_a1_calc_gaps_v01.md) — ce s-a putut / ce nu"
    );
    fs.writeFileSync(p100md, t);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      done: doneN,
      not_in_repo: missN,
      calc22_pass: calc22.pass_ordin,
      retaining_pass: calc26_ret.pass_flex_ordin,
      pier_pass: calc_pier.pass,
      riser_pass: calc_riser.pass,
      files: ["outputs/reports/s1_a1_calc_gaps_v01.md"],
    },
    null,
    2
  )
);
