/**
 * 2.6 fundații + 2.7 acoperiș — ordin (nu proiect semnat).
 * Rulează: node src/calc_v47_frame_foundations_roof_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const colsJson = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/v47_a1_frame_calc_2_1_columns_v01.json"), "utf8")
);
const outMd = path.join(root, "outputs/reports/v47_a1_frame_calc_2_6_2_7_foundations_roof_v01.md");
const outJson = path.join(root, "outputs/reports/v47_a1_frame_calc_2_6_2_7_foundations_roof_v01.json");

const PCONV_REF = 310; // kPa vecinătate — NU Rc 131
const P_WORK = 200; // kPa țintă pe **N de serviciu** (ordin)
const PAD_OPTS = [30, 50, 60, 70, 80, 100, 120]; // cm
/** N_Ed ULS → N_ser ≈ /1.4 pentru comparație cu P_work (ordin). */
const N_ED_TO_SER = 1.4;

function round(x, d = 1) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

const pads = colsJson.columns
  .filter((c) => c.id !== "C_SHAFT_E_PIER")
  .map((c) => {
    const N_ed = c.N_Ed_roof_light_kN;
    const N = N_ed / N_ED_TO_SER;
    const rows = PAD_OPTS.map((side) => {
      const A = (side / 100) ** 2;
      const p = N / A;
      return {
        side_cm: side,
        A_m2: round(A, 3),
        p_kPa: round(p, 0),
        vs_200: p <= P_WORK ? "OK_studiu" : "peste_200",
        vs_310_ref: p <= PCONV_REF ? "sub_ref_vecin" : "peste_ref_vecin",
      };
    });
    const minOk = rows.find((r) => r.vs_200 === "OK_studiu");
    return {
      id: c.id,
      N_Ed_kN: N_ed,
      N_ser_kN: round(N, 1),
      section: c.section_cm,
      pads: rows,
      recommend_isolated_cm: minOk ? minOk.side_cm : 120,
      east_limit: /C_E_|C_NE|C_S_INTRARE_E|C_CASA/.test(c.id),
    };
  });

/** Sistem real: bandă FG + talpă locală — nu talpă izolată pură. */
const studyPad = 80;
const stripW = 60;

const stripCheck = {
  width_cm: stripW,
  note: "FG bandă 60 pe axe + pad 80 la stâlpi; p local pe pad e conservator — încărcarea se împrăștie în bandă/retenție",
  length_N_m: 6.5,
  N_share_ser_kN: round(
    pads.filter((p) => /C_N/.test(p.id)).reduce((a, p) => a + p.N_ser_kN, 0),
    0
  ),
};
stripCheck.p_avg_kPa = round(
  stripCheck.N_share_ser_kN / ((stripW / 100) * stripCheck.length_N_m),
  0
);

const raftApprox = {
  footprint_m2: 42,
  N_tot_ser_kN: round(
    pads.reduce((a, p) => a + p.N_ser_kN, 0),
    0
  ),
};
raftApprox.p_avg_kPa = round(raftApprox.N_tot_ser_kN / raftApprox.footprint_m2, 0);

// Roof 2.7
const areaRoof = 48; // m²
const roof = {
  light: {
    id: "D3a_sarpanta_usoara",
    Gk_kN_m2: 0.85,
    Qk_snow_kN_m2: 1.5,
    q_Ed: round(1.35 * 0.85 + 1.5 * 1.5, 2),
    W_kN: round(areaRoof * (1.35 * 0.85 + 1.5 * 1.5), 0),
    path: "căpriori → centuri B_N/B_E/B_W → stâlpi; stâlpișori fronton pe streșină",
    pros: "greutate mică pe stâlpi; seism mai blând",
    cons: "detaliu ancorare + excentricitate stâlpișori",
  },
  ba: {
    id: "D3b_acoperis_BA",
    Gk_kN_m2: 3.5,
    Qk_snow_kN_m2: 1.5,
    q_Ed: round(1.35 * 3.5 + 1.5 * 1.5, 2),
    W_kN: round(areaRoof * (1.35 * 3.5 + 1.5 * 1.5), 0),
    path: "placă/coamă BA → aceleași stâlpi; fără stâlpișori slabi",
    pros: "load path clar; masă/fonic",
    cons: `+${round(areaRoof * (3.5 - 0.85) * 1.35, 0)} kN pe structură vs ușoară; fundații+seism`,
  },
};
roof.delta_W_kN = roof.ba.W_kN - roof.light.W_kN;
roof.verdict =
  "Pentru FE: rulează întâi D3a (ușoară) pe schema actuală; D3b ca sensibilitate. Nu alege BA doar ca să „salveze” stâlpișorii.";

