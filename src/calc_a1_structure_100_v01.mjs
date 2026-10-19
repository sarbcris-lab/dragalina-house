/**
 * S1 A1 — calcule ordin complete pe schema reală (stâlpi/grinzi/placă/întoarsă/SE).
 * Compară FĂRĂ vs CU reazem la lamele / colț SE.
 * Verdict: adoptă sau nu stâlp pe bandă scară.
 *
 * NU e proiect semnat. Metode = aceleași ca pachetul FRAME (EC2/P100 ordin).
 * Rulează: node src/calc_a1_structure_100_v01.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const st = a1.structure_a1_study_cm;
if (!st?.beams?.length) throw new Error("npm run structure:a1 întâi");

const cols = Object.fromEntries(st.columns.map((c) => [c.id, c]));
const beams = st.beams;
const box = st.structure_box_cm;
const lv = st.levels_cm || {};

const Q_ED = 11.78; // kN/m² planșeu ULS
const Q_ED_ROOF = 4.5;
const Q_ED_STAIR = 8.0; // bandă scară / circulație — ordin
const FYD = 500 / 1.15;
const FCD = 25 / 1.5;
const FCK = 25;
const Ecm = 31e6; // kN/m²
const Gk_slab = 0.15 * 25 + 1.5;
const Qk = 2.0;
const Q_qp = Gk_slab + 0.3 * Qk;

function round(x, d = 2) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

function nrdKn(dx, dy) {
  return 0.8 * (dx / 100) * (dy / 100) * FCD * 1000;
}

/** Flexiune grindă simplu rezemată: q pe ml, L [m], b×h [cm]. */
function beamFlex(id, L, q_kNm, bCm, hCm, note = "") {
  const b = bCm / 100;
  const h = hCm / 100;
  const d = Math.max(h - 0.05, 0.08);
  const M = (q_kNm * L * L) / 8;
  const V = (q_kNm * L) / 2;
  const As = (M * 1e6) / (0.9 * (d * 1000) * FYD);
  const mu = M / (b * d * d * FCD * 1000);
  const rho = Math.min(0.02, As / 1e6 / (b * d));
  const k = Math.min(2, 1 + Math.sqrt(200 / (d * 1000)));
  const Vrdc =
    (0.12 * k * Math.pow(100 * Math.max(rho, 0.002) * FCK, 1 / 3) * (b * 1000) * (d * 1000)) /
    1000;
  // Săgeată elastică nefisurată; fisurat ~2.5× (ordin conservator)
  const I = (b * d ** 3) / 12;
  const delta_uncr = ((5 * q_kNm * L ** 4) / (384 * Ecm * I)) * 1000;
  const delta_cr = delta_uncr * 2.5;
  const lim250 = (L * 1000) / 250;
  const flex_ok = mu < 0.25;
  const shear_ok = V <= Vrdc * 1.15;
  const sls_ok = delta_cr <= lim250;
  const pass = flex_ok && shear_ok && sls_ok;
  return {
    id,
    L_m: round(L, 3),
    q_kNm: round(q_kNm, 2),
    section: `${bCm}×${hCm}`,
    h_cm: hCm,
    M_kNm: round(M, 1),
    V_kN: round(V, 1),
    As_mm2: round(As, 0),
    mu: round(mu, 3),
    flex_ok,
    V_kN_vs_Vrdc: `${round(V, 1)} / ${round(Vrdc, 1)}`,
    shear_ok,
    delta_cr_mm: round(delta_cr, 1),
    lim_L250_mm: round(lim250, 1),
    sls_ok,
    pass,
    note,
  };
}

/** Cea mai mică h [cm] care trece flex+shear+SLS (pas 5). */
function minHeight(id, L, q_kNm, bCm, note = "") {
  for (let h = 30; h <= 60; h += 5) {
    const r = beamFlex(id, L, q_kNm, bCm, h, note);
    if (r.pass) return r;
  }
  return beamFlex(id, L, q_kNm, bCm, 60, note + " — FAIL chiar @60");
}

