/**
 * A1 — arhitectură pe corp finit 680×860.
 * Pereți pe alcătuiri reale (nu 30 cm peste tot). Stâlpi provizorii: exces în interior (A0).
 * Rulează: node src/build_a1_architecture.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const EW = 680;
const NS = 860;
const SRC_EW = 682.6;
const SRC_NS = 861.3;
/** Grosimi finite catalog (cm). */
const TH = { A1: 30.0, A2: 31.2, A4: 30.0, A5: 30.0, A6: 30.0, A7: 12.5, A8: 15.0 };
/**
 * Corp = lungimi FINITE 680×860.
 * Pereți pe finit (grosime catalog A1/A2).
 * Cărămidă EB20 pe extrema plăcii/stâlpilor — deci stâlpul NU e pe muchia finită:
 *   inset până la cărămidă = grosime_perete − 20 (banda ETICS/finisaj afară).
 * Stâlp 30 − cărămidă 20 = +10 cm în interior (față de fața int. a peretelui).
 */
const BRICK_ON_EXTREME_CM = 20;
/** Distanță finit → extremă cărămidă/stâlp (nu e proeminența în cameră). */
const INSET_TO_BRICK_A1 = +(TH.A1 - BRICK_ON_EXTREME_CM).toFixed(1); // 10,0
const INSET_TO_BRICK_A2 = +(TH.A2 - BRICK_ON_EXTREME_CM).toFixed(1); // 11,2
/** Placare izolație pe fețele stâlpilor spre terasă / rece — proeminență pe cant. */
const TERRACE_COLUMN_INSUL_CM = 8;
/**
 * Placă terasă retrasă 8 cm pe laterale V+E și pe sud (spre N):
 * parapetul beton se leagă de stâlpi, nu de termosistem (ETICS).
 */
const TERRACE_SLAB_SETBACK_CM = 8;
const TERRACE_SLAB_SETBACK_S_CM = 8;
/** Goluri „geam*” — înălțime / prag (3D + plan note). */
const GEAM_H_CM = 150;
const GEAM_SILL_CM = 90;

/**
 * Pe plan A3 doar 3 materiale vizibile:
 * — beton (stâlpi)
 * — EB20 Akustik (umplutură între stâlpi)
 * — izolație (bandă continuă pe exterior = inset până la extrema EB20)
 * Restul (tencuială, klinker, adeziv, GKB…) nu se desenează — nu se văd la scara planului.
 */
const LAYER_STYLE = {
  brick: { fill: "#c49a6c", stroke: "#6b4e32", pattern: "patBrick" },
  insulation: { fill: "#e8d56a", stroke: "#8a7a20", pattern: "patInsul" },
  concrete: { fill: "#6e6e6e", stroke: "#222", pattern: "patConcrete" },
  /** Parapet A5 — doar miez, fără hașură cărămidă */
  parapet: { fill: "#7a7a7a", stroke: "#1a1a1a" },
  intWall: { fill: "#ddd6c8", stroke: "#888" },
  fallback: { fill: "#d0c4b0", stroke: "#666" },
};

function insetToBrickCm(cat) {
  if (cat === "A1") return INSET_TO_BRICK_A1;
  if (cat === "A6") return +(TH.A6 - BRICK_ON_EXTREME_CM).toFixed(1);
  return INSET_TO_BRICK_A2; // A2 + default
}

/**
 * Direcție spre RECE / exterior / cameră (capătul stivei).
 * Primul strat din stack stă pe fața opusă (încălzit / baie).
 */
function wallOutward(w) {
  const hint = String(w.outward_hint || "").toLowerCase();
  if (hint === "n" || hint === "north") return "N";
  if (hint === "s" || hint === "south") return "S";
  if (hint === "e" || hint === "east") return "E";
  if (hint === "w" || hint === "west") return "W";

  const id = w.id || "";
  // A8: stivă baie → cameră — outward = spre cameră (opus baiei)
  if (id === "nisa_dulap_spate" || id === "dorm_baie_nord") return "S"; // baie la N
  if (id === "nisa_dulap_est") return "W"; // baie la E (baie_se)

  if (id === "nord") return "N";
  if (id === "vest") return "W";
  if (id === "est_living" || id === "est_recuperat_p" || id === "buc_est" || id === "buc_est_etaj")
    return "E";
  // terasa_est: încălzit (hol) la EST, terasă rece la VEST → izolație spre terasă
  if (id === "terasa_est") return "W";
  if (id === "sud_bucatarie" || id === "dormitor_sud" || id === "palier_inchidere_sud_p") return "S";
  // A6 picior N: încălzit N → rece S (NU nord!)
  if (id === "palier_A6_nord_etaj") return "S";
  if (id === "living_palier") return "S";
  if (w.dx <= w.dy) return "E";
  return "S";
}

const src = JSON.parse(
  fs.readFileSync(path.join(root, "data/building/v47_a1_study.json"), "utf8")
);
const frame = JSON.parse(
  fs.readFileSync(path.join(root, "data/building/v47_a1_frame_study.json"), "utf8")
);
const a0 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a0_site.json"), "utf8"));

const mx = (x) => +((x / SRC_EW) * EW).toFixed(1);
const my = (y) => +((y / SRC_NS) * NS).toFixed(1);
const mdx = (d) => +((d / SRC_EW) * EW).toFixed(1);
const mdy = (d) => +((d / SRC_NS) * NS).toFixed(1);

function mapRect(r) {
  if (!r || typeof r.x !== "number") return r;
  return { ...r, x: mx(r.x), y: my(r.y), dx: mdx(r.dx), dy: mdy(r.dy) };
}

function stripNoise(note) {
  if (!note || typeof note !== "string") return note;
  return note
    .replace(/( · catalog A\d+)+/g, "")
    .replace(/( · heated A\d+ \/ cold A\d+)+/g, "")
    .trim();
}

function catalogId(w) {
  if (w.catalog_id) return w.catalog_id;
  if (w.catalog_id_heated) return w.catalog_id_heated;
  const a = String(w.assembly || "");
  const m = a.match(/A[0-9]/);
  return m ? m[0] : null;
}

function wallThicknessCm(w) {
  if (w.thickness_finished_mm) return +(w.thickness_finished_mm / 10).toFixed(1);
  const id = catalogId(w);
  if (id && TH[id] != null) return TH[id];
  // fallback: grosimea pe axa scurtă din sursă (remap)
  const mapped = mapRect(w);
  return Math.min(mapped.dx, mapped.dy);
}

function cleanWall(w) {
  const out = { ...mapRect(w) };
  if (out.note) out.note = stripNoise(out.note);
  out.catalog_id = catalogId(w) || out.catalog_id;
  out.thickness_cm = wallThicknessCm(w);
  out.geometry_note = undefined;
  return out;
}

/** Față finită pe 680×860; grosime = alcătuire (A1/A2/…); nu forțăm 30 peste tot. */
function snapExtWalls(walls) {
  // Vest încălzit se oprește la nordul dormitor_sud — pe terasă vest rămâne DOAR parapet A5 (fără EB20).
  const dormS = walls.find((w) => w.id === "dormitor_sud");
  const vestEndY = dormS ? dormS.y : my(645);
  return walls.map((w) => {
    if (w.kind !== "ext") return w;
    const t = w.thickness_cm;
    if (w.id === "nord") return { ...w, x: 0, y: 0, dx: EW, dy: t };
    if (w.id === "vest") {
      const y0 = t;
      return { ...w, x: 0, y: y0, dx: t, dy: +(vestEndY - y0).toFixed(1) };
    }
    if (w.id === "est_living" || w.id === "est_recuperat_p")
      return { ...w, x: +(EW - t).toFixed(1), dx: t };
    if (w.id === "sud_bucatarie") return { ...w, y: +(NS - t).toFixed(1), dy: t };
    if (w.id === "dormitor_sud")
      return { ...w, x: 0, dx: +Math.min(w.dx + w.x, EW).toFixed(1), dy: t };
    if (w.id === "terasa_est") return { ...w, dx: t };
    if (w.id === "buc_est" || w.id === "buc_est_etaj") return { ...w, dx: t };
    if (w.id === "living_palier" || w.id === "palier_A6_nord_etaj")
      return { ...w, dy: t };
    return w;
  });
}

let walls = snapExtWalls((src.walls_cm || []).map(cleanWall));

/**
 * Nord palier etaj (față N zid A6).
 * A1.54: stâlpi mid (C_W_MID + C_E_PAL) centrați pe axa mediană E–V a clădirii (Y=860/2=430);
 * zid N palier / colț = fața S a acestor stâlpi.
 * C_CASA_SCARA / intrare_etaj pe colțul L (Y_PALIER_INCHIDERE).
 */
const frameCols = frame.structure_frame_study_cm?.columns || [];
const srcWMid = frameCols.find((c) => c.id === "C_W_MID");
const srcEPal = frameCols.find((c) => c.id === "C_E_PAL");
const DY_MID_COL = srcWMid?.dy ?? srcEPal?.dy ?? 40;
/** Axa mediană E–V a corpului finit (= ½860). */
const Y_BUILDING_MID = +(NS / 2).toFixed(1);
/** Față N stâlpi mid — centru pe Y_BUILDING_MID. */
const Y_MID_COL = +(Y_BUILDING_MID - DY_MID_COL / 2).toFixed(1);
/** Față N zid A6 palier = față S stâlpi mid. */
const Y_PALIER_N = +(Y_MID_COL + DY_MID_COL).toFixed(1);
const BUC_EST_X0 = 534.3;
/**
 * Separator E–V (față int. est a A7 / vest camere est).
 * A1.65: 360→352,4 (−7,6) — ușă etaj 100 + buc≥5 fără a îngusta scara.
 */
const XI = 352.4;
const TH_SEP_A7 = 12.5;
/**
 * Sud L / C_CASA_SCARA / nord bucătărie etaj.
 * A1.65: gol ușă 100 lipit de mid; stâlp @550; buc lățită prin XI.
 */
const INTRARE_ETAJ_GOL = 100;
const Y_PALIER_INCHIDERE_P = +(Y_PALIER_N + INTRARE_ETAJ_GOL).toFixed(1); // 550

/**
 * A1.85: schiță — MS în nișa dintre baie și dorm (lângă duș, acces hol),
 * NU lângă dulap. Stivă vest Y144→294 (=150):
 *   duș 120×90 | prosoape 30 + MS 60 (est, hol)
 *   dulap 120×60 | raft 30 (est, lângă ușă dorm)
 * Pat neschimbat.
 */
const BED_LEN = 210;
const BED_WID = 170;
const BED_CLEAR_S = 90;
const BED_CLEAR_W = 10; // foot = 308,7−210−10 = 88,7
const BED_CLEAR_N = 90;
const Y_DORM_S_FACE = 644;
const BED_Y0 = +(Y_DORM_S_FACE - BED_CLEAR_S - BED_WID).toFixed(1); // 384
const DORM_N = +(BED_Y0 - BED_CLEAR_N).toFixed(1); // 294
/** Gol 120 living–baie */
const BAIE_LIVING_GOL = 120;
const Y_GOL_S = +(DORM_N - TH.A8).toFixed(1); // 279
const Y_GOL_N = +(Y_GOL_S - BAIE_LIVING_GOL).toFixed(1); // 159
const Y_BAIE_SUD_ZID = +(Y_GOL_N - TH.A8).toFixed(1); // 144
const NISA_UTIL_W = 120;
const DUS_D = 90; // schiță
const DUS_N_SHIFT = 15; // A1.91: duș +15 N → loc pentru zid baie↔dorm
const DULAP_D = 60;
const HOL_NISA_W = 60;
const HOL_NISA_H = 60; // MS clear N–S (schiță ~62)
const BAIE_FLANC_UTIL_D = 35; // A1.109: prosoape 45×35 (+5 sud nișă MS)
/** Est hol = după coloană 120 + A8 + nișă MS 60. */
const X_DUPA_NISA = +(TH.A2 + NISA_UTIL_W + TH.A8 + HOL_NISA_W).toFixed(1); // 226,2
/** Duș scos 15 N; sud = zid A8 baie↔dorm; dulap sub zid. */
const Y_DUS_0 = +(Y_BAIE_SUD_ZID - DUS_N_SHIFT).toFixed(1); // 129
const Y_DUS_1 = +(Y_DUS_0 + DUS_D).toFixed(1); // 219
const Y_BAIE_DORM_SEP = Y_DUS_1; // 219 — față N zid
const Y_DULAP_0 = +(Y_BAIE_DORM_SEP + TH.A8).toFixed(1); // 234
const Y_DULAP_1 = DORM_N; // 294
/** Prosoape / MS pe banda Y144 (nu urcă cu fața N a dușului). */
const Y_STACK_0 = Y_BAIE_SUD_ZID; // 144
const MS_N_SHIFT = 0; // A1.109: +5 sud via flanc 35 (nu shift separat)
/**
 * MS nișă: A8 15 N + clear 60 + A8 15 S (separator dressing / glisante).
 * Gura dorm: glisante 180 = 3×60.
 */
const HOL_NISA_X1 = X_DUPA_NISA;
const HOL_NISA_X0 = +(HOL_NISA_X1 - HOL_NISA_W).toFixed(1); // 166,2
const X_HOL_NISA_BACK = +(HOL_NISA_X0 - TH.A8).toFixed(1); // 151,2
const X_NISA_E_WALL = X_HOL_NISA_BACK;
/** Zid N MS = sud prosoape. */
const Y_HOL_NISA_WALL_N = +(
  Y_STACK_0 +
  BAIE_FLANC_UTIL_D -
  MS_N_SHIFT
).toFixed(1); // 179
/**
 * A1.116: A8 est duș doar de la colțul N MS (aliniat) — fără stub 5 cm lângă sticlă.
 * N de colț = util + sticlă.
 */
const Y_NISA_EST_KEEP_0 = Y_HOL_NISA_WALL_N; // 179 — colț cu hol_nisa_N
const NISA_EST_REMOVE_DY = +(Y_NISA_EST_KEEP_0 - Y_DUS_0).toFixed(1); // 50
const NISA_EST_KEEP_DY = +(Y_DUS_1 - Y_NISA_EST_KEEP_0).toFixed(1); // 40
const BAIE_FLANC_DY = +(Y_HOL_NISA_WALL_N - Y_STACK_0).toFixed(1); // 35
const HOL_NISA_Y0 = +(Y_HOL_NISA_WALL_N + TH.A8).toFixed(1); // 194 clear N
const HOL_NISA_Y1 = +(HOL_NISA_Y0 + HOL_NISA_H).toFixed(1); // 254 clear S
/** Zid S MS = separator față de dressing (în dulapul cu glisante). */
const Y_HOL_NISA_WALL_S = HOL_NISA_Y1; // 254
/** Raft / dressing est: sud de zid S MS. */
const Y_RAFT_0 = +(Y_HOL_NISA_WALL_S + TH.A8).toFixed(1); // 269
const NISA_UTIL_D = +(DORM_N - Y_RAFT_0).toFixed(1); // 25
const Y_NISA_BACK = Y_DULAP_0;
const Y_NISA_CLEAR_N = Y_DULAP_0;
const Y_NISA_CLEAR_S = DORM_N;
const Y_SEP_DUS_DULAP = Y_BAIE_DORM_SEP;
/** Glisante dressing pe gura nișei spre dorm — 180 / 3 foi. */
const NISA_GLIS_W = 180; // 120 dulap + 60 bandă est
const NISA_GLIS_X0 = TH.A2; // 31,2 (= TH_W)
const NISA_GLIS_X1 = +(NISA_GLIS_X0 + NISA_GLIS_W).toFixed(1); // 211,2
const NISA_GLIS_LEAVES = 3;
const NISA_GLIS_LEAF = +(NISA_GLIS_W / NISA_GLIS_LEAVES).toFixed(1); // 60
const NISA_GLIS_TRACK = 5; // șină pe gura nișei (în nișă)

// A1.41: elimină ecran_frigider (zid interior scurt etaj)
walls = walls.map((w) => {
  if (w.id !== "ecran_frigider") return w;
  return {
    ...w,
    removed: true,
    status: "ELIMINAT",
    reason: "Zid interior scurt — scos; intrare_etaj coborâtă lângă C_CASA_SCARA",
    note: "ELIMINAT: fără ecran frigider pe etaj",
  };
});

walls = walls.map((w) => {
  if (w.id === "est_living") {
    // sud = față N zid A6 (pe mid); clear palier începe la Y_PALIER_N
    const yA6n = +(Y_PALIER_N - TH.A6).toFixed(1);
    return { ...w, y: TH.A1, dy: +(yA6n - TH.A1).toFixed(1) };
  }
  if (w.id === "est_recuperat_p") {
    // Est sub palier până la închiderea sud (nu rămâne deschis spre scară)
    return {
      ...w,
      y: Y_PALIER_N,
      dy: +(Y_PALIER_INCHIDERE_P - Y_PALIER_N).toFixed(1),
    };
  }
  if (w.id === "palier_A6_nord_etaj") {
    // A1.61: zid pe stâlpii mid (sud = față S mid = nord clear palier)
    const yWall = +(Y_PALIER_N - w.thickness_cm).toFixed(1);
    return { ...w, x: BUC_EST_X0, dx: +(EW - BUC_EST_X0).toFixed(1), y: yWall, dy: w.thickness_cm };
  }
  if (w.id === "buc_est_etaj") {
    // de la nord palier (mid) → fațadă sud
    const y0 = Y_PALIER_N;
    const y1 = +(NS - TH.A2).toFixed(1);
    return { ...w, x: BUC_EST_X0, y: y0, dy: +(y1 - y0).toFixed(1) };
  }
  if (w.id === "buc_est") {
    // P: de la colț L / închidere → fațadă sud
    const y0 = Y_PALIER_INCHIDERE_P;
    const y1 = +(NS - TH.A2).toFixed(1);
    return { ...w, x: BUC_EST_X0, y: y0, dy: +(y1 - y0).toFixed(1) };
  }
  // A1.65: separator + terasă est + suduri odată cu XI
  if (w.id === "perete_comun_est") {
    return {
      ...w,
      x: +(XI - TH_SEP_A7).toFixed(1),
      dx: TH_SEP_A7,
      note: `A1.65: separator XI=${XI} (față est A7); −7,6 vs 360`,
    };
  }
  if (w.id === "terasa_est") {
    const t = w.thickness_cm || TH.A1;
    return { ...w, x: +(XI - t).toFixed(1), dx: t };
  }
  if (w.id === "dormitor_sud") {
    return { ...w, x: 0, dx: XI };
  }
  if (w.id === "sud_bucatarie") {
    return {
      ...w,
      x: XI,
      dx: +(BUC_EST_X0 - XI).toFixed(1),
      y: +(NS - (w.thickness_cm || TH.A2)).toFixed(1),
    };
  }
  // A1.91/94: zid baie↔dorm pe sud duș — până la vestul nișei MS (unește cu hol_nisa_S)
  // A1.122: pe etaj spatele nișei living e 180 (vezi nisa_dulap_spate_e)
  if (w.id === "nisa_dulap_spate") {
    const { removed, status, reason, ...rest } = w;
    return {
      ...rest,
      x: TH.A2,
      y: Y_BAIE_DORM_SEP,
      dx: +(HOL_NISA_X0 - TH.A2).toFixed(1), // 135 — până la X166,2
      dy: TH.A8,
      kind: "int",
      catalog_id: "A8",
      assembly: "A8",
      thickness_cm: TH.A8,
      thickness_finished_mm: 150,
      levels: [0],
      note: `A1.94: baie↔dorm Y${Y_BAIE_DORM_SEP}–${Y_DULAP_0}; X${TH.A2}→${HOL_NISA_X0} (parter)`,
    };
  }
  if (w.id === "nisa_dulap_est") {
    return {
      ...w,
      removed: true,
      status: "ELIMINAT",
      note: "ELIMINAT A1.79: înlocuit cu nisa_est + hol_nisa",
    };
  }
  if (w.id === "dorm_baie_nord") {
    return {
      ...w,
      x: X_DUPA_NISA,
      y: +(DORM_N - TH.A8).toFixed(1),
      dx: +(XI - TH_SEP_A7 - X_DUPA_NISA).toFixed(1),
      dy: TH.A8,
      levels: [0, 1],
      note: "A1.70: baie↔dorm est de nișă; sud = nord dorm",
    };
  }
  return w;
});

/** A1.122 etaj: spate nișă living 180×60 (baie↔nișă). */
walls.push({
  id: "nisa_dulap_spate_e",
  x: TH.A2,
  y: Y_BAIE_DORM_SEP,
  dx: NISA_GLIS_W, // 180
  dy: TH.A8,
  kind: "int",
  catalog_id: "A8",
  assembly: "A8",
  thickness_cm: TH.A8,
  thickness_finished_mm: 150,
  levels: [1],
  note: `A1.122: spate nișă living 180×60 Y${Y_BAIE_DORM_SEP}–${Y_DULAP_0}`,
});
/** A1.123: fără nisa_living_sud_e — gura nișei = 3 glisante spre dorm. */

/**
 * P: perete A6 paralel cu sudul — unește holul (buc_est) de limita de proprietate (est).
 * Închide palierul / volumul sub placă înspre interior (nord de zid = living sub palier).
 */
