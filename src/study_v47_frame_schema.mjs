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
const BRICK = 20;
const STRUCT_ALONG = 40; // cm — latura lungă de-a lungul peretelui (ipoteză)
const STRUCT_THRU = 20; // cm — grosime în falie (ipoteză)
const BEAM_H = 35; // cm ipoteză
const SLAB_TH = 15; // cm ipoteză
const FLOOR_BUILDUP = 12; // cm
const FF_PARTER = 32; // cm
const FF_ETAJ = FF_PARTER + 288; // 320
const SLAB_TOP_ETAJ = FF_ETAJ - FLOOR_BUILDUP; // 308
const SLAB_SOFFIT_ETAJ = SLAB_TOP_ETAJ - SLAB_TH; // 293
const BEAM_SOFFIT_P = SLAB_SOFFIT_ETAJ - (BEAM_H - SLAB_TH); // 273 dacă grindă 35 peste placă 15
const CLEAR_P_UNDER_BEAM = BEAM_SOFFIT_P - FF_PARTER; // 241

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

/** Stâlpi dreptunghiulari în tronsoane pline — dimensiuni DE CONFIRMAT */
function buildFrameSchema() {
  const ax = {
    X_W: ETICS, // falie vest
    X_CASA_SCARA: 535,
    X_E: 650, // falie est (finit 650–680)
    Y_N: ETICS,
    Y_PAL_N: 470,
    Y_PUT: 590,
    Y_DORM_S: 645,
    Y_INTRARE_S: 830,
  };

  // dx = de-a lungul peretelui E–W sau N–S; orientare explicită
  const columns = [
    {
      id: "C_NW",
      x: ax.X_W,
      y: ax.Y_N,
      dx: STRUCT_ALONG,
      dy: STRUCT_THRU,
      orient: "along_N",
      levels: ["S", "P", "E"],
      support_below: "fundație_bandă_N/W",
      wall: "nord+vest",
      conflicts: [],
    },
    {
      id: "C_N_BUC",
      x: ax.X_CASA_SCARA,
      y: ax.Y_N,
      dx: STRUCT_THRU,
      dy: STRUCT_THRU,
      orient: "corner_N_buc",
      levels: ["S", "P", "E"],
      support_below: "fundație_N",
      wall: "nord @ X535",
      conflicts: ["verificare goluri nord"],
    },
    {
      id: "C_NE",
      x: ax.X_E,
      y: ax.Y_N,
      dx: STRUCT_THRU,
      dy: STRUCT_ALONG,
      orient: "along_E",
      levels: ["S", "P", "E"],
      support_below: "fundație_E",
      wall: "est_living N de geam",
      conflicts: ["geam living ~Y105–310 — pilă doar în plin"],
    },
    {
      id: "C_W_MID",
      x: ax.X_W,
      y: 400,
      dx: STRUCT_THRU,
      dy: STRUCT_ALONG,
      orient: "along_W",
      levels: ["S", "P", "E"],
      support_below: "fundație_W",
      wall: "vest",
      conflicts: [],
    },
    {
      id: "C_W_DORM",
      x: ax.X_W,
      y: ax.Y_DORM_S,
      dx: STRUCT_ALONG,
      dy: STRUCT_THRU,
      orient: "along_S_dorm",
      levels: ["S", "P", "E"],
      support_below: "fundație_S",
      wall: "sud dorm W de gol terasă",
      conflicts: ["gol terasă X120–270 — rămâne în plin X0–120"],
    },
    {
      id: "C_E_GEAM_S",
      x: ax.X_E,
      y: 310,
      dx: STRUCT_THRU,
      dy: STRUCT_ALONG,
      orient: "along_E",
      levels: ["S", "P", "E"],
      support_below: "fundație_E",
      wall: "est S de geam",
      conflicts: [],
    },
    {
      id: "C_E_PAL",
      x: ax.X_E,
      y: ax.Y_PAL_N,
      dx: STRUCT_THRU,
      dy: STRUCT_ALONG,
      orient: "along_E",
      levels: ["S", "P", "E"],
      support_below: "fundație_E (continuu — NU pe placă 15)",
      wall: "est sub vestibul",
      conflicts: [
        "înlocuiește pal_ne etaj-only",
        "nu reazem pe placă 15 cm",
      ],
      replaces: ["pal_ne"],
    },
    {
      id: "C_E_PUT",
      x: ax.X_E,
      y: ax.Y_PUT,
      dx: STRUCT_THRU,
      dy: STRUCT_ALONG,
      orient: "along_E",
      levels: ["S", "P", "E"],
      support_below: "fundație_E",
      wall: "est @ Y590",
      conflicts: [],
    },
    {
      id: "C_CASA_SCARA",
      x: ax.X_CASA_SCARA,
      y: ax.Y_PUT,
      dx: STRUCT_THRU,
      dy: STRUCT_ALONG,
      orient: "along_separator",
      levels: ["S", "P", "E"],
      support_below: "fundație X535",
      wall: "buc_est / casă–scară",
      conflicts: [
        "înlocuiește buc_y590 discontinuu",
        "coordonare gol beci Y500–600",
      ],
      replaces: ["buc_y590"],
    },
    {
      id: "C_S_INTRARE_W",
      x: 360,
      y: ax.Y_INTRARE_S,
      dx: STRUCT_ALONG,
      dy: STRUCT_THRU,
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
      dx: STRUCT_THRU,
      dy: STRUCT_THRU,
      orient: "corner_S",
      levels: ["S", "P", "E"],
      support_below: "fundație_S",
      wall: "sud @ X535",
      conflicts: [],
    },
  ];

  const removed = [
    {
      id: "part_mid",
      reason: "pe compartimentare 12,5 cm (X347,5) — nu axă structurală; nu transformăm peretele int. în structural",
    },
    {
      id: "pal_nw",
      reason: "etaj-only peste living — interzis; reazem pe est continuu (C_E_PAL) sau grindă pe contur",
    },
    {
      id: "pal_ne",
      reason: "înlocuit de C_E_PAL continuu S–P–E",
    },
    {
      id: "grinda_X320",
      reason: "X320–340 ≠ compartimentare X347,5–360; nu forțăm grindă pe fală greșită",
    },
    {
      id: "pereți_structurali_P_E",
      reason: "direcție respinsă — doar cadre (stâlpi+grinzi) + EB20 umplutură",
    },
  ];

  const beams = [
    { id: "B_N", x: ax.X_W, y: ax.Y_N, dx: ax.X_E - ax.X_W + STRUCT_THRU, dy: STRUCT_THRU, levels: ["P", "E"], note: "centură N" },
    { id: "B_W", x: ax.X_W, y: ax.Y_N, dx: STRUCT_THRU, dy: ax.Y_DORM_S - ax.Y_N, levels: ["P", "E"], note: "centură W" },
    { id: "B_E", x: ax.X_E, y: ax.Y_N, dx: STRUCT_THRU, dy: ax.Y_PUT - ax.Y_N + STRUCT_ALONG, levels: ["P", "E"], note: "centură E pe pile" },
    { id: "B_CASA_SCARA", x: ax.X_CASA_SCARA, y: ax.Y_PUT, dx: STRUCT_THRU, dy: 270, levels: ["S", "P", "E"], note: "pe separator casă–scară" },
    { id: "B_Y590_EDGE", x: 565, y: 575, dx: 115, dy: 15, levels: ["S_soffit"], note: "reazem planșeu muchie puț Y575–590 — CONFLICT ușă beci" },
    { id: "B_Y645", x: ax.X_W, y: ax.Y_DORM_S, dx: 360 - ax.X_W, dy: STRUCT_THRU, levels: ["P", "E"], note: "sud dorm" },
    { id: "B_Y830", x: 360, y: ax.Y_INTRARE_S, dx: 175, dy: STRUCT_THRU, levels: ["P", "E"], note: "sud intrare" },
    { id: "B_Y470_VESTIBUL", x: ax.X_CASA_SCARA, y: ax.Y_PAL_N, dx: 145, dy: STRUCT_THRU, levels: ["E"], note: "N vestibul — pe stâlpi continui, nu pe placă" },
  ];

  const conflicts = [
    {
      id: "door_vs_beam_y575",
      severity: "CRITIC",
      detail:
        "Gol ușă beci Y500–600, h=200 peste FF−250 (lintel → −35). Grindă Y575–590 intrados −70 → clear sub grindă pe Y575–600 ≈180 cm (162,8 pe ultima călcare). Golul trebuie păstrat liber — NU mutare automată nord.",
      options_for_engineer: [
        "grindă întreruptă / lintel local pe X în afara clarului ușii",
        "grindă deasupra lintelului ușii (cotă de confirmat)",
        "mutare ușă doar după verificare palier/hol/transport (neimplementată aici)",
      ],
      door_kept: { y0: 500, y1: 600, dy: 100 },
      beam: { y0: 575, y1: 590, soffit_cm: -70 },
    },
    {
      id: "slab_span_without_X320",
      severity: "DESCHIS",
      detail:
        "Fără grindă/stâlp pe X320–347,5: planșeul spanuie living↔dorm pe reazeme perimetrale. Grosime 15 cm neconfirmată — poate cere placă mai groasă sau grinzi suplimentare (calcul).",
    },
    {
      id: "etics_in_300mm",
      severity: "CONSTRAINT",
      detail:
        "Anvelopă max 300 mm; EB20 200 + ETICS 92 + finisaje int. 7 = 299 mm. Termoizolația continuă peste beton spre exterior — nu se taie straturi ca să încapă stâlpul.",
    },
    {
      id: "basement_retaining",
      severity: "SEPARAT",
      detail:
        "Pereții subsolului care rețin pământul = sistem separat (nu cadre P/E). Neconfirmat geotehnic/NP112.",
    },
    {
      id: "column_sections_unvalidated",
      severity: "IPOTEZĂ",
      detail: `${STRUCT_THRU}×${STRUCT_ALONG} cm orientate pe perete — de confirmat prin calcul și cerințe normative. Nu 20×20 „validate”.`,
    },
  ];

  return {
    status: "STUDIU_SEPARAT — neconstruibil; nu înlocuiește A1 aprobat",
    system: "cadre_beton_armat",
    fill: "EB20_Akustik_200",
    insulation: "vata_bazaltica_80_ETICS",
    declared_buildable: false,
    structural_walls_PE: false,
    axes_cm: ax,
    column_section_hypothesis_cm: {
      through_wall: STRUCT_THRU,
      along_wall: STRUCT_ALONG,
      status: "de confirmat prin calcul și verificarea cerințelor normative",
    },
    columns,
    beams,
    removed_from_prior_grid: removed,
    conflicts_unresolved: conflicts,
    levels_cm: {
      ff_parter: FF_PARTER,
      ff_etaj: FF_ETAJ,
      floor_buildup_below_ff: FLOOR_BUILDUP,
      slab_top_etaj: SLAB_TOP_ETAJ,
      slab_th_hypothesis: SLAB_TH,
      slab_soffit_etaj: SLAB_SOFFIT_ETAJ,
      beam_h_hypothesis: BEAM_H,
      beam_soffit_over_parter: BEAM_SOFFIT_P,
      clear_parter_under_beam_cm: CLEAR_P_UNDER_BEAM,
      note: "FF etaj +320; buildup 12 → față sup. placă +308; placă 15 → intrados +293; grindă 35 → intrados grindă +273; clear P sub grindă 241 (înainte de finisaj plafon). Nu suprapune placă cu pardoseală.",
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
      "Studiu SEPARAT cadre BA + EB20 + vată 80. Fără pereți structurali P/E. Amenajarea A1 nu e mutată pentru a ascunde conflicte.",
  };

  out.structure_frame_study_cm = buildFrameSchema();

  // Închidere termică living↔puț — doar în varianta frame (impact util)
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
    note: "închidere termică living sub palier ↔ puț; inclusă în util frame",
  };
  out.walls_cm = [...(out.walls_cm || []).filter((w) => w.id !== thermal.id), thermal];

  // Poligon util cu living sub palier (încălzit)
  out.interior_polygon_cm = {
    note: "Frame study: living sub palier inclus; perete termic scăzut din util",
    vertices: [
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
    ],
  };

  // Arii P / E separate (shoelace − int walls − thermal); etaj ≈ același poligon înghețat
  const envM2 = shoelaceM2(out.interior_polygon_cm.vertices);
  const intWalls = (out.walls_cm || []).filter((w) => w.kind === "int");
  let intM2 = 0;
  for (const w of intWalls) intM2 += rectAreaM2(w);
  const thermalM2 = rectAreaM2(thermal);
  const usefulP = +(envM2 - intM2 - thermalM2).toFixed(3);
  // Etaj: același contur util aproximativ (etaj frozen); fără a muta amenajarea
  const usefulE = usefulP;
  out.areas_cm = {
    ...out.areas_cm,
    frame_study_areas: {
      method: "shoelace(interior+living_sub_palier) − pereți int − living_put_thermal",
      useful_parter_m2: usefulP,
      useful_etaj_m2: usefulE,
      thermal_enclosure_m2: +thermalM2.toFixed(3),
      reference_threshold_m2: REF_USEFUL,
      delta_P_vs_37: +(usefulP - REF_USEFUL).toFixed(3),
      delta_E_vs_37: +(usefulE - REF_USEFUL).toFixed(3),
      ref_a1_useful_was: base.areas_cm?.useful_geometric_m2 ?? null,
      note: "Recalcul frame study; nu certifică POT/CUT. Prag 37 m² raportat explicit.",
    },
    useful_geometric_m2: usefulP,
  };

  // Ușa beciului RĂMÂNE Y500–600 — doar documentare conflict
  if (out.basement_cm?.door_to_rooms) {
    out.basement_cm.door_to_rooms.frame_study_note =
      "Gol păstrat Y500–600. Conflict grindă Y575–590 documentat — fără mutare automată nord.";
  }
  if (out.basement_cm?.slab_coordination_cm) {
    out.basement_cm.slab_coordination_cm.edge_beam_conflict =
      out.structure_frame_study_cm.conflicts_unresolved.find((c) => c.id === "door_vs_beam_y575");
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
  // door + beam conflict highlight
  parts.push(
    `<rect x="${px(535)}" y="${py(500)}" width="${30 * S}" height="${100 * S}" fill="none" stroke="#c1121f" stroke-width="1.5"/>`
  );
  parts.push(
    `<text x="${px(570)}" y="${py(545)}" font-size="8" fill="#c1121f">ușă Y500–600 PĂSTRATĂ</text>`
  );
  parts.push(
    `<rect x="${px(565)}" y="${py(575)}" width="${115 * S}" height="${15 * S}" fill="#c1121f" opacity="0.35" stroke="#c1121f"/>`
  );
  parts.push(
    `<text x="${px(570)}" y="${py(572)}" font-size="7" fill="#c1121f">grindă Y575–590 CONFLICT</text>`
  );
  parts.push(
    `<text x="40" y="${H - 16}" font-size="8" fill="#555">Stâlpi ${STRUCT_THRU}×${STRUCT_ALONG} cm = ipoteză · util P ${study.areas_cm.frame_study_areas.useful_parter_m2} m² (Δ vs 37: ${study.areas_cm.frame_study_areas.delta_P_vs_37}) · neconstruibil</text>`
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
  parts.push(`<text x="${yx(500)}" y="${zy(-40)}" font-size="8" fill="#c1121f">gol ușă h200 Y500–600</text>`);
  // beam
  parts.push(
    `<rect x="${yx(575)}" y="${zy(-30)}" width="${15 * 1.1}" height="${(-30 - -70) * 0.55}" fill="#6a6358" stroke="#c1121f"/>`
  );
  parts.push(`<text x="${yx(592)}" y="${zy(-50)}" font-size="8" fill="#c1121f">grindă −70…−30 CONFLICT</text>`);
  parts.push(
    `<text x="40" y="290" font-size="9" fill="#8a2a2a">Clear sub grindă ≈180 cm &lt; ușă 200+lintel — nerezolvat; fără mutare automată ușă</text>`
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
  const colRows = fr.columns
    .map(
      (c) =>
        `| ${c.id} | X${c.x} Y${c.y} | ${c.dx}×${c.dy} (${c.orient}) | ${c.levels.join("–")} | ${c.support_below} | ${(c.conflicts || []).join("; ") || "—"} |`
    )
    .join("\n");
  const conf = fr.conflicts_unresolved
    .map((c) => `- **${c.id}** (${c.severity}): ${c.detail}`)
    .join("\n");
  const removed = fr.removed_from_prior_grid
    .map((r) => `- \`${r.id}\`: ${r.reason}`)
    .join("\n");

  return `# V47 A1 FRAME — studiu structural separat (cadre BA)

## Status
**NECONSTRUIBIL / NEVALIDAT.** Variantă separată față de A1 amenajare aprobată.
Sistem: **cadre beton armat** (stâlpi + grinzi) + umplutură **EB20 Akustik** + **vată bazaltică 80 mm** (ETICS).
**Nu** pereți structurali din beton la parter/etaj. Pereții de sprijin ai subsolului = tratament separat.

## Constrângeri
- Anvelopă finită **680×860** cm; perete exterior max **300 mm**
- Amenajarea A1: **nemutată** (pereți/goluri/mobilier/scări)
- Fără stâlpi izolați în camere; reazeme în tronsoane pline
- Secțiuni **${fr.column_section_hypothesis_cm.through_wall}×${fr.column_section_hypothesis_cm.along_wall} cm** = *de confirmat prin calcul și verificarea cerințelor normative*
- Termoizolația continuă peste beton spre exterior

## Eliminat din grila anterioară
${removed}

## Tabel stâlpi (ipoteze)

| ID | Poziție | Secțiune propusă | Niveluri | Reazem inferior | Conflicte amenajare |
|----|---------|------------------|----------|-----------------|---------------------|
${colRows}

## Cote etaj / planșeu
${fr.levels_cm.note}

| Cotă | cm |
|------|---:|
| FF etaj | ${fr.levels_cm.ff_etaj} |
| Față sup. placă | ${fr.levels_cm.slab_top_etaj} |
| Intrados placă (15 ip.) | ${fr.levels_cm.slab_soffit_etaj} |
| Intrados grindă (35 ip.) | ${fr.levels_cm.beam_soffit_over_parter} |
| Clear P sub grindă | ${fr.levels_cm.clear_parter_under_beam_cm} |

## Suprafețe utile (recalcul frame)
| | m² |
|--|---:|
| Util parter | **${ar.useful_parter_m2}** |
| Util etaj | **${ar.useful_etaj_m2}** |
| Închidere termică Y590 | ${ar.thermal_enclosure_m2} |
| Prag 37 | ${ar.reference_threshold_m2} |
| Δ P vs 37 | **${ar.delta_P_vs_37}** |
| Δ E vs 37 | **${ar.delta_E_vs_37}** |
| Util A1 ref (înainte) | ${ar.ref_a1_useful_was} |

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
        delta_vs_37: study.areas_cm.frame_study_areas.delta_P_vs_37,
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
