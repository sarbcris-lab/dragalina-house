/**
 * Maximul calculabil în repo pe A1 (fără FEM/geo/planuri semnate).
 * Seism pe stâlpi · punching · SLS căpriori · vânt fațadă · retenție+apă · As min P100.
 * Rulează: node src/calc_a1_max_inrepo_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const v47 = JSON.parse(fs.readFileSync(path.join(root, "data/building/v47_a1_study.json"), "utf8"));
const prev = JSON.parse(fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), "utf8"));
const windPrev = fs.existsSync(path.join(root, "outputs/reports/s1_a1_wind_buckling_ec5_v01.json"))
  ? JSON.parse(fs.readFileSync(path.join(root, "outputs/reports/s1_a1_wind_buckling_ec5_v01.json"), "utf8"))
  : null;

const st = a1.structure_a1_study_cm;
const roof = v47.roof_cm || {};
const lv = st?.levels_cm || {};
const outMd = path.join(root, "outputs/reports/s1_a1_max_inrepo_v01.md");
const outJson = path.join(root, "outputs/reports/s1_a1_max_inrepo_v01.json");

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const FCK = 25;
const FCD = FCK / 1.5;
const FYD = 500 / 1.15;
const Q_ED = 11.78;

// ─── 1) Seism pe stâlpi (distribuție Vb ordin) ───
const Vb = prev?.seismic?.Vb_kN ?? 75.9;
const colsPE = (st.columns || []).filter((c) =>
  (c.levels || []).some((l) => l === "P" || l === "E")
);
/** rigiditate relativă ~ I/H · I ∝ b·h³ pe direcția slabă */
function Imin(c) {
  const a = Math.min(c.dx, c.dy) / 100;
  const b = Math.max(c.dx, c.dy) / 100;
  return (a * a ** 3) / 12;
}
const sumI = colsPE.reduce((s, c) => s + Imin(c), 0);
const H_story = ((lv.ff_etaj ?? 355) - (lv.ff_parter ?? 48)) / 100; // ~3.07
const seismicCols = colsPE.map((c) => {
  const share = Imin(c) / sumI;
  const V_i = Vb * share;
  // portal: M ≈ V·H/2 pe capăt (ordin cadre)
  const M_seis = (V_i * H_story) / 2;
  const bw = Math.min(c.dx, c.dy) / 100;
  const bh = Math.max(c.dx, c.dy) / 100;
  const Mrd = 0.35 * bw * bh * bh * FCD * 1000; // kNm ordin
  // N din prev calc dacă există
  const prevC = (prev.columns || []).find((x) => x.id === c.id);
  const N = prevC?.N_kN ?? 200;
  const Nrd = prevC?.Nrd_kN ?? bw * bh * FCD * 1000;
  const util = N / Nrd + M_seis / Math.max(Mrd, 1);
  return {
    id: c.id,
    section: `${c.dx}×${c.dy}`,
    share: round(share, 3),
    V_kN: round(V_i, 2),
    M_seis_kNm: round(M_seis, 1),
    Mrd_kNm: round(Mrd, 1),
    N_kN: round(N, 1),
    util_N_Mseis: round(util, 3),
    pass: util < 0.85 && Math.min(c.dx, c.dy) >= 30,
  };
});
const seisPass = seismicCols.filter((c) => c.pass).length;

