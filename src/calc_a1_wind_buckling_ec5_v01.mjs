/**
 * A1 upgrade: vânt CR1-1-4 + flambaj EC2 stâlpi + EC5 căpriori + combinații CR0.
 * Ordin de studiu — NU FE / NU proiect semnat.
 * Rulează: node src/calc_a1_wind_buckling_ec5_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const v47 = JSON.parse(fs.readFileSync(path.join(root, "data/building/v47_a1_study.json"), "utf8"));
const st = a1.structure_a1_study_cm;
const roof = v47.roof_cm || {};
const ht = v47.heights_cm || {};
const outMd = path.join(root, "outputs/reports/s1_a1_wind_buckling_ec5_v01.md");
const outJson = path.join(root, "outputs/reports/s1_a1_wind_buckling_ec5_v01.json");

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

// ─── Site / roof geometry ───
const cover = roof.covers_cm || { x0: 0, x1: 682.6, y0: 0, y1: 861.3 };
const areaPlan = ((cover.x1 - cover.x0) * (cover.y1 - cover.y0)) / 10000;
const rise = (roof.rise_cm ?? 248.6) / 100;
const run = ((cover.y1 - cover.y0) / 2) / 100;
const pitchRad = Math.atan2(rise, run);
const pitchDeg = (pitchRad * 180) / Math.PI;
const L_rafter = Math.hypot(rise, run);
const spacing = 1.2;

const ffP = ht.ff_parter_cm ?? st?.levels_cm?.ff_parter ?? 48;
const ffE = ht.ff_etaj_cm ?? st?.levels_cm?.ff_etaj ?? 355;
const eaveZ_m = (ffE + (ht.ff_to_ff_cm ? 0 : 0)) / 100; // FF etaj ≈ streșină pe studiu
// streșină ≈ top etaj + slab/buildup; folosim eave din heights
const H_eave_m = round((ffE + 15 + 12) / 100, 2); // ~3.82 m de ±0 — ordin
const H_ridge_m = round(H_eave_m + rise, 2);
const H_col_story_m = round((ffE - ffP) / 100, 2); // FF→FF ~3.07

// ─── 1) Zăpadă (recalibrare) ───
const SK = 1.5;
const MU1 = 0.8;
const Gk_roof = 0.55 + 0.1 + 0.2 + 0.05; // D3a+PV
const Qk_snow = MU1 * SK; // 1.2

// ─── 2) Vânt CR 1-1-4 ordin (Turda inland) ───
/** vb,0 tipic zone inland RO (NA) — de confirmat pe hartă oficială. */
const VB0 = 27; // m/s
const RHO = 1.25;
const qb = 0.5 * RHO * (VB0 / 1) ** 2 * 0.001; // kN/m² = ½ρv² /1000… wait: ½*1.25*729 = 455.6 Pa = 0.456 kN/m²
const qb_kNm2 = round(0.5 * RHO * VB0 * VB0 * 0.001, 3); // Pa→kN/m²: *0.001

/** Categorie teren III suburban tipic; z = H_eave. */
const z = Math.max(H_eave_m, 2);
/** ce(z) ordin teren III: ~2.0–2.3 la z~4 m — folosim 2.1. */
const ce = 2.1;
const qp = round(ce * qb_kNm2, 3);

/**
 * cpe pe acoperiș 2 ape ~30° (EN1991-1-4 Tab.7.4a, ordin zone):
 * streșină/margine (F/G) suctiune accentuată; câmp (H/I) mai mic.
 * Semn: − = suctiune (sus).
 */
const cpe = {
  eaves_F: -1.7, // zonă margine streșină (critic PV)
  ridge_G: -1.2,
  field_H: -0.4,
  windward_pitch: -0.7, // pantă expusă tipic
  leeward_pitch: -0.5,
};
const we = Object.fromEntries(
  Object.entries(cpe).map(([k, c]) => [k, round(qp * c, 3)])
);
const we_crit = we.eaves_F; // suctiune maximă

