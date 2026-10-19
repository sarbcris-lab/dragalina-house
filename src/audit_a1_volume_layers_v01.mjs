/**
 * Inventar layere / segmente volume_a1 — verificare completitudine 3D.
 * Rulează: node src/audit_a1_volume_layers_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const vol = JSON.parse(fs.readFileSync(path.join(root, "viewer/data/volume_a1.json"), "utf8"));
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));

const meshes = vol.meshes || [];
const byLayer = {};
const byGroup = {};
const byPrefix = {};
for (const m of meshes) {
  const sl = m.site_layer || "(none)";
  const g = m.group || "(none)";
  byLayer[sl] = (byLayer[sl] || 0) + 1;
  byGroup[g] = (byGroup[g] || 0) + 1;
  const pref = (m.id || "").split("_").slice(0, 2).join("_");
  byPrefix[pref] = (byPrefix[pref] || 0) + 1;
}

const wallIdsA1 = new Set((a1.walls_cm || []).map((w) => w.id));
const wallIds3d = new Set();
for (const m of meshes) {
  const mm = /^zid_([^_]+)_/.exec(m.id || "");
  if (mm) wallIds3d.add(mm[1]);
  // nord_heated etc.
  const mm2 = /^zid_((?:nord|est|vest|sud)[^_]*)_/.exec(m.id || "");
  if (mm2) wallIds3d.add(mm2[1]);
}
const missingWalls = [...wallIdsA1].filter((id) => {
  return !meshes.some((m) => (m.id || "").includes(`zid_${id}_`) || (m.id || "").includes(`zid_${id}`));
});

const openingIdsA1 = (a1.openings_cm || []).map((o) => o.id);
const openings3d = openingIdsA1.map((id) => ({
  id,
  meshes: meshes.filter((m) => (m.id || "").includes(`gol_${id}`)).length,
}));

const removedWalls = new Set(
  (a1.walls_cm || []).filter((w) => w.removed).map((w) => w.id)
);
const missingActive = missingWalls.filter((id) => !removedWalls.has(id));

const checks = {
  amenajare_source: vol.meta?.amenajare_source || null,
  has_anvelopa: (byLayer.anvelopa || 0) > 0,
  has_umplutura: (byLayer.umplutura || 0) > 0,
  has_col_facade: meshes.some((m) => (m.id || "").startsWith("col_facade_")),
  has_roof_timber: meshes.some((m) => /acoperis_caprior|acoperis_coama/.test(m.id || "")),
  has_structura: (byLayer.structura || 0) > 0,
  has_goluri: (byLayer.goluri || 0) > 0,
  has_mobilier: (byLayer.mobilier || 0) > 0,
  untagged_pct: Math.round((100 * (byLayer["(none)"] || 0)) / meshes.length),
  walls_missing_active: missingActive.length,
};

const out = {
  meta: {
    id: "s1_a1_volume_layers_audit_v01",
    generated: new Date().toISOString(),
    volume_meta: vol.meta || null,
    mesh_count: meshes.length,
  },
  by_site_layer: byLayer,
  by_group: byGroup,
  walls_a1: wallIdsA1.size,
  walls_missing_in_3d: missingWalls,
  walls_missing_active: missingActive,
  openings: openings3d,
  checks,
  top_prefixes: Object.entries(byPrefix)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25),
};

const md = `# S1 A1 — Audit layere / segmente 3D

**Generat:** ${out.meta.generated.slice(0, 16)}  
**Mesh-uri:** ${meshes.length}

## site_layer

| Layer | Count |
|-------|------:|
${Object.entries(byLayer)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join("\n")}

## group

| Group | Count |
|-------|------:|
${Object.entries(byGroup)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join("\n")}

## Checks

| Check | OK |
|-------|:--:|
| anvelopa | **${checks.has_anvelopa}** |
| umplutura | **${checks.has_umplutura}** |
| col_facade | **${checks.has_col_facade}** |
| structură | **${checks.has_structura}** |
| goluri | **${checks.has_goluri}** |
| mobilier | **${checks.has_mobilier}** |
| acoperiș lemn | **${checks.has_roof_timber}** |
| % fără site_layer | ${checks.untagged_pct}% |

## Pereți A1 activi lipsă în 3D

${missingActive.length ? missingActive.map((w) => `- \`${w}\``).join("\n") : "_niciunul_"}

_(removed în date: ${[...removedWalls].join(", ") || "—"})_

## Goluri (active)

| ID | mesh-uri |
|----|--------:|
${openings3d
  .filter((o) => {
    const src = (a1.openings_cm || []).find((x) => x.id === o.id);
    return !src?.removed;
  })
  .map((o) => `| ${o.id} | ${o.meshes} |`)
  .join("\n")}

JSON: \`s1_a1_volume_layers_audit_v01.json\`
`;

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_volume_layers_audit_v01.json"), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_volume_layers_audit_v01.md"), md);
console.log(JSON.stringify({ ok: true, meshes: meshes.length, checks, missingWalls: missingWalls.length }, null, 2));
