/**
 * Variantă SEPARATĂ de studiu: casă pe CADRE BA (stâlpi + grinzi),
 * umplutură EB20 Akustik + vată 80 mm. Nu pereți structurali P/E.
 * Nu modifică varianta A1 aprobată (amenajare); produce livrabile overlay/tabel/secțiuni.
 *
 * Usage: node src/study_v47_frame_schema.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const write = (rel, obj) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
};
const writeText = (rel, text) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
  return p;
};

const REF_USEFUL = 37.0; // prag m²
const ETICS = 9.2;
/** Studiu preliminar: min. beton pe direcție transversală perete ≈30 cm (P100 — aplicabilitate de confirmat). */
const COL_THRU = 30;
const COL_ALONG = 40;
/** Proeminență locală spre interior față de fața finită interioară a peretelui 30 cm. */
const PROTRUSION_IN = 10;
/**
 * Grindă totală 35 cm = înălțime totală incluzând zona plăcii (nu coborâre suplimentară 35 sub placă).
 * Intrados grindă = față_sup_placă − 35 = 308 − 35 = 273.
 */
const BEAM_H_TOTAL = 35;
const SLAB_TH = 15;
const FLOOR_BUILDUP = 12;
const FF_PARTER = 32;
const FF_ETAJ = FF_PARTER + 288; // 320
const SLAB_TOP_ETAJ = FF_ETAJ - FLOOR_BUILDUP; // 308
const SLAB_SOFFIT_ETAJ = SLAB_TOP_ETAJ - SLAB_TH; // 293
const BEAM_SOFFIT_P = SLAB_TOP_ETAJ - BEAM_H_TOTAL; // 273
const CLEAR_P_UNDER_BEAM = BEAM_SOFFIT_P - FF_PARTER; // 241
/** Grindă întoarsă la muchia beciului: în pachetul −30…+32, fără coborâre sub −30 pe clarul ușii. */
const INVERTED_BEAM = {
  x: 565,
  y: 575,
  dx: 115,
  dy: 15,
  z0_cm: -30,
  z1_cm: -5,
  note: "variantă studiu: grindă întoarsă deasupra intrados −30; eliberează clear acces; încape în sandwich? — calcul",
};

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function shoelaceM2(verts) {
  let a = 0;
  for (let i = 0; i < verts.length - 1; i++) {
    a += verts[i][0] * verts[i + 1][1] - verts[i + 1][0] * verts[i][1];
  }
  return Math.abs(a) / 2 / 10000;
}

function rectAreaM2(r) {
  return (r.dx * r.dy) / 10000;
}

/**
 * Stâlp pe fațadă est: beton 30 cm + ~10 cm proeminență spre interior (X640–670).
 * Nu intră în clarul scară X565–665 dacă Y1 ≤ 590.
 */
function colEst(id, y, dy, extra = {}) {
  return {
    id,
    x: 650 - PROTRUSION_IN,
    y,
    dx: COL_THRU,
    dy,
    orient: "along_E",
    levels: ["S", "P", "E"],
    support_below: "fundație_E",
    protrusion_into_room_cm: PROTRUSION_IN,
    section_cm: `${COL_THRU}×${COL_ALONG}`,
    section_status: "de confirmat prin calcul și cerințe normative (P100 — aplicabilitate pe sistem/ductilitate)",
    ...extra,
  };
}

function colVest(id, y, dy, extra = {}) {
  return {
    id,
    x: ETICS,
    y,
    dx: COL_THRU,
    dy,
    orient: "along_W",
    levels: ["S", "P", "E"],
    support_below: "fundație_W",
    protrusion_into_room_cm: PROTRUSION_IN,
    section_cm: `${COL_THRU}×${COL_ALONG}`,
    section_status: "de confirmat prin calcul și cerințe normative",
    ...extra,
  };
}

/**
 * Stâlpi sud: beton se oprește înaintea benzii ETICS exterioare (~9,2 cm),
 * cu proeminență locală spre interior. Fața exterioară a peretelui finit rămâne liberă pentru vată.
 */
function colSud(id, x, dx, wallY0, exteriorY1, extra = {}) {
  const y1Concrete = exteriorY1 - ETICS; // lasă banda ETICS afară
  const y0 = y1Concrete - COL_THRU; // COL_THRU spre interior (= proeminență + falie)
  return {
    id,
    x,
    y: y0,
    dx,
    dy: COL_THRU,
    orient: "along_S",
    levels: ["S", "P", "E"],
    support_below: "fundație_S",
    protrusion_into_room_cm: Math.max(0, wallY0 - y0),
    etics_outside_band_cm: { y0: y1Concrete, y1: exteriorY1, th: ETICS },
    section_cm: `${COL_THRU}×${COL_ALONG}`,
    section_status: "de confirmat prin calcul și cerințe normative",
    ...extra,
  };
}

