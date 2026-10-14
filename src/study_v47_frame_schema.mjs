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
    Y_E_SOLID: 550, // N de început rampă beci Y600
    Y_DOOR_END: 600,
    Y_CASA_AFTER_DOOR: 610, // rezervă montant/finisaj după gol
    Y_DORM_S: 645,
    Y_INTRARE_S: 830,
  };

  const columns = [
    {
      id: "C_NW",
      x: ETICS,
      y: ETICS,
      dx: COL_ALONG,
      dy: COL_THRU,
      orient: "along_N",
      levels: ["S", "P", "E"],
      support_below: "fundație_N/W",
      protrusion_into_room_cm: PROTRUSION_IN,
      wall: "nord+vest",
      conflicts: [],
    },
    {
      id: "C_N_MID",
      x: 280,
      y: ETICS,
      dx: COL_ALONG,
      dy: COL_THRU,
      orient: "along_N",
      levels: ["S", "P", "E"],
      support_below: "fundație_N",
      protrusion_into_room_cm: PROTRUSION_IN,
      wall: "nord — reazem intermediar (compară cu grindă N pe deschidere mare)",
      conflicts: ["verificare goluri/ferestre nord"],
    },
    {
      id: "C_N_BUC",
      x: ax.X_CASA_SCARA,
      y: ETICS,
      dx: COL_THRU,
      dy: COL_THRU,
      orient: "corner_N",
      levels: ["S", "P", "E"],
      support_below: "fundație_N",
      wall: "nord @ X535",
      conflicts: [],
    },
    colEst("C_NE", ETICS, COL_ALONG, {
      wall: "est N de geam",
      conflicts: ["geam ~Y105–310 — doar în plin"],
    }),
    colVest("C_W_MID", 400, COL_ALONG, { wall: "vest" }),
    {
      id: "C_W_DORM",
      x: ETICS,
      y: ax.Y_DORM_S,
      dx: COL_ALONG,
      dy: COL_THRU,
      orient: "along_S",
      levels: ["S", "P", "E"],
      support_below: "fundație_S",
      protrusion_into_room_cm: PROTRUSION_IN,
      wall: "sud dorm W de gol terasă",
      conflicts: ["gol terasă X120–270"],
    },
    {
      id: "C_S_DORM_E",
      x: ax.X_DORM_E - COL_THRU,
      y: ax.Y_DORM_S,
      dx: COL_THRU,
      dy: COL_THRU,
      orient: "corner_S_dorm_E",
      levels: ["S", "P", "E"],
      support_below: "fundație_S",
      protrusion_into_room_cm: PROTRUSION_IN,
      wall: "capăt E perete sud dorm @ X360 — verifică intrare/mobilier",
      conflicts: ["proximitate circulație / ușă terasă"],
    },
    colEst("C_E_GEAM_S", 310, COL_ALONG, { wall: "est S de geam" }),
    colEst("C_E_PAL", ax.Y_PAL_N, COL_ALONG, {
      wall: "est sub vestibul",
      support_below: "fundație_E continuu — NU pe placă 15",
      replaces: ["pal_ne"],
      conflicts: ["înlocuiește pal_ne etaj-only"],
    }),
    // N de rampă beci (Y600): Y550–590 — nu îngustează banda X565–665
    colEst("C_E_SOLID_N", ax.Y_E_SOLID, 40, {
      wall: "est tronson plin N de rampă (înlocuiește C_E_PUT @ Y590)",
      replaces: ["C_E_PUT@Y590"],
      conflicts: [],
      clear_stair: "Y1=590 ≤ început rampă Y600; X în perete+proeminență living, nu în clar scară",
    }),
    // După capătul golului ușii Y600 + rezervă 10 → Y610–650
    {
      id: "C_CASA_SCARA",
      x: ax.X_CASA_SCARA,
      y: ax.Y_CASA_AFTER_DOOR,
      dx: COL_THRU,
      dy: COL_ALONG,
      orient: "along_separator",
      levels: ["S", "P", "E"],
      support_below: "fundație X535",
      wall: "buc_est după ușă (Y610+) — gol Y500–600 integral liber",
      replaces: ["buc_y590", "C_CASA_SCARA@Y590"],
      conflicts: [],
      door_clearance: "y0=610 ≥ door Y1=600 + 10 cm montant/finisaj",
    },
    {
      id: "C_S_INTRARE_W",
      x: 360,
      y: ax.Y_INTRARE_S,
      dx: COL_ALONG,
      dy: COL_THRU,
      orient: "along_S",
      levels: ["S", "P", "E"],
      support_below: "fundație_S_intrare",
      wall: "sud X360–535",
      conflicts: [],
    },
    {
      id: "C_S_INTRARE_E",
      x: ax.X_CASA_SCARA,
      y: ax.Y_INTRARE_S,
      dx: COL_THRU,
      dy: COL_THRU,
      orient: "corner_S",
      levels: ["S", "P", "E"],
      support_below: "fundație_S",
      wall: "sud @ X535",
      conflicts: [],
    },
  ];

  const removed = [
    { id: "part_mid", reason: "compartimentare 12,5 — nestructural" },
    { id: "pal_nw", reason: "etaj-only peste living — interzis" },
    { id: "pal_ne", reason: "înlocuit de C_E_PAL continuu" },
    { id: "C_E_PUT@Y590", reason: "îngusta scara X565–665 pe Y590–630 — mutat N ca C_E_SOLID_N" },
    { id: "C_CASA_SCARA@Y590", reason: "intersecta gol ușă — mutat la Y610+" },
    { id: "grinda_X320", reason: "nu pe fală compartimentare" },
    { id: "pereți_structurali_P_E", reason: "respins — doar cadre" },
    { id: "20x40_in_20cm_leaf", reason: "nu demonstrăm încadrarea în banda de 20 cm; studiem 30 cm + proeminență locală" },
  ];

  const beams = [
    {
      id: "B_N",
      x: ETICS,
      y: ETICS,
      dx: 650 - ETICS + COL_THRU,
      dy: COL_THRU,
      levels: ["P", "E"],
      note: "centură N — reazeme C_NW, C_N_MID, C_N_BUC, C_NE",
    },
    {
      id: "B_W",
      x: ETICS,
      y: ETICS,
      dx: COL_THRU,
      dy: ax.Y_DORM_S - ETICS,
      levels: ["P", "E"],
      note: "centură W",
    },
    {
      id: "B_E",
      x: 650 - PROTRUSION_IN,
      y: ETICS,
      dx: COL_THRU,
      dy: ax.Y_E_SOLID + 40 - ETICS,
      levels: ["P", "E"],
      note: "centură E pe C_NE…C_E_SOLID_N",
    },
    {
      id: "B_CASA_SCARA",
      x: ax.X_CASA_SCARA,
      y: ax.Y_CASA_AFTER_DOOR,
      dx: COL_THRU,
      dy: 860 - ax.Y_CASA_AFTER_DOOR,
      levels: ["S", "P", "E"],
      note: "separator de la Y610 (după ușă) la sud",
    },
    {
      id: "B_Y590_EDGE_INVERTED",
      ...INVERTED_BEAM,
      levels: ["S_inverted"],
      note: INVERTED_BEAM.note,
    },
    {
      id: "B_Y645",
      x: ETICS,
      y: ax.Y_DORM_S,
      dx: ax.X_DORM_E - ETICS,
      dy: COL_THRU,
      levels: ["P", "E"],
      note: "sud dorm — capăt E pe C_S_DORM_E",
    },
    {
      id: "B_Y830",
      x: 360,
      y: ax.Y_INTRARE_S,
      dx: 175,
      dy: COL_THRU,
      levels: ["P", "E"],
      note: "sud intrare",
    },
    {
      id: "B_Y470_VESTIBUL_CANTILEVER",
      x: ax.X_CASA_SCARA,
      y: ax.Y_PAL_N,
      dx: 145,
      dy: COL_THRU,
      levels: ["E"],
      note: "vestibul: grindă legată de cadrul E (C_E_PAL); consolă/legătură — fără stâlp în living @ X535 Y470 pe P",
      support: "C_E_PAL + B_E; vest = închidere ușoară / calcul consolă",
    },
  ];

  const conflicts = [
    {
      id: "inverted_beam_fit",
      severity: "DESCHIS_CALCUL",
      detail:
        "Grindă întoarsă Y575–590 X565–680 (schema), z −30…−5: eliberează clear acces (fără intrados −70). Trebuie verificat dacă încape în pachetul −30…+32 fără obstacole în living. Nu e rezolvare garantată.",
      door_kept: { y0: 500, y1: 600 },
      beam_schema: INVERTED_BEAM,
    },
    {
      id: "column_30_protrusion_vs_37m2",
      severity: "DESCHIS",
      detail: `Secțiuni preliminare ${COL_THRU}×${COL_ALONG} cu ~${PROTRUSION_IN} cm proeminență locală. Compatibilitatea cu pragul 37 m² se demonstrează după scăderea intruziunilor — nu pe baza vechiului 20×40 în falie 20.`,
    },
    {
      id: "vestibule_cantilever",
      severity: "DESCHIS",
      detail: "B_Y470 fără stâlp P în living: sprijin pe cadrul est continuu + consolă/legătură — de dimensionat.",
    },
    {
      id: "north_span_option",
      severity: "COMPARȚIE",
      detail: "C_N_MID introdus pentru a reduce deschiderea N; alternativa = grindă N pe deschidere mai mare fără C_N_MID — alegere după calcul seismic/grinzi.",
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
      detail: "30 cm pe direcție transversală = studiu preliminar legat de cerințe geometrice tip P100 pentru cadre; aplicabilitatea exactă depinde de sistem și clasa de ductilitate — nu validat.",
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
      status: "de confirmat prin calcul și verificarea cerințelor normative",
      note: "Nu declarăm cadrul convențional încadrat în banda de 20 cm. Îngroșări locale la stâlpi, nu pereți groși peste tot.",
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
      note: "Extrudările 3D TREBUIE să folosească aceste cote: placă +293→+308; grindă intrados +273; FF +320; buildup 12 separat.",
    },
    access_clearances: {
      basement_stair_clear: { x0: 565, x1: 665, y0: 600, y1: 800 },
      door: { x0: 535, x1: 565, y0: 500, y1: 600 },
      C_E_SOLID_N: { y0: 550, y1: 590, note: "N de rampă" },
      C_CASA_SCARA: { y0: 610, y1: 650, note: "S de ușă + rezervă" },
    },
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
      "FRAME corectat: stâlpi 30×40 + proeminență locală; C_E_SOLID_N / C_CASA_SCARA eliberează scară+ușă; grindă întoarsă studiu; util P/E separat. Neconstruibil.",
  };

  out.structure_frame_study_cm = buildFrameSchema();
  const fr = out.structure_frame_study_cm;

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
    note: "închidere termică living↔puț; în util P",
  };
  out.walls_cm = [...(out.walls_cm || []).filter((w) => w.id !== thermal.id), thermal];

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
    [650, 590],
    [535, 590],
    [535, 830],
    [360, 830],
    [360, 645],
    [30, 645],
    [30, 30],
  ];
  out.interior_polygon_cm = {
    note: "Frame P: living sub palier inclus",
    vertices: polyP,
  };
  out.interior_polygon_etaj_cm = {
    note: "Frame E: vestibul inclus; NU copiază usefulP",
    vertices: polyE,
  };

  const intWalls = (out.walls_cm || []).filter((w) => w.kind === "int");
  let intM2 = 0;
  for (const w of intWalls) intM2 += rectAreaM2(w);
  let voidM2 = 0;
  for (const o of out.openings_cm || []) {
    if (!["baie_usa", "dorm_usa"].includes(o.id)) continue;
    voidM2 += rectAreaM2(o);
  }
  const wallsNetM2 = Math.max(0, intM2 - voidM2);
  const thermalM2 = rectAreaM2(thermal);

  let protrP = 0;
  let protrE = 0;
  for (const c of fr.columns) {
    const pin = c.protrusion_into_room_cm || 0;
    if (!(pin > 0)) continue;
    const along = Math.max(c.dx, c.dy) >= COL_ALONG ? COL_ALONG : Math.max(c.dx, c.dy);
    const a = (pin * along) / 10000;
    if ((c.levels || []).includes("P")) protrP += a;
    if ((c.levels || []).includes("E")) protrE += a;
  }

  const usefulP = +(shoelaceM2(polyP) - wallsNetM2 - thermalM2 - protrP).toFixed(3);
  const usefulE = +(shoelaceM2(polyE) - wallsNetM2 - protrE).toFixed(3);

  out.areas_cm = {
    ...out.areas_cm,
    frame_study_areas: {
      method:
        "P: shoelace(polyP)−pereți_int_net−thermal−proeminențe; E: shoelace(polyE)−pereți_int_net−proeminențe (NU usefulE=usefulP)",
      useful_parter_m2: usefulP,
      useful_etaj_m2: usefulE,
      thermal_enclosure_m2: +thermalM2.toFixed(3),
      column_protrusion_P_m2: +protrP.toFixed(3),
      column_protrusion_E_m2: +protrE.toFixed(3),
      walls_int_net_m2: +wallsNetM2.toFixed(3),
      reference_threshold_m2: REF_USEFUL,
      delta_P_vs_37: +(usefulP - REF_USEFUL).toFixed(3),
      delta_E_vs_37: +(usefulE - REF_USEFUL).toFixed(3),
      ref_a1_useful_was: base.areas_cm?.useful_geometric_m2 ?? null,
      passes_37_P: usefulP >= REF_USEFUL,
      passes_37_E: usefulE >= REF_USEFUL,
      note: "Nu folosi surplusul ca rezervă stâlpi până la reuniune CAD completă.",
    },
    useful_geometric_m2: usefulP,
  };

  if (out.basement_cm?.door_to_rooms) {
    out.basement_cm.door_to_rooms.frame_study_note =
      "Gol Y500–600 PĂSTRAT. C_CASA_SCARA @ Y610+. Grindă muchie = întoarsă din schemă X565–680.";
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
    `<text x="40" y="${H - 16}" font-size="8" fill="#555">Stâlpi ${COL_THRU}×${COL_ALONG} + proem. ${PROTRUSION_IN} cm · util P ${ar.useful_parter_m2} / E ${ar.useful_etaj_m2} m² (Δ37: ${ar.delta_P_vs_37}/${ar.delta_E_vs_37}) · neconstruibil</text>`
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

## Priorități rezolvate în geometrie
1. **Scară/ușă/palier:** \`C_E_SOLID_N\` Y550–590 (N de rampă); \`C_CASA_SCARA\` Y610+ (după gol); ușă Y500–600 liberă.
2. **Grindă muchie:** din schemă X565–680, mod **întoarsă** z −30…−5 (nu coborâre −70 pe clar) — încăpere în sandwich = calcul.
3. **Cote volum = JSON:** placă +293→+308; grindă totală 35 → intrados +273.
4. **Util P ≠ E** (contururi separate + proeminențe).

## Secțiuni stâlpi
- Preliminar **${cs.through_wall_cm}×${cs.along_wall_cm} cm** + proeminență locală **${cs.local_protrusion_inward_cm} cm** spre interior.
- Perete finit **30 cm** păstrat; ETICS continuă afară.
- *De confirmat prin calcul și cerințe normative* (P100 — aplicabilitate pe sistem/ductilitate).
- **Nu** demonstrăm încadrarea în banda de 20 cm.

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

## Suprafețe utile (P și E separate)
Metodă: ${ar.method}

| | m² |
|--|---:|
| Util parter | **${ar.useful_parter_m2}** |
| Util etaj | **${ar.useful_etaj_m2}** |
| Proeminențe stâlpi P / E | ${ar.column_protrusion_P_m2} / ${ar.column_protrusion_E_m2} |
| Închidere termică Y590 | ${ar.thermal_enclosure_m2} |
| Prag 37 | ${ar.reference_threshold_m2} |
| Δ P vs 37 | **${ar.delta_P_vs_37}** (pass=${ar.passes_37_P}) |
| Δ E vs 37 | **${ar.delta_E_vs_37}** (pass=${ar.passes_37_E}) |

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
        delta_P_vs_37: study.areas_cm.frame_study_areas.delta_P_vs_37,
        delta_E_vs_37: study.areas_cm.frame_study_areas.delta_E_vs_37,
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
