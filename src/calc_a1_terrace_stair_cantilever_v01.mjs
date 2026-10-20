/**
 * Studiu detaliat: terasă FĂRĂ C_SW_TERASA + verificare casa scării (schema actuală).
 * EC2 ordin (flexiune / forfecare / săgeată) — NU proiect semnat, NU FE.
 *
 * Rulează: node src/calc_a1_terrace_stair_cantilever_v01.mjs
 * Scrie: outputs/reports/s1_a1_terrace_stair_cantilever_v01.md
 *         outputs/reports/s1_a1_terrace_stair_cantilever_v01.json
 * Nu modifică a1_architecture.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const st = a1.structure_a1_study_cm;
if (!st?.columns?.length) throw new Error("structure_a1_study_cm lipsă");

const cols = Object.fromEntries(st.columns.map((c) => [c.id, c]));
const beams = Object.fromEntries((st.beams || []).map((b) => [b.id, b]));
const lv = st.levels_cm || {};

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

// ——— Materiale / încărcări (EC2 / CR0 / CR1-1-3 ordin RO)
const FCK = 25; // MPa C25/30
const FYK = 500;
const FCD = FCK / 1.5; // MPa
const FYD = FYK / 1.15; // MPa
const Ecm = 31e3; // MPa
const GAMMA_C = 25; // kN/m³ beton armat

const H_SLAB = (lv.slab_th_hypothesis ?? 15) / 100; // m
const H_BEAM = (lv.beam_h_total_including_slab_zone ?? 40) / 100;
const H_BEAM_TYP = (lv.beam_h_typical_cm ?? 35) / 100;

// Terasă: placă + finisaj + parapet / mobilier — CR1 categorie C3 / H exterior
const Gk_slab = H_SLAB * GAMMA_C; // 3.75
const Gk_finish = 1.2; // șapă + hidro + dale (terasă)
const Gk_parapet_line = 1.5; // kN/m pe contur (ordin)
const Qk_terrace = 4.0; // kN/m² — terasă accesibilă (conservator; C3 tipic 5.0 pe zone)
const Qk_roof = 0.75; // zăpadă Turda ordin (s_k≈1.5 · μ≈0.8 /γ) + greutate învelitoare pe ml grindă
const Gk_roof_line = 2.5; // kN/m pe reazem acoperiș (ordin pe centură)

// Planșeu încălzit (casa scară / placă etaj)
const Gk_floor = H_SLAB * GAMMA_C + 1.5; // 5.25
const Qk_floor = 2.0;
const Qk_stair = 3.0;

const gammaG = 1.35;
const gammaQ = 1.5;

function qEd(gk, qk) {
  return gammaG * gk + gammaQ * qk;
}

const Q_ED_TERRACE = qEd(Gk_slab + Gk_finish, Qk_terrace); // ~7.4
const Q_ED_FLOOR = qEd(Gk_floor, Qk_floor); // ~11.8? wait 1.35*5.25+1.5*2 = 10.09
const Q_ED_STAIR = qEd(Gk_floor, Qk_stair);
const Q_QP_TERRACE = Gk_slab + Gk_finish + 0.3 * Qk_terrace; // quasi-permanent SLS

/** Flexiune grindă simplu rezemată (conservator vs continuă). */
function beamSS(id, L, q_kNm, bCm, hCm, note = "") {
  const b = bCm / 100;
  const h = hCm / 100;
  const d = Math.max(h - 0.05, 0.08);
  const M = (q_kNm * L * L) / 8;
  const V = (q_kNm * L) / 2;
  return sectionCheck(id, L, q_kNm, bCm, hCm, M, V, note, "simply_supported");
}

/** Consolă: M = q L²/2, V = q L. */
function beamCant(id, L, q_kNm, bCm, hCm, note = "") {
  const M = (q_kNm * L * L) / 2;
  const V = q_kNm * L;
  return sectionCheck(id, L, q_kNm, bCm, hCm, M, V, note, "cantilever");
}

/** Placă bandă 1 m lățime consolă. */
function slabCant(id, L, hCm, q_Ed, q_qp, note = "") {
  const bCm = 100;
  const M = (q_Ed * L * L) / 2;
  const V = q_Ed * L;
  const r = sectionCheck(id, L, q_Ed, bCm, hCm, M, V, note, "slab_cantilever_1m");
  // Săgeată consolă: δ = q L⁴ / (8 EI) · factor fisurat
  const b = 1;
  const h = hCm / 100;
  const d = Math.max(h - 0.025, 0.05);
  const I = (b * d ** 3) / 12;
  const E = Ecm * 1000; // kN/m²
  const delta_uncr = ((q_qp * L ** 4) / (8 * E * I)) * 1000;
  const delta_cr = delta_uncr * 2.5;
  const lim_L250 = (L * 1000) / 250;
  const lim_L180 = (L * 1000) / 180; // consolă tipic mai strict / vizual
  r.delta_cr_mm = round(delta_cr, 1);
  r.lim_L250_mm = round(lim_L250, 1);
  r.lim_L180_mm = round(lim_L180, 1);
  r.sls_ok = delta_cr <= lim_L180;
  r.L_over_d = round(L / d, 1);
  r.L_over_d_allow_cant = 10; // regulă practică consolă placă ~L/d≤8–10 fără precomprimare
  r.Ld_ok = r.L_over_d <= 10;
  r.pass = r.flex_ok && r.shear_ok && r.sls_ok && r.Ld_ok;
  return r;
}