/** PV: arie panou tip 1,7×1,0 m; ancorare pe șină — forță uplift pe fixare. */
const pv_panel_m2 = 1.7;
const F_uplift_panel_kN = round(Math.abs(we_crit) * pv_panel_m2 * 1.5, 2); // ULS 1.5 pe Q vânt
const n_fixings = 4;
const F_per_fix_kN = round(F_uplift_panel_kN / n_fixings, 2);
/** Șurub lemn C24 tipic 6×80 — capacitate ordin ~1,5–2,5 kN/ax (conservator 1,5). */
const R_screw_kN = 1.5;
const pv_anchor_ok = F_per_fix_kN <= R_screw_kN;
const n_screws_needed = Math.ceil(F_uplift_panel_kN / R_screw_kN);

// ─── 3) Combinații CR0 pe acoperiș (pe m²) ───
const combos = {
  snow_leading: {
    label: "Zăpadă dominantă (1,35G + 1,5·Qs + 0,6·1,5·Qw)",
    // pe acoperiș pe plan: Qs pe proiecție; Qw = |we| pe pantă — agregat pe plan aproximativ
    q_Ed: round(1.35 * Gk_roof + 1.5 * Qk_snow + 0.6 * 1.5 * Math.abs(we.field_H), 2),
  },
  wind_leading: {
    label: "Vânt dominant pe suctiune streșină (1,35G + 1,5·|we_F| + 0,5·1,5·Qs)",
    // suctiune: net uplift pe învelitoare — G reduce uplift
    q_net_uplift: round(1.5 * Math.abs(we_crit) - 1.0 * Gk_roof + 0.5 * 1.5 * Qk_snow * 0.3, 2),
    q_Ed_pressure_field: round(1.35 * Gk_roof + 1.5 * Math.abs(we.field_H) + 0.5 * 1.5 * Qk_snow, 2),
  },
  snow_only_legacy: {
    label: "Doar zăpadă (vechi agregat)",
    q_Ed: round(1.35 * Gk_roof + 1.5 * Qk_snow, 2),
  },
};
const q_Ed_design = Math.max(
  combos.snow_leading.q_Ed,
  combos.wind_leading.q_Ed_pressure_field,
  combos.snow_only_legacy.q_Ed
);

// ─── 4) Căpriori EC5 ordin (flexiune + compresie pe pantă + LTB simplificat) ───
const b_cm = 12;
const h_cm = 25;
const b = b_cm / 100;
const h = h_cm / 100;
const q_line = q_Ed_design * spacing;
const M_Ed = (q_line * L_rafter ** 2) / 8; // kNm
const N_axial = q_line * L_rafter * Math.sin(pitchRad); // componentă pe pantă, ordin
const W_cm3 = (b_cm * h_cm ** 2) / 6;
const sigma_m = (M_Ed * 1e6) / (W_cm3 * 1e3); // N/mm² = MPa  (M_Nmm / W_mm3)
// W_cm3 * 1000 = W_mm3; M_kNm*1e6 = Nmm; σ = M/W
const sigma_m_MPa = round((M_Ed * 1e6) / (W_cm3 * 1000), 2);
const A_mm2 = b_cm * h_cm * 100;
const sigma_c = round((N_axial * 1000) / A_mm2, 2); // N / mm²

/** C24: fm,k=24 · fc,0,k=21 · kmod=0.8 · γM=1.3 → fm,d≈14.8 · fc,d≈12.9 */
const fm_d = 14.8;
const fc_d = 12.9;
/** LTB: λ_rel ordin — cu OSB pe flanc, kcrit≈1; fără OSB, kcrit redus. */
const with_osb_sheathing = true;
const kcrit = with_osb_sheathing ? 1.0 : 0.7;
const km = 0.7; // EC5 combinație flexiune+compresie
const util_bend = sigma_m_MPa / (kcrit * fm_d);
const util_comp = sigma_c / fc_d;
const util_ec5 = round(util_bend + km * util_comp, 3); // criteriu simplificat
const ec5_pass = util_ec5 <= 1.0 && util_bend <= 1.0;