function clearSpan(b) {
  const alongX = b.dx >= b.dy;
  const ids = b.supports || [];
  const cs = ids.map((id) => cols[id]).filter(Boolean);
  if (cs.length < 2) {
    return { L_m: (alongX ? b.dx : b.dy) / 100, alongX, method: "mesh" };
  }
  if (alongX) {
    const sorted = [...cs].sort((a, c) => a.x - c.x);
    let Lmax = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      Lmax = Math.max(Lmax, sorted[i + 1].x - (sorted[i].x + sorted[i].dx));
    }
    return { L_m: Lmax / 100, alongX: true, method: "supports" };
  }
  const sorted = [...cs].sort((a, c) => a.y - c.y);
  let Lmax = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    Lmax = Math.max(Lmax, sorted[i + 1].y - (sorted[i].y + sorted[i].dy));
  }
  return { L_m: Lmax / 100, alongX: false, method: "supports" };
}

function tribWidth(b, alongX) {
  // jumătate din distanța la grinzi paralele — fallback 1.4 m scară / 1.6 m casă
  const stairish = /B_E|B_S_SE|INVERTED|CASA/.test(b.id);
  return stairish ? 1.35 : 1.6;
}

const hBeamDefault = lv.beam_h_total_including_slab_zone ?? 35;
const bBeam = 30;
const beamHeightAdopt = {}; // id → h_cm

// ——— 1) Toate grinzile pe schema actuală (fără LAMELE)
const beamResults = [];
for (const b of beams) {
  if ((b.levels || []).includes("S_inverted")) continue;
  const sp = clearSpan(b);
  let L = sp.L_m;
  // B_E_S / B_S_SE: supports nu sunt coliniare pe axa grinzii — folosește lungimea mesh pe axa lungă
  if (b.id === "B_E_S" || b.id === "B_S_SE") {
    L = (b.dx >= b.dy ? b.dx : b.dy) / 100;
  }
  if (L < 0.3) continue;
  const trib = tribWidth(b, sp.alongX);
  const qFloor = (b.levels || []).includes("P") || (b.levels || []).includes("E") ? Q_ED : Q_ED * 0.6;
  const q = trib * (/B_E|B_S_SE/.test(b.id) ? Q_ED_STAIR : qFloor);
  const bCm = Math.min(b.dx, b.dy) >= 20 ? Math.min(b.dx, b.dy) : bBeam;
  let r = beamFlex(b.id, L, q, bCm, hBeamDefault, b.note || "");
  if (!r.pass) {
    r = minHeight(b.id, L, q, bCm, (b.note || "") + " · h mărit pt SLS/ULS");
    beamHeightAdopt[b.id] = r.h_cm;
  } else {
    beamHeightAdopt[b.id] = hBeamDefault;
  }
  beamResults.push(r);
}

// ——— 2) Scenarii SE: fără stâlp / cu LAMELE 30×30 / cu C_SE colț
const ePal = cols.C_E_PAL;
const sInE = cols.C_S_INTRARE_E;
const lameleArh = (a1.columns_cm || []).find((c) => c.id === "C_E_LAMELE");

const yPalBot = ePal.y + ePal.dy;
const ySe = sInE.y;
const yLamele = lameleArh ? lameleArh.y : 748.3;
const L_full_ES = (ySe + sInE.dy - yPalBot) / 100; // ~3.99
const L_pal_lamele = (yLamele - yPalBot) / 100;
const L_lamele_se = (ySe + sInE.dy - yLamele) / 100;
const L_se_horiz = (ePal.x + ePal.dx - (sInE.x + sInE.dx)) / 100;
const tribSE = 1.35;
const qSE = tribSE * Q_ED_STAIR;