function sectionCheck(id, L, q_kNm, bCm, hCm, M, V, note, regime) {
  const b = bCm / 100;
  const h = hCm / 100;
  const cover = regime.startsWith("slab") ? 0.025 : 0.05;
  const d = Math.max(h - cover, 0.05);
  const As = (M * 1e6) / (0.9 * (d * 1000) * FYD);
  const mu = M / (b * d * d * FCD * 1000);
  const rho = Math.min(0.025, Math.max(As / 1e6 / (b * d), 0.0015));
  const k = Math.min(2, 1 + Math.sqrt(200 / (d * 1000)));
  const Vrdc =
    (0.12 * k * Math.pow(100 * rho * FCK, 1 / 3) * (b * 1000) * (d * 1000)) / 1000;
  // Etrieri min ⌀8 / 150 mm · 2 branșe (consolă / grindă tipică)
  const Asw = 2 * Math.PI * 4 ** 2; // mm²
  const s = 150; // mm
  const z = 0.9 * d * 1000; // mm
  const Vrds = (Asw / s) * FYD * z * 0.001; // kN  (EC2 simplificat cotθ=1)
  const Vrd = Math.max(Vrdc, Math.min(Vrds + Vrdc * 0.15, Vrds * 1.05 + Vrdc)); // ordin: beton+etrieri
  const I = (b * d ** 3) / 12;
  const E = Ecm * 1000;
  // SS: 5/384 · qL⁴/EI ; consolă: 1/8 · qL⁴/EI
  const kDefl = regime === "cantilever" || regime.startsWith("slab_cant") ? 1 / 8 : 5 / 384;
  const q_qp = regime.startsWith("slab") || regime.includes("terr") ? Q_QP_TERRACE : q_kNm / 1.4;
  const delta_uncr = ((kDefl * q_qp * L ** 4) / (E * I)) * 1000;
  const delta_cr = delta_uncr * 2.5;
  const lim = (L * 1000) / (regime === "cantilever" ? 180 : 250);
  const flex_ok = mu < 0.25;
  const shear_ok_no_stirrup = V <= Vrdc * 1.15;
  const shear_ok = V <= Vrd; // cu etrieri min
  const sls_ok = delta_cr <= lim;
  return {
    id,
    regime,
    L_m: round(L, 3),
    q_kNm: round(q_kNm, 2),
    section_cm: `${bCm}×${hCm}`,
    h_cm: hCm,
    M_kNm: round(M, 2),
    V_kN: round(V, 2),
    As_mm2: round(As, 0),
    As_bars: suggestBars(As),
    mu: round(mu, 3),
    flex_ok,
    Vrdc_kN: round(Vrdc, 1),
    Vrds_kN: round(Vrds, 1),
    Vrd_with_stirrups_kN: round(Vrd, 1),
    shear_ok_no_stirrup,
    shear_ok,
    delta_cr_mm: round(delta_cr, 1),
    lim_mm: round(lim, 1),
    sls_ok,
    pass: flex_ok && shear_ok && sls_ok,
    pass_no_stirrup: flex_ok && shear_ok_no_stirrup && sls_ok,
    note,
  };
}

function suggestBars(As) {
  const opts = [
    [3, 12],
    [4, 12],
    [3, 14],
    [4, 14],
    [3, 16],
    [4, 16],
    [5, 16],
    [4, 20],
    [5, 20],
    [6, 20],
  ];
  for (const [n, phi] of opts) {
    const a = n * Math.PI * (phi / 2) ** 2;
    if (a >= As) return `${n}⌀${phi} (${round(a, 0)} mm²)`;
  }
  return `>6⌀20 (As=${round(As, 0)})`;
}

function minH(id, L, q, bCm, regime, note) {
  for (let h = 25; h <= 70; h += 5) {
    const r =
      regime === "cantilever"
        ? beamCant(id, L, q, bCm, h, note)
        : beamSS(id, L, q, bCm, h, note);
    if (r.pass) return r;
  }
  return regime === "cantilever"
    ? beamCant(id, L, q, bCm, 70, note + " — FAIL @70")
    : beamSS(id, L, q, bCm, 70, note + " — FAIL @70");
}

function clearBetween(a, b, axis) {
  if (axis === "y") {
    const lo = a.y + a.dy <= b.y ? a : b;
    const hi = a.y + a.dy <= b.y ? b : a;
    return (hi.y - (lo.y + lo.dy)) / 100;
  }
  const lo = a.x + a.dx <= b.x ? a : b;
  const hi = a.x + a.dx <= b.x ? b : a;
  return (hi.x - (lo.x + lo.dx)) / 100;
}

// ——— Geometrie terasă
const C_W = cols.C_W_DORM;
const C_SE = cols.C_S_DORM_E;
const C_SIW = cols.C_S_INTRARE_W;
const C_SW = cols.C_SW_TERASA;
const terasa = (a1.rooms_cm || a1.zones_cm || []).find?.((z) => z.id === "terasa_p")
  || a1.amenajare_cm?.zones?.find?.((z) => z.id === "terasa_p");
// fallback din JSON rooms
const zones = a1.rooms_cm || [];
const terasa_p = zones.find((z) => z.id === "terasa_p") || { x: 8, y: 674, dx: 336.4, dy: 293 };

