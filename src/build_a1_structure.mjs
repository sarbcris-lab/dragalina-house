/**
 * S1 — schemă cadre pe A1 (geometrie studiu, neconstruibil).
 * Citește a1_architecture → scrie structure_a1_study_cm (stâlpi/grinzi/FG pe cutie+puț).
 * Rulează: node src/build_a1_structure.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1Path = path.join(root, "data/building/a1_architecture.json");
const a1 = JSON.parse(fs.readFileSync(a1Path, "utf8"));

const colsIn = a1.columns_cm || [];
const box = a1.basement_cm?.structure_box;
const pit = a1.basement_cm?.stair?.pit;
if (!box) throw new Error("lipsește basement_cm.structure_box");
if (!colsIn.length) throw new Error("lipsește columns_cm");

const byId = Object.fromEntries(colsIn.map((c) => [c.id, c]));

function must(...ids) {
  for (const id of ids) {
    if (!byId[id]) throw new Error(`stâlp lipsă: ${id}`);
  }
}

function beamAlongX(id, colIds, yOverride, dyOverride, levels, note, extra = {}) {
  must(...colIds);
  const cs = colIds.map((id) => byId[id]);
  const x0 = Math.min(...cs.map((c) => c.x));
  const x1 = Math.max(...cs.map((c) => c.x + c.dx));
  const y = yOverride ?? Math.min(...cs.map((c) => c.y));
  const dy = dyOverride ?? Math.max(...cs.map((c) => c.dy));
  return {
    id,
    x: x0,
    y,
    dx: x1 - x0,
    dy,
    levels,
    supports: colIds,
    note,
    ...extra,
  };
}

function beamAlongY(id, colIds, xOverride, dxOverride, levels, note, extra = {}) {
  must(...colIds);
  const cs = colIds.map((id) => byId[id]);
  const y0 = Math.min(...cs.map((c) => c.y));
  const y1 = Math.max(...cs.map((c) => c.y + c.dy));
  const x = xOverride ?? Math.min(...cs.map((c) => c.x));
  const dx = dxOverride ?? Math.max(...cs.map((c) => c.dx));
  return {
    id,
    x,
    y: y0,
    dx,
    dy: y1 - y0,
    levels,
    supports: colIds,
    note,
    ...extra,
  };
}

/** Stâlpi de CADRU — fără C_E_LAMELE (pilastru fațadă ARH, nu reazem). */
const NON_STRUCTURAL_IDS = new Set(["C_E_LAMELE"]);
const columns = colsIn
  .filter((c) => !NON_STRUCTURAL_IDS.has(c.id))
  .map((c) => {
    const onHeated =
      c.x + c.dx > box.x0 - 1 &&
      c.x < box.x1 + 1 &&
      c.y + c.dy > box.y0 - 1 &&
      c.y < box.y1 + 1;
    const cold = c.thermal === "cold_stair";
    let levels;
    if (cold) levels = ["P", "E"];
    else if (onHeated || ["C_NE", "C_E_PAL"].includes(c.id)) levels = ["S", "P", "E"];
    else levels = ["S", "P", "E"];
    return {
      id: c.id,
      x: c.x,
      y: c.y,
      dx: c.dx,
      dy: c.dy,
      section_cm: c.section_cm || `${c.dx}×${c.dy}`,
      levels,
      continuous_through_floor: true,
      status: c.status || "PROVIZORIU",
      on_heated_box: onHeated,
      thermal: c.thermal || null,
      note: c.note || "din columns_cm A1 — secțiuni S1/FE",
    };
  });

const SPE = ["S", "P", "E"];
const PE = ["P", "E"];