const scenarios = {
  A_fara_stalp_SE: {
    label: "Fără stâlp pe bandă scară (schema actuală)",
    beams: [
      beamFlex("B_E_S_full", L_full_ES, qSE, 30, hBeamDefault, "C_E_PAL → colț SE (fără reazem intermediar)"),
      beamFlex("B_S_SE", L_se_horiz, qSE, 30, hBeamDefault, "C_S_INTRARE_E → colț SE"),
    ],
  },
  B_cu_LAMELE_30: {
    label: "Cu C_E_LAMELE mărit la 30×30 (reazem pe fațadă E)",
    beams: [
      beamFlex("B_E_S_span1", Math.max(L_pal_lamele, 0.5), qSE, 30, hBeamDefault, "C_E_PAL → LAMELE"),
      beamFlex("B_E_S_span2", Math.max(L_lamele_se, 0.5), qSE, 30, hBeamDefault, "LAMELE → SE"),
      beamFlex("B_S_SE", L_se_horiz, qSE, 30, hBeamDefault, "C_S_INTRARE_E → colț / LAMELE"),
    ],
    column: { id: "C_E_LAMELE", dx: 30, dy: 30, note: "upgrade P100 de la 20×40 ARH" },
  },
  C_cu_C_SE_colt: {
    label: "Cu C_SE nou 30×30 la colț (x=C_E_PAL, y=C_S_INTRARE)",
    beams: [
      beamFlex("B_E_S_to_SE", L_full_ES, qSE, 30, hBeamDefault, "C_E_PAL → C_SE (still long — same L)"),
      beamFlex("B_S_SE_to_SE", L_se_horiz, qSE, 30, hBeamDefault, "C_S_INTRARE_E → C_SE"),
    ],
    // Wait: with C_SE at corner, B_E_S still has L=full vertical - that's the same length!
    // C_SE helps the CORNER joint (both beams land on column) but B_E_S span is still ~4m
    // Unless we also keep mid support... C_SE alone doesn't shorten B_E_S.
    note: "C_SE închide nodul (bun) dar NU scurtează B_E_S — tot ~4 m pe verticală",
  },
  D_LAMELE_plus_logica: {
    label: "LAMELE 30×30 ca reazem mid pe B_E_S (scurtează spanul critic)",
    beams: [
      beamFlex("B_E_S_span1", Math.max(L_pal_lamele, 0.5), qSE, 30, hBeamDefault, "span nord"),
      beamFlex("B_E_S_span2", Math.max(L_lamele_se, 0.5), qSE, 30, hBeamDefault, "span sud"),
      beamFlex("B_S_SE", Math.max(L_se_horiz, 0.5), qSE, 30, hBeamDefault, "orizontala SE"),
    ],
  },
};

// Recalc C: with C_SE, B_E_S still full length — mark; alternative E: C_SE + accept long beam if flex OK
scenarios.C_cu_C_SE_colt.beams = [
  beamFlex("B_E_S_to_C_SE", L_full_ES, qSE, 30, hBeamDefault, "verticală pe C_SE — L neschimbat vs A"),
  beamFlex("B_S_SE_to_C_SE", L_se_horiz, qSE, 30, hBeamDefault, "scurtă — OK"),
];

// ——— 3) Stâlpi 2.1 — N trib + M ordin din capăt grindă (M≈qL²/12 pe span adiacent, un singur L)
function colCheck(c) {
  const floors = (c.levels || []).includes("E") ? 2 : (c.levels || []).includes("P") ? 1 : 0;
  const cx = c.x + c.dx / 2;
  const cy = c.y + c.dy / 2;
  const others = Object.values(cols).filter((o) => o.id !== c.id && (o.levels || []).includes("P"));
  let hx = 2.0;
  let hy = 2.0;
  const row = others.filter((o) => Math.abs(o.y + o.dy / 2 - cy) < 100);
  const coln = others.filter((o) => Math.abs(o.x + o.dx / 2 - cx) < 100);
  if (row.length) hx = Math.min(...row.map((o) => Math.abs(o.x + o.dx / 2 - cx))) / 200;
  if (coln.length) hy = Math.min(...coln.map((o) => Math.abs(o.y + o.dy / 2 - cy))) / 200;
  hx = Math.max(0.9, Math.min(hx, 3.5));
  hy = Math.max(0.9, Math.min(hy, 3.5));
  const A = 2 * hx * 2 * hy;
  const N =
    floors * A * Q_ED +
    ((c.levels || []).includes("E") ? A * Q_ED_ROOF : 0) +
    25 * (c.dx / 100) * (c.dy / 100) * 9;
  const Nrd = nrdKn(c.dx, c.dy);
  // M dintr-o grindă tip pe L=2·max(hx,hy), trib=1.5 — nu dubla pe ambele axe agresiv
  const Ladj = Math.max(hx, hy) * 2;
  const Madj = (Q_ED * 1.5 * Ladj * Ladj) / 12;
  const bw = Math.min(c.dx, c.dy) / 100;
  const bh = Math.max(c.dx, c.dy) / 100;
  const Mrd = 0.35 * bw * bh * bh * FCD * 1000; // ordin capacitate (nu elastic W)
  const util = N / Nrd + Madj / Math.max(Mrd, 1);
  const p100 = Math.min(c.dx, c.dy) >= 30 || c.role === "pier_inverted_beam";
  // Pier S-only: doar N ușor
  const utilUse = c.role === "pier_inverted_beam" ? N / Nrd : util;
  return {
    id: c.id,
    section: `${c.dx}×${c.dy}`,
    trib_m2: round(A, 2),
    N_kN: round(N, 1),
    Nrd_kN: round(Nrd, 1),
    M_ordin_kNm: round(Madj, 1),
    util_NM: round(utilUse, 3),
    p100_ok: p100,
    pass: p100 && utilUse < 0.85,
    flag: !p100 ? "P100_FAIL" : utilUse >= 0.85 ? "FAIL_util" : utilUse > 0.55 ? "REVIEW" : "OK",
  };
}