walls.push({
  id: "palier_inchidere_sud_p",
  x: BUC_EST_X0,
  y: Y_PALIER_INCHIDERE_P,
  dx: +(EW - BUC_EST_X0).toFixed(1),
  dy: TH.A6,
  kind: "ext",
  thermal: "house_stair_separator",
  catalog_id: "A6",
  assembly: "A6",
  thickness_cm: TH.A6,
  levels: [0],
  note: "P: A6 E–V, paralel sud; de la hol (X534) → limita Dragalina. Închide palierul înăuntru.",
});

/** A1.76: zid E–V nord de golul 120, paralel cu dorm_baie_nord, până îndreptul nișei. */
walls.push({
  id: "baie_sud_gol",
  x: X_DUPA_NISA,
  y: Y_BAIE_SUD_ZID,
  dx: +(XI - TH_SEP_A7 - X_DUPA_NISA).toFixed(1),
  dy: TH.A8,
  kind: "int",
  catalog_id: "A8",
  assembly: "A8",
  thickness_cm: TH.A8,
  thickness_finished_mm: 150,
  levels: [0, 1],
  note: `A1.76: N de gol ${BAIE_LIVING_GOL}; paralel dorm_baie_nord; X${X_DUPA_NISA}→separator`,
});

/** A1.85: duș|dulap vest; prosoape+MS+raft est (MS = nișa baie↔dorm, acces hol). */
function pushA8(id, x, y, dx, dy, note, levels = [0, 1]) {
  walls.push({
    id,
    x,
    y,
    dx,
    dy,
    kind: "int",
    catalog_id: "A8",
    assembly: "A8",
    thickness_cm: TH.A8,
    thickness_finished_mm: 150,
    levels,
    note,
  });
}
/** Parter: nișa MS + L dressing. Etaj A1.122: fără MS în nișă — vezi ziduri _e. */
pushA8(
  "nisa_est_N",
  X_HOL_NISA_BACK,
  Y_NISA_EST_KEEP_0, // colț N MS — aliniat cu hol_nisa_N
  TH.A8,
  NISA_EST_KEEP_DY,
  `A1.116: A8 Y${Y_NISA_EST_KEEP_0}–${Y_DUS_1} duș↔MS (colt); N 15×${NISA_EST_REMOVE_DY} = util+sticlă`,
  [0]
);
pushA8(
  "baie_flanc_est",
  +(HOL_NISA_X1 - TH.A8).toFixed(1),
  Y_STACK_0,
  TH.A8,
  BAIE_FLANC_DY,
  "A1.109: prosoape 45×35 — închide spre hol (dy până la zid N MS)",
  [0]
);
/** A8 15 N + S ale nișei MS — pe flancul nișei, NU sub aparat. */
pushA8(
  "hol_nisa_N",
  HOL_NISA_X0,
  Y_HOL_NISA_WALL_N, // 179
  HOL_NISA_W,
  TH.A8, // →189
  "A1.109: nord MS A8 15",
  [0]
);
/**
 * A1.94: uneste nisa_dulap_spate + hol_nisa_S + dorm_flanc_est (colț închis).
 * hol_nisa_S prelungit vest pe X151,2 (peste A8); flanc est de la zid S → DORM_N.
 */
pushA8(
  "hol_nisa_S",
  X_HOL_NISA_BACK, // 151,2 — unește cu estul nisa_dulap_spate
  Y_HOL_NISA_WALL_S, // 254
  +(HOL_NISA_X1 - X_HOL_NISA_BACK).toFixed(1), // 75 →226,2
  TH.A8, // →264
  "A1.109: sud MS + colț vest — separator dressing",
  [0]
);
/**
 * A1.99: zid ⊥ pe glisante — doar până la colțul L (sud MS).
 * Fără zid în L: rafturile dressingului sunt continue.
 */
pushA8(
  "nisa_est_S",
  X_NISA_E_WALL, // 151,2
  Y_DULAP_0, // 234
  TH.A8,
  +(Y_HOL_NISA_WALL_S - Y_DULAP_0).toFixed(1), // 12,5 →246,5 (colt L)
  "A1.99: ⊥ glisante → colț L (MS↔dressing); stop, nu taie L",
  [0]
);
const Y_DORM_FLANC_0 = Y_HOL_NISA_WALL_S; // 246,5
const DORM_FLANC_DY = +(DORM_N - Y_DORM_FLANC_0).toFixed(1); // 47,5
pushA8(
  "dorm_flanc_est",
  +(HOL_NISA_X1 - TH.A8).toFixed(1), // 211,2
  Y_DORM_FLANC_0,
  TH.A8,
  DORM_FLANC_DY,
  `A1.94: flanc est ${DORM_FLANC_DY} cm — colț L cu hol_nisa_S + dorm_baie_nord`,
  [0]
);
/**
 * A1.123 etaj: nișă living 180×60 — spate A8; est A8 plin (nu gol);
 * gura sud = 3 glisante spre dorm. MS lipită de duș; A8 est după MS.
 */
pushA8(
  "nisa_living_est_e",
  +(NISA_GLIS_X0 + NISA_GLIS_W).toFixed(1), // 211,2
  Y_DULAP_0,
  TH.A8,
  +(DORM_N - Y_DULAP_0).toFixed(1), // 60
  "A1.123: flanc est nișă living 180×60 — zid plin A8 (etaj)",
  [1]
);
/**
 * A8 est după MS → hol: de la sudul băii (nu urcă în baia N — evita proeminența
 * care tăia utilul), până la spatele nișei.
 */
pushA8(
  "baie_dus_est_e",
  +(X_HOL_NISA_BACK + 60).toFixed(1), // 211,2 = est MS
  Y_BAIE_SUD_ZID, // 144 — aliniat cu baie_sud_gol, nu Y129
  TH.A8,
  +(Y_DULAP_0 - Y_BAIE_SUD_ZID).toFixed(1), // 144→234
  "A1.129: A8 est MS→hol; fără stub N în baie",
  [1]
);
// MS parter: gura EST deschisă spre hol; S = zid separator dressing

/**
 * Stâlpi — regulă unică A0:
 * — Fără pilastru afară.
 * — Pe anvelopă ȘI pe buc_est (hol/buc↔scară): toți ies în spațiul încălzit.
 * — C_SE scos.
 */
/**
 * C_SE = adăugat aiurea.
 * C_SHAFT_E_PIER = pe placă palier/scară (blochează acces) — scos din A1
 *   (în V47 era levels: doar S; pe plan P/E nu are ce căuta).
 */
/** C_E_GEAM_S scos — stâlp pe R2 (zona rece) ulterior. */
const SKIP_COLUMNS = new Set(["C_SE", "C_SHAFT_E_PIER", "C_E_GEAM_S"]);
/** Față vest perete buc_est (aliniament V47 / ușă etaj). */
const BUC_EST_X = BUC_EST_X0;
const BUC_EST_TH = TH.A6;

function placeColumn(c) {
  const dx = c.dx;
  const dy = c.dy;
  let x = mx(c.x);
  let y = my(c.y);
  const id = c.id;
  const align = `${c.align || ""} ${id}`;

  const onN = c.y <= 2 || /C_NW|C_N_MID|C_NE/.test(id) || /along_N|pilaster_N/.test(align);
  const onW = c.x <= 2 || /C_NW|C_W_/.test(id) || /along_W|pilaster_W/.test(align);
  const onE =
    (c.x + c.dx >= SRC_EW - 50 && !/C_S_INTRARE|C_CASA_SCARA/.test(id)) ||
    /C_NE|C_E_|C_SHAFT/.test(id) ||
    (/planar_E|finished_planar_E/.test(align) && !/C_S_INTRARE|C_CASA_SCARA/.test(id));
  const onSEnv = c.y >= 800 || /C_S_INTRARE/.test(id);
  const onSDorm = /C_W_DORM|C_S_DORM/.test(id);
  /** Pe peretele buc_est — proem. în hol/buc (vest). */
  const onBucEst = /C_CASA_SCARA|C_S_INTRARE_E/.test(id);

  /** Proem. în cameră = stâlp − cărămidă (30−20=10), nu inset-ul de pe finit. */
  function protrDepth(colDepth) {
    return +Math.max(0, colDepth - BRICK_ON_EXTREME_CM).toFixed(1);
  }

  // Extremă stâlp/cărămidă = retrasă de pe finit cu banda din afara EB20.
  // Pereții rămân pe x=0 / EW / NS; stâlpii NU se aliniază cu fața finită.
  if (onW) x = INSET_TO_BRICK_A2;
  if (onN && !onSEnv && !onSDorm) y = INSET_TO_BRICK_A1;
  if (onE) x = +(EW - INSET_TO_BRICK_A2 - dx).toFixed(1);
  if (onSEnv) y = +(NS - INSET_TO_BRICK_A2 - dy).toFixed(1);
  if (onSDorm) {
    // Față sud = peretele finit spre sud
    const dormS = walls.find((w) => w.id === "dormitor_sud");
    const finishedSouth = dormS ? dormS.y + dormS.dy : my(645) + TH.A2;
    y = +(finishedSouth - dy).toFixed(1);
  }
  if (onBucEst) {
    // A6 fără ETICS afară: +10 în hol față de fața vest a peretelui
    x = +(BUC_EST_X - protrDepth(dx)).toFixed(1);
  }
  // Hol NE (C_CASA_SCARA): colț L — față N = sud gol intrare_etaj
  if (/C_CASA_SCARA/.test(id)) {
    y = Y_PALIER_INCHIDERE_P;
  }
  // Mid E–V: C_W_MID + C_E_PAL centrați pe Y=860/2; zid N palier pe fața S
  if (/C_W_MID|C_E_PAL/.test(id)) {
    y = Y_MID_COL;
  }
  // Hol SV (C_S_INTRARE_W): −10 cm vest față de finit terasa_est; sud pe extrema A2.
  if (/C_S_INTRARE_W/.test(id)) {
    const te = walls.find((w) => w.id === "terasa_est");
    const teWest = te ? te.x : +(XI - 30).toFixed(1);
    x = +(teWest - 10).toFixed(1);
    y = +(NS - INSET_TO_BRICK_A2 - dy).toFixed(1);
  }
  // Colț dorm SE / NE terasă: față est = XI (separator)
  if (/C_S_DORM_E/.test(id)) {
    x = +(XI - dx).toFixed(1);
  }
  // A1.107: C_N_MID pe axa N–S cu C_S_DORM_E + C_S_INTRARE_W (față est = XI)
  if (/C_N_MID/.test(id)) {
    x = +(XI - dx).toFixed(1);
  }

  const protrs = [];
  if (onW) protrs.push(protrDepth(dx));
  if (onN && !onSEnv && !onSDorm) protrs.push(protrDepth(dy));
  if (onE) protrs.push(protrDepth(dx));
  if (onSEnv) protrs.push(protrDepth(dy));
  if (onSDorm) {
    const dormS = walls.find((w) => w.id === "dormitor_sud");
    const wallN = dormS ? dormS.y : my(645);
    protrs.push(+Math.max(0, wallN - y).toFixed(1));
  }
  if (onBucEst) protrs.push(protrDepth(dx));
  const protr_cm = protrs.length ? Math.max(...protrs) : 0;

  return {
    id,
    x: +x.toFixed(1),
    y: +y.toFixed(1),
    dx,
    dy,
    section_cm: c.section_cm || `${dx}×${dy}`,
    protrusion_into_room_cm: protr_cm,
    brick_on_extreme_cm: BRICK_ON_EXTREME_CM,
    inset_from_finished_cm: onN && !onSEnv && !onSDorm ? INSET_TO_BRICK_A1 : onW || onE || onSEnv || onSDorm ? INSET_TO_BRICK_A2 : 0,
    faces: { onN, onW, onE, onSEnv, onSDorm, onBucEst },
    status: "PROVIZORIU_A0_caramida_pe_extrema",
    note: "Finit 680×860; stâlp pe extrema cărămizii (retras de pe finit); +10 în cameră.",
  };
}

const columns = (frame.structure_frame_study_cm?.columns || [])
  .filter((c) => !SKIP_COLUMNS.has(c.id))
  .map(placeColumn);

let openings = (src.openings_cm || [])
  .map((o) => {
  // A1.72: fără pocket pe separator — zid plin living↔dorm / living↔baie
  // (gol living–baie = A1.74 separat, nu ușă)
  if (o.id === "baie_usa" || o.id === "dorm_usa") return null;
  const m = mapRect(o);
  if (m.note) m.note = stripNoise(m.note);
  // A1.55: geam est living — mărit spre sud, centru = mijlocul jumătății nordice (Y=860/4)
  if (o.id === "geam_est") {
    const y0 = m.y;
    const yCenterHalfN = +(Y_BUILDING_MID / 2).toFixed(1); // 215
    let dy = +(2 * (yCenterHalfN - y0)).toFixed(1);
    let y1 = +(y0 + dy).toFixed(1);
    // nu intra în C_E_PAL
    if (y1 > Y_MID_COL) {
      y1 = Y_MID_COL;
      dy = +(y1 - y0).toFixed(1);
    }
    return {
      ...m,
      y: y0,
      dy,
      note: `A1.55: centrat în jumătatea N (centru Y${yCenterHalfN}); L=${dy}; Y${y0}→${y1}`,
    };
  }
  // A1.39: geam dorm→terasă — centrat între C_W_DORM și C_S_DORM_E
  if (o.id === "dorm_terasa") {
    const cW = columns.find((c) => c.id === "C_W_DORM");
    const cE = columns.find((c) => c.id === "C_S_DORM_E");
    const ds = walls.find((w) => w.id === "dormitor_sud");
    const gol = m.construction_clear_cm || m.width_cm || m.dx || 150;
    const west = cW ? +(cW.x + cW.dx).toFixed(1) : m.x;
    const east = cE ? cE.x : +(m.x + gol).toFixed(1);
    const clear = +(east - west).toFixed(1);
    const x0 = +(west + (clear - gol) / 2).toFixed(1);
    return {
      ...m,
      x: x0,
      y: ds ? ds.y : m.y,
      dx: gol,
      dy: ds ? ds.dy : m.dy,
      construction_clear_cm: gol,
      width_cm: gol,
      probe: false,
      probe_x_range: [x0, +(x0 + gol).toFixed(1)],
      note: `centrat între stâlpi (${west}–${east}); gol ${gol}`,
    };
  }
  // A1.41–43: intrare etaj — gol 100, sud lângă stâlp; deschidere stânga înăuntru
  // (de pe palier privind V: stânga=S → balama S; foaie → vest în living)
  if (o.id === "intrare_etaj") {
    const be = walls.find((w) => w.id === "buc_est_etaj") || walls.find((w) => w.id === "buc_est");
    const col = columns.find((c) => c.id === "C_CASA_SCARA");
    const gol = INTRARE_ETAJ_GOL;
    const leafW = 95;
    const wallX = be ? be.x : m.x;
    const wallDx = be ? be.dx : m.dx;
    const y1 = col ? col.y : Y_PALIER_INCHIDERE_P; // sud = față N stâlp
    const y0 = +(y1 - gol).toFixed(1); // = Y_PALIER_N (lipit de mid)
    const hingeX = wallX; // față vest perete (în living)
    const hingeY = y1; // balama SUD = stânga de pe palier
    return {
      ...m,
      x: wallX,
      y: y0,
      dx: wallDx,
      dy: gol,
      construction_clear_cm: gol,
      passage_clear_cm: 88,
      frame_cm: 6,
      leaf: {
        ...(m.leaf || {}),
        width_cm: leafW,
        thickness_cm: 4,
        swing: "into_living_from_palier_left",
        hinge: "south",
        hinge_x: hingeX,
        hinge_y: hingeY,
        closed_along: `în gol X${wallX} Y${y0}→${y1}`,
        open_leaf: {
          x0: hingeX,
          y0: hingeY,
          x1: +(hingeX - leafW).toFixed(1),
          y1: hingeY,
          note: "90° în living (vest), pe stânga",
        },
        note: "de pe palier: deschidere stânga înăuntru; balama S; foaie → vest",
      },
      access_check: {
        ...(m.access_check || {}),
        wall_host: `buc_est_etaj; gol Y${y0}–${y1}`,
        hinge: `sud (${hingeX},${hingeY})`,
        open_leaf: `Y${hingeY} X${hingeX}→${hingeX - leafW}`,
        status: `gol ${gol}; lângă stâlp; stânga înăuntru`,
      },
      note: `etaj: gol ${gol}; N@mid Y${y0} · S@C_CASA_SCARA Y${y1}; stânga înăuntru`,
    };
  }
  // A1.115: intrare P — gol 100; deschidere ÎN AFARĂ spre DREAPTA pe terasă
  // (ieșire din hol privind V: dreapta=N → balama S; foaie → vest pe terasă)
  if (o.id === "intrare_parter") {
    const te = walls.find((w) => w.id === "terasa_est");
    const wallX = te ? te.x : m.x;
    const wallDx = te ? te.dx : m.dx;
    const gol = 100;
    const y0 = m.y;
    const leafW = 95;
    const hingeX = wallX; // față ext. (vest) → terasă
    const hingeY = +(y0 + gol).toFixed(1); // balama SUD
    return {
      ...m,
      x: wallX,
      y: y0,
      dx: wallDx,
      dy: gol,
      construction_clear_cm: gol,
      passage_clear_cm: 90,
      frame_cm: 5,
      leaf: {
        ...(m.leaf || {}),
        width_cm: leafW,
        thickness_cm: 4,
        swing: "out_to_terrace_right",
        hinge: "south",
        hinge_x: hingeX,
        hinge_y: hingeY,
        note: "A1.115: deschidere în afară dreapta pe terasă; balama S; foaie → vest",
        open_leaf: {
          x0: hingeX,
          y0: hingeY,
          x1: +(hingeX - leafW).toFixed(1),
          y1: hingeY,
          note: "90° pe terasă (vest), pe dreapta la ieșire",
        },
      },
      lands_in: "hol_p",
      note: stripNoise(m.note) || "A1.115: terasă↔hol; gol 100; deschidere în afară dreapta",
    };
  }
  // A1.72 / A1.111: baie→dorm batantă; deschidere în dormitor spre stânga (balama V)
  if (o.id === "baie_usa_dorm") {
    const host = walls.find((w) => w.id === "dorm_baie_nord");
    const gol = 90;
    const leafW = 88;
    const wallY = host ? host.y : DORM_N - TH.A8;
    const wallDy = host ? host.dy : TH.A8;
    const wallX0 = host ? host.x : X_NISA_E_WALL + TH.A8;
    const wallX1 = host ? +(host.x + host.dx).toFixed(1) : +(XI - TH_SEP_A7).toFixed(1);
    // gol pe perete, ~15 cm de la vestul segmentului
    const x0 = +(wallX0 + 15).toFixed(1);
    const x1 = +(x0 + gol).toFixed(1);
    if (x1 > wallX1 - 5) {
      // fallback: lipit de est dacă segmentul e scurt
    }
    // din baie privind S: stânga=E → balama pe stânga (E); foaie → sud în dorm
    // (aceeași convenție ca intrare_etaj: „stânga” = balama pe stânga)
    const hingeX = x1; // est
    const hingeY = +(wallY + wallDy).toFixed(1); // față S = nord dorm
    return {
      ...m,
      x: x0,
      y: wallY,
      dx: gol,
      dy: wallDy,
      construction_clear_cm: gol,
      passage_clear_cm: gol,
      frame_cm: 5,
      system: "batanta",
      pocket: undefined,
      feasibility: {
        status: "STUDIO",
        declared_buildable: false,
        note: "A1.111: fără casetă; batantă pe dorm_baie_nord; gol 90",
      },
      leaf: {
        width_cm: leafW,
        thickness_cm: 4,
        type: "hinged",
        swing: "into_dorm_south_left_from_bath",
        hinge: "east",
        hinge_x: hingeX,
        hinge_y: hingeY,
        closed_along: `X${x0}→${x1} Y${hingeY}`,
        open_leaf: {
          x0: hingeX,
          y0: hingeY,
          x1: hingeX,
          y1: +(hingeY + leafW).toFixed(1),
          note: "90° în dormitor (sud); balama E (stânga din baie)",
        },
        note: "din baie privind S: deschidere stânga; balama E; foaie → sud în dorm",
      },
      access_check: {
        from: "baie",
        to: "dormitor",
        wall_host: "dorm_baie_nord",
        status: "batantă; zid plin living↔dorm",
      },
      note: `A1.111: baie→dorm batantă gol ${gol}; balama E = stânga din baie`,
    };
  }
  // A1.67 / A1.115: buc→terasă etaj — în afară dreapta pe terasă (balama S)
  if (o.id === "buc_terasa_etaj") {
    const te = walls.find((w) => w.id === "terasa_est");
    const wallX = te ? te.x : m.x;
    const wallDx = te ? te.dx : m.dx;
    const gol = m.construction_clear_cm || m.dy || 90;
    const y0 = m.y;
    const leafW = m.leaf?.width_cm || 85;
    const hingeX = wallX; // față vest (terasă)
    const hingeY = +(y0 + gol).toFixed(1); // S = dreapta la ieșire (privind V)
    return {
      ...m,
      x: wallX,
      y: y0,
      dx: wallDx,
      dy: gol,
      construction_clear_cm: gol,
      leaf: {
        ...(m.leaf || {}),
        width_cm: leafW,
        thickness_cm: 4,
        swing: "out_to_terrace_right",
        hinge: "south",
        hinge_x: hingeX,
        hinge_y: hingeY,
        open_leaf: {
          x0: hingeX,
          y0: hingeY,
          x1: +(hingeX - leafW).toFixed(1),
          y1: hingeY,
        },
        note: "A1.115: buc→terasă în afară dreapta; balama S; foaie → vest",
      },
      note: `A1.115: buc→terasă pe terasa_est X${wallX}; gol ${gol}; afară dreapta`,
    };
  }
  return m;
})
  .filter(Boolean);