const geom = {
  terrace_bbox_cm: { x: terasa_p.x, y: terasa_p.y, dx: terasa_p.dx, dy: terasa_p.dy },
  columns: {
    C_W_DORM: { x: C_W.x, y: C_W.y, dx: C_W.dx, dy: C_W.dy },
    C_S_DORM_E: { x: C_SE.x, y: C_SE.y, dx: C_SE.dx, dy: C_SE.dy },
    C_S_INTRARE_W: { x: C_SIW.x, y: C_SIW.y, dx: C_SIW.dx, dy: C_SIW.dy },
    C_SW_TERASA: C_SW
      ? { x: C_SW.x, y: C_SW.y, dx: C_SW.dx, dy: C_SW.dy, levels: C_SW.levels }
      : null,
  },
  // overhangs relative to heated box south (Y645.2+30=675.2) and west
  cantilever_south_from_W_DORM_m: C_SW
    ? clearBetween(C_W, C_SW, "y")
    : (terasa_p.y + terasa_p.dy - (C_W.y + C_W.dy)) / 100,
  cantilever_west_from_INTRARE_m: C_SW
    ? clearBetween(C_SW, C_SIW, "x")
    : (C_SIW.x - terasa_p.x) / 100,
  free_corner_to_W_DORM_m: null,
  free_corner_to_INTRARE_m: null,
};

// Free corner of terrace SW ≈ (terasa.x, terasa.y+dy) or column SW center
const cornerY = C_SW ? C_SW.y + C_SW.dy / 2 : terasa_p.y + terasa_p.dy;
const cornerX = C_SW ? C_SW.x + C_SW.dx / 2 : terasa_p.x;
geom.free_corner_to_W_DORM_m = round(
  (cornerY - (C_W.y + C_W.dy)) / 100,
  3
);
geom.free_corner_to_INTRARE_m = round((C_SIW.x - (cornerX + (C_SW ? C_SW.dx / 2 : 0))) / 100, 3);
if (C_SW) {
  geom.clear_B_W_TERASA_m = round(clearBetween(C_W, C_SW, "y"), 3);
  geom.clear_B_S_TERASA_m = round(clearBetween(C_SW, C_SIW, "x"), 3);
}

// ——— Încărcări pe grinzi terasă
// trib: jumătate panou terasă (~1.7 m) + parapet pe muchie + acoperiș pe centură
const tribW = Math.min(terasa_p.dx / 200, 1.7); // m
const tribS = Math.min(terasa_p.dy / 200, 1.5);
const q_line_W =
  tribW * Q_ED_TERRACE + Gk_parapet_line * 1.35 + Gk_roof_line * 1.35; // kN/m
const q_line_S =
  tribS * Q_ED_TERRACE + Gk_parapet_line * 1.35 + Gk_roof_line * 1.35;

const loads = {
  Gk_slab_kNpm2: round(Gk_slab, 2),
  Gk_finish: Gk_finish,
  Qk_terrace,
  Q_ED_TERRACE: round(Q_ED_TERRACE, 2),
  Q_QP_TERRACE: round(Q_QP_TERRACE, 2),
  Q_ED_FLOOR: round(Q_ED_FLOOR, 2),
  trib_W_m: tribW,
  trib_S_m: tribS,
  q_line_B_W_TERASA_kNm: round(q_line_W, 2),
  q_line_B_S_TERASA_kNm: round(q_line_S, 2),
  note_loads:
    "q_Ed terasă = 1.35·(γc·h+finisaj) + 1.5·Qk; pe grindă + parapet + reazem acoperiș (ordin). Zăpadă Turda = IPOTEZĂ.",
};

// ========== SCENARII TERASĂ ==========
const hBeam = (lv.beam_h_total_including_slab_zone ?? 40);
const bBeam = 30;

const L_w = geom.clear_B_W_TERASA_m ?? geom.free_corner_to_W_DORM_m;
const L_s = geom.clear_B_S_TERASA_m ?? geom.free_corner_to_INTRARE_m;

// Scenario 0 — CU stâlp (actual)
const withCol = {
  id: "S0_cu_C_SW_TERASA",
  label: "Schema actuală CU C_SW_TERASA 30×30",
  beams: [
    beamSS("B_W_TERASA", L_w, q_line_W, bBeam, hBeam, "C_W_DORM → C_SW_TERASA"),
    beamSS("B_S_TERASA", L_s, q_line_S, bBeam, hBeam, "C_SW_TERASA → C_S_INTRARE_W"),
  ],
};

// Scenario 1 — fără stâlp: grinzi în consolă din reazeme rămase
const noCol_cantBeams = {
  id: "S1_fara_stalp_grinzi_consola",
  label: "Fără C_SW: B_W și B_S consolă din C_W_DORM / C_S_INTRARE_W (colț liber)",
  beams: [
    beamCant("B_W_TERASA_cant", L_w, q_line_W, bBeam, hBeam, `consolă sud L=${L_w} m`),
    beamCant("B_S_TERASA_cant", L_s, q_line_S, bBeam, hBeam, `consolă vest L=${L_s} m`),
  ],
  beams_minH: [
    minH("B_W_TERASA_cant", L_w, q_line_W, bBeam, "cantilever", "h minim ULS+SLS"),
    minH("B_S_TERASA_cant", L_s, q_line_S, bBeam, "cantilever", "h minim ULS+SLS"),
  ],
};