const colResults = st.columns.filter((c) => (c.levels || []).some((l) => l === "P" || l === "E" || l === "S")).map(colCheck);

// ——— 4) Placă pe cutie cu B_X_MID
const Lx = (box.x1 - box.x0) / 100; // ~5.04
const Ly = (box.y1 - box.y0) / 100; // ~7.9
const L_panel = Math.min(Lx / 2, 3.2); // cu axă mid ≈ jumătate pe X
function slabCheck(L, hCm, label) {
  const h = hCm / 100;
  const d = h - 0.025;
  const M = (Q_ED * L * L) / 8;
  const L_d = L / d;
  const allow = 1.4 * 40 * 0.85; // K≈1.4 continuous
  const I = (1 * d ** 3) / 12;
  const delta = ((5 * Q_qp * L ** 4) / (384 * Ecm * I)) * 1000 * 2.5;
  const lim = (L * 1000) / 250;
  return {
    label,
    L_m: L,
    h_cm: hCm,
    L_over_d: round(L_d, 1),
    allow: round(allow, 1),
    M_kNm_m: round(M, 1),
    delta_cr_mm: round(delta, 1),
    lim_mm: round(lim, 1),
    pass: L_d <= allow && delta <= lim,
  };
}
const slab = {
  without_mid: slabCheck(Math.min(Lx, 5.0), 15, "placă 15 fără B_X_MID (L≈5)"),
  with_mid: slabCheck(L_panel, 15, "placă 15 cu B_X_MID (L≈2,5–3,2)"),
  with_mid_20: slabCheck(L_panel, 20, "placă 20 + mid (comparație)"),
};

// ——— 5) Grindă întoarsă
const inv = beams.find((b) => (b.levels || []).includes("S_inverted"));
let inverted = null;
if (inv) {
  const L = inv.dx / 100;
  const q = 1.2 * Q_ED_STAIR; // încărcare locală scară/placă pe bandă
  inverted = beamFlex(inv.id, L, q, inv.dy || 25, 25, "h=25 întoarsă; reazeme C_CASA + pier");
  inverted.h_note = "secțiune studiu 25×(span); FE local capăt";
}

// ——— 6) Seism ordin
const ag = 0.1;
const S = 1.2;
const q_duct = 3.0;
const Sd = ag * ((2.5 * S) / q_duct);
const mass = (58.8 * 2 * (Gk_slab + Qk * 0.3) + 58.8 * 1.2) / 9.81; // t ordin
const Vb = mass * 9.81 * Sd; // kN
const seismic = { ag, S, q_duct, Sd: round(Sd, 3), Vb_kN: round(Vb, 1), note: "ipoteză Turda — nu zonare oficială 131" };

