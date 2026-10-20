/**
 * Audit: placă 25 / 35 cm — mai e nevoie de C_SW_TERASA?
 * Ce alte elemente ar putea dispărea?
 * NU modifică a1_architecture. NU e FE / proiect semnat.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const st = a1.structure_a1_study_cm;
const lv = st.levels_cm || {};
const cols = Object.fromEntries(st.columns.map((c) => [c.id, c]));

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const FCK = 25,
  FYD = 500 / 1.15,
  FCD = 25 / 1.5,
  Ecm = 31e3,
  GAMMA = 25;

const Gk_fin = 1.2;
const Qk_t = 4.0;
const qEd = (hCm) => 1.35 * ((hCm / 100) * GAMMA + Gk_fin) + 1.5 * Qk_t;
const qQp = (hCm) => (hCm / 100) * GAMMA + Gk_fin + 0.3 * Qk_t;

const C_W = cols.C_W_DORM;
const C_SIW = cols.C_S_INTRARE_W;
const C_SW = cols.C_SW_TERASA;
const terasa = (a1.rooms_cm || []).find((z) => z.id === "terasa_p") || { x: 8, y: 674, dx: 336.4, dy: 293 };

const L_s = (terasa.y + terasa.dy - (C_W.y + C_W.dy)) / 100; // consolă sud ~2.92
const L_w = (C_SIW.x - terasa.x) / 100; // consolă vest ~3.05
const L_beam_W = (C_SW.y - (C_W.y + C_W.dy)) / 100; // 1.436 clear B_W
const L_beam_S = (C_SIW.x - (C_SW.x + C_SW.dx)) / 100; // 2.725 clear B_S

function slabCant(L, hCm, label) {
  const h = hCm / 100;
  const d = h - 0.025;
  const q = qEd(hCm);
  const qp = qQp(hCm);
  const M = (q * L * L) / 2;
  const V = q * L;
  const As = (M * 1e6) / (0.9 * (d * 1000) * FYD);
  const mu = M / (1 * d * d * FCD * 1000);
  const I = (1 * d ** 3) / 12;
  const E = Ecm * 1000;
  const delta = ((qp * L ** 4) / (8 * E * I)) * 1000 * 2.5;
  const lim180 = (L * 1000) / 180;
  const Ld = L / d;
  const flex_ok = mu < 0.25;
  const sls_ok = delta <= lim180;
  const Ld_ok = Ld <= 10;
  // forfecare placă: Vrd,c pe 1 m
  const rho = Math.min(0.02, Math.max(As / 1e6 / d, 0.002));
  const k = Math.min(2, 1 + Math.sqrt(200 / (d * 1000)));
  const Vrdc = (0.12 * k * Math.pow(100 * rho * FCK, 1 / 3) * 1000 * (d * 1000)) / 1000;
  const shear_ok = V <= Vrdc * 1.15;
  return {
    label,
    L_m: round(L, 3),
    h_cm: hCm,
    q_Ed: round(q, 2),
    M_kNm_m: round(M, 1),
    V_kN_m: round(V, 1),
    As_mm2_m: round(As, 0),
    mu: round(mu, 3),
    L_over_d: round(Ld, 1),
    delta_cr_mm: round(delta, 1),
    lim180_mm: round(lim180, 1),
    flex_ok,
    sls_ok,
    Ld_ok,
    shear_ok,
    pass: flex_ok && sls_ok && Ld_ok && shear_ok,
  };
}

function beamCant(L, q_line, bCm, hCm, label) {
  const b = bCm / 100,
    h = hCm / 100,
    d = h - 0.05;
  const M = (q_line * L * L) / 2;
  const V = q_line * L;
  const As = (M * 1e6) / (0.9 * (d * 1000) * FYD);
  const mu = M / (b * d * d * FCD * 1000);
  const I = (b * d ** 3) / 12;
  const E = Ecm * 1000;
  const qp = q_line / 1.4;
  const delta = ((qp * L ** 4) / (8 * E * I)) * 1000 * 2.5;
  const lim = (L * 1000) / 180;
  const Asw = 2 * Math.PI * 16;
  const Vrds = (Asw / 150) * FYD * 0.9 * d;
  const rho = Math.min(0.02, As / 1e6 / (b * d));
  const k = Math.min(2, 1 + Math.sqrt(200 / (d * 1000)));
  const Vrdc = (0.12 * k * Math.pow(100 * rho * FCK, 1 / 3) * (b * 1000) * (d * 1000)) / 1000;
  const shear_ok = V <= Math.max(Vrdc * 1.15, Vrds);
  return {
    label,
    L_m: round(L, 3),
    section: `${bCm}×${hCm}`,
    M_kNm: round(M, 1),
    V_kN: round(V, 1),
    As_mm2: round(As, 0),
    mu: round(mu, 3),
    delta_cr_mm: round(delta, 1),
    lim_mm: round(lim, 1),
    pass: mu < 0.25 && shear_ok && delta <= lim,
  };
}

function panelSS(L, hCm, label) {
  const h = hCm / 100,
    d = h - 0.025;
  const q = qEd(hCm),
    qp = qQp(hCm);
  const M = (q * L * L) / 8;
  const As = (M * 1e6) / (0.9 * (d * 1000) * FYD);
  const mu = M / (1 * d * d * FCD * 1000);
  const I = (1 * d ** 3) / 12;
  const delta = ((5 * qp * L ** 4) / (384 * Ecm * 1000 * I)) * 1000 * 2.5;
  const lim = (L * 1000) / 250;
  return {
    label,
    L_m: round(L, 3),
    h_cm: hCm,
    M_kNm_m: round(M, 2),
    L_over_d: round(L / d, 1),
    delta_cr_mm: round(delta, 1),
    lim_mm: round(lim, 1),
    pass: mu < 0.25 && delta <= lim && L / d <= 35,
  };
}

// ——— Scenarii terasă
const heights = [15, 20, 25, 30, 35];
const pureS = Object.fromEntries(heights.map((h) => [h, slabCant(L_s, h, `consolă sud L=${round(L_s, 2)}`)]));
const pureW = Object.fromEntries(heights.map((h) => [h, slabCant(L_w, h, `consolă vest L=${round(L_w, 2)}`)]));

// Cu L-grinzi 30×40 + placă pe panou scurt (fără C_SW)
const trib = 1.6;
const qLine = (h) => trib * qEd(h) + 1.35 * 1.5 + 1.35 * 2.5; // parapet+acoperiș
const withBeamsNoCol = {};
for (const h of [15, 25, 35]) {
  withBeamsNoCol[h] = {
    B_W: beamCant(L_beam_W, qLine(h), 30, 40, "B_W cant"),
    B_S: beamCant(L_beam_S, qLine(h), 30, 40, "B_S cant"),
    panel: panelSS(Math.min(L_beam_W, L_beam_S, 1.7), h, "panou între grinzi"),
  };
}

// Placă groasă + doar B_Y645 + C_S_INTRARE_W ca reazeme (fără B_W/B_S/C_SW) — consolă 2D
const L_from_Y645 = (terasa.y + terasa.dy - 645.2 - 30) / 100; // de la sud grindă dorm
const fromY645 = Object.fromEntries(
  [25, 35].map((h) => [h, slabCant(Math.max(L_from_Y645, L_s), h, "consolă din B_Y645")])
);

// ——— Clear / FF impact
const clearBeam = lv.clear_under_beam_cm ?? 255;
const clearSlab = lv.clear_under_slab_cm ?? 280;
const slab0 = lv.slab_th_hypothesis ?? 15;
const ffToFf = lv.ff_to_ff_cm ?? 307;
const clearImpact = [25, 35].map((h) => {
  const dH = h - slab0;
  return {
    h_cm: h,
    delta_vs_15: dH,
    if_keep_FF: {
      clear_under_slab: clearSlab - dH,
      clear_under_beam_if_beam_grows: clearBeam - dH,
      note: "dacă cobori sofitul plăcii cu +Δh",
    },
    if_keep_clear_255: {
      ff_to_ff_new: ffToFf + dH,
      building_taller_cm: dH,
      note: "ridici etajul / total H",
    },
  };
});

// ——— Elemente „care încurcă” — verdict pe scenariu
const elements = [
  {
    id: "C_SW_TERASA",
    role: "colț terasă + acoperiș",
    enerva: "vizual colț; fundație fără S",
    at15_with_beams: "util dacă vrei grinzi ușoare",
    at25_pure_slab: pureS[25].pass && pureW[25].pass ? "POATE DISPARE" : "încă necesar SAU grinzi L",
    at35_pure_slab: pureS[35].pass && pureW[35].pass ? "POATE DISPARE (placă consolă)" : "margine — verifică L/d",
    at25_with_Lbeams: withBeamsNoCol[25].B_S.pass ? "POATE DISPARE (+ FE acoperiș)" : "ține sau mărește grindă",
    keep_if: "acoperiș pe colț fără alt reazem; zid vest pe stâlp (A1.212)",
  },
  {
    id: "B_W_TERASA / B_S_TERASA",
    role: "contur terasă",
    enerva: "drop sub sofit / vizual",
    at35_pure_slab: "pot DISPARE dacă placă 35 consolă + FE (sau rămân ca bordură mică)",
    at25_with_Lbeams: "RĂMÂN ca L (consolă) — esențiale fără stâlp @25",
    keep_if: "placă 15–25 fără stâlp",
  },
  {
    id: "C_S_INTRARE_W",
    role: "intrare / ax mid sud",
    enerva: "în circulație terasă/intrare",
    at35_pure_slab: "NU dispare ușor — B_X_MID + B_Y820 + acoperiș/intrare",
    keep_if: "cadru principal sud",
  },
  {
    id: "C_S_DORM_E",
    role: "colț dorm/terasă E",
    enerva: "lângă ușă terasă",
    at35_pure_slab: "NU — B_Y645 + B_X_MID",
    keep_if: "cutie încălzită",
  },
  {
    id: "C_W_DORM",
    role: "colț V dorm",
    enerva: "pe fațadă V",
    at35_pure_slab: "NU — B_W + B_Y645; reazem nord consolă terasă",
    keep_if: "întotdeauna pe cutie",
  },
  {
    id: "B_X_MID",
    role: "axă mid N–S",
    enerva: "poate trece peste living/buc",
    at25_house: "cu placă 25 pe casă, span ~3–3,5 m încă vrea axă sau grinzi; NU dispare doar din terasă",
    at35_house: "posibil span mai mare — FE; tot nu e legat de C_SW",
    keep_if: "cutie 5×8 m",
  },
  {
    id: "B_E_S lamă S2 15",
    role: "fațadă Dragalina scară",
    enerva: "clear scară (deja rezolvat ca lamă)",
    verdict: "NU dispare — lock look A1.210; nu e stâlp în clear",
  },
  {
    id: "C_CASA_SCARA",
    role: "separator A6",
    enerva: "lângă ușă etaj",
    verdict: "NU dispare — scară + A6",
  },
  {
    id: "B_Y_EDGE_INVERTED",
    role: "întoarsă beci",
    enerva: "sub palier",
    verdict: "NU dispare din placă terasă — alt sistem",
  },
  {
    id: "C_E_LAMELE",
    role: "pier ARH",
    enerva: "era în clear",
    verdict: "DEJA SCOAS din cadru (A1.210 S2)",
  },
];

const verdict = {
  slab25_pure: {
    south: pureS[25].pass,
    west: pureW[25].pass,
    text: !(pureS[25].pass && pureW[25].pass)
      ? "Placă 25 consolă pură pe ~2,9–3,0 m: FAIL (L/d și/sau δ). Stâlpul SAU grinzi L rămân necesare."
      : "Placă 25 consolă: PASS pe ordin — C_SW poate ieși cu FE.",
  },
  slab35_pure: {
    south: pureS[35].pass,
    west: pureW[35].pass,
    text:
      pureS[35].pass && pureW[35].pass
        ? "Placă 35 consolă pură: PASS pe ordin pe ambele direcții — C_SW + eventual B_W/B_S pot ieși (FE acoperiș + nod)."
        : "Placă 35: încă FAIL pe cel puțin o direcție — vezi tabel.",
  },
  slab25_Lbeams: {
    pass: withBeamsNoCol[25].B_W.pass && withBeamsNoCol[25].B_S.pass && withBeamsNoCol[25].panel.pass,
    text: "Placă 25 + L-grinzi 30×40 fără C_SW: pe ordin ca la studiu anterior (etrieri pe B_S) — stâlpul poate ieși; grinzile rămân.",
  },
  clear_conflict: "Placă +10/+20 cm lovește clear 255 sau ridică FF→FF — HARD lock A1.180. Fără debate pe clear, 35 pe toată casa e scumpă.",
  recommendation:
    "Dacă obiectivul e DOAR fără C_SW: (A) păstrează placă 15 + stâlp (A1.212) SAU (B) placă 15 + L-grinzi fără stâlp + FE acoperiș SAU (C) placă locală terasă 25–30 cu grinzi + FE — nu neapărat 35 global. 35 consolă pură = tehnic pe ordin, conflict clear/cost. Alte stâlpi de cadru (intrare, dorm, mid, casa scară, lamă S2) NU dispar din cauza plăcii terasă.",
};

const result = {
  meta: {
    id: "s1_a1_slab25_35_audit_v01",
    generated: new Date().toISOString(),
    status: "audit_ordin — NU proiect semnat",
  },
  geometry: { L_s, L_w, L_beam_W, L_beam_S },
  loads_note: "q_Ed crește cu h (greutate proprie placă)",
  pure_cantilever: { south: pureS, west: pureW },
  with_L_beams_no_C_SW: withBeamsNoCol,
  from_Y645: fromY645,
  clear_impact: clearImpact,
  elements,
  verdict,
};

const md = `# Audit placă 25 / 35 cm vs stâlp colț terasă

**Status:** ${result.meta.status}  
**Generat:** ${result.meta.generated.slice(0, 19)}

> Consolă ~**${round(L_s, 2)} m** sud / **${round(L_w, 2)} m** vest. Criterii: μ&lt;0.25, δ≤L/180, L/d≤10, forfecare.

---

## VERDICT

| Întrebare | Răspuns |
|-----------|---------|
| **Placă 25 — mai e nevoie de C_SW?** | ${verdict.slab25_pure.text} |
| **Placă 35 — mai e nevoie de C_SW?** | ${verdict.slab35_pure.text} |
| **25 + L-grinzi fără stâlp** | ${verdict.slab25_Lbeams.text} |
| **Clear 255** | ${verdict.clear_conflict} |
| **Alte elemente care dispar?** | Vezi §4 — majoritatea **NU** (doar C_SW ± grinzi contur terasă). |
| **Recomandare** | ${verdict.recommendation} |

---

## 1. Consolă pură (fără stâlp, fără grinzi contur)

### Sud L=${round(L_s, 3)} m
| h | q_Ed | M | L/d | δ/lim180 | pass |
|---|------|---|-----|----------|------|
${heights.map((h) => {
  const r = pureS[h];
  return `| ${h} | ${r.q_Ed} | ${r.M_kNm_m} | ${r.L_over_d} | ${r.delta_cr_mm}/${r.lim180_mm} | **${r.pass ? "PASS" : "FAIL"}** |`;
}).join("\n")}

### Vest L=${round(L_w, 3)} m
| h | q_Ed | M | L/d | δ/lim180 | pass |
|---|------|---|-----|----------|------|
${heights.map((h) => {
  const r = pureW[h];
  return `| ${h} | ${r.q_Ed} | ${r.M_kNm_m} | ${r.L_over_d} | ${r.delta_cr_mm}/${r.lim180_mm} | **${r.pass ? "PASS" : "FAIL"}** |`;
}).join("\n")}

---

## 2. Fără C_SW dar cu L-grinzi 30×40 + placă pe panou

| h placă | B_W cant | B_S cant | panou | |
|---------|----------|----------|-------|--|
${[15, 25, 35]
  .map((h) => {
    const x = withBeamsNoCol[h];
    return `| ${h} | ${x.B_W.pass ? "PASS" : "FAIL"} M=${x.B_W.M_kNm} | ${x.B_S.pass ? "PASS" : "FAIL"} M=${x.B_S.M_kNm} | ${x.panel.pass ? "PASS" : "FAIL"} |`;
  })
  .join("\n")}

---

## 3. Impact clear / FF (lock A1.180)

| h | Δ vs 15 | clear sub placă dacă cobori sofit | FF→FF dacă păstrezi clear |
|---|---------|-----------------------------------|---------------------------|
${clearImpact
  .map(
    (c) =>
      `| ${c.h_cm} | +${c.delta_vs_15} | ${c.if_keep_FF.clear_under_slab} cm | ${c.if_keep_clear_255.ff_to_ff_new} cm (+${c.delta_vs_15} H) |`
  )
  .join("\n")}

---

## 4. Elemente care „încurcă” — ce poate dispărea?

| Element | Enervează | @ placă 25 | @ placă 35 | Păstrează dacă |
|---------|-----------|------------|------------|----------------|
${elements
  .map((e) => {
    const a25 = e.at25_pure_slab || e.at25_with_Lbeams || e.at25_house || e.verdict || "—";
    const a35 = e.at35_pure_slab || e.at35_house || e.verdict || "—";
    return `| ${e.id} | ${e.enerva || e.role} | ${a25} | ${a35} | ${e.keep_if || "—"} |`;
  })
  .join("\n")}

---

## 5. Pachet debate

1. **Nu schimba acum** clear 255 / A1.212 stâlp+zid fără decizie explicită.
2. Dacă vrei **fără C_SW**: alege (B) L-grinzi + placă 15–25 local terasă + FE acoperiș — nu forța 35 pe toată casa.
3. **Nu scoate** C_S_INTRARE_*, C_W_DORM, C_S_DORM_E, C_CASA_SCARA, B_X_MID, lamă S2 doar pentru „placă mai groasă pe terasă”.
4. FE obligatoriu pe consolă / nod acoperiș înainte de buildable.

*Script: \`src/calc_a1_slab25_35_audit_v01.mjs\`*
`;

fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_slab25_35_audit_v01.md"), md);
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_slab25_35_audit_v01.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ok: true, verdict: result.verdict, pure25: { s: pureS[25].pass, w: pureW[25].pass }, pure35: { s: pureS[35].pass, w: pureW[35].pass } }, null, 2));
