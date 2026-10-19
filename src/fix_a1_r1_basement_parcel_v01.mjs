/**
 * Runda 1 — încadrare parcelă + acces beci (fără a muta P/E).
 * node src/fix_a1_r1_basement_parcel_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1Path = path.join(root, "data/building/a1_architecture.json");
const a1 = JSON.parse(fs.readFileSync(a1Path, "utf8"));

const EW = a1.envelope_cm?.ew ?? 680;
const CLEAR = 100;
const bm = a1.basement_cm;
const st = bm.stair;
const pit = st.pit;
const shaftWest = st.open_shaft?.x ?? 564.3;
const pitX1 = +(shaftWest + CLEAR).toFixed(1); // 664.3
const wallETh = +(EW - pitX1).toFixed(1); // 15.7 — BA subțire pe hotar Dragalina
if (wallETh < 15) throw new Error(`wall E too thin: ${wallETh}`);

// —— Puț: clip E la finit 680, păstrează clear scară 100
pit.x1 = pitX1;
pit.note =
  "A1.194: puț clipat la finit E 680; put_reten_e subțire pe hotar; V=ușă A11; S→curte";
for (const w of pit.walls || []) {
  if (w.id === "put_reten_e") {
    w.x = pitX1;
    w.dx = wallETh;
    w.note = `A1.194: retenție E puț ${wallETh} cm — outer@${EW} (fără overflow Dragalina)`;
  }
  if (w.id === "put_reten_n") {
    w.x = shaftWest;
    w.dx = +(EW - shaftWest).toFixed(1);
    w.note = "A1.194: închide puț N; span până la finit E 680";
  }
}
st.open_shaft.dx = CLEAR;
st.open_shaft.note = "puț deschis = clear scară 100 (A1.194); planșeu P gol aici";
st.flight.dx = CLEAR;
st.flight.note = "coborâre N sub R2; clear 100 lipit A6 (A1.194)";
// landings: păstrează lățimea sub placă, clip la EW
for (const key of ["upper_landing", "lower_landing"]) {
  const L = st[key];
  if (!L) continue;
  const maxDx = +(EW - L.x).toFixed(1);
  if (L.dx > maxDx) L.dx = maxDx;
}
st.fit = {
  ...st.fit,
  clear_a6_to_e: CLEAR,
  clear_at_pier: CLEAR,
  stair_clear_need: CLEAR,
  clear_ok: true,
  pier_warn: false,
  pier_removed: true,
  path: "curte→palier−95→scară↓N→palier−250→ușă A6→magazie→uși CT/dep",
  note: "A1.194: fără C_SHAFT_E_PIER în clear; grindă întoarsă pe put_reten_e",
};

// —— Uși interioare beci
const partXi = (bm.walls || []).find((w) => w.id === "subsol_part_xi");
const partCt = (bm.walls || []).find((w) => w.id === "subsol_part_ct_s");
bm.doors = [
  {
    id: "usa_magazie_ct",
    from: "magazie_subsol",
    to: "camera_tehnica",
    wall_id: "subsol_part_xi",
    x: partXi?.x ?? 339.9,
    y: 120,
    dx: partXi?.dx ?? 12.5,
    dy: 90,
    opening_h_cm: 200,
    lintel_reserve_cm: 15,
    swing: "into_ct_west",
    note: "A1.194: gol partiție XI — magazie↔CT",
  },
  {
    id: "usa_magazie_depozit",
    from: "magazie_subsol",
    to: "depozit_subsol",
    wall_id: "subsol_part_xi",
    x: partXi?.x ?? 339.9,
    y: 420,
    dx: partXi?.dx ?? 12.5,
    dy: 90,
    opening_h_cm: 200,
    lintel_reserve_cm: 15,
    swing: "into_depozit_west",
    note: "A1.194: gol partiție XI — magazie↔depozit",
  },
  {
    id: "usa_ct_depozit",
    from: "camera_tehnica",
    to: "depozit_subsol",
    wall_id: "subsol_part_ct_s",
    x: 140,
    y: partCt?.y ?? 280,
    dx: 90,
    dy: partCt?.dy ?? 12.5,
    opening_h_cm: 200,
    lintel_reserve_cm: 15,
    swing: "into_depozit_south",
    note: "A1.194: gol partiție CT|depozit",
  },
];

bm.status = "r1_parcel_access_A1_194";
bm.note =
  "A1.194: puț în parcelă · uși CT/dep · clear scară 100 fără pier · grinzi S flush pe ținta 220";
bm.clear_target_cm = 220;

// —— Structură: fundații N inward + clear beci; pier scos la rebuild
const S = a1.structure_a1_study_cm || (a1.structure_a1_study_cm = {});
S.foundations_study_cm = {
  ...(S.foundations_study_cm || {}),
  east_eccentric_inward: true,
  north_eccentric_inward: true,
  south_eccentric_inward: true,
  perimeter_strip_width_cm: S.foundations_study_cm?.perimeter_strip_width_cm ?? 115,
  perimeter_strip_drawn: "inward_no_heel_backfill",
  perimeter_strip_calc_status: "NOT_VALIDATED_FOR_DRAWN_GEOMETRY",
  note:
    "A1.194: tălpi N/E/S excentrice spre interior (încadrare parcelă). Talpă 115 inward ≠ calc heel+umplutură — recalcul rundă 3.",
};
if (S.levels_cm) {
  S.levels_cm.basement_beam_h_cm = 15;
  S.levels_cm.basement_beam_note =
    "A1.194: grinzi S în grosimea plăcii (fără drop) → clear sub grindă = clear sub placă 220";
  S.levels_cm.basement_clear_under_beam_cm = 220;
  S.levels_cm.note =
    (S.levels_cm.note || "") + " · A1.194 beci: beam_h S=15 flush, clear 220";
}
// scoate pier din columns dacă există (rebuild structure îl omite)
if (Array.isArray(S.columns)) {
  S.columns = S.columns.filter((c) => c.id !== "C_SHAFT_E_PIER");
}
if (S.foundation_pad_adopt_cm) delete S.foundation_pad_adopt_cm.C_SHAFT_E_PIER;
if (S.foundations_study_cm?.pad_by_column_cm) {
  delete S.foundations_study_cm.pad_by_column_cm.C_SHAFT_E_PIER;
}
if (Array.isArray(S.beams)) {
  for (const b of S.beams) {
    if (b.id !== "B_Y_EDGE_INVERTED") continue;
    b.x = +((st.door_to_magazie?.x ?? 534.3) + (st.door_to_magazie?.dx ?? 32.6)).toFixed(1);
    b.dx = +(pitX1 - b.x).toFixed(1);
    b.y = +(st.door_to_magazie?.y ?? 495.7).toFixed(1);
    b.supports = ["C_CASA_SCARA", "put_reten_e"];
    b.note =
      "A1.194: grindă întoarsă ușă→put_reten_e (fără pier în clear scară)";
  }
}
if (Array.isArray(S.open_items)) {
  S.open_items = S.open_items.filter((x) => !/pier_clear/i.test(x));
  S.open_items.push("footing_115_recalc_on_drawn_inward_geometry");
  S.open_items.push("shaft_east_wall_15_7_FE_ok");
}

fs.writeFileSync(a1Path, JSON.stringify(a1, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      ok: true,
      pit_x1: pitX1,
      wall_e_th: wallETh,
      doors: bm.doors.map((d) => d.id),
      north_eccentric: true,
      basement_beam_h: S.levels_cm?.basement_beam_h_cm,
    },
    null,
    2
  )
);