// A1.74b: gol 120 living–baie — imediat N de colț (nu din colț; după dorm_baie_nord)
{
  const pc = walls.find((w) => w.id === "perete_comun_est");
  openings.push({
    id: "baie_living_gol",
    levels: [0, 1],
    role: "wall_void",
    x: pc ? pc.x : +(XI - TH_SEP_A7).toFixed(1),
    y: Y_GOL_N,
    dx: pc ? pc.dx : TH_SEP_A7,
    dy: BAIE_LIVING_GOL,
    construction_clear_cm: BAIE_LIVING_GOL,
    system: "gol_zid",
    note: `A1.74b: gol ${BAIE_LIVING_GOL} cm living–baie; după colț dorm (Y${Y_GOL_S}→${Y_GOL_N}); colț plin`,
  });
}

// A1.78 / A1.111: ușă batantă hol→baie pe baie_sud_gol; deschidere dreapta în baie
{
  const host = walls.find((w) => w.id === "baie_sud_gol");
  const gol = 90;
  const leafW = 88;
  const wallX0 = host ? host.x : X_DUPA_NISA;
  const wallY = host ? host.y : Y_BAIE_SUD_ZID;
  const wallDy = host ? host.dy : TH.A8;
  const wallDx = host ? host.dx : +(XI - TH_SEP_A7 - X_DUPA_NISA).toFixed(1);
  // aproape de separator (acces din golul 120 / hol)
  const x0 = +(wallX0 + wallDx - gol - 10).toFixed(1);
  const x1 = +(x0 + gol).toFixed(1);
  // din hol privind N în baie: dreapta=E → balama E; foaie → nord în baie
  const hingeX = x1;
  const hingeY = wallY; // față N (în baie)
  openings.push({
    id: "baie_usa",
    levels: [0, 1],
    role: "entrance",
    x: x0,
    y: wallY,
    dx: gol,
    dy: wallDy,
    construction_clear_cm: gol,
    passage_clear_cm: gol,
    frame_cm: 5,
    system: "batanta",
    leaf: {
      width_cm: leafW,
      thickness_cm: 4,
      type: "hinged",
      swing: "into_bath_north_right_from_hol",
      hinge: "east",
      hinge_x: hingeX,
      hinge_y: hingeY,
      closed_along: `X${x0}→${x1} Y${hingeY}`,
      open_leaf: {
        x0: hingeX,
        y0: hingeY,
        x1: hingeX,
        y1: +(hingeY - leafW).toFixed(1),
        note: "90° în baie (nord); balama E (dreapta din hol)",
      },
      note: "din hol privind N: deschidere dreapta în baie; balama E; foaie → nord",
    },
    access_check: {
      from: "hol_living_via_gol120",
      to: "baie",
      wall_host: "baie_sud_gol",
      status: "batantă",
    },
    note: `A1.111: hol→baie batantă gol ${gol}; dreapta în baie pe baie_sud_gol`,
  });
}

// A1.89/123: 3 uși glisante pe gura nișei 180 — P+E (etaj: fără zid sud)
{
  const y0 = +(DORM_N - NISA_GLIS_TRACK).toFixed(1);
  openings.push({
    id: "nisa_glisante_dorm",
    levels: [0, 1],
    role: "dressing",
    x: NISA_GLIS_X0,
    y: y0,
    dx: NISA_GLIS_W,
    dy: NISA_GLIS_TRACK,
    construction_clear_cm: NISA_GLIS_W,
    passage_clear_cm: NISA_GLIS_W,
    system: "glisante",
    leaves: NISA_GLIS_LEAVES,
    leaf_width_cm: NISA_GLIS_LEAF,
    leaf: {
      type: "sliding",
      count: NISA_GLIS_LEAVES,
      width_cm: NISA_GLIS_LEAF,
      thickness_cm: 4,
      track_cm: NISA_GLIS_TRACK,
      along: "E-W",
      face: "dorm_north",
      note: `3 foi × ${NISA_GLIS_LEAF} pe ${NISA_GLIS_W}; pe gura nișei`,
    },
    access_check: {
      from: "dormitor",
      to: "nisa_180",
      wall_host: null,
      status: "glisante pe gură",
    },
    note: `A1.123: glisante ${NISA_GLIS_W} / ${NISA_GLIS_LEAVES}×${NISA_GLIS_LEAF}; X${NISA_GLIS_X0}→${NISA_GLIS_X1}`,
  });
}
/** A1.123: fără ușă albastră pe est nișă — zid A8 plin. */

/** A1.37: trepte + parapet est terasă −20 vest. */
const TERRACE_SHIFT_W_CM = 20;
/** Grosime parapet pe plan (A5 desen). */
const TERRACE_PARAPET_TH_CM = 10;

/**
 * Parapete terasă — miez A5 pe stâlpi.
 * A1.117 colț SV: sud INCLUDE colțul (x=vest); vest se oprește pe fața N a sudului.
 * Capăt E sud: până la fața V zid/parapet est (fără overlap).
 */
const parapets = (src.parapets_cm || [])
  .filter((p) => !p.gap && (p.h == null || p.h > 0) && (p.dx > 0 || p.dy > 0))
  .map((p) => {
    const m = mapRect(p);
    let x = m.x;
    let y = m.y;
    let dx = m.dx;
    let dy = m.dy;
    const te = walls.find((w) => w.id === "terasa_est");
    const xWest = INSET_TO_BRICK_A2; // 11,2 — față vest parapet
    if (p.id === "terasa_parapet_sud_w") {
      const estSrc = (src.parapets_cm || []).find(
        (q) => q.id === "terasa_parapet_est_neacoperit"
      );
      const xEst = estSrc
        ? +(mx(estSrc.x) - TERRACE_SHIFT_W_CM).toFixed(1)
        : +(x + dx).toFixed(1);
      y = +(y - TERRACE_SLAB_SETBACK_S_CM).toFixed(1);
      x = xWest; // include colț SV
      dx = +(xEst - x).toFixed(1);
    }
    if (p.id === "terasa_parapet_sud_etaj") {
      const xEst = te ? te.x : +(x + dx - TERRACE_SLAB_SETBACK_CM).toFixed(1);
      y = +(y - TERRACE_SLAB_SETBACK_S_CM).toFixed(1);
      x = xWest; // include colț SV
      dx = +(xEst - x).toFixed(1);
    }
    if (p.id === "terasa_parapet_vest" || p.id === "terasa_parapet_vest_etaj") {
      x = xWest;
      // dy ajustat mai jos, după ce știm Y sud
      dy = +(dy - TERRACE_SLAB_SETBACK_S_CM).toFixed(1);
    }
    if (p.id === "terasa_parapet_est_neacoperit") {
      x = +(x - TERRACE_SHIFT_W_CM).toFixed(1);
      dy = +(dy - TERRACE_SLAB_SETBACK_S_CM).toFixed(1);
    }
    return {
      ...m,
      x,
      y,
      dx,
      dy,
      id: p.id,
      h: p.h ?? 105,
      levels: p.levels,
      catalog_id: "A5",
      note:
        stripNoise(p.note) ||
        "parapet terasă pe stâlpi beton (nu pe termosistem)",
    };
  });

/** Vest se oprește pe fața N a parapetului sud — colț SV în L, fără overlap/gol. */
for (const v of parapets) {
  if (v.id !== "terasa_parapet_vest" && v.id !== "terasa_parapet_vest_etaj")
    continue;
  const sudId =
    v.id === "terasa_parapet_vest_etaj"
      ? "terasa_parapet_sud_etaj"
      : "terasa_parapet_sud_w";
  const sud = parapets.find((p) => p.id === sudId);
  if (!sud) continue;
  v.dy = +(sud.y - v.y).toFixed(1);
  v.note = `A1.117: vest până la N sud (Y${sud.y}); colț SV pe sud`;
}

const stSrc = src.stair_cm || {};
const stairBandX = mx(stSrc.band_x ?? 565);
const stairBandDx = mdx(stSrc.band_dx ?? 115);
const stairClearDx = mdx(stSrc.width_clear_cm ?? 105);
const stairParapetDx = mdx(stSrc.parapet_thick_cm ?? 10);
/**
 * A1.36: +1 treaptă la baza R1; **19×16** ridicări (= 304 FF↔FF).
 * R1: 9↑ / 8×30 going; R2: 10↑ / 9×30; podest +144; palier +304.
 */
const STAIR_RISER_CM = 16;
const STAIR_TREAD_CM = stSrc.tread_cm ?? 30;
const STAIR_R1_RISERS = 9; // era 8; +1 treaptă la bază
const STAIR_R2_RISERS = 10;
const STAIR_TOTAL_RISERS = STAIR_R1_RISERS + STAIR_R2_RISERS; // 19
const STAIR_PODEST_Z = STAIR_R1_RISERS * STAIR_RISER_CM; // 144
const STAIR_PALIER_Z = STAIR_TOTAL_RISERS * STAIR_RISER_CM; // 304

/**
 * A1.61: palier superior mărit N până la stâlpii mid (fața S = Y_PALIER_N).
 * Zid A6 pe mid; clear palier începe la față S mid (nu +30 sud de zid).
 * Podest SE / R2: undo — geometrie ca A1.60 (nemodificate).
 */
const palierSrc = stSrc.palier_superior || {};
const palierY = Y_PALIER_N; // față S C_E_PAL / C_W_MID
const R2_GOING = +((STAIR_R2_RISERS - 1) * STAIR_TREAD_CM).toFixed(1); // 270
const R2_NORTH_Y = (() => {
  const raw = stSrc.ramp2 ? mapRect(stSrc.ramp2) : null;
  if (!raw) return Y_PALIER_INCHIDERE_P;
  return +(raw.y + raw.dy - R2_GOING).toFixed(1);
})();
const palierDy = +(R2_NORTH_Y - palierY).toFixed(1);

const PIER_DX = 20;
const PIER_DY = 40;
const LAMELE_H = 210;
const LAMELE_Z0 = 30;
const LAMELE_Z1 = +(LAMELE_Z0 + LAMELE_H).toFixed(1);
const LAMELE_L_TARGET = 129.6; // ~ proporție anterioară vs pier40
const yLamele0 = +(R2_NORTH_Y + STAIR_TREAD_CM).toFixed(1);
const yPier0 = +(yLamele0 + LAMELE_L_TARGET).toFixed(1);
const yPier1 = +(yPier0 + PIER_DY).toFixed(1);
const podSrc0 = stSrc.podest_se ? mapRect(stSrc.podest_se) : null;
const podSouthY = podSrc0 ? +(podSrc0.y + podSrc0.dy).toFixed(1) : +(yPier1 + 115).toFixed(1);

const stair = {
  riser_cm: STAIR_RISER_CM,
  risers_total_from_ff: STAIR_TOTAL_RISERS,
  risers_flight_180: STAIR_R1_RISERS,
  risers_flight_330: STAIR_R2_RISERS,
  tread_cm: STAIR_TREAD_CM,
  width_clear_cm: stSrc.width_clear_cm ?? 105,
  parapet_thick_cm: stSrc.parapet_thick_cm ?? 10,
  band_x: stairBandX,
  band_dx: stairBandDx,
  podest_height_above_ff_cm: STAIR_PODEST_Z,
  palier_sup_height_above_ff_cm: STAIR_PALIER_Z,
  entry_connection: stSrc.entry_connection,
  note: `A1.61: palier N până la mid (Y${palierY}) · clear ${Math.round(palierDy)} · R2 ${R2_GOING} · ${STAIR_TOTAL_RISERS}×${STAIR_RISER_CM}=${STAIR_PALIER_Z} FF↔FF`,
  flight_180: (() => {
    if (!stSrc.flight_180) return undefined;
    const raw = mapRect(stSrc.flight_180);
    const n = STAIR_R1_RISERS - 1;
    const going = +(n * STAIR_TREAD_CM).toFixed(1);
    const x1 = stairBandX;
    return {
      ...raw,
      x: +(x1 - going).toFixed(1),
      dx: going,
      treads_between_landings: n,
      tread_cm: STAIR_TREAD_CM,
      risers: STAIR_R1_RISERS,
      going_length_cm: going,
      note: "R1: +1 treaptă la bază (going 240); capăt E pe bandă/podest",
    };
  })(),
  podest_se: (() => {
    const p = podSrc0;
    if (!p) return undefined;
    return {
      ...p,
      z_above_ff_cm: STAIR_PODEST_Z,
      note: "podest SE 115×115 (nemodificat vs A1.60)",
    };
  })(),
  ramp2: (() => {
    if (!stSrc.ramp2) return undefined;
    const raw = mapRect(stSrc.ramp2);
    const n = STAIR_R2_RISERS - 1;
    return {
      ...raw,
      y: R2_NORTH_Y,
      dy: R2_GOING,
      treads_between_landings: n,
      tread_cm: STAIR_TREAD_CM,
      risers: STAIR_R2_RISERS,
      going_length_cm: R2_GOING,
      note: `R2 going ${R2_GOING} (${n}×${STAIR_TREAD_CM})`,
    };
  })(),
  palier_superior: {
    x: stairBandX,
    y: palierY,
    dx: stairClearDx,
    dy: palierDy,
    z_above_ff_cm: STAIR_PALIER_Z,
    section_note: `${Math.round(stairClearDx)}×${Math.round(palierDy)} clear · bandă ~${Math.round(stairBandDx)}×${Math.round(palierDy)} · +${STAIR_PALIER_Z}`,
    note: "A1.61: clear N = față S mid (C_E_PAL/C_W_MID); sud = N R2",
  },
  ...(() => {
    const xE = +(stairBandX + stairClearDx).toFixed(1);
    const dx = stairParapetDx;
    const lameleDy = LAMELE_L_TARGET;
    const podN = podSrc0 ? podSrc0.y : yPier1;
    return {
      stair_east_seq: {
        note: "plin palier → lamele → pier40 → parapet pe podest",
        y_lamele_0: yLamele0,
        y_lamele_1: yPier0,
        lamele_L_cm: lameleDy,
        lamele_H_cm: LAMELE_H,
        lamele_z0_above_ff_cm: LAMELE_Z0,
        lamele_z1_above_ff_cm: LAMELE_Z1,
        vs_geam: `top≈lintou geam (FF+${LAMELE_Z1}); bot FF+${LAMELE_Z0} (sub prag ${GEAM_SILL_CM})`,
        pier: { dx: PIER_DX, dy: PIER_DY, y: yPier0, note: "după lamele" },
        y_podest_n: podN,
        y_podest_s: podSouthY,
      },
      stair_solid_e: {
        x: xE,
        y: palierY,
        dx,
        dy: +(yLamele0 - palierY).toFixed(1),
        note: "zid plin pe palier + prima treaptă R2 — protecție",
      },
      stair_jaluzele_e: {
        x: xE,
        y: yLamele0,
        dx,
        dy: lameleDy,
        h_cm: LAMELE_H,
        z0_above_ff_cm: LAMELE_Z0,
        z1_above_ff_cm: LAMELE_Z1,
        note: `gol lamele L=${lameleDy} H=${LAMELE_H} (z${LAMELE_Z0}→${LAMELE_Z1}) — a 2-a treaptă`,
      },
      stair_parapet_e: {
        x: xE,
        y: yPier1,
        dx,
        dy: +(podSouthY - yPier1).toFixed(1),
        h_cm: 90,
        note: "parapet de la sud pier pe est podest",
      },
      stair_parapet_podest_s: podSrc0
        ? {
            x: podSrc0.x,
            y: +(podSouthY - dx).toFixed(1),
            dx: podSrc0.dx,
            dy: dx,
            h_cm: 90,
            note: "parapet sud podest",
          }
        : undefined,
      _pier_e_lamele: {
        id: "C_E_LAMELE",
        x: +(EW - PIER_DX).toFixed(1),
        y: yPier0,
        dx: PIER_DX,
        dy: PIER_DY,
      },
    };
  })(),
  entry_steps: (() => {
    if (!stSrc.entry_steps) return undefined;
    const raw = mapRect(stSrc.entry_steps);
    const n = stSrc.entry_steps.steps ?? 2;
    const going = +(n * STAIR_TREAD_CM).toFixed(1);
    const gap = stSrc.entry_steps.parapet_gap;
    return {
      ...raw,
      x: +(raw.x - TERRACE_SHIFT_W_CM).toFixed(1),
      dy: going,
      steps: n,
      tread_cm: STAIR_TREAD_CM,
      riser_cm: stSrc.entry_steps.riser_cm ?? STAIR_RISER_CM,
      parapet_gap: Array.isArray(gap)
        ? gap.map((v) => +(mx(v) - TERRACE_SHIFT_W_CM).toFixed(1))
        : gap,
    };
  })(),
  palier_parter: stSrc.palier_parter
    ? (() => {
        const p = mapRect(stSrc.palier_parter);
        // deck sud: capăt est −20 (aliniat cu mutarea treptelor / gol)
        return { ...p, dx: +(p.dx - TERRACE_SHIFT_W_CM).toFixed(1) };
      })()
    : undefined,
};

/** Pier rece est — sud de gol lamele (A1.56). */
if (stair._pier_e_lamele) {
  const p = stair._pier_e_lamele;
  columns.push({
    id: p.id,
    x: p.x,
    y: p.y,
    dx: p.dx,
    dy: p.dy,
    section_cm: `${p.dx}×${p.dy}`,
    protrusion_into_room_cm: 0,
    brick_on_extreme_cm: 0,
    inset_from_finished_cm: 0,
    faces: { onN: false, onW: false, onE: true, onSEnv: false, onSDorm: false, onBucEst: false },
    thermal: "cold_stair",
    no_etics: true,
    status: "PROVIZORIU_A1_scară_rece",
    note: "Est scară rece, sud de lamele; fără ETICS. Continuu P/E (→fundație dacă FE); secțiune studiu 20×40 — FE poate cere ≥30.",
    continuous_through_floor: true,
    levels: [0, 1],
  });
  delete stair._pier_e_lamele;
}

/**
 * Ancore din geometria remapată (pereți / scară).
 * XI = față int. vest camere est (= față est A7) — definit A1.65 mai sus.
 * XE = față int. est living.
 */
const X_STAIR = stair.band_x; // ~562.8
const TH_N = TH.A1; // nord încălzit
const TH_W = TH.A2; // vest klinker
const TH_E = TH.A2; // est klinker
const TH_S = TH.A2; // sud klinker
const XE = +(EW - TH_E).toFixed(1); // față int. est
const Y_N = TH_N;
const Y_DORM_S = 644; // față nord perete dormitor_sud
const Y_TER = 674;
const Y_S_HEAT = +(NS - TH_S).toFixed(1);
const Y_ENTRY = Y_PALIER_N; // nord palier clear = față S mid / sud zid A6 pe mid
/** Hol P = inclusiv zidul A6 sud, până la colțul L (buc_est). */
const Y_HOL_N = Y_PALIER_INCHIDERE_P; // colț L / față N C_CASA_SCARA
/** Etaj: fără ecran — bucătăria începe la colțul L / față N C_CASA_SCARA. */
const Y_BUC_E = Y_PALIER_INCHIDERE_P;
const DORM_FLOOR = "#e9e0d5";
const BAIE_FLOOR = "#d4e6e9";
const HOL_FLOOR = "#e8d5c4";
const LIVING_FLOOR = "#e8efe4"; // living_p / living_e
/** Flanc util E–V = 60 − A8 est. */
const FLANC_UTIL_W = +(HOL_NISA_W - TH.A8).toFixed(1); // 45
/** Duș 120×90 — vest; +15 N; sud = zid baie↔dorm (A1.91). */
const DUS_ZONE = {
  x: TH_W,
  y: Y_DUS_0,
  dx: NISA_UTIL_W,
  dy: DUS_D,
  util_dx: NISA_UTIL_W,
  util_dy: DUS_D,
};
/** Prosoape est — până la zid N MS. */
const BAIE_FLANC = {
  x: HOL_NISA_X0,
  y: Y_STACK_0,
  dx: FLANC_UTIL_W,
  dy: BAIE_FLANC_DY,
  util_dx: FLANC_UTIL_W,
  util_dy: BAIE_FLANC_DY,
};
/** A1.116: fost A8 N de colțul MS — pardoseală util; sticlă pe ax. */
const BAIE_EST_LIBER = {
  id: "baie_est_liber",
  role: "floor_add",
  x: X_HOL_NISA_BACK,
  y: Y_DUS_0,
  dx: TH.A8,
  dy: NISA_EST_REMOVE_DY,
  util_dx: TH.A8,
  util_dy: NISA_EST_REMOVE_DY,
  floor: BAIE_FLOOR,
  note: `A1.116: 15×${NISA_EST_REMOVE_DY} fost zid → util; sticlă până la colț MS`,
};
/**
 * Dressing în L în spatele glisantelor 180 (fără zid între rafturi):
 * — braț lung: X31,2→211,2 pe adâncime (vest de MS / sub uși)
 * — braț scurt: sud MS (colț L = unde se oprește nisa_est_S)
 * Parter. Etaj A1.122: nișă living 180×60 (NISA_LIVING_E).
 */