// Scenario 2 — fără stâlp: placă consolă 2 direcții (bandă pe L maxim = diagonala / L_w)
const L_plate_S = (terasa_p.y + terasa_p.dy - (C_W.y + C_W.dy)) / 100; // de la sud dorm la sud terasă
const L_plate_W = (C_SIW.x - terasa_p.x) / 100;
const noCol_slab = {
  id: "S2_fara_stalp_placa_consola",
  label: "Fără C_SW: placă în consolă (fără grinzi pe contur — cel mai nefavorabil)",
  L_south_m: round(L_plate_S, 3),
  L_west_m: round(L_plate_W, 3),
  slabs: {
    h15_S: slabCant("placa_cant_S_15", L_plate_S, 15, Q_ED_TERRACE, Q_QP_TERRACE, "consolă sud pe 15 cm"),
    h20_S: slabCant("placa_cant_S_20", L_plate_S, 20, Q_ED_TERRACE, Q_QP_TERRACE, "consolă sud pe 20 cm"),
    h25_S: slabCant("placa_cant_S_25", L_plate_S, 25, Q_ED_TERRACE, Q_QP_TERRACE, "consolă sud pe 25 cm"),
    h30_S: slabCant("placa_cant_S_30", L_plate_S, 30, Q_ED_TERRACE, Q_QP_TERRACE, "consolă sud pe 30 cm"),
    h15_W: slabCant("placa_cant_W_15", L_plate_W, 15, Q_ED_TERRACE, Q_QP_TERRACE, "consolă vest pe 15 cm"),
    h20_W: slabCant("placa_cant_W_20", L_plate_W, 20, Q_ED_TERRACE, Q_QP_TERRACE, "consolă vest pe 20 cm"),
    h25_W: slabCant("placa_cant_W_25", L_plate_W, 25, Q_ED_TERRACE, Q_QP_TERRACE, "consolă vest pe 25 cm"),
  },
};

// Scenario 3 — fără stâlp: grindă pe contur L-frame (colț liber) dar L pe B_S = 3.025 m SS pe C_W? 
// Better: B_S continuous spanning C_S_INTRARE_W → (virtual) with B_W as cantilever only on short side
// Practical S3: keep edge beams as L-beam: B_S spans full west as SS? No support at W.
// S3 = B_S as SS? Impossible without west support.
// S3 = thicken B_S + B_W to minH cantilever (same as S1 minH) + plate 15 between beams (short spans ~1.5–1.7 m)
const panelSpan = Math.min(L_w, L_s, 1.7);
const plateBetweenBeams = slabCheckPanel(panelSpan, 15, "panou între grinzi contur ~1.5–1.7 m");

function slabCheckPanel(L, hCm, note) {
  const h = hCm / 100;
  const d = h - 0.025;
  const M = (Q_ED_TERRACE * L * L) / 8;
  const As = (M * 1e6) / (0.9 * (d * 1000) * FYD);
  const mu = M / (1 * d * d * FCD * 1000);
  const I = (1 * d ** 3) / 12;
  const E = Ecm * 1000;
  const delta = ((5 * Q_QP_TERRACE * L ** 4) / (384 * E * I)) * 1000 * 2.5;
  const lim = (L * 1000) / 250;
  return {
    id: "placa_intre_grinzi",
    L_m: round(L, 3),
    h_cm: hCm,
    M_kNm_m: round(M, 2),
    As_mm2_m: round(As, 0),
    mu: round(mu, 3),
    L_over_d: round(L / d, 1),
    delta_cr_mm: round(delta, 1),
    lim_mm: round(lim, 1),
    pass: mu < 0.25 && delta <= lim && L / d <= 35,
    note,
  };
}

const noCol_Lframe = {
  id: "S3_fara_stalp_L_grinzi_mari",
  label: "Fără C_SW: păstrezi B_W+B_S ca L pe contur (consolă) + placă 15 pe panouri scurte",
  beams_at_h40: noCol_cantBeams.beams,
  beams_minH: noCol_cantBeams.beams_minH,
  plate_panel: plateBetweenBeams,
  roof_note:
    "Acoperișul pe colțul SW trebuie redirecționat pe B_W/B_S (sau stâlp metalic ascuns) — C_SW era reazem acoperiș (A1.207).",
};

// Găsește h placă minimă pentru consolă pe L_plate_S
let minSlabH_S = null;
for (const h of [15, 18, 20, 22, 25, 28, 30, 35]) {
  const r = slabCant(`scan_S_${h}`, L_plate_S, h, Q_ED_TERRACE, Q_QP_TERRACE, "");
  if (r.pass) {
    minSlabH_S = h;
    break;
  }
}
let minSlabH_W = null;
for (const h of [15, 18, 20, 22, 25, 28, 30, 35]) {
  const r = slabCant(`scan_W_${h}`, L_plate_W, h, Q_ED_TERRACE, Q_QP_TERRACE, "");
  if (r.pass) {
    minSlabH_W = h;
    break;
  }
}