const result = {
  status: "preliminar — nu Rc 131",
  p_work_kPa: P_WORK,
  pconv_ref_kPa: PCONV_REF,
  N_ed_to_ser: N_ED_TO_SER,
  study_pad_side_cm: studyPad,
  study_strip_width_cm: stripW,
  pads,
  stripCheck,
  raftApprox,
  roof,
  model_actions: {
    adopt_pad_cm: studyPad,
    adopt_strip_cm: stripW,
    note: "excentric pe EST spre interior (hotar Dragalina); sistem bandă+pad nu talpă izolată pură",
  },
};

const padTable = pads
  .map((p) => {
    const at80 = p.pads.find((x) => x.side_cm === 80);
    const at30 = p.pads.find((x) => x.side_cm === 30);
    return `| ${p.id} | ${p.N_ser_kN} | ${at30.p_kPa} | ${at80.p_kPa} | ${p.recommend_isolated_cm} | ${p.east_limit ? "excentric int." : "centrat"} |`;
  })
  .join("\n");

const md = `# V47 A1 FRAME — Calc 2.6 fundații + 2.7 acoperiș (preliminar)

**Status:** ordin · **NU** Rc pe 131 · **NU** autorizabil  
**P_work studiu:** ${P_WORK} kPa pe N_ser≈N_Ed/${N_ED_TO_SER} · **Pconv vecin (ref):** ${PCONV_REF} kPa

## 2.6 Fundații

### A) Talpă izolată (conservator — upper bound)

| ID | N_ser (kN) | p @30 | p @80 | side izolat ≤200 | Hotar E |
|----|----------:|------:|------:|-----------------:|---------|
${padTable}

Citire: 30×30 (=secțiune stâlp) e **talpă falsă**. Izolat pur cere ~1,0–1,2 m pe cei grei — de aceea folosim **bandă + pad**.

### B) Sistem studiu: FG bandă ${stripW} + pad ${studyPad}

| | |
|--|--|
| Bandă N (ordin) | N_ser~${stripCheck.N_share_ser_kN} kN · p_med~**${stripCheck.p_avg_kPa}** kPa |
| Radier pe ~${raftApprox.footprint_m2} m² | N_tot_ser~${raftApprox.N_tot_ser_kN} · p_med~**${raftApprox.p_avg_kPa}** kPa |
| ${stripCheck.note} | |

**Adoptare model:** pad **${studyPad}×${studyPad}** · strip **${stripW}** · EST excentric interior. Variantă radier = sensibilitate geo.

> 310 kPa = doar reper vecinătate.

## 2.7 Acoperiș — același brief

| | Șarpantă ușoară (D3a) | BA (D3b) |
|--|----------------------:|---------:|
| q_Ed | ${roof.light.q_Ed} kN/m² | ${roof.ba.q_Ed} |
| W pe ~${areaRoof} m² | **${roof.light.W_kN}** kN | **${roof.ba.W_kN}** kN |
| Δ | — | **+${roof.delta_W_kN} kN** |
| Traseu | ${roof.light.path} | ${roof.ba.path} |
| + | ${roof.light.pros} | ${roof.ba.pros} |
| − | ${roof.light.cons} | ${roof.ba.cons} |

**Verdict:** ${roof.verdict}

## Acțiuni

| | |
|--|--|
| Generator / mesh | FG pad ${studyPad} + strip ${stripW} |
| Registru \`foundations_width\` | geo studiu OK; calc Rc = deschis |
| Registru \`roof_load_path\` | comparație D3a/D3b documentată; FE pe D3a întâi |

JSON: \`outputs/reports/v47_a1_frame_calc_2_6_2_7_foundations_roof_v01.json\`
`;

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(
  JSON.stringify(
    { ok: true, studyPad, stripW, deltaRoof: roof.delta_W_kN, worst30: Math.max(...pads.map((p) => p.pads[0].p_kPa)) },
    null,
    2
  )
);