const NISA_DORM_DY = +(DORM_N - Y_DULAP_0).toFixed(1); // 60
/** Braț lung L — până la fața vest a zidului ⊥ (nu acoperă zidul). */
const NISA = {
  x: NISA_GLIS_X0,
  y: Y_DULAP_0,
  dx: +(X_NISA_E_WALL - NISA_GLIS_X0).toFixed(1), // 120 →151,2
  dy: NISA_DORM_DY,
  util_dx: NISA_GLIS_W, // gură 180
  util_dy: NISA_DORM_DY,
};
/**
 * Braț scurt L (est) — sud de hol_nisa_S, de la colț L → flanc.
 * Continuă rafturile fără separator.
 */
const NISA_FLANC_DORM = {
  x: X_NISA_E_WALL, // 151,2 — colț L
  y: Y_RAFT_0, // 261,5
  dx: +(HOL_NISA_X1 - TH.A8 - X_NISA_E_WALL).toFixed(1), // 60
  dy: NISA_UTIL_D,
  util_dx: +(HOL_NISA_X1 - TH.A8 - X_NISA_E_WALL).toFixed(1),
  util_dy: NISA_UTIL_D,
};
/** MS 60×60 — est, acces din hol (parter). */
const HOL_NISA = {
  x: HOL_NISA_X0,
  y: HOL_NISA_Y0,
  dx: HOL_NISA_W,
  dy: HOL_NISA_H,
  util_dx: HOL_NISA_W,
  util_dy: HOL_NISA_H,
};
/** A1.122 etaj: nișă 180×60 în living (clear; ziduri A8 spate/est/sud). */
const NISA_LIVING_E = {
  x: NISA_GLIS_X0,
  y: Y_DULAP_0,
  dx: NISA_GLIS_W, // 180
  dy: NISA_DORM_DY, // 60
  util_dx: NISA_GLIS_W,
  util_dy: NISA_DORM_DY,
};
/**
 * A1.123: MS în baie etaj — lipită de duș (est); A8 după MS.
 */
const MS_BAIE_E = {
  x: X_HOL_NISA_BACK, // 151,2 — fața E duș
  y: +(Y_DUS_1 - 54).toFixed(1), // 165 — sud aliniat cu fața S duș
  dx: 60,
  dy: 54,
};
/** A1.124: bandă N de MS (est de duș) = util baie pe etaj. */
const BAIE_EST_N_MS_E = {
  x: X_HOL_NISA_BACK,
  y: Y_DUS_0, // 129 — aliniat N duș
  dx: 60,
  dy: +(MS_BAIE_E.y - Y_DUS_0).toFixed(1), // →165
};

/**
 * Compartimentare A1 — doar camerele cerute.
 * Fără: legătură, circulație, dining separat, living_sub_palier, nișă ca etichetă.
 */
const rooms = [
  // —— vest (P+E): baie L + dormitor cu nișă aceeași culoare ——
  {
    id: "baie",
    label: "BAIE",
    levels: [0, 1],
    x: TH_W,
    y: Y_N,
    dx: +(XI - TH_W - 12.5).toFixed(1),
    // sud = față N zid baie_sud_gol (est) / gura nișei baie (vest)
    dy: +(Y_BAIE_SUD_ZID - Y_N).toFixed(1),
    floor: BAIE_FLOOR,
    note: `A1.91: duș 120×${DUS_D} Y${Y_DUS_0}–${Y_DUS_1}; zid baie↔dorm sud; WC/lavoar nord`,
    includes: ["dus_zone", "baie_flanc", "baie_est_liber", "ms_baie_e"],
    parts: [
      {
        id: "dus_zone",
        role: "dus",
        ...DUS_ZONE,
        floor: BAIE_FLOOR,
        note: `Duș; util ${DUS_ZONE.util_dx}×${DUS_ZONE.util_dy}`,
      },
      {
        id: "baie_flanc",
        role: "dressing_baie",
        levels: [0],
        ...BAIE_FLANC,
        floor: BAIE_FLOOR,
        note: `Prosoape; util ${BAIE_FLANC.util_dx}×${BAIE_FLANC.util_dy}`,
      },
      { ...BAIE_EST_LIBER, levels: [0] },
      {
        id: "baie_est_n_ms_e",
        role: "floor_add",
        levels: [1],
        ...BAIE_EST_N_MS_E,
        floor: BAIE_FLOOR,
        note: "A1.124: bandă N de MS = util baie (etaj)",
      },
      {
        id: "ms_baie_e",
        role: "floor_add",
        levels: [1],
        ...MS_BAIE_E,
        floor: BAIE_FLOOR,
        note: "A1.123: MS lângă duș pe sud (etaj)",
      },
    ],
  },
  {
    id: "dormitor",
    label: "DORMITOR",
    levels: [0, 1],
    x: TH_W,
    y: DORM_N,
    dx: +(XI - TH_W - 12.5).toFixed(1),
    dy: +(Y_DORM_S - DORM_N).toFixed(1),
    floor: DORM_FLOOR,
    note: `A1.99/127: dressing L pe parter; etaj nișă 180×60 culoare dorm`,
    includes: ["dressing_nisa", "dorm_flanc", "nisa_dorm_e"],
    parts: [
      {
        id: "dressing_nisa",
        role: "dressing",
        levels: [0],
        ...NISA,
        floor: DORM_FLOOR,
        note: `L braț lung; gură ${NISA.util_dx}×${NISA.util_dy}`,
      },
      {
        id: "dorm_flanc",
        role: "dressing",
        levels: [0],
        ...NISA_FLANC_DORM,
        floor: DORM_FLOOR,
        note: `L braț scurt ${NISA_FLANC_DORM.util_dx}×${NISA_FLANC_DORM.util_dy}`,
      },
      {
        id: "nisa_dorm_e",
        role: "floor_add",
        levels: [1],
        ...NISA_LIVING_E,
        floor: DORM_FLOOR,
        note: "A1.127: nișă 180×60 etaj — culoare dormitor",
      },
    ],
  },
  /** Hol vest (vestibul baie) + MS 60×60 pe parter */
  {
    id: "hol_vest",
    label: "HOL",
    levels: [0, 1],
    x: X_DUPA_NISA,
    y: Y_GOL_N,
    dx: +(XI - TH_SEP_A7 - X_DUPA_NISA).toFixed(1),
    dy: BAIE_LIVING_GOL,
    floor: HOL_FLOOR,
    note: "A1.85/122: vestibul 120; MS nișă doar parter; etaj nișă = living",
    includes: ["hol_nisa"],
    parts: [
      {
        id: "hol_nisa",
        role: "floor_add",
        levels: [0],
        ...HOL_NISA,
        floor: HOL_FLOOR,
        note: `MS nișă baie↔dorm; util ${HOL_NISA.util_dx}×${HOL_NISA.util_dy}; acces hol`,
      },
    ],
  },

  // —— parter est ——
  {
    id: "bucatarie_p",
    label: "BUCĂTĂRIE",
    levels: [0],
    x: XI,
    y: Y_N,
    dx: +(XE - XI).toFixed(1),
    dy: 200,
    floor: "#efe4d8",
    note: "Bucătărie + dining (masă/scaune) — ~2,9×2,0 m (nu fâșia veche 60 cm).",
  },
  {
    id: "living_p",
    label: "LIVING",
    levels: [0],
    x: XI,
    y: 230,
    dx: +(XE - XI).toFixed(1),
    dy: +(Y_PALIER_INCHIDERE_P - 230).toFixed(1),
    floor: LIVING_FLOOR,
    note: "De la zidul A6 sud (închidere palier) până la bucătărie; inclusiv sub placă până la est.",
  },
  {
    id: "hol_p",
    label: "HOL",
    levels: [0],
    x: XI,
    y: Y_HOL_N,
    dx: +(BUC_EST_X0 - XI).toFixed(1),
    dy: +(Y_S_HEAT - Y_HOL_N).toFixed(1),
    floor: "#d4c4a8",
    note: "Inclusiv zona zidului A6 până la colțul L (buc_est); sud = intrare terasă.",
    parts: [
      {
        id: "hol_colt_zid",
        role: "zid_nu_util",
        x: BUC_EST_X0,
        y: Y_PALIER_INCHIDERE_P,
        dx: +(EW - BUC_EST_X0).toFixed(1),
        dy: TH.A6,
        floor: "#d4c4a8",
        note: "Bandă zid A6 (desen) — NU intră în util.",
      },
    ],
  },
  {
    id: "terasa_p",
    label: "TERASĂ",
    levels: [0],
    // A1.63/64: placă −8 cm V+E și −8 cm sud (spre N)
    x: TERRACE_SLAB_SETBACK_CM,
    y: Y_TER,
    dx: +(XI - 2 * TERRACE_SLAB_SETBACK_CM).toFixed(1),
    dy: +(NS + 115 - Y_TER - TERRACE_SLAB_SETBACK_S_CM).toFixed(1),
    floor: "#dfe8d8",
    outdoor: true,
    note: `placă −${TERRACE_SLAB_SETBACK_CM} cm V+E · −${TERRACE_SLAB_SETBACK_S_CM} cm sud; parapet pe stâlpi`,
  },

  // —— etaj est ——
  {
    id: "living_e",
    label: "LIVING + DINING",
    levels: [1],
    // N de mid: până la XE; S de mid (palier rece la E): doar până la buc_est
    x: XI,
    y: Y_N,
    dx: +(XE - XI).toFixed(1),
    dy: +(Y_PALIER_N - Y_N).toFixed(1),
    floor: LIVING_FLOOR,
    note: "Nord→mid: până la est finit. Sud de mid → buc_est.",
    parts: [
      {
        id: "living_e_sud_pana_usa",
        role: "floor_add",
        x: XI,
        y: Y_PALIER_N,
        dx: +(BUC_EST_X0 - XI).toFixed(1),
        dy: +(Y_BUC_E - Y_PALIER_N).toFixed(1),
        floor: LIVING_FLOOR,
        note: "Y mid→C_CASA_SCARA, vest de buc_est (zona ușă = living)",
      },
    ],
  },
  {
    id: "bucatarie_e",
    label: "BUCĂTĂRIE",
    levels: [1],
    x: XI,
    y: Y_BUC_E,
    dx: +(BUC_EST_X0 - XI).toFixed(1),
    dy: +(Y_S_HEAT - Y_BUC_E).toFixed(1),
    floor: "#efe4d8",
    note: "Sud de C_CASA_SCARA / colț L → fațadă sud; est = față V buc_est. Țintă ≥5 m².",
  },
  {
    id: "terasa_e",
    label: "TERASĂ",
    levels: [1],
    x: TERRACE_SLAB_SETBACK_CM,
    y: Y_TER,
    dx: +(329 - 2 * TERRACE_SLAB_SETBACK_CM).toFixed(1),
    dy: +(185 - TERRACE_SLAB_SETBACK_S_CM).toFixed(1),
    floor: "#dfe8d8",
    outdoor: true,
    note: `placă −${TERRACE_SLAB_SETBACK_CM} cm V+E · −${TERRACE_SLAB_SETBACK_S_CM} cm sud; parapet pe stâlpi`,
  },

  // —— scară: pe P doar sud de închiderea palierului (nu sub placă = living) ——
  {
    id: "scara_p",
    label: "SCARĂ",
    levels: [0],
    x: BUC_EST_X0 + TH.A6,
    y: Y_PALIER_INCHIDERE_P + TH.A6,
    dx: +(EW - (BUC_EST_X0 + TH.A6)).toFixed(1),
    dy: +(Y_S_HEAT + 115 - (Y_PALIER_INCHIDERE_P + TH.A6)).toFixed(1),
    floor: "#dde6e9",
    note: "P: scară rece sud de hol/zid; sub palier = living.",
  },
  {
    id: "scara_e",
    label: "SCARĂ",
    levels: [1],
    x: X_STAIR,
    y: Y_ENTRY,
    dx: stair.band_dx,
    dy: +(Y_S_HEAT + 115 - Y_ENTRY).toFixed(1),
    floor: "#dde6e9",
  },
];

/**
 * Axe structurale pe centrele stâlpilor (A1).
 * Litere W→E · cifre N→S.
 * A1.52: mid E/V pe același ax 3 (C_W_MID = C_E_PAL); C_E_GEAM_S scos.
 */
function colCx(c) {
  return +(c.x + c.dx / 2).toFixed(1);
}
function colCy(c) {
  return +(c.y + c.dy / 2).toFixed(1);
}
function mean(arr) {
  return +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}
const byId = Object.fromEntries(columns.map((c) => [c.id, c]));
const axes = {
  note: "Centre stâlpi A1. Ax 3 = mid vest+est aliniați. C_E_GEAM_S eliminat (R2 rece ulterior).",
  vertical_WE: [
    {
      id: "A",
      x: mean([colCx(byId.C_NW), colCx(byId.C_W_MID), colCx(byId.C_W_DORM)]),
      columns: ["C_NW", "C_W_MID", "C_W_DORM"],
      role: "vest",
    },
    {
      id: "B",
      x: mean([
        colCx(byId.C_N_MID),
        colCx(byId.C_S_DORM_E),
        colCx(byId.C_S_INTRARE_W),
      ]),
      columns: ["C_N_MID", "C_S_DORM_E", "C_S_INTRARE_W"],
      note: "A1.107: față est @XI (N_MID 40 / S_DORM_E 30 / S_INTRARE_W 40)",
      role: "mijloc",
    },
    {
      id: "C",
      x: mean([colCx(byId.C_CASA_SCARA), colCx(byId.C_S_INTRARE_E)]),
      columns: ["C_CASA_SCARA", "C_S_INTRARE_E"],
      role: "casa_scara",
    },
    {
      id: "D",
      x: mean([colCx(byId.C_NE), colCx(byId.C_E_PAL)].filter(Boolean)),
      columns: ["C_NE", "C_E_PAL"],
      role: "est",
    },
  ],
  horizontal_NS: [
    {
      id: "1",
      y: mean([colCy(byId.C_NW), colCy(byId.C_N_MID), colCy(byId.C_NE)]),
      columns: ["C_NW", "C_N_MID", "C_NE"],
      role: "nord",
    },
    {
      id: "3",
      y: mean([colCy(byId.C_W_MID), colCy(byId.C_E_PAL)]),
      columns: ["C_W_MID", "C_E_PAL"],
      role: "mid",
      note: "A1.54: centre pe Y=860/2 · palier N pe fața S",
    },
    {
      id: "4",
      y: colCy(byId.C_CASA_SCARA),
      columns: ["C_CASA_SCARA"],
      role: "casa_scara",
    },
    {
      id: "5",
      y: mean([colCy(byId.C_W_DORM), colCy(byId.C_S_DORM_E)]),
      columns: ["C_W_DORM", "C_S_DORM_E"],
      role: "dorm_sud",
    },
    {
      id: "6",
      y: mean([colCy(byId.C_S_INTRARE_W), colCy(byId.C_S_INTRARE_E)]),
      columns: ["C_S_INTRARE_W", "C_S_INTRARE_E"],
      role: "intrare_sud",
    },
  ],
  mid_misalign_cm: +Math.abs(colCy(byId.C_E_PAL) - colCy(byId.C_W_MID)).toFixed(1),
  /** Mijloc corp finit 680×860 (nu axe stâlpi). */
  building_mid: {
    x: +(EW / 2).toFixed(1),
    y: +(NS / 2).toFixed(1),
    note: "X = 680/2 · Y = 860/2 — axe clădire / simetrie gabarit",
  },
};

/**
 * Mobilier studiu — ancorat pe fețe int.
 * Pat 210×170; 90 sud / 10 vest / 90 nord până la ușă+nișă (A1.73).
 */
/**
 * A1.83 sanitare — exact schița:
 * WC NV (facing E, clear 65), blat N 30/40 + lavoar 60×40, duș 120×90 vest glisantă,
 * MS în nișa hol.
 */
const BAIE_Y0 = Y_N;
const BAIE_CLEAR_NS = +(Y_BAIE_SUD_ZID - BAIE_Y0).toFixed(1); // 114
const WC_FRAME_D = 15;
const WC_BOWL_D = 53; // proiectare de la cadru
const WC_BOWL_W = 40;
const WC_FRONT = 65;
const WC_S_SHIFT = 10; // A1.95: WC +10 sud
const BLAT_E_SHIFT = 15; // A1.95: blat+lavoar +15 est
const WC_FRAME_X = TH_W;
const WC_FRAME_Y = +(BAIE_Y0 + 8 + WC_S_SHIFT).toFixed(1);
const WC_FRAME_H = 60; // pe vest, lungime N–S a cadrului
const WC_X = +(WC_FRAME_X + WC_FRAME_D).toFixed(1);
const WC_Y = +(WC_FRAME_Y + (WC_FRAME_H - WC_BOWL_W) / 2).toFixed(1);
const BLAT_Y = BAIE_Y0;
const BLAT_D30 = 30;
const BLAT_D40 = 40;
const LAV_W = 60;
const LAV_D = 40;
/** Blat pe nord (~169), est de WC; +15 E (A1.95); lărgire 40 la lavoar. */
const BLAT_X0 = +(TH_W + WC_FRAME_D + WC_BOWL_D + 5 + BLAT_E_SHIFT).toFixed(1); // ~119
const BLAT_LEN = 169;
const BLAT_X1 = +(BLAT_X0 + BLAT_LEN).toFixed(1);
const LAV_X = +(BLAT_X0 + 55).toFixed(1); // pe banda lată
const LAV_Y = +(BLAT_Y + 2).toFixed(1);
const MS_W = 60;
const MS_D = 54;
const MS_X = HOL_NISA_X0;
const MS_Y = +(HOL_NISA_Y0 + (HOL_NISA_H - MS_D) / 2).toFixed(1); // centrat în nișa mutată S

const furniture = [
  {
    id: "pat",
    levels: [0, 1],
    zone: "dormitor",
    x: +(TH_W + BED_CLEAR_W).toFixed(1),
    y: BED_Y0,
    dx: BED_LEN,
    dy: BED_WID,
    h: 45,
    headboard: "west",
    clear_south_cm: BED_CLEAR_S,
    clear_west_cm: BED_CLEAR_W,
    clear_north_cm: BED_CLEAR_N,
    color: "#c4a882",
    label: `PAT ${String(BED_LEN).replace(".", ",")}×${String(BED_WID).replace(".", ",")}`,
    note: `A1.73: ${BED_LEN}×${BED_WID}; clear V${BED_CLEAR_W} / S${BED_CLEAR_S} / N${BED_CLEAR_N}`,
  },
  {
    id: "blat_baie",
    levels: [0, 1],
    zone: "baie",
    x: BLAT_X0,
    y: BLAT_Y,
    dx: BLAT_LEN,
    dy: BLAT_D30,
    h: 90,
    color: "#d4c4a8",
    label: "BLAT",
    note: `A1.95: blat N ~${BLAT_LEN}×${BLAT_D30}; +${BLAT_E_SHIFT} E; 40 la lavoar`,
  },
  {
    id: "blat_lavoar_wide",
    levels: [0, 1],
    zone: "baie",
    x: LAV_X,
    y: BLAT_Y,
    dx: LAV_W,
    dy: BLAT_D40,
    h: 90,
    color: "#d4c4a8",
    label: "",
    note: `A1.95: lărgire blat 40 sub lavoar; +${BLAT_E_SHIFT} E`,
  },
  {
    id: "wc_cadru",
    levels: [0, 1],
    zone: "baie",
    x: WC_FRAME_X,
    y: WC_FRAME_Y,
    dx: WC_FRAME_D,
    dy: WC_FRAME_H,
    h: 120,
    color: "#c8cdd0",
    label: "",
    note: `A1.95: Geberit pe vest; +${WC_S_SHIFT} S`,
  },
  {
    id: "wc",
    levels: [0, 1],
    zone: "baie",
    x: WC_X,
    y: WC_Y,
    dx: WC_BOWL_D,
    dy: WC_BOWL_W,
    h: 40,
    color: "#e8eef0",
    facing: "east",
    label: "WC",
    front_clear_cm: WC_FRONT,
    note: `A1.95: +${WC_S_SHIFT} S; facing E; clear frontal ${WC_FRONT}`,
  },
  {
    id: "lavoar",
    levels: [0, 1],
    zone: "baie",
    x: LAV_X,
    y: LAV_Y,
    dx: LAV_W,
    dy: LAV_D,
    h: 85,
    color: "#d0d8dc",
    facing: "south",
    label: "LAVOAR",
    note: `A1.95: 60×40 pe blat; +${BLAT_E_SHIFT} E cu blat`,
  },
  {
    id: "dus",
    levels: [0, 1],
    zone: "baie",
    x: DUS_ZONE.x,
    y: DUS_ZONE.y,
    dx: DUS_ZONE.dx,
    dy: DUS_ZONE.dy,
    h: 2,
    color: "#b8d4d8",
    label: `DUȘ 120×${String(DUS_D).replace(".", ",")}`,
    glass_east: true,
    glass_east_dy: NISA_EST_REMOVE_DY, // sticlă pe zona fără A8
    note: `A1.114: 120×${DUS_D}; est N 15×45 = util+sticlă; est S = A8 duș↔MS`,
  },
  {
    id: "masina_spalat",
    levels: [0],
    zone: "hol_vest",
    x: MS_X,
    y: MS_Y,
    dx: MS_W,
    dy: MS_D,
    h: 85,
    color: "#9aa3a8",
    facing: "east",
    label: "MS",
    note: `A1.109: MS Y${MS_Y}; A8 15 N+S; clear 60; nișă hol (parter)`,
  },
  {
    id: "masina_spalat_e",
    levels: [1],
    zone: "baie",
    x: MS_BAIE_E.x,
    y: MS_BAIE_E.y,
    dx: MS_BAIE_E.dx,
    dy: MS_BAIE_E.dy,
    h: 85,
    color: "#9aa3a8",
    facing: "east",
    label: "MS",
    note: "A1.122: MS în baie etaj — lângă duș pe sud",
  },
];