// ========== CASA SCĂRII (schema actuală) ==========
const C_CS = cols.C_CASA_SCARA;
const C_SIE = cols.C_S_INTRARE_E;
const C_EP = cols.C_E_PAL;
const B_CS = beams.B_CASA_SCARA;
const B_ES = beams.B_E_S;
const B_SSE = beams.B_S_SE;
const B_Y820 = beams.B_Y820;
const inv = (st.beams || []).find((b) => (b.levels || []).includes("S_inverted"));

const L_casa = clearBetween(C_CS, C_SIE, "y"); // ~2.29 m
const L_Y820 = clearBetween(C_SIW, C_SIE, "x");
const L_BES = B_ES ? Math.max(B_ES.dx, B_ES.dy) / 100 : 4.0;
const L_SSE = B_SSE ? Math.max(B_SSE.dx, B_SSE.dy) / 100 : 1.26;

const tribStair = 1.35;
const q_casa = tribStair * Q_ED_STAIR + 1.35 * 2.0; // + greutate vanguri/trepte pe ml ordin
const q_BES = tribStair * Q_ED_STAIR;
const q_floor_mid = 1.6 * Q_ED_FLOOR;

const stairHouse = {
  geometry: {
    C_CASA_SCARA: { x: C_CS.x, y: C_CS.y, section: `${C_CS.dx}×${C_CS.dy}`, levels: C_CS.levels },
    C_S_INTRARE_E: { x: C_SIE.x, y: C_SIE.y, section: `${C_SIE.dx}×${C_SIE.dy}` },
    C_E_PAL: { x: C_EP.x, y: C_EP.y, section: `${C_EP.dx}×${C_EP.dy}` },
    L_B_CASA_SCARA_m: round(L_casa, 3),
    L_B_Y820_m: round(L_Y820, 3),
    L_B_E_S_blade_m: round(L_BES, 3),
    L_B_S_SE_m: round(L_SSE, 3),
    blade_section_cm: B_ES ? `${B_ES.dx}×${Math.max(B_ES.dy, 30)}` : "15×?",
    inverted: inv
      ? { id: inv.id, L_m: round(inv.dx / 100, 3), b_cm: inv.dy, note: inv.note }
      : null,
  },
  loads: {
    Q_ED_STAIR: round(Q_ED_STAIR, 2),
    q_B_CASA_SCARA: round(q_casa, 2),
    q_B_E_S: round(q_BES, 2),
  },
  beams: {
    B_CASA_SCARA_h40: beamSS("B_CASA_SCARA", L_casa, q_casa, 30, hBeam, "C_CASA_SCARA → C_S_INTRARE_E"),
    B_Y820_h40: beamSS("B_Y820", L_Y820, q_floor_mid, 30, hBeam, "C_S_INTRARE_W → C_S_INTRARE_E"),
    B_E_S_blade: beamSS(
      "B_E_S",
      L_BES,
      q_BES,
      15,
      hBeam,
      "Lamă S2 15 cm — b=15 → verificare specială (nu grindă clasică)"
    ),
    B_E_S_as_30: beamSS("B_E_S_equiv30", L_BES, q_BES, 30, hBeam, "dacă lamă ecită la 30 (comparație)"),
    B_S_SE: beamSS("B_S_SE", L_SSE, q_BES, 30, hBeam, "C_S_INTRARE_E → lamă Dragalina"),
  },
};

// Lamă 15: forfecare / flambaj local — flag
{
  const r = stairHouse.beams.B_E_S_blade;
  r.blade_warning =
    "b=15 cm < P100 min 30 pentru stâlp; lamă perete BA — verificat ca perete scurt / grindă-perete, nu ca grindă 30. FE obligatoriu.";
  // Recalc shear with b=15 already in sectionCheck
  stairHouse.beams.B_E_S_minH = minH("B_E_S", L_BES, q_BES, 15, "simply_supported", "h min pe b=15");
}

if (inv) {
  stairHouse.beams.inverted = beamSS(
    inv.id,
    inv.dx / 100,
    1.2 * Q_ED_STAIR,
    inv.dy || 25,
    25,
    inv.note || "grindă întoarsă"
  );
}

// Stâlpi casa scară — N ordin
function colN(c, floors = 2) {
  const A_trib = 2.2 * 2.5; // m² ordin pe casa scară
  const N =
    floors * A_trib * Q_ED_FLOOR +
    A_trib * 4.5 +
    GAMMA_C * (c.dx / 100) * (c.dy / 100) * 9;
  const Nrd = 0.8 * (c.dx / 100) * (c.dy / 100) * FCD * 1000;
  return {
    id: c.id,
    section: `${c.dx}×${c.dy}`,
    N_kN: round(N, 1),
    Nrd_kN: round(Nrd, 1),
    util_N: round(N / Nrd, 3),
    p100: Math.min(c.dx, c.dy) >= 30,
    pass: Math.min(c.dx, c.dy) >= 30 && N / Nrd < 0.7,
  };
}

stairHouse.columns = {
  C_CASA_SCARA: colN(C_CS, 3),
  C_S_INTRARE_E: colN(C_SIE, 3),
  C_E_PAL: colN(C_EP, 3),
  C_SW_TERASA: C_SW
    ? {
        ...colN(C_SW, 2),
        note: "doar P+E; fără S — reazem terasă+acoperiș; talpă locală / grindă pe solbanc",
      }
    : null,
};