const beams = [
  // —— Inel / axe pe cutia încălzită
  beamAlongX("B_N", ["C_NW", "C_N_MID"], byId.C_NW.y, byId.C_NW.dy, SPE, "centură N pe cutie (C_NW–C_N_MID)"),
  beamAlongX(
    "B_N_TO_NE",
    ["C_N_MID", "C_NE"],
    byId.C_N_MID.y,
    byId.C_N_MID.dy,
    PE,
    "centură N est → C_NE (banda scară / fațadă E)"
  ),
  beamAlongY("B_W", ["C_NW", "C_W_MID", "C_W_DORM"], byId.C_NW.x, byId.C_NW.dx, SPE, "centură V pe cutie"),
  beamAlongY(
    "B_X_MID",
    ["C_N_MID", "C_S_DORM_E", "C_S_INTRARE_W"],
    byId.C_N_MID.x,
    byId.C_N_MID.dx,
    SPE,
    "axă mid N–S (C_N_MID–C_S_DORM_E–C_S_INTRARE_W)"
  ),
  beamAlongY(
    "B_CASA_SCARA",
    ["C_CASA_SCARA", "C_S_INTRARE_E"],
    byId.C_CASA_SCARA.x,
    byId.C_CASA_SCARA.dx,
    SPE,
    "separator est cutie (= A6) C_CASA_SCARA→intrare E"
  ),
  beamAlongX("B_Y645", ["C_W_DORM", "C_S_DORM_E"], byId.C_W_DORM.y, byId.C_W_DORM.dy, SPE, "sud dorm pe cutie"),
  beamAlongX(
    "B_Y820",
    ["C_S_INTRARE_W", "C_S_INTRARE_E"],
    byId.C_S_INTRARE_W.y,
    byId.C_S_INTRARE_W.dy,
    SPE,
    "sud intrare pe cutie (Y≈820)"
  ),
  beamAlongX(
    "B_Y410",
    ["C_W_MID", "C_E_PAL"],
    byId.C_W_MID.y,
    byId.C_W_MID.dy,
    PE,
    "legătură mid W→E_PAL (peste cutie + scară)"
  ),
  // —— Fațadă E / scară rece — FĂRĂ C_E_LAMELE (nu e stâlp de cadru)
  beamAlongY("B_E", ["C_NE", "C_E_PAL"], byId.C_NE.x, byId.C_NE.dx, PE, "centură E fațadă (C_NE–C_E_PAL)"),
];

// Închidere SE: C_E_PAL ↓ + C_S_INTRARE_E → (colț pe grinzi, fără pier lamele)
{
  const ePal = byId.C_E_PAL;
  const sInE = byId.C_S_INTRARE_E;
  const y0 = ePal.y + ePal.dy;
  const y1 = sInE.y + sInE.dy;
  beams.push({
    id: "B_E_S",
    x: ePal.x,
    y: y0,
    dx: ePal.dx,
    dy: y1 - y0,
    levels: PE,
    supports: ["C_E_PAL", "C_S_INTRARE_E"],
    note: "centură E sud scară — reazeme C_E_PAL + nod SE cu B_S_SE (fără C_E_LAMELE)",
  });
  const x0 = sInE.x + sInE.dx;
  const x1 = ePal.x + ePal.dx;
  beams.push({
    id: "B_S_SE",
    x: x0,
    y: sInE.y,
    dx: x1 - x0,
    dy: sInE.dy,
    levels: PE,
    supports: ["C_S_INTRARE_E", "C_E_PAL"],
    note: "închidere SE pe C_S_INTRARE_E↔C_E_PAL — C_E_LAMELE = doar ARH/fațadă",
  });
}

// —— Grindă întoarsă pe puț (S-only): reazem E = put_reten_e, FĂRĂ pier în clear scară (A1.194)
const door = a1.basement_cm?.stair?.door_to_magazie;
if (pit && door) {
  const invX0 = (door.x ?? box.x1) + (door.dx ?? 32.6);
  const invX1 = pit.x1; // față V a put_reten_e
  const invY = +(door.y ?? 495.7).toFixed(1);
  beams.push({
    id: "B_Y_EDGE_INVERTED",
    x: +invX0.toFixed(1),
    y: invY,
    dx: +(invX1 - invX0).toFixed(1),
    dy: 25,
    z0_cm: -30,
    z1_cm: -5,
    levels: ["S_inverted"],
    supports: ["C_CASA_SCARA", "put_reten_e"],
    note: "A1.194: grindă întoarsă ușă→put_reten_e (fără C_SHAFT_E_PIER — clear scară 100)",
  });
}