/**
 * Util pe nivel — detaliat, pe fețe interioare.
 * Nu include: terasă, scară rece, amprente zid. Scade proem. stâlpi în cameră.
 */
function shoelaceM2(verts) {
  let a = 0;
  for (let i = 0; i < verts.length - 1; i++) {
    a += verts[i][0] * verts[i + 1][1] - verts[i + 1][0] * verts[i][1];
  }
  return Math.abs(a) / 2 / 10000;
}

function rectM2(r) {
  return (r.dx * r.dy) / 10000;
}

/** Dreptunghiuri de util ale camerei (fără zid_nu_util / extensie desen). */
function areaRectsOfRoom(r, levelIdx = null) {
  const rects = [{ x: r.x, y: r.y, dx: r.dx, dy: r.dy }];
  for (const p of r.parts || []) {
    if (p.role === "extensie" || p.role === "zid_nu_util") continue;
    if (p.levels && levelIdx != null && !p.levels.includes(levelIdx)) continue;
    if (!(p.dx > 0) || !(p.dy > 0)) continue;
    if (typeof p.x !== "number" || typeof p.y !== "number") continue;
    rects.push({ x: p.x, y: p.y, dx: p.dx, dy: p.dy });
  }
  return rects;
}

function intersectRect(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.dx, b.x + b.dx);
  const y1 = Math.min(a.y + a.dy, b.y + b.dy);
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, dx: x1 - x0, dy: y1 - y0 };
}

/**
 * Goluri încălzite prin zid interior (A7/A8) — pardoseala din toc = util.
 * Nu: terasă, geam anvelopă, intrare scară/rece, șină glisante (deja în dressing).
 */
function openingOnLevel(o, levelIdx) {
  if (o.levels && o.levels.length) return o.levels.includes(levelIdx);
  return true; // nedefinit = P+E (ex. baie_usa_dorm)
}

function isHeatedInteriorPassage(o) {
  if (!(o.dx > 0) || !(o.dy > 0)) return false;
  if (typeof o.x !== "number" || typeof o.y !== "number") return false;
  const id = o.id || "";
  if (
    /terasa|geam_|intrare_parter|intrare_etaj|rampa|lamele|nisa_glisante/i.test(
      id
    )
  )
    return false;
  return (
    id === "baie_usa" ||
    id === "baie_usa_dorm" ||
    id === "baie_living_gol"
  );
}

/** Cameră care primește m²-ul golului (etichetă). */
function passageRoomId(o, levelIdx) {
  const id = o.id || "";
  if (id === "baie_usa" || id === "baie_usa_dorm") return "hol_vest";
  if (id === "baie_living_gol") return levelIdx === 0 ? "living_p" : "living_e";
  return null;
}

function heatedPassagesForRoom(roomId, levelIdx) {
  return openings
    .filter(
      (o) =>
        isHeatedInteriorPassage(o) &&
        openingOnLevel(o, levelIdx) &&
        passageRoomId(o, levelIdx) === roomId
    )
    .map((o) => ({ x: o.x, y: o.y, dx: o.dx, dy: o.dy, id: o.id }));
}

/** Util rects = cameră + goluri atribuite (A1.121). */
function areaRectsOfRoomUtil(r, levelIdx) {
  return [
    ...areaRectsOfRoom(r, levelIdx),
    ...heatedPassagesForRoom(r.id, levelIdx),
  ];
}

/** rect − cutter (AABB) → listă resturi. */
function subtractRect(rect, cutter) {
  const hit = intersectRect(rect, cutter);
  if (!hit) return [rect];
  const out = [];
  const x0 = rect.x;
  const y0 = rect.y;
  const x1 = rect.x + rect.dx;
  const y1 = rect.y + rect.dy;
  const cx0 = hit.x;
  const cy0 = hit.y;
  const cx1 = hit.x + hit.dx;
  const cy1 = hit.y + hit.dy;
  if (cy0 > y0) out.push({ x: x0, y: y0, dx: rect.dx, dy: cy0 - y0 });
  if (cy1 < y1) out.push({ x: x0, y: cy1, dx: rect.dx, dy: y1 - cy1 });
  if (cx0 > x0)
    out.push({ x: x0, y: cy0, dx: cx0 - x0, dy: hit.dy });
  if (cx1 < x1)
    out.push({ x: cx1, y: cy0, dx: x1 - cx1, dy: hit.dy });
  return out.filter((r) => r.dx > 0.01 && r.dy > 0.01);
}

function subtractOpeningsFromWall(wall, levelIdx) {
  let remnants = [
    { x: wall.x, y: wall.y, dx: wall.dx, dy: wall.dy },
  ];
  for (const o of openings) {
    if (!isHeatedInteriorPassage(o)) continue;
    if (!openingOnLevel(o, levelIdx)) continue;
    const next = [];
    for (const r of remnants) next.push(...subtractRect(r, o));
    remnants = next;
  }
  return remnants;
}

/** Aria uniunii (cm²) — inclusion-exclusion, n mic. */
function unionAreaCm2(rects) {
  const list = (rects || []).filter((r) => r && r.dx > 0 && r.dy > 0);
  const n = list.length;
  if (n === 0) return 0;
  if (n === 1) return list[0].dx * list[0].dy;
  let sum = 0;
  const total = 1 << n;
  for (let mask = 1; mask < total; mask++) {
    let x0 = -Infinity;
    let y0 = -Infinity;
    let x1 = Infinity;
    let y1 = Infinity;
    let bits = 0;
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i))) continue;
      bits++;
      const r = list[i];
      x0 = Math.max(x0, r.x);
      y0 = Math.max(y0, r.y);
      x1 = Math.min(x1, r.x + r.dx);
      y1 = Math.min(y1, r.y + r.dy);
    }
    if (x1 > x0 && y1 > y0) {
      const sign = bits % 2 === 1 ? 1 : -1;
      sum += sign * (x1 - x0) * (y1 - y0);
    }
  }
  return sum;
}

/** Brut util = uniune fețe int. + goluri atribuite (fără dublă numărare). */
function roomGrossCm2(r, levelIdx) {
  return unionAreaCm2(areaRectsOfRoomUtil(r, levelIdx));
}

/**
 * A1.110/121: obstacole = stâlpi ∩ cameră ∪ (pereți A6/A7/A8/int ∖ goluri) ∩ cameră.
 * Golurile din toc rămân util (nu mai sunt anulate de amprenta zidului).
 */
function obstaclesInRoomCm2(room, levelIdx) {
  const rects = areaRectsOfRoomUtil(room, levelIdx);
  const pieces = [];

  for (const c of columns) {
    const lv = c.levels;
    if (lv && !lv.includes(levelIdx)) continue;
    for (const rec of rects) {
      const hit = intersectRect(c, rec);
      if (hit) pieces.push(hit);
    }
  }

  for (const w of walls) {
    if (w.removed || w.status === "ELIMINAT") continue;
    if (w.levels && !w.levels.includes(levelIdx)) continue;
    const cat = w.catalog_id || w.assembly;
    const count =
      cat === "A6" ||
      cat === "A7" ||
      cat === "A8" ||
      w.kind === "int";
    if (!count) continue;
    for (const wr of subtractOpeningsFromWall(w, levelIdx)) {
      for (const rec of rects) {
        const hit = intersectRect(wr, rec);
        if (hit) pieces.push(hit);
      }
    }
  }

  return unionAreaCm2(pieces);
}

/** Doar proem. stâlpi (geo) — pentru detaliu / raport. */
function columnProtrusionInRoomCm2(room, levelIdx) {
  const rects = areaRectsOfRoomUtil(room, levelIdx);
  const pieces = [];
  for (const c of columns) {
    const lv = c.levels;
    if (lv && !lv.includes(levelIdx)) continue;
    for (const rec of rects) {
      const hit = intersectRect(c, rec);
      if (hit) pieces.push(hit);
    }
  }
  return unionAreaCm2(pieces);
}

/** Pereți A6/A7/A8/int din util (uniune, fără goluri) — pentru detaliu / raport. */
function intWallsInRoomCm2(room, levelIdx) {
  const rects = areaRectsOfRoomUtil(room, levelIdx);
  const pieces = [];
  for (const w of walls) {
    if (w.removed || w.status === "ELIMINAT") continue;
    if (w.levels && !w.levels.includes(levelIdx)) continue;
    const cat = w.catalog_id || w.assembly;
    if (cat !== "A6" && cat !== "A7" && cat !== "A8" && w.kind !== "int")
      continue;
    for (const wr of subtractOpeningsFromWall(w, levelIdx)) {
      for (const rec of rects) {
        const hit = intersectRect(wr, rec);
        if (hit) pieces.push(hit);
      }
    }
  }
  return unionAreaCm2(pieces);
}

const HEATED_ROOM_IDS = new Set([
  "baie",
  "dormitor",
  "bucatarie_p",
  "living_p",
  "hol_p",
  "hol_vest",
  "living_e",
  "bucatarie_e",
]);

function computeUsefulAreas() {
  const roomRows = [];
  const byLevel = { 0: [], 1: [] };

  for (const r of rooms) {
    if (!HEATED_ROOM_IDS.has(r.id)) continue;
    for (const lv of r.levels || []) {
      const passages = heatedPassagesForRoom(r.id, lv);
      const passageCm2 = passages.reduce((s, p) => s + p.dx * p.dy, 0);
      const grossCm2 = roomGrossCm2(r, lv);
      const protrCm2 = columnProtrusionInRoomCm2(r, lv);
      const intCm2 = intWallsInRoomCm2(r, lv);
      const obstCm2 = obstaclesInRoomCm2(r, lv);
      // A1.110/121: net = brut (cameră+goluri) − uniune obstacole (stâlpi∪pereți∖goluri)
      const netCm2 = Math.max(0, grossCm2 - obstCm2);
      const row = {
        id: r.id,
        label: r.label,
        level: lv,
        level_name: lv === 0 ? "parter" : "etaj",
        gross_m2: +(grossCm2 / 10000).toFixed(4),
        passage_openings_m2: +(passageCm2 / 10000).toFixed(4),
        column_protrusion_m2: +(protrCm2 / 10000).toFixed(4),
        int_walls_m2: +(intCm2 / 10000).toFixed(4),
        obstacles_union_m2: +(obstCm2 / 10000).toFixed(4),
        net_m2: +(netCm2 / 10000).toFixed(4),
        dims_cm: { x: r.x, y: r.y, dx: r.dx, dy: r.dy },
        passages: passages.map((p) => p.id),
      };
      roomRows.push(row);
      byLevel[lv].push(row);
    }
  }

  // Contur încălzit pe fețe int. (verificare shoelace)
  const polyP = [
    [TH.A2, TH.A1],
    [XE, TH.A1],
    [XE, Y_PALIER_INCHIDERE_P],
    [BUC_EST_X0, Y_PALIER_INCHIDERE_P],
    [BUC_EST_X0, Y_S_HEAT],
    [XI, Y_S_HEAT],
    [XI, walls.find((w) => w.id === "dormitor_sud")?.y ?? 644],
    [TH.A2, walls.find((w) => w.id === "dormitor_sud")?.y ?? 644],
    [TH.A2, TH.A1],
  ];
  const yA6n = +(Y_PALIER_N - TH.A6).toFixed(1);
  const polyE = [
    [TH.A2, TH.A1],
    [XE, TH.A1],
    [XE, yA6n],
    [BUC_EST_X0, yA6n],
    [BUC_EST_X0, Y_S_HEAT],
    [XI, Y_S_HEAT],
    [XI, walls.find((w) => w.id === "dormitor_sud")?.y ?? 644],
    [TH.A2, walls.find((w) => w.id === "dormitor_sud")?.y ?? 644],
    [TH.A2, TH.A1],
  ];

  const sumNet = (lv) =>
    +byLevel[lv].reduce((s, r) => s + r.net_m2, 0).toFixed(4);
  const sumGross = (lv) =>
    +byLevel[lv].reduce((s, r) => s + r.gross_m2, 0).toFixed(4);

  // pe etaj baie+dormitor apar o dată în rooms cu levels [0,1] — deja pe lv
  const usefulP = sumNet(0);
  const usefulE = sumNet(1);
  const shoelaceP = +shoelaceM2(polyP).toFixed(4);
  const shoelaceE = +shoelaceM2(polyE).toFixed(4);

  /** A1.106: detaliu util baie (L) — același pe P/E. */
  const baieRoom = rooms.find((r) => r.id === "baie");
  const baieRow = roomRows.find((r) => r.id === "baie" && r.level === 0);
  const baieCorpCm2 = baieRoom ? baieRoom.dx * baieRoom.dy : 0;
  const baieDusExtraCm2 = DUS_ZONE.dx * Math.max(0, Y_DUS_1 - Y_BAIE_SUD_ZID); // sud de Y144
  const baieFlancCm2 = BAIE_FLANC.dx * BAIE_FLANC.dy;
  const passageDetail = [0, 1].map((lv) => {
    const list = openings.filter(
      (o) => isHeatedInteriorPassage(o) && openingOnLevel(o, lv)
    );
    return {
      level: lv,
      level_name: lv === 0 ? "parter" : "etaj",
      items: list.map((o) => ({
        id: o.id,
        room: passageRoomId(o, lv),
        m2: +((o.dx * o.dy) / 10000).toFixed(4),
        cm: { x: o.x, y: o.y, dx: o.dx, dy: o.dy },
      })),
      total_m2: +(
        list.reduce((s, o) => s + o.dx * o.dy, 0) / 10000
      ).toFixed(4),
    };
  });

  const baieDetail = baieRow
    ? {
        method:
          `A1.116/121: corp + duș + flanc + liber 15×${NISA_EST_REMOVE_DY} − geo obstacole; goluri uși în hol_vest`,
        corp_m2: +(baieCorpCm2 / 10000).toFixed(4),
        dus_sud_de_Y144_m2: +(baieDusExtraCm2 / 10000).toFixed(4),
        flanc_prosoape_m2: +(baieFlancCm2 / 10000).toFixed(4),
        est_liber_m2: +((TH.A8 * NISA_EST_REMOVE_DY) / 10000).toFixed(4),
        gross_m2: baieRow.gross_m2,
        column_protrusion_m2: baieRow.column_protrusion_m2,
        int_walls_m2: baieRow.int_walls_m2,
        obstacles_union_m2: baieRow.obstacles_union_m2,
        net_m2: baieRow.net_m2,
      }
    : null;

  return {
    method:
      "A1.121: camere încălzite = uniune fețe int. (rect+parts+goluri uși/toc) − uniune geo obstacole (stâlpi ∪ (A6/A7/A8/int ∖ goluri)). Etichete = același net. Fără terasă/scară/zid_nu_util.",
    useful_target_m2: 37,
    useful_parter_m2: usefulP,
    useful_etaj_m2: usefulE,
    useful_parter_gross_m2: sumGross(0),
    useful_etaj_gross_m2: sumGross(1),
    shoelace_parter_m2: shoelaceP,
    shoelace_etaj_m2: shoelaceE,
    delta_rooms_minus_shoelace_P_m2: +(usefulP - shoelaceP).toFixed(4),
    delta_rooms_minus_shoelace_E_m2: +(usefulE - shoelaceE).toFixed(4),
    delta_P_vs_37_m2: +(usefulP - 37).toFixed(4),
    delta_E_vs_37_m2: +(usefulE - 37).toFixed(4),
    useful_baie_detail: baieDetail,
    useful_passage_openings: passageDetail,
    rooms: roomRows,
    poly_parter_cm: polyP,
    poly_etaj_cm: polyE,
    terrace_slab_setback_cm: TERRACE_SLAB_SETBACK_CM,
    notes: [
      "A1.121: goluri încălzite prin zid (baie_usa, baie_usa_dorm, baie_living_gol) = util; zid obstacol = amprentă ∖ gol.",
      "A1.110: net = brut − uniune obstacole (geo stâlpi + A6/A7/A8); etichete din același net. Nu pin×faceLen.",
      "A1.110: living E scade A6 palier (pardoseala desenată nu e util sub zid).",
      "A1.106/109: baie L (corp+duș sud+flanc); vezi useful_baie_detail.",
      "A1.100: uniune rect (baie+duș+flanc, dorm+L dressing, hol+MS) — fără sumă naivă.",
      "Hol: fără banda zid A6 est (zid_nu_util). MS în hol. Uși baie→hol/dorm în hol_vest.",
      "Living E: L — N de mid până la XE; S de mid doar până la buc_est (fără palier rece).",
      "Bucătărie E: est = față V buc_est.",
      "Ținta 37 m²: nu bloca compartimentarea pe sute de cm² — util geometric ≠ finisaj executat.",
      "Shoelace = contur încălzit brut (fără obstacole) — referință; util ≈ shoelace − ziduri∖goluri − stâlpi.",
    ],
  };
}

const usefulCalc = computeUsefulAreas();

const a1 = {
  meta: {
    id: "a1_architecture",
    version: "0.96",
    columns_removed_a1: {
      C_SE: "adăugat aiurea",
      C_SHAFT_E_PIER:
        "pe palier/scară — blochează acces; în V47 doar nivel S; scos de pe P/E. C_E_PAL rămâne (est sub palier, living).",
      C_E_JALUZELE: "A1.45–48 anulat — încercare Belgian; revenire A1.44",
      C_E_GEAM_S:
        "A1.52: scos lângă geam living; stâlp pe R2 zona rece — ulterior",
    },
    columns_added_a1: {
      C_E_LAMELE: "A1.58: pier 20×40 rece (lungime fațadă ≈¼–⅓ lamele), sud de gol; parapet continuă",
    },
    status: "ARH_STUDIU",
    generated: new Date().toISOString(),
    brief: "decisions/brief_A0_v01.md",
    site: "data/building/a0_site.json",
    source_walls: "v47 remap 680×860 — grosimi catalog A1/A2/A7/A8",
    source_columns: "v47_a1_frame_study columns → A0 (exces interior, fără pilastru afară)",
    rooms_policy:
      "Dormitor+nișă aceeași culoare P/E. Etaj: living+dining până la perete despărțitor; bucătărie sud de perete.",
    note: "ARH + stâlpi PROVIZORII (vizibili, proem. int.). Grinzi/FE = S1.",
    dimensions_status:
      "STUDIO: cote pe fețe int. Îngheț după confirmare; util shoelace − proem. stâlpi = rundă următoare.",
  },
  envelope_cm: {
    ew: EW,
    ns: NS,
    wall_thickness_cm: { A1: TH.A1, A2: TH.A2, A7: TH.A7, A8: TH.A8 },
    brick_on_extreme_cm: BRICK_ON_EXTREME_CM,
    inset_to_brick_cm: { A1: INSET_TO_BRICK_A1, A2: INSET_TO_BRICK_A2 },
    column_protrusion_rule:
      "finit ≠ extremă stâlp: pereți pe finit; stâlp pe cărămidă (retras); 30−20=+10 în cameră",
    note: "Pereți pe finit 680×860 · stâlpi retrași pe extrema EB20 · +10 în cameră",
  },
  heights_cm: {
    clear_min_cm: 255,
    riser_max_cm: 16,
    clear_to_false_ceiling_cm: src.heights_cm?.clear_to_false_ceiling_cm ?? 255,
    ff_to_ff_cm: STAIR_PALIER_Z,
    note: "Clear ≥255 · riser ≤16 — brief.",
  },
  areas: {
    footprint_m2: a0.footprint.area_m2,
    pot_pct_147: a0.footprint.pot_pct,
    useful_target_m2: 37,
    useful_status:
      usefulCalc.useful_parter_m2 >= 37 && usefulCalc.useful_etaj_m2 >= 37
        ? "OK_GEOMETRIC — camere net ≥37; NECONFIRMAT autorizare"
        : "SUB_37 — verific geometrie",
    useful_parter_m2: usefulCalc.useful_parter_m2,
    useful_etaj_m2: usefulCalc.useful_etaj_m2,
    useful_parter_gross_m2: usefulCalc.useful_parter_gross_m2,
    useful_etaj_gross_m2: usefulCalc.useful_etaj_gross_m2,
    shoelace_parter_m2: usefulCalc.shoelace_parter_m2,
    shoelace_etaj_m2: usefulCalc.shoelace_etaj_m2,
    delta_P_vs_37_m2: usefulCalc.delta_P_vs_37_m2,
    delta_E_vs_37_m2: usefulCalc.delta_E_vs_37_m2,
    useful_rooms_m2: usefulCalc.rooms,
    useful_baie_detail: usefulCalc.useful_baie_detail,
    useful_passage_openings: usefulCalc.useful_passage_openings,
    useful_method: usefulCalc.method,
    useful_notes: usefulCalc.notes,
    terrace_slab_setback_cm: TERRACE_SLAB_SETBACK_CM,
    poly_parter_cm: usefulCalc.poly_parter_cm,
    poly_etaj_cm: usefulCalc.poly_etaj_cm,
  },
  walls_cm: walls,
  columns_cm: columns,
  rooms_cm: rooms,
  openings_cm: openings,
  parapets_cm: parapets,
  furniture_cm: furniture,
  stair_cm: stair,
  axes_cm: axes,
  placement_ref: a0.footprint.corners_site_m,
  next: ["Confirmare planuri P/E", "Util shoelace", "S1 structură pe A1 înghețat"],
};