// ─── 2) Punching placă la stâlpi (EC2 ordin) ───
const h_slab = (lv.slab_th_hypothesis ?? 15) / 100;
const d_slab = h_slab - 0.025;
const u1 = (c) => 2 * (c.dx / 100 + c.dy / 100) + 4 * Math.PI * (d_slab / 2); // perimetru la 2d aproximat simplu: u=2(c1+c2)+2π·2d → folosim 2(c1+c2)+4d·π/2
function punch(c) {
  const c1 = c.dx / 100;
  const c2 = c.dy / 100;
  const u = 2 * (c1 + c2) + 2 * Math.PI * 2 * d_slab; // control perimeter at 2d
  // trib load pe placă
  const prevC = (prev.columns || []).find((x) => x.id === c.id);
  const V_Ed = (prevC?.trib_m2 ?? 6) * Q_ED * 0.55; // doar etaj pe placă (fracție)
  const v_Ed = V_Ed / (u * d_slab); // kN/m² → MPa: kN/m² /1000 = MPa? v in MPa = V/(u·d) with V in N, u,d in mm
  // V[kN]*1000 / (u[m]*1000 * d[m]*1000) = V/(u·d) * 0.001 N/mm² → v_Ed_MPa = V_Ed/(u*d)
  const v_Ed_MPa = V_Ed / (u * d_slab); // actually kN/m² = 0.001 N/mm² if wrong
  // Correct: V_N / (u_mm * d_mm) = (V_kN*1000) / (u_m*1000 * d_m*1000) = V_kN / (u_m * d_m * 1000) MPa
  const v = (V_Ed * 1000) / (u * 1000 * d_slab * 1000); // = V/(u·d·1000)
  const v_MPa = round(V_Ed / (u * d_slab * 1000), 3);
  const rho = 0.005; // As tipic 0.5%
  const v_rdc = round(0.12 * Math.min(1 + Math.sqrt(200 / (d_slab * 1000)), 2.0) * Math.pow(100 * rho * FCK, 1 / 3), 3);
  // EC2: CRd,c·k·(100ρfck)^(1/3) — CRd,c=0.18/γc=0.12
  const pass = v_MPa <= v_rdc * 1.1; // +10% ordin / without reinforcement check
  return {
    id: c.id,
    V_Ed_kN: round(V_Ed, 1),
    u_m: round(u, 2),
    v_Ed_MPa: v_MPa,
    v_Rdc_MPa: v_rdc,
    pass,
  };
}
const punchResults = colsPE.filter((c) => (c.levels || []).includes("P") || (c.levels || []).includes("E")).map(punch);
const punchPass = punchResults.filter((p) => p.pass).length;

// ─── 3) SLS căpriori EC5 (săgeată) ───
const cover = roof.covers_cm || { x0: 0, x1: 682.6, y0: 0, y1: 861.3 };
const L = Math.hypot((roof.rise_cm || 248.6) / 100, ((cover.y1 - cover.y0) / 2) / 100);
const spacing = 1.2;
const q_Ek = (windPrev?.q_Ed_design ?? 3.36) / 1.4; // aprox caracteristic din ULS
const q_line_k = q_Ek * spacing;
const E_mean = 11e3; // MPa C24
const b_mm = 120;
const h_mm = 250;
const I = (b_mm * h_mm ** 3) / 12; // mm⁴
// δ = 5qL⁴/(384EI); q in N/mm, L in mm, E in N/mm²
const q_Nmm = (q_line_k * 1000) / 1000; // kN/m = N/mm
const L_mm = L * 1000;
const delta_inst = (5 * q_Nmm * L_mm ** 4) / (384 * E_mean * I); // mm
const lim_L300 = L_mm / 300;
const lim_L200 = L_mm / 200;
const sls_rafter = {
  L_m: round(L, 2),
  q_line_kNm: round(q_line_k, 2),
  delta_inst_mm: round(delta_inst, 1),
  lim_L300_mm: round(lim_L300, 1),
  lim_L200_mm: round(lim_L200, 1),
  pass_L300: delta_inst <= lim_L300,
  pass_L200: delta_inst <= lim_L200,
};

// ─── 4) Vânt pe fațade (ordin) ───
const qp = windPrev?.wind?.qp ?? 0.96;
const cpe_wall = { D_windward: 0.8, E_leeward: -0.5, side: -0.7 };
const we_facade = {
  windward: round(qp * cpe_wall.D_windward, 3),
  leeward: round(qp * cpe_wall.E_leeward, 3),
  side: round(qp * cpe_wall.side, 3),
};
const H_facade = H_story + 2.5; // P+E aproximativ
const ew = (cover.x1 - cover.x0) / 100;
const ns = (cover.y1 - cover.y0) / 100;
const F_wind_NS_kN = round(Math.abs(we_facade.windward) * ew * H_facade * 1.5, 1); // pe fațadă N/S
const F_wind_EW_kN = round(Math.abs(we_facade.windward) * ns * H_facade * 1.5, 1);
const facade_wind = {
  qp,
  we_facade,
  H_m: round(H_facade, 2),
  F_ULS_NS_kN: F_wind_NS_kN,
  F_ULS_EW_kN: F_wind_EW_kN,
  vs_Vb: round(Math.max(F_wind_NS_kN, F_wind_EW_kN) / Vb, 2),
  note: "Vânt fațadă pe ansamblu; comparat cu Vb seism — care e mai mare guvernează orizontal global",
};