const structure = {
  status: "S1_STUDIU_GEOMETRIC",
  system: "cadre_beton_armat",
  declared_buildable: false,
  generated: new Date().toISOString(),
  source: {
    architecture: "data/building/a1_architecture.json",
    columns: "columns_cm (fără non-structurale)",
    envelope: "basement_cm.structure_box + stair.pit",
  },
  non_structural_from_columns_cm: [
    {
      id: "C_E_LAMELE",
      reason: "pilastru/fațadă scară rece (lamele) — nu reazem de cadru; rămâne în ARH",
      section_cm: byId.C_E_LAMELE
        ? `${byId.C_E_LAMELE.dx}×${byId.C_E_LAMELE.dy}`
        : "20×40",
    },
  ],
  note:
    "Geometrie pe axe A1 — nu capacitate. C_E_LAMELE exclus din cadru. FRAME V47 = STALE.",
  structure_box_cm: { ...box },
  pit_cm: pit
    ? {
        x0: pit.x0,
        x1: pit.x1,
        y0: pit.y0,
        y1: pit.y1,
        walls: "N+E retenție A11; V=ușă pe retenție E cutie; S deschis",
      }
    : null,
  column_section_hypothesis_cm: {
    through_wall_min_cm: 30,
    status: "PROVIZORIU_P100_min30",
    note: "P100≥30; along 40 = ipoteză până FE",
  },
  foundations_study_cm: (() => {
    const prev = a1.structure_a1_study_cm?.foundations_study_cm || {};
    const B =
      prev.perimeter_strip_width_cm ??
      200; /* A1.200: minim pe geometrie inward desenată */
    return {
      ...prev,
      pad_side_cm: prev.pad_side_cm ?? 80,
      strip_width_cm: prev.strip_width_cm ?? 60,
      east_eccentric_inward: true,
      north_eccentric_inward: true,
      south_eccentric_inward: true,
      perimeter_strip_width_cm: B,
      perimeter_strip_drawn: prev.perimeter_strip_drawn || "inward_toe0_heel_under_slab",
      perimeter_strip_calc_status:
        prev.perimeter_strip_calc_status || "VALIDATED_ON_DRAWN_GEOMETRY_ORDIN",
      perimeter_strip_calc_ref:
        prev.perimeter_strip_calc_ref || "outputs/reports/s1_a1_footing_drawn_v01",
      status: prev.status || "ipoteză_studiu_A1_200",
      note:
        prev.note ||
        `A1.200: talpă perimetru B=${B} cm inward (toe0, heel sub placă) — vezi footing_drawn_v01`,
    };
  })(),
  levels_cm: (() => {
    const lv = a1.structure_a1_study_cm?.levels_cm?.clear_under_beam_cm
      ? { ...a1.structure_a1_study_cm.levels_cm }
      : {
          clear_min_cm: 255,
          clear_under_beam_cm: 255,
          slab_th_hypothesis: 15,
          beam_h_total_including_slab_zone: 40,
          drop_below_soffit_cm: 25,
          floor_buildup_below_ff: 12,
          ff_parter: 48,
          ff_to_ff_cm: 255 + 25 + 15 + 12,
          ff_etaj: 48 + 255 + 25 + 15 + 12,
          beam_soffit_over_parter: 48 + 255,
          slab_soffit_etaj: 48 + 255 + 25,
          slab_top_etaj: 48 + 255 + 25 + 15,
          basement_ff_cm: -250,
          basement_soffit_cm: -30,
          basement_beam_h_cm: 40,
          note: "A1.180 clear≥255 HARD — rulează clear255 dacă cotele lipsesc",
        };
    // A1.194: grinzi S flush în placă → clear beci 220 sub grindă
    lv.basement_beam_h_cm = 15;
    lv.basement_clear_under_beam_cm = 220;
    lv.basement_beam_note =
      "A1.194: S flush în placă (h=15); clear sub grindă = clear sub placă 220";
    return lv;
  })(),
  clear_lock: {
    min_cm: 255,
    under_beam: true,
    under_slab: true,
    revoked_241: true,
  },
  columns,
  beams,
  foundation_pad_adopt_cm: (() => {
    const prev = { ...(a1.structure_a1_study_cm?.foundation_pad_adopt_cm || {}) };
    delete prev.C_SHAFT_E_PIER;
    return Object.keys(prev).length ? prev : undefined;
  })(),
  open_items: [
    "FE numeric pe schema fără C_E_LAMELE (span B_E_S / B_S_SE)",
    "geo_131 Rc parcelă",
    "riser_beci_17_22 vs brief 16",
    "shaft_east_wall_15_7_FE_ok",
    "footing_B200_FE_confirm_mu_water",
  ],
};