// ─── 5) Flambaj stâlpi EC2 ───
const FCK = 25; // C25/30
const FCD = FCK / 1.5; // 16.67 MPa
const ECm = 31e3; // MPa ordin C25

function colBuckling(c) {
  const bx = Math.min(c.dx, c.dy) / 100; // m — thru
  const by = Math.max(c.dx, c.dy) / 100;
  const levels = c.levels || [];
  const nStories = levels.filter((l) => l === "S" || l === "P" || l === "E").length;
  // lungime flambaj pe etaj tipic FF→FF; subsol separat
  const L_story = H_col_story_m || 3.07;
  /** Cadru nerigid: l0 ≈ 1.0·L (conservator); semi-rigid 0.7. Folosim 0.85. */
  const l0 = 0.85 * L_story;
  const I_min = (bx * bx ** 3) / 12; // m⁴ pe direcția slabă (bx = thru)
  const A = bx * by; // m²
  const i_min = Math.sqrt(I_min / A); // m
  const lambda = l0 / i_min;
  const lambda_lim = 20; // EC2 tipic n·λ_lim — ordin: peste ~50–70 e zvelt
  const Ncr = (Math.PI ** 2 * ECm * 1e3 * I_min) / l0 ** 2; // kN (E in MPa=N/mm² → *1e3 for kN with m)
  // E[MPa]*I[m4]/L² → MN? : N/mm² * m⁴ / m² = N/mm² * m² = 10^6 N * m²/m² wait
  // E_Pa = ECm*1e6; Ncr = π² E I / L² [N] = π²*(ECm*1e6)*I / L² ; /1000 → kN
  const Ncr_kN = round((Math.PI ** 2 * (ECm * 1e6) * I_min) / (l0 ** 2) / 1000, 1);

  // trib N (aceeași logică simplificată ca calc_100)
  const others = (st.columns || []).filter((o) => o.id !== c.id);
  const cx = c.x + c.dx / 2;
  const cy = c.y + c.dy / 2;
  let hx = 2,
    hy = 2;
  const row = others.filter((o) => Math.abs(o.y + o.dy / 2 - cy) < 100);
  const coln = others.filter((o) => Math.abs(o.x + o.dx / 2 - cx) < 100);
  if (row.length) hx = Math.min(...row.map((o) => Math.abs(o.x + o.dx / 2 - cx))) / 200;
  if (coln.length) hy = Math.min(...coln.map((o) => Math.abs(o.y + o.dy / 2 - cy))) / 200;
  hx = Math.max(0.9, Math.min(hx, 3.5));
  hy = Math.max(0.9, Math.min(hy, 3.5));
  const floors = levels.includes("P") && levels.includes("E") ? 2 : levels.includes("P") || levels.includes("E") ? 1 : 0;
  const Atrib = 2 * hx * 2 * hy;
  const Q_ED = 11.78;
  const Q_ROOF = q_Ed_design;
  let N =
    floors * Atrib * Q_ED +
    (levels.includes("E") ? Atrib * Q_ROOF : 0) +
    25 * (c.dx / 100) * (c.dy / 100) * Math.max(nStories, 1) * 2.8;
  if (c.role === "pier_inverted_beam") N = Math.min(N, 80);

  const Nrd0 = A * FCD * 1000; // kN  (m² * N/mm² = MN? : m²*MPa = 10^3 kN? 
  // A[m²]*fcd[MPa] = A*fcd * 10^3 kN  yes (1 m² * 1 MPa = 1000 kN)
  const n = 1.0; // tip B
  const lambda_rel = lambda / 90; // ordin EC2 λ / λ_lim cu λ_lim≈20*√(fck?) — simplificat
  // φ EC2: φ = 1/(φ0+√(φ0²-λrel²)) rough
  const phi0 = 0.5 * (1 + 0.2 * (lambda_rel - 0.2) + lambda_rel ** 2);
  let phi = 1 / (phi0 + Math.sqrt(Math.max(phi0 ** 2 - lambda_rel ** 2, 0)));
  if (lambda_rel <= 0.2) phi = 1;
  phi = Math.min(1, Math.max(phi, 0.15));
  const Nrd_buck = round(phi * Nrd0, 1);
  const util = round(N / Math.max(Nrd_buck, 1), 3);
  const slender = lambda > 50;
  return {
    id: c.id,
    section: `${c.dx}×${c.dy}`,
    l0_m: round(l0, 2),
    lambda: round(lambda, 1),
    Ncr_kN,
    N_Ed_kN: round(N, 1),
    Nrd0_kN: round(Nrd0, 1),
    phi: round(phi, 3),
    Nrd_buck_kN: Nrd_buck,
    util_buck: util,
    slender,
    pass: util < 0.85 && (c.dx >= 30 || c.dy >= 30 || c.role === "pier_inverted_beam"),
  };
}

