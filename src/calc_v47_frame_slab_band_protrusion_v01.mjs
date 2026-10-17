/**
 * Placă ± bandă × grosime — clear nou (riser 17) + scor proeminențe.
 * Ordin de studiu — NU FE / NU adoptare automată.
 * Rulează: node src/calc_v47_frame_slab_band_protrusion_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outMd = path.join(root, "outputs/reports/v47_a1_frame_slab_band_protrusion_v01.md");
const outJson = path.join(root, "outputs/reports/v47_a1_frame_slab_band_protrusion_v01.json");

const Qk = 2.0;
const FINISH_G = 1.5; // kN/m² peste BA
const psi2 = 0.3;
const Ecm = 31e6; // kN/m²
const FYD = 500 / 1.15;
const FCD = 25 / 1.5;
const L_FULL = 6.2;
const L_BAND = 3.1;
const BAND_L = 6.45;
const BAND_TRIB = 3.1; // 1-way bound; 2-way → 2.0
const COVER_SLAB = 0.025;
const COVER_BEAM = 0.05;

/** Clear pe HEAD: FF→FF 306 = clear_plafon + 6 + h + 12 buildup; grindă h_tot=35 din slab top. */
function clears(hCm) {
  const clearPlafon = 306 - (6 + hCm + 3 + 2 + 5 + 2);
  const clearBeam = 259; // beam soffit = slab_top − 35; independent de h placă în model
  return {
    clear_plafon_cm: clearPlafon,
    clear_sub_grinda_cm: clearBeam,
    clear_sub_banda_cm: clearBeam, // dacă bandă = grindă tip h35
    pass_255_plafon: clearPlafon >= 255,
    pass_255_grinda: clearBeam >= 255,
  };
}

function gk(hCm) {
  return (hCm / 100) * 25 + FINISH_G;
}
function qEd(hCm) {
  return 1.35 * gk(hCm) + 1.5 * Qk;
}
function qQp(hCm) {
  return gk(hCm) + psi2 * Qk;
}

function round(x, d = 1) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

/** EC2-ish L/d cu K (continuu ~1.3…1.5). */
function spanDepth(L, hCm, K) {
  const h = hCm / 100;
  const d = h - COVER_SLAB;
  const allow = K * 40 * 0.85; // long-term rough
  const ratio = L / d;
  return {
    L_m: L,
    d_cm: round(d * 100, 1),
    L_over_d: round(ratio, 1),
    allow_L_over_d: round(allow, 1),
    K,
    pass: ratio <= allow + 1e-9,
  };
}

function deflection(L, hCm, q) {
  const d = hCm / 100 - COVER_SLAB;
  const I = d ** 3 / 12;
  const delta = ((5 * q * L ** 4) / (384 * Ecm * I)) * 1000;
  const limit = (L * 1000) / 250;
  return {
    delta_elastic_mm: round(delta, 1),
    limit_L250_mm: round(limit, 1),
    pass_elastic: delta <= limit,
    note: "elastic nefisurat — fisurat ≈2–3×; doar semnal",
  };
}

function slabFlex(L, hCm) {
  const q = qEd(hCm);
  const M = (q * L * L) / 8;
  const d = hCm / 100 - COVER_SLAB;
  const As = (M * 1e6) / (0.9 * d * 1000 * FYD);
  return { q_Ed: round(q, 2), M_kNm_m: round(M, 1), As_mm2_m: round(As, 0) };
}

function bandFlex(hCm, trib) {
  const q = qEd(hCm) * trib;
  const M = 0.9 * ((q * BAND_L * BAND_L) / 8); // continuous factor ca band_options
  const b = 0.4;
  const h = 0.35;
  const d = h - COVER_BEAM;
  const As = (M * 1e6) / (0.9 * d * 1000 * FYD);
  const mu = M / (b * d * d * FCD * 1000);
  return {
    trib_m: trib,
    M_kNm: round(M, 1),
    As_mm2: round(As, 0),
    mu: round(mu, 3),
    flex_ok: mu < 0.25,
  };
}

/**
 * Scor proeminențe (mai mic = mai curat):
 * - bandă downstand în living/dorm path: +2
 * - bandă „îngropată” în placă (ipoteză): +1 (tot un nervură / armare densă)
 * - fără bandă: 0
 * - C_N_MID along 40 pe N (necesar dacă bandă): +1 pe fațadă; fără bandă = candidat drop ulterior
 */
function scorePack(p) {
  let protr = 0;
  const notes = [];
  if (p.band === "downstand") {
    protr += 2;
    notes.push("bandă tip grindă h35 prin casă (soffit local)");
  } else if (p.band === "flush") {
    protr += 1;
    notes.push("bandă îngropată în placă (nervură)");
  } else {
    notes.push("fără bandă");
  }
  if (p.keep_N_MID) {
    protr += 1;
    notes.push("C_N_MID 40 pe N (pilastru/along)");
  } else {
    notes.push("C_N_MID poate ieși ulterior (comparatie)");
  }
  // penalizează clear marginal / Gk greu
  let risk = 0;
  if (!p.sd_K13.pass) risk += 3;
  else if (p.sd_K13.L_over_d > p.sd_K13.allow_L_over_d * 0.92) risk += 1;
  if (!p.clear.pass_255_plafon) risk += 5;
  if (p.h_cm >= 25) risk += 1; // masă / Gk
  const score = protr * 10 + risk * 3 + (p.h_cm - 15) * 0.2; // preferă subțire dacă egal
  return { protr_score: protr, risk_score: risk, total: round(score, 1), notes };
}

