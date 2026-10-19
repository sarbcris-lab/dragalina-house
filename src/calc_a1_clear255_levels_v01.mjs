/**
 * Lock clear ≥255 pretutindeni (sub placă ȘI sub grindă) — beneficiar A1.180.
 * Derivă FF→FF, cote placă/grindă, min h placă din span; confirmă acoperiș 30° PV.
 *
 * Rulează: node src/calc_a1_clear255_levels_v01.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1Path = path.join(root, "data/building/a1_architecture.json");
const v47Path = path.join(root, "data/building/v47_a1_study.json");
const a1 = JSON.parse(fs.readFileSync(a1Path, "utf8"));
const v47 = JSON.parse(fs.readFileSync(v47Path, "utf8"));

const CLEAR = 255; // HARD — sub placă și sub grindă
const SLAB = 15; // țintă; verificată pe span
const BUILDUP = 12; // sub FF etaj
const FC = 6; // fals plafon sub soffit (opțional)
const FYD = 500 / 1.15;
const FCD = 25 / 1.5;
const Ecm = 31e6;
const Q_ED = 11.78;
const Q_qp = 0.15 * 25 + 1.5 + 0.3 * 2;

function round(x, d = 2) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

/** SLS+ULS placă bandă 1m, L [m], h [cm] */
function slabOK(L, hCm) {
  const h = hCm / 100;
  const d = h - 0.025;
  const M = (Q_ED * L * L) / 8;
  const mu = M / (1 * d * d * FCD * 1000);
  const L_d = L / d;
  const allow = 1.4 * 40 * 0.85;
  const I = d ** 3 / 12;
  const delta = ((5 * Q_qp * L ** 4) / (384 * Ecm * I)) * 1000 * 2.5;
  const lim = (L * 1000) / 250;
  return {
    L_m: L,
    h_cm: hCm,
    mu: round(mu, 3),
    L_over_d: round(L_d, 1),
    allow_Ld: round(allow, 1),
    delta_mm: round(delta, 1),
    lim_mm: round(lim, 1),
    pass: mu < 0.25 && L_d <= allow && delta <= lim,
  };
}

const box = a1.basement_cm?.structure_box;
const L_mid = box ? (box.x1 - box.x0) / 200 : 2.52; // jumătate cutie cu B_X_MID
const L_full = box ? (box.x1 - box.x0) / 100 : 5.04;

// Min placă: încearcă 15, 16, 18, 20 pe L_mid (cu axă)
let slabMin = null;
for (const h of [15, 16, 18, 20, 22, 25]) {
  const r = slabOK(L_mid, h);
  if (r.pass) {
    slabMin = r;
    break;
  }
}
if (!slabMin) slabMin = { ...slabOK(L_mid, 25), pass: false, note: "FAIL chiar @25 — verifică L" };

const slabAdopt = Math.max(SLAB, slabMin.h_cm);
const withoutMid = slabOK(L_full, slabAdopt);

// Grinzi: h din calc anterior sau 35/40
const hAdopt = a1.structure_a1_study_cm?.beam_height_adopt_cm || {};
const hBeamMax = Math.max(35, ...Object.values(hAdopt), 40);
const hBeamTyp = 35;

function levelPack(hBeam, slabTh) {
  const drop = Math.max(0, hBeam - slabTh); // coborâre sub soffit placă
  // Clear sub grindă ≥255 → z_beam_soffit = FF + 255
  // z_slab_soffit = z_beam_soffit + drop
  // clear sub placă = 255 + drop ≥255 OK
  const clear_under_beam = CLEAR;
  const clear_under_slab = CLEAR + drop;
  const clear_under_fc = clear_under_slab - FC; // FC atârnat sub soffit
  // FF→FF: clear_under_beam + drop + slab + buildup = CLEAR + drop + slab + buildup
  // (= clear_under_slab + slab + buildup)
  const ff_to_ff = CLEAR + drop + slabTh + BUILDUP;
  const ff_P = 48;
  const z_beam_soffit = ff_P + CLEAR;
  const z_slab_soffit = z_beam_soffit + drop;
  const z_slab_top = z_slab_soffit + slabTh;
  const ff_E = z_slab_top + BUILDUP; // FF pe finisaj deasupra buildup pe placă
  return {
    h_beam_cm: hBeam,
    slab_th_cm: slabTh,
    drop_below_soffit_cm: drop,
    clear_under_beam_cm: clear_under_beam,
    clear_under_slab_cm: clear_under_slab,
    clear_under_false_ceiling_cm: clear_under_fc,
    false_ceiling_ok: clear_under_fc >= CLEAR,
    ff_to_ff_cm: ff_to_ff,
    ff_parter_cm: ff_P,
    ff_etaj_cm: ff_E,
    beam_soffit_cm: z_beam_soffit,
    slab_soffit_cm: z_slab_soffit,
    slab_top_structural_cm: z_slab_top,
    note:
      clear_under_fc < CLEAR
        ? "FC coboară sub 255 — ridică soffit sau mută FC doar între grinzi"
        : "clear ≥255 sub grindă, sub placă și sub FC",
  };
}