/** Stâlpi — secțiuni preliminare 30×40 cu îngroșare locală; ETICS continuă afară. */
function buildFrameSchema() {
  const ax = {
    X_W: ETICS,
    X_CASA_SCARA: 535,
    X_E: 650,
    X_DORM_E: 360,
    Y_N: ETICS,
    Y_N_MID: 9.2,
    Y_PAL_N: 470,
    /** Capăt sud C_E_PAL: rezervă finisaj 1 cm N de palier Y490 — NU pe Y490–600. */
    Y_E_PAL_END: 489,
    Y_LANDING_N: 490,
    Y_LANDING_S: 600,
    Y_DOOR_END: 600,
    Y_CASA_AFTER_DOOR: 610,
    Y_DORM_S: 645,
    Y_DORM_S_EXT: 675,
    Y_INTRARE_S: 830,
    Y_INTRARE_S_EXT: 860,
  };

  const columns = [
    {
      id: "C_NW",
      x: ETICS,
      y: ETICS,
      dx: COL_ALONG,
      dy: COL_THRU,
      orient: "corner_NW",
      levels: ["S", "P", "E"],
      support_below: "fundație_N/W",
      protrusion_into_room_cm: PROTRUSION_IN,
      section_cm: `${COL_ALONG}×${COL_THRU}`,
      etics_outside_band_cm: { x0: 0, x1: ETICS, y0: 0, y1: ETICS, th: ETICS },
      wall: "colț N/W — 40×30 preliminar (NU redus pt. duș)",
      conflicts: ["duș decupat local în frame — nu micșorăm stâlpul"],
      amenajare_fix: "dus x≥50",
      continuous_through_floor: true,
    },
    {
      id: "C_N_MID",
      x: 320,
      y: ETICS,
      dx: COL_ALONG,
      dy: COL_THRU,
      orient: "along_N",
      levels: ["S", "P", "E"],
      support_below: "fundație_N",
      protrusion_into_room_cm: PROTRUSION_IN,
      wall: "nord X320–360 — rost vest de frigider_p@X360",
      conflicts: ["alternativă: fără C_N_MID (doar NW+NE) — comparație"],
      continuous_through_floor: true,
    },
    colEst("C_NE", ETICS, COL_ALONG, {
      wall: "est N de geam",
      conflicts: ["proeminență în capăt blat_tail_p — capăt mobilier adaptat"],
      etics_outside_band_cm: { x0: 670.8, x1: 680, th: ETICS },
      continuous_through_floor: true,
    }),
    colVest("C_W_MID", 400, COL_ALONG, {
      wall: "vest — 30×40 (NU redus pt. pat)",
      etics_outside_band_cm: { x0: 0, x1: ETICS, th: ETICS },
      conflicts: ["pat x≥45 în frame — rezervă montaj/tăblie"],
      amenajare_fix: "pat x≥45",
      continuous_through_floor: true,
    }),
    colSud("C_W_DORM", ETICS, COL_ALONG, ax.Y_DORM_S, ax.Y_DORM_S_EXT, {
      wall: "sud dorm W — ETICS Y665.8–675 continuă peste stâlp",
      conflicts: ["gol terasă X120–270"],
      continuous_through_floor: true,
    }),
    colSud("C_S_DORM_E", ax.X_DORM_E - COL_THRU, COL_THRU, ax.Y_DORM_S, ax.Y_DORM_S_EXT, {
      orient: "corner_S_dorm_E",
      wall: "capăt E sud dorm @ X360 — ETICS continuă afară",
      conflicts: ["proximitate circulație / ușă terasă"],
      continuous_through_floor: true,
    }),
    colEst("C_E_GEAM_S", 310, COL_ALONG, {
      wall: "est S de geam",
      etics_outside_band_cm: { x0: 670.8, x1: 680, th: ETICS },
      continuous_through_floor: true,
    }),
    colEst("C_E_PAL", ax.Y_E_PAL_END - COL_ALONG, COL_ALONG, {
      wall: "est sub vestibul / N de palier inferior",
      support_below: "fundație_E continuu — NU pe placă 15",
      replaces: ["pal_ne", "C_E_SOLID_N@Y550"],
      conflicts: ["proeminență pe palier etaj Y470–489 — recalcul lățime utilă"],
      clear_landing: "y1=489 ≤ lower_landing Y490",
      etics_outside_band_cm: { x0: 670.8, x1: 680, th: ETICS },
      continuous_through_floor: true,
    }),
    {
      id: "C_CASA_SCARA",
      x: ax.X_CASA_SCARA,
      y: ax.Y_CASA_AFTER_DOOR,
      dx: COL_THRU,
      dy: COL_ALONG,
      orient: "along_separator",
      levels: ["S", "P", "E"],
      support_below: "fundație X535",
      protrusion_into_room_cm: 0,
      etics_cold_band_cm: {
        x0: 565,
        x1: 565 + ETICS,
        th: ETICS,
        note: "vată pe fața rece scară; beton doar în falie X535–565",
      },
      wall: "separator X535–565; fără proeminență vest (eliberează frigider/MSV etaj)",
      replaces: ["C_CASA_SCARA@X525", "buc_y590"],
      conflicts: [],
      door_clearance: "y0=610 ≥ door Y1=600 + 10",
      continuous_through_floor: true,
    },
    {
      id: "C_SHAFT_E_PIER",
      x: 665,
      y: 575,
      dx: 15,
      dy: 15,
      orient: "pier_E_shaft",
      levels: ["S"],
      support_below: "diafragmă est puț",
      protrusion_into_room_cm: 0,
      wall: "pier sub capăt E grindă întoarsă — în zid, nu în clar X565–665",
      role: "reazem_vertical_grinda_intoarsa_E",
      conflicts: [],
    },
    colSud("C_S_INTRARE_W", 360, COL_ALONG, ax.Y_INTRARE_S, ax.Y_INTRARE_S_EXT, {
      wall: "sud intrare X360–535 — ETICS continuă",
      support_below: "fundație_S_intrare (bandă dedicată)",
      conflicts: [],
      continuous_through_floor: true,
    }),
    colSud("C_S_INTRARE_E", ax.X_CASA_SCARA, COL_THRU, ax.Y_INTRARE_S, ax.Y_INTRARE_S_EXT, {
      orient: "corner_S",
      wall: "sud @ X535 — ETICS continuă afară",
      conflicts: [],
      continuous_through_floor: true,
    }),
  ];

  const removed = [
    { id: "part_mid", reason: "compartimentare 12,5 — nestructural" },
    { id: "pal_nw", reason: "etaj-only peste living — interzis" },
    { id: "pal_ne", reason: "înlocuit de C_E_PAL continuu" },
    { id: "C_E_PUT@Y590", reason: "îngusta scara — eliminat" },
    {
      id: "C_E_SOLID_N@Y550",
      reason: "intra în palierul inferior; rol pe C_E_PAL N de Y490",
    },
    {
      id: "C_N_BUC@X535",
      reason:
        "suprapunere certă plită/cuptor/hotă/chiuvetă P — eliminat din grilă; B_N cu 3 reazeme (NW, N_MID, NE); repoziție în rost real = comparație viitoare",
    },
    { id: "C_CASA_SCARA@Y590", reason: "intersecta gol ușă — mutat la Y610+" },
    { id: "grinda_X320", reason: "nu pe fală compartimentare" },
    { id: "pereți_structurali_P_E", reason: "respins — doar cadre" },
    { id: "20x40_in_20cm_leaf", reason: "nu demonstrăm încadrarea în banda de 20 cm" },
  ];

  const beams = [
    {
      id: "B_N",
      x: ETICS,
      y: ETICS,
      dx: 650 - ETICS + COL_THRU,
      dy: COL_THRU,
      levels: ["P", "E"],
      supports: ["C_NW", "C_N_MID", "C_NE"],
      note: "centură N — 3 reazeme (fără C_N_BUC); deschideri de dimensionat",
    },
    {
      id: "B_W",
      x: ETICS,
      y: ETICS,
      dx: COL_THRU,
      dy: ax.Y_DORM_S_EXT - ETICS - ETICS,
      levels: ["P", "E"],
      supports: ["C_NW", "C_W_MID", "C_W_DORM"],
      note: "centură W prin nodul C_W_DORM (nu se oprește la fața nord a stâlpului)",
    },
    {
      id: "B_E",
      x: 650 - PROTRUSION_IN,
      y: ETICS,
      dx: COL_THRU,
      dy: ax.Y_E_PAL_END - ETICS,
      levels: ["P", "E"],
      supports: ["C_NE", "C_E_GEAM_S", "C_E_PAL"],
      note: "centură E până la C_E_PAL; fără stâlp pe palier/scară",
    },
    {
      id: "B_CASA_SCARA",
      x: ax.X_CASA_SCARA,
      y: ax.Y_CASA_AFTER_DOOR,
      dx: COL_THRU,
      dy: 860 - ax.Y_CASA_AFTER_DOOR,
      levels: ["S", "P", "E"],
      supports: ["C_CASA_SCARA", "C_S_INTRARE_E"],
      note: "separator Y610→sud; nod cu B_Y830",
    },
    {
      id: "B_Y590_EDGE_INVERTED",
      ...INVERTED_BEAM,
      levels: ["S_inverted"],
      supports: ["C_SHAFT_E_PIER", "placa_parter_span_to_sep", "B_SEP_AFTER_DOOR"],
      load_path:
        "E→C_SHAFT_E_PIER (zid est); W→placă parter (întoarsă) → diafragmă/separator S de ușă (B_SEP_AFTER_DOOR+C_CASA_SCARA). Ușă Y500–600 și palier Y490–600 fără stâlp.",
      note: "ansamblu muchie puț — nu etichetă via_slab goală",
    },
    {
      id: "B_SEP_AFTER_DOOR",
      x: 535,
      y: 600,
      dx: 30,
      dy: 10,
      levels: ["S", "P"],
      supports: ["zid_separator", "C_CASA_SCARA"],
      note: "buiandrug/centură S de ușă Y600–610 — preia traseul de la placa peste palier către C_CASA_SCARA; nu blochează golul",
    },
    {
      id: "B_Y645",
      x: ETICS,
      y: ax.Y_DORM_S,
      dx: ax.X_DORM_E - ETICS,
      dy: COL_THRU,
      levels: ["P", "E"],
      supports: ["C_W_DORM", "C_S_DORM_E"],
      note: "sud dorm — prin secțiunile stâlpilor de capăt",
    },
    {
      id: "B_X360_DORM_INTRARE",
      x: ax.X_DORM_E - COL_THRU,
      y: ax.Y_DORM_S,
      dx: COL_THRU + COL_ALONG,
      dy: ax.Y_INTRARE_S_EXT - ETICS - ax.Y_DORM_S,
      levels: ["P", "E"],
      supports: ["C_S_DORM_E", "C_S_INTRARE_W"],
      note: "prin secțiunea C_S_INTRARE_W (X360–400, Y820.8+) — nod complet, nu doar muchie",
    },
    {
      id: "B_Y830",
      x: 360,
      y: ax.Y_INTRARE_S,
      dx: 175 + COL_THRU,
      dy: COL_THRU,
      levels: ["P", "E"],
      supports: ["C_S_INTRARE_W", "C_S_INTRARE_E"],
      note: "sud intrare prin secțiunea C_S_INTRARE_E (X535–565), nod cu B_CASA_SCARA",
    },
    {
      id: "B_Y470_VESTIBUL_CANTILEVER",
      x: ax.X_CASA_SCARA,
      y: ax.Y_PAL_N,
      dx: 145,
      dy: COL_THRU,
      levels: ["E"],
      supports: ["C_E_PAL", "B_E"],
      note: "acoperire vestibul / consolă E — separat de placa palierului; sprijin placă palier = schemă proprie (DESCHIS)",
    },
  ];

  const conflicts = [
    {
      id: "inverted_beam_fit",
      severity: "DESCHIS_CALCUL",
      detail:
        "Ansamblu B_Y590_EDGE_INVERTED: E→C_SHAFT_E_PIER; W→placă+B_SEP_AFTER_DOOR→C_CASA_SCARA. Fit sandwich −30…+32 = calcul. Ușă/palier libere.",
      door_kept: { y0: 500, y1: 600 },
    },
    {
      id: "east_landing_span",
      severity: "DESCHIS",
      detail:
        "Un singur reazem est C_E_PAL (Y449–489). Deschidere spre sud fără stâlp pe palier/scară — de dimensionat.",
    },
    {
      id: "north_three_supports",
      severity: "COMPARATIE",
      detail:
        "C_N_BUC eliminat. C_N_MID@X320 (rost vest de frigider_p@360). B_N pe NW–N_MID–NE. Alternativa: fara N_MID.",
    },
    {
      id: "amenajare_frame_overlays",
      severity: "FRAME_ONLY",
      detail:
        "A1 aprobat neatins. In frame: dus x>=50 (C_NW 40x30); pat x>=45 (C_W_MID 30x40) — nu micsoram stalpii.",
    },
    {
      id: "column_30_protrusion_vs_37m2",
      severity: "DESCHIS",
      detail: `Proeminențe locale; util P/E = NECONFIRMAT — nu e rezervă stâlpi.`,
    },
    {
      id: "vestibule_cantilever",
      severity: "DESCHIS",
      detail: "B_Y470 = acoperire vestibul; placa palierului +320 necesită schemă de sprijin separată — neconfirmat.",
    },
    {
      id: "slab_span_without_X320",
      severity: "DESCHIS",
      detail: "Fără reazem pe compartimentarea 12,5 cm — placă/grinzi pe perimetru; grosime 15 cm neconfirmată.",
    },
    {
      id: "basement_retaining",
      severity: "SEPARAT",
      detail: "Pereți subsol retenție teren — sistem separat de cadrele P/E.",
    },
    {
      id: "p100_min_section",
      severity: "IPOTEZĂ",
      detail: "30 cm transversal = studiu preliminar P100; aplicabilitate pe sistem/ductilitate — nu validat.",
    },
    {
      id: "etics_wrap_verify",
      severity: "DESCHIS",
      detail: "ETICS peste stâlpi în model; detalii șantier neconfirmate.",
    },
  ];

  return {
    status: "STUDIU_SEPARAT corectat — neconstruibil; nu înlocuiește A1 aprobat",
    system: "cadre_beton_armat",
    fill: "EB20_Akustik_200",
    insulation: "vata_bazaltica_80_ETICS",
    declared_buildable: false,
    structural_walls_PE: false,
    axes_cm: ax,
    column_section_hypothesis_cm: {
      through_wall_cm: COL_THRU,
      along_wall_cm: COL_ALONG,
      local_protrusion_inward_cm: PROTRUSION_IN,
      finished_wall_kept_cm: 30,
      etics_continuous_outside: true,
      etics_outside_cm: ETICS,
      status: "de confirmat prin calcul și verificarea cerințelor normative",
      note: "Beton nu înlocuiește banda ETICS exterioară. Sud: stâlpi inset; vată continuă pe Y exterior.",
    },
    columns,
    beams,
    inverted_edge_beam: INVERTED_BEAM,
    removed_from_prior_grid: removed,
    conflicts_unresolved: conflicts,
    levels_cm: {
      ff_parter: FF_PARTER,
      ff_etaj: FF_ETAJ,
      floor_buildup_below_ff: FLOOR_BUILDUP,
      slab_top_etaj: SLAB_TOP_ETAJ,
      slab_th_hypothesis: SLAB_TH,
      slab_soffit_etaj: SLAB_SOFFIT_ETAJ,
      beam_h_total_including_slab_zone: BEAM_H_TOTAL,
      beam_definition: "35 cm = înălțime totală grindă (inclusiv zona plăcii), NU coborâre suplimentară 35 sub placă",
      beam_soffit_over_parter: BEAM_SOFFIT_P,
      clear_parter_under_beam_cm: CLEAR_P_UNDER_BEAM,
      note: "Placă +293→+308; grindă +273; FF +320; buildup 12. Stâlpi P+E = continui prin nod (beton până la FF etaj / mai sus); pardoseala se decupează.",
      column_continuity: "stâlpi cu levels P+E traversează placa și buildup; fără gap +293…+320",
    },
    access_clearances: {
      basement_stair_clear: { x0: 565, x1: 665, y0: 600, y1: 800 },
      lower_landing: { x0: 565, x1: 680, y0: 490, y1: 600 },
      door: { x0: 535, x1: 565, y0: 500, y1: 600 },
      C_E_PAL: { y0: 449, y1: 489, note: "N de palier (rezervă finisaj) — nu pe clar transport" },
      C_CASA_SCARA: { y0: 610, y1: 650, note: "S de ușă + rezervă" },
      C_E_SOLID_N: { removed: true, reason: "intra în palier inferior" },
    },
  };
}