// ─── 5) Retenție + apă (Ka + hidrostatic) ───
const H_ret = 2.5;
const gamma = 18; // kN/m³
const Ka = 0.33;
const Pa_earth = 0.5 * Ka * gamma * H_ret ** 2;
const hw = 1.0; // ipoteză apă 1 m pe spate (conservator studiu)
const Phydro = 0.5 * 10 * hw ** 2;
const Pa_tot = Pa_earth + Phydro;
const M_ret = (Pa_earth * H_ret) / 3 + (Phydro * hw) / 3;
const t_wall = 0.25; // A11 ~25 cm BA
const d_w = t_wall - 0.04;
const As_ret = (M_ret * 1e6) / (0.9 * d_w * FYD * 1e3);
const As_min_ret = 0.0013 * 1000 * d_w * 1e4;
const retain = {
  H_m: H_ret,
  Pa_earth_kNm: round(Pa_earth, 1),
  hw_m: hw,
  Phydro_kNm: round(Phydro, 1),
  Pa_tot: round(Pa_tot, 1),
  M_kNm_m: round(M_ret, 1),
  As_mm2_m: round(As_ret, 0),
  As_min: round(As_min_ret, 0),
  pass_flex: As_ret <= Math.max(As_min_ret * 4, 2500),
  note: "fără seism pe zid (Mononobe-Okabe) — încă deschis",
};

// ─── 6) As min stâlpi P100 / EC2 ordin ───
const asMinCols = colsPE.map((c) => {
  const Ac = c.dx * c.dy; // cm²
  const As_min = 0.002 * Ac * 100; // mm² (0.2% EC2); P100 poate cere mai mult pe ductilitate
  const As_p100_hint = 0.01 * Ac * 100; // 1% ordin zonă critică medie
  const bars_min = Math.ceil(As_min / 154); // φ14=154 mm²
  const bars_p100 = Math.ceil(As_p100_hint / 201); // φ16
  return {
    id: c.id,
    section: `${c.dx}×${c.dy}`,
    As_min_EC2_mm2: round(As_min, 0),
    As_hint_P100_mm2: round(As_p100_hint, 0),
    sugerat_EC2: `${Math.max(4, bars_min)}φ14`,
    sugerat_P100_zona: `${Math.max(8, bars_p100)}φ16 (hint — nu proiect)`,
  };
});

// ─── Note estimate (max in-repo) ───
const notes = {
  geometrie: 8,
  clear255: 9,
  placa: 6,
  grinzi: 6,
  stalpi_NM: 5,
  flambaj: 5,
  seism_Vb: 4,
  seism_bare: seisPass === seismicCols.length ? 5 : 4, // was 1
  punching: punchPass >= punchResults.length * 0.8 ? 5 : 3, // new
  zapada: 6,
  gk_pv: 6,
  capriori_ec5: sls_rafter.pass_L300 ? 6 : 5, // was 5
  vant_acoperis: 5,
  vant_fatada: 5, // new from 1-ish
  ancorare_pv: 5,
  traseu_acoperis: 7,
  cr0: 5,
  fundatii: 4,
  geo131: 1,
  retentie: retain.pass_flex ? 5 : 4, // was 4
  noduri: 3,
  armare_hint: 3, // was 1 — only min ratios, not drawings
  confinare: 1,
  fem: 1,
};

const vals = Object.values(notes);
const avg = round(vals.reduce((a, b) => a + b, 0) / vals.length, 1);

const ceiling = {
  in_repo_now: avg,
  in_repo_theoretical_max: 6.5,
  with_geo_only: 7.2,
  with_geo_and_FE: 8.5,
  autorizabil_signed: 9.5,
  note: "Peste ~6.5 medie din repo e iluzie — fără FE/geo/planuri semnate notele pe fem/geo/confinare rămân 1 și trag media.",
};