fs.mkdirSync(path.join(root, "data/building"), { recursive: true });
fs.writeFileSync(path.join(root, "data/building/a1_architecture.json"), JSON.stringify(a1, null, 2));

const font = "IBM Plex Sans,Segoe UI,Arial,sans-serif";

function showWall(w, levelIdx) {
  if (w.removed || w.status === "ELIMINAT") return false;
  if (/ELIMINAT/i.test(w.note || "")) return false;
  if (w.id === "living_palier") return false; // zid scos — nu pe plan
  if (w.levels && !w.levels.includes(levelIdx)) return false;
  return true;
}

function showOpening(o, levelIdx) {
  if (o.levels && !o.levels.includes(levelIdx)) return false;
  if (typeof o.x !== "number") return false;
  return true;
}

function planSvg(levelIdx, title) {
  // A3 portret printabil (~297×420 mm @ 150 dpi ≈ 1754×2480 px)
  const scale = 2.15;
  const padL = 100;
  const padT = 80;
  const padR = 200;
  const padB = 100;
  const planNS = NS + 140; // terasă + trepte
  const W = EW * scale + padL + padR;
  const H = planNS * scale + padT + padB;
  const sx = (x) => padL + x * scale;
  const sy = (y) => padT + y * scale;
  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W)}" height="${Math.round(H)}" viewBox="0 0 ${W} ${H}" data-paper="A3">`
  );
  // hașuri materiale (plan A3)
  parts.push(`<defs>`);
  parts.push(`<pattern id="patBrick" patternUnits="userSpaceOnUse" width="10" height="6">`);
  parts.push(`<rect width="10" height="6" fill="#c49a6c"/>`);
  parts.push(`<path d="M0,3 H10 M0,0 H10 M0,6 H10 M5,3 V6" stroke="#6b4e32" stroke-width="0.7" fill="none"/>`);
  parts.push(`</pattern>`);
  parts.push(`<pattern id="patInsul" patternUnits="userSpaceOnUse" width="8" height="8">`);
  parts.push(`<rect width="8" height="8" fill="#e8d56a"/>`);
  parts.push(`<path d="M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6" stroke="#8a7a20" stroke-width="1"/>`);
  parts.push(`</pattern>`);
  parts.push(`<pattern id="patConcrete" patternUnits="userSpaceOnUse" width="7" height="7">`);
  parts.push(`<rect width="7" height="7" fill="#7a7a7a"/>`);
  parts.push(`<path d="M0,0 L7,7 M-2,5 L5,-2 M2,9 L9,2" stroke="#2a2a2a" stroke-width="1.1"/>`);
  parts.push(`</pattern>`);
  parts.push(`</defs>`);

  parts.push(`<rect width="100%" height="100%" fill="#faf9f7"/>`);
  parts.push(
    `<text x="${padL}" y="36" font-size="22" font-weight="700" fill="#111" font-family="${font}">${title}</text>`
  );
  parts.push(
    `<text x="${padL}" y="56" font-size="13" fill="#555" font-family="${font}">${EW}×${NS} cm</text>`
  );

  const levelRooms = rooms.filter((r) => !r.levels || r.levels.includes(levelIdx));

  // baie întâi, apoi dormitor (+nișă aceeași culoare peste)
  const ordered = [...levelRooms].sort((a, b) => {
    const rank = (id) => (id === "baie" ? 0 : id === "dormitor" ? 1 : 2);
    return rank(a.id) - rank(b.id);
  });

  function fillRect(r, fill, opacity = 0.88) {
    parts.push(
      `<rect x="${sx(r.x)}" y="${sy(r.y)}" width="${r.dx * scale}" height="${r.dy * scale}" fill="${fill || r.floor || "#eee"}" stroke="none" opacity="${opacity}"/>`
    );
  }

  for (const r of ordered) {
    fillRect(r);
    for (const p of r.parts || []) {
      if (p.levels && !p.levels.includes(levelIdx)) continue;
      // flanc L: după ziduri (vezi jos)
      if (p.id === "dorm_flanc") continue;
      fillRect(p, p.floor || r.floor);
    }
  }
  if (levelIdx === 0) fillRect(NISA, DORM_FLOOR, 1);
  else fillRect(NISA_LIVING_E, DORM_FLOOR, 1);

  parts.push(
    `<rect x="${sx(0)}" y="${sy(0)}" width="${EW * scale}" height="${NS * scale}" fill="none" stroke="#111" stroke-width="2.2"/>`
  );

  /**
   * FRAME pe plan:
   * — ETICS/izolație CONTINUĂ pe exterior (și peste stâlpi)
   * — EB20 = umplutură DOAR între stâlpi (nu lângă stâlp pe fața ext.)
   * — beton = stâlpii
   */
  function wallCatalog(w) {
    return (
      w.catalog_id ||
      (w.id === "living_palier" ? "A6" : null) ||
      (w.kind === "int" ? "A7" : "A1")
    );
  }

  /** Bandă pe grosime: fromExt = cm de la fața exterioară inward. */
  function stripRect(w, outward, fromExt, thick, along0, along1) {
    if (thick < 0.15 || along1 - along0 < 0.15) return null;
    if (outward === "N") {
      return { x: along0, y: w.y + fromExt, dx: along1 - along0, dy: thick };
    }
    if (outward === "S") {
      return { x: along0, y: w.y + w.dy - fromExt - thick, dx: along1 - along0, dy: thick };
    }
    if (outward === "W") {
      return { x: w.x + fromExt, y: along0, dx: thick, dy: along1 - along0 };
    }
    return { x: w.x + w.dx - fromExt - thick, y: along0, dx: thick, dy: along1 - along0 };
  }

  function paintRect(r, kind) {
    if (!r) return;
    const st = LAYER_STYLE[kind] || LAYER_STYLE.fallback;
    const fill = st.pattern ? `url(#${st.pattern})` : st.fill;
    parts.push(
      `<rect x="${sx(r.x)}" y="${sy(r.y)}" width="${Math.max(0.4, r.dx * scale)}" height="${Math.max(0.4, r.dy * scale)}" fill="${fill}" stroke="${st.stroke}" stroke-width="0.45"/>`
    );
  }

  /** Capăt pe finit exterior (colț fațadă) — acolo NU punem EB20. */
  function isFinishedEnvelopeEnd(outward, alongPos) {
    if (outward === "N" || outward === "S") {
      return alongPos <= INSET_TO_BRICK_A2 + 1 || alongPos >= EW - INSET_TO_BRICK_A2 - 1;
    }
    return alongPos <= INSET_TO_BRICK_A1 + 1 || alongPos >= NS - INSET_TO_BRICK_A2 - 1;
  }

  /**
   * A1.126: EB20 = bandă continuă pe grosimea zidului (inclusiv sub stâlpi = umplutură).
   * Stâlpii se desenează peste. NU mai decupăm EB20 pe stâlpi — altfel ISO de pe
   * finit apare vizual „în mijlocul zidului” la C_W_DORM / C_S_DORM_E etc.
   * Exclude doar bang-urile de colț pe finit (0 / EW / NS).
   */
  function spansBrickStrip(w, outward) {
    const alongX = outward === "N" || outward === "S";
    const a0 = alongX ? w.x : w.y;
    const a1 = alongX ? w.x + w.dx : w.y + w.dy;
    // un singur span; clip colț finit ca înainte
    let a = a0;
    let b = a1;
    if (outward === "N" || outward === "S") {
      if (isFinishedEnvelopeEnd(outward, a0)) a = Math.max(a, INSET_TO_BRICK_A2);
      if (isFinishedEnvelopeEnd(outward, a1)) b = Math.min(b, EW - INSET_TO_BRICK_A2);
      a = Math.max(a, INSET_TO_BRICK_A2);
      b = Math.min(b, EW - INSET_TO_BRICK_A2);
    } else {
      a = Math.max(a, INSET_TO_BRICK_A1);
      b = Math.min(b, NS - INSET_TO_BRICK_A2);
    }
    return b > a + 0.3 ? [[a, b]] : [];
  }

  function findHostExtWall(o) {
    let best = null;
    let bestArea = 0;
    for (const w of walls) {
      if (!showWall(w, levelIdx)) continue;
      const cat = wallCatalog(w);
      if (cat === "A7" || cat === "A8") continue;
      const x0 = Math.max(o.x, w.x);
      const y0 = Math.max(o.y, w.y);
      const x1 = Math.min(o.x + o.dx, w.x + w.dx);
      const y1 = Math.min(o.y + o.dy, w.y + w.dy);
      const area = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
      if (area > bestArea) {
        bestArea = area;
        best = w;
      }
    }
    return bestArea > 50 ? best : null;
  }

  /**
   * A1.118: gol prin TOATĂ grosimea (izolația e tăiată pe gol — toc pe falie, nu pe ISO).
   * Înainte: ușa doar pe EB20 → banda ISO rămânea vizibilă în toc (~8–10 cm).
   */
  function openingOnStructure(o) {
    const host = findHostExtWall(o);
    if (!host) return o;
    const outward = wallOutward(host);
    if (outward === "N" || outward === "S") {
      return { ...o, y: host.y, dy: host.dy, x: o.x, dx: o.dx };
    }
    return { ...o, x: host.x, dx: host.dx, y: o.y, dy: o.dy };
  }

  /** Intervale Y/X ale golurilor pe un perete (pentru tăiere straturi). */
  function openingGapsOnWall(w, outward) {
    const gaps = [];
    for (const o of openings) {
      if (!showOpening(o, levelIdx)) continue;
      const host = findHostExtWall(o);
      if (!host || host.id !== w.id) continue;
      if (outward === "N" || outward === "S") gaps.push([o.x, o.x + o.dx]);
      else gaps.push([o.y, o.y + o.dy]);
    }
    gaps.sort((p, q) => p[0] - q[0]);
    return gaps;
  }

  function segsMinusGaps(a0, a1, gaps) {
    let cur = a0;
    const segs = [];
    for (const [u, v] of gaps) {
      const uu = Math.max(u, a0);
      const vv = Math.min(v, a1);
      if (vv <= uu) continue;
      if (uu > cur + 0.3) segs.push([cur, uu]);
      cur = Math.max(cur, vv);
    }
    if (a1 > cur + 0.3) segs.push([cur, a1]);
    return segs.length ? segs : a1 > a0 + 0.3 ? [[a0, a1]] : [];
  }

  function drawInteriorWallSimple(w) {
    // taie goluri pe același perete (ex. baie_living_gol pe A7)
    const alongVert = w.dy >= w.dx;
    const gaps = [];
    for (const o of openings) {
      if (!showOpening(o, levelIdx)) continue;
      const x0 = Math.max(o.x, w.x);
      const y0 = Math.max(o.y, w.y);
      const x1 = Math.min(o.x + o.dx, w.x + w.dx);
      const y1 = Math.min(o.y + o.dy, w.y + w.dy);
      if (x1 - x0 < 2 || y1 - y0 < 2) continue;
      if (alongVert) gaps.push([y0, y1]);
      else gaps.push([x0, x1]);
    }
    gaps.sort((a, b) => a[0] - b[0]);
    const a0 = alongVert ? w.y : w.x;
    const a1 = alongVert ? w.y + w.dy : w.x + w.dx;
    let cur = a0;
    const segs = [];
    for (const [u, v] of gaps) {
      if (u > cur + 0.3) segs.push([cur, u]);
      cur = Math.max(cur, v);
    }
    if (a1 > cur + 0.3) segs.push([cur, a1]);
    if (!segs.length) segs.push([a0, a1]);
    for (const [p, q] of segs) {
      const rect = alongVert
        ? { x: w.x, y: p, dx: w.dx, dy: +(q - p).toFixed(1) }
        : { x: p, y: w.y, dx: +(q - p).toFixed(1), dy: w.dy };
      paintRect(rect, "intWall");
      parts.push(
        `<rect x="${sx(rect.x)}" y="${sy(rect.y)}" width="${rect.dx * scale}" height="${rect.dy * scale}" fill="none" stroke="#666" stroke-width="0.8"/>`
      );
    }
  }

  function drawExteriorWallFrame(w) {
    const cat = wallCatalog(w);
    const thCm = w.thickness_cm || TH[cat] || 30;
    const outward = wallOutward(w);
    const ins = insetToBrickCm(cat);
    const brick = Math.min(BRICK_ON_EXTREME_CM, thCm - ins);
    const along0 = outward === "N" || outward === "S" ? w.x : w.y;
    const along1 = outward === "N" || outward === "S" ? w.x + w.dx : w.y + w.dy;
    const gapCuts = openingGapsOnWall(w, outward);

    // 1) IZOLAȚIE — tăiată pe goluri (A1.118: fără ISO în toc)
    for (const [p, q] of segsMinusGaps(along0, along1, gapCuts)) {
      paintRect(stripRect(w, outward, 0, ins, p, q), "insulation");
    }

    // 2) EB20 Akustik CONTINUU pe grosime (sub stâlpi = umplutură) + tăiat pe goluri
    for (const [s0, s1] of spansBrickStrip(w, outward)) {
      for (const [p, q] of segsMinusGaps(s0, s1, gapCuts)) {
        if (q > p + 0.3) paintRect(stripRect(w, outward, ins, brick, p, q), "brick");
      }
    }

    parts.push(
      `<rect x="${sx(w.x)}" y="${sy(w.y)}" width="${w.dx * scale}" height="${w.dy * scale}" fill="none" stroke="#333" stroke-width="0.9"/>`
    );
  }

  /**
   * Izolație pe colțuri + buzunare stâlpi + canturi expuse la exterior/rece.
   */
  function patchEnvelopeInsulationGaps() {
    const iN = INSET_TO_BRICK_A1;
    const iE = INSET_TO_BRICK_A2;

    // Colțuri finite N/W / N/E — pătrate inset×inset
    paintRect({ x: 0, y: 0, dx: iE, dy: iN }, "insulation");
    paintRect({ x: EW - iE, y: 0, dx: iE, dy: iN }, "insulation");

    // Continuitate vest/est sub banda peretelui nord (altfel gol lângă C_NW / C_NE)
    paintRect({ x: 0, y: 0, dx: iE, dy: TH.A2 }, "insulation");
    paintRect({ x: EW - iE, y: 0, dx: iE, dy: TH.A1 }, "insulation");

    // În fața fiecărui stâlp perimetral — bandă pe finit
    for (const c of columns) {
      const f = c.faces || {};
      if (f.onN) paintRect({ x: c.x, y: 0, dx: c.dx, dy: iN }, "insulation");
      if (f.onW) paintRect({ x: 0, y: c.y, dx: iE, dy: c.dy }, "insulation");
      if (f.onE) paintRect({ x: EW - iE, y: c.y, dx: iE, dy: c.dy }, "insulation");
      if (f.onSEnv) paintRect({ x: c.x, y: NS - iE, dx: c.dx, dy: iE }, "insulation");
      // A1.126: FĂRĂ petic ISO pe onSDorm (C_W_DORM / C_S_DORM_E) —
      // ISO pe finit e deja din drawExteriorWallFrame; peticul apărea ca bandă
      // care „taie” zidul unde EB20 era decupat pe stâlp.
      if (f.onN && f.onW) paintRect({ x: 0, y: 0, dx: iE, dy: iN }, "insulation");
      if (f.onN && f.onE) paintRect({ x: EW - iE, y: 0, dx: iE, dy: iN }, "insulation");
      if (f.onSEnv && f.onE) paintRect({ x: EW - iE, y: NS - iE, dx: iE, dy: iE }, "insulation");
      // Colț SV bucătărie: izolație pe vest (terasă) în fața C_S_INTRARE_W + pătrat colț
      if (c.id === "C_S_INTRARE_W") {
        const te = walls.find((w) => w.id === "terasa_est");
        if (te) {
          paintRect({ x: te.x, y: c.y, dx: iN, dy: c.dy }, "insulation");
          paintRect({ x: te.x, y: NS - iE, dx: iN, dy: iE }, "insulation");
        }
      }
    }

    // Colț bucătărie SE: fața sud a piciorului A6
    const sud = walls.find((w) => w.id === "sud_bucatarie" && showWall(w, levelIdx));
    const buc = walls.find(
      (w) => (w.id === "buc_est" || w.id === "buc_est_etaj") && showWall(w, levelIdx)
    );
    if (sud && buc) {
      const x0 = sud.x + sud.dx;
      const x1 = buc.x + buc.dx;
      if (x1 > x0 + 0.5) {
        paintRect({ x: x0, y: NS - iE, dx: x1 - x0, dy: iE }, "insulation");
      }
    }

    // Est living continuu
    const estParts = walls.filter(
      (w) =>
        (w.id === "est_living" || w.id === "est_recuperat_p") && showWall(w, levelIdx)
    );
    if (estParts.length) {
      const y0 = Math.min(...estParts.map((w) => w.y));
      const y1 = Math.max(...estParts.map((w) => w.y + w.dy));
      paintRect({ x: EW - iE, y: y0, dx: iE, dy: y1 - y0 }, "insulation");
    }

    // A1.63: capăt est zid A6 (închidere palier P) — cant pe finit est
    const inch = walls.find((w) => w.id === "palier_inchidere_sud_p" && showWall(w, levelIdx));
    if (inch) {
      paintRect(
        { x: EW - iE, y: inch.y, dx: iE, dy: inch.dy },
        "insulation"
      );
      // colț SE living P: est × sud închidere
      paintRect(
        { x: EW - iE, y: inch.y + inch.dy - iE, dx: iE, dy: iE },
        "insulation"
      );
    }

  }

  for (const w of walls) {
    if (!showWall(w, levelIdx)) continue;
    const cat = wallCatalog(w);
    if (cat === "A7" || cat === "A8") drawInteriorWallSimple(w);
    else drawExteriorWallFrame(w);
  }
  /** Braț scurt L — după ziduri (parter); etaj = nișă living plină. */
  if (levelIdx === 0) fillRect(NISA_FLANC_DORM, DORM_FLOOR, 1);
  // gol 120 hol↔living (bandă A7 tăiată) — culoare living, nu alb
  {
    const gol = openings.find(
      (o) => o.id === "baie_living_gol" && showOpening(o, levelIdx)
    );
    if (gol) fillRect(gol, LIVING_FLOOR, 1);
  }
  // peste pereți: petice pe colțuri unde lipsea izolația
  patchEnvelopeInsulationGaps();

  // stâlpi beton — pe extrema EB20 (sub izolația continuă)
  // C_E_LAMELE: da pe P+E (poate coborî în fundație); parapet/lamele = doar etaj
  for (const c of columns) {
    parts.push(
      `<rect x="${sx(c.x)}" y="${sy(c.y)}" width="${c.dx * scale}" height="${c.dy * scale}" fill="url(#patConcrete)" stroke="#111" stroke-width="1.5"/>`
    );
    if (c.protrusion_into_room_cm > 0.5) {
      parts.push(
        `<text x="${sx(c.x + c.dx / 2)}" y="${sy(c.y + c.dy / 2)}" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="#fff" font-family="${font}" stroke="#111" stroke-width="2" paint-order="stroke">+${String(c.protrusion_into_room_cm).replace(".", ",")}</text>`
      );
    }
  }

  // A1.63 / A1.119: placare pe canturile stâlpilor spre terasă / rece
  {
    const t = TERRACE_COLUMN_INSUL_CM;
    for (const c of columns) {
      const id = c.id || "";
      // A1.125: C_W_DORM — FĂRĂ ISO pe cant S (e în mijlocul zidului = umplutură EB20)
      // C_S_DORM_E (NE terasă): fără placare pe cant — nu despărți stâlpul de zid
      if (/C_S_INTRARE_W/.test(id)) {
        paintRect({ x: c.x - t, y: c.y, dx: t, dy: c.dy + t }, "insulation");
        paintRect({ x: c.x, y: c.y + c.dy, dx: c.dx, dy: t }, "insulation");
      }
      if (/C_S_INTRARE_E/.test(id)) {
        // bucătărie SE: cant sud + est (spre scară rece) — doar în afara EB20
        paintRect({ x: c.x, y: c.y + c.dy, dx: c.dx + t, dy: t }, "insulation");
        paintRect({ x: c.x + c.dx, y: c.y, dx: t, dy: c.dy }, "insulation");
      }
      // A1.128: FĂRĂ cant ISO pe C_E_PAL / C_W_MID —
      // banda trecea prin EB20 (în mijlocul zidului). ISO pe finit = deja pe anvelopă.
    }
  }

  // mobilier studiu (pat, sanitare baie, MS)
  for (const f of furniture) {
    if (f.levels && !f.levels.includes(levelIdx)) continue;
    const fs = f.id === "pat" ? 11 : 9;
    parts.push(
      `<rect x="${sx(f.x)}" y="${sy(f.y)}" width="${f.dx * scale}" height="${f.dy * scale}" fill="${f.color || "#c4a882"}" fill-opacity="0.85" stroke="#5a4030" stroke-width="1.4"/>`
    );
    if (f.headboard === "west") {
      parts.push(
        `<rect x="${sx(f.x)}" y="${sy(f.y)}" width="${8 * scale}" height="${f.dy * scale}" fill="#8a6a4a" stroke="#5a4030" stroke-width="0.8"/>`
      );
    }
    if (f.glass_east) {
      const gDy = f.glass_east_dy != null ? f.glass_east_dy : f.dy;
      parts.push(
        `<line x1="${sx(f.x + f.dx)}" y1="${sy(f.y)}" x2="${sx(f.x + f.dx)}" y2="${sy(f.y + gDy)}" stroke="#5a8aaa" stroke-width="2" stroke-dasharray="5 3"/>`
      );
    }
    const lab = f.label;
    if (lab) {
      parts.push(
        `<text x="${sx(f.x + f.dx / 2)}" y="${sy(f.y + f.dy / 2)}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" font-weight="700" fill="#3a2a1a" font-family="${font}">${lab}</text>`
      );
    }
  }

  // goluri pe falie (EB20), nu pe izolație
  // wall_void (ex. gol 120): doar taie zidul — fără dreptunghi albastru (nu e ușă)
  for (const o of openings) {
    if (!showOpening(o, levelIdx)) continue;
    if (o.role === "wall_void" || o.system === "gol_zid") continue;
    const p = openingOnStructure(o);
    // glisante: desen custom (foi), fără dreptunghi gol generic
    if (o.system !== "glisante") {
      parts.push(
        `<rect x="${sx(p.x)}" y="${sy(p.y)}" width="${p.dx * scale}" height="${p.dy * scale}" fill="#b8d4f0" stroke="#2a5a8a" stroke-width="1.2"/>`
      );
    }
    // Ușă intrare P: în afară dreapta pe terasă (balama S, foaie vest)
    if (o.id === "intrare_parter" && o.leaf?.hinge_x != null) {
      const hx = o.leaf.hinge_x;
      const hy = o.leaf.hinge_y;
      const lw = o.leaf.width_cm || o.dy;
      parts.push(
        `<line x1="${sx(hx)}" y1="${sy(hy)}" x2="${sx(hx - lw)}" y2="${sy(hy)}" stroke="#1a1a1a" stroke-width="2"/>`
      );
      const r = lw * scale;
      const cx = sx(hx);
      const cy = sy(hy);
      // arc: închis N (pe gol) → deschis V (terasă); sweep=0 pe ecran y↓
      parts.push(
        `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx - r} ${cy}" fill="none" stroke="#1a1a1a" stroke-width="1.1" stroke-dasharray="4 3"/>`
      );
      parts.push(
        `<text x="${sx(hx - lw / 2)}" y="${sy(hy) + 12}" text-anchor="middle" font-size="8" fill="#1a1a1a" font-family="${font}">100 · afară dreapta</text>`
      );
    }
    // Ușă intrare E: de pe palier → stânga înăuntru (balama S, foaie vest în living)
    if (o.id === "intrare_etaj" && o.leaf?.hinge_x != null) {
      const hx = o.leaf.hinge_x;
      const hy = o.leaf.hinge_y;
      const lw = o.leaf.width_cm || 85;
      parts.push(
        `<line x1="${sx(hx)}" y1="${sy(hy)}" x2="${sx(hx - lw)}" y2="${sy(hy)}" stroke="#1a1a1a" stroke-width="2"/>`
      );
      const r = lw * scale;
      const cx = sx(hx);
      const cy = sy(hy);
      // arc: vârf N (închis) → V (deschis); sweep=0 (y↓)
      parts.push(
        `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx - r} ${cy}" fill="none" stroke="#1a1a1a" stroke-width="1.1" stroke-dasharray="4 3"/>`
      );
      parts.push(
        `<text x="${sx(hx - lw / 2)}" y="${sy(hy) + 12}" text-anchor="middle" font-size="8" fill="#1a1a1a" font-family="${font}">100 · stânga</text>`
      );
    }
    // Hol→baie: batantă pe baie_sud_gol, balama E (dreapta din hol), foaie nord în baie
    if (o.id === "baie_usa" && o.leaf?.hinge_x != null) {
      const hx = o.leaf.hinge_x;
      const hy = o.leaf.hinge_y;
      const lw = o.leaf.width_cm || o.construction_clear_cm || 88;
      const golLab = o.construction_clear_cm || o.dx || 90;
      // închis: foaie spre vest de balama
      parts.push(
        `<line x1="${sx(hx)}" y1="${sy(hy)}" x2="${sx(hx - lw)}" y2="${sy(hy)}" stroke="#1a1a1a" stroke-width="2"/>`
      );
      const r = lw * scale;
      const cx = sx(hx);
      const cy = sy(hy);
      // arc: vest (închis) → nord (deschis); pe ecran y↓ nord = cy−r; sweep=1
      parts.push(
        `<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}" fill="none" stroke="#1a1a1a" stroke-width="1.1" stroke-dasharray="4 3"/>`
      );
      parts.push(
        `<text x="${sx(hx - lw / 2)}" y="${sy(hy) - 10}" text-anchor="middle" font-size="8" fill="#1a1a1a" font-family="${font}">${golLab} · dreapta baie</text>`
      );
    }
    // Baie→dorm: batantă, balama E (stânga din baie), foaie sud în dorm
    if (o.id === "baie_usa_dorm" && o.leaf?.hinge_x != null) {
      const hx = o.leaf.hinge_x;
      const hy = o.leaf.hinge_y;
      const lw = o.leaf.width_cm || o.construction_clear_cm || 88;
      const golLab = o.construction_clear_cm || o.dx || 90;
      // închis: foaie spre vest de balama
      parts.push(
        `<line x1="${sx(hx)}" y1="${sy(hy)}" x2="${sx(hx - lw)}" y2="${sy(hy)}" stroke="#1a1a1a" stroke-width="2"/>`
      );
      const r = lw * scale;
      const cx = sx(hx);
      const cy = sy(hy);
      // arc: vest (închis) → sud (deschis); sweep=0 pe ecran y↓
      parts.push(
        `<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx} ${cy + r}" fill="none" stroke="#1a1a1a" stroke-width="1.1" stroke-dasharray="4 3"/>`
      );
      parts.push(
        `<text x="${sx(hx - lw / 2)}" y="${sy(hy) + 14}" text-anchor="middle" font-size="8" fill="#1a1a1a" font-family="${font}">${golLab} · stânga din baie</text>`
      );
    }
    // Dressing nișă: 3 glisante pe 180 (foi pe șină)
    if (o.id === "nisa_glisante_dorm" && o.system === "glisante") {
      const n = o.leaves || NISA_GLIS_LEAVES;
      const lw = o.leaf_width_cm || NISA_GLIS_LEAF;
      const yMid = o.y + o.dy / 2;
      for (let i = 0; i < n; i++) {
        const lx = o.x + i * lw;
        parts.push(
          `<rect x="${sx(lx)}" y="${sy(o.y)}" width="${lw * scale}" height="${o.dy * scale}" fill="#d8e0e8" stroke="#1a1a1a" stroke-width="1.4"/>`
        );
        // simbol glisare: săgeți scurte pe foaie
        const ay = sy(yMid);
        parts.push(
          `<line x1="${sx(lx + 8)}" y1="${ay}" x2="${sx(lx + lw - 8)}" y2="${ay}" stroke="#1a1a1a" stroke-width="1" stroke-dasharray="3 2"/>`
        );
      }
      parts.push(
        `<text x="${sx(o.x + o.dx / 2)}" y="${sy(o.y + o.dy) + 12}" text-anchor="middle" font-size="8" fill="#1a1a1a" font-family="${font}">${n}×${lw} glisante</text>`
      );
    }
  }

  const st = stair;
  const ghost = "#c2185b";

  /**
   * Scară pe plan: linii la fiecare tread_cm din geometrie (calculat), nu text din burta.
   * along=x → going = r.dx; along=y → going = r.dy.
   */
  function drawStairPart(r, opts = {}) {
    if (!r || typeof r.x !== "number") return;
    const {
      fill = "#5a7388",
      op = 0.45,
      label = "",
      zNote = "",
      treads = 0,
      along = "y",
      treadCm = null,
    } = opts;
    const going = along === "x" ? r.dx : r.dy;
    const n =
      treads > 0
        ? treads
        : treadCm > 0
          ? Math.max(1, Math.round(going / treadCm))
          : 0;
    const w = n > 0 ? +(going / n).toFixed(1) : 0;
    parts.push(
      `<rect x="${sx(r.x)}" y="${sy(r.y)}" width="${r.dx * scale}" height="${r.dy * scale}" fill="${fill}" fill-opacity="${op}" stroke="#1a1a1a" stroke-width="1.4"/>`
    );
    // linii la i×w cm pe going (lățime treaptă calculată)
    if (n > 1 && w > 0) {
      for (let i = 1; i < n; i++) {
        const off = i * w;
        if (along === "y") {
          const yy = sy(r.y + off);
          parts.push(
            `<line x1="${sx(r.x)}" y1="${yy}" x2="${sx(r.x + r.dx)}" y2="${yy}" stroke="#fff" stroke-opacity="0.55" stroke-width="1"/>`
          );
        } else {
          const xx = sx(r.x + off);
          parts.push(
            `<line x1="${xx}" y1="${sy(r.y)}" x2="${xx}" y2="${sy(r.y + r.dy)}" stroke="#fff" stroke-opacity="0.55" stroke-width="1"/>`
          );
        }
      }
    }
    // zNote === false → fără cotă; "" → auto n×w; string → text dat
    const autoNote =
      zNote === false
        ? ""
        : zNote || (n > 0 && w > 0 ? `${n}×${String(w).replace(".", ",")} cm` : "");
    if (label) {
      const cx = sx(r.x + r.dx / 2);
      const cy = sy(r.y + r.dy / 2);
      parts.push(
        `<text x="${cx}" y="${cy - (autoNote ? 6 : 0)}" text-anchor="middle" font-size="11" font-weight="700" fill="#0d1b2a" font-family="${font}">${label}</text>`
      );
      if (autoNote) {
        parts.push(
          `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="8" fill="#0d1b2a" font-family="${font}">${autoNote}</text>`
        );
      }
    }
  }

  function ghostRect(r, label) {
    if (!r || typeof r.x !== "number") return;
    parts.push(
      `<rect x="${sx(r.x)}" y="${sy(r.y)}" width="${r.dx * scale}" height="${r.dy * scale}" fill="none" stroke="${ghost}" stroke-width="1.8" stroke-dasharray="7 5"/>`
    );
    if (label) {
      parts.push(
        `<text x="${sx(r.x + 4)}" y="${sy(r.y) + 12}" font-size="9" font-weight="700" fill="${ghost}" font-family="${font}">${label}</text>`
      );
    }
  }

  // —— SCARĂ (ca plan real A3): pe nivel doar ce e relevant; 1 ghost ——
  // Traseu unic: trepte intrare → R1 → podest → R2 → palier E (nu „multe scări”)
  if (levelIdx === 0) {
    if (st.entry_steps) {
      drawStairPart(st.entry_steps, {
        label: "TREPTE",
        zNote: false,
        fill: "#6a8498",
        op: 0.45,
        treads: st.entry_steps.steps || 2,
        along: "y",
      });
    }
    const r1Treads =
      st.flight_180?.treads_between_landings ??
      Math.max(1, (st.risers_flight_180 || 8) - 1);
    drawStairPart(st.flight_180, {
      label: "R1",
      zNote: false,
      treads: r1Treads,
      along: "x",
      op: 0.55,
    });
    drawStairPart(st.podest_se, {
      label: "PODEST",
      zNote: false,
      fill: "#3d5a73",
      op: 0.55,
    });
    ghostRect(st.ramp2, null);
    ghostRect(st.palier_superior, null);
  } else {
    drawStairPart(st.palier_superior, {
      label: "PALIER",
      zNote: false,
      fill: "#3d5a73",
      op: 0.55,
    });
    const r2Treads =
      st.ramp2?.treads_between_landings ??
      Math.max(1, (st.risers_flight_330 || 10) - 1);
    drawStairPart(st.ramp2, {
      label: "R2",
      zNote: false,
      treads: r2Treads,
      along: "y",
      op: 0.55,
    });
    ghostRect(st.podest_se, null);
  }
  // Est scară: plin / lamele / pier / parapet — DOAR etaj
  if (levelIdx === 1) {
    if (st.stair_solid_e) paintRect(st.stair_solid_e, "concrete");
    if (st.stair_jaluzele_e) {
      const j = st.stair_jaluzele_e;
      parts.push(
        `<rect x="${sx(j.x)}" y="${sy(j.y)}" width="${j.dx * scale}" height="${j.dy * scale}" fill="#b8d4f0" fill-opacity="0.4" stroke="#1565c0" stroke-width="1.4" stroke-dasharray="6 3"/>`
      );
    }
    if (st.stair_parapet_e) paintRect(st.stair_parapet_e, "parapet");
    if (st.stair_parapet_podest_s) paintRect(st.stair_parapet_podest_s, "parapet");
  }

  // parapete terasă — DOAR miez (A5), fără EB20 / fără izolație
  for (const p of parapets) {
    if (p.levels && !p.levels.includes(levelIdx)) continue;
    paintRect(p, "parapet");
    parts.push(
      `<rect x="${sx(p.x)}" y="${sy(p.y)}" width="${Math.max(0.4, p.dx * scale)}" height="${Math.max(0.4, p.dy * scale)}" fill="none" stroke="#111" stroke-width="1.2"/>`
    );
  }

  const dimStroke = "#1a1a1a";
  const tick = 8;
  const fontDim = 12;
  /** Bounding boxes SVG pentru anti-suprapunere texte. */
  const textBoxes = [];
  function boxHits(a, b) {
    return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
  }
  function claimBox(x, y, w, h) {
    const box = { x, y, w, h };
    textBoxes.push(box);
    return box;
  }
  /** Plasează etichetă fără overlap; returnează (x,y) anchor. */
  function placeText(cx, cy, text, opts = {}) {
    const fs = opts.fontSize || fontDim;
    const rot = opts.rotate || 0;
    const w = Math.max(18, text.length * fs * 0.62);
    const h = fs + 4;
    const step = opts.step || 14;
    const dir = opts.dir || "down"; // down | up | left | right
    let x = cx;
    let y = cy;
    for (let i = 0; i < 12; i++) {
      const bx = rot ? x - h / 2 : x - w / 2;
      const by = rot ? y - w / 2 : y - h;
      const bw = rot ? h : w;
      const bh = rot ? w : h;
      const cand = { x: bx, y: by, w: bw, h: bh };
      if (!textBoxes.some((b) => boxHits(cand, b))) {
        claimBox(bx, by, bw, bh);
        return { x, y };
      }
      if (dir === "down") y += step;
      else if (dir === "up") y -= step;
      else if (dir === "left") x -= step;
      else x += step;
    }
    claimBox(rot ? x - h / 2 : x - w / 2, rot ? y - w / 2 : y - h, rot ? h : w, rot ? w : h);
    return { x, y };
  }
  function fmtCm(v) {
    if (typeof v !== "number" || !Number.isFinite(v)) return "";
    const r = Math.round(v * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1).replace(".", ",");
  }

  /** Cotă orizontală. offsetPx: − = N de muchie, + = S. */
  function dimH(x0, x1, yCm, offsetPx, valCm, labelExtra) {
    const span = Math.abs(x1 - x0);
    if (span < 8) return; // allow A7 12,5 etc.
    const xA = sx(Math.min(x0, x1));
    const xB = sx(Math.max(x0, x1));
    const yEdge = sy(yCm);
    const yLine = yEdge + offsetPx;
    const yTick0 = offsetPx < 0 ? yEdge - 3 : yEdge + 3;
    parts.push(
      `<line x1="${xA}" y1="${yTick0}" x2="${xA}" y2="${yLine}" stroke="${dimStroke}" stroke-width="1"/>`
    );
    parts.push(
      `<line x1="${xB}" y1="${yTick0}" x2="${xB}" y2="${yLine}" stroke="${dimStroke}" stroke-width="1"/>`
    );
    parts.push(
      `<line x1="${xA}" y1="${yLine}" x2="${xB}" y2="${yLine}" stroke="${dimStroke}" stroke-width="1.15"/>`
    );
    parts.push(
      `<line x1="${xA}" y1="${yLine - tick / 2}" x2="${xA}" y2="${yLine + tick / 2}" stroke="${dimStroke}" stroke-width="1.5"/>`
    );
    parts.push(
      `<line x1="${xB}" y1="${yLine - tick / 2}" x2="${xB}" y2="${yLine + tick / 2}" stroke="${dimStroke}" stroke-width="1.5"/>`
    );
    const label = `${fmtCm(valCm)}${labelExtra || ""}`;
    const midX = (xA + xB) / 2;
    const prefY = offsetPx < 0 ? yLine - 4 : yLine + fontDim + 2;
    const p = placeText(midX, prefY, label, {
      fontSize: fontDim,
      dir: offsetPx < 0 ? "up" : "down",
      step: 13,
    });
    parts.push(
      `<text x="${p.x}" y="${p.y}" text-anchor="middle" font-size="${fontDim}" font-weight="700" fill="#111" font-family="${font}">${label}</text>`
    );
  }

  /** Cotă verticală. offsetPx: − = V de muchie, + = E. */
  function dimV(y0, y1, xCm, offsetPx, valCm, labelExtra) {
    const span = Math.abs(y1 - y0);
    if (span < 8) return;
    const yA = sy(Math.min(y0, y1));
    const yB = sy(Math.max(y0, y1));
    const xEdge = sx(xCm);
    const xLine = xEdge + offsetPx;
    const xTick0 = offsetPx < 0 ? xEdge - 3 : xEdge + 3;
    parts.push(
      `<line x1="${xTick0}" y1="${yA}" x2="${xLine}" y2="${yA}" stroke="${dimStroke}" stroke-width="1"/>`
    );
    parts.push(
      `<line x1="${xTick0}" y1="${yB}" x2="${xLine}" y2="${yB}" stroke="${dimStroke}" stroke-width="1"/>`
    );
    parts.push(
      `<line x1="${xLine}" y1="${yA}" x2="${xLine}" y2="${yB}" stroke="${dimStroke}" stroke-width="1.15"/>`
    );
    parts.push(
      `<line x1="${xLine - tick / 2}" y1="${yA}" x2="${xLine + tick / 2}" y2="${yA}" stroke="${dimStroke}" stroke-width="1.5"/>`
    );
    parts.push(
      `<line x1="${xLine - tick / 2}" y1="${yB}" x2="${xLine + tick / 2}" y2="${yB}" stroke="${dimStroke}" stroke-width="1.5"/>`
    );
    const label = `${fmtCm(valCm)}${labelExtra || ""}`;
    const midY = (yA + yB) / 2;
    const prefX = xLine + (offsetPx < 0 ? -14 : 14);
    const p = placeText(prefX, midY, label, {
      fontSize: fontDim,
      rotate: -90,
      dir: offsetPx < 0 ? "left" : "right",
      step: 13,
    });
    parts.push(
      `<text x="${p.x}" y="${p.y}" text-anchor="middle" font-size="${fontDim}" font-weight="700" fill="#111" font-family="${font}" transform="rotate(-90 ${p.x} ${p.y})">${label}</text>`
    );
  }

  /** Etichetă liberă (fără linie), anti-overlap. */
  function noteAt(xCm, yCm, text, opts = {}) {
    const fs = opts.fontSize || 11;
    const fw = opts.bold ? 700 : 600;
    const fill = opts.fill || "#111";
    const anchor = opts.anchor || "middle";
    const p = placeText(sx(xCm), sy(yCm), text, {
      fontSize: fs,
      dir: opts.dir || "down",
      step: 12,
    });
    parts.push(
      `<text x="${p.x}" y="${p.y}" text-anchor="${anchor}" font-size="${fs}" font-weight="${fw}" fill="${fill}" font-family="${font}">${text}</text>`
    );
  }

  function roomAreaM2(r) {
    // pe plan: același net ca areas (A1.110 uniune obstacole)
    const net = a1.areas?.useful_rooms_m2?.find(
      (x) => x.id === r.id && x.level === levelIdx
    );
    if (net && typeof net.net_m2 === "number") {
      return net.net_m2.toFixed(2).replace(".", ",");
    }
    return (roomGrossCm2(r) / 10000).toFixed(2).replace(".", ",");
  }

  /**
   * Cote utile (A1.68): clear pe cameră (etichetă + lanț), bandă baie–dorm,
   * goluri, grosimi interioare — ca să se poată calcula hol ≥120.
   */
  function annotateRoom(r) {
    if (r.id === "scara_p" || r.id === "scara_e") return;
    const cx = r.x + r.dx / 2;
    const cy = r.y + r.dy / 2;
    noteAt(cx, cy - 10, r.label, { fontSize: 14, bold: true });
    noteAt(cx, cy + 4, `${fmtCm(r.dx)} × ${fmtCm(r.dy)}`, {
      fontSize: 12,
      bold: true,
      fill: "#0d47a1",
    });
    const utilLabel =
      r.id === "baie"
        ? `${roomAreaM2(r)} m² util (L)`
        : `${roomAreaM2(r)} m² util`;
    noteAt(cx, cy + 16, utilLabel, {
      fontSize: 10,
      fill: "#444",
    });
    // cote pe contur (clear = dx/dy cameră)
    if (r.dx >= 40) dimH(r.x, r.x + r.dx, r.y + r.dy, -16, r.dx);
    if (r.dy >= 40) dimV(r.y, r.y + r.dy, r.x + r.dx, -16, r.dy);
  }

  for (const r of ordered) annotateRoom(r);

  // —— Lanț N→S vest (baie / bandă nișă / dorm) — clar pentru hol ——
  {
    const baie = ordered.find((r) => r.id === "baie");
    const dorm = ordered.find((r) => r.id === "dormitor");
    if (baie && dorm) {
      const xChain = Math.max(4, baie.x - 8); // vest de baie, în perete/ext
      const yBaie0 = baie.y;
      const yBaie1 = +(baie.y + baie.dy).toFixed(1);
      const yDorm0 = dorm.y;
      const yDorm1 = +(dorm.y + dorm.dy).toFixed(1);
      const band = +(yDorm0 - yBaie1).toFixed(1); // 82,8 acum
      dimV(yBaie0, yBaie1, xChain, -28, baie.dy, " baie");
      if (band >= 20) {
        dimV(yBaie1, yDorm0, xChain, -28, band, " bandă");
        if (levelIdx === 0) {
          noteAt(
            HOL_NISA.x + HOL_NISA.dx / 2,
            HOL_NISA.y + HOL_NISA.dy / 2,
            `nișă hol ${fmtCm(HOL_NISA.util_dx)}×${fmtCm(HOL_NISA.util_dy)}`,
            { fontSize: 10, bold: true, fill: "#bf360c", dir: "down" }
          );
          dimH(HOL_NISA.x, HOL_NISA.x + HOL_NISA.dx, HOL_NISA.y + HOL_NISA.dy / 2, 16, HOL_NISA.util_dx);
          dimV(HOL_NISA.y, HOL_NISA.y + HOL_NISA.dy, HOL_NISA.x + HOL_NISA.dx / 2, -16, HOL_NISA.util_dy);
          noteAt(
            BAIE_FLANC.x + BAIE_FLANC.dx / 2,
            BAIE_FLANC.y + BAIE_FLANC.dy / 2,
            `${fmtCm(BAIE_FLANC.util_dx)}×${fmtCm(BAIE_FLANC.util_dy)}`,
            { fontSize: 8, fill: "#00695c", dir: "up" }
          );
          noteAt(
            NISA.x + NISA.dx / 2,
            NISA.y + NISA.dy / 2,
            `dulap ${fmtCm(NISA.util_dx)}×${fmtCm(NISA.util_dy)}`,
            { fontSize: 8, fill: "#6a1b9a", dir: "down" }
          );
          noteAt(
            NISA_FLANC_DORM.x + NISA_FLANC_DORM.dx / 2,
            NISA_FLANC_DORM.y + NISA_FLANC_DORM.dy / 2,
            `${fmtCm(NISA_FLANC_DORM.util_dx)}×${fmtCm(NISA_FLANC_DORM.util_dy)}`,
            { fontSize: 8, fill: "#6a1b9a", dir: "down" }
          );
        } else {
          noteAt(
            NISA_LIVING_E.x + NISA_LIVING_E.dx / 2,
            NISA_LIVING_E.y + NISA_LIVING_E.dy / 2,
            `nișă dorm ${fmtCm(NISA_LIVING_E.util_dx)}×${fmtCm(NISA_LIVING_E.util_dy)}`,
            { fontSize: 10, bold: true, fill: "#6a1b9a", dir: "down" }
          );
          dimH(
            NISA_LIVING_E.x,
            NISA_LIVING_E.x + NISA_LIVING_E.dx,
            NISA_LIVING_E.y + NISA_LIVING_E.dy / 2,
            16,
            NISA_LIVING_E.util_dx
          );
          dimV(
            NISA_LIVING_E.y,
            NISA_LIVING_E.y + NISA_LIVING_E.dy,
            NISA_LIVING_E.x + NISA_LIVING_E.dx / 2,
            -16,
            NISA_LIVING_E.util_dy
          );
        }
      }
      dimV(yDorm0, yDorm1, xChain, -28, dorm.dy, " dorm");
    }
  }

  // Grosime separator A7 (util la calc hol spre living)
  {
    const pc = walls.find((w) => w.id === "perete_comun_est");
    if (pc) {
      dimH(pc.x, pc.x + pc.dx, pc.y + 40, -22, pc.dx, " A7");
    }
  }

  // Goluri cheie — clear pe fiecare ușă/geam relevant
  for (const o of openings) {
    if (!showOpening(o, levelIdx)) continue;
    const id = o.id || "";
    const clear = o.construction_clear_cm || o.width_cm || Math.max(o.dx, o.dy);
    if (id === "geam_est") {
      dimV(o.y, o.y + o.dy, o.x - 8, -20, o.dy);
      noteAt(o.x - 22, o.y + o.dy / 2, `H${GEAM_H_CM}`, {
        fontSize: 10,
        fill: "#0d47a1",
        dir: "left",
      });
    } else if (
      id === "intrare_etaj" ||
      id === "intrare_parter" ||
      id === "buc_terasa_etaj" ||
      id === "baie_usa"
    ) {
      if (o.dy >= o.dx) dimV(o.y, o.y + o.dy, o.x + o.dx / 2, 20, clear);
      else dimH(o.x, o.x + o.dx, o.y + o.dy / 2, 18, clear);
    } else if (id === "dorm_terasa" || id === "baie_usa_dorm") {
      if (o.dx >= 40) dimH(o.x, o.x + o.dx, o.y + o.dy / 2, -18, clear);
      else if (o.dy >= 40) dimV(o.y, o.y + o.dy, o.x + o.dx / 2, 18, clear);
    }
  }

  // Pat: clear sud/vest/nord (→ușă) + gabarit
  {
    const bed = furniture.find((f) => f.id === "pat");
    if (bed && (!bed.levels || bed.levels.includes(levelIdx))) {
      dimV(bed.y + bed.dy, Y_DORM_S, bed.x + bed.dx / 2, 22, bed.clear_south_cm || 90, " clear S");
      dimV(DORM_N, bed.y, bed.x + bed.dx / 2, -22, bed.clear_north_cm || BED_CLEAR_N, " clear N");
      dimH(TH_W, bed.x, bed.y + bed.dy / 2, -18, bed.clear_west_cm || 10, " clear V");
      dimH(bed.x, bed.x + bed.dx, bed.y, -18, bed.dx);
      dimV(bed.y, bed.y + bed.dy, bed.x + bed.dx, 18, bed.dy);
    }
  }

  // Scară: clear bandă (o singură cotă)
  if (stair.width_clear_cm && levelIdx === 1) {
    const bandX = stair.band_x ?? 562.8;
    const yRef = (stair.palier_superior?.y ?? 450) + 40;
    dimH(bandX, bandX + stair.width_clear_cm, yRef, 18, stair.width_clear_cm, " clear");
  }

  // corp finit
  dimH(0, EW, 0, -32, EW);
  dimV(0, NS, EW, 32, NS);

  // Legendă scurtă
  const legX = sx(EW) + 20;
  let legY = padT + 4;
  parts.push(
    `<rect x="${legX - 6}" y="${legY - 4}" width="168" height="118" fill="#fff" stroke="#ccc" stroke-width="1"/>`
  );
  parts.push(
    `<text x="${legX}" y="${legY + 12}" font-size="12" font-weight="700" fill="#111" font-family="${font}">Legendă</text>`
  );
  legY += 28;
  for (const it of [
    { kind: "concrete", text: "Beton" },
    { kind: "brick", text: "EB20" },
    { kind: "insulation", text: "Izolație" },
    { kind: "parapet", text: "Parapet" },
  ]) {
    const st = LAYER_STYLE[it.kind];
    const fill = st.pattern ? `url(#${st.pattern})` : st.fill;
    parts.push(
      `<rect x="${legX}" y="${legY}" width="22" height="12" fill="${fill}" stroke="${st.stroke}" stroke-width="0.7"/>`
    );
    parts.push(
      `<text x="${legX + 28}" y="${legY + 10}" font-size="11" fill="#222" font-family="${font}">${it.text}</text>`
    );
    legY += 20;
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}