// ——— 7) Fundații — pad minim pătrat pt σ≤200 kPa (studiu; geo_131 deschis)
const q_allow = 200;
const foundation = st.columns
  .filter((c) => (c.levels || []).includes("S") || (c.levels || []).includes("P"))
  .map((c) => {
    const cr = colResults.find((x) => x.id === c.id);
    const N = cr?.N_kN ?? 200;
    const sideMin = Math.ceil((Math.sqrt(N / q_allow) * 100) / 5) * 5; // cm, pas 5
    const side = Math.max(80, sideMin);
    const A = (side / 100) ** 2;
    const sigma = N / A;
    return {
      id: c.id,
      N_kN: N,
      pad_cm: side,
      pad: `${side}×${side}`,
      sigma_kPa: round(sigma, 0),
      pass_vs_200: sigma <= q_allow + 1,
      note: side > 80 ? `pad mărit din calc (era 80)` : "OK @80 vs 200 kPa studiu",
    };
  });
const foundationAdopt = Object.fromEntries(foundation.map((f) => [f.id, f.pad_cm]));

// ——— Verdict SE
function scenarioPass(sc) {
  return sc.beams.every((b) => b.pass);
}
const passA = scenarioPass(scenarios.A_fara_stalp_SE);
const passB = scenarioPass(scenarios.B_cu_LAMELE_30);
const passD = scenarioPass(scenarios.D_LAMELE_plus_logica);
const failBeamsA = scenarios.A_fara_stalp_SE.beams.filter((b) => !b.pass);

let decision;
if (passA) {
  decision = {
    code: "NO_LAMELE",
    adopt: "Păstrează C_E_LAMELE în afara cadrului (doar ARH).",
    reason: "B_E_S / B_S_SE trec pe ordin ULS+SLS fără reazem intermediar.",
  };
} else if (passD || passB) {
  decision = {
    code: "NEED_SUPPORT_SE",
    adopt: "Introdu stâlp de cadru pe bandă E scară: C_E_LAMELE → 30×30 (sau echivalent pe axa lamelelor).",
    reason: `Fără reazem: FAIL pe ${failBeamsA.map((b) => b.id + (b.flex_ok ? "" : "/flex") + (b.sls_ok ? "" : "/SLS")).join(", ")}. Cu LAMELE 30×30: spanuri OK.`,
    section: "30×30",
    place: lameleArh
      ? { x: lameleArh.x, y: lameleArh.y, note: "poziție ARH lamele — upgrade structural" }
      : { x: 638.8, y: 748.3 },
  };
} else {
  decision = {
    code: "NEED_STRONGER",
    adopt: "Mărește h grindă B_E_S sau adaugă C_SE+LAMELE; re-rulează.",
    reason: "Nici A nici B nu trec toate criteriile ordin.",
  };
}

const allBeamsPass = beamResults.every((b) => b.pass);
const colsPass = colResults.filter((c) => c.id !== "C_SHAFT_E_PIER").every((c) => c.pass);
const slabPass = slab.with_mid.pass;

const summary = {
  decision,
  gates: {
    columns_P100_NM: colsPass,
    beams_all_after_h_adopt: allBeamsPass,
    slab_with_mid: slabPass,
    SE_without_support: passA,
    SE_with_LAMELE30: passD,
    inverted: inverted ? inverted.pass : null,
    foundations_sized: foundation.every((f) => f.pass_vs_200),
  },
  beam_height_adopt_cm: beamHeightAdopt,
  foundation_pad_adopt_cm: foundationAdopt,
};

const result = {
  meta: {
    id: "s1_a1_calc_100_v01",
    generated: new Date().toISOString(),
    status: "ordin_complet_pe_schema — NU proiect semnat",
    q_Ed: Q_ED,
    beam_section_default: `${bBeam}×${hBeamDefault}`,
  },
  summary,
  scenarios,
  beams: beamResults,
  columns: colResults,
  slab,
  inverted,
  seismic,
  foundation,
  failBeamsA,
};