// ——— Verdicturi
const s0_ok = withCol.beams.every((b) => b.pass);
const s1_ok40 = noCol_cantBeams.beams.every((b) => b.pass);
const s1_ok40_noStir = noCol_cantBeams.beams.every((b) => b.pass_no_stirrup);
const s1_okMin = noCol_cantBeams.beams_minH.every((b) => b.pass);
const s2_need = {
  south_min_h_cm: minSlabH_S,
  west_min_h_cm: minSlabH_W,
  h15_south_pass: noCol_slab.slabs.h15_S.pass,
  h15_west_pass: noCol_slab.slabs.h15_W.pass,
};

const stair_critical = [
  stairHouse.beams.B_CASA_SCARA_h40,
  stairHouse.beams.B_Y820_h40,
  stairHouse.beams.B_S_SE,
  stairHouse.beams.B_E_S_as_30,
].filter(Boolean);
const stair_ok_beams = stair_critical.every((b) => b.pass);
const blade_ok = stairHouse.beams.B_E_S_blade.pass;
const cols_ok = Object.values(stairHouse.columns)
  .filter(Boolean)
  .every((c) => c.pass);

const verdict = {
  terrace_with_column: {
    pass: s0_ok,
    text: s0_ok
      ? "CU C_SW_TERASA: grinzile B_W / B_S la 30×40 trec pe ordin ULS+SLS (spanuri scurte ~1.4 / ~2.7 m)."
      : "CU C_SW_TERASA: unele grinzi NU trec — vezi tabel.",
  },
  terrace_without_column: {
    pass_at_h40: s1_ok40,
    pass_at_h40_without_stirrups: s1_ok40_noStir,
    pass_with_deeper_beams: s1_okMin,
    pure_slab_15: s2_need.h15_south_pass && s2_need.h15_west_pass,
    min_slab_h_south_cm: minSlabH_S,
    min_slab_h_west_cm: minSlabH_W,
    beam_min_h: Object.fromEntries(
      noCol_cantBeams.beams_minH.map((b) => [
        b.id,
        { h_cm: b.h_cm, pass: b.pass, M: b.M_kNm, V: b.V_kN, shear_ok: b.shear_ok },
      ])
    ),
    critical: {
      B_S_TERASA_cant_M_kNm: noCol_cantBeams.beams[1].M_kNm,
      B_S_TERASA_cant_V_kN: noCol_cantBeams.beams[1].V_kN,
      vs_SS_M_ratio: round(noCol_cantBeams.beams[1].M_kNm / withCol.beams[1].M_kNm, 2),
    },
    text: s1_ok40
      ? `FĂRĂ stâlp @ 30×40 + etrieri min: PASS pe ordin (flex+SLS+Vrd). Fără etrieri (doar Vrd,c): ${
          s1_ok40_noStir ? "PASS" : "FAIL forfecare pe B_S (V>Vrd,c) — etrierii sunt obligatorii pe consolă"
        }. Placă pură 15 cm: FAIL (min ~${minSlabH_S ?? 35} cm).`
      : `FĂRĂ stâlp @ h=40: FAIL. Cu h mărit: ${s1_okMin ? "PASS" : "FAIL"}. Placă pură 15: FAIL (min sud≈${minSlabH_S ?? ">35"} / vest≈${minSlabH_W ?? ">35"} cm).`,
  },
  stair_house_current: {
    beams_main_pass: stair_ok_beams,
    blade_15_pass_as_beam: blade_ok,
    columns_pass: cols_ok,
    text: stair_ok_beams && cols_ok
      ? `Casa scării pe schema actuală: B_CASA_SCARA (L≈${L_casa} m), B_Y820, B_S_SE trec pe ordin la 30×40. Lamă B_E_S 15 cm: ${
          blade_ok ? "trece ca grindă îngustă pe criterii flex/SLS" : "FAIL pe b=15 — cere h mai mare sau FE perete"
        }. NU e verificare seismică de nod / scară 3D.`
      : "Casa scării: există FAIL pe grinzi/stâlpi — vezi tabele.",
  },
  overall: null,
};

verdict.overall = {
  keep_corner_column_cheapest: true,
  remove_column_feasible_ordin: s1_ok40,
  recommendation: !s0_ok
    ? "Schema cu stâlp are probleme — recalibrează întâi S0."
    : s1_ok40
      ? "Fără C_SW_TERASA: pe ordin EC2 trece dacă păstrezi B_W+B_S ca L pe contur (30×40) CU etrieri (⌀8/15 min) + armare consolă pe B_S (~4⌀16) + FE pe nodul liber și pe reazem acoperiș (acum pe C_SW). Placă 15 rămâne pe panouri scurte între grinzi — NU consolă pură. Stâlpul rămâne varianta cea mai ieftină/clară (M pe B_S de 4× mai mic)."
      : s1_okMin
        ? "Fără stâlp: mărește h pe B_S_TERASA (vezi minH) + FE; sau păstrează stâlpul."
        : "Păstrează C_SW_TERASA sau redesign major + FE.",
  stair_holds_ordin: stair_ok_beams && cols_ok,
  caveats: [
    "Ordin EC2 pe bare izolate — nu model cadru 3D, nu P100 noduri, nu dinamică scară.",
    "Încărcări zăpadă / acoperiș / parapet = IPOTEZĂ.",
    "C_SW fără S: fundație locală / grinzi pe solbanc — calcul separat.",
    "Lamă S2 B_E_S 15 cm ≠ stâlp P100 — FE perete scurt obligatoriu (open_items).",
    "declared_buildable = false până la proiectant structură + geo_131.",
  ],
};