if (structure.foundation_pad_adopt_cm) {
  structure.foundations_study_cm.pad_by_column_cm = { ...structure.foundation_pad_adopt_cm };
}
a1.structure_a1_study_cm = structure;
a1.basement_cm = a1.basement_cm || {};
a1.basement_cm.s1_handoff = {
  ...(a1.basement_cm.s1_handoff || {}),
  structure_study: "structure_a1_study_cm",
  frame_mesh: "A1.174: cadre pe axe A1 (build_a1_structure) — FRAME STALE",
  first_task: "remesh BA pe envelope A1 — DONE geometric; FE urmează",
};

fs.writeFileSync(a1Path, JSON.stringify(a1, null, 2) + "\n");
fs.writeFileSync(
  path.join(root, "data/building/a1_structure_study.json"),
  JSON.stringify(structure, null, 2) + "\n"
);
fs.writeFileSync(
  path.join(root, "outputs/reports/s1_structure_a1_geometry_v01.md"),
  `# S1 — geometrie cadre pe A1 (v01)

**Status:** studiu geometric · **neconstruibil** · ${structure.generated.slice(0, 10)}  
**Sursă:** \`a1_architecture.columns_cm\` + cutie/puț  
**Fișier:** \`structure_a1_study_cm\` / \`data/building/a1_structure_study.json\`

## Cutie
X **${box.x0}–${box.x1}** × Y **${box.y0}–${box.y1}**

## Stâlpi (${columns.length})
| id | x | y | dx×dy | levels | pe cutie |
|----|---|---|-------|--------|----------|
${columns
  .map(
    (c) =>
      `| ${c.id} | ${c.x} | ${c.y} | ${c.dx}×${c.dy} | ${c.levels.join("+")} | ${c.on_heated_box ? "da" : "nu"} |`
  )
  .join("\n")}

## Grinzi (${beams.length})
| id | supports | levels | note |
|----|----------|--------|------|
${beams
  .map((b) => `| ${b.id} | ${b.supports.join(", ")} | ${(b.levels || []).join("+")} | ${b.note} |`)
  .join("\n")}

## Deschis
${structure.open_items.map((x) => `- ${x}`).join("\n")}

## Următor
FE pe această schemă (nu pe FRAME V47). Viewer: \`npm run volume:a1\` → Structură.
`
);

console.log(
  JSON.stringify(
    {
      ok: true,
      columns: columns.length,
      beams: beams.length,
      files: [
        "data/building/a1_architecture.json",
        "data/building/a1_structure_study.json",
        "outputs/reports/s1_structure_a1_geometry_v01.md",
      ],
    },
    null,
    2
  )
);