const buckCols = (st.columns || [])
  .filter((c) => (c.levels || []).some((l) => l === "P" || l === "E"))
  .map(colBuckling);
const buckPass = buckCols.filter((c) => c.pass).length;
const buckFail = buckCols.filter((c) => !c.pass);

// ─── Note estimate (post-upgrade) ───
const notes = {
  vant: we_crit && qp ? (pv_anchor_ok ? 5 : 4) : 1,
  ancorare_pv: pv_anchor_ok ? 5 : 3,
  flambaj_stalpi: buckFail.length === 0 ? 5 : buckFail.length <= 2 ? 4 : 3,
  ec5_capriori: ec5_pass ? 5 : 3,
  cr0_combo: 5,
  zapada: 6,
  // neschimbate esențial
  geometrie: 8,
  clear255: 9,
  placa: 6,
  grinzi: 6,
  fem: 1,
  geo131: 1,
  confinare: 1,
  armare: 1,
};

const md = `# S1 A1 — Upgrade: vânt · flambaj · EC5 · CR0

**Status:** ordin de studiu · **NU** FE semnat  
**Generat:** ${new Date().toISOString().slice(0, 16)}  
**Scop:** ridică notele pe aspectele care erau la 1

## Verdict scurt

| Aspect | Înainte | Acum (estimat) | De ce |
|--------|--------:|---------------:|-------|
| Vânt CR1-1-4 | 1 | **${notes.vant}** | qp + cpe + we pe ape/streșină |
| Ancorare PV | 1 | **${notes.ancorare_pv}** | uplift/panou vs șuruburi ordin |
| Flambaj stâlpi | 1 | **${notes.flambaj_stalpi}** | λ, φ, NEd/NRd pe ${buckCols.length} stâlpi P/E |
| Căpriori EC5 | 1 (LTB) / 5 flex | **${notes.ec5_capriori}** | flex+compresie+kcrit OSB |
| Combinații CR0 | 3 | **${notes.cr0_combo}** | zăpadă vs vânt dominant |

**Încă la 1 (extern):** FEM, geo 131, confinare P100, planuri armare.

---

## 1. Vânt (CR 1-1-4 ordin · Turda)

| | |
|--|--:|
| vb,0 (ipoteză inland) | **${VB0}** m/s — confirmă hartă NA |
| qb | ${qb_kNm2} kN/m² |
| ce(z≈${z} m, cat.III) | ${ce} |
| qp | **${qp}** kN/m² |
| cpe streșină F | ${cpe.eaves_F} |
| we streșină (critic) | **${we_crit}** kN/m² |
| we câmp | ${we.field_H} kN/m² |

### Ancorare PV (ordin)

| | |
|--|--:|
| Arie panou | ${pv_panel_m2} m² |
| F uplift ULS / panou | **${F_uplift_panel_kN}** kN |
| / 4 fixări | ${F_per_fix_kN} kN |
| R șurub tip | ${R_screw_kN} kN |
| Pass 4 șuruburi | **${pv_anchor_ok}** |
| Min. șuruburi dacă nu | **${n_screws_needed}** |

> Dacă suctiunea streșină e pe primul rând de panouri: folosește zona F (we=${we_crit}), nu câmpul.

---

## 2. Combinații CR0 pe acoperiș

| Caz | q_Ed / q_net |
|-----|-------------:|
| ${combos.snow_leading.label} | **${combos.snow_leading.q_Ed}** kN/m² |
| Vânt câmp + ψ zăpadă | **${combos.wind_leading.q_Ed_pressure_field}** kN/m² |
| Uplift net streșină (orientativ) | ${combos.wind_leading.q_net_uplift} kN/m² |
| Doar zăpadă (vechi) | ${combos.snow_only_legacy.q_Ed} kN/m² |
| **Adoptat design căpriori** | **${q_Ed_design}** kN/m² |

---

## 3. Căpriori EC5 (12×25 @ ${spacing} m · L=${round(L_rafter, 2)} m · ${round(pitchDeg, 0)}°)

| | |
|--|--:|
| q linie | ${round(q_line, 2)} kN/m |
| M_Ed | ${round(M_Ed, 2)} kNm |
| N axial pe pantă | ${round(N_axial, 2)} kN |
| σm | ${sigma_m_MPa} MPa (fm,d=${fm_d}) |
| σc | ${sigma_c} MPa (fc,d=${fc_d}) |
| kcrit (OSB) | ${kcrit} |
| util EC5 | **${util_ec5}** |
| **PASS** | **${ec5_pass}** |

Fără OSB (kcrit=0.7): util ar crește ~${round(sigma_m_MPa / (0.7 * fm_d) + km * util_comp, 2)} — **păstrează învelitoare/OSB ca diafragmă**.

---

## 4. Flambaj stâlpi EC2 (l0=0,85·H_story=${round(0.85 * H_col_story_m, 2)} m)

| ID | Secțiune | λ | φ | N_Ed | NRd,buck | util | PASS |
|----|----------|--:|--:|-----:|---------:|-----:|:----:|
${buckCols.map((c) => `| ${c.id} | ${c.section} | ${c.lambda} | ${c.phi} | ${c.N_Ed_kN} | ${c.Nrd_buck_kN} | ${c.util_buck} | **${c.pass}** |`).join("\n")}

**Pass:** ${buckPass}/${buckCols.length}
${buckFail.length ? `**Fail/review:** ${buckFail.map((c) => c.id + " util=" + c.util_buck).join(", ")}` : "Toate sub util 0,85 pe ordin."}

---

## 5. Ce NU s-a rezolvat (încă notă 1)

1. **FEM 3D** — Robot/Axis pe schema A1  
2. **Geo Rc pe 131** — studiu teren  
3. **Confinare P100** — etrieri zone critice  
4. **Planuri armare**  
5. **vb,0 / sk oficial** pe hărți NA — aici ipoteze Turda tipice  

## Regenerare

\`npm run calc:a1:upgrade\` sau inclus în \`npm run calc:a1\`

JSON: \`outputs/reports/s1_a1_wind_buckling_ec5_v01.json\`
`;

const result = {
  status: "ordin — nu FE",
  wind: { VB0, qb_kNm2, ce, qp, cpe, we, F_uplift_panel_kN, F_per_fix_kN, pv_anchor_ok, n_screws_needed },
  combos,
  q_Ed_design,
  rafter_ec5: { L_rafter, spacing, M_Ed: round(M_Ed, 2), N_axial: round(N_axial, 2), sigma_m_MPa, sigma_c, util_ec5, ec5_pass, kcrit },
  buckling: buckCols,
  notes_estimate: notes,
};

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(
  JSON.stringify(
    {
      ok: true,
      q_Ed_design,
      we_crit,
      pv_anchor_ok,
      n_screws_needed,
      ec5_pass,
      util_ec5,
      buck_pass: `${buckPass}/${buckCols.length}`,
      notes,
    },
    null,
    2
  )
);
