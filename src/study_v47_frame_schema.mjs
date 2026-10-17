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
/** A1 afară de miez: 5+80+5+2 = 92 mm. */
const ETICS_A1 = 9.2;
/** A2 afară de miez (klinker): 5+80+5+15 = 105 mm. */
const ETICS_A2 = 10.5;
const ETICS = ETICS_A1;
const EB20 = 20;
const INT_FINISH = 0.7; // tencuială 6 + vopsea 1
/**
 * Sync cu `apply_geometry_assemblies_v01` (A2 +1.3 cm + recenter vest=0).
 */
const GEO_X0 = 1.3;
/**
 * LOCK fațadă unică 2026-10-17 (beneficiar + audit):
 * - E/S: fațadă FINITĂ plană; ETICS continuu; beton retras cu grosimea straturilor ext.;
 *   proeminența 30−20 absorbită în INTERIOR.
 * - N/V: interior la linie (baie/living N, dorm/baie V); proeminențe pe EXTERIOR
 *   (pilastri stâlp+placă pe fațada finită).
 */
const COL_THRU = 30;
const COL_ALONG = 40;
const PROTRUSION_IN = 0;
const MASONRY_EXCESS_CM = COL_THRU - EB20; // 10
const WALL_TH_A1 = +(ETICS_A1 + EB20 + INT_FINISH).toFixed(1); // 29.9
/** Sync walls_cm A2 (est/vest/sud dy/dx = 31.3 post-assemblies). */
const WALL_TH_A2 = 31.3;
/** Amprentă / față finită (POT) — sync envelope_cm. */
const FINISHED_W = 0;
const FINISHED_N = 0;
const FINISHED_E = 682.6;
const FINISHED_S = 861.3;
/** Alias istoric = față finită (POT); NU = față beton pe E/S. */
const SLAB_W = FINISHED_W;
const SLAB_N = FINISHED_N;
const SLAB_E = FINISHED_E;
const SLAB_S = FINISHED_S;
/** Față beton structurală. */
const CONC_W = FINISHED_W; // pilastru pe finit
const CONC_N = FINISHED_N;
const CONC_E = +(FINISHED_E - ETICS_A2).toFixed(1); // 672.1 — sub ETICS plan
const CONC_S = +(FINISHED_S - ETICS_A2).toFixed(1); // 850.8
/** Fețe interioare = aceleași ca walls_cm (util + volum). */
const INT_W = +(FINISHED_W + WALL_TH_A2).toFixed(1); // 31.2
const INT_N = +(FINISHED_N + WALL_TH_A1).toFixed(1); // 29.9
const INT_E = +(FINISHED_E - WALL_TH_A2).toFixed(1); // 651.4
const INT_S = +(FINISHED_S - WALL_TH_A2).toFixed(1); // 830.1
/** Sud dorm: perete amenajare y0=645, dy=A2 → finit local. */
const INT_S_DORM = 645;
const FINISHED_S_DORM = +(INT_S_DORM + WALL_TH_A2).toFixed(1); // 676.2
const CONC_S_DORM = +(FINISHED_S_DORM - ETICS_A2).toFixed(1); // 665.7
const Y_DORM_S_EXT = FINISHED_S_DORM;
/** Compat referințe vechi. */
const X_W_INT = INT_W;
const X_E_INT = INT_E;
const Y_N_INT = INT_N;
const X_W_FALIE_INT = INT_W;
const Y_N_FALIE_INT = INT_N;
const X_E_FALIE_INT = INT_E;
const Y_S_INTRARE_FALIE_INT = INT_S;
const Y_S_DORM_FALIE_INT = INT_S_DORM;
const PARCEL_M2_MEASURED = 147;
const PARCEL_M2_ACTS = 172;
/**
 * Grindă totală 35 cm = înălțime totală incluzând zona plăcii (nu coborâre suplimentară 35 sub placă).
 * Intrados grindă = față_sup_placă − 35.
 */
