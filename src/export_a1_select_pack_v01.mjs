/**
 * Pachet selecție/cote pentru viewer V3.
 * node src/export_a1_select_pack_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const lv = a1.structure_a1_study_cm?.levels_cm || a1.heights_cm || {};
const stair = a1.stair_cm || {};
const bm = a1.basement_cm || {};

const openings = (a1.openings_cm || []).map((o) => {
  const gol =
    o.construction_clear_cm ??
    o.gol_cm ??
    (typeof o.dy === "number" && o.dy >= o.dx ? o.dy : o.dx);
  const passage = o.passage_clear_cm ?? o.passage_cm ?? null;
  const frame = o.frame_cm ?? o.frame?.thickness_cm ?? null;
  return {
    id: o.id,
    levels: o.levels || [],
    x: o.x,
    y: o.y,
    dx: o.dx,
    dy: o.dy,
    gol_cm: gol,
    passage_cm: passage,
    frame_cm: frame,
    mismatch: passage != null && gol != null && Math.abs(gol - passage) >= 2,
    note: o.note || null,
  };
});

const warnings = [
  {
    id: "stair_clear_at_pier",
    sev: "MED",
    text: `Scară P–E: clear A6→E ${stair.width_clear_cm ?? "?"} cm; la C_E_LAMELE ${stair.width_clear_at_pier_cm ?? "?"} cm (nu eticheta doar 100).`,
  },
  {
    id: "intrare_etaj_passage",
    sev: "MED",
    text: "intrare_etaj: gol construcție 100 cm · trecere liberă 88 cm (toc+mâner) — nu declara ușă 100.",
  },
  {
    id: "util_etaj_reserve",
    sev: "LOW",
    text: `Util etaj ${a1.areas?.useful_etaj_m2} m² — rezervă peste 37 ≈ ${(a1.areas?.useful_etaj_m2 - 37).toFixed(3)} m² (ghene sensibile).`,
  },
  {
    id: "basement_clear",
    sev: "INFO",
    text: `Beci: clear sub placă/grindă S ${lv.basement_clear_under_beam_cm ?? 220} cm (A1.194 flush).`,
  },
  {
    id: "footing_calc_mismatch",
    sev: "INFO",
    text: "Talpă 115 inward desen ≠ calc heel+umplutură — rundă fundații deschisă.",
  },
  {
    id: "site_hotar_vs_gard",
    sev: "INFO",
    text: "Hotar CF ≠ gard construit (limit_* pe E/N = zid casă; gard V+Cloșca+Dragalina S).",
  },
  {
    id: "site_access_water",
    sev: "INFO",
    text: "Acces: auto Cloșca · pietonal Dragalina→alee→scări→beci. Apă curte/put_reten = REZERVĂ (nu hidraulic).",
  },
];

const pack = {
  meta: {
    id: "a1_select_v01",
    generated: new Date().toISOString(),
    source: "data/building/a1_architecture.json",
  },
  levels_cm: {
    clear_under_beam: lv.clear_under_beam_cm ?? 255,
    clear_under_slab: lv.clear_under_slab_cm ?? 280,
    clear_to_false_ceiling: lv.clear_to_false_ceiling_cm ?? 274,
    ff_to_ff: lv.ff_to_ff_cm ?? 307,
    beam_drop: lv.drop_below_soffit_cm ?? 25,
    basement_clear: lv.basement_clear_under_beam_cm ?? bm.clear_target_cm ?? 220,
    ff_parter: lv.ff_parter ?? 48,
    ff_etaj: lv.ff_etaj ?? 355,
  },
  areas: {
    useful_parter_m2: a1.areas?.useful_parter_m2,
    useful_etaj_m2: a1.areas?.useful_etaj_m2,
    target_m2: a1.areas?.useful_target_m2 ?? 37,
    status: a1.areas?.useful_status,
  },
  rooms: (a1.areas?.useful_rooms_m2 || []).map((r) => ({
    id: r.id,
    label: r.label,
    level: r.level,
    level_name: r.level_name,
    net_m2: r.net_m2,
    gross_m2: r.gross_m2,
    column_protrusion_m2: r.column_protrusion_m2,
    dims_cm: r.dims_cm,
  })),
  basement_rooms: (bm.rooms || []).map((r) => ({
    id: r.id,
    label: r.label,
    level: -1,
    level_name: "subsol",
    net_m2: r.area_m2,
    dims_cm: { x: r.x, y: r.y, dx: r.dx, dy: r.dy },
  })),
  openings,
  columns: (a1.columns_cm || []).map((c) => ({
    id: c.id,
    x: c.x,
    y: c.y,
    dx: c.dx,
    dy: c.dy,
    section_cm: c.section_cm || `${c.dx}×${c.dy}`,
    protrusion_cm: c.protrusion_into_room_cm ?? null,
    thermal: c.thermal || null,
    note: c.note || null,
  })),
  warnings,
  site: {
    plan_svg: "outputs/plans/a1_plan_situatie.svg",
    plan_note: "outputs/reports/s1_a1_site_plan_v01.md",
    access: "auto Cloșca · pietonal Dragalina → alee → scări → beci",
    water: "pantă curte + put_reten — REZERVĂ",
    fence_vs_boundary: "hotar CF ≠ gard; limit_* = zid casă E/N",
  },
};

const outJson = path.join(root, "viewer/data/a1_select_v01.json");
fs.writeFileSync(outJson, JSON.stringify(pack, null, 2));
fs.writeFileSync(
  path.join(root, "outputs/reports/s1_a1_select_pack_v01.md"),
  `# S1 A1 — Select pack (viewer V3 / V4)

**Fișier:** \`viewer/data/a1_select_v01.json\`  
**Generat:** ${pack.meta.generated}

## Util
- Parter **${pack.areas.useful_parter_m2}** m² · Etaj **${pack.areas.useful_etaj_m2}** m² (țintă 37)

## Gol ≠ trecere (mismatch)
${openings
  .filter((o) => o.mismatch)
  .map((o) => `- **${o.id}**: gol ${o.gol_cm} · trecere ${o.passage_cm}`)
  .join("\n") || "_niciun mismatch ≥2 cm_"}

## Sit (A1.198)
- ${pack.site.access}
- Apă: ${pack.site.water}
- ${pack.site.fence_vs_boundary}
- Plan: \`${pack.site.plan_svg}\`

## Avertismente
${warnings.map((w) => `- [${w.sev}] ${w.text}`).join("\n")}
`
);
console.log(JSON.stringify({ ok: true, openings: openings.length, rooms: pack.rooms.length, outJson }, null, 2));