/**
 * Detaliu fațadă EST — desfășurare S→N pe Y, lungimi clare pe fiecare segment.
 * Elevație schematică (nu cotă Z completă): plin / geam / stâlpi / scară.
 */
function eastFacadeDetailSvg() {
  function fmt(v) {
    if (typeof v !== "number" || !Number.isFinite(v)) return "—";
    const r = Math.round(v * 10) / 10;
    return Number.isInteger(r) ? String(r) : String(r).replace(".", ",");
  }

  const geam = openings.find((o) => o.id === "geam_est");
  const cNE = columns.find((c) => c.id === "C_NE");
  const cPal = columns.find((c) => c.id === "C_E_PAL");
  const estLiv = walls.find((w) => w.id === "est_living");
  const estRec = walls.find((w) => w.id === "est_recuperat_p");
  const nord = walls.find((w) => w.id === "nord");
  const sud = walls.find((w) => w.id === "sud_bucatarie");
  const parapetE = stair.stair_parapet_e;

  const yNordExt = nord?.y ?? 0;
  const yNordInt = +(yNordExt + (nord?.dy ?? TH.A1)).toFixed(1);
  const yGeam0 = geam?.y ?? 104.8;
  const yGeam1 = +((geam?.y ?? 0) + (geam?.dy ?? 0)).toFixed(1);
  const yColPal0 = cPal?.y ?? Y_MID_COL;
  const yColPal1 = +((cPal?.y ?? Y_MID_COL) + (cPal?.dy ?? DY_MID_COL)).toFixed(1);
  const yEstLiv1 = estLiv ? +(estLiv.y + estLiv.dy).toFixed(1) : Y_PALIER_N;
  const yPalierN = stair.palier_superior?.y ?? 474.1;
  const yR2_0 = stair.ramp2?.y ?? 588.7;
  const yR2_1 = stair.ramp2 ? +(stair.ramp2.y + stair.ramp2.dy).toFixed(1) : 858.7;
  const ySudInt = NS;
  const seq = stair.stair_east_seq || {};
  const solid = stair.stair_solid_e;
  const jal = stair.stair_jaluzele_e;
  const gap = stair.stair_gap_roof_e;
  const pier = columns.find((c) => c.id === "C_E_LAMELE");
  const yParapet1 = parapetE ? +(parapetE.y + parapetE.dy).toFixed(1) : yR2_1;

  /** Segmente pe fațadă (ordine model N→S; desen S→N). */
  const segs = [
    { y0: yNordExt, y1: yNordInt, label: "zid N", kind: "wall" },
    { y0: yNordInt, y1: yGeam0, label: "plin", kind: "solid" },
    { y0: yGeam0, y1: yGeam1, label: "GEAM LIVING", kind: "glass" },
    { y0: yGeam1, y1: yColPal0, label: "plin", kind: "solid" },
    { y0: yColPal0, y1: yColPal1, label: "C_E_PAL = mid", kind: "col" },
    { y0: yColPal1, y1: yPalierN, label: "zid N palier", kind: "wall" },
    solid
      ? { y0: solid.y, y1: +(solid.y + solid.dy).toFixed(1), label: "zid plin palier", kind: "wall" }
      : null,
    jal
      ? { y0: jal.y, y1: +(jal.y + jal.dy).toFixed(1), label: `lamele L${jal.dy} H${jal.h_cm}`, kind: "glass" }
      : null,
    pier
      ? { y0: pier.y, y1: +(pier.y + pier.dy).toFixed(1), label: "C_E_LAMELE", kind: "col" }
      : null,
    parapetE
      ? { y0: parapetE.y, y1: yParapet1, label: "parapet după pier+podest", kind: "stair" }
      : { y0: yR2_1, y1: ySudInt, label: "la sud finit", kind: "solid" },
  ].filter(Boolean)
    .map((s) => ({
      ...s,
      dy: +Math.max(0, s.y1 - s.y0).toFixed(1),
    }))
    .filter((s) => s.dy >= 0.5);

  const yMin = yNordExt;
  const yMax = Math.max(ySudInt, yParapet1, yR2_1);
  const totalLen = +(yMax - yMin).toFixed(1);

  const scale = 2.4; // px/cm — A3 landscape detaliat
  const elevH = 220; // înălțime schematică elevație (px) — 1 nivel vizual
  const padL = 80;
  const padT = 90;
  const padR = 200;
  const padB = 160;
  const chainY = padT + elevH + 70;
  const W = padL + totalLen * scale + padR;
  const H = chainY + 220;
  /** S stânga → N dreapta (invers față de Y crescător). */
  const sx = (yCm) => padL + (yMax - yCm) * scale;
  const segX = (y0, y1) => {
    const a = sx(y0);
    const b = sx(y1);
    return { x0: Math.min(a, b), x1: Math.max(a, b), w: Math.abs(b - a) };
  };

  const fillOf = {
    wall: "#c4b8a8",
    solid: "#d8cfc3",
    glass: "#8ecae6",
    col: "#6e6e6e",
    stair: "#b0a090",
  };

  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W)}" height="${Math.round(H)}" viewBox="0 0 ${W} ${H}" data-paper="A3">`
  );
  parts.push(`<rect width="100%" height="100%" fill="#faf9f7"/>`);
  parts.push(
    `<text x="${padL}" y="36" font-size="22" font-weight="700" fill="#111" font-family="${font}">A1 · Detaliu fațadă EST · lungimi S→N</text>`
  );
  parts.push(
    `<text x="${padL}" y="58" font-size="13" fill="#333" font-family="${font}">Desfășurare pe Y (sud ← stânga · nord → dreapta) · finit ${EW}×${NS} · total pe axă ${fmt(totalLen)} cm</text>`
  );
  parts.push(
    `<text x="${padL}" y="76" font-size="12" fill="#555" font-family="${font}">Geam: L=${fmt(geam?.dy)} · H=${GEAM_H_CM} · prag=${GEAM_SILL_CM} · Parapet scară E dx=${fmt(stair.parapet_thick_cm ?? 10)}</text>`
  );

  // —— Elevație schematică (1 bandă) ——
  const elevTop = padT;
  for (const s of segs) {
    const { x0, w } = segX(s.y0, s.y1);
    const ww = Math.max(1, w);
    parts.push(
      `<rect x="${x0}" y="${elevTop}" width="${ww}" height="${elevH}" fill="${fillOf[s.kind] || "#ccc"}" stroke="#222" stroke-width="1.2"/>`
    );
    if (s.kind === "glass") {
      const sillH = (GEAM_SILL_CM / 304) * elevH;
      const gh = (GEAM_H_CM / 304) * elevH;
      parts.push(
        `<rect x="${x0}" y="${elevTop + elevH - sillH - gh}" width="${ww}" height="${gh}" fill="#4a90c8" stroke="#0d47a1" stroke-width="1.5"/>`
      );
      parts.push(
        `<text x="${x0 + ww / 2}" y="${elevTop + elevH - sillH - gh / 2}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#fff" font-family="${font}">H ${GEAM_H_CM}</text>`
      );
      parts.push(
        `<text x="${x0 + ww / 2}" y="${elevTop + elevH - sillH / 2}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#111" font-family="${font}">prag ${GEAM_SILL_CM}</text>`
      );
    }
  }
  if (cNE) {
    const { x0, w } = segX(cNE.y, cNE.y + cNE.dy);
    parts.push(
      `<rect x="${x0}" y="${elevTop}" width="${Math.max(1, w)}" height="${elevH}" fill="none" stroke="#111" stroke-width="2.5"/>`
    );
  }

  // —— Lanț cote sub elevație ——
  const dimY = elevTop + elevH + 28;
  parts.push(
    `<line x1="${sx(yMax)}" y1="${dimY}" x2="${sx(yMin)}" y2="${dimY}" stroke="#111" stroke-width="1.4"/>`
  );
  for (const s of segs) {
    const { x0, x1 } = segX(s.y0, s.y1);
    const mid = (x0 + x1) / 2;
    parts.push(
      `<line x1="${x0}" y1="${dimY - 8}" x2="${x0}" y2="${dimY + 8}" stroke="#111" stroke-width="1.6"/>`
    );
    parts.push(
      `<line x1="${x1}" y1="${dimY - 8}" x2="${x1}" y2="${dimY + 8}" stroke="#111" stroke-width="1.6"/>`
    );
    parts.push(
      `<text x="${mid}" y="${dimY - 12}" text-anchor="middle" font-size="16" font-weight="700" fill="#111" font-family="${font}">${fmt(s.dy)}</text>`
    );
    parts.push(
      `<text x="${mid}" y="${dimY + 26}" text-anchor="middle" font-size="11" fill="#333" font-family="${font}">${s.label}</text>`
    );
    // pe desen S← : eticheta Y la capătul din stânga al segmentului (= y1, sud)
    parts.push(
      `<text x="${x0}" y="${dimY + 48}" text-anchor="middle" font-size="10" fill="#666" font-family="${font}">Y${fmt(s.y1)}</text>`
    );
  }
  parts.push(
    `<text x="${sx(yMin)}" y="${dimY + 48}" text-anchor="middle" font-size="10" fill="#666" font-family="${font}">Y${fmt(yMin)}</text>`
  );

  // —— Tabel sumar ——
  let ty = chainY + 20;
  const tx = padL;
  const segsSN = [...segs].reverse();
  parts.push(
    `<text x="${tx}" y="${ty}" font-size="14" font-weight="700" fill="#111" font-family="${font}">Segmente (cm) — fațadă est</text>`
  );
  ty += 8;
  parts.push(
    `<text x="${tx}" y="${ty + 18}" font-size="12" font-family="${font}" fill="#222">S→N: ${segsSN.map((s) => `${fmt(s.dy)} (${s.label})`).join(" · ")}</text>`
  );
  ty += 44;
  const checks = [
    `plin N→geam = Y${fmt(yGeam0)} − Y${fmt(yNordInt)} = ${fmt(yGeam0 - yNordInt)}`,
    `geam L = ${fmt(yGeam1 - yGeam0)} · H = ${GEAM_H_CM} · prag = ${GEAM_SILL_CM}`,
    `plin geam→C_E_PAL = ${fmt(yColPal0 - yGeam1)} (C_E_GEAM_S scos)`,
    `C_E_PAL pe ax mid: Y${fmt(yColPal0)}–${fmt(yColPal1)} · Y_PALIER_N=${fmt(Y_PALIER_N)}`,
    `parapet E scară: Y${fmt(parapetE?.y)}→Y${fmt(yParapet1)} = ${fmt(yParapet1 - (parapetE?.y ?? yParapet1))} · grosime ${fmt(stair.parapet_thick_cm ?? 10)}`,
    `est_living dy = ${fmt(estLiv?.dy)} (Y${fmt(estLiv?.y)}→Y${fmt(yEstLiv1)}) · est_recuperat_p dy = ${fmt(estRec?.dy)}`,
  ];
  for (const line of checks) {
    parts.push(`<text x="${tx}" y="${ty}" font-size="12" fill="#222" font-family="${font}">${line}</text>`);
    ty += 18;
  }

  // legendă culori
  const legX = W - padR + 20;
  let ly = padT;
  const legend = [
    ["wall", "zid"],
    ["solid", "plin"],
    ["glass", "geam"],
    ["col", "stâlp"],
    ["stair", "scară/parapet"],
  ];
  parts.push(
    `<text x="${legX}" y="${ly}" font-size="12" font-weight="700" fill="#111" font-family="${font}">Legendă</text>`
  );
  ly += 16;
  for (const [k, t] of legend) {
    parts.push(
      `<rect x="${legX}" y="${ly}" width="22" height="14" fill="${fillOf[k]}" stroke="#222"/>`
    );
    parts.push(
      `<text x="${legX + 28}" y="${ly + 11}" font-size="11" fill="#222" font-family="${font}">${t}</text>`
    );
    ly += 22;
  }

  parts.push(`</svg>`);
  return { svg: parts.join("\n"), segs, totalLen };
}