const BEAM_H_TOTAL = 35;
/** LOCK 2026-10-17: placă 20 fără B_BAND (min proeminențe). */
const SLAB_TH = 20;
const FLOOR_BUILDUP = 12;
const FALSE_CEILING_CM = 6;
/** FF parter = +48: 2 trepte acces (+16,+32) + ridicare pe palier/terasă; 3×16 (entry neschimbat). */
const FF_PARTER = 48;
/** Scară P→E: 18 contratrepte × 17 cm (LOCK 2026-10-17) — clear +18 vs 16. */
const STAIR_RISER_CM = 17;
const STAIR_RISERS_FF = 18;
const FF_TO_FF = STAIR_RISER_CM * STAIR_RISERS_FF; // 306
/** clear + false_ceil + slab + buildup = FF→FF → @20: 268. */
const CLEAR_TO_FALSE_CEILING = FF_TO_FF - FALSE_CEILING_CM - SLAB_TH - FLOOR_BUILDUP; // 268
const FF_ETAJ = FF_PARTER + FF_TO_FF; // 354
const SLAB_TOP_ETAJ = FF_ETAJ - FLOOR_BUILDUP; // 342
const SLAB_SOFFIT_ETAJ = SLAB_TOP_ETAJ - SLAB_TH; // 322
const BEAM_SOFFIT_P = SLAB_TOP_ETAJ - BEAM_H_TOTAL; // 307
const CLEAR_P_UNDER_BEAM = BEAM_SOFFIT_P - FF_PARTER; // 259
const PODEST_ABOVE_FF = STAIR_RISER_CM * 8; // 136 (rampă 1)
/** Grindă întoarsă — cotă locală înainte de GEO_X0 (o singură sursă pentru grinzi + volum). */
const INVERTED_BEAM_LOCAL = {
  x: 565,
  y: 575,
  dx: 115,
  /** dy 25: Y575→600 — închide gap-ul față de B_SEP_AFTER_DOOR@Y600; nu intră în golul ușii X535–565. */
  dy: 25,
  z0_cm: -30,
  z1_cm: -5,
  note: "grindă întoarsă −30…−5; nod sud la Y600 cu B_SEP; ușa Y500–600 X535–565 liberă; fit sandwich + calcul",
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

/** Ray-cast: punct în poligon (cm). */
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Aria dreptunghiului aflați în interiorul poligonului (eșantionare).
 * Evită dublă scădere când conturul util a exclus deja o închidere.
 */
function rectAreaInsidePolyM2(r, poly, stepCm = 2) {
  if (!r || !(r.dx > 0) || !(r.dy > 0) || !poly?.length) return 0;
  let inside = 0;
  let total = 0;
  for (let x = r.x + stepCm / 2; x < r.x + r.dx; x += stepCm) {
    for (let y = r.y + stepCm / 2; y < r.y + r.dy; y += stepCm) {
      total += 1;
      if (pointInPoly(x, y, poly)) inside += 1;
    }
  }
  if (!total) return 0;
  return (inside / total) * rectAreaM2(r);
}

/** Bandă fațadă pe fața exterioară a stâlpului (straturi fără EB20 — beton = miez). */
function facadeBand(outward, face0, along0, along1, outTh) {
  if (outward === "east")
    return { outward, x0: face0, x1: face0 + outTh, y0: along0, y1: along1, th: outTh };
  if (outward === "west")
    return { outward, x0: face0 - outTh, x1: face0, y0: along0, y1: along1, th: outTh };
  if (outward === "south")
    return { outward, y0: face0, y1: face0 + outTh, x0: along0, x1: along1, th: outTh };
  return { outward, y0: face0 - outTh, y1: face0, x0: along0, x1: along1, th: outTh }; // north
}

/**
 * Stâlp est — fațadă finită plană: beton @ CONC_E, ETICS continuu până la FINISHED_E.
 * Proem. în cameră = MASONRY_EXCESS față de INT_E.
 */
function colEst(id, y, dy, extra = {}) {
  const planar = extra.atSlabEdge !== false; // default planar E
  const x1 = planar ? CONC_E : INT_E + COL_THRU;
  const x0 = +(x1 - COL_THRU).toFixed(1);
  const outTh = ETICS_A2;
  const bands = planar ? [facadeBand("east", x1, y, y + dy, outTh)] : [];
  const { atSlabEdge: _s, ...rest } = extra;
  return {
    id,
    x: x0,
    y,
    dx: COL_THRU,
    dy,
    orient: "along_E",
    levels: ["S", "P", "E"],
    support_below: "fundație_E",
    align: planar ? "finished_planar_E" : "interior",
    protrusion_into_room_cm: planar
      ? +Math.max(0, INT_E - x0).toFixed(1)
      : Math.max(0, INT_E - x0),
    facade_catalog: "A2",
    etics_outside_band_cm: bands[0] || null,
    etics_outside_bands_cm: bands,
    envelope_bump_out_cm: 0,
    concrete_outer_cm: x1,
    finished_outer_cm: FINISHED_E,
    section_cm: `${COL_THRU}×${COL_ALONG}`,
    section_status: planar
      ? "P100≥30 · E plan: beton=finit−A2 · ETICS continuu · proem. int."
      : "P100≥30 · interior",
    ...rest,
  };
}

/**
 * Stâlp vest — pilastru pe finit: beton @ CONC_W=0; fără wrap (exces afară).
 * Interior flush cu INT_W (dorm/baie la linie).
 */
function colVest(id, y, dy, extra = {}) {
  const x0 = CONC_W;
  const x1 = x0 + COL_THRU;
  return {
    id,
    x: x0,
    y,
    dx: COL_THRU,
    dy,
    orient: "along_W",
    levels: ["S", "P", "E"],
    support_below: "fundație_W",
    align: "pilaster_W",
    protrusion_into_room_cm: 0,
    facade_catalog: "A2",
    etics_outside_band_cm: null,
    etics_outside_bands_cm: [],
    envelope_bump_out_cm: 0,
    concrete_outer_cm: x0,
    finished_outer_cm: FINISHED_W,
    section_cm: `${COL_THRU}×${COL_ALONG}`,
    section_status: "P100≥30 · V pilastru pe finit · int. la linie · fără wrap",
    ...extra,
  };
}

/**
 * Stâlpi sud — fațadă finită plană (ca E): beton = finit−A2, ETICS continuu, proem. int.
 * finishedY1 = față finită sud; intY0 = față interioară perete (referință).
 */
function colSud(id, x, dx, intY0, finishedY1, extra = {}) {
  const planar = extra.planar !== false && !extra.skipSouthEtics;
  const outTh = ETICS_A2;
  const y1Concrete = planar
    ? +(finishedY1 - outTh).toFixed(1)
    : intY0 + COL_THRU;
  const y0 = +(y1Concrete - COL_THRU).toFixed(1);
  const bands =
    planar && !extra.skipSouthEtics
      ? [facadeBand("south", y1Concrete, x, x + dx, outTh)]
      : [];
  const { atSlabEdge: _s, skipSouthEtics: _k, planar: _p, ...rest } = extra;
  return {
    id,
    x,
    y: y0,
    dx,
    dy: COL_THRU,
    orient: "along_S",
    levels: ["S", "P", "E"],
    support_below: "fundație_S",
    align: planar ? "finished_planar_S" : "interior",
    protrusion_into_room_cm: +Math.max(0, intY0 - y0).toFixed(1),
    facade_catalog: "A2",
    etics_outside_band_cm: bands[0] || null,
    etics_outside_bands_cm: bands,
    envelope_bump_out_cm: 0,
    concrete_outer_cm: y1Concrete,
    finished_outer_cm: finishedY1,
    section_cm: `${dx}×${COL_THRU}`,
    section_status: planar
      ? "P100≥30 · S plan: beton=finit−A2 · ETICS continuu · proem. int."
      : "P100≥30 · sud local",
    ...rest,
  };
}

/** Stâlpi — flush + ETICS/A2 pe față; umplutură EB20 între stâlpi. */
function buildFrameSchema() {
  const ax = {
    X_W: CONC_W,
    X_CASA_SCARA: GEO_X0 + 535,
    /** Față beton E (finit − A2) — stâlpi EST. */
    X_E: CONC_E,
    X_E_FINISHED: FINISHED_E,
    X_W_INT: INT_W,
    X_E_INT: INT_E,
    X_DORM_E: GEO_X0 + 360,
    GEO_X0,
    Y_N: CONC_N,
    Y_N_MID: CONC_N,
    Y_N_INT: INT_N,
    Y_PAL_N: 470,
    Y_E_PAL_END: 489,
    Y_LANDING_N: 490,
    Y_PALIER_ETAJ_S: 590,
    Y_LANDING_S: 600,
    Y_DOOR_END: 600,
    Y_CASA_AFTER_DOOR: 610,
    Y_DORM_S: INT_S_DORM,
    Y_DORM_S_EXT: FINISHED_S_DORM,
    Y_INTRARE_S: INT_S,
    Y_INTRARE_S_EXT: FINISHED_S,
    Y_S_CONC: CONC_S,
  };

  // LOCK fațadă unică: E/S plan (beton retras + ETICS); N/V pilastru (int. la linie).
  const columns = [
    {
      id: "C_NW",
      x: CONC_W,
      y: CONC_N,
      dx: COL_THRU,
      dy: COL_THRU,
      orient: "corner_NW",
      levels: ["S", "P", "E"],
      support_below: "fundație_N/W",
      align: "pilaster_N+W",
      protrusion_into_room_cm: 0,
      facade_catalog: "A1",
      section_cm: `${COL_THRU}×${COL_THRU}`,
      etics_outside_band_cm: null,
      etics_outside_bands_cm: [],
      envelope_bump_out_cm: 0,
      wall: "colț N/W — pilastru pe finit · int. la linie",
      conflicts: ["duș decupat local în frame — nu micșorăm stâlpul"],
      amenajare_fix: "dus x≥50",
      continuous_through_floor: true,
    },
    {
      id: "C_N_MID",
      x: GEO_X0 + 320,
      y: CONC_N,
      dx: COL_ALONG,
      dy: COL_THRU,
      orient: "along_N",
      levels: ["S", "P", "E"],
      support_below: "fundație_N",
      align: "pilaster_N",
      protrusion_into_room_cm: 0,
      facade_catalog: "A1",
      section_cm: `${COL_ALONG}×${COL_THRU}`,
      etics_outside_band_cm: null,
      etics_outside_bands_cm: [],
      envelope_bump_out_cm: 0,
      wall: "nord — pilastru pe finit · baie/living int. la linie",
      conflicts: ["alternativă: fără C_N_MID (doar NW+NE) — comparație"],
      continuous_through_floor: true,
    },
    (() => {
      const c = colEst("C_NE", CONC_N, COL_THRU, {
        wall: "colț N/E — N pilastru · E plan+ETICS",
        conflicts: [],
        continuous_through_floor: true,
        section_cm: `${COL_THRU}×${COL_THRU}`,
        orient: "corner_NE",
      });
      c.align = "pilaster_N+planar_E";
      c.facade_catalog_by_face = { east: "A2", north: "A1" };
      return c;
    })(),
    colVest("C_W_MID", 400, COL_ALONG, {
      wall: `vest — pilastru pe finit · dorm/baie int. la linie`,
      conflicts: ["pat x≥45 în frame — rezervă montaj/tăblie"],
      amenajare_fix: "pat x≥45",
      continuous_through_floor: true,
    }),
    (() => {
      const c = colSud("C_W_DORM", CONC_W, COL_THRU, INT_S_DORM, FINISHED_S_DORM, {
        wall: "colț S/W dorm — W pilastru · S plan+ETICS",
        conflicts: ["gol terasă X120–270"],
        continuous_through_floor: true,
      });
      c.align = "pilaster_W+planar_S_dorm";
      return c;
    })(),
    colSud("C_S_DORM_E", ax.X_DORM_E - COL_THRU, COL_THRU, INT_S_DORM, FINISHED_S_DORM, {
      orient: "corner_S_dorm_E",
      wall: "capăt E sud dorm — S plan+ETICS · proem. int.",
      conflicts: ["proximitate circulație / ușă terasă"],
      continuous_through_floor: true,
    }),
    colEst("C_E_GEAM_S", 310, COL_ALONG, {
      wall: "est S de geam — plan+ETICS · proem. int.",
      continuous_through_floor: true,
    }),
    colEst("C_E_PAL", ax.Y_E_PAL_END - COL_ALONG, COL_ALONG, {
      wall: "est sub palier — plan+ETICS · proem. int.",
      support_below: "fundație_E continuu — NU pe placă",
      replaces: ["pal_ne", "C_E_SOLID_N@Y550"],
      conflicts: [],
      clear_landing: "y1=489 ≤ lower_landing Y490",
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
        x0: GEO_X0 + 565,
        x1: GEO_X0 + 565 + ETICS,
        th: ETICS,
        note: "vată pe fața rece scară; beton doar în falie X535–565",
      },
      wall: "separator X535–565; fără proeminență vest (eliberează frigider/MSV etaj)",
      replaces: ["C_CASA_SCARA@X525", "buc_y590"],
      conflicts: [],
      door_clearance: "y0=610 ≥ door Y1=600 + 10",
      continuous_through_floor: true,
    },
    colEst("C_SHAFT_E_PIER", 575, COL_THRU, {
      wall: "est puț / capăt întoarsă — plan+ETICS",
      support_below: "diafragmă est puț",
      role: "reazem_vertical_grinda_intoarsa_E",
      levels: ["S"],
      section_cm: `${COL_THRU}×${COL_THRU}`,
      continuous_through_floor: false,
    }),
    colSud("C_S_INTRARE_W", GEO_X0 + 360, COL_ALONG, INT_S, FINISHED_S, {
      wall: "sud intrare/buc — plan+ETICS · proem. int.",
      support_below: "fundație_S_intrare (bandă dedicată)",
      conflicts: [],
      continuous_through_floor: true,
    }),
    colSud("C_S_INTRARE_E", GEO_X0 + 535, COL_THRU, INT_S, FINISHED_S, {
      orient: "corner_S",
      wall: "sud @ X535 intrare — plan+ETICS · proem. int.",
      conflicts: [],
      continuous_through_floor: true,
    }),
    (() => {
      const c = colEst("C_SE", CONC_S - COL_THRU, COL_THRU, {
        orient: "corner_SE",
        wall: "colț S/E — E+S plan+ETICS · închide inel centură",
        role: "ring_E_SE_close",
        conflicts: [],
        continuous_through_floor: true,
        section_cm: `${COL_THRU}×${COL_THRU}`,
      });
      c.align = "planar_E+S";
      c.etics_outside_bands_cm = [
        ...(c.etics_outside_bands_cm || []),
        facadeBand("south", CONC_S, c.x, c.x + c.dx, ETICS_A2),
      ];
      c.facade_catalog_by_face = { east: "A2", south: "A2" };
      return c;
    })(),
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
    {
      id: "C_L_PAL",
      reason:
        "LOCK-1R: retras — pe P cade în living deschis sub/lângă palier (separator abia @ Y590). Palier = consolă pe B_E.",
    },
    { id: "grinda_X320", reason: "nu pe fală compartimentare" },
    {
      id: "B_BAND_X320",
      reason:
        "LOCK 2026-10-17: retras — placă 20 pe L≈6,2 fără bandă (min proeminențe). C_N_MID păstrat până la FE drop.",
    },
    { id: "B_Y400_BAND_TIE", reason: "dorm LOCK neatins — retras anterior" },
    { id: "pereți_structurali_P_E", reason: "respins — doar cadre" },
    { id: "20x40_in_20cm_leaf", reason: "nu demonstrăm încadrarea în banda de 20 cm" },
  ];

  /** O singură definiție geometrică — folosită de beams[], inverted_edge_beam, volum, planuri. */
  const invertedEdgeBeam = {
    id: "B_Y590_EDGE_INVERTED",
    ...INVERTED_BEAM_LOCAL,
    x: GEO_X0 + INVERTED_BEAM_LOCAL.x,
    levels: ["S_inverted"],
    // Capăt V = nod cu B_SEP @ X566/Y600 (fețele coincid); NU prin ușă X535–565.
    // Capăt E = C_SHAFT_E_PIER. Fără „placa_parter” vagă ca reazem primar.
    supports: ["C_SHAFT_E_PIER", "B_SEP_AFTER_DOOR", "C_CASA_SCARA"],
    west_node_cm: { x: GEO_X0 + 565, y: 600, with: "B_SEP_AFTER_DOOR" },
    east_node_cm: { pier: "C_SHAFT_E_PIER" },
    load_path:
      "E→C_SHAFT_E_PIER; W→nod B_SEP@Y600→C_CASA_SCARA. Ușă Y500–600 X535–565 liberă (întoarsa începe la X566).",
    note: "FORMĂ R: capăt V explicit pe B_SEP; sandwich −30…+32 = detaliu, nu reazem lipsă",
    form_status: "closed_study",
  };

  const beams = [
    {
      id: "B_N",
      x: ax.X_W,
      y: ax.Y_N,
      dx: CONC_E - ax.X_W,
      dy: COL_THRU,
      levels: ["P", "E"],
      supports: ["C_NW", "C_N_MID", "C_NE"],
      note: "centură N — până la față beton E (C_NE); 3 reazeme",
    },
    {
      id: "B_W",
      x: ax.X_W,
      y: ax.Y_N,
      dx: COL_THRU,
      dy: CONC_S_DORM - ax.Y_N,
      levels: ["P", "E"],
      supports: ["C_NW", "C_W_MID", "C_W_DORM"],
      note: "centură W prin nodul C_W_DORM (pilastru V)",
    },
    {
      id: "B_E",
      x: CONC_E - COL_THRU,
      y: ax.Y_N,
      dx: COL_THRU,
      dy: ax.Y_PALIER_ETAJ_S - ax.Y_N,
      levels: ["P", "E"],
      supports: ["C_NE", "C_E_GEAM_S", "C_E_PAL"],
      cantilever_south_of_C_E_PAL_cm: ax.Y_PALIER_ETAJ_S - ax.Y_E_PAL_END,
      cantilever_y0: ax.Y_E_PAL_END,
      cantilever_y1: ax.Y_PALIER_ETAJ_S,
      note: "centură E pe față beton (finit−A2) + consolă sud Y590. LOCK-1R. Nod C_E_PAL = calcul.",
    },
    {
      id: "B_CASA_SCARA",
      x: ax.X_CASA_SCARA,
      y: ax.Y_CASA_AFTER_DOOR,
      dx: COL_THRU,
      dy: FINISHED_S - ax.Y_CASA_AFTER_DOOR,
      levels: ["S", "P", "E"],
      supports: ["C_CASA_SCARA", "C_S_INTRARE_E"],
      note: "separator Y610→sud; nod cu B_Y830",
    },
    invertedEdgeBeam,
    {
      id: "B_SEP_AFTER_DOOR",
      x: ax.X_CASA_SCARA,
      y: 600,
      dx: 30,
      dy: 10,
      levels: ["S", "P"],
      supports: ["zid_separator", "C_CASA_SCARA"],
      note: "buiandrug/centură S de ușă Y600–610 — preia traseul de la placa peste palier către C_CASA_SCARA; nu blochează golul",
    },
    {
      id: "B_Y645",
      x: ax.X_W,
      y: CONC_S_DORM - COL_THRU,
      dx: ax.X_DORM_E - ax.X_W,
      dy: COL_THRU,
      levels: ["P", "E"],
      supports: ["C_W_DORM", "C_S_DORM_E"],
      note: "sud dorm — pe față beton (finit local − A2); prin C_W_DORM / C_S_DORM_E",
    },
    // B_BAND_X320 RETRAS LOCK 2026-10-17: placă 20 fără bandă (min proem.).
    // B_Y400_BAND_TIE RETRAS: dorm LOCK neatins.
    {
      id: "B_X360_DORM_INTRARE",
      x: ax.X_DORM_E - COL_THRU,
      y: ax.Y_DORM_S,
      dx: COL_THRU + COL_ALONG,
      dy: CONC_S - ax.Y_DORM_S,
      levels: ["P", "E"],
      supports: ["C_S_DORM_E", "C_S_INTRARE_W"],
      note: "STUDIU: dx=70 = pad prin C_S_DORM_E + C_S_INTRARE_W nealiniați; lățime structurală tip 30 — conflict geometric / soluție explicită",
    },
    {
      id: "B_Y830",
      x: GEO_X0 + 360,
      y: CONC_S - COL_THRU,
      dx: 175 + COL_THRU,
      dy: COL_THRU,
      levels: ["P", "E"],
      supports: ["C_S_INTRARE_W", "C_S_INTRARE_E"],
      note: "sud intrare pe muchie placă (C_S_INTRARE_W/E); nod B_CASA_SCARA · continuă E cu B_S_SE",
    },
    {
      id: "B_E_S",
      x: CONC_E - COL_THRU,
      y: ax.Y_PALIER_ETAJ_S,
      dx: COL_THRU,
      dy: CONC_S - ax.Y_PALIER_ETAJ_S,
      levels: ["P", "E"],
      supports: ["B_E", "C_SE"],
      span_cm: +(CONC_S - ax.Y_PALIER_ETAJ_S).toFixed(1),
      note:
        "centură E sud — închide inel Y590→CONC_S pe față beton; reazeme B_E@590 + C_SE. Span ~261 = FE (C_SHAFT rămâne S-only — nu pe palier P).",
    },
    {
      id: "B_S_SE",
      x: GEO_X0 + 535,
      y: CONC_S - COL_THRU,
      dx: +(CONC_E - (GEO_X0 + 535)).toFixed(1),
      dy: COL_THRU,
      levels: ["P", "E"],
      supports: ["C_S_INTRARE_E", "C_SE"],
      note: "centură S est — C_S_INTRARE_E→C_SE; închide colț SE pe muchie CONC",
    },
    {
      // Bordură N doar pe conturul palierului (X565+), nu în livingul de la X536.
      // Capăt V = liber: consolă odată cu placa pe B_E (LOCK-1R). Levels P+E = planșeu + streșină.
      id: "B_Y470_PALIER_EDGE",
      x: 565,
      y: ax.Y_PAL_N,
      dx: 105,
      dy: COL_THRU,
      levels: ["P", "E"],
      supports: ["B_E", "C_E_PAL"],
      exclude_basement: true,
      cantilever_west_of_B_E_cm: 105,
      note: "LOCK-1R: bordură N palier X565–670 (P+E). Fără stâlp V (living P). Consolă pe B_E. NU vestibul.",
      lock: "structure_landing_lock_v01 LOCK-1R",
    },
  ];

  const conflicts = [
    {
      id: "east_landing_span",
      severity: "STUDIU_CONSOLA",
      registry: "calcul_lipsă",
      detail:
        "LOCK-1R: palier = consolă pe B_E (sud 101 cm + vest ~105 cm cu B_Y470). Fără stâlp în living P (C_L_PAL retras). Calcul obligatoriu: armare consolă, torsiune/ancorare nod C_E_PAL.",
      solution_ref: "decisions/structure_landing_lock_v01.md",
      geometry: {
        B_E_cantilever_y0: 489,
        B_E_cantilever_y1: 590,
        B_E_cantilever_cm: 101,
        B_Y470_cantilever_west_cm: 105,
        C_L_PAL: "retras — living P",
        lock: "LOCK-1R",
      },
      geometry_status: "rezolvat_geometric_LOCK1R_consola",
    },
    {
      id: "palier_plate_support",
      severity: "STUDIU_CONSOLA",
      registry: "calcul_lipsă",
      detail:
        "LOCK-1R: placă palier consolă pe B_E + bordură N B_Y470 (P+E). P: living liber sub placă. E: circulație rece. Armare/pachet fono = calcul — schema geometrică asumată.",
      geometry_status: "rezolvat_geometric_LOCK1R_consola",
    },
    {
      id: "slab_span_without_X320",
      severity: "LOCK_P_SLAB20",
      registry: "calcul_lipsă",
      detail:
        "LOCK 2026-10-17: placă 20 fără B_BAND (L≈6,2). Ordin L/d OK @K1,3; FE SLS/ULS încă lipsă. Clear plafon 268 · sub grindă 259. Bandă retrasă (min proem.). C_N_MID păstrat până FE.",
      structural_slab_cm_current: SLAB_TH,
      structural_slab_alt_cm: 15,
      recommended_variant: "P_slab20_no_band",
      band_option: {
        id: "B_BAND_X320",
        axis: "C_N_MID–C_S_DORM_E",
        status: "retras_LOCK_2026-10-17",
        note: "fără bandă — placă 20; drop C_N_MID = comparație ulterioară după FE",
      },
      clear_cm: {
        slab_15: 273,
        slab_20: CLEAR_TO_FALSE_CEILING,
        slab_25: CLEAR_TO_FALSE_CEILING - 5,
        under_beam: CLEAR_P_UNDER_BEAM,
      },
      legal_priority: "clear_255_ok_slab20",
      prelim_ref: "outputs/reports/v47_a1_frame_slab_band_protrusion_v01.md",
    },
    {
      id: "inverted_beam_fit",
      severity: "FORM_OK",
      registry: "rezolvat_geometric",
      detail:
        "FORMĂ: capăt V = nod B_SEP@X566/Y600; capăt E = pier. Ușă liberă. Sandwich −30…+32 = detaliu armare (nu lipsește reazem).",
      door_kept: { y0: 500, y1: 600 },
      geometry_closed: { y0: 575, y1: 600, dy: 25 },
      geometry_status: "rezolvat_geometric",
      west_support: "B_SEP_AFTER_DOOR",
      east_support: "C_SHAFT_E_PIER",
    },
    {
      id: "B_Y470_basement_mirror",
      severity: "FIX_GENERATOR",
      registry: "rezolvat_geometric",
      detail:
        "LOCK-1R: B_Y470 pe P+E (X565–670) exclude_basement:true. Fără C_L_PAL / B_X535_PAL_N.",
    },
    {
      id: "basement_retaining",
      severity: "GEO_OK_CALC_OPEN",
      registry: "rezolvat_geometric",
      detail:
        "LOCK 2026-10-16: retenție perim modelată ca BA 20 cm (nu EB20). Mesh site_layer=structura. Partiții int. = umplutură 12,5. Rămâne calcul: împingere, talpă, XPS/hidro, geo 131.",
      geometry_status: "rezolvat_geometric",
      calc_status: "calcul_lipsă",
      th_cm: 20,
    },
    {
      id: "roof_load_path",
      severity: "COMPARATIE_D3",
      registry: "calcul_lipsă",
      detail:
        "D3a+PV+zăpadă sk1,5: q_Ed~2,85 kN/m² (ordin). Solbanc/stâlpișori pe CONC/B_W·B_E. FE stâlpi+ancorare+inel = lipsă. Vezi roof_pv_snow_bearing.",
      prelim_ref: "outputs/reports/v47_a1_frame_roof_pv_snow_bearing_v01.md",
      prefer_first: "D3a_sarpanta_usoara",
      master_status: "outputs/reports/v47_a1_frame_variant_R_master_status_v01.md",
    },
    {
      id: "ring_E_SE_gap",
      severity: "GEO_OK_CALC_OPEN",
      registry: "rezolvat_geometric",
      detail:
        "LOCK 2026-10-17: C_SE @ CONC_E×CONC_S + B_E_S (Y590→S) + B_S_SE (C_S_INTRARE_E→C_SE). Inel E închis geometric. C_SHAFT_E_PIER rămâne S-only (palier). FE pe span B_E_S ~261 cm = calcul_lipsă.",
      geometry_status: "rezolvat_geometric",
      calc_status: "calcul_lipsă",
      prelim_ref: "outputs/reports/v47_a1_frame_roof_pv_snow_bearing_v01.md",
    },
    {
      id: "foundations_width",
      severity: "GEO_STUDY",
      registry: "rezolvat_geometric",
      detail:
        "LOCK studiu: talpă 80×80 + FG bandă 60 (nu = grindă 30). EST excentric interior. P_work 200 pe N_ser; Pconv 310 = ref. Rc 131 = calcul_lipsă.",
      geometry_status: "rezolvat_geometric",
      calc_status: "calcul_lipsă",
      pad_side_cm: 80,
      strip_width_cm: 60,
      prelim_ref: "outputs/reports/v47_a1_frame_calc_2_6_2_7_foundations_roof_v01.md",
    },
    {
      id: "north_three_supports",
      severity: "COMPARATIE",
      registry: "calcul_lipsă",
      detail:
        "C_N_BUC eliminat. C_N_MID@X320. B_N pe NW–N_MID–NE. Alternativa: fara N_MID.",
    },
    {
      id: "amenajare_frame_overlays",
      severity: "FRAME_ONLY",
      registry: "rezolvat_geometric",
      detail:
        "A1 aprobat neatins. In frame: dus x>=50; pat x>=45 — nu micsoram stalpii.",
    },
    {
      id: "column_thru_p100_flush",
      severity: "LOCK",
      registry: "rezolvat_geometric",
      detail:
        "LOCK 2026-10-16: COL_THRU=30 (P100 min) · stâlpi perimetrali pe muchia plăcii (N/V/E/S) · along=40 tip (calcul). Fără flush-int forțat pe beton — falie EB20 = zidărie.",
    },
    {
      id: "p100_min_section",
      severity: "LOCK",
      registry: "rezolvat_geometric",
      detail:
        "P100-1/2013 §5.3.2.2+§5.4.2.2: dimensiune minimă stâlp cadru ≥300 mm. Varianta A respectă geometric; armare/ductilitate = calcul. Varianta B = pereți structurali (studiu separat).",
    },
    {
      id: "etics_wrap_verify",
      severity: "LOCK",
      registry: "rezolvat_geometric",
      detail:
        "LOCK 2026-10-17: E/S — ETICS continuu pe stâlpi (beton=finit−A2). N/V — fără wrap (pilastru pe finit). O singură regulă fațadă.",
    },
    {
      id: "facade_slab_edge_masonry",
      severity: "LOCK",
      registry: "rezolvat_geometric",
      detail:
        "LOCK 2026-10-17: E/S finit plan (proem. int.); N/V int. la linie (pilastru ext. stâlp+placă). Util din fețe walls. Supersede beton-pe-finit E/S.",
    },
    {
      id: "slab_20_no_band",
      severity: "LOCK",
      registry: "rezolvat_geometric",
      detail:
        "LOCK 2026-10-17: placă structurală 20 cm; B_BAND_X320 retras (min proeminențe). Clear 268/259. FE pe L≈6,2 încă calcul_lipsă. C_N_MID păstrat.",
      geometry_status: "rezolvat_geometric",
      calc_status: "calcul_lipsă",
    },
    {
      id: "B_X360_wide_pad",
      severity: "LOCK_ACCEPT_PAD",
      registry: "rezolvat_geometric",
      detail:
        "LOCK 2026-10-16: acceptăm pad dx=70 (COL_THRU+COL_ALONG) ca geometrie unică — compensare C_S_DORM_E vs C_S_INTRARE_W nealiniați. Fără aliniere stâlpi în această rundă (Δ util amânat). Armare pad = calcul.",
      legal_note: "Nu atinge POT/255. Aliniere stâlpi = opțiune viitoare cu Δ util pe masă.",
      pad_dx_cm: 70,
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
    /**
     * Muchie placă STRUCTURALĂ = față beton stâlpi (nu anvelopa finită).
     * E/S: CONC = finit−A2 → stâlpii stau pe muchia plăcii; ETICS atârnă afară.
     * View Structură: fără consolă falsă 10,5 cm de placă peste umplutură.
     */
    structural_footprint_cm: {
      x0: CONC_W,
      y0: CONC_N,
      ew: +(CONC_E - CONC_W).toFixed(1),
      ns: +(CONC_S - CONC_N).toFixed(1),
      x1: CONC_E,
      y1: CONC_S,
      finished_envelope_cm: { ew: FINISHED_E, ns: FINISHED_S },
      note: "placă BA pe CONC; envelope finit (POT) = CONC + ETICS pe E/S",
    },
    column_section_hypothesis_cm: {
      through_wall_cm: COL_THRU,
      along_wall_cm: COL_ALONG,
      local_protrusion_inward_cm: PROTRUSION_IN,
      perimeter_align: "finished_face_rule_2026-10-17",
      finished_wall_kept_cm: 30,
      fill_between_columns: "EB20_Akustik_200",
      column_replaces_fill_locally: true,
      etics_wrap_on_perimeter_columns_in_frame_mesh: "E_S_yes_N_W_no",
      facade_finish_rule: {
        principle:
          "E/S: finit plan, beton=finit−ETICS, ETICS continuu, proem. int. · N/V: int. la linie, pilastru stâlp+placă pe exterior",
        A1_outside_brick_cm: ETICS_A1,
        A2_outside_brick_cm: ETICS_A2,
        north: "A1_pilaster",
        east_south: "A2_planar",
        west: "A2_pilaster",
        concrete_E_cm: CONC_E,
        concrete_S_cm: CONC_S,
        interior_E_cm: INT_E,
        interior_W_cm: INT_W,
      },
      etics_outside_cm: ETICS,
      etics_A1_cm: ETICS_A1,
      etics_A2_cm: ETICS_A2,
      status: "LOCK P100≥30 + fațadă unică 2026-10-17; capacitate — calcul",
      note: "O geometrie: finit / beton / int. Util = fețe walls. Umplutură EB20 între stâlpi.",
      study_variants: ["A_cadre_BA_min30", "B_pereti_structurali_BA"],
    },
    columns,
    beams,
    inverted_edge_beam: invertedEdgeBeam,
    stair_structure_system: {
      system: "trepte_pe_placi_BA_cu_vanguri",
      podest_ba_cm: 15,
      podest_finish_pack_cm: 12,
      ramp_plate_cm: 20,
      stringer_th_cm: 12,
      bearing_into_podest_cm: 15,
      note: "Fiecare treaptă pe placă BA proprie (contact intrados); vanguri pe muchii rezemate în placa podestului. Grosimi neconfirmate prin calcul.",
    },
    removed_from_prior_grid: removed,
    removed_from_east_landing_study: [
      {
        id: "C_E_LAND_SP",
        reason: "RETRAS: bloca palier/rampă beci — nu se reintroduce",
      },
      {
        id: "B_LAND_S_EDGE",
        reason: "RETRAS odată cu stâlpul; formă care taie treapta interzisă",
      },
    ],
    conflicts_unresolved: conflicts,
    slab_policy: {
      current_cm: SLAB_TH,
      alt_cm: 15,
      band: "none — B_BAND_X320 retras",
      clear_ff306_cm: {
        15: CLEAR_TO_FALSE_CEILING + 5,
        20: CLEAR_TO_FALSE_CEILING,
        25: CLEAR_TO_FALSE_CEILING - 5,
        28: CLEAR_TO_FALSE_CEILING - 8,
      },
      preferred_until_fe: 20,
      lock: "LOCK_P_2026-10-17_slab20_no_band",
      legal_clear_target_cm: 255,
      note: `LOCK placă ${SLAB_TH} fără bandă (clear ${CLEAR_TO_FALSE_CEILING} @ FF→FF ${FF_TO_FF}). Sub grindă ${CLEAR_P_UNDER_BEAM}. FE pe 6,2 m încă lipsă.`,
      clear_under_beam_cm: CLEAR_P_UNDER_BEAM,
      clear_to_false_ceiling_cm: CLEAR_TO_FALSE_CEILING,
    },
    geotech_ref: "decisions/geotech_hypothesis_v01.md",
    foundations_study_cm: {
      pad_side_cm: 80,
      strip_width_cm: 60,
      east_eccentric_inward: true,
      p_work_kPa: 200,
      pconv_ref_kPa: 310,
      status: "ipoteză_studiu",
      note: "Talpă 80 + FG 60; EST spre interior. Nu Rc 131. Vezi calc_2_6_2_7.",
    },
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
      clear_to_false_ceiling_cm: CLEAR_TO_FALSE_CEILING,
      ff_to_ff_cm: FF_TO_FF,
      stair_riser_cm: STAIR_RISER_CM,
      note: `FF P +48 (entry 3×16); scară P→E ${STAIR_RISERS_FF}×${STAIR_RISER_CM}=${FF_TO_FF}; clear plafon ${CLEAR_TO_FALSE_CEILING}; sub grindă ${CLEAR_P_UNDER_BEAM}.`,
      column_continuity: "stâlpi cu levels P+E traversează placa și buildup; fără gap pe FF",
    },
    access_clearances: {
      basement_stair_clear: { x0: GEO_X0 + 565, x1: GEO_X0 + 665, y0: 600, y1: 800 },
      lower_landing: { x0: GEO_X0 + 565, x1: GEO_X0 + 680, y0: 490, y1: 600 },
      door: { x0: GEO_X0 + 535, x1: GEO_X0 + 565, y0: 500, y1: 600 },
      C_E_PAL: { y0: 449, y1: 489, note: "N de palier (rezervă finisaj) — nu pe clar transport" },
      C_CASA_SCARA: { y0: 610, y1: 650, note: "S de ușă + rezervă" },
      C_E_SOLID_N: { removed: true, reason: "intra în palier inferior" },
    },
    coordinate_sync: {
      GEO_X0,
      note: "Axe cadru = aceleași ca pereții după geometry_assemblies v01 (A2 +1.3 + recenter)",
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

    // Retenție = BA (nu EB20). Grosime studiu 20 cm; XPS exterior = rundă separată.
    const thPrev = out.basement_cm.wall_thickness_study_cm || {};
    out.basement_cm.wall_thickness_study_cm = {
      ...thPrev,
      retaining_ba_cm: 20,
      perimeter_structure_cm: 20,
      perimeter_note:
        "FRAME LOCK 2026-10-16: retenție perim = BA 20 cm (nu EB20 umplutură). Partiții int. rămân 12,5. View Structură = BA. XPS/hidro pe față ext. = detaliu ulterior.",
      brick_sono_basement_perimeter: false,
    };
    out.basement_cm.retaining_walls_ba = {
      status: "geo_model",
      th_cm: 20,
      material: "BA",
      replaces: "EB20_perimeter_umplutura",
      walls: [
        "subsol_reten_ba_n",
        "subsol_reten_ba_w",
        "subsol_reten_ba_s_dep",
        "subsol_reten_ba_s_hol",
        "subsol_reten_ba_hol_vest_reintrant",
        "subsol_reten_ba_ct_est",
      ],
      note: "Demolare integrală 131 → BA nou. Capacitate/împingere = calcul (geo 131).",
    };
  }

  // P only: living sub palier ↔ puț. Pe etaj NU — altfel bagă palierul rece în casă.
  const livingPutWall = {
    id: "living_put_thermal_y590",
    x: 565,
    y: 560,
    dx: 85,
    dy: 30,
    kind: "ext",
    thermal: "heated_thermosystem",
    assembly: "EB20_Akustik_200_ISOVER_FASSADE_80",
    catalog_id: "A6",
    levels: [0],
    outward_hint: "north",
    toward: "shaft_cold",
    note: "P only: living↔puț sub palier; izolație spre N (puț); pe E înlocuit de L A6 (palier afară)",
  };
  // L A6 etaj: palier scară RECE în afara apartamentului
  const a6West = {
    id: "buc_est_etaj",
    x: GEO_X0 + 535,
    y: 470,
    dx: 30,
    dy: 390,
    kind: "ext",
    thermal: "house_stair_separator",
    catalog_id: "A6",
    assembly: "A6",
    thickness_finished_mm: 300,
    levels: [1],
    outward_hint: "east",
    note: "L A6 picior V: casă (vest) ↔ scară/palier rece (est)",
  };
  const a6Nord = {
    id: "palier_A6_nord_etaj",
    // picior N al L: pe Y470 (marginea sud a palierului) — casă la SUD, palier la NORD
    x: GEO_X0 + 535 + 30,
    y: 470,
    dx: 145 - 30,
    dy: 30,
    kind: "ext",
    thermal: "house_stair_separator",
    catalog_id: "A6",
    assembly: "A6",
    thickness_finished_mm: 300,
    levels: [1],
    outward_hint: "north",
    note: "L A6 picior N @ Y470: casă (sud) ↔ palier scară rece (nord) — izolație spre palier; palier AFARĂ",
  };
  out.walls_cm = [
    ...(out.walls_cm || []).filter(
      (w) => !["living_put_thermal_y590", "buc_est_etaj", "palier_A6_nord_etaj"].includes(w.id)
    ),
    livingPutWall,
    a6West,
    a6Nord,
  ];

  // Contur util = fețe interioare walls_cm (aceeași secțiune ca volumul).
  // E/S: INT = finit − (A2+EB20+finisaj); stâlpi proem. scăzuți separat.
  // N/V: INT la linie cu falie (pilastru afară).
  const polyP = [
    [INT_W, INT_N],
    [INT_E, INT_N],
    [INT_E, 590],
    [565, 590],
    [565, 440],
    [535, 440],
    [535, INT_S],
    [360, INT_S],
    [360, INT_S_DORM],
    [INT_W, INT_S_DORM],
    [INT_W, INT_N],
  ];
  const polyE = [
    [INT_W, INT_N],
    [INT_E, INT_N],
    [INT_E, 470],
    [535, 470],
    [535, INT_S],
    [360, INT_S],
    [360, INT_S_DORM],
    [INT_W, INT_S_DORM],
    [INT_W, INT_N],
  ];
  const palierScaraRect = { x: 565, y: 470, dx: 105, dy: 120 };
  const palierScaraM2 = +rectAreaM2(palierScaraRect).toFixed(3);
  const facadeFaces = {
    finished: { W: FINISHED_W, N: FINISHED_N, E: FINISHED_E, S: FINISHED_S },
    concrete: { W: CONC_W, N: CONC_N, E: CONC_E, S: CONC_S, S_dorm: CONC_S_DORM },
    interior: {
      W: INT_W,
      N: INT_N,
      E: INT_E,
      S_intrare: INT_S,
      S_dorm: INT_S_DORM,
    },
    excess_cm: MASONRY_EXCESS_CM,
    etics_cm: { N: ETICS_A1, E: ETICS_A2, S: ETICS_A2, W: ETICS_A2 },
    rule: "E/S finit plan (beton=finit−ETICS, proem. int.) · N/V int. la linie (pilastru ext.)",
  };
  out.interior_polygon_cm = {
    note: "Util P din fețe int. walls (sync volum); living sub palier; EXCLUDE terasă/acces",
    masonry_faces_cm: facadeFaces,
    vertices: polyP,
    excludes: ["terasa", "uncovered_south", "entry_steps", "curte_engleza", "alee"],
  };
  out.interior_polygon_etaj_cm = {
    note: "Util E STUDIO din aceleași fețe int.; EXCLUDE palier scară rece (L A6) + exterior",
    masonry_faces_cm: facadeFaces,
    vertices: polyE,
    excludes: ["terasa", "uncovered_south", "rampă_exterioară", "palier_scara_rece"],
  };
  out.stair_cm = out.stair_cm || {};
  // LOCK: contratrepă 17 pe R1+R2; entry_steps rămân 16 (FF P +48).
  out.stair_cm.note = `${STAIR_RISERS_FF}×${STAIR_RISER_CM} FF→FF ${FF_TO_FF}. Entry 3×16=+48 neschimbat. Trepte clear 105 + parapet 10 = bandă 115.`;
  out.stair_cm.riser_cm = STAIR_RISER_CM;
  out.stair_cm.risers_total_from_ff = STAIR_RISERS_FF;
  out.stair_cm.podest_height_above_ff_cm = PODEST_ABOVE_FF;
  out.stair_cm.palier_sup_height_above_ff_cm = FF_TO_FF;
  if (out.stair_cm.podest_se) out.stair_cm.podest_se.z_above_ff_cm = PODEST_ABOVE_FF;
  if (out.stair_cm.palier_superior) out.stair_cm.palier_superior.z_above_ff_cm = FF_TO_FF;
  if (out.stair_cm.ramp2) out.stair_cm.ramp2.riser_cm = STAIR_RISER_CM;
  if (out.stair_cm.flight_180) out.stair_cm.flight_180.riser_cm = STAIR_RISER_CM;
  // heights_cm — sursa build_v47_3d (riser + ff_to_ff)
  out.heights_cm = {
    ...(out.heights_cm || {}),
    note: `FF→FF ${FF_TO_FF} = clear ${CLEAR_TO_FALSE_CEILING}+${FALSE_CEILING_CM}+${SLAB_TH}+3+2+5+2. Scară ${STAIR_RISERS_FF}×${STAIR_RISER_CM}. Placă ${SLAB_TH} fără bandă. Entry riser 16.`,
    clear_to_false_ceiling_cm: CLEAR_TO_FALSE_CEILING,
    false_ceiling_cm: FALSE_CEILING_CM,
    structural_slab_cm: SLAB_TH,
    insulation_under_screed_cm: 3,
    heating_pipes_zone_cm: 2,
    screed_above_pipes_cm: 5,
    finish_complete_cm: 2,
    floor_buildup_below_ff_cm: FLOOR_BUILDUP,
    ff_to_ff_cm: FF_TO_FF,
    ff_check_sum: `${CLEAR_TO_FALSE_CEILING}+${FALSE_CEILING_CM}+${SLAB_TH}+3+2+5+2=${FF_TO_FF}`,
    stair_risers_ff: STAIR_RISERS_FF,
    riser_cm: STAIR_RISER_CM,
    wall_to_soffit_cm: CLEAR_TO_FALSE_CEILING + FALSE_CEILING_CM,
    slab_lock: "P_20_no_band_2026-10-17",
    entry_steps_to_terrace: 3,
    entry_step_riser_cm: 16,
    entry_steps_status: "locked_2_treads_3_risers",
    z_parter_ff_note: "zParter = 3 × 16 = +48 (entry); scară P→E pe riser 17",
  };
  out.stair_cm.palier_ramp2_nosing = {
    x: 565,
    y: 580,
    dx: 105,
    dy: 20,
    note: "bandă legătură palier→rampă2 @ Y590 — închide golul",
    role: "landing_to_flight_nosing",
  };

  const wallsNetP = intWallsNetM2(out.walls_cm, out.openings_cm, 0);
  const wallsNetE = intWallsNetM2(out.walls_cm, out.openings_cm, 1);
  // Thermal: doar aria efectiv în interiorul conturului util (nu dublă scădere pe A6 L deja exclus din polyE).
  const thermalP = wallOnLevel(livingPutWall, 0)
    ? +rectAreaInsidePolyM2(livingPutWall, polyP).toFixed(3)
    : 0;
  const thermalERaw =
    (wallOnLevel(a6West, 1) ? rectAreaInsidePolyM2(a6West, polyE) : 0) +
    (wallOnLevel(a6Nord, 1) ? rectAreaInsidePolyM2(a6Nord, polyE) : 0);
  const thermalE = +thermalERaw.toFixed(3);
  const thermalEFull =
    (wallOnLevel(a6West, 1) ? rectAreaM2(a6West) : 0) +
    (wallOnLevel(a6Nord, 1) ? rectAreaM2(a6Nord) : 0);

  let protrP = 0;
  let protrE = 0;
  for (const c of fr.columns) {
    const pin = c.protrusion_into_room_cm || 0;
    if (!(pin > 0)) continue;
    const along =
      Math.max(c.dx, c.dy) >= COL_ALONG
        ? Math.min(COL_ALONG, Math.max(c.dx, c.dy))
        : Math.max(c.dx, c.dy);
    const a = (pin * along) / 10000;
    if ((c.levels || []).includes("P")) protrP += a;
    if ((c.levels || []).includes("E")) protrE += a;
  }

  const grossP = shoelaceM2(polyP);
  const grossE = shoelaceM2(polyE);
  const usefulP = +(grossP - wallsNetP - thermalP - protrP).toFixed(3);
  const usefulE = +(grossE - wallsNetE - thermalE - protrE).toFixed(3);

  const usefulTable = {
    method:
      "fețe int. = walls (E/S plan, N/V linie): shoelace − pereți int. net − thermal în poly − proem. stâlpi E/S. Fără dublă scădere A6 L exclus din polyE.",
    useful_parter_m2: usefulP,
    useful_etaj_m2: usefulE,
    useful_etaj_studio_m2: usefulE,
    status_util: "NECONFIRMAT",
    declared_pass_util: false,
    legal_note:
      "Autorizare: perete dorm↔living jos → o cameră (living deschis). 37 m² = prag informativ 1 cameră; nu PASS. Util geometric NECONFIRMAT.",
  };

  const footprintM2 = +((SLAB_E - SLAB_W) * (SLAB_S - SLAB_N) / 10000).toFixed(4);
  const pot147 = footprintM2 / PARCEL_M2_MEASURED;
  const pot172 = footprintM2 / PARCEL_M2_ACTS;
  const uncoveredTerr = out.areas_cm?.uncovered_terrace_m2 ?? 4.082;
  const potBlock = {
    amprenta_casa_m2: footprintM2,
    envelope_cm: { ew: SLAB_E - SLAB_W, ns: SLAB_S - SLAB_N },
    uncovered_terrace_m2: uncoveredTerr,
    uncovered_in_pot: false,
    parcel_measured_m2: PARCEL_M2_MEASURED,
    parcel_acts_m2: PARCEL_M2_ACTS,
    pot_on_147: +pot147.toFixed(4),
    pot_pct_147: +(pot147 * 100).toFixed(2),
    pot_on_172: +pot172.toFixed(4),
    pot_pct_172: +(pot172 * 100).toFixed(2),
    cut_on_147_PxE: +((2 * footprintM2) / PARCEL_M2_MEASURED).toFixed(4),
    existing_C1_m2: 76,
    existing_pot_pct_147: 51.7,
    delta_vs_C1_m2: +(footprintM2 - 76).toFixed(4),
    masonry_note:
      "Amprentă = față finită 682,6×861,3. E/S: beton retras A2, ETICS până la finit (plan). N/V: pilastru pe finit. EST pe limită — fără +cm afară.",
    status: "CALCUL_STUDIU — max POT din RLU/CU NECUNOSCUT",
    verdict_vs_existent: "sub amprenta C1 existent (76 m²); pe 147 ≈40%",
  };

  out.areas_cm = {
    ...out.areas_cm,
    /** Un singur tabel P/E — sursa canonică FRAME. */
    useful_by_level: {
      parter_m2: usefulP,
      etaj_m2: usefulE,
      method: usefulTable.method,
      status: "NECONFIRMAT",
    },
    useful_parter_m2: usefulP,
    useful_etaj_m2: usefulE,
    useful_etaj_studio_m2: usefulE,
    pot: potBlock,
    pot_note: `amprentă ${footprintM2} m²; POT 147=${potBlock.pot_pct_147}% / 172=${potBlock.pot_pct_172}%; falie=zidărie (N/V afară, E/S plan). Max POT RLU = DE VERIFICAT.`,
    frame_study_areas: {
      ...usefulTable,
      useful_etaj_shoelace_m2: usefulE,
      useful_etaj_labels_sum_m2: null, // completat după free-spaces
      palier_scara_rece_m2: palierScaraM2,
      palier_scara_rect_cm: palierScaraRect,
      vestibule_palier_m2: 0,
      vestibule_eliminated: true,
      gross_parter_m2: +grossP.toFixed(3),
      gross_etaj_studio_m2: +grossE.toFixed(3),
      gross_etaj_m2: +grossE.toFixed(3),
      thermal_enclosure_P_m2: thermalP,
      thermal_enclosure_E_m2: thermalE,
      thermal_enclosure_E_full_rects_m2: +thermalEFull.toFixed(3),
      thermal_E_outside_contour_m2: +(thermalEFull - thermalE).toFixed(3),
      column_protrusion_P_m2: +protrP.toFixed(3),
      column_protrusion_E_m2: +protrE.toFixed(3),
      walls_int_net_P_m2: +wallsNetP.toFixed(3),
      walls_int_net_E_m2: +wallsNetE.toFixed(3),
      masonry_falie_faces_cm: facadeFaces,
      pot: potBlock,
      reference_threshold_m2: REF_USEFUL,
      delta_P_vs_37: +(usefulP - REF_USEFUL).toFixed(3),
      delta_E_studio_vs_37: +(usefulE - REF_USEFUL).toFixed(3),
      delta_E_vs_37: +(usefulE - REF_USEFUL).toFixed(3),
      ref_a1_useful_was:
        base.areas_cm?.useful_recalc_a1?.useful_geometric_m2 ??
        base.areas_cm?.useful_geometric_m2 ??
        null,
      note:
        "Fără PASS. Util = falie la cheie − obstacole. Etichete libere = informativ. Palier scară rece exclus din polyE. POT pe anvelopă finită (falie N/V nu micșorează max extent).",
    },
    useful_geometric_m2: usefulP,
    useful_etaj_geometric_m2: usefulE,
  };

  // Scoate din studiu ziduri/uși marcate removed (vestibul eronat)
  out.walls_cm = (out.walls_cm || []).filter((w) => !w.removed);
  out.openings_cm = (out.openings_cm || []).filter((o) => !o.removed);

  if (out.basement_cm?.door_to_rooms) {
    out.basement_cm.door_to_rooms.frame_study_note =
      "Gol Y500–600 PĂSTRAT. C_CASA_SCARA @ Y610+. C_E_PAL Y450–490 (nu pe palier). Grindă întoarsă X565.";
  }
  if (out.basement_cm?.slab_coordination_cm) {
    const sc = out.basement_cm.slab_coordination_cm;
    sc.edge_beam_y = 590;
    sc.edge_beam_x0 = fr.inverted_edge_beam.x;
    sc.edge_beam_dx = fr.inverted_edge_beam.dx;
    sc.edge_beam_mode = "inverted_study";
    sc.edge_beam_depth_cm = null;
    sc.edge_beam_clear_under_cm = null;
    sc.edge_beam_note = `FRAME: grindă întoarsă Y575–600 X${fr.inverted_edge_beam.x}–${fr.inverted_edge_beam.x + fr.inverted_edge_beam.dx}, z −30…−5 (formă închisă). Clear acces pe h ușă; sandwich −30…+32 = armare (calcul).`;
    sc.inverted_edge_beam = fr.inverted_edge_beam;
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
  const ox = 48;
  const oy = 48;
  const fr = study.structure_frame_study_cm;
  /** Plan = finit (POT) + placă/stâlpi pe CONC. */
  const EW = FINISHED_E; // 682.6
  const NS = FINISHED_S; // 861.3
  const fp = fr.structural_footprint_cm || {
    x0: CONC_W,
    y0: CONC_N,
    ew: CONC_E - CONC_W,
    ns: CONC_S - CONC_N,
  };
  const W = EW * S + 140;
  const H = NS * S + 200;
  const px = (x) => ox + x * S;
  const py = (y) => oy + y * S;
  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  parts.push(`<rect width="100%" height="100%" fill="#f7f4ef"/>`);
  parts.push(
    `<text x="40" y="20" font-size="13" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">V47 A1 FRAME · plan finit + structură (neconstruibil)</text>`
  );
  parts.push(
    `<text x="40" y="36" font-size="9" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">Contur negru = finit ${EW}×${NS} (POT) · gri = placă BA ${fp.ew}×${fp.ns} · N/V structură pe muchie finit (pilastru) · E/S beton retras A2 (ETICS plan)</text>`
  );

  // 1) anvelopă FINITĂ (POT)
  parts.push(
    `<rect x="${px(0)}" y="${py(0)}" width="${EW * S}" height="${NS * S}" fill="#fff" stroke="#111" stroke-width="1.6"/>`
  );
  // 2) placă STRUCTURALĂ (CONC) — pe N/V coincide cu finit; pe E/S lasă bandă ETICS
  parts.push(
    `<rect x="${px(fp.x0)}" y="${py(fp.y0)}" width="${fp.ew * S}" height="${fp.ns * S}" fill="#8b8680" fill-opacity="0.22" stroke="#5a554e" stroke-width="1.4" stroke-dasharray="7 3"/>`
  );
  // bandă ETICS E + S (între CONC și finit)
  const etE = EW - (fp.x0 + fp.ew);
  const etS = NS - (fp.y0 + fp.ns);
  if (etE > 0.5) {
    parts.push(
      `<rect x="${px(fp.x0 + fp.ew)}" y="${py(fp.y0)}" width="${etE * S}" height="${fp.ns * S}" fill="#c5d5e8" fill-opacity="0.55" stroke="#6a8aaa" stroke-width="0.5"/>`,
      `<text x="${px(fp.x0 + fp.ew + etE / 2)}" y="${py(NS / 2)}" text-anchor="middle" font-size="7" fill="#2a4a6a" transform="rotate(90 ${px(fp.x0 + fp.ew + etE / 2)} ${py(NS / 2)})">ETICS E ${etE}</text>`
    );
  }
  if (etS > 0.5) {
    parts.push(
      `<rect x="${px(fp.x0)}" y="${py(fp.y0 + fp.ns)}" width="${fp.ew * S}" height="${etS * S}" fill="#c5d5e8" fill-opacity="0.55" stroke="#6a8aaa" stroke-width="0.5"/>`,
      `<text x="${px(EW / 2)}" y="${py(fp.y0 + fp.ns + etS / 2) + 3}" text-anchor="middle" font-size="7" fill="#2a4a6a">ETICS S ${etS}</text>`
    );
  }
  // mark N/V: structură = finit (pilastru pe muchie)
  parts.push(
    `<text x="${px(EW / 2)}" y="${py(12)}" text-anchor="middle" font-size="8" font-weight="600" fill="#1a5c2a">N — pilastru pe finit (placă=muchie)</text>`,
    `<text x="${px(14)}" y="${py(NS / 2)}" text-anchor="middle" font-size="8" font-weight="600" fill="#1a5c2a" transform="rotate(-90 ${px(14)} ${py(NS / 2)})">V — pilastru pe finit</text>`
  );

  const dimY = py(NS) + 22;
  const dimX = px(EW) + 18;
  parts.push(
    `<line x1="${px(0)}" y1="${dimY}" x2="${px(EW)}" y2="${dimY}" stroke="#111" stroke-width="0.9"/>`,
    `<line x1="${px(0)}" y1="${dimY - 4}" x2="${px(0)}" y2="${dimY + 4}" stroke="#111" stroke-width="0.9"/>`,
    `<line x1="${px(EW)}" y1="${dimY - 4}" x2="${px(EW)}" y2="${dimY + 4}" stroke="#111" stroke-width="0.9"/>`,
    `<text x="${px(EW / 2)}" y="${dimY + 12}" text-anchor="middle" font-size="12" font-weight="700" fill="#111" font-family="IBM Plex Sans,Segoe UI,sans-serif">${EW} finit</text>`,
    `<line x1="${dimX}" y1="${py(0)}" x2="${dimX}" y2="${py(NS)}" stroke="#111" stroke-width="0.9"/>`,
    `<line x1="${dimX - 4}" y1="${py(0)}" x2="${dimX + 4}" y2="${py(0)}" stroke="#111" stroke-width="0.9"/>`,
    `<line x1="${dimX - 4}" y1="${py(NS)}" x2="${dimX + 4}" y2="${py(NS)}" stroke="#111" stroke-width="0.9"/>`,
    `<text x="${dimX + 14}" y="${py(NS / 2)}" text-anchor="middle" font-size="12" font-weight="700" fill="#111" font-family="IBM Plex Sans,Segoe UI,sans-serif" transform="rotate(90 ${dimX + 14} ${py(NS / 2)})">${NS} finit</text>`,
    `<text x="${px(EW / 2)}" y="${py(0) - 16}" text-anchor="middle" font-size="11" font-weight="600" fill="#111" font-family="IBM Plex Sans,Segoe UI,sans-serif">finit ${EW} × ${NS} cm · placă ${fp.ew} × ${fp.ns}</text>`
  );
  // walls amenajare (light, sub structură)
  for (const w of study.walls_cm || []) {
    if (w.kind === "parapet") continue;
    parts.push(
      `<rect x="${px(w.x)}" y="${py(w.y)}" width="${w.dx * S}" height="${w.dy * S}" fill="${w.kind === "ext" ? "#e8e0d0" : "#eee8e0"}" stroke="#999" stroke-width="0.4" opacity="0.55"/>`
    );
  }
  const ax = fr.axes_cm;
  const xShow = [
    ["X_W", ax.X_W],
    ["X_E beton", ax.X_E],
    ["X_E finit", ax.X_E_FINISHED ?? EW],
  ];
  const yShow = [
    ["Y_N", ax.Y_N],
    ["Y_S beton", ax.Y_S_CONC ?? CONC_S],
  ];
  for (const [, xv] of xShow) {
    if (xv == null) continue;
    parts.push(
      `<line x1="${px(xv)}" y1="${py(0)}" x2="${px(xv)}" y2="${py(NS)}" stroke="#c45c26" stroke-width="0.5" stroke-dasharray="4 3" opacity="0.7"/>`
    );
  }
  const xLabY = dimY + 28;
  for (const [name, xv] of xShow) {
    if (xv == null) continue;
    parts.push(
      `<text x="${px(xv)}" y="${xLabY}" text-anchor="middle" font-size="7" fill="#c45c26">${name}=${xv}</text>`
    );
  }
  for (const [name, yv] of yShow) {
    if (yv == null) continue;
    parts.push(
      `<line x1="${px(0)}" y1="${py(yv)}" x2="${px(EW)}" y2="${py(yv)}" stroke="#2a6f97" stroke-width="0.5" stroke-dasharray="4 3" opacity="0.7"/>`,
      `<text x="${px(0) - 2}" y="${py(yv) + 3}" text-anchor="end" font-size="7" fill="#2a6f97">${name}=${yv}</text>`
    );
  }
  for (const b of fr.beams) {
    parts.push(
      `<rect x="${px(b.x)}" y="${py(b.y)}" width="${b.dx * S}" height="${b.dy * S}" fill="#6a6358" opacity="0.55" stroke="#333" stroke-width="0.5"/>`
    );
  }
  for (const c of fr.columns) {
    parts.push(
      `<rect x="${px(c.x)}" y="${py(c.y)}" width="${c.dx * S}" height="${c.dy * S}" fill="#3d3a36" stroke="#111" stroke-width="0.8"/>`
    );
    parts.push(
      `<text x="${px(c.x) + 1}" y="${py(c.y) - 2}" font-size="6.5" fill="#111" font-family="IBM Plex Sans,Segoe UI,sans-serif">${c.id}</text>`
    );
  }
  parts.push(
    `<rect x="${px(535)}" y="${py(500)}" width="${30 * S}" height="${100 * S}" fill="none" stroke="#2a6f97" stroke-width="1.5"/>`,
    `<text x="${px(570)}" y="${py(545)}" font-size="8" fill="#2a6f97">ușă Y500–600 LIBERĂ</text>`,
    `<rect x="${px(565)}" y="${py(575)}" width="${115 * S}" height="${15 * S}" fill="#5a8f6a" opacity="0.45" stroke="#2d5a27"/>`,
    `<text x="${px(570)}" y="${py(572)}" font-size="7" fill="#2d5a27">grindă întoarsă X565</text>`
  );
  const ar = study.areas_cm.frame_study_areas;
  parts.push(
    `<text x="40" y="${H - 28}" font-size="8" fill="#333">Legendă: negru=finit · gri întrerupt=placă BA · albastru=ETICS pe E/S · stâlpi pe muchie placă. N/V: fără bandă ETICS (pilastru). E/S: fațadă plană.</text>`,
    `<text x="40" y="${H - 12}" font-size="8" fill="#555">Stâlpi ${COL_THRU}×${COL_ALONG} · util P ${ar.useful_parter_m2} / E ${ar.useful_etaj_m2} m² (NECONFIRMAT)</text>`
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
    `<text x="40" y="290" font-size="9" fill="#444">Clear acces: formă întoarsă închisă (Y575–600). Sandwich −30…+32 = detaliu armare (calcul).</text>`
  );

  // Sec B — cote etaj / placă
  parts.push(`<text x="520" y="50" font-size="11">B — cote planșeu etaj (absolut cm)</text>`);
  const rows = [
    ["FF etaj", lv.ff_etaj],
    ["față sup. placă (FF−12)", lv.slab_top_etaj],
    [`intrados placă (${lv.slab_th_hypothesis ?? 20} cm)`, lv.slab_soffit_etaj],
    [`intrados grindă (${lv.beam_h_total_including_slab_zone ?? 35} cm tot)`, lv.beam_soffit_over_parter],
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

## Suprafețe utile — falie la cheie (NECONFIRMAT)
Metodă: ${ar.method}

Fețe falie: W ${ar.masonry_falie_faces_cm?.W} · N ${ar.masonry_falie_faces_cm?.N} · E ${ar.masonry_falie_faces_cm?.E} · S intrare ${ar.masonry_falie_faces_cm?.S_intrare} · S dorm ${ar.masonry_falie_faces_cm?.S_dorm} (exces ${ar.masonry_falie_faces_cm?.excess_cm} cm).

| Nivel | Util geometric m² | Status |
|-------|------------------:|--------|
| **Parter** | **${ar.useful_parter_m2}** | ${ar.status_util} |
| **Etaj (studio, fără palier rece)** | **${ar.useful_etaj_m2}** | ${ar.status_util} |

| Detaliu | m² |
|---------|---:|
| Brut shoelace P / E | ${ar.gross_parter_m2} / ${ar.gross_etaj_m2} |
| Pereți int net P / E | ${ar.walls_int_net_P_m2} / ${ar.walls_int_net_E_m2} |
| Thermal în contur P / E | ${ar.thermal_enclosure_P_m2} / ${ar.thermal_enclosure_E_m2} |
| Thermal E full rects (în afara conturului, **nescăzut**) | ${ar.thermal_E_outside_contour_m2 ?? "—"} |
| Proem. stâlpi E/S P / E | ${ar.column_protrusion_P_m2} / ${ar.column_protrusion_E_m2} |
| Palier scară rece (exclus) | ${ar.palier_scara_rece_m2 ?? "—"} |
| Etichete libere E (informativ) | ${ar.useful_etaj_labels_sum_m2 ?? "—"} |
| Δ vs 37 (informativ; autorizare = 1 cameră după demontare perete dorm) | ${ar.delta_P_vs_37} / ${ar.delta_E_vs_37} |

${ar.legal_note || ""}

## POT / amprentă (falie = zidărie)
| Mărime | Valoare |
|--------|---------|
| Amprentă | **${ar.pot?.amprenta_casa_m2 ?? "—"} m²** (${ar.pot?.envelope_cm?.ew}×${ar.pot?.envelope_cm?.ns} cm) |
| **POT pe 147 m²** | **${ar.pot?.pot_pct_147 ?? "—"}%** |
| POT pe 172 m² (acte) | ${ar.pot?.pot_pct_172 ?? "—"}% |
| vs C1 76 m² | ${ar.pot?.delta_vs_C1_m2 ?? "—"} m² |

${ar.pot?.masonry_note || ""}


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

  const plans = spawnSync(process.execPath, [path.join(ROOT, "src/export_v47_frame_plans.mjs")], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (plans.status !== 0) {
    console.error(plans.stdout, plans.stderr);
    process.exit(plans.status || 1);
  }
  console.log(plans.stdout);

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
        pot_pct_147: study.areas_cm.pot?.pot_pct_147,
        amprenta_m2: study.areas_cm.pot?.amprenta_casa_m2,
        status_util: study.areas_cm.frame_study_areas.status_util,
        transport: study.basement_cm.frame_transport_audit?.status,
        columns_on_landing: study.basement_cm.frame_transport_audit?.columns_intersecting_landing,
        approved_a1_untouched: true,
        GEO_X0: study.structure_frame_study_cm.axes_cm?.GEO_X0,
        files: [
          "data/building/v47_a1_frame_study.json",
          "viewer/data/volume_v47_a1_frame.json",
          "outputs/plans/36_v47_a1_frame_structure_overlay.svg",
          "outputs/plans/37_v47_a1_frame_sections.svg",
          "outputs/plans/38_v47_a1_frame_plan_parter.svg",
          "outputs/plans/39_v47_a1_frame_plan_etaj.svg",
          "outputs/plans/40_v47_a1_frame_stair_sections.svg",
          "outputs/reports/v47_a1_frame_structure.md",
        ],
      },
      null,
      2
    )
  );
}

main();