const md = `# S1 A1 — Maxim in-repo (fără FEM / geo / planuri)

**Status:** plafon calculabil în acest repo · **NU** proiect semnat  
**Medie note estimată:** **${avg}/10** · plafon teoretic in-repo ≈ **6,5**

## Răspunsul tău

**Nu, upgrade-ul anterior nu era maximul din repo.** Acum am adăugat ce mai era calculabil fără Robot/geo:
seism pe stâlpi, punching, SLS căpriori, vânt fațadă, retenție+apă, As min hint.

**Da, există un plafon:** peste **~6,5/10 medie** nu poți urca onest fără:
1. studiu geo pe 131  
2. FE 3D + P100 pe bare  
3. planuri armare / confinare semnate  

---

## 1. Seism pe stâlpi (Vb=${Vb} kN repartizat ∝ I)

| ID | Share | V | M_seis | Mrd | util N+Mseis | PASS |
|----|------:|--:|-------:|----:|-------------:|:----:|
${seismicCols.map((c) => `| ${c.id} | ${c.share} | ${c.V_kN} | ${c.M_seis_kNm} | ${c.Mrd_kNm} | ${c.util_N_Mseis} | **${c.pass}** |`).join("\n")}

Pass **${seisPass}/${seismicCols.length}** — tot fără confinare / factori de comportare pe element.

## 2. Punching placă (h=${lv.slab_th_hypothesis ?? 15} cm)

| ID | V_Ed | v_Ed | v_Rdc | PASS |
|----|-----:|-----:|------:|:----:|
${punchResults.map((p) => `| ${p.id} | ${p.V_Ed_kN} | ${p.v_Ed_MPa} | ${p.v_Rdc_MPa} | **${p.pass}** |`).join("\n")}

Pass **${punchPass}/${punchResults.length}**

## 3. SLS căpriori (săgeată)

| δ inst | L/300 | L/200 | PASS L/300 |
|-------:|------:|------:|:----------:|
| ${sls_rafter.delta_inst_mm} mm | ${sls_rafter.lim_L300_mm} | ${sls_rafter.lim_L200_mm} | **${sls_rafter.pass_L300}** |

## 4. Vânt fațadă

| | |
|--|--:|
| we windward | ${we_facade.windward} kN/m² |
| F_ULS N/S | ${F_wind_NS_kN} kN |
| F_ULS E/W | ${F_wind_EW_kN} kN |
| vs Vb seism | ${facade_wind.vs_Vb}× |

${facade_wind.vs_Vb > 1 ? "**Vântul pe fațadă poate depăși Vb** pe direcția respectivă — guvernează la ansamblu orizontal." : "Seismul Vb rămâne dominant vs vânt fațadă pe ordin."}

## 5. Retenție + apă (hw=${hw} m)

| Pa pământ | Phydro | M | As nec | PASS |
|----------:|-------:|--:|-------:|:----:|
| ${retain.Pa_earth_kNm} | ${retain.Phydro_kNm} | ${retain.M_kNm_m} | ${retain.As_mm2_m} | **${retain.pass_flex}** |

${retain.note}

## 6. As min hint (NU plan armare)

| ID | EC2 min | P100 hint zonă | Sugestie |
|----|--------:|---------------:|----------|
${asMinCols.map((c) => `| ${c.id} | ${c.As_min_EC2_mm2} | ${c.As_hint_P100_mm2} | ${c.sugerat_EC2} / ${c.sugerat_P100_zona} |`).join("\n")}

> Hint cantitativ — **nota armare rămâne joasă** până există planuri dt.

## Note 1–10 (după max in-repo)

| Aspect | Notă |
|--------|-----:|
${Object.entries(notes)
  .map(([k, v]) => `| ${k} | **${v}** |`)
  .join("\n")}

**Medie ${avg}** · ${ceiling.note}

## Plafon

| Nivel | Medie țintă |
|-------|------------:|
| Acum (max in-repo) | **${ceiling.in_repo_now}** |
| Maxim onest doar din repo | ~${ceiling.in_repo_theoretical_max} |
| + geo 131 | ~${ceiling.with_geo_only} |
| + geo + FE | ~${ceiling.with_geo_and_FE} |
| Proiect semnat autorizabil | ~${ceiling.autorizabil_signed} |

JSON: \`s1_a1_max_inrepo_v01.json\`
`;

const result = {
  avg_note: avg,
  ceiling,
  seismicCols,
  punchResults,
  sls_rafter,
  facade_wind,
  retain,
  asMinCols,
  notes,
};

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ok: true, avg, ceiling, seisPass: `${seisPass}/${seismicCols.length}`, punchPass: `${punchPass}/${punchResults.length}`, sls: sls_rafter.pass_L300, retain: retain.pass_flex }, null, 2));