const pack35 = levelPack(hBeamTyp, slabAdopt);
const pack40 = levelPack(hBeamMax, slabAdopt);
// Pachet adoptat = cel cu h max pe grinzi critice (B_X_MID/B_Y410 = 40)
const pack = pack40;

// Alternativă: grinzi flush (drop=0) — FF→FF minim
const packFlush = levelPack(slabAdopt, slabAdopt); // h_beam = slab → drop 0
packFlush.note = "Alternativă: grinzi bandă/încastrate (intrados = placă) → FF→FF = " + packFlush.ff_to_ff_cm;

// Acoperiș 30°
const cover = v47.roof_cm?.covers_cm || { y0: 0, y1: 861.3 };
const run = Math.abs((cover.y1 - cover.y0) / 2);
const rise30 = run * Math.tan((30 * Math.PI) / 180);
const roof = {
  type: "two_pitch",
  pitch_deg: 30,
  run_cm: round(run, 1),
  rise_cm: round(rise30, 1),
  pv_both_pitches: true,
  status: "LOCK_30deg_PV",
};

const result = {
  meta: {
    id: "s1_a1_clear255_levels_v01",
    generated: new Date().toISOString(),
    lock: "clear_min_cm = 255 HARD under slab AND under beams — D1(b)/241 REVOCAT",
  },
  clear_lock_cm: CLEAR,
  slab: {
    min_that_passes_mid_span: slabMin,
    adopt_cm: slabAdopt,
    without_mid_axis_check: withoutMid,
    verdict: withoutMid.pass
      ? `Placă ${slabAdopt} cm OK și pe L plin (conservator)`
      : `Placă ${slabAdopt} cm OK pe L≈${L_mid}m cu B_X_MID; fără axă mid L≈${L_full}m → ${withoutMid.pass ? "OK" : "SLS/ULS semnal — păstrează B_X_MID"}`,
  },
  beams: {
    typical_h_cm: hBeamTyp,
    critical_h_cm: hBeamMax,
    adopt_map: hAdopt,
    rule: "h total inclusiv zona plăcii; coborâre sub soffit = h − slab; clear sub grindă ≥255",
  },
  levels_adopted: pack,
  levels_if_beam_h35: pack35,
  levels_flush_alternative: packFlush,
  roof,
  errors_corrected: [
    "Anterior: clear 241 sub grindă — INTERZIS de beneficiar",
    "FF→FF trebuie să includă drop grindă + placă + buildup peste clear 255",
  ],
};

// ——— Scrie în a1 + v47 + structure
const lv = {
  clear_min_cm: CLEAR,
  clear_under_beam_cm: pack.clear_under_beam_cm,
  clear_under_slab_cm: pack.clear_under_slab_cm,
  clear_to_false_ceiling_cm: pack.clear_under_false_ceiling_cm,
  false_ceiling_cm: FC,
  slab_th_hypothesis: slabAdopt,
  beam_h_total_including_slab_zone: hBeamMax,
  beam_h_typical_cm: hBeamTyp,
  beam_definition: `${hBeamMax} cm total pe grinzi critice (incl. placă ${slabAdopt}); tipic ${hBeamTyp}; clear≥255 sub grindă`,
  drop_below_soffit_cm: pack.drop_below_soffit_cm,
  floor_buildup_below_ff: BUILDUP,
  ff_parter: pack.ff_parter_cm,
  ff_etaj: pack.ff_etaj_cm,
  ff_to_ff_cm: pack.ff_to_ff_cm,
  beam_soffit_over_parter: pack.beam_soffit_cm,
  slab_soffit_etaj: pack.slab_soffit_cm,
  slab_top_etaj: pack.slab_top_structural_cm,
  basement_ff_cm: -250,
  basement_soffit_cm: -30,
  basement_beam_h_cm: 40,
  note: `A1.180: clear≥255 HARD. FF→FF=${pack.ff_to_ff_cm}. Placă ${slabAdopt}. Grindă crit. ${hBeamMax}.`,
};

a1.heights_cm = {
  clear_min_cm: CLEAR,
  riser_max_cm: 16,
  clear_to_false_ceiling_cm: pack.clear_under_false_ceiling_cm,
  false_ceiling_cm: FC,
  structural_slab_cm: slabAdopt,
  floor_buildup_below_ff_cm: BUILDUP,
  ff_to_ff_cm: pack.ff_to_ff_cm,
  wall_to_soffit_cm: pack.clear_under_slab_cm,
  beam_drop_below_soffit_cm: pack.drop_below_soffit_cm,
  clear_under_beam_cm: CLEAR,
  note: `Clear ≥255 sub placă ȘI sub grindă (HARD). FF→FF ${pack.ff_to_ff_cm}. Riser ≤16 doar P↔E.`,
};

if (!a1.structure_a1_study_cm) a1.structure_a1_study_cm = {};
a1.structure_a1_study_cm.levels_cm = lv;
a1.structure_a1_study_cm.clear_lock = {
  min_cm: CLEAR,
  under_beam: true,
  under_slab: true,
  revoked: "D1 option (b) 241 under beams — A1.180",
};