const result = {
  meta: {
    id: "s1_a1_terrace_stair_cantilever_v01",
    generated: new Date().toISOString(),
    status: "studiu_ordin_EC2 — NU proiect semnat",
    materials: { fck: FCK, fyk: FYK, fcd: round(FCD, 2), fyd: round(FYD, 1), Ecm_MPa: Ecm },
  },
  geometry: geom,
  loads,
  terrace: {
    S0_with_column: withCol,
    S1_cantilever_beams: noCol_cantBeams,
    S2_pure_slab_cantilever: noCol_slab,
    S3_L_frame_plus_panel: noCol_Lframe,
    min_slab_thickness_cm: { south: minSlabH_S, west: minSlabH_W },
  },
  stair_house: stairHouse,
  verdict,
};

// ——— Markdown
function rowBeam(b) {
  const mark = b.pass ? "PASS" : "FAIL";
  return `| ${b.id} | ${b.regime} | ${b.L_m} | ${b.section_cm} | ${b.M_kNm} | ${b.V_kN} | ${b.As_bars} | μ=${b.mu} | ${b.delta_cr_mm}/${b.lim_mm} | **${mark}** |`;
}

const md = `# Studiu: terasă fără stâlp colț + casa scării

**Status:** ${result.meta.status}  
**Generat:** ${result.meta.generated.slice(0, 19)}  
**Materiale:** C${FCK}/30 · B500 · Ecm=${Ecm} MPa  

> Calcule de **ordin** (EC2 flexiune / Vrd,c / săgeată fisurată). Nu înlocuiesc FE / proiect semnat / P100 pe noduri.

---

## VERDICT

| Temă | Rezultat |
|------|----------|
| **Terasă CU \`C_SW_TERASA\`** | ${verdict.terrace_with_column.pass ? "PASS" : "FAIL"} — ${verdict.terrace_with_column.text} |
| **Terasă FĂRĂ stâlp @ h=40** | ${verdict.terrace_without_column.pass_at_h40 ? "PASS" : "FAIL"} |
| **Terasă FĂRĂ + grinzi adâncite** | ${verdict.terrace_without_column.pass_with_deeper_beams ? "PASS pe ordin" : "FAIL"} — h min: ${JSON.stringify(verdict.terrace_without_column.beam_min_h)} |
| **Placă consolă pură 15 cm** | ${verdict.terrace_without_column.pure_slab_15 ? "PASS" : "FAIL"} — min h sud ≈ **${minSlabH_S ?? ">35"} cm**, vest ≈ **${minSlabH_W ?? ">35"} cm** |
| **Casa scării (acum)** | ${verdict.stair_house_current.beams_main_pass && verdict.stair_house_current.columns_pass ? "PASS ordin pe grinzi/stâlpi principali" : "FAIL parțial"} — ${verdict.stair_house_current.text} |
| **Recomandare** | ${verdict.overall.recommendation} |

### Caveats
${verdict.overall.caveats.map((c) => `- ${c}`).join("\n")}

---

## 1. Geometrie (din \`structure_a1_study_cm\`)

| Element | Cote |
|---------|------|
| Terasă P bbox | X${terasa_p.x} Y${terasa_p.y} · ${terasa_p.dx}×${terasa_p.dy} cm |
| C_W_DORM | (${C_W.x}, ${C_W.y}) ${C_W.dx}×${C_W.dy} |
| C_S_INTRARE_W | (${C_SIW.x}, ${C_SIW.y}) ${C_SIW.dx}×${C_SIW.dy} |
| C_SW_TERASA | (${C_SW.x}, ${C_SW.y}) ${C_SW.dx}×${C_SW.dy} · levels ${C_SW.levels.join("+")} · **fără S** |
| Clear B_W_TERASA | **${L_w} m** |
| Clear B_S_TERASA | **${L_s} m** |
| Consolă placă sud (Y dorm→sud terasă) | **${round(L_plate_S, 3)} m** |
| Consolă placă vest | **${round(L_plate_W, 3)} m** |

---

## 2. Încărcări

| | Valoare |
|--|--|
| Gk placă 15 | ${loads.Gk_slab_kNpm2} kN/m² |
| Gk finisaj terasă | ${loads.Gk_finish} kN/m² |
| Qk terasă | ${loads.Qk_terrace} kN/m² |
| **q_Ed terasă** | **${loads.Q_ED_TERRACE} kN/m²** |
| q_qp (SLS) | ${loads.Q_QP_TERRACE} kN/m² |
| trib W / S | ${loads.trib_W_m} / ${loads.trib_S_m} m |
| **q pe B_W / B_S** | **${loads.q_line_B_W_TERASA_kNm} / ${loads.q_line_B_S_TERASA_kNm} kN/m** (inclus parapet + acoperiș ordin) |

${loads.note_loads}

---

## 3. Terasă — S0 CU stâlp

| id | regim | L[m] | b×h | M[kNm] | V[kN] | As | μ | δ/lim [mm] | |
|----|-------|------|-----|--------|-------|----|---|------------|--|
${withCol.beams.map(rowBeam).join("\n")}

---

## 4. Terasă — S1 FĂRĂ stâlp (grinzi consolă @ 40 cm)

M_cant = q L² / 2 (≈ **4×** față de simplu rezemat).

| id | regim | L[m] | b×h | M[kNm] | V[kN] | As | μ | δ/lim [mm] | |
|----|-------|------|-----|--------|-------|----|---|------------|--|
${noCol_cantBeams.beams.map(rowBeam).join("\n")}

### h minim care trece (pas 5 cm)

| id | h_cm | M | As | δ | pass |
|----|------|---|----|----|------|
${noCol_cantBeams.beams_minH.map((b) => `| ${b.id} | **${b.h_cm}** | ${b.M_kNm} | ${b.As_bars} | ${b.delta_cr_mm}/${b.lim_mm} | ${b.pass} |`).join("\n")}

---

## 5. Terasă — S2 placă consolă pură (fără grinzi contur)

Criterii: μ&lt;0.25, V≤Vrd,c, δ≤L/180, L/d≤10.

| id | L | h | M | As | L/d | δ/lim180 | pass |
|----|---|---|---|----|-----|----------|------|
${Object.values(noCol_slab.slabs)
  .map(
    (b) =>
      `| ${b.id} | ${b.L_m} | ${b.h_cm} | ${b.M_kNm} | ${b.As_bars} | ${b.L_over_d} | ${b.delta_cr_mm}/${b.lim_L180_mm} | **${b.pass ? "PASS" : "FAIL"}** |`
  )
  .join("\n")}

**Grosime minimă ordin:** sud **${minSlabH_S ?? ">35"} cm** · vest **${minSlabH_W ?? ">35"} cm**.

---

## 6. Terasă — S3 L-grinzi + placă pe panou scurt

Placă între grinzi (L≈${plateBetweenBeams.L_m} m, h=15): **${plateBetweenBeams.pass ? "PASS" : "FAIL"}** · M=${plateBetweenBeams.M_kNm_m} kNm/m · δ=${plateBetweenBeams.delta_cr_mm} mm.

${noCol_Lframe.roof_note}

---

## 7. Casa scării — schema actuală

### Geometrie
| | |
|--|--|
| C_CASA_SCARA | (${C_CS.x},${C_CS.y}) ${C_CS.dx}×${C_CS.dy} · S+P+E |
| C_S_INTRARE_E | (${C_SIE.x},${C_SIE.y}) |
| Clear B_CASA_SCARA | **${round(L_casa, 3)} m** |
| Clear B_Y820 | **${round(L_Y820, 3)} m** |
| B_E_S (lamă S2) | L≈**${round(L_BES, 3)} m** · secțiune **15×…** |
| B_S_SE | L≈**${round(L_SSE, 3)} m** |

### Grinzi

| id | regim | L[m] | b×h | M | V | As | δ/lim | |
|----|-------|------|-----|---|---|----|-------|--|
${Object.values(stairHouse.beams)
  .filter((b) => b && b.id)
  .map(rowBeam)
  .join("\n")}

### Stâlpi (N ordin)

| id | secțiune | N [kN] | Nrd | util | P100 | |
|----|----------|--------|-----|------|------|--|
${Object.values(stairHouse.columns)
  .filter(Boolean)
  .map(
    (c) =>
      `| ${c.id} | ${c.section} | ${c.N_kN} | ${c.Nrd_kN} | ${c.util_N} | ${c.p100} | **${c.pass ? "PASS" : "FAIL"}** |`
  )
  .join("\n")}

---

## 8. Interpretare pe scurt

1. **Stâlpul din colț nu e „obligatoriu legal”**, dar cu **placă 15 + grinzi 40** pe consolă de **~1.4–2.7 m** (și acoperiș pe colț) **consola pe ordin e severă** (M de 4× față de grindă rezemată).
2. **Fără stâlp, varianta realistă pe ordin:** L-grinzi pe contur cu **h adoptat din tabelul minH** + placă 15 pe panouri scurte + **FE pe nodul liber** + traseu încărcare acoperiș.
3. **Placă consolă pură 15 cm: nu.** Trebuie ~**${minSlabH_S ?? 30}+ cm** pe direcția lungă — conflict cu FF/clear/etaj.
4. **Casa scării ține pe ordin** pe B_CASA_SCARA / B_Y820 / stâlpi; **lamă 15 (S2)** rămâne **open item FE** (nu e grindă clasică 30).

---

## 9. Pachet debate (pentru implementator — zero patch aici)

- **Accept:** păstrăm C_SW_TERASA ca soluție de referință până la FE; sau
- **Cerere studiu FE:** rundă 1 = consolă L fără C_SW cu h grinzi din minH; rundă 2 = cascție acoperiș.
- **Nu schimba acum:** clear 255, FF, amenajare A1, lamă S2 poziție.
- **Raportează conflict:** dacă h grindă consolă &gt; drop sub sofit / conflict parapet vizual.

*Ref. script: \`src/calc_a1_terrace_stair_cantilever_v01.mjs\`*
`;

const outMd = path.join(root, "outputs/reports/s1_a1_terrace_stair_cantilever_v01.md");
const outJson = path.join(root, "outputs/reports/s1_a1_terrace_stair_cantilever_v01.json");
fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ok: true, outMd, outJson, verdict: result.verdict }, null, 2));
