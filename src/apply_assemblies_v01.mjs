/**
 * Injectează assemblies_v01 în study JSON + mapează catalog_id pe walls_cm.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}
function write(rel, obj) {
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + "\n");
}

const catalog = read("data/building/assemblies_v01.json");
const byId = catalog.by_id;
const wallMap = catalog.wall_map;

function layersSum(layers) {
  return (layers || []).reduce((s, L) => s + (L.th_mm || 0), 0);
}

function buildConstructionAssemblies() {
  const A1 = byId.A1;
  const A2 = byId.A2;
  return {
    status: "CONFIRMAT_2026-10-15 — assemblies_v01",
    catalog_ref: "data/building/assemblies_v01.json",
    decision_ref: "decisions/assemblies_catalog_v01.md",
    catalog: byId,
    exterior_wall_heated: {
      id: "A1",
      alias: "EB20_Akustik_200_ISOVER_FASSADE_80",
      applies_to: "P_E_heated_plaster_N",
      products: {
        brick: "EB20 Akustik 200 mm",
        insulation: "ISOVER FASSADE 80 mm",
        etics: "sistem ETICS pe vată — de confirmat furnizor"
      },
      structure_role: "beton_portant; EB20 = umplutură",
      layers_interior_to_exterior_mm: A1.layers_interior_to_exterior_mm,
      sum_layers_mm: layersSum(A1.layers_interior_to_exterior_mm),
      thickness_nominal_mm: 299,
      thickness_finished_max_mm: 300,
      thickness_finished_cm: 30,
      etics_outside_brick_mm: 92,
      etics_outside_brick_cm: 9.2,
      brick_mm: 200,
      validation_status: "catalog_locked_furnizor_de_confirmat",
      note: "A1 standard tencuială (N). A2 klinker = 312 mm (vată 80)."
    },
    exterior_wall_klinker: {
      id: "A2",
      layers_interior_to_exterior_mm: A2.layers_interior_to_exterior_mm,
      sum_layers_mm: layersSum(A2.layers_interior_to_exterior_mm),
      thickness_finished_mm: 312,
      thickness_finished_cm: 31.2,
      delta_vs_A1_mm: 13,
      note: "Vată 80 neschimbată; iese în afară — POT/util de recalculat"
    },
    facade_cladding: {
      status: "LOCKED_2026-10-15",
      nord: "A1_tencuiala",
      est_sud_vest: "A2_klinker",
      scara_rece_ext: "A4_klinker",
      separator_scara: "A6_300",
      pot_sensitivity: {
        A2_delta_mm_per_face: 13,
        note: "A2 +13 mm/față față de A1; envelope/util pending recalc"
      }
    },
    exterior_wall: {
      alias_of: "exterior_wall_heated",
      thickness_finished_cm: 30,
      note: "A1 standard; vezi exterior_wall_klinker pentru A2"
    },
    stair_volume_cold: {
      catalog_id: "A4",
      heated: false,
      thermosystem: false,
      thickness_finished_mm: 148,
      note: byId.A4.name
    },
    parapet_no_thermosystem: {
      catalog_id: "A5",
      thickness_finished_mm: 116
    },
    house_stair_separator: {
      catalog_id: "A6",
      thickness_finished_mm: 300
    },
    interior_wall_fono: {
      catalog_id: "A7",
      thickness_finished_mm: 125,
      not: "BCA"
    },
    interior_wall_bath: {
      catalog_id: "A8",
      thickness_finished_mm: 150
    },
    interior_wall_pocket: {
      catalog_id: "A9",
      current_cm: 12.5,
      tv_band_cm: 15
    },
    floor_between_units: {
      catalog_id: "B1",
      ff_to_ff_cm: 288,
      buildup: {
        note: "B1 locked catalog",
        clear_to_false_ceiling_cm: 255,
        false_ceiling_cm: 6,
        structural_slab_cm: 15,
        insulation_under_screed_cm: 3,
        heating_pipes_zone_cm: 2,
        screed_above_pipes_cm: 5,
        finish_complete_cm: 2,
        floor_buildup_below_ff_cm: 12,
        ff_to_ff_cm: 288
      },
      floating_screed: true,
      status: "catalog_locked"
    },
    envelope_zones: {
      heated_plaster_N: "A1",
      heated_klinker_ESV: "A2",
      cold_stair: "A4",
      house_stair_separator: "A6"
    }
  };
}

function mapWall(w) {
  const m = wallMap[w.id];
  if (!m) return w;
  if (typeof m === "string") {
    const assy = byId[m];
    return {
      ...w,
      catalog_id: m,
      assembly: m,
      thickness_finished_mm: assy?.thickness_finished_mm ?? w.thickness_finished_mm,
      note: [w.note, `catalog ${m}`].filter(Boolean).join(" · ")
    };
  }
  // nord split noted on wall
  return {
    ...w,
    catalog_id_heated: m.heated_x0_565,
    catalog_id_cold: m.cold_x565_680,
    assembly: "A1+A4_split",
    note: [w.note, `heated ${m.heated_x0_565} / cold ${m.cold_x565_680}`].filter(Boolean).join(" · ")
  };
}

function patchStudy(rel) {
  const data = read(rel);
  data.construction_assemblies = buildConstructionAssemblies();
  data.assemblies_catalog_ref = "data/building/assemblies_v01.json";
  data.meta = {
    ...data.meta,
    assemblies_v01: "CONFIRMAT_2026-10-15",
    rev_note_assemblies:
      "assemblies_v01: A1/A6≈300; A2=312 klinker vată80; A7 fono125; A4 scară klinker; A8 baie≈150. Envelope A2 Δ pending recalc."
  };
  data.wall_ext_cm = 30;
  data.wall_ext_note =
    "30 cm = A1 standard. A2 klinker = 31.2 cm (iese afară). A6 separator = 30 cm.";
  data.wall_int_cm = 12.5;
  data.wall_int_note = "12.5 cm = A7 fono. A8 baie = 15 cm.";
  data.walls_cm = (data.walls_cm || []).map(mapWall);
  write(rel, data);
  console.log("patched", rel);
}

patchStudy("data/building/v47_a1_study.json");
patchStudy("data/building/v47_a1_frame_study.json");
console.log("ok assemblies_v01 applied");