// ——— Scrie adoptări în a1_architecture
let applied = null;
{
  const structPath = path.join(root, "data/building/a1_architecture.json");
  const a1w = JSON.parse(fs.readFileSync(structPath, "utf8"));
  const sa = a1w.structure_a1_study_cm || st;
  sa.se_support_decision = {
    ...decision,
    calc_ref: "outputs/reports/s1_a1_calc_100_v01.md",
    decided_at: new Date().toISOString(),
  };
  sa.beam_height_adopt_cm = beamHeightAdopt;
  sa.foundation_pad_adopt_cm = foundationAdopt;
  sa.calc_100_ref = "outputs/reports/s1_a1_calc_100_v01.md";
  // Annotate beams with adopted h
  for (const b of sa.beams || []) {
    if (beamHeightAdopt[b.id]) {
      b.h_cm = beamHeightAdopt[b.id];
      if (beamHeightAdopt[b.id] > hBeamDefault) {
        b.note = (b.note || "") + ` · h=${beamHeightAdopt[b.id]} din calc SLS`;
      }
    }
  }
  if (sa.foundations_study_cm) {
    sa.foundations_study_cm.pad_by_column_cm = foundationAdopt;
    sa.foundations_study_cm.pad_side_cm = Math.max(...Object.values(foundationAdopt), 80);
    sa.foundations_study_cm.note =
      "Pad-uri pe stâlp din calc 100 vs 200 kPa studiu; geo_131 Rc încă deschis";
  }
  a1w.structure_a1_study_cm = sa;
  fs.writeFileSync(structPath, JSON.stringify(a1w, null, 2) + "\n");
  // sync alias
  fs.writeFileSync(
    path.join(root, "data/building/a1_structure_study.json"),
    JSON.stringify(sa, null, 2) + "\n"
  );
  applied =
    decision.code === "NO_LAMELE"
      ? `NO_LAMELE + h grinzi adoptate ${JSON.stringify(beamHeightAdopt)} + pad-uri`
      : `NEED LAMELE + adoptări h/pad`;
}