v47.heights_cm = {
  ...v47.heights_cm,
  note: `A1.180 sync: clear≥255 sub grindă+placă. FF→FF ${pack.ff_to_ff_cm} = 255+drop${pack.drop_below_soffit_cm}+slab${slabAdopt}+buildup${BUILDUP}.`,
  clear_to_false_ceiling_cm: pack.clear_under_false_ceiling_cm,
  false_ceiling_cm: FC,
  structural_slab_cm: slabAdopt,
  structural_slab_status: "adopt_studiu_clear255",
  floor_buildup_below_ff_cm: BUILDUP,
  ff_to_ff_cm: pack.ff_to_ff_cm,
  wall_to_soffit_cm: pack.clear_under_slab_cm,
  clear_under_beam_cm: CLEAR,
  beam_h_total_cm: hBeamMax,
  ff_check_sum: `255+${pack.drop_below_soffit_cm}+${slabAdopt}+${BUILDUP}=${pack.ff_to_ff_cm}`,
};

v47.roof_cm = {
  ...v47.roof_cm,
  type: "two_pitch",
  rise_cm: roof.rise_cm,
  pitch_deg_approx: 30,
  pitch_note: "LOCK 30° — rise=run·tan(30°) pe ape N/S; PV pe ambele ape",
  status: "LOCK_30deg_PV",
  pv: { ...(v47.roof_cm?.pv || {}), both_pitches: true, note: "Panouri FV pe ambele ape — decis" },
};

fs.writeFileSync(a1Path, JSON.stringify(a1, null, 2) + "\n");
fs.writeFileSync(v47Path, JSON.stringify(v47, null, 2) + "\n");
if (a1.structure_a1_study_cm) {
  fs.writeFileSync(
    path.join(root, "data/building/a1_structure_study.json"),
    JSON.stringify(a1.structure_a1_study_cm, null, 2) + "\n"
  );
}

const md = `# S1 A1 — Clear ≥255 HARD + placă/grindă + acoperiș 30°

**Status:** LOCK beneficiar A1.180 · ${result.meta.generated.slice(0, 10)}  
**Revocat:** acceptarea clear 241 sub grindă (D1b).

## Clear

| Loc | Minim | Valoare pachet |
|-----|------:|---------------:|
| Sub grindă | **255** | **${pack.clear_under_beam_cm}** |
| Sub placă | **255** | **${pack.clear_under_slab_cm}** (=255+drop ${pack.drop_below_soffit_cm}) |
| Sub fals plafon | **255** | **${pack.clear_under_false_ceiling_cm}** |

## Placă — minim

| | |
|--|--|
| Span cu B_X_MID | L≈**${round(L_mid, 2)}** m |
| Minim care trece ordin | **${slabMin.h_cm}** cm (μ=${slabMin.mu}, L/d=${slabMin.L_over_d}, δ=${slabMin.delta_mm}/${slabMin.lim_mm}) |
| **Adoptat** | **${slabAdopt} cm** |
| Fără axă mid (L≈${round(L_full, 2)}) | pass=${withoutMid.pass} — **păstrează B_X_MID** |

## Grindă / centură

| | h total (cu zonă placă) | Coborâre sub soffit |
|--|--:|--:|
| Tipic | ${hBeamTyp} | ${hBeamTyp - slabAdopt} |
| Critic (B_X_MID, B_Y410) | **${hBeamMax}** | **${hBeamMax - slabAdopt}** |

Intrados grindă = FF + 255. Nu mai există zonă cu clear 241.

## FF → FF

| | cm |
|--|--:|
| **Adoptat** | **${pack.ff_to_ff_cm}** |
| Descompunere | 255 + drop ${pack.drop_below_soffit_cm} + placă ${slabAdopt} + buildup ${BUILDUP} |
| FF P / FF E | ${pack.ff_parter_cm} / ${pack.ff_etaj_cm} |
| Alternativă flush (fără drop) | FF→FF **${packFlush.ff_to_ff_cm}** |

## Acoperiș 2 ape · 30° · PV

| | |
|--|--|
| Panta | **30°** LOCK |
| Run (jumătate NS) | ${roof.run_cm} cm |
| Rise | **${roof.rise_cm}** cm |
| PV | ambele ape |

## Ce s-a corectat

${result.errors_corrected.map((e) => `- ${e}`).join("\n")}

Regen: \`npm run volume:a1\` · \`npm run calc:a1\`
`;

fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_clear255_levels_v01.md"), md);
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_clear255_levels_v01.json"), JSON.stringify(result, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      ok: true,
      clear: CLEAR,
      slab_cm: slabAdopt,
      beam_crit_cm: hBeamMax,
      ff_to_ff: pack.ff_to_ff_cm,
      clear_under_beam: pack.clear_under_beam_cm,
      clear_under_slab: pack.clear_under_slab_cm,
      roof_rise_cm: roof.rise_cm,
      roof_pitch: 30,
    },
    null,
    2
  )
);