const heights = [15, 18, 20, 22, 25];
const rows = [];

for (const h of heights) {
  const clear = clears(h);
  const flexFull = slabFlex(L_FULL, h);
  const flexHalf = slabFlex(L_BAND, h);
  const deflFull = deflection(L_FULL, h, qQp(h));
  const deflHalf = deflection(L_BAND, h, qQp(h));
  const sdFull13 = spanDepth(L_FULL, h, 1.3);
  const sdFull15 = spanDepth(L_FULL, h, 1.5);
  const sdHalf13 = spanDepth(L_BAND, h, 1.3);
  const band1 = bandFlex(h, 3.1);
  const band2 = bandFlex(h, 2.0);

  // A: fără bandă (poate drop N_MID ulterior)
  const noBand = {
    id: `h${h}_no_band`,
    h_cm: h,
    band: "none",
    keep_N_MID: false,
    L_crit_m: L_FULL,
    clear,
    sd_K13: sdFull13,
    sd_K15: sdFull15,
    defl: deflFull,
    flex: flexFull,
    band_beam: null,
  };
  noBand.score = scorePack(noBand);

  // B: cu bandă downstand + C_N_MID (R clasic)
  const withBand = {
    id: `h${h}_band_downstand`,
    h_cm: h,
    band: "downstand",
    keep_N_MID: true,
    L_crit_m: L_BAND,
    clear,
    sd_K13: sdHalf13,
    sd_K15: spanDepth(L_BAND, h, 1.5),
    defl: deflHalf,
    flex: flexHalf,
    band_beam: { one_way: band1, two_way: band2 },
  };
  withBand.score = scorePack(withBand);

  // C: bandă flush (dacă FE permite nervură în placă)
  const flushBand = {
    id: `h${h}_band_flush`,
    h_cm: h,
    band: "flush",
    keep_N_MID: true,
    L_crit_m: L_BAND,
    clear: { ...clear, clear_sub_banda_cm: clear.clear_plafon_cm }, // fără coborâre locală
    sd_K13: sdHalf13,
    sd_K15: spanDepth(L_BAND, h, 1.5),
    defl: deflHalf,
    flex: flexHalf,
    band_beam: { one_way: band1, two_way: band2 },
  };
  flushBand.score = scorePack(flushBand);

  rows.push(noBand, withBand, flushBand);
}

function verdict(r) {
  if (!r.clear.pass_255_plafon) return "RESPINS_clear";
  if (r.band === "none") {
    if (r.sd_K13.pass) return "OK_ordin_fara_banda";
    if (r.sd_K15.pass) return "MARGINAL_doar_K1.5";
    return "FAIL_ordin_fara_banda";
  }
  if (r.sd_K13.pass) return "OK_ordin_cu_banda";
  return "FAIL_cu_banda";
}

for (const r of rows) r.verdict = verdict(r);

// Candidați viabili: clear OK + (OK_ordin sau MARGINAL)
const viable = rows.filter((r) =>
  ["OK_ordin_fara_banda", "OK_ordin_cu_banda", "MARGINAL_doar_K1.5"].includes(r.verdict)
);
viable.sort((a, b) => a.score.total - b.score.total);

const pick = viable[0];
const pickNoBand = viable.find((r) => r.band === "none" && r.verdict === "OK_ordin_fara_banda");
const pickClassic = rows.find((r) => r.id === "h15_band_downstand");