const md = `# S1 A1 — Calc 100% ordin (stâlpi / grinzi / placă / SE / întoarsă)

**Status:** ${result.meta.status}  
**Generat:** ${result.meta.generated.slice(0, 19)}  
**q_Ed planșeu:** ${Q_ED} kN/m² · grinzi tip **${bBeam}×${hBeamDefault}** (h mărit local unde SLS cere) · scară q=${Q_ED_STAIR}

> Nu înlocuiește proiect semnat. Criterii: μ&lt;0.25, V≲Vrd,c, δ_fisurat≤L/250, stâlpi P100≥30 + util N+M&lt;0.85.

---

## VERDICT

| | |
|--|--|
| **Cod** | \`${decision.code}\` |
| **Adoptare** | ${decision.adopt} |
| **Motiv** | ${decision.reason} |
${decision.section ? `| **Secțiune** | ${decision.section} @ ${JSON.stringify(decision.place)} |` : ""}

### Porți

| Poartă | Pass |
|--------|------|
| Stâlpi P100 + N/M | ${summary.gates.columns_P100_NM} |
| Grinzi (după h adoptat) | ${summary.gates.beams_all_after_h_adopt} |
| Placă 15 + B_X_MID | ${summary.gates.slab_with_mid} |
| SE **fără** stâlp lamele | ${summary.gates.SE_without_support} |
| SE **cu** LAMELE 30×30 | ${summary.gates.SE_with_LAMELE30} |
| Întoarsă | ${summary.gates.inverted} |
| Fundații sized vs 200 kPa | ${summary.gates.foundations_sized} |

### h grinzi adoptate (cm)
\`\`\`
${JSON.stringify(beamHeightAdopt, null, 2)}
\`\`\`

### Pad-uri adoptate (cm)
\`\`\`
${JSON.stringify(foundationAdopt, null, 2)}
\`\`\`

---

## 1. Scenarii bandă E / SE (decizie LAMELE)

### Lungimi [m]
| | |
|--|--|
| B_E_S full (PAL→SE) | **${round(L_full_ES, 2)}** |
| PAL→lamele | ${round(L_pal_lamele, 2)} |
| lamele→SE | ${round(L_lamele_se, 2)} |
| B_S_SE orizontal | ${round(L_se_horiz, 2)} |

### A — Fără stâlp
| ID | L | M | μ | flex | SLS δ/lim | **PASS** |
|----|--:|--:|--:|:----:|:---------:|:--------:|
${scenarios.A_fara_stalp_SE.beams
  .map(
    (b) =>
      `| ${b.id} | ${b.L_m} | ${b.M_kNm} | ${b.mu} | ${b.flex_ok} | ${b.delta_cr_mm}/${b.lim_L250_mm} | **${b.pass}** |`
  )
  .join("\n")}

### B/D — Cu LAMELE 30×30 (reazem mid)
| ID | L | M | μ | flex | SLS | **PASS** |
|----|--:|--:|--:|:----:|:---:|:--------:|
${scenarios.D_LAMELE_plus_logica.beams
  .map(
    (b) =>
      `| ${b.id} | ${b.L_m} | ${b.M_kNm} | ${b.mu} | ${b.flex_ok} | ${b.sls_ok} | **${b.pass}** |`
  )
  .join("\n")}

### C — Doar C_SE la colț (fără mid)
| ID | L | PASS | Notă |
|----|--:|:----:|------|
${scenarios.C_cu_C_SE_colt.beams
  .map((b) => `| ${b.id} | ${b.L_m} | **${b.pass}** | ${b.note} |`)
  .join("\n")}

**Citire C:** colțul ajută nodul, **nu** scurtează B_E_S — dacă A fail pe verticală, C fail la fel pe B_E_S.

---

## 2. Grinzi pe schema (toate)

| ID | L | q | M | μ | flex | shear | SLS | PASS |
|----|--:|--:|--:|--:|:----:|:-----:|:---:|:----:|
${beamResults
  .map(
    (b) =>
      `| ${b.id} | ${b.L_m} | ${b.q_kNm} | ${b.M_kNm} | ${b.mu} | ${b.flex_ok} | ${b.shear_ok} | ${b.sls_ok} | **${b.pass}** |`
  )
  .join("\n")}

---

## 3. Stâlpi (2.1 + M ordin)

| ID | Secțiune | N | Nrd | M_ord | util | P100 | PASS |
|----|----------|--:|----:|------:|-----:|:----:|:----:|
${colResults
  .map(
    (c) =>
      `| ${c.id} | ${c.section} | ${c.N_kN} | ${c.Nrd_kN} | ${c.M_ordin_kNm} | ${c.util_NM} | ${c.p100_ok} | **${c.pass}** |`
  )
  .join("\n")}

---

## 4. Placă

| Variantă | L | L/d | allow | δ_cr/lim | PASS |
|----------|--:|----:|------:|---------:|:----:|
| ${slab.without_mid.label} | ${slab.without_mid.L_m} | ${slab.without_mid.L_over_d} | ${slab.without_mid.allow} | ${slab.without_mid.delta_cr_mm}/${slab.without_mid.lim_mm} | **${slab.without_mid.pass}** |
| ${slab.with_mid.label} | ${slab.with_mid.L_m} | ${slab.with_mid.L_over_d} | ${slab.with_mid.allow} | ${slab.with_mid.delta_cr_mm}/${slab.with_mid.lim_mm} | **${slab.with_mid.pass}** |
| ${slab.with_mid_20.label} | ${slab.with_mid_20.L_m} | ${slab.with_mid_20.L_over_d} | ${slab.with_mid_20.allow} | ${slab.with_mid_20.delta_cr_mm}/${slab.with_mid_20.lim_mm} | **${slab.with_mid_20.pass}** |

---

## 5. Grindă întoarsă

${
  inverted
    ? `| ${inverted.id} | L=${inverted.L_m} | M=${inverted.M_kNm} | μ=${inverted.mu} | SLS=${inverted.sls_ok} | **PASS=${inverted.pass}** |`
    : "_lipsește_"
}

---

## 6. Seism ordin / fundații

| | |
|--|--|
| Vb | **${seismic.Vb_kN} kN** (${seismic.note}) |
| Pad 80 fail | ${foundation.filter((f) => !f.pass_vs_200).map((f) => f.id).join(", ") || "niciunul vs 200 kPa"} |
| geo_131 | **deschis** — Rc parcelă |

---

## Aplicare model

${applied || "—"}

Regen după adoptare: \`npm run structure:a1 && npm run volume:a1 && npm run fe:a1\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.md"), md);
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), JSON.stringify(result, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.code,
      adopt: decision.adopt,
      gates: summary.gates,
      fail_SE: failBeamsA.map((b) => ({ id: b.id, mu: b.mu, sls: b.sls_ok, flex: b.flex_ok })),
      applied,
      files: ["outputs/reports/s1_a1_calc_100_v01.md", "outputs/reports/s1_a1_calc_100_v01.json"],
    },
    null,
    2
  )
);