fs.mkdirSync(path.join(root, "outputs/plans"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/plans/a1_plan_parter.svg"), planSvg(0, "A1 · Plan parter"));
fs.writeFileSync(path.join(root, "outputs/plans/a1_plan_etaj.svg"), planSvg(1, "A1 · Plan etaj"));
const eastDetail = eastFacadeDetailSvg();
fs.writeFileSync(path.join(root, "outputs/plans/a1_detaliu_fatada_est.svg"), eastDetail.svg);

console.log(
  JSON.stringify(
    {
      ok: true,
      version: a1.meta.version,
      rooms: rooms.map((r) => ({ id: r.id, label: r.label, levels: r.levels, x: r.x, y: r.y, dx: r.dx, dy: r.dy })),
      walls_th: walls.map((w) => ({ id: w.id, th: w.thickness_cm, cat: w.catalog_id })),
      columns: columns.map((c) => ({
        id: c.id,
        x: c.x,
        y: c.y,
        dx: c.dx,
        dy: c.dy,
        protr: c.protrusion_into_room_cm,
      })),
      east_facade_segs: eastDetail.segs.map((s) => ({
        y0: s.y0,
        y1: s.y1,
        dy: s.dy,
        label: s.label,
      })),
      files: [
        "data/building/a1_architecture.json",
        "outputs/plans/a1_plan_parter.svg",
        "outputs/plans/a1_plan_etaj.svg",
        "outputs/plans/a1_detaliu_fatada_est.svg",
      ],
    },
    null,
    2
  )
);