function wallOnLevel(w, levelIdx) {
  if (!w.levels || !w.levels.length) return true;
  return w.levels.includes(levelIdx);
}

function intWallsNetM2(walls, openings, levelIdx) {
  let intM2 = 0;
  for (const w of walls || []) {
    if (w.kind !== "int") continue;
    if (!wallOnLevel(w, levelIdx)) continue;
    intM2 += rectAreaM2(w);
  }
  let voidM2 = 0;
  for (const o of openings || []) {
    if (!["baie_usa", "dorm_usa"].includes(o.id)) continue;
    if (o.levels && !o.levels.includes(levelIdx)) continue;
    voidM2 += rectAreaM2(o);
  }
  return Math.max(0, intM2 - voidM2);
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.dx && a.x + a.dx > b.x && a.y < b.y + b.dy && a.y + a.dy > b.y;
}

function objectFootprint(cx, cy, L, W, angleDeg, inflate = 0) {
  const rad = (angleDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const hl = L / 2 + inflate;
  const hw = W / 2 + inflate;
  const corners = [
    [-hl, -hw],
    [hl, -hw],
    [hl, hw],
    [-hl, hw],
  ].map(([lx, ly]) => ({ x: cx + lx * c - ly * s, y: cy + lx * s + ly * c }));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return {
    cx,
    cy,
    angleDeg,
    x: x0,
    y: y0,
    dx: Math.max(...xs) - x0,
    dy: Math.max(...ys) - y0,
  };
}

/** Transport pe palier cu stâlpi + finisaje (toc/tencuială) — fără verdict PASS. */
function frameTransportAudit(bm, fr) {
  const jamb = bm.transport_cm?.frame_jamb_each_side_cm ?? 5;
  const clearMin = bm.transport_cm?.clear_effective_min_cm ?? 90;
  const finish = 1; // tencuială/finisaj pe fețe spre clar
  const g = bm.transport_cm?.gabarit_cm;
  const handle = bm.transport_cm?.handling_inflate_cm ?? 5;
  const leafTh = bm.transport_cm?.door_leaf_thickness_cm ?? 4;
  const low = bm.lower_landing;
  const st = bm.stair;
  const door = bm.door_to_rooms;
  const L = g.length_along_approach_cm;
  const W = g.width_across_cm;
  const clearX0 = st.x;
  const clearX1 = st.x + st.width_clear_cm;
  const doorClearY0 = door.y + jamb;
  const doorClearY1 = door.y + door.dy - jamb;

  const obstacles = [
    { id: "zid_put_w_solid_n", x: 535, y: low.y, dx: 30, dy: Math.max(0, door.y - low.y) },
    {
      id: "zid_put_w_solid_s",
      x: 535,
      y: door.y + door.dy,
      dx: 30,
      dy: Math.max(0, 860 - (door.y + door.dy)),
    },
    { id: "toc_n", x: 535, y: door.y, dx: 30, dy: jamb },
    { id: "toc_s", x: 535, y: door.y + door.dy - jamb, dx: 30, dy: jamb },
    { id: "finisaj_zid_w", x: 535 + 30, y: low.y, dx: finish, dy: low.dy },
    { id: "zid_put_e", x: 680 - 15, y: low.y, dx: 15, dy: 860 - low.y },
    { id: "finisaj_zid_e", x: 665 - finish, y: low.y, dx: finish, dy: low.dy },
    { id: "zid_put_n", x: 535, y: low.y - 12.5, dx: 145, dy: 12.5 },
    { id: "finisaj_zid_n", x: 535, y: low.y, dx: 145, dy: finish },
    {
      id: "foaie_deschisa_hol",
      x: 535 - (doorClearY1 - doorClearY0),
      y: doorClearY1 - leafTh,
      dx: doorClearY1 - doorClearY0,
      dy: leafTh,
    },
  ];
  for (let i = 0; i < st.treads; i++) {
    const yS = st.y + st.dy - (i + 1) * st.tread_cm;
    obstacles.push({
      id: `treapta_${i}`,
      x: st.x,
      y: yS,
      dx: st.width_clear_cm,
      dy: st.tread_cm,
      kind: "tread",
    });
  }
  // Stâlpi + finisaj pe fețele spre clar (dacă intersectează palier/scară/ușă)
  const zone = { x: 535, y: low.y, dx: 145, dy: 860 - low.y };
  for (const c of fr.columns || []) {
    if (!(c.levels || []).includes("S")) continue;
    const colObs = {
      id: `stalp_${c.id}`,
      x: c.x - finish,
      y: c.y - finish,
      dx: c.dx + 2 * finish,
      dy: c.dy + 2 * finish,
    };
    if (rectsOverlap(colObs, zone)) obstacles.push(colObs);
  }

  const cx0 = (clearX0 + clearX1) / 2;
  const poses = [];
  for (let i = 0; i < st.treads; i++) {
    const yS = st.y + st.dy - (i + 0.5) * st.tread_cm;
    poses.push({
      id: `coborare_t${i + 1}`,
      phase: "descent",
      ...objectFootprint(cx0, yS, L, W, 0, handle),
    });
  }
  poses.push({
    id: "palier_aliniat_scara",
    phase: "landing",
    ...objectFootprint(cx0, low.y + low.dy / 2, L, W, 0, handle),
  });
  for (const ang of [15, 30, 45, 60, 75, 90]) {
    const t = ang / 90;
    const cx = cx0 + t * (535 + 15 - cx0);
    poses.push({
      id: `intoarcere_${ang}`,
      phase: "turn",
      ...objectFootprint(cx, door.y + door.dy / 2, L, W, ang, handle),
    });
  }
  poses.push({
    id: "in_gol_usa",
    phase: "through_door",
    ...objectFootprint(535 + 15, door.y + door.dy / 2, L, W, 90, handle),
  });
  poses.push({
    id: "in_hol",
    phase: "hall",
    ...objectFootprint(535 - L / 2 - 10, door.y + door.dy / 2, L, W, 90, handle),
  });

  const poseResults = poses.map((p) => {
    const hits = [];
    for (const o of obstacles) {
      if (o.kind === "tread" && (p.phase === "descent" || p.phase === "landing")) continue;
      if (rectsOverlap(p, o)) hits.push(o.id);
    }
    if (p.phase === "descent" || p.phase === "landing" || p.phase === "turn") {
      if (p.x + p.dx > clearX1 + 0.5) hits.push("iesire_est_clar");
      if (p.x < clearX0 - 0.5 && !(p.phase === "turn" && p.x + p.dx > 535)) {
        if (p.phase !== "turn") hits.push("iesire_vest_clar");
      }
      if (p.phase === "turn" || p.phase === "landing") {
        if (p.y < low.y - 0.5 || p.y + p.dy > low.y + low.dy + 0.5) {
          const inDoorY = p.y < doorClearY1 && p.y + p.dy > doorClearY0;
          if (!inDoorY) hits.push("iesire_palier_Y");
        }
      }
    }
    if (p.phase === "through_door") {
      if (p.y < doorClearY0 - 0.5 || p.y + p.dy > doorClearY1 + 0.5) hits.push("foaie_gol_Y");
    }
    return {
      id: p.id,
      phase: p.phase,
      angleDeg: p.angleDeg,
      cx: +p.cx.toFixed(1),
      cy: +p.cy.toFixed(1),
      aabb: { x: +p.x.toFixed(1), y: +p.y.toFixed(1), dx: +p.dx.toFixed(1), dy: +p.dy.toFixed(1) },
      collisions: hits,
      ok: hits.length === 0,
    };
  });

  const geomOk = poseResults.every((r) => r.ok);
  const bad = poseResults.filter((r) => !r.ok);
  const colsOnLanding = (fr.columns || []).filter((c) => {
    const o = { x: c.x, y: c.y, dx: c.dx, dy: c.dy };
    if (!rectsOverlap(o, { x: low.x, y: low.y, dx: low.dx, dy: low.dy })) return false;
    // Pier în zidul est (X≥665) — nu e pe clarul transport X565–665
    if (c.id === "C_SHAFT_E_PIER" || (c.x >= 665 && c.role)) return false;
    return true;
  });

  return {
    status: "NECONFIRMAT",
    declared_pass: false,
    method:
      "poziții succesive AABB 80×70 (+inflate) vs pereți/toc/finisaje/stâlpi/trepte — fără W+15; fără PASS",
    finish_inflate_cm: finish,
    handling_inflate_cm: handle,
    clear_effective_min_cm: clearMin,
    columns_intersecting_landing: colsOnLanding.map((c) => c.id),
    geometric: {
      status: geomOk ? "geometric_ok_dar_neconfirmat" : "neconfirmat",
      ok: geomOk,
      poses: poseResults,
    },
    notes: [
      colsOnLanding.length
        ? `Stâlpi pe palier: ${colsOnLanding.map((c) => c.id).join(", ")} — conflict`
        : "Niciun stâlp pe AABB palier inferior după mutarea C_E_PAL N de Y490",
      geomOk
        ? "Secvența geometrică fără coliziune pe model — NU se declară PASS acces/transport"
        : `Coliziuni: ${bad.map((b) => `${b.id}[${b.collisions.join(",")}]`).join("; ")}`,
      "TRANSPORT / ACCES = NECONFIRMAT",
    ],
  };
}

function applyFrameToStudy(base) {
  const out = clone(base);
  out.meta = {
    ...out.meta,
    id: "v47_a1_frame_study",
    study_variant: "A1_FRAME",
    based_on_amenajare: "v47_a1_study (aprobat — neatins)",
    structure_system: "cadre_BA",
    declared_buildable: false,
    rev_note_frame:
      "FRAME: C_NW/C_W_MID 30×40; C_N_MID@320; C_CASA@535 flush; grindă întoarsă+pier E+B_SEP; util studio≠vestibul; NECONFIRMAT. Neconstruibil.",
  };

  // Amenajare doar în frame study (A1 aprobat neatins pe disc): eliberează stâlpii prin mobilier.
  if (Array.isArray(out.furniture_cm)) {
    out.furniture_cm = out.furniture_cm.map((f) => {
      if (f.id === "dus" && f.x < 50) {
        return {
          ...f,
          x: 50,
          frame_overlay: true,
          note: `${f.note || ""} | FRAME: x≥50 față de C_NW 40×30 (A1 rămâne x=${f.x})`.trim(),
        };
      }
      if (f.id === "pat" && f.x < 45) {
        return {
          ...f,
          x: 45,
          frame_overlay: true,
          note: `${f.note || ""} | FRAME: x≥45 față de C_W_MID 30×40 (A1 rămâne x=${f.x})`.trim(),
        };
      }
      return f;
    });
  }

  out.structure_frame_study_cm = buildFrameSchema();
  const fr = out.structure_frame_study_cm;

  // Compartimentare subsol aliniată la parter (nu blochează cadrul): X360 = dorm|intrare, Y400 = C_W_MID
  if (out.basement_cm?.rooms) {
    const roomsAligned = {
      camera_tehnica: {
        x: 30,
        y: 30,
        dx: 505,
        dy: 370,
        z_ff_cm: -250,
        area_m2: +((505 * 370) / 10000).toFixed(2),
        note: "alin. parter: E@X535 separator, S@Y400",
      },
      depozit_subsol: {
        x: 30,
        y: 400,
        dx: 330,
        dy: 245,
        z_ff_cm: -250,
        area_m2: +((330 * 245) / 10000).toFixed(2),
        note: "sub dorm P: X30–360 Y400–645",
      },
      hol_subsol: {
        x: 360,
        y: 400,
        dx: 175,
        dy: 245,
        z_ff_cm: -250,
        area_m2: +((175 * 245) / 10000).toFixed(3),
        note: "alin. intrare/hol P: X360–535 Y400–645; ușă beci neschimbată",
      },
    };
    out.basement_cm.rooms = out.basement_cm.rooms.map((r) =>
      roomsAligned[r.id] ? { ...r, ...roomsAligned[r.id] } : r
    );
    out.basement_cm.areas = {
      ...(out.basement_cm.areas || {}),
      rooms: Object.fromEntries(
        Object.entries(roomsAligned).map(([id, r]) => [
          id,
          { brut_m2: r.area_m2, x: r.x, y: r.y, dx: r.dx, dy: r.dy },
        ])
      ),
      note: "FRAME: compartimentare subsol realiniată la axe parter — nu constrânge stâlpii",
    };
    if (out.basement_cm.internal_doors) {
      out.basement_cm.internal_doors = out.basement_cm.internal_doors.map((d) => {
        if (d.id === "usa_hol_ct") {
          return { ...d, x: 375, y: 400 - 12.5 / 2, dx: 100, dy: 12.5, note: "gol pe Y400 (alin. part. CT|hol)" };
        }
        if (d.id === "usa_hol_dep") {
          return { ...d, x: 360 - 12.5 / 2, y: 470, dx: 12.5, dy: 100, note: "gol pe X360 (alin. dorm|hol P)" };
        }
        return d;
      });
    }
    out.basement_cm.frame_alignment_note =
      "Partiții subsol mutate pe X360 / Y400 ca parterul; pot fi ajustate — nu dictează cadrul.";
  }

  const thermal = {
    id: "living_put_thermal_y590",
    x: 565,
    y: 560,
    dx: 85,
    dy: 30,
    kind: "ext",
    thermal: "heated_thermosystem",
    assembly: "EB20_Akustik_200_ISOVER_FASSADE_80",
    levels: [0, 1],
    toward: "shaft_cold",
    note: "închidere termică living↔puț; scăzut din util pe nivelurile unde există",
  };
  out.walls_cm = [...(out.walls_cm || []).filter((w) => w.id !== thermal.id), thermal];

  // Contur util încălzit: fără terasă / acces exterior.
  // P: living sub palier inclus. E: studio FĂRĂ vestibul (palier_superior X565–670 Y470–590 raportat separat).
  const polyP = [
    [30, 30],
    [650, 30],
    [650, 590],
    [565, 590],
    [565, 440],
    [535, 440],
    [535, 830],
    [360, 830],
    [360, 645],
    [30, 645],
    [30, 30],
  ];
  const polyE = [
    [30, 30],
    [650, 30],
    [650, 470],
    [565, 470],
    [565, 590],
    [535, 590],
    [535, 830],
    [360, 830],
    [360, 645],
    [30, 645],
    [30, 30],
  ];
  const vestibuleRect = { x: 565, y: 470, dx: 105, dy: 120 };
  const vestibuleM2 = +rectAreaM2(vestibuleRect).toFixed(3);
  out.interior_polygon_cm = {
    note: "Frame P util: living sub palier inclus; EXCLUDE terasă/acces exterior",
    vertices: polyP,
    excludes: ["terasa", "uncovered_south", "entry_steps", "curte_engleza", "alee"],
  };
  out.interior_polygon_etaj_cm = {
    note: "Frame E util STUDIO: EXCLUDE vestibul palier_superior + exterior; NU copiază usefulP",
    vertices: polyE,
    excludes: ["terasa", "uncovered_south", "rampă_exterioară", "vestibul_palier_superior"],
  };

  const wallsNetP = intWallsNetM2(out.walls_cm, out.openings_cm, 0);
  const wallsNetE = intWallsNetM2(out.walls_cm, out.openings_cm, 1);
  const thermalP = wallOnLevel(thermal, 0) ? rectAreaM2(thermal) : 0;
  const thermalE = wallOnLevel(thermal, 1) ? rectAreaM2(thermal) : 0;

  let protrP = 0;
  let protrE = 0;
  for (const c of fr.columns) {
    const pin = c.protrusion_into_room_cm || 0;
    if (!(pin > 0)) continue;
    const along = Math.max(c.dx, c.dy) >= COL_ALONG ? Math.min(COL_ALONG, Math.max(c.dx, c.dy)) : Math.max(c.dx, c.dy);
    const a = (pin * along) / 10000;
    if ((c.levels || []).includes("P")) protrP += a;
    if ((c.levels || []).includes("E")) protrE += a;
  }

  const grossP = shoelaceM2(polyP);
  const grossE = shoelaceM2(polyE);
  const usefulP = +(grossP - wallsNetP - thermalP - protrP).toFixed(3);
  const usefulE = +(grossE - wallsNetE - thermalE - protrE).toFixed(3);

  out.areas_cm = {
    ...out.areas_cm,
    frame_study_areas: {
      method:
        "P/E separate: shoelace(poly nivel) − pereți_int − thermal − proeminențe; E = studio fără vestibul; vestibul raportat separat; NU usefulE=usefulP",
      useful_parter_m2: usefulP,
      useful_etaj_studio_m2: usefulE,
      useful_etaj_m2: usefulE,
      vestibule_palier_m2: vestibuleM2,
      vestibule_rect_cm: vestibuleRect,
      gross_parter_m2: +grossP.toFixed(3),
      gross_etaj_studio_m2: +grossE.toFixed(3),
      gross_etaj_m2: +grossE.toFixed(3),
      thermal_enclosure_P_m2: +thermalP.toFixed(3),
      thermal_enclosure_E_m2: +thermalE.toFixed(3),
      column_protrusion_P_m2: +protrP.toFixed(3),
      column_protrusion_E_m2: +protrE.toFixed(3),
      walls_int_net_P_m2: +wallsNetP.toFixed(3),
      walls_int_net_E_m2: +wallsNetE.toFixed(3),
      reference_threshold_m2: REF_USEFUL,
      delta_P_vs_37: +(usefulP - REF_USEFUL).toFixed(3),
      delta_E_studio_vs_37: +(usefulE - REF_USEFUL).toFixed(3),
      delta_E_vs_37: +(usefulE - REF_USEFUL).toFixed(3),
      ref_a1_useful_was: base.areas_cm?.useful_recalc_a1?.useful_geometric_m2 ?? base.areas_cm?.useful_geometric_m2 ?? null,
      status_util: "NECONFIRMAT",
      declared_pass_util: false,
      note: "Fără PASS. Util E = studio (fără vestibul). Vestibul = acces, nu util studio.",
    },
    useful_geometric_m2: usefulP,
  };

  if (out.basement_cm?.door_to_rooms) {
    out.basement_cm.door_to_rooms.frame_study_note =
      "Gol Y500–600 PĂSTRAT. C_CASA_SCARA @ Y610+. C_E_PAL Y450–490 (nu pe palier). Grindă întoarsă X565.";
  }
  if (out.basement_cm?.slab_coordination_cm) {
    const sc = out.basement_cm.slab_coordination_cm;
    sc.edge_beam_y = 590;
    sc.edge_beam_x0 = INVERTED_BEAM.x;
    sc.edge_beam_dx = INVERTED_BEAM.dx;
    sc.edge_beam_mode = "inverted_study";
    sc.edge_beam_depth_cm = null;
    sc.edge_beam_clear_under_cm = null;
    sc.edge_beam_note =
      "FRAME: grindă întoarsă Y575–590 X565–680, z −30…−5 (nu coborâre −70). Clear acces liber pe h ușă; fit sandwich −30…+32 = calcul.";
    sc.inverted_edge_beam = INVERTED_BEAM;
  }

  out.basement_cm = out.basement_cm || {};
  out.basement_cm.frame_transport_audit = frameTransportAudit(out.basement_cm, fr);
  out.structure_frame_study_cm.transport_status = {
    status: "NECONFIRMAT",
    declared_pass_access: false,
    audit_key: "basement_cm.frame_transport_audit",
  };

  return out;
}

function svgOverlay(study) {
  const S = 0.55;
  const ox = 40;
  const oy = 40;
  const fr = study.structure_frame_study_cm;
  const W = 680 * S + 80;
  const H = 900 * S + 120;
  const px = (x) => ox + x * S;
  const py = (y) => oy + y * S;
  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  parts.push(`<rect width="100%" height="100%" fill="#f7f4ef"/>`);
  parts.push(
    `<text x="40" y="22" font-size="13" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 A1 FRAME · plan structural suprapus pe amenajare (neconstruibil)</text>`
  );
  parts.push(
    `<text x="40" y="38" font-size="9" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">Cadre BA + EB20 + vată 80 · fără pereți structurali P/E · anvelopă 680×860 · max perete 300 mm</text>`
  );

  // footprint
  parts.push(
    `<rect x="${px(0)}" y="${py(0)}" width="${680 * S}" height="${860 * S}" fill="none" stroke="#333" stroke-width="1.2"/>`
  );
  // walls amenajare (light)
  for (const w of study.walls_cm || []) {
    if (w.kind === "parapet") continue;
    parts.push(
      `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="${w.kind === "ext" ? "#e8e0d0" : "#eee8e0"}" stroke="#999" stroke-width="0.4" opacity="0.85"/>`
    );
  }
  // axes
  const ax = fr.axes_cm;
  for (const [name, xv] of Object.entries(ax).filter(([k]) => k.startsWith("X_"))) {
    parts.push(
      `<line x1="${px(xv)}" y1="${py(0)}" x2="${px(xv)}" y2="${py(860)}" stroke="#c45c26" stroke-width="0.6" stroke-dasharray="4 3"/>`
    );
    parts.push(
      `<text x="${px(xv) + 2}" y="${py(0) - 4}" font-size="7" fill="#c45c26">${name}=${xv}</text>`
    );
  }
  for (const [name, yv] of Object.entries(ax).filter(([k]) => k.startsWith("Y_"))) {
    parts.push(
      `<line x1="${px(0)}" y1="${py(yv)}" x2="${px(680)}" y2="${py(yv)}" stroke="#2a6f97" stroke-width="0.6" stroke-dasharray="4 3"/>`
    );
  }
  // beams
  for (const b of fr.beams) {
    parts.push(
      `<rect x="${px(b.x)}" y="${py(b.y)}" width="${b.dx * S}" height="${b.dy * S}" fill="#6a6358" opacity="0.55" stroke="#333" stroke-width="0.5"/>`
    );
  }
  // columns
  for (const c of fr.columns) {
    parts.push(
      `<rect x="${px(c.x)}" y="${py(c.y)}" width="${c.dx * S}" height="${c.dy * S}" fill="#3d3a36" stroke="#111" stroke-width="0.8"/>`
    );
    parts.push(
      `<text x="${px(c.x) + 1}" y="${py(c.y) - 2}" font-size="6.5" fill="#111" font-family="IBM Plex Sans,Segoe UI,sans-serif">${c.id}</text>`
    );
  }
  // ușă liberă + grindă întoarsă (schemă X565)
  parts.push(
    `<rect x="${px(535)}" y="${py(500)}" width="${30 * S}" height="${100 * S}" fill="none" stroke="#2a6f97" stroke-width="1.5"/>`
  );
  parts.push(
    `<text x="${px(570)}" y="${py(545)}" font-size="8" fill="#2a6f97">ușă Y500–600 LIBERĂ</text>`
  );
  parts.push(
    `<rect x="${px(565)}" y="${py(575)}" width="${115 * S}" height="${15 * S}" fill="#5a8f6a" opacity="0.45" stroke="#2d5a27"/>`
  );
  parts.push(
    `<text x="${px(570)}" y="${py(572)}" font-size="7" fill="#2d5a27">grindă întoarsă X565 (studiu)</text>`
  );
  const ar = study.areas_cm.frame_study_areas;
  parts.push(
    `<text x="40" y="${H - 16}" font-size="8" fill="#555">Stâlpi ${COL_THRU}×${COL_ALONG} + proem. · ETICS afară · util P ${ar.useful_parter_m2} / E ${ar.useful_etaj_m2} m² (NECONFIRMAT) · fără PASS</text>`
  );
  parts.push(`</svg>`);
  return parts.join("\n");
}

function svgSections(study) {
  const fr = study.structure_frame_study_cm;
  const lv = fr.levels_cm;
  const W = 1000;
  const H = 720;
  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  parts.push(`<rect width="100%" height="100%" fill="#f7f4ef"/>`);
  parts.push(
    `<text x="40" y="24" font-size="13" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 A1 FRAME · secțiuni studiu (grinzi / scară / ușă beci)</text>`
  );

  // Sec A — ușă vs grindă (vertical Y, Z)
  const zy = (zcm) => 320 - zcm * 0.55; // screen y
  const yx = (ycm) => 40 + (ycm - 450) * 1.1;
  parts.push(`<text x="40" y="50" font-size="11">A — secțiune pe ușă beci (Y) × cotă (Z) · gol PĂSTRAT</text>`);
  parts.push(`<line x1="40" y1="${zy(0)}" x2="380" y2="${zy(0)}" stroke="#999"/>`);
  parts.push(`<text x="385" y="${zy(0)}" font-size="8">teren 0</text>`);
  // FF -250
  parts.push(
    `<rect x="${yx(490)}" y="${zy(-250)}" width="${(110) * 1.1}" height="6" fill="#e8c56a" stroke="#333"/>`
  );
  parts.push(`<text x="40" y="${zy(-250) - 4}" font-size="8">FF −250</text>`);
  // door opening
  parts.push(
    `<rect x="${yx(500)}" y="${zy(-50)}" width="${100 * 1.1}" height="${(-50 - -250) * 0.55}" fill="#b8d4e8" stroke="#c1121f" stroke-width="1.5" opacity="0.5"/>`
  );
  parts.push(`<text x="${yx(500)}" y="${zy(-40)}" font-size="8" fill="#2a6f97">gol ușă h200 Y500–600 LIBER</text>`);
  // grindă întoarsă −30…−5 (nu −70)
  parts.push(
    `<rect x="${yx(575)}" y="${zy(-5)}" width="${15 * 1.1}" height="${(-5 - -30) * 0.55}" fill="#5a8f6a" stroke="#2d5a27"/>`
  );
  parts.push(`<text x="${yx(592)}" y="${zy(-18)}" font-size="8" fill="#2d5a27">grindă întoarsă −30…−5 (studiu)</text>`);
  parts.push(
    `<text x="40" y="290" font-size="9" fill="#444">Clear acces: fără grindă sub −30 pe clar. Încadrare în sandwich −30…+32 = calcul (nerezolvat).</text>`
  );

  // Sec B — cote etaj / placă
  parts.push(`<text x="520" y="50" font-size="11">B — cote planșeu etaj (absolut cm)</text>`);
  const rows = [
    ["FF etaj", lv.ff_etaj],
    ["față sup. placă (FF−12)", lv.slab_top_etaj],
    ["intrados placă (15 ip.)", lv.slab_soffit_etaj],
    ["intrados grindă (35 ip.)", lv.beam_soffit_over_parter],
    ["FF parter", lv.ff_parter],
    ["clear P sub grindă", lv.clear_parter_under_beam_cm],
  ];
  let ry = 70;
  for (const [lab, val] of rows) {
    parts.push(
      `<text x="520" y="${ry}" font-size="10" font-family="IBM Plex Sans,Segoe UI,sans-serif">${lab}: <tspan font-weight="600">${val} cm</tspan></text>`
    );
    ry += 18;
  }
  parts.push(
    `<text x="520" y="${ry + 10}" font-size="9" fill="#444" width="400">Nu suprapune placa structurală cu pachetul de pardoseală 12 cm.</text>`
  );

  // Sec C — scară
  parts.push(`<text x="40" y="340" font-size="11">C — rampe: plăci continue (reazeme = calcul)</text>`);
  parts.push(
    `<text x="40" y="360" font-size="9" fill="#444">Model: placă înclinată AABB pe amprenta rampelor 1/2 + scară beci; podest SE ca reazem intermediar. Clear acces beci de recalculat după reazeme reale.</text>`
  );
  parts.push(
    `<rect x="40" y="380" width="280" height="40" fill="#5a6570" opacity="0.7" stroke="#333"/>`
  );
  parts.push(`<text x="50" y="404" font-size="9" fill="#fff">placă rampă continuă (studiu)</text>`);
  parts.push(
    `<rect x="340" y="370" width="60" height="60" fill="#c4b496" stroke="#333"/>`
  );
  parts.push(`<text x="348" y="402" font-size="8">podest</text>`);

  parts.push(
    `<text x="40" y="${H - 40}" font-size="9" fill="#333">Sistem: cadre BA · umplutură EB20 · ETICS 80 mm vată · declared_buildable=false</text>`
  );
  parts.push(
    `<text x="40" y="${H - 22}" font-size="8" fill="#555">${fr.conflicts_unresolved.length} conflicte nerezolvate păstrate explicit — vezi raport MD</text>`
  );
  parts.push(`</svg>`);
  return parts.join("\n");
}

function mdReport(study) {
  const fr = study.structure_frame_study_cm;
  const ar = study.areas_cm.frame_study_areas;
  const cs = fr.column_section_hypothesis_cm;
  const colRows = fr.columns
    .map(
      (c) =>
        `| ${c.id} | X${c.x}–${c.x + c.dx} Y${c.y}–${c.y + c.dy} | ${c.dx}×${c.dy} (proem. ${c.protrusion_into_room_cm ?? 0}) | ${c.levels.join("–")} | ${c.support_below} | ${(c.conflicts || []).join("; ") || "—"} |`
    )
    .join("\n");
  const beamRows = (fr.beams || [])
    .map(
      (b) =>
        `| ${b.id} | X${b.x}–${b.x + b.dx} Y${b.y}–${b.y + b.dy} | ${(b.levels || []).join(",")} | ${(b.supports || []).join(", ") || "—"} | ${(b.load_path || b.note || "").replace(/\|/g, "/")} |`
    )
    .join("\n");
  const elemRows = [
    ...(fr.columns || []).map((c) => ({
      kind: "stalp",
      id: c.id,
      supports: c.support_below || "—",
      links: (c.levels || []).join("/"),
      conflict: (c.conflicts || []).join("; ") || "—",
      fix: c.amenajare_fix || c.wall || "—",
    })),
    ...(fr.beams || []).map((b) => ({
      kind: "grinda",
      id: b.id,
      supports: (b.supports || []).join(", ") || "—",
      links: (b.levels || []).join("/"),
      conflict: b.load_path ? "traseu incarcari — calcul" : "—",
      fix: b.note || "—",
    })),
  ]
    .map(
      (e) =>
        `| ${e.kind} | ${e.id} | ${e.supports} | ${e.links} | ${String(e.conflict).replace(/\|/g, "/")} | ${String(e.fix).replace(/\|/g, "/")} |`
    )
    .join("\n");

  const conf = fr.conflicts_unresolved
    .map((c) => `- **${c.id}** (${c.severity}): ${c.detail}`)
    .join("\n");
  const removed = fr.removed_from_prior_grid
    .map((r) => `- \`${r.id}\`: ${r.reason}`)
    .join("\n");

  return `# V47 A1 FRAME — studiu structural corectat (cadre BA)

## Status
**NECONSTRUIBIL / NEVALIDAT.** Variantă separată față de A1 amenajare aprobată.
Sistem: **cadre beton armat** + **EB20** + **vată 80 mm**. **Nu** pereți structurali P/E.

## Prioritati geometrie (runda audit post-117edb0)
1. **Stalpi continui** prin nod placa/pardoseala; C_NW / C_W_MID restaurate 30x40 (nu reduse pt. mobilier).
2. **C_N_MID@X320** (rost vest de frigider_p); **C_CASA_SCARA@X535** flush (fara proeminenta vest).
3. **Ansamblu muchie put:** B_Y590_EDGE_INVERTED + C_SHAFT_E_PIER + B_SEP_AFTER_DOOR (usa/palier libere).
4. **Noduri:** B_X360 prin C_S_INTRARE_W; B_Y830 prin C_S_INTRARE_E; B_W prin C_W_DORM.
5. **Util E = studio fara vestibul** (vestibul raportat separat); transport/util = NECONFIRMAT — fara PASS.
6. **Amenajare frame-only:** dus x>=50, pat x>=45; A1 aprobat neatins.

## Secțiuni stâlpi
- Preliminar **${cs.through_wall_cm}×${cs.along_wall_cm} cm** + proeminență locală **${cs.local_protrusion_inward_cm} cm** spre interior.
- Perete finit **30 cm**; ETICS continuă **peste** stâlpi (nu înlocuită de beton).
- *De confirmat prin calcul și cerințe normative* (P100 — aplicabilitate pe sistem/ductilitate).

## Eliminat / mutat
${removed}

## Tabel stâlpi

| ID | Poziție (cm) | Secțiune + proem. | Niveluri | Reazem inferior | Conflicte |
|----|--------------|-------------------|----------|-----------------|-----------|
${colRows}

## Cote etaj / planșeu
${fr.levels_cm.note}

| Cotă | cm |
|------|---:|
| FF etaj | ${fr.levels_cm.ff_etaj} |
| Față sup. placă | ${fr.levels_cm.slab_top_etaj} |
| Intrados placă | ${fr.levels_cm.slab_soffit_etaj} |
| Intrados grindă (h total ${fr.levels_cm.beam_h_total_including_slab_zone}) | ${fr.levels_cm.beam_soffit_over_parter} |
| Clear P sub grindă | ${fr.levels_cm.clear_parter_under_beam_cm} |

## Tabel grinzi

| ID | Poziție (cm) | Niveluri | Reazeme | Note / traseu |
|----|--------------|----------|---------|---------------|
${beamRows}

## Tabel elemente (stâlpi + grinzi)

| Tip | ID | Reazeme / sprijin | Niveluri | Conflict amenajare | Soluție propusă |
|-----|----|-------------------|----------|--------------------|-----------------|
${elemRows}

## Suprafețe utile (P și E separate) — NECONFIRMAT
Metodă: ${ar.method}

| | m² |
|--|---:|
| Util parter (studiu) | ${ar.useful_parter_m2} |
| Util etaj studio (fara vestibul) | ${ar.useful_etaj_studio_m2 ?? ar.useful_etaj_m2} |
| Vestibul palier (separat, nu in util studio) | ${ar.vestibule_palier_m2 ?? "—"} |
| Pereți int net P / E | ${ar.walls_int_net_P_m2} / ${ar.walls_int_net_E_m2} |
| Proeminențe stâlpi P / E | ${ar.column_protrusion_P_m2} / ${ar.column_protrusion_E_m2} |
| Thermal P / E | ${ar.thermal_enclosure_P_m2} / ${ar.thermal_enclosure_E_m2} |
| Δ vs 37 (informativ) | ${ar.delta_P_vs_37} / ${ar.delta_E_vs_37} |
| Verdict util | **${ar.status_util}** (declared_pass=${ar.declared_pass_util}) |

## Transport palier (stâlpi + finisaje)
Status: **${study.basement_cm?.frame_transport_audit?.status ?? "—"}** · declared_pass_access=${study.structure_frame_study_cm?.transport_status?.declared_pass_access}
${(study.basement_cm?.frame_transport_audit?.notes || []).map((n) => `- ${n}`).join("\n")}

## Conflicte nerezolvate (păstrate explicit)
${conf}

## Fișiere
- \`data/building/v47_a1_frame_study.json\`
- \`viewer/data/volume_v47_a1_frame.json\` → \`?v=v47_a1_frame\`
- \`outputs/plans/36_v47_a1_frame_structure_overlay.svg\`
- \`outputs/plans/37_v47_a1_frame_sections.svg\`
- \`outputs/reports/v47_a1_frame_structure.md\`

Amenajarea \`v47_a1_study\` / \`?v=v47_a1\` rămâne referința aprobată (fără pereți structurali).
`;
}

function main() {
  const base = read("data/building/v47_a1_study.json");
  if (base.meta?.structure_variant === "perimeter_wall_piers_study") {
    console.error("A1 încă are pereți structurali — rulează revert înainte.");
    process.exit(1);
  }
  const study = applyFrameToStudy(base);
  write("data/building/v47_a1_frame_study.json", study);

  const build = spawnSync(
    process.execPath,
    [
      path.join(ROOT, "src/build_v47_3d.mjs"),
      "data/building/v47_a1_frame_study.json",
      "viewer/data/volume_v47_a1_frame.json",
    ],
    { cwd: ROOT, encoding: "utf8" }
  );
  if (build.status !== 0) {
    console.error(build.stdout, build.stderr);
    process.exit(build.status || 1);
  }
  console.log(build.stdout);

  writeText("outputs/plans/36_v47_a1_frame_structure_overlay.svg", svgOverlay(study));
  writeText("outputs/plans/37_v47_a1_frame_sections.svg", svgSections(study));
  writeText("outputs/reports/v47_a1_frame_structure.md", mdReport(study));

  console.log(
    JSON.stringify(
      {
        ok: true,
        variant: "A1_FRAME",
        declared_buildable: false,
        columns: study.structure_frame_study_cm.columns.length,
        conflicts: study.structure_frame_study_cm.conflicts_unresolved.length,
        useful_P: study.areas_cm.frame_study_areas.useful_parter_m2,
        useful_E: study.areas_cm.frame_study_areas.useful_etaj_m2,
        status_util: study.areas_cm.frame_study_areas.status_util,
        transport: study.basement_cm.frame_transport_audit?.status,
        columns_on_landing: study.basement_cm.frame_transport_audit?.columns_intersecting_landing,
        approved_a1_untouched: true,
        files: [
          "data/building/v47_a1_frame_study.json",
          "viewer/data/volume_v47_a1_frame.json",
          "outputs/plans/36_v47_a1_frame_structure_overlay.svg",
          "outputs/plans/37_v47_a1_frame_sections.svg",
          "outputs/reports/v47_a1_frame_structure.md",
        ],
      },
      null,
      2
    )
  );
}

main();