const result = {
  status: "ordin_studiu — NU FE semnat · NU adoptare automată",
  dated: "2026-10-17",
  context: {
    ff_to_ff_cm: 306,
    clear_ref_h15: clears(15),
    L_full_m: L_FULL,
    L_with_band_m: L_BAND,
    dorm_lock: "fără Y400",
    note_band:
      "Bandă downstand = aceeași logică clear ca grinzile h35. Bandă flush = ipoteză nervură în placă (FE).",
  },
  matrix: rows,
  viable_ranked: viable.map((r) => ({
    id: r.id,
    verdict: r.verdict,
    score: r.score.total,
    protr: r.score.protr_score,
    clear_plafon: r.clear.clear_plafon_cm,
  })),
  recommended_study: {
    id: pick?.id ?? null,
    why: pick
      ? `Cel mai mic scor proeminențe+risc dintre variantele care trec clear≥255 și L/d ordin (${pick.verdict}).`
      : "niciun candidat",
    alt_min_protrusion_no_band: pickNoBand
      ? {
          id: pickNoBand.id,
          h_cm: pickNoBand.h_cm,
          clear_plafon: pickNoBand.clear.clear_plafon_cm,
          L_over_d: pickNoBand.sd_K13.L_over_d,
          allow: pickNoBand.sd_K13.allow_L_over_d,
          note: "Elimină banda (proem. soffit) și deschide drop ulterior C_N_MID — FE obligatoriu pe 6,2 m",
        }
      : null,
    keep_R_classic: {
      id: pickClassic.id,
      note: "15+bandă downstand — încă validă; mai multe proeminențe, placă ușoară",
    },
  },
  answers: {
    does_thicker_slab_still_need_band:
      "La ordin: h≥18–20 pe L=6,2 cu K=1,3 continuu → L/d trece FĂRĂ bandă. h=15 fără bandă → FAIL (sau doar K=1,5 optimist). Bandă rămâne utilă pe 15 sau ca rezervă FE.",
    optimal_protrusion:
      pickNoBand != null
        ? `Studiu: ${pickNoBand.id} — zero bandă; C_N_MID candidat drop după FE. Alternativ: h15/h18 + bandă flush (dacă FE acceptă nervură).`
        : "Păstrează bandă; crește h doar dacă FE cere.",
  },
};

const matrixRows = rows
  .map((r) => {
    const bandLabel =
      r.band === "none" ? "nu" : r.band === "downstand" ? "downstand" : "flush";
    return `| ${r.h_cm} | ${bandLabel} | ${r.L_crit_m} | ${r.sd_K13.L_over_d}/${r.sd_K13.allow_L_over_d} | ${r.sd_K13.pass ? "da" : "nu"} | ${r.clear.clear_plafon_cm} | ${r.score.protr_score} | **${r.verdict}** |`;
  })
  .join("\n");

const md = `# Placă ± bandă — clear nou + proeminențe (2026-10-17)

**Status:** ordin de studiu · **NU** FE semnat · **NU** adoptare în mesh fără debate  
**Context:** FF→FF **306** (riser 17) · clear plafon @15 = **273** · sub grindă **259** · dorm **fără Y400**

## Întrebări

1. **Placă mai groasă mai cere bandă?**  
   ${result.answers.does_thicker_slab_still_need_band}

2. **Variantă optimă pe proeminențe?**  
   ${result.answers.optimal_protrusion}

## Matrice (K=1,3 continuu pe L/d)

| h | Bandă | L crit | L/d / admis | Pass | Clear plafon | Proem. | Verdict |
|--:|-------|-------:|------------:|:----:|-------------:|-------:|---------|
${matrixRows}

Proeminențe: **0** = fără bandă (+ drop posibil C_N_MID) · **1** = bandă flush + N_MID · **3** = bandă downstand + N_MID.

## Candidați (scor crescător = mai bun)

${viable
  .slice(0, 8)
  .map(
    (r, i) =>
      `${i + 1}. \`${r.id}\` — ${r.verdict} · scor ${r.score.total} · proem ${r.score.protr_score} · clear ${r.clear.clear_plafon_cm} · ${r.score.notes.join("; ")}`
  )
  .join("\n")}

## Recomandare studiu (debate)

| Prioritate | Pachet | De ce |
|------------|--------|--------|
| **1 — min proem.** | **Placă ~20 (18–22) fără \`B_BAND_X320\`** | L/d ordin OK pe 6,2 @K=1,3; clear încă ≥268; **zero** soffit bandă; C_N_MID = comparație ulterioară |
| 2 — clasic R | Placă **15** + bandă (ideal **flush**/nervură) | ușoară; panouri 3,1; proem. dacă downstand |
| 3 — evit | 15 fără bandă | FAIL L/d @K=1,3 |
| 3 — evit | 25–28 doar ca să „scape” de bandă | Gk↑; clear încă OK dar inutil dacă 20 trece |

### Bandă pe 20+ 

**Nu e obligatorie** la ordin span/depth. Poate rămâne ca **asigurare FE** (2-way, fisurare, vibrații) — atunci preferă **flush**, nu downstand.

### Clear (confirmare)

| h | Clear plafon | Sub grindă/bandă downstand |
|--:|-------------:|---------------------------:|
| 15 | 273 | 259 |
| 18 | 270 | 259 |
| 20 | 268 | 259 |
| 22 | 266 | 259 |
| 25 | 263 | 259 |

## Ce NU e demonstrat

- SLS fisurat / vibrații / 2-way real → **FE**
- Bandă flush vs downstand în execuție
- Drop \`C_N_MID\` fără bandă (fațadă N)

JSON: \`outputs/reports/v47_a1_frame_slab_band_protrusion_v01.json\`
`;

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(
  JSON.stringify(
    {
      ok: true,
      pick: result.recommended_study.id,
      no_band: result.recommended_study.alt_min_protrusion_no_band,
      answer_band_needed: result.answers.does_thicker_slab_still_need_band,
      top3: result.viable_ranked.slice(0, 3),
      report: "outputs/reports/v47_a1_frame_slab_band_protrusion_v01.md",
    },
    null,
    2
  )
);
